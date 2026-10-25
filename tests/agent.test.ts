import { describe, it, expect } from 'vitest';
import { runAgent } from '../src/lib/agent';
import { perPurchaseCapUsd, reservePct, Vendor } from '../src/lib/vendors';

describe('Spending Agent (lib/agent.ts)', () => {
  const testQuestion = 'Will the Harbor Bridge reopen before December?';

  it('proves spend never exceeds budget minus reserve', () => {
    const budgets = [0.05, 0.10, 0.25, 0.50, 1.00, 2.50];

    for (const budget of budgets) {
      const result = runAgent(testQuestion, budget);
      const maxAllowedSpend = Math.round((budget * (1 - reservePct)) * 1000) / 1000;
      // Core invariant: agent never spends more than (budget - reserve)
      expect(result.spentUsd).toBeLessThanOrEqual(maxAllowedSpend + 0.0001);
      // Unspent is always non-negative
      expect(result.unspentUsd).toBeGreaterThanOrEqual(-0.0001);
    }
  });

  it('proves no single purchase exceeds the per-purchase cap', () => {
    const result = runAgent(testQuestion, 1.00);

    for (const buy of result.buys) {
      expect(buy.priceUsd).toBeLessThanOrEqual(perPurchaseCapUsd);
    }

    // Vault costs $0.090 which is > perPurchaseCapUsd (0.08).
    // Verify vault is never bought and is logged as blocked if attempted.
    const boughtVault = result.buys.some((b) => b.vendorId === 'vault');
    expect(boughtVault).toBe(false);
  });

  it('proves the STOP reason appears when the next source is not worth its price', () => {
    // Custom vendor with very high price and tiny delta, giving perCent < 1.0
    const lowValueVendors: Vendor[] = [
      {
        id: 'expensive_noise',
        name: 'Expensive Noise Feed',
        priceUsd: 0.05,
        delta: 0.0001, // shift is tiny
        description: 'Tiny signal at high price',
        sourceType: 'simulated',
      },
    ];

    const result = runAgent(testQuestion, 0.50, lowValueVendors);
    expect(result.stopReason).toBe('The next source was not worth its price.');
    expect(result.buys.length).toBe(0);
  });

  it('proves a $0.10 budget never buys more than the rules allow', () => {
    const result = runAgent(testQuestion, 0.10);
    // Budget $0.10, reserve is 10% ($0.01), spendable budget is $0.09.
    expect(result.spentUsd).toBeLessThanOrEqual(0.0901);
    expect(result.spentUsd + result.reserveUsd).toBeLessThanOrEqual(0.1001);
    expect(['Budget limit reached (reserve protected).', 'The next source was not worth its price.', 'All sources considered.']).toContain(result.stopReason);
  });

  it('proves deterministic reproducibility for identical inputs', () => {
    const run1 = runAgent(testQuestion, 0.50);
    const run2 = runAgent(testQuestion, 0.50);

    expect(run1.prior).toBe(run2.prior);
    expect(run1.final).toBe(run2.final);
    expect(run1.spentUsd).toBe(run2.spentUsd);
    expect(run1.buys.length).toBe(run2.buys.length);
    expect(run1.stopReason).toBe(run2.stopReason);
  });
});
