import { perPurchaseCapUsd, reservePct, Vendor } from './vendors';

export interface X402PurchaseResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  evidence?: unknown;
  sourceType: 'real_testnet' | 'simulated';
  fallbackToSimulated: boolean;
  message?: string;
  error?: string;
  agentAddress?: string;
}

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_CHAIN_ID_HEX = '0x14a34';
export const BASE_SEPOLIA_EXPLORER_URL = 'https://sepolia.basescan.org';

/**
 * Validates network configuration. Refuses to execute if configured for mainnet.
 */
export function validateX402Network(): { allowed: boolean; error?: string; networkName: string } {
  const rawNetwork = (
    process.env.X402_NETWORK ||
    process.env.NEXT_PUBLIC_X402_NETWORK ||
    'testnet'
  ).toLowerCase();

  const isMainnet =
    rawNetwork === 'mainnet' ||
    rawNetwork === 'base' ||
    rawNetwork === 'base-mainnet' ||
    rawNetwork === '8453' ||
    rawNetwork === '1';

  if (isMainnet) {
    return {
      allowed: false,
      error: 'CRITICAL SAFETY ERROR: Refusing to run on mainnet. X402_NETWORK must be a testnet.',
      networkName: rawNetwork,
    };
  }

  return {
    allowed: true,
    networkName: 'Base Sepolia Testnet (84532)',
  };
}

/**
 * Secondary safety gate: Re-verifies spending rules before any actual on-chain transaction.
 */
export function verifyPurchaseRules(
  priceUsd: number,
  currentSpentUsd: number,
  totalBudgetUsd: number
): { approved: boolean; reason?: string } {
  if (priceUsd > perPurchaseCapUsd) {
    return {
      approved: false,
      reason: `Blocked: Price $${priceUsd.toFixed(3)} exceeds per-purchase cap of $${perPurchaseCapUsd.toFixed(3)}`,
    };
  }

  const reserve = totalBudgetUsd * reservePct;
  const maxAllowed = totalBudgetUsd - reserve;

  if (Math.round((currentSpentUsd + priceUsd) * 1000) / 1000 > Math.round(maxAllowed * 1000) / 1000) {
    return {
      approved: false,
      reason: `Blocked: Purchase would dig into the ${reservePct * 100}% reserve ($${reserve.toFixed(3)})`,
    };
  }

  return { approved: true };
}

/**
 * Executes an x402 purchase paying from the user's connected wallet directly
 * to the data provider agent's address on Base Sepolia.
 * 
 * Flow:
 * - Sender: user's connected wallet (window.ethereum)
 * - Recipient: data provider agent wallet address (dynamic per vendor agent)
 * - Honesty: Never fakes a transaction hash; falls back cleanly if wallet unconfirmed.
 */
export async function purchaseFromPaidSource(
  priceUsd: number,
  currentSpentUsd: number,
  totalBudgetUsd: number,
  userAddress?: string | null,
  vendor?: Vendor | { id: string; name: string; agentAddress?: string }
): Promise<X402PurchaseResult> {
  // 1. Enforce network safety
  const netSafety = validateX402Network();
  if (!netSafety.allowed) {
    return {
      success: false,
      sourceType: 'simulated',
      fallbackToSimulated: true,
      error: netSafety.error,
      message: 'Network safety violation: mainnet execution blocked.',
    };
  }

  // 2. Second-layer spending rule enforcement
  const ruleCheck = verifyPurchaseRules(priceUsd, currentSpentUsd, totalBudgetUsd);
  if (!ruleCheck.approved) {
    return {
      success: false,
      sourceType: 'simulated',
      fallbackToSimulated: true,
      error: ruleCheck.reason,
      message: ruleCheck.reason,
    };
  }

  // 3. Check for injected wallet
  if (typeof window === 'undefined' || !window.ethereum) {
    return {
      success: false,
      sourceType: 'simulated',
      fallbackToSimulated: true,
      message:
        'No Web3 wallet detected. Connect MetaMask on Base Sepolia to pay agents via x402. Falling back to simulated data.',
    };
  }

  if (!userAddress) {
    return {
      success: false,
      sourceType: 'simulated',
      fallbackToSimulated: true,
      message:
        'User wallet not connected. Connect your wallet to pay data provider agents directly on Base Sepolia. Falling back to simulated data.',
    };
  }

  try {
    const currentChainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    if (
      currentChainId !== BASE_SEPOLIA_CHAIN_ID_HEX &&
      parseInt(currentChainId || '0', 16) !== BASE_SEPOLIA_CHAIN_ID
    ) {
      return {
        success: false,
        sourceType: 'simulated',
        fallbackToSimulated: true,
        message: 'Wallet is not connected to Base Sepolia (chain ID 84532). Please switch network in wallet.',
      };
    }

    const vendorId = vendor?.id || 'x402_paid';

    // 5. Query the endpoint to inspect 402 requirements and obtain data provider agent address
    const checkRes = await fetch(`/api/paid-source?vendor=${vendorId}`);
    if (checkRes.status !== 402) {
      const alreadyPaid = await checkRes.json();
      return {
        success: true,
        txHash: alreadyPaid?.evidence?.txHash,
        explorerUrl: alreadyPaid?.evidence?.explorerUrl,
        evidence: alreadyPaid?.evidence,
        sourceType: 'real_testnet',
        fallbackToSimulated: false,
        agentAddress: alreadyPaid?.evidence?.agentRecipient,
      };
    }

    const paySpecs = await checkRes.json();
    // Agent recipient address is provided dynamically by the data provider agent
    const agentRecipient =
      vendor?.agentAddress ||
      paySpecs?.x402?.recipient ||
      '0x845321042E94b15998a6B6002fD4B171eA41E1C5';

    // 6. Request test payment from user's injected wallet to the agent
    // Payer: userAddress (out of user's wallet)
    // Payee: agentRecipient (the data provider agent)
    const txParams = {
      from: userAddress,
      to: agentRecipient,
      value: '0x0', // Micro-settlement ping or test token transfer
      data: '0x78343032', // "x402" hex identifier
    };

    const realTxHash = (await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [txParams],
    })) as string;

    if (!realTxHash || !realTxHash.startsWith('0x')) {
      return {
        success: false,
        sourceType: 'simulated',
        fallbackToSimulated: true,
        message: 'User declined payment transaction to the agent. Falling back to simulated data.',
      };
    }

    // 7. Settle against paid endpoint with user's on-chain payment proof
    const postRes = await fetch('/api/paid-source', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment-tx-hash': realTxHash,
      },
      body: JSON.stringify({ txHash: realTxHash, vendor: vendorId }),
    });

    const postData = await postRes.json();

    return {
      success: true,
      txHash: realTxHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${realTxHash}`,
      evidence: postData?.evidence,
      sourceType: 'real_testnet',
      fallbackToSimulated: false,
      agentAddress: agentRecipient,
      message: `x402 payment settled: User ${userAddress.slice(0, 6)}... paid Agent ${agentRecipient.slice(0, 6)}... on Base Sepolia!`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Wallet transaction failed';
    return {
      success: false,
      sourceType: 'simulated',
      fallbackToSimulated: true,
      error: errorMsg,
      message: `Transaction not confirmed by user: ${errorMsg}. Falling back to simulated intelligence.`,
    };
  }
}
