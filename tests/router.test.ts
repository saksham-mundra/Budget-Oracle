import { describe, it, expect } from 'vitest';
import { routeQuestion } from '../src/lib/router';

describe('Router (lib/router.ts)', () => {
  it('assigns Route A to simple yes/no question without detailed report', () => {
    // Starts with "Will" (yes/no), 4 words, score = 0.5 (< 4 -> simple)
    const result = routeQuestion('Will the bridge open?');
    expect(result.yesNo).toBe(true);
    expect(result.level).toBe('simple');
    expect(result.route).toBe('A');
    expect(result.tokenCap).toBe(0);
  });

  it('assigns Route A to concise corporate query', () => {
    // Starts with "Is" (yes/no), simple score
    const result = routeQuestion('Is the company solvent?');
    expect(result.yesNo).toBe(true);
    expect(result.level).toBe('simple');
    expect(result.route).toBe('A');
    expect(result.tokenCap).toBe(0);
  });

  it('assigns Route B when detailedReport checkbox is checked on simple query', () => {
    const result = routeQuestion('Will the bridge open?', true);
    expect(result.yesNo).toBe(true);
    expect(result.route).toBe('B');
    expect(result.tokenCap).toBe(400);
  });

  it('assigns Route B when question reaches moderate complexity naturally', () => {
    // Starts with "Can", keywords: "explain", "how", "impact" (3 keywords = 6 points -> moderate)
    const result = routeQuestion('Can regulators explain how new policy impact affects credit markets?');
    expect(result.yesNo).toBe(true);
    expect(result.level).toBe('moderate');
    expect(result.route).toBe('B');
    expect(result.tokenCap).toBe(400);
  });

  it('assigns Route C when question is not a yes/no question (open-ended)', () => {
    // Starts with "What" (not in YES_NO_STARTERS)
    const result = routeQuestion('What caused the supply chain breakdown?');
    expect(result.yesNo).toBe(false);
    expect(result.route).toBe('C');
    expect(result.tokenCap).toBe(1200);
  });

  it('assigns Route C when question is complex or deep with multiple clauses and keywords', () => {
    // Starts with "Does", but contains "analyze", "compare", "impact", "and ... ?" (multi=1), large word count
    const q =
      'Does the macroeconomic environment explain why rates surge, and compare how fiscal policy versus monetary policy impact growth in developing markets?';
    const result = routeQuestion(q);
    expect(result.yesNo).toBe(true);
    expect(['complex', 'deep']).toContain(result.level);
    expect(result.route).toBe('C');
    expect(result.tokenCap).toBe(1200);
  });
});
