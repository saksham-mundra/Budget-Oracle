import { describe, it, expect } from 'vitest';
import {
  buildVerdictLine,
  validateReportText,
  buildWriterPrompt,
} from '../src/lib/report';
import { AgentLogEntry } from '../src/lib/agent';

describe('Report Engine (lib/report.ts)', () => {
  it('builds verdict line strictly from code', () => {
    expect(buildVerdictLine(0.642)).toBe('Verdict: 64.2% YES.');
    expect(buildVerdictLine(0.500)).toBe('Verdict: 50.0% YES.');
    expect(buildVerdictLine(0.1234)).toBe('Verdict: 12.3% YES.');
  });

  it('validates and accepts text with no percentages', () => {
    const text = 'The Court Filings Archive indicates substantial procedural delays in the bridge repair tender.';
    const result = validateReportText(text, 0.45);
    expect(result.isValid).toBe(true);
    expect(result.note).toBeUndefined();
  });

  it('validates and accepts text mentioning the matching verdict percentage', () => {
    const text = 'Based on the evidence, the calculated verdict of 64.2% reflects multiple filings.';
    const result = validateReportText(text, 0.642);
    expect(result.isValid).toBe(true);
  });

  it('detects and discards text containing conflicting percentage numbers', () => {
    // Agent probability is 0.42 (42%), but writer hallucinates "78%"
    const conflictingText =
      'Analysis suggests a 78% probability of project completion by year end.';
    const result = validateReportText(conflictingText, 0.42);

    expect(result.isValid).toBe(false);
    expect(result.note).toBe('Writer output discarded: it contained a conflicting number.');
  });

  it('builds prompt strictly withholding permission to alter probability', () => {
    const dummyBuys: AgentLogEntry[] = [
      {
        id: 'buy-1',
        type: 'buy',
        vendorId: 'court',
        vendorName: 'Court Filings Archive',
        priceUsd: 0.040,
        delta: -0.9,
        sourceType: 'simulated',
        perCent: 4.5,
      },
    ];

    const prompt = buildWriterPrompt(
      'Will the bridge open?',
      dummyBuys,
      'The next source was not worth its price.'
    );

    expect(prompt.systemInstruction).toContain('NEVER state, estimate, calculate, or alter any probability');
    expect(prompt.userPrompt).toContain('Court Filings Archive');
    expect(prompt.userPrompt).toContain('The next source was not worth its price.');
  });
});
