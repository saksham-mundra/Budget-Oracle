import { AgentLogEntry } from './agent';
import { RouteType } from './router';

export interface ReportRequest {
  question: string;
  route: RouteType;
  tokenCap: number;
  finalProbability: number;
  buys: AgentLogEntry[];
  stopReason: string;
}

export interface ReportResponse {
  verdictLine: string;
  reportText: string | null;
  status: 'success' | 'unavailable' | 'discarded' | 'skipped';
  discardNote?: string;
  engineUsed: string;
}

/**
 * The verdict line is built strictly by code, never by the AI writer.
 */
export function buildVerdictLine(finalProbability: number): string {
  const pct = (finalProbability * 100).toFixed(1);
  return `Verdict: ${pct}% YES.`;
}

/**
 * Validates that the AI writer has not fabricated or modified the probability percentage.
 * If the writer output contains any percentage differing from the agent's probability,
 * the output is discarded with the specified warning note.
 */
export function validateReportText(
  writerText: string,
  agentProbability: number
): { isValid: boolean; note?: string } {
  const agentPct = Number((agentProbability * 100).toFixed(1));

  // Find all percentage mentions, e.g. "54.2%", "70 %", "80%"
  const percentageRegex = /(\d+(?:\.\d+)?)\s*%/g;
  const matches = [...writerText.matchAll(percentageRegex)];

  for (const match of matches) {
    const foundNum = parseFloat(match[1]);
    // Allow slight rounding tolerance (within 0.2 percentage points) if it references the exact verdict
    if (Math.abs(foundNum - agentPct) > 0.2) {
      return {
        isValid: false,
        note: 'Writer output discarded: it contained a conflicting number.',
      };
    }
  }

  return { isValid: true };
}

/**
 * Builds the prompt for the AI writer (Gemma 4).
 * Crucially, does NOT instruct or invite the writer to calculate or change the probability.
 */
export function buildWriterPrompt(
  question: string,
  buys: AgentLogEntry[],
  stopReason: string
): { systemInstruction: string; userPrompt: string } {
  const systemInstruction = `You are a specialized evidence synthesizer for Budget Oracle.
Your task is to write a concise, objective, cited synthesis report based ONLY on the purchased data sources provided.
MANDATORY RULES:
1. Cite and name each purchased source by name.
2. Clearly explain the rationale for why acquisition stopped based on the provided stop reason.
3. NEVER state, estimate, calculate, or alter any probability or percentage number. The probability is calculated exclusively by deterministic code outside your output. Do not include "%" symbols in your response.
4. Keep the report factual, crisp, and analytical.`;

  const sourcesList =
    buys.length === 0
      ? 'No sources were purchased (all were blocked by spending limits or deemed not worth their price).'
      : buys
          .map((b, idx) => {
            let details = `${idx + 1}. [${b.vendorName}] (Cost: $${b.priceUsd.toFixed(3)}, Shift efficiency: ${b.perCent?.toFixed(2)} pts/cent).`;
            if (b.evidence?.headline) {
              details += `\n   Headline: ${b.evidence.headline}`;
            }
            if (b.evidence?.finding) {
              details += `\n   Scraped Evidence Finding:\n   ${b.evidence.finding}`;
            }
            if (b.evidence?.sources && b.evidence.sources.length > 0) {
              const srcLines = b.evidence.sources
                .slice(0, 3)
                .map((s) => `     - "${s.title}" (${s.publisher || 'Web'}): ${s.snippet} [URL: ${s.url}]`)
                .join('\n');
              details += `\n   Verified Web Citations:\n${srcLines}`;
            }
            return details;
          })
          .join('\n\n');

  const userPrompt = `Research Question: "${question}"

Purchased Evidence Sources:
${sourcesList}

Acquisition Stop Reason: "${stopReason}"

Write the cited intelligence report now following the rules strictly.`;

  return { systemInstruction, userPrompt };
}
