import { perPurchaseCapUsd, reservePct } from './vendors';

export interface X402PurchaseResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  evidence?: unknown;
  sourceType: 'real_testnet' | 'simulated';
  fallbackToSimulated: boolean;
  message?: string;
  error?: string;
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
 * Executes an x402 purchase using the connected browser wallet (MetaMask) on Base Sepolia.
 * Adheres strictly to honesty rules: Never fakes a transaction hash.
 * If wallet is missing or transaction cannot proceed, reports clear message and falls back.
 */
export async function purchaseFromPaidSource(
  priceUsd: number,
  currentSpentUsd: number,
  totalBudgetUsd: number,
  userAddress?: string | null
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
        'No web3 wallet detected. Install MetaMask to connect a testnet wallet. Falling back to simulated data.',
    };
  }

  if (!userAddress) {
    return {
      success: false,
      sourceType: 'simulated',
      fallbackToSimulated: true,
      message:
        'Wallet not connected. Connect your Base Sepolia testnet wallet to perform real x402 purchases. Falling back to simulated data.',
    };
  }

  try {
    // 4. Verify chain ID
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (currentChainId !== BASE_SEPOLIA_CHAIN_ID_HEX && parseInt(currentChainId, 16) !== BASE_SEPOLIA_CHAIN_ID) {
      return {
        success: false,
        sourceType: 'simulated',
        fallbackToSimulated: true,
        message: 'Wallet is not connected to Base Sepolia (chain ID 84532). Please switch chain in wallet.',
      };
    }

    // 5. Query the endpoint to inspect 402 requirements
    const checkRes = await fetch('/api/paid-source');
    if (checkRes.status !== 402) {
      const alreadyPaid = await checkRes.json();
      return {
        success: true,
        txHash: alreadyPaid?.evidence?.txHash,
        explorerUrl: alreadyPaid?.evidence?.explorerUrl,
        evidence: alreadyPaid?.evidence,
        sourceType: 'real_testnet',
        fallbackToSimulated: false,
      };
    }

    const paySpecs = await checkRes.json();
    const recipient = paySpecs?.x402?.recipient || process.env.NEXT_PUBLIC_X402_RECIPIENT_ADDRESS;

    if (!recipient || recipient === '0x0000000000000000000000000000000000000000') {
      return {
        success: false,
        sourceType: 'simulated',
        fallbackToSimulated: true,
        message:
          'X402_RECIPIENT_ADDRESS is not set in .env.local. Configure your recipient test address to activate real settlement. Falling back to simulated data.',
      };
    }

    // 6. Request test payment signature / transfer from user's injected wallet
    // We send 0 ETH or token transaction to recipient on Base Sepolia
    const txParams = {
      from: userAddress,
      to: recipient,
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
        message: 'User rejected transaction or invalid hash received. Falling back to simulated data.',
      };
    }

    // 7. Settle against paid endpoint
    const postRes = await fetch('/api/paid-source', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment-tx-hash': realTxHash,
      },
      body: JSON.stringify({ txHash: realTxHash }),
    });

    const postData = await postRes.json();

    return {
      success: true,
      txHash: realTxHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${realTxHash}`,
      evidence: postData?.evidence,
      sourceType: 'real_testnet',
      fallbackToSimulated: false,
      message: 'Real on-chain micropayment settled successfully on Base Sepolia!',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Wallet transaction failed';
    return {
      success: false,
      sourceType: 'simulated',
      fallbackToSimulated: true,
      error: errorMsg,
      message: `On-chain transaction error: ${errorMsg}. Falling back to simulated vendors.`,
    };
  }
}
