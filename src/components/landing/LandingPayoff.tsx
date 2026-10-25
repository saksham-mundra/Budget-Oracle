'use client';

import React, { useState } from 'react';

export function LandingPayoff() {
  const [selectedBudget, setSelectedBudget] = useState<'0.10' | '0.50' | '1.00'>('0.50');

  const budgets = {
    '0.10': {
      budget: 0.10,
      spent: 0.065,
      unspent: 0.035,
      reserve: 0.010,
      finalProbability: 43.8,
      sourcesCount: 2,
      sources: ['Analyst Consensus Feed ($0.030)', 'Industry Newswire ($0.020)'],
      stopReason: 'Budget limit reached (10% reserve protected).',
      stopType: 'RESERVE_PROTECTION',
      chartHeight: '43.8%',
      summary:
        'With a tiny $0.10 ceiling, the agent acquires two affordable sources and halts to protect the mandatory 10% reserve ($0.010).',
    },
    '0.50': {
      budget: 0.50,
      spent: 0.185,
      unspent: 0.315,
      reserve: 0.050,
      finalProbability: 20.3,
      sourcesCount: 4,
      sources: [
        'Court Filings Archive ($0.040)',
        'Satellite Foot Traffic ($0.060)',
        'Analyst Consensus Feed ($0.030)',
        'Social Sentiment Scan ($0.010)',
      ],
      stopReason: 'The next source was not worth its price.',
      stopType: 'MARGINAL_UTILITY',
      chartHeight: '20.3%',
      summary:
        'With $0.50 available, the agent acquires 4 high-leverage data sources, shifting probability from 43.8% down to 20.3% YES, then halts.',
    },
    '1.00': {
      budget: 1.00,
      spent: 0.185,
      unspent: 0.815,
      reserve: 0.100,
      finalProbability: 20.3,
      sourcesCount: 4,
      sources: [
        'Court Filings Archive ($0.040)',
        'Satellite Foot Traffic ($0.060)',
        'Analyst Consensus Feed ($0.030)',
        'Social Sentiment Scan ($0.010)',
      ],
      stopReason: 'The next source was not worth its price.',
      stopType: 'MARGINAL_UTILITY',
      chartHeight: '20.3%',
      summary:
        'CRITICAL PAYOFF: Even with $1.00 budget, the agent stops at the exact same $0.185 spend! It returns $0.815 unspent rather than buying the $0.09 Premium Vault.',
    },
  };

  const current = budgets[selectedBudget];

  return (
    <section id="payoff" className="py-20 border-t border-[#222222] bg-[#070707]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#ccff4d]">
            ECONOMIC BOUNDED AGENCY
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#f4f4f0] tracking-tight">
            More budget buys accuracy, then the agent stops
          </h2>
          <p className="text-sm sm:text-base text-[#9a9a94] max-w-2xl">
            A naive agent spends every dollar in its wallet. Budget Oracle models diminishing marginal returns and halts automatically.
          </p>
        </div>

        {/* Interactive Comparison Widget */}
        <div className="glass-panel p-6 sm:p-8 rounded-lg border border-[#2a2a2a] space-y-8">
          {/* Budget Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#222222]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9a9a94] uppercase font-mono mr-1">Select Experiment:</span>
              {(['0.10', '0.50', '1.00'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBudget(b)}
                  className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded transition cursor-pointer border ${
                    selectedBudget === b
                      ? 'bg-[#ccff4d] text-black border-[#ccff4d] shadow-[0_0_12px_rgba(204,255,77,0.3)]'
                      : 'bg-black/60 text-[#f4f4f0] border-[#2a2a2a] hover:border-[#ccff4d]/50'
                  }`}
                >
                  ${b} Budget
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold uppercase rounded bg-[#ee86bd]/15 text-[#ee86bd] border border-[#ee86bd]/30">
                STOP RULE TRIGGERED
              </span>
            </div>
          </div>

          {/* Visualization Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Bar Chart Representation directly recreating Slide 4 */}
            <div className="lg:col-span-5 bg-black/80 p-5 rounded-lg border border-[#222222] space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#9a9a94]">FINAL YES PROBABILITY (%)</span>
                <span className="text-xs font-mono text-[#ccff4d] font-bold">
                  {current.finalProbability}% YES
                </span>
              </div>

              {/* 3 Comparative Bars Side-by-Side */}
              <div className="h-44 flex items-end justify-around gap-4 px-2 pt-4 border-b border-[#222222]">
                {/* $0.10 bar */}
                <div className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                  <span className="text-[11px] font-mono font-bold text-[#f4f4f0]">43.8%</span>
                  <div
                    style={{ height: '43.8%' }}
                    className={`w-full rounded-t transition-all duration-500 ${
                      selectedBudget === '0.10'
                        ? 'bg-[#ccff4d] shadow-[0_0_15px_rgba(204,255,77,0.5)]'
                        : 'bg-[#ccff4d]/30'
                    }`}
                  />
                  <span className="text-[11px] font-mono text-[#9a9a94] mt-1">$0.10</span>
                </div>

                {/* $0.50 bar */}
                <div className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                  <span className="text-[11px] font-mono font-bold text-[#f4f4f0]">20.3%</span>
                  <div
                    style={{ height: '20.3%' }}
                    className={`w-full rounded-t transition-all duration-500 ${
                      selectedBudget === '0.50'
                        ? 'bg-[#ccff4d] shadow-[0_0_15px_rgba(204,255,77,0.5)]'
                        : 'bg-[#ccff4d]/30'
                    }`}
                  />
                  <span className="text-[11px] font-mono text-[#9a9a94] mt-1">$0.50</span>
                </div>

                {/* $1.00 bar */}
                <div className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                  <span className="text-[11px] font-mono font-bold text-[#f4f4f0]">20.3%</span>
                  <div
                    style={{ height: '20.3%' }}
                    className={`w-full rounded-t transition-all duration-500 ${
                      selectedBudget === '1.00'
                        ? 'bg-[#ccff4d] shadow-[0_0_15px_rgba(204,255,77,0.5)]'
                        : 'bg-[#ccff4d]/30'
                    }`}
                  />
                  <span className="text-[11px] font-mono text-[#9a9a94] mt-1">$1.00</span>
                </div>
              </div>

              <div className="text-[10px] text-[#9a9a94] text-center font-mono italic">
                Notice how the $1.00 run produced the exact same 20.3% outcome as $0.50.
              </div>
            </div>

            {/* Breakdown & Explanation */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-4 rounded bg-[#111111] border border-[#222222] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#ee86bd]">
                  <span className="w-2 h-2 rounded-full bg-[#ee86bd]" />
                  <span>HALT CONDITION ENCOUNTERED:</span>
                </div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-[#f4f4f0]">
                  &ldquo;{current.stopReason}&rdquo;
                </div>
                <p className="text-xs text-[#9a9a94] leading-relaxed">
                  {current.summary}
                </p>
              </div>

              {/* Capital Accounting Matrix */}
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-black/60 p-3 rounded border border-[#222222]">
                  <div className="text-[10px] text-[#9a9a94] uppercase">Actual Spent</div>
                  <div className="text-base font-bold text-[#ccff4d] mt-0.5">
                    ${current.spent.toFixed(3)}
                  </div>
                </div>

                <div className="bg-black/60 p-3 rounded border border-[#222222]">
                  <div className="text-[10px] text-[#9a9a94] uppercase">Unspent Returned</div>
                  <div className="text-base font-bold text-[#f4f4f0] mt-0.5">
                    ${current.unspent.toFixed(3)}
                  </div>
                </div>

                <div className="bg-black/60 p-3 rounded border border-[#222222]">
                  <div className="text-[10px] text-[#9a9a94] uppercase">Sources Bought</div>
                  <div className="text-base font-bold text-[#f4f4f0] mt-0.5">
                    {current.sourcesCount} sources
                  </div>
                </div>
              </div>

              {/* Purchased sources list */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-mono text-[#9a9a94] uppercase">
                  Purchased Evidence Records:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {current.sources.map((src, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-black/60 border border-[#222222] rounded text-[11px] font-mono text-[#f4f4f0]"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
