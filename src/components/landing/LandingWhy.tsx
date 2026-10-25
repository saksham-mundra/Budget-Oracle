'use client';

import React from 'react';

export function LandingWhy() {
  const cards = [
    {
      title: 'Why Jev?',
      quote:
        'Jev is our evaluation layer. It gives structured probabilities before and after evidence acquisition, allowing us to measure the value of a purchased source. The agent handles research decisions, and a separate writer generates the report.',
      icon: '📊',
      keyPoints: [
        'Decouples objective Bayesian evaluation from creative text generation',
        'Produces quantifiable delta shifts to measure marginal evidence efficiency',
        'Guarantees reproducible probabilistic state across identical hypotheses',
      ],
      tag: 'EVALUATION ENGINE',
      accent: 'border-[#ccff4d]/40 text-[#ccff4d]',
    },
    {
      title: 'Why x402?',
      quote:
        'x402 lets an autonomous agent pay for individual data requests through an HTTP payment handshake. It avoids relying on subscriptions or pre-provisioned API keys and connects the agent’s wallet to paid data endpoints.',
      icon: '⚡',
      keyPoints: [
        'Native HTTP 402 Payment Required status code specification',
        'Direct cryptographic settlement between user wallet and data provider agent',
        'No credit card forms, no subscription lock-ins, no pre-shared API secrets',
      ],
      tag: 'MICROPAYMENT PROTOCOL',
      accent: 'border-[#ee86bd]/40 text-[#ee86bd]',
    },
    {
      title: 'Why Budget Oracle?',
      quote:
        'Because giving an agent a wallet is not enough. We need to control what it spends, verify what it buys, and measure whether the information was worth the price. Budget Oracle makes those decisions explicit, constrained, and auditable.',
      icon: '🛡️',
      keyPoints: [
        '10% immutable reserve protection protects capital from zero-balance liquidation',
        'Halts purchasing the instant marginal shift drops below 1.0 point per cent',
        'Generates plaintext cryptographic audit logs linking on-chain Etherscan receipts',
      ],
      tag: 'BOUNDED AGENCY',
      accent: 'border-[#f4f4f0]/40 text-[#f4f4f0]',
    },
  ];

  return (
    <section id="why" className="py-20 border-t border-[#222222] bg-[#070707]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#ccff4d]">
            FIRST PRINCIPLES (SLIDE 06)
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#f4f4f0] tracking-tight">
            Why This Architecture?
          </h2>
          <p className="text-sm sm:text-base text-[#9a9a94] max-w-2xl">
            The philosophical and economic rationale behind each core component of the Budget Oracle system.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="glass-panel-interactive p-7 rounded-lg flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{card.icon}</span>
                  <span
                    className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${card.accent}`}
                  >
                    {card.tag}
                  </span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#f4f4f0]">
                  {card.title}
                </h3>

                <blockquote className="text-xs sm:text-sm font-medium text-[#f4f4f0] leading-relaxed italic border-l-2 border-[#ccff4d] pl-3">
                  &ldquo;{card.quote}&rdquo;
                </blockquote>
              </div>

              <div className="space-y-2 pt-4 border-t border-[#1f1f1f]">
                <div className="text-[10px] font-mono text-[#9a9a94] uppercase tracking-wider">
                  Key Capabilities:
                </div>
                <ul className="space-y-1.5 text-xs text-[#9a9a94]">
                  {card.keyPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#ccff4d] font-mono">✓</span>
                      <span className="leading-snug">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
