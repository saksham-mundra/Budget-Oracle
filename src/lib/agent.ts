import { getPrior, updatePosterior } from './jev';
import {
  Vendor,
  SourceType,
  getDefaultVendors,
  perPurchaseCapUsd,
  reservePct,
  minShiftPerCent,
} from './vendors';

export interface AgentLogEntry {
  id: string;
  type: 'buy' | 'block';
  vendorId: string;
  vendorName: string;
  priceUsd: number;
  delta: number;
  sourceType: SourceType;
  before?: number;
  after?: number;
  perCent?: number;
  shiftPoints?: number;
  txRef?: string;
  reason?: string;
  evidence?: {
    headline?: string;
    finding?: string;
    sources?: Array<{
      title: string;
      url: string;
      snippet: string;
      publisher?: string;
      publishedDate?: string;
      sourceType?: string;
    }>;
    engineUsed?: string;
  };
}

export interface AgentResult {
  question: string;
  prior: number;
  final: number;
  spentUsd: number;
  unspentUsd: number;
  budgetUsd: number;
  reserveUsd: number;
  log: AgentLogEntry[];
  buys: AgentLogEntry[];
  stopReason: string;
}

/**
 * Pure and deterministic spending agent algorithm.
 * No network calls are executed inside this function.
 */
export function runAgent(
  question: string,
  budgetUsd: number,
  customVendors?: Vendor[]
): AgentResult {
  const prior = getPrior(question);
  let p = prior;
  let spent = 0;
  const reserve = budgetUsd * reservePct;
  let remaining: Vendor[] = customVendors
    ? customVendors.map((v) => ({ ...v }))
    : getDefaultVendors();

  const log: AgentLogEntry[] = [];
  const buys: AgentLogEntry[] = [];
  let stopReason = '';

  const round3 = (n: number) => Math.round(n * 1000) / 1000;

  let stepCounter = 1;

  while (remaining.length > 0) {
    // 2a. For each vendor in remaining: np = updatePosterior(p, delta).
    // perCent = |np - p| * 100 / (priceUsd * 100). Sort descending.
    const evaluated = remaining.map((vendor) => {
      const np = updatePosterior(p, vendor.delta);
      const shiftPoints = Math.abs(np - p) * 100;
      const centsSpent = vendor.priceUsd * 100;
      const perCent = centsSpent > 0 ? shiftPoints / centsSpent : 0;
      return {
        vendor,
        np,
        shiftPoints,
        perCent,
      };
    });

    evaluated.sort((a, b) => b.perCent - a.perCent);
    const best = evaluated[0];

    // 2b. If best.perCent < minShiftPerCent: stop
    if (best.perCent < minShiftPerCent) {
      stopReason = 'The next source was not worth its price.';
      break;
    }

    // 2c. Check best vendor caps & reserve
    let blockReason: string | null = null;
    if (best.vendor.priceUsd > perPurchaseCapUsd) {
      blockReason = 'over the per-purchase cap';
    } else if (round3(spent + best.vendor.priceUsd) > round3(budgetUsd - reserve)) {
      blockReason = 'would dig into the reserve';
    }

    // 2d. If a reason exists: add block entry, remove vendor
    if (blockReason) {
      log.push({
        id: `block-${best.vendor.id}-${stepCounter++}`,
        type: 'block',
        vendorId: best.vendor.id,
        vendorName: best.vendor.name,
        priceUsd: best.vendor.priceUsd,
        delta: best.vendor.delta,
        sourceType: best.vendor.sourceType,
        reason: blockReason,
      });

      remaining = remaining.filter((v) => v.id !== best.vendor.id);

      // If no remaining vendor fits (spent + price <= budget - reserve), stop.
      const anyRemainingFits = remaining.some(
        (v) => round3(spent + v.priceUsd) <= round3(budgetUsd - reserve)
      );

      if (!anyRemainingFits) {
        stopReason = 'Budget limit reached (reserve protected).';
        break;
      }
      continue;
    }

    // 2e. Otherwise buy
    const beforeP = p;
    const afterP = best.np;
    p = afterP;
    spent = round3(spent + best.vendor.priceUsd);

    // Deterministic transaction reference for simulated sources
    const txHashSuffix = Math.abs(Math.sin(stepCounter * 997 + beforeP) * 10000000)
      .toFixed(0)
      .padStart(8, '0');
    const txRef =
      best.vendor.sourceType === 'real_testnet'
        ? `0x-real-${best.vendor.id}-${txHashSuffix}`
        : `sim-tx-${best.vendor.id}-${txHashSuffix}`;

    const buyEntry: AgentLogEntry = {
      id: `buy-${best.vendor.id}-${stepCounter++}`,
      type: 'buy',
      vendorId: best.vendor.id,
      vendorName: best.vendor.name,
      priceUsd: best.vendor.priceUsd,
      delta: best.vendor.delta,
      sourceType: best.vendor.sourceType,
      before: beforeP,
      after: afterP,
      perCent: Number(best.perCent.toFixed(3)),
      shiftPoints: Number(best.shiftPoints.toFixed(3)),
      txRef,
    };

    buys.push(buyEntry);
    log.push(buyEntry);
    remaining = remaining.filter((v) => v.id !== best.vendor.id);
  }

  if (!stopReason) {
    stopReason = 'All sources considered.';
  }

  const unspentUsd = round3(Math.max(0, budgetUsd - spent));

  return {
    question,
    prior: Number(prior.toFixed(4)),
    final: Number(p.toFixed(4)),
    spentUsd: spent,
    unspentUsd,
    budgetUsd,
    reserveUsd: round3(reserve),
    log,
    buys,
    stopReason,
  };
}
