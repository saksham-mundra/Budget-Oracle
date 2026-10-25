import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  ReportRequest,
  ReportResponse,
  buildVerdictLine,
  buildWriterPrompt,
  validateReportText,
} from '@/lib/report';
import { scrapeEvidenceForVendor } from '@/lib/scraper';

export async function POST(req: NextRequest) {
  try {
    const body: ReportRequest = await req.json();
    const { question, route, tokenCap, finalProbability, buys, stopReason } = body;

    const verdictLine = buildVerdictLine(finalProbability);

    // Route A: deterministic math only, no writer call
    if (route === 'A' || tokenCap <= 0) {
      const response: ReportResponse = {
        verdictLine,
        reportText: null,
        status: 'skipped',
        engineUsed: 'None (Route A token cap 0 - Jev only)',
      };
      return NextResponse.json(response);
    }

    // Check for API key (Gemma 4 via Google Gen AI / Gemini ecosystem)
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GEMMA_API_KEY ||
      process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const response: ReportResponse = {
        verdictLine,
        reportText: 'Writer unavailable: add your API key to .env.local',
        status: 'unavailable',
        engineUsed: 'Gemma 4 (Key missing in .env.local)',
      };
      return NextResponse.json(response);
    }

    // Enrich bought sources with live scraped web evidence if not already attached
    const enrichedBuys = await Promise.all(
      (buys || []).map(async (b) => {
        if (b.evidence && b.evidence.finding) return b;
        try {
          const scraped = await scrapeEvidenceForVendor(b.vendorId, question);
          return {
            ...b,
            evidence: {
              headline: scraped.headline,
              finding: scraped.finding,
              sources: scraped.sources,
              engineUsed: scraped.engineUsed,
            },
          };
        } catch {
          return b;
        }
      })
    );

    const { systemInstruction, userPrompt } = buildWriterPrompt(
      question,
      enrichedBuys,
      stopReason
    );

    const modelCandidates = [
      process.env.GEMMA_MODEL,
      'gemini-3.8-flash',
      'gemma-4-31b-it',
    ].filter(Boolean) as string[];

    let rawText = '';
    let usedModel = modelCandidates[0] || 'gemini-3.8-flash';

    for (const currentModel of modelCandidates) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const result = await ai.models.generateContent({
          model: currentModel,
          contents: userPrompt,
          config: {
            systemInstruction,
            maxOutputTokens: Math.max(250, tokenCap),
            temperature: 0.2,
          },
        });

        if (result.text && result.text.trim().length > 0) {
          rawText = result.text;
          usedModel = currentModel;
          break;
        }
      } catch (genError: unknown) {
        console.warn(`Generation attempt failed on model ${currentModel}:`, genError);
      }
    }

    if (!rawText) {
      return NextResponse.json({
        verdictLine,
        reportText: 'AI Synthesis currently busy or rate-limited on Google AI Studio. Please retry.',
        status: 'unavailable',
        engineUsed: `Google AI (${usedModel})`,
      });
    }

    // Post-generation validation: verify writer did not emit a conflicting probability percentage
    const validation = validateReportText(rawText, finalProbability);

    if (!validation.isValid) {
      const response: ReportResponse = {
        verdictLine,
        reportText: null,
        status: 'discarded',
        discardNote: validation.note || 'Writer output discarded: it contained a conflicting number.',
        engineUsed: `Google AI (${usedModel})`,
      };
      return NextResponse.json(response);
    }

    const response: ReportResponse = {
      verdictLine,
      reportText: rawText.trim(),
      status: 'success',
      engineUsed: `Google AI (${usedModel})`,
    };
    return NextResponse.json(response);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate report';
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
