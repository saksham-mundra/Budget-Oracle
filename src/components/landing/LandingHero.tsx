'use client';

import React from 'react';
import Link from 'next/link';

interface LandingHeroProps {
  onExploreGaps: () => void;
}

export function LandingHero({ onExploreGaps }: LandingHeroProps) {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#ccff4d]/8 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-[#ee86bd]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#2a2a2a] text-xs font-mono text-[#9a9a94]">
          <span className="w-2 h-2 rounded-full bg-[#ccff4d] animate-pulse-subtle" />
          <span className="text-[#f4f4f0] font-semibold">HACKATHON PROTOTYPE</span>
          <span className="text-[#555555]">|</span>
          <span>AUTONOMOUS EVIDENCE PURCHASING AGENT</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-extrabold tracking-tight text-[#f4f4f0] leading-[1.08]">
            An AI research agent that buys evidence{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff4d] to-[#b8f037]">
              only when it is worth the price.
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-[#9a9a94] font-normal max-w-3xl mx-auto leading-relaxed">
            Giving an autonomous agent a wallet turns small tasks into runaway spend. Budget Oracle
            binds research to hard financial caps, Bayesian log-odds evaluation, and cryptographic
            x402 micropayments on Ethereum Sepolia.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/terminal"
            className="px-6 py-3.5 bg-[#ccff4d] hover:bg-[#b8f037] text-black font-semibold text-sm rounded-full shadow-[0_0_25px_rgba(204,255,77,0.3)] transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
          >
            Launch Interactive Console
            <span className="font-mono text-base">→</span>
          </Link>
          <button
            onClick={onExploreGaps}
            className="px-5 py-3.5 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ccff4d]/60 text-sm font-medium text-[#f4f4f0] rounded-full transition cursor-pointer flex items-center gap-2"
          >
            Explore Economic Architecture
            <span className="text-[#9a9a94] font-mono">↓</span>
          </button>
        </div>

        {/* 4 Core Financial Governance Invariants Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 text-left max-w-5xl mx-auto">
          <div className="glass-panel p-4 rounded-lg border border-[#222222]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#9a9a94] mb-1">
              Protected Reserve
            </div>
            <div className="font-mono text-2xl font-bold text-[#ee86bd]">1%</div>
            <p className="text-xs text-[#9a9a94] mt-1 leading-snug">
              Immutable share of budget never spent under any condition.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-lg border border-[#222222]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#9a9a94] mb-1">
              Per-Purchase Cap
            </div>
            <div className="font-mono text-2xl font-bold text-[#f4f4f0]">$0.08</div>
            <p className="text-xs text-[#9a9a94] mt-1 leading-snug">
              Hard ceiling blocking single overpriced data queries.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-lg border border-[#222222]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#9a9a94] mb-1">
              Marginal Utility Threshold
            </div>
            <div className="font-mono text-2xl font-bold text-[#ccff4d]">≥ 1.0 pt/¢</div>
            <p className="text-xs text-[#9a9a94] mt-1 leading-snug">
              Minimum probability shift required per cent spent to justify a buy.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-lg border border-[#222222]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#9a9a94] mb-1">
              Code Invariant
            </div>
            <div className="font-mono text-2xl font-bold text-[#f4f4f0]">100% Code</div>
            <p className="text-xs text-[#9a9a94] mt-1 leading-snug">
              Verdict probability is set purely by math, never by the AI writer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
