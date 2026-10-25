'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingGaps } from '@/components/landing/LandingGaps';
import { LandingLoop } from '@/components/landing/LandingLoop';
import { LandingPayoff } from '@/components/landing/LandingPayoff';
import { LandingArchitecture } from '@/components/landing/LandingArchitecture';
import { LandingWhy } from '@/components/landing/LandingWhy';
import { HonestStatusPanel } from '@/components/HonestStatusPanel';

export default function BudgetOracleLandingPage() {
  const [, setWalletAddress] = useState<string | null>(null);
  const [, setIsSepolia] = useState<boolean>(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-[#f4f4f0] selection:bg-[#ccff4d] selection:text-black">
      {/* 1. STICKY TOP NAVBAR */}
      <LandingNavbar
        onAddressChange={setWalletAddress}
        onNetworkChange={setIsSepolia}
      />

      {/* 2. HERO SECTION (SLIDE 01: HACKATHON PROTOTYPE) */}
      <LandingHero
        onExploreGaps={() => scrollToSection('gaps')}
      />

      {/* 3. THE 3 GAPS SECTION (SLIDE 02: THE GAP) */}
      <LandingGaps />

      {/* 4. THE 4-STEP ANALYTICAL LOOP (SLIDE 03: THE LOOP) */}
      <LandingLoop />

      {/* 5. DIMINISHING RETURNS DEMO PAYOFF (SLIDE 04: THE DEMO PAYOFF) */}
      <LandingPayoff />

      {/* 6. ROUTING & INVARIANT PIPELINE ARCHITECTURE (SLIDE 05: ARCHITECTURE) */}
      <LandingArchitecture />

      {/* 7. WHY THIS ARCHITECTURE? (SLIDE 06: WHY THIS ARCHITECTURE) */}
      <LandingWhy />

      {/* 8. CALL TO ACTION TO DEDICATED LIVE CONSOLE */}
      <section className="py-20 border-t border-[#222222] bg-[#070707] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#ccff4d]/8 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#2a2a2a] text-xs font-mono text-[#ccff4d]">
            <span className="w-2 h-2 rounded-full bg-[#ccff4d] animate-pulse-subtle" />
            <span>DEDICATED RESEARCH TERMINAL</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#f4f4f0] tracking-tight">
            Ready to test the autonomous research agent?
          </h2>

          <p className="text-sm sm:text-base text-[#9a9a94] max-w-2xl mx-auto leading-relaxed">
            Launch the dedicated interactive terminal to run live research queries, inspect pure-code
            routing decisions, verify Bayesian updates, and execute x402 on-chain testnet micropayments
            directly on Ethereum Sepolia.
          </p>

          <div className="pt-2">
            <Link
              href="/terminal"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ccff4d] hover:bg-[#b8f037] text-black font-semibold text-sm rounded-full shadow-[0_0_30px_rgba(204,255,77,0.35)] transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Open Live Research Terminal</span>
              <span className="font-mono text-base">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. HONEST ARCHITECTURE STATUS AUDIT */}
      <section className="py-16 border-t border-[#222222] bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <HonestStatusPanel />
        </div>
      </section>

      {/* 10. SLIDE 07: THANK YOU & CLOSING BANNER */}
      <section className="py-24 border-t border-[#222222] bg-[#050505] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#ccff4d]/5 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#111111] border border-[#2a2a2a] flex items-center justify-center text-xl text-[#ccff4d] shadow-[0_0_20px_rgba(204,255,77,0.2)] animate-pulse-subtle">
            ☺
          </div>
          <h2 className="text-4xl sm:text-6xl font-serif font-bold text-[#f4f4f0] tracking-tight">
            Thank You!
          </h2>
          <p className="text-base text-[#9a9a94] font-medium tracking-wide">
            For your time and attention.
          </p>
          <div className="w-24 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#ccff4d] to-transparent my-4" />
          <p className="font-serif italic text-base text-[#ccff4d]">
            &ldquo;Limitations are part of the proof.&rdquo;
          </p>
          <div className="pt-8 text-xs font-mono text-[#666666]">
            Budget Oracle • Ethereum Sepolia Chain ID 11155111 • Next.js 16 (Turbopack) & Tailwind CSS v4
          </div>
        </div>
      </section>
    </div>
  );
}
