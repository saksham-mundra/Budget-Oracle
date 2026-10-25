import { perPurchaseCapUsd, reservePct, Vendor, AGENT_RECIPIENT_ADDRESSES } from './vendors';
import { AgentResult } from './agent';

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

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
export const SEPOLIA_EXPLORER_URL = 'https://sepolia.etherscan.io';

// Backwards-compatible aliases
export const BASE_SEPOLIA_CHAIN_ID = SEPOLIA_CHAIN_ID;
export const BASE_SEPOLIA_CHAIN_ID_HEX = SEPOLIA_CHAIN_ID_HEX;
export const BASE_SEPOLIA_EXPLORER_URL = SEPOLIA_EXPLORER_URL;

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
    rawNetwork === 'ethereum' ||
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
    networkName: 'Ethereum Sepolia Testnet (11155111)',
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
  vendor?: Vendor | { id: string; name: string; agentAddress?: string },
  question?: string
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
      sourceType: 'real_testnet',
      fallbackToSimulated: false,
      message:
        'No Web3 wallet detected. Connect MetaMask on Ethereum Sepolia to pay agents via x402 on-chain.',
    };
  }

  if (!userAddress) {
    return {
      success: false,
      sourceType: 'real_testnet',
      fallbackToSimulated: false,
      message:
        'User wallet not connected. Connect your wallet to pay data provider agents directly on Ethereum Sepolia.',
    };
  }

  try {
    const currentChainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    if (
      currentChainId !== SEPOLIA_CHAIN_ID_HEX &&
      parseInt(currentChainId || '0', 16) !== SEPOLIA_CHAIN_ID
    ) {
      return {
        success: false,
        sourceType: 'real_testnet',
        fallbackToSimulated: false,
        message: 'Wallet is not connected to Ethereum Sepolia (chain ID 11155111). Please switch network in wallet.',
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
      '0x111551112E94b15998a6B6002fD4B171eA41E1C5';

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
        sourceType: 'real_testnet',
        fallbackToSimulated: false,
        message: 'Payment transaction declined in wallet. On-chain settlement cancelled.',
      };
    }

    // 7. Settle against paid endpoint with user's on-chain payment proof
    const postRes = await fetch('/api/paid-source', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment-tx-hash': realTxHash,
      },
      body: JSON.stringify({ txHash: realTxHash, vendor: vendorId, question }),
    });

    const postData = await postRes.json();

    return {
      success: true,
      txHash: realTxHash,
      explorerUrl: `${SEPOLIA_EXPLORER_URL}/tx/${realTxHash}`,
      evidence: postData?.evidence,
      sourceType: 'real_testnet',
      fallbackToSimulated: false,
      agentAddress: agentRecipient,
      message: `x402 payment settled: User ${userAddress.slice(0, 6)}... paid Agent ${agentRecipient.slice(0, 6)}... on Ethereum Sepolia!`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Wallet transaction failed';
    return {
      success: false,
      sourceType: 'real_testnet',
      fallbackToSimulated: false,
      error: errorMsg,
      message: `On-chain transaction not confirmed: ${errorMsg}.`,
    };
  }
}

export interface OracleAgentSessionResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  agentRecipient?: string;
  agentResult?: AgentResult;
  message?: string;
  error?: string;
}

/**
 * Executes a single x402 payment authorizing the research budget to the Oracle Agent.
 * The Oracle Agent then autonomously manages all sub-purchases and live web scraping.
 */
export async function purchaseOracleAgentSession(
  budgetUsd: number,
  userAddress: string,
  question: string
): Promise<OracleAgentSessionResult> {
  // 1. Enforce network safety
  const netSafety = validateX402Network();
  if (!netSafety.allowed) {
    return {
      success: false,
      error: netSafety.error,
      message: 'Network safety violation: mainnet execution blocked.',
    };
  }

  // 2. Check for injected wallet
  if (typeof window === 'undefined' || !window.ethereum) {
    return {
      success: false,
      message: 'No Web3 wallet detected. Connect MetaMask on Ethereum Sepolia.',
    };
  }

  try {
    const currentChainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    if (
      currentChainId !== SEPOLIA_CHAIN_ID_HEX &&
      parseInt(currentChainId || '0', 16) !== SEPOLIA_CHAIN_ID
    ) {
      return {
        success: false,
        message: 'Wallet is not connected to Ethereum Sepolia (chain ID 11155111). Please switch network.',
      };
    }

    // 3. Inspect x402 payment requirements from the Oracle Agent gateway
    const checkRes = await fetch(
      `/api/paid-source?vendor=oracle_agent&budget=${budgetUsd}&question=${encodeURIComponent(question)}`
    );

    const paySpecs = await checkRes.json();
    const agentRecipient =
      paySpecs?.x402?.recipient ||
      AGENT_RECIPIENT_ADDRESSES.oracle_agent ||
      '0x111551112E94b15998a6B6002fD4B171eA41E1C5';

    // 4. Request ONE single payment from user's wallet to the Oracle Agent
    const txParams = {
      from: userAddress,
      to: agentRecipient,
      value: '0x0', // Micro-settlement ping
      data: '0x78343032', // "x402" in hex
    };

    const realTxHash = (await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [txParams],
    })) as string;

    if (!realTxHash || !realTxHash.startsWith('0x')) {
      return {
        success: false,
        message: 'x402 budget authorization cancelled in MetaMask.',
      };
    }

    // 5. Submit verified proof to Oracle Agent to trigger autonomous execution
    const postRes = await fetch('/api/paid-source', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment-tx-hash': realTxHash,
      },
      body: JSON.stringify({
        txHash: realTxHash,
        vendor: 'oracle_agent',
        question,
        budget: budgetUsd,
      }),
    });

    const postData = await postRes.json();

    if (!postRes.ok || !postData?.paid) {
      return {
        success: false,
        message: postData?.error || 'Failed to complete autonomous research execution.',
      };
    }

    return {
      success: true,
      txHash: realTxHash,
      explorerUrl: `${SEPOLIA_EXPLORER_URL}/tx/${realTxHash}`,
      agentRecipient,
      agentResult: postData?.agentResult,
      message: `x402 payment confirmed on Ethereum Sepolia! Oracle Agent autonomously acquired evidence.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Wallet transaction failed';
    return {
      success: false,
      error: errorMsg,
      message: `On-chain authorization failed: ${errorMsg}`,
    };
  }
}
