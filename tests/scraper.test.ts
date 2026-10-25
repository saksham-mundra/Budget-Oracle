import { describe, it, expect } from 'vitest';
import { scrapeEvidenceForVendor } from '../src/lib/scraper';

describe('Real Web Scraper Engine (lib/scraper.ts)', () => {
  it('scrapes live evidence for a research question', async () => {
    const evidence = await scrapeEvidenceForVendor(
      'wire',
      'Federal Reserve interest rates'
    );

    expect(evidence).toBeDefined();
    expect(evidence.vendorId).toBe('wire');
    expect(typeof evidence.headline).toBe('string');
    expect(evidence.headline.length).toBeGreaterThan(0);
    expect(Array.isArray(evidence.sources)).toBe(true);
    expect(evidence.engineUsed).toContain('Google News RSS');
  }, 10000);

  it('scrapes public litigation/dockets for court vendor', async () => {
    const evidence = await scrapeEvidenceForVendor(
      'court',
      'FTC antitrust regulatory injunction'
    );

    expect(evidence.vendorId).toBe('court');
    expect(typeof evidence.finding).toBe('string');
    expect(evidence.sources).toBeDefined();
  }, 10000);

  it('falls back cleanly on empty or unusual queries without throwing', async () => {
    const evidence = await scrapeEvidenceForVendor('vault', 'xyz123456nonexistentquery789');
    expect(evidence).toBeDefined();
    expect(typeof evidence.headline).toBe('string');
    expect(typeof evidence.finding).toBe('string');
  }, 10000);
});
