'use client';

import React, { useState } from 'react';

export function LandingLoop() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      name: 'Start',
      subtitle: 'Initialization & Hard Budget Ceiling',
      quote: 'Start with a question and a hard budget.',
      description:
        'The user defines a concrete hypothesis (e.g. "Will the Harbor Bridge reopen before December?") and locks a strict USD ceiling (e.g. $0.50). The agent immediately rings fences a 10% protected reserve ($0.050) that can never be accessed.',
      formula: 'MaxSpendable = Budget - (Budget * 0.10)',
      inputs: ['Research Question: string', 'Budget Ceiling: USD ($0.01 - $5.00)', 'Protected Reserve: 10%'],
    },
    {
      id: 2,
      name: 'Rank',
      subtitle: 'Bayesian Prior & Marginal Utility Evaluation',
      quote: 'Get a probability prior, then rank sources by expected probability shift per cent.',
      description:
        'A deterministic hash establishes a reproducible prior P₀ ∈ [0.35, 0.65]. For all candidate evidence sources, the agent calculates hypothetical posterior P_next via log-odds delta and computes marginal points per cent spent.',
      formula: 'Utility = (|sigmoid(logit(P) + delta) - P| * 100) / (PriceUSD * 100)',
      inputs: ['Sort Order: Descending by pts/¢', 'Threshold: minShiftPerCent >= 1.0 pt/¢'],
    },
    {
      id: 3,
      name: 'Check',
      subtitle: 'Secondary Cap & Reserve Verification',
      quote: 'Check the quote, caps and reserve before signing anything.',
      description:
        'Before executing any on-chain transaction, the agent validates two hard limits: 1) Is the source price ≤ $0.08? 2) Would this transaction breach the 10% reserve? If violated, the candidate is permanently blocked.',
      formula: 'price <= $0.08  AND  (spent + price) <= 0.90 * Budget',
      inputs: ['Per-Purchase Cap: $0.08', 'Protected Reserve Protection: Non-negotiable'],
    },
    {
      id: 4,
      name: 'Update',
      subtitle: 'Execution, Bayesian Posterior & Stop Evaluation',
      quote: 'Pay, fetch evidence, update the probability, and repeat only while the next source is worth its price.',
      description:
        'Executes an x402 micropayment directly from the connected wallet to the data provider agent on Ethereum Sepolia. Decrypts verified evidence, shifts probability P → P_next, and halts immediately when the next source offers < 1.0 pt/¢.',
      formula: 'P_final = sigmoid(logit(P_current) + delta)',
      inputs: ['Settlement: Ethereum Sepolia x402', 'Stop Condition: Best next source < 1.0 pt/¢'],
    },
  ];

  return (
    <section id="loop" className="py-20 border-t border-[#222222] bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#ccff4d]">
            THE FOUR-STEP ALGORITHM
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#f4f4f0] tracking-tight">
            The agent spends like an analyst, not a gambler
          </h2>
          <p className="text-sm sm:text-base text-[#9a9a94] max-w-2xl">
            Every dollar is allocated with mathematical discipline. The agent never executes a transaction on faith.
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-[#222222] pb-4">
          {steps.map((s) => {
            const isSelected = activeStep === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`p-3.5 rounded text-left transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#151515] border-[#ccff4d] shadow-[0_0_15px_rgba(204,255,77,0.15)]'
                    : 'bg-black/50 border-[#222222] hover:border-[#333333]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isSelected ? 'text-[#ccff4d]' : 'text-[#9a9a94]'
                    }`}
                  >
                    STEP 0{s.id}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ccff4d] animate-pulse" />
                  )}
                </div>
                <div className="font-serif font-bold text-base text-[#f4f4f0]">{s.name}</div>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Card */}
        {(() => {
          const s = steps.find((step) => step.id === activeStep) || steps[0];
          return (
            <div className="glass-panel p-6 sm:p-8 rounded-lg border border-[#2a2a2a] grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-4">
                <div className="inline-block px-2.5 py-0.5 text-[11px] font-mono uppercase font-bold tracking-wider rounded bg-[#ccff4d]/10 text-[#ccff4d] border border-[#ccff4d]/30">
                  {s.subtitle}
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#f4f4f0]">
                  &ldquo;{s.quote}&rdquo;
                </h3>
                <p className="text-sm text-[#9a9a94] leading-relaxed font-sans">
                  {s.description}
                </p>

                <div className="pt-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#9a9a94] mb-1.5">
                    Operational Invariants:
                  </div>
                  <ul className="space-y-1 text-xs text-[#f4f4f0]">
                    {s.inputs.map((inp, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-[#ccff4d] font-mono">▸</span>
                        <span className="font-mono">{inp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Code / Formula Box */}
              <div className="p-4 rounded bg-black/90 border border-[#222222] font-mono text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                  <span className="text-[#9a9a94] text-[10px] uppercase">Engine Logic</span>
                  <span className="text-[#ccff4d] text-[10px]">VERIFIED CODE</span>
                </div>
                <div className="text-[#9a9a94] text-[11px]">Formula specification:</div>
                <div className="p-2.5 rounded bg-[#111111] text-[#ccff4d] text-xs font-bold break-all border border-[#222222]">
                  {s.formula}
                </div>
                <p className="text-[11px] text-[#9a9a94] leading-normal pt-1">
                  Guarantees that deterministic math dictates every transaction. No LLM prompts are
                  consulted to evaluate probability shifts.
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
