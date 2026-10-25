'use client';

import React from 'react';
import { AgentResult } from '@/lib/agent';

interface CompareChartProps {
  results: {
    budget: number;
    result: AgentResult;
  }[];
}

export function CompareChart({ results }: CompareChartProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#f4f4f0]">
            Budget Comparison Analysis
          </h2>
          <p className="text-xs text-[#9a9a94]">
            Evaluating identical question across $0.10, $0.50, and $1.00 spending limits.
          </p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#222222] border border-[#333333] text-[#9a9a94] rounded">
          SIMULATED
        </span>
      </div>

      <div className="space-y-4">
        {results.map(({ budget, result }) => {
          const finalPct = (result.final * 100).toFixed(1);
          const priorPct = (result.prior * 100).toFixed(1);
          const spentRatio = Math.min(100, (result.spentUsd / budget) * 100);

          return (
            <div
              key={budget}
              className="bg-black/60 border border-[#222222] rounded p-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#ccff4d]">
                    ${budget.toFixed(2)}
                  </span>
                  <span className="text-[#9a9a94]">
                    ({result.buys.length} sources bought, spent ${result.spentUsd.toFixed(3)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#9a9a94]">Prior: {priorPct}%</span>
                  <span className="text-[#9a9a94]">→</span>
                  <span className="font-mono font-bold text-[#f4f4f0] text-sm">
                    {finalPct}% YES
                  </span>
                </div>
              </div>

              {/* Bar 1: Probability shift representation */}
              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-[#9a9a94] mb-0.5">
                  <span>Probability Shift (0% to 100%)</span>
                  <span>{finalPct}%</span>
                </div>
                <div className="w-full h-3 bg-[#1a1a1a] rounded overflow-hidden flex border border-[#2a2a2a]">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, result.final * 100))}%` }}
                    className="h-full bg-gradient-to-r from-[#222222] to-[#ccff4d] transition-all duration-500"
                  />
                </div>
              </div>

              {/* Bar 2: Budget utilization */}
              <div>
                <div className="flex justify-between text-[10px] text-[#9a9a94] mb-0.5">
                  <span>
                    Budget Utilization: ${result.spentUsd.toFixed(3)} spent / ${result.unspentUsd.toFixed(3)} unspent (10% reserve: ${result.reserveUsd.toFixed(3)})
                  </span>
                  <span>{spentRatio.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-[#1a1a1a] rounded overflow-hidden flex border border-[#2a2a2a]">
                  <div
                    style={{ width: `${spentRatio}%` }}
                    className="h-full bg-[#ccff4d] transition-all duration-500"
                  />
                  <div
                    style={{ width: `${10}%` }}
                    className="h-full bg-[#ee86bd]/40"
                    title="10% protected reserve"
                  />
                </div>
              </div>

              <div className="mt-2 text-[11px] text-[#9a9a94] flex items-center justify-between">
                <span>Stop Reason: &quot;{result.stopReason}&quot;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
