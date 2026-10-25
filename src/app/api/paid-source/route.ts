import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Base Sepolia Testnet USDC contract address
export const BASE_SEPOLIA_USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const BASE_SEPOLIA_CHAIN_ID = 84532;

/**
 * Stage 7: Local paid endpoint representing an x402 micropayment-gated data source.
 * Returns HTTP 402 with payment requirements until valid payment is presented.
 */
export async function GET(req: NextRequest) {
  return handlePaidRequest(req);
}

export async function POST(req: NextRequest) {
  return handlePaidRequest(req);
}

async function handlePaidRequest(req: NextRequest) {
  const recipientAddress =
    process.env.X402_RECIPIENT_ADDRESS || '0x0000000000000000000000000000000000000000';
  const facilitatorUrl =
    process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
  const network = (process.env.X402_NETWORK || 'testnet').toLowerCase();

  // Safety constraint: Refuse mainnet
  if (network === 'mainnet' || network === 'base' || network === '8453') {
    return NextResponse.json(
      { error: 'Refusing execution on mainnet. X402_NETWORK must be a testnet.' },
      { status: 400 }
    );
  }

  // Check for payment headers or payload
  const authHeader = req.headers.get('authorization') || '';
  const x402Proof = req.headers.get('x-payment-proof') || req.headers.get('x402-payment-signature');
  const txHashHeader = req.headers.get('x-payment-tx-hash');

  let bodyTxHash: string | undefined;
  try {
    const json = await req.clone().json();
    bodyTxHash = json?.txHash;
  } catch {
    // No json body
  }

  const txHash = txHashHeader || bodyTxHash || (x402Proof?.startsWith('0x') ? x402Proof : undefined);

  // If valid payment proof/transaction is presented:
  if (txHash && /^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return NextResponse.json({
      status: 200,
      paid: true,
      evidence: {
        id: 'rec_base_sepolia_84532_live',
        source: 'Base Sepolia Verified Micro-Archive',
        timestamp: new Date().toISOString(),
        headline: 'Harbor Infrastructure Division Special Pier Inspection Dossier',
        finding:
          'Structural tension test results verified at 94% tolerance. Substructure piers fully cleared for loadbearing traffic ahead of schedule.',
        delta: +0.40,
        txHash,
        explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
        network: 'Base Sepolia (Chain ID: 84532)',
      },
    });
  }

  // Otherwise return HTTP 402 Payment Required with standard x402 specifications
  return NextResponse.json(
    {
      error: 'Payment Required',
      message: 'This intelligence stream requires an x402 micropayment on Base Sepolia.',
      x402: {
        version: '2.0',
        network: 'base-sepolia',
        chainId: BASE_SEPOLIA_CHAIN_ID,
        recipient: recipientAddress,
        amountUsd: '0.020',
        amountUsdc: '20000', // 0.020 USDC (6 decimals)
        tokenContract: BASE_SEPOLIA_USDC_ADDRESS,
        facilitator: facilitatorUrl,
        description: 'Micro-archive access: Harbor Infrastructure Division Dossier',
      },
    },
    {
      status: 402,
      headers: {
        'WWW-Authenticate': `x402 network="base-sepolia" amount="0.020" token="${BASE_SEPOLIA_USDC_ADDRESS}" recipient="${recipientAddress}"`,
      },
    }
  );
}
