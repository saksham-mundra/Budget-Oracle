import { describe, it, expect } from 'vitest';
import { verifyPurchaseRules } from '../src/lib/purchase';

describe('Purchase Safeguards (lib/purchase.ts)', () => {
  it('blocks purchases exceeding the $0.08 per-purchase cap', () => {
    const check = verifyPurchaseRules(0.09, 0.0, 1.0);
    expect(check.approved).toBe(false);
    expect(check.reason).toContain('per-purchase cap');
  });

  it('blocks purchases that would violate the 10% reserve', () => {
    // Budget $1.00, Reserve $0.10. Max allowed spend = $0.90.
    // If spent is $0.86 and vendor costs $0.05, total would be $0.91 -> BLOCKED
    const check = verifyPurchaseRules(0.05, 0.86, 1.0);
    expect(check.approved).toBe(false);
    expect(check.reason).toContain('reserve');
  });

  it('approves purchases within caps and reserve bounds', () => {
    const check = verifyPurchaseRules(0.04, 0.20, 1.0);
    expect(check.approved).toBe(true);
  });
});
