import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  ReportRequest,
  ReportResponse,
  buildVerdictLine,
  buildWriterPrompt,
  validateReportText,
} from '@/lib/report';

export const runtime = 'nodejs';

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

    const { systemInstruction, userPrompt } = buildWriterPrompt(
      question,
      buys || [],
      stopReason
    );

    const modelName = process.env.GEMMA_MODEL || 'gemma-4-31b-it';
    let rawText = '';

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction,
          maxOutputTokens: tokenCap,
          temperature: 0.2,
        },
      });

      rawText = result.text || '';
    } catch (genError: unknown) {
      console.warn('Gemma 4 generation error, attempting fallback format:', genError);
      // Fallback try with gemma-4-26b-a4b-it or gemini-2.5-flash if user's key tier requires it
      try {
        const ai = new GoogleGenAI({ apiKey });
        const fallbackResult = await ai.models.generateContent({
          model: 'gemma-4-26b-a4b-it',
          contents: `${systemInstruction}\n\n${userPrompt}`,
          config: {
            maxOutputTokens: tokenCap,
          },
        });
        rawText = fallbackResult.text || '';
      } catch (secondError: unknown) {
        const msg = secondError instanceof Error ? secondError.message : 'Unknown generation error';
        return NextResponse.json({
          verdictLine,
          reportText: `Writer service error: ${msg}`,
          status: 'unavailable',
          engineUsed: `Gemma 4 (${modelName})`,
        });
      }
    }

    // Post-generation validation: verify writer did not emit a conflicting probability percentage
    const validation = validateReportText(rawText, finalProbability);

    if (!validation.isValid) {
      const response: ReportResponse = {
        verdictLine,
        reportText: null,
        status: 'discarded',
        discardNote: validation.note || 'Writer output discarded: it contained a conflicting number.',
        engineUsed: `Gemma 4 (${modelName})`,
      };
      return NextResponse.json(response);
    }

    const response: ReportResponse = {
      verdictLine,
      reportText: rawText.trim(),
      status: 'success',
      engineUsed: `Gemma 4 (${modelName})`,
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
