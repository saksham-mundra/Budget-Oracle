import { describe, it, expect } from 'vitest';
import { verifyPurchaseRules } from '../src/lib/purchase';

describe('Purchase Safeguards (lib/purchase.ts)', () => {
  it('blocks purchases exceeding the $0.08 per-purchase cap', () => {
    const check = verifyPurchaseRules(0.09, 0.0, 1.0);
    expect(check.approved).toBe(false);
    expect(check.reason).toContain('per-purchase cap');
  });

  it('blocks purchases that would violate the 1% reserve', () => {
    // Budget $1.00, Reserve $0.01 (1%). Max allowed spend = $0.99.
    // If spent is $0.96 and vendor costs $0.04, total would be $1.00 -> BLOCKED (exceeds $0.99)
    const check = verifyPurchaseRules(0.04, 0.96, 1.0);
    expect(check.approved).toBe(false);
    expect(check.reason).toContain('reserve');
  });

  it('approves purchases within caps and reserve bounds', () => {
    const check = verifyPurchaseRules(0.04, 0.20, 1.0);
    expect(check.approved).toBe(true);
  });
});
