import { NextResponse } from 'next/server';
import { getJevStatus } from '@/lib/jev';

export async function GET() {
  const hasWriterKey = Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GEMMA_API_KEY ||
    process.env.ANTHROPIC_API_KEY
  );

  const writerModel = process.env.GEMMA_MODEL || 'gemma-4-31b-it';
  const jev = getJevStatus();

  return NextResponse.json({
    writer: {
      configured: hasWriterKey,
      model: writerModel,
      label: hasWriterKey ? `Gemma 4 (${writerModel})` : 'Gemma 4 (Key missing in .env.local)',
    },
    jev: {
      mode: jev.mode,
      configured: jev.configured,
      label: jev.label,
    },
    x402: {
      network: 'Ethereum Sepolia Testnet (11155111)',
      configured: true,
      facilitator: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
    },
  });
}
