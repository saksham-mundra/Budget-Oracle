export type SourceType = 'simulated' | 'real_testnet';

export interface Vendor {
  id: string;
  name: string;
  priceUsd: number;
  delta: number; // log-odds push: negative pushes toward NO, positive toward YES
  description: string;
  sourceType: SourceType;
  endpointUrl?: string;
  agentAddress?: string; // Designated Base Sepolia wallet address for the data provider agent
}

// Spending rules constants as specified in requirements
export const perPurchaseCapUsd = 0.08;
export const reservePct = 0.10; // 10% share of the budget is never spent
export const minShiftPerCent = 1.0; // Minimum probability shift in percentage points per cent spent

// Uppercase aliases
export const PER_PURCHASE_CAP_USD = perPurchaseCapUsd;
export const RESERVE_PCT = reservePct;
export const MIN_SHIFT_PER_CENT = minShiftPerCent;

// Dedicated data provider agent wallet addresses on Base Sepolia
export const AGENT_RECIPIENT_ADDRESSES: Record<string, string> = {
  court: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',     // Court Filings Agent
  wire: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',      // Newswire Agent
  sat: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',       // Satellite Foot Traffic Agent
  ana: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',       // Analyst Consensus Agent
  soc: '0x9965507D1a55bcC64771675a25999A618e4D4B54',       // Social Sentiment Agent
  vault: '0x976EA74026E72CD5554282e7C737977448246e30',     // Premium Research Vault Agent
  x402_paid: '0x845321042E94b15998a6B6002fD4B171eA41E1C5', // Base Sepolia Evidence Agent
};

/**
 * Fictional vendors as specified in Stage 2.
 * All default vendors are marked as "simulated" until connected to a real endpoint.
 * Each has an assigned agent recipient wallet on Base Sepolia.
 */
export const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'court',
    name: 'Court Filings Archive',
    priceUsd: 0.040,
    delta: -0.9,
    description: 'Municipal, federal litigation, bankruptcy dockets, and corporate filings archive.',
    sourceType: 'simulated',
    agentAddress: AGENT_RECIPIENT_ADDRESSES.court,
    endpointUrl: '/api/paid-source?vendor=court',
  },
  {
    id: 'wire',
    name: 'Industry Newswire',
    priceUsd: 0.020,
    delta: +0.3,
    description: 'Real-time trade publications, press dispatches, and corporate communications.',
    sourceType: 'simulated',
    agentAddress: AGENT_RECIPIENT_ADDRESSES.wire,
    endpointUrl: '/api/paid-source?vendor=wire',
  },
  {
    id: 'sat',
    name: 'Satellite Foot Traffic',
    priceUsd: 0.060,
    delta: -0.7,
    description: 'High-resolution synthetic aperture radar and commercial parking density.',
    sourceType: 'simulated',
    agentAddress: AGENT_RECIPIENT_ADDRESSES.sat,
    endpointUrl: '/api/paid-source?vendor=sat',
  },
  {
    id: 'ana',
    name: 'Analyst Consensus Feed',
    priceUsd: 0.030,
    delta: -0.5,
    description: 'Aggregated sell-side analyst revisions, earnings expectations, and survey signals.',
    sourceType: 'simulated',
    agentAddress: AGENT_RECIPIENT_ADDRESSES.ana,
    endpointUrl: '/api/paid-source?vendor=ana',
  },
  {
    id: 'soc',
    name: 'Social Sentiment Scan',
    priceUsd: 0.010,
    delta: +0.15,
    description: 'Microblog semantic indexing, consumer mentions, and retail buzz volume.',
    sourceType: 'simulated',
    agentAddress: AGENT_RECIPIENT_ADDRESSES.soc,
    endpointUrl: '/api/paid-source?vendor=soc',
  },
  {
    id: 'vault',
    name: 'Premium Research Vault',
    priceUsd: 0.090,
    delta: -0.2,
    description: 'Gated institutional intelligence briefs and proprietary expert interview transcripts.',
    sourceType: 'simulated',
    agentAddress: AGENT_RECIPIENT_ADDRESSES.vault,
    endpointUrl: '/api/paid-source?vendor=vault',
  },
];

/**
 * Real testnet x402 paid data source definition for Stage 7.
 */
export const X402_TESTNET_VENDOR: Vendor = {
  id: 'x402_paid',
  name: 'Base Sepolia x402 Stream',
  priceUsd: 0.020,
  delta: +0.4,
  description: 'Live testnet intelligence stream gated by HTTP 402 micropayments on Base Sepolia.',
  sourceType: 'real_testnet',
  agentAddress: AGENT_RECIPIENT_ADDRESSES.x402_paid,
  endpointUrl: '/api/paid-source?vendor=x402_paid',
};

/**
 * Returns a fresh copy of the default vendors.
 */
export function getDefaultVendors(): Vendor[] {
  return DEFAULT_VENDORS.map((v) => ({ ...v }));
}
