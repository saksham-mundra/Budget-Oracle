'use client';

import React from 'react';

export function HonestStatusPanel() {
  const cards = [
    {
      title: 'Working',
      tagColor: 'text-[#ccff4d] border-[#ccff4d]/40 bg-[#ccff4d]/10',
      borderColor: 'border-[#ccff4d]/30',
      items: [
        'Pure-code router with keyword detection, word count, clause parsing, route determination (Routes A, B, C)',
        'Deterministic log-odds probability engine (getPrior deterministic hash, updatePosterior logit/sigmoid)',
        'Spending agent algorithm: 10% reserve protection, $0.08 per-purchase cap, marginal utility threshold (minShiftPerCent >= 1.0 pt/cent)',
        'Code-enforced verdict line formatting: "Verdict: X.X% YES."',
        'Multi-agent on-chain payment flow: user wallet pays each data provider agent directly on Ethereum Sepolia',
        'Live Ethereum Sepolia JSON-RPC verification: queries https://rpc.sepolia.org to verify transaction inclusion and agent recipient',
        'Hybrid live web scraping: real-time Google News RSS, DuckDuckGo search, and Wikipedia API indexing with live citations',
        'AI writer integration with Gemma 4 (@google/genai) synthesizing real scraped findings with strict prompt safeguards',
        'Report consistency validator detecting and discarding conflicting hallucinated percentages',
        'Downloadable plaintext audit log (.txt format)',
        'In-memory 5-run history (no localStorage)',
        'Live vendor parameter editor with instant rerun & reset',
        'Injected browser wallet connector with Ethereum Sepolia detection and network switch request',
      ],
    },
    {
      title: 'Simulated',
      tagColor: 'text-[#9a9a94] border-[#9a9a94]/40 bg-[#9a9a94]/10',
      borderColor: 'border-[#2a2a2a]',
      items: [
        'Proprietary enterprise satellite radar feeds (SAR) and closed private institutional vaults',
        'Stand-in log-odds math for Jev evaluation pending official API specification',
      ],
    },
    {
      title: 'Written but not run',
      tagColor: 'text-[#ffd166] border-[#ffd166]/40 bg-[#ffd166]/10',
      borderColor: 'border-[#ffd166]/30',
      items: [
        'Jev live evaluation API client (stubbed with explicit "Jev live mode: API contract not yet configured" exception as required)',
        'Mainnet x402 settlement (explicitly refused and blocked by testnet safety guards)',
      ],
    },
    {
      title: 'Still to validate',
      tagColor: 'text-[#ee86bd] border-[#ee86bd]/40 bg-[#ee86bd]/10',
      borderColor: 'border-[#ee86bd]/30',
      items: [
        'Production Jev API schema once official specification and contract are released',
        'Multi-party off-chain facilitator channel batching under extreme testnet gas volatility',
      ],
    },
  ];

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-5">
      <div className="mb-4">
        <h2 className="text-lg font-serif font-bold text-[#f4f4f0]">
          Honest Architecture Status
        </h2>
        <p className="text-xs text-[#9a9a94]">
          Verifiable audit of what is operational, simulated, stubbed, or pending external verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-black/70 border ${card.borderColor} rounded p-4 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-serif font-semibold text-sm text-[#f4f4f0]">
                  {card.title}
                </h3>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${card.tagColor}`}
                >
                  {card.items.length} items
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#9a9a94]">
                {card.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#ccff4d] mt-0.5 leading-none">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
