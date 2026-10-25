'use client';

import React from 'react';
import Link from 'next/link';
import { WalletConnect } from '@/components/WalletConnect';

interface LandingNavbarProps {
  onAddressChange: (address: string | null) => void;
  onNetworkChange: (isSepolia: boolean) => void;
}

export function LandingNavbar({ onAddressChange, onNetworkChange }: LandingNavbarProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222222] bg-black/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#ccff4d] shadow-[0_0_8px_#ccff4d] animate-pulse-subtle" />
            <span className="font-serif text-xl font-bold tracking-tight text-[#f4f4f0] group-hover:text-[#ccff4d] transition-colors whitespace-nowrap">
              Budget Oracle
            </span>
          </button>
          <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded bg-[#181818] text-[#888888] border border-[#2a2a2a]">
            Sepolia Testnet
          </span>
        </div>

        {/* Center Nav Links - Clean, Clutter-Free, Non-Wrapping */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs text-[#9a9a94] font-medium shrink-0">
          <button
            onClick={() => scrollTo('gaps')}
            className="hover:text-[#f4f4f0] transition-colors cursor-pointer whitespace-nowrap py-1"
          >
            The Gaps
          </button>
          <button
            onClick={() => scrollTo('loop')}
            className="hover:text-[#f4f4f0] transition-colors cursor-pointer whitespace-nowrap py-1"
          >
            The Loop
          </button>
          <button
            onClick={() => scrollTo('payoff')}
            className="hover:text-[#f4f4f0] transition-colors cursor-pointer whitespace-nowrap py-1"
          >
            Economics
          </button>
          <button
            onClick={() => scrollTo('architecture')}
            className="hover:text-[#f4f4f0] transition-colors cursor-pointer whitespace-nowrap py-1"
          >
            Architecture
          </button>
          <button
            onClick={() => scrollTo('why')}
            className="hover:text-[#f4f4f0] transition-colors cursor-pointer whitespace-nowrap py-1"
          >
            Why x402
          </button>
        </nav>

        {/* Wallet & Terminal Quick Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <WalletConnect
            onAddressChange={onAddressChange}
            onNetworkChange={onNetworkChange}
          />
          <Link
            href="/terminal"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#ccff4d] text-black hover:bg-[#b8f037] transition shadow-[0_0_12px_rgba(204,255,77,0.2)] cursor-pointer whitespace-nowrap"
          >
            Launch Console
            <span className="text-[11px] leading-none">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
