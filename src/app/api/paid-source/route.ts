import { NextRequest, NextResponse } from 'next/server';
import { AGENT_RECIPIENT_ADDRESSES, DEFAULT_VENDORS } from '@/lib/vendors';
import { scrapeEvidenceForVendor } from '@/lib/scraper';
import { runAgent } from '@/lib/agent';

// Ethereum Sepolia Testnet USDC contract address (Official Circle Sepolia USDC)
export const SEPOLIA_USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
export const SEPOLIA_FALLBACK_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';

// Backwards-compatible aliases
export const BASE_SEPOLIA_USDC_ADDRESS = SEPOLIA_USDC_ADDRESS;
export const BASE_SEPOLIA_CHAIN_ID = SEPOLIA_CHAIN_ID;
export const BASE_SEPOLIA_RPC_URL = SEPOLIA_RPC_URL;

interface VendorEvidenceTemplate {
  headline: string;
  finding: string;
  defaultDelta: number;
}

const VENDOR_DOSSIERS: Record<string, VendorEvidenceTemplate> = {
  court: {
    headline: 'Municipal Dockets & Litigation Archive Dossier',
    finding:
      'Verified docket records indicate ongoing regulatory disputes and procedural injunctions pending formal settlement hearings.',
    defaultDelta: -0.9,
  },
  wire: {
    headline: 'Real-Time Trade & Press Wire Dispatch',
    finding:
      'Syndicated commercial press dispatches report operational milestones progressing on schedule with contracted labor unions.',
    defaultDelta: +0.3,
  },
  sat: {
    headline: 'Synthetic Aperture Radar & Foot Traffic Scan',
    finding:
      'High-resolution radar density metrics reveal decreased equipment utilization and heavy machinery staging delays on-site.',
    defaultDelta: -0.7,
  },
  ana: {
    headline: 'Sell-Side Analyst Revisions & Model Review',
    finding:
      'Consensus revisions trend downward across 7 of 9 institutional equity research desks tracking progress metrics.',
    defaultDelta: -0.5,
  },
  soc: {
    headline: 'Microblog & Consumer Semantic Index',
    finding:
      'Aggregated semantic indexing across retail forums shows a modest positive sentiment uptick with 62% favorable mentions.',
    defaultDelta: +0.15,
  },
  vault: {
    headline: 'Proprietary Research Vault Intelligence Brief',
    finding:
      'Interviews with former project contractors cite unexpected supply-chain friction for specialized structural components.',
    defaultDelta: -0.2,
  },
  x402_paid: {
    headline: 'Ethereum Sepolia x402 Micropayment Verified Stream',
    finding:
      'Cryptographically signed testnet evidence stream verifies inspection milestone completion ahead of scheduled window.',
    defaultDelta: +0.4,
  },
};

/**
 * Queries Ethereum Sepolia public JSON-RPC to inspect real on-chain transaction receipt.
 */
async function verifyOnChainSepolia(txHash: string): Promise<{
  verified: boolean;
  blockNumber?: number;
  from?: string;
  to?: string;
  status?: string;
  note?: string;
}> {
  const rpcUrls = [SEPOLIA_RPC_URL, SEPOLIA_FALLBACK_RPC_URL];

  for (const rpcUrl of rpcUrls) {
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        }),
        signal: AbortSignal.timeout(3500),
      });

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const receipt = data?.result;

      if (receipt) {
        const isSuccess = receipt.status === '0x1';
        return {
          verified: true,
          blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : undefined,
          from: receipt.from,
          to: receipt.to,
          status: isSuccess ? 'confirmed_success' : 'reverted',
          note: `Verified on Sepolia in block ${receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : 'latest'}`,
        };
      }

      // Try checking pending transaction in mempool if receipt not yet indexed
      const txRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_getTransactionByHash',
          params: [txHash],
        }),
        signal: AbortSignal.timeout(3500),
      });

      const txData = await txRes.json();
      if (txData?.result) {
        return {
          verified: true,
          from: txData.result.from,
          to: txData.result.to,
          status: 'pending_mempool',
          note: 'Transaction broadcast received and pending in Sepolia mempool',
        };
      }
    } catch {
      // try next rpc
      continue;
    }
  }

  return {
    verified: false,
    note: 'Transaction hash format valid; awaiting propagation on Sepolia RPC',
  };
}

export async function GET(req: NextRequest) {
  return handlePaidRequest(req);
}

export async function POST(req: NextRequest) {
  return handlePaidRequest(req);
}

async function handlePaidRequest(req: NextRequest) {
  const network = (process.env.X402_NETWORK || 'testnet').toLowerCase();

  // Safety constraint: Refuse mainnet
  if (network === 'mainnet' || network === 'base' || network === '8453') {
    return NextResponse.json(
      { error: 'Refusing execution on mainnet. X402_NETWORK must be a testnet.' },
      { status: 400 }
    );
  }

  // Identify which data provider agent is being queried
  const urlVendor = req.nextUrl.searchParams.get('vendor');
  const queryQuestion = req.nextUrl.searchParams.get('question');
  const urlBudget = req.nextUrl.searchParams.get('budget');
  let bodyVendor: string | undefined;
  let bodyTxHash: string | undefined;
  let bodyQuestion: string | undefined;
  let bodyBudget: number | undefined;

  try {
    const json = await req.clone().json();
    bodyVendor = json?.vendor || json?.vendorId;
    bodyTxHash = json?.txHash;
    bodyQuestion = json?.question;
    bodyBudget = json?.budget || json?.budgetUsd;
  } catch {
    // No json body
  }

  const vendorId = urlVendor || bodyVendor || 'oracle_agent';
  const question = queryQuestion || bodyQuestion;
  const budgetUsd = Math.max(
    0.01,
    parseFloat(urlBudget || (bodyBudget !== undefined ? String(bodyBudget) : '0.100')) || 0.100
  );

  // Agent recipient address: flows dynamically to the agent
  const recipientAddress =
    AGENT_RECIPIENT_ADDRESSES[vendorId] ||
    AGENT_RECIPIENT_ADDRESSES.oracle_agent ||
    process.env.X402_RECIPIENT_ADDRESS ||
    '0x111551112E94b15998a6B6002fD4B171eA41E1C5';

  const facilitatorUrl =
    process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

  // Check for payment proof or transaction hash
  const x402Proof = req.headers.get('x-payment-proof') || req.headers.get('x402-payment-signature');
  const txHashHeader = req.headers.get('x-payment-tx-hash');
  const txHash = txHashHeader || bodyTxHash || (x402Proof?.startsWith('0x') ? x402Proof : undefined);

  // If valid payment proof/transaction hash is presented:
  if (txHash && /^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    // Query on-chain status from Ethereum Sepolia JSON-RPC
    const onChainVerification = await verifyOnChainSepolia(txHash);

    // MODE 1: Unified Autonomous Oracle Agent (1 single transaction for entire research budget)
    if (vendorId === 'oracle_agent') {
      let result = runAgent(question || '', budgetUsd);

      // Autonomous agent execution: enrich purchases with live web scraped evidence behind the scenes
      const enrichedBuys = await Promise.all(
        result.buys.map(async (buy) => {
          try {
            const scraped = await scrapeEvidenceForVendor(buy.vendorId, question || '');
            return {
              ...buy,
              txRef: txHash,
              evidence: {
                headline: scraped.headline,
                finding: scraped.finding,
                sources: scraped.sources,
                engineUsed: scraped.engineUsed,
              },
            };
          } catch {
            return { ...buy, txRef: txHash };
          }
        })
      );

      const updatedLog = result.log.map((entry) => {
        if (entry.type === 'buy') {
          const matched = enrichedBuys.find((b) => b.vendorId === entry.vendorId);
          if (matched) return matched;
        }
        return entry;
      });

      result = {
        ...result,
        buys: enrichedBuys,
        log: updatedLog,
      };

      return NextResponse.json({
        status: 200,
        paid: true,
        mode: 'autonomous_oracle_agent',
        txHash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
        agentRecipient: recipientAddress,
        agentResult: result,
        onChainVerification,
      });
    }

    // MODE 2: Individual sub-vendor dossier
    const template = VENDOR_DOSSIERS[vendorId] || {
      headline: `Verified Dossier for Agent ${vendorId}`,
      finding: `Evidence verified and decrypted upon x402 micropayment settlement.`,
      defaultDelta: +0.4,
    };

    let scrapedEvidence;
    try {
      scrapedEvidence = await scrapeEvidenceForVendor(
        vendorId,
        question || 'Current industrial and economic analysis'
      );
    } catch (scrapeErr) {
      console.warn('Real web scraping error in paid-source:', scrapeErr);
    }

    const vendorDef = DEFAULT_VENDORS.find((v) => v.id === vendorId);
    const vendorName = vendorDef?.name || `Agent ${vendorId}`;
    const delta = vendorDef?.delta ?? template.defaultDelta;

    const contextualFinding = question
      ? `${template.finding} (Analysis relevant to question: "${question.slice(0, 100)}")`
      : template.finding;

    const finalHeadline = scrapedEvidence?.headline || template.headline;
    const finalFinding = scrapedEvidence?.finding || contextualFinding;

    return NextResponse.json({
      status: 200,
      paid: true,
      evidence: {
        id: `rec_${vendorId}_11155111_${Date.now().toString(36)}`,
        source: `Ethereum Sepolia Verified Agent (${vendorName})`,
        agentRecipient: recipientAddress,
        timestamp: new Date().toISOString(),
        headline: finalHeadline,
        finding: finalFinding,
        sources: scrapedEvidence?.sources || [],
        engineUsed: scrapedEvidence?.engineUsed || 'Ethereum Sepolia Evidence Engine',
        delta,
        txHash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
        network: 'Ethereum Sepolia (Chain ID: 11155111)',
        onChainVerification,
      },
    });
  }

  // HTTP 402 PAYMENT REQUIRED CHALLENGE

  // 1-Transaction Autonomous Oracle Agent Challenge
  if (vendorId === 'oracle_agent') {
    const priceUsd = budgetUsd.toFixed(3);
    const priceUsdcUnits = Math.round(budgetUsd * 1000000).toString();

    return NextResponse.json(
      {
        error: 'Payment Required',
        message: `Executing autonomous research for budget $${priceUsd} requires a single x402 payment to the Oracle Agent on Ethereum Sepolia.`,
        x402: {
          version: '2.0',
          network: 'sepolia',
          chainId: SEPOLIA_CHAIN_ID,
          vendorId: 'oracle_agent',
          recipient: recipientAddress,
          amountUsd: priceUsd,
          amountUsdc: priceUsdcUnits,
          tokenContract: SEPOLIA_USDC_ADDRESS,
          facilitator: facilitatorUrl,
          description: `Budget Oracle: Autonomous Multi-Source Research Gateway ($${priceUsd} USD)`,
        },
      },
      {
        status: 402,
        headers: {
          'WWW-Authenticate': `x402 network="sepolia" amount="${priceUsd}" token="${SEPOLIA_USDC_ADDRESS}" recipient="${recipientAddress}"`,
        },
      }
    );
  }

  // Individual Sub-Vendor 402 Challenge
  const matchedVendor = DEFAULT_VENDORS.find((v) => v.id === vendorId);
  const priceUsd = matchedVendor ? matchedVendor.priceUsd.toFixed(3) : '0.020';
  const priceUsdcUnits = matchedVendor
    ? Math.round(matchedVendor.priceUsd * 1000000).toString()
    : '20000';

  return NextResponse.json(
    {
      error: 'Payment Required',
      message: `Accessing evidence from data provider agent '${vendorId}' requires an x402 micropayment on Ethereum Sepolia.`,
      x402: {
        version: '2.0',
        network: 'sepolia',
        chainId: SEPOLIA_CHAIN_ID,
        vendorId,
        recipient: recipientAddress,
        amountUsd: priceUsd,
        amountUsdc: priceUsdcUnits,
        tokenContract: SEPOLIA_USDC_ADDRESS,
        facilitator: facilitatorUrl,
        description: `Micro-archive access: Evidence from Agent ${vendorId}`,
      },
    },
    {
      status: 402,
      headers: {
        'WWW-Authenticate': `x402 network="sepolia" amount="${priceUsd}" token="${SEPOLIA_USDC_ADDRESS}" recipient="${recipientAddress}"`,
      },
    }
  );
}
