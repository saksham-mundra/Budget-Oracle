'use client';

import React from 'react';

export function LandingGaps() {
  const gaps = [
    {
      num: '01',
      title: 'Access',
      problem: 'They cannot buy premium data without accounts, subscriptions or API keys.',
      detail:
        'Autonomous research agents cannot register for enterprise subscriptions, corporate billing accounts, or pre-provisioned API keys on the fly. Without an on-demand protocol, premium gated archives remain locked.',
      solution: 'x402 HTTP micropayment handshakes enable per-request evidence unlocking.',
      badgeColor: 'border-[#ccff4d]/40 text-[#ccff4d] bg-[#ccff4d]/10',
    },
    {
      num: '02',
      title: 'Evidence',
      problem: 'Their answers rarely show which sources were used, what they cost, or whether they helped.',
      detail:
        'Standard RAG architectures blend unverified web snippets into generic paragraphs. They provide no cryptographic audit trail, no unit cost accounting, and no proof of whether each source actually shifted the probability needle.',
      solution: 'Every source is cited by name with its exact price, log-odds delta, and tx hash.',
      badgeColor: 'border-[#ee86bd]/40 text-[#ee86bd] bg-[#ee86bd]/10',
    },
    {
      num: '03',
      title: 'Control',
      problem: 'A wallet without hard limits can turn a small task into uncontrolled spend.',
      detail:
        'Equipping an AI agent with an unconstrained crypto wallet or corporate credit card invites unbounded financial exposure. A loop or high-priced endpoint can drain the balance in seconds.',
      solution: 'Strict 10% reserve protection, $0.08 per-purchase cap, and marginal utility stop gates.',
      badgeColor: 'border-[#f4f4f0]/40 text-[#f4f4f0] bg-white/5',
    },
  ];

  return (
    <section id="gaps" className="py-20 border-t border-[#222222] bg-[#070707]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#ccff4d]">
            THE THREE BOTTLENECKS
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#f4f4f0] tracking-tight">
            AI agents face three gaps before they can act alone
          </h2>
          <p className="text-sm sm:text-base text-[#9a9a94] max-w-2xl">
            Why current autonomous agents fail in production when granted real financial authority.
          </p>
        </div>

        {/* 3 Gap Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gaps.map((gap) => (
            <div
              key={gap.title}
              className="glass-panel-interactive p-6 rounded-lg flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#9a9a94]">GAP {gap.num}</span>
                  <span
                    className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${gap.badgeColor}`}
                  >
                    {gap.title}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#f4f4f0]">
                  {gap.title}
                </h3>
                <p className="text-sm font-medium text-[#f4f4f0] leading-snug">
                  &ldquo;{gap.problem}&rdquo;
                </p>
                <p className="text-xs text-[#9a9a94] leading-relaxed">
                  {gap.detail}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1f1f1f] text-xs font-mono text-[#ccff4d]">
                <span className="text-[#9a9a94]">Fix: </span>
                {gap.solution}
              </div>
            </div>
          ))}
        </div>

        {/* Callout Pill (Exact quote from Slide 2) */}
        <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-r from-[#ccff4d]/15 via-[#ccff4d]/10 to-transparent border border-[#ccff4d]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#ccff4d] shrink-0" />
            <span className="font-serif text-base sm:text-lg font-bold text-[#f4f4f0]">
              Budget Oracle makes purchasing autonomous, auditable, and capped.
            </span>
          </div>
          <span className="text-xs font-mono text-[#ccff4d] tracking-wide shrink-0">
            SLIDE 02 // CORE THESIS
          </span>
        </div>
      </div>
    </section>
  );
}
