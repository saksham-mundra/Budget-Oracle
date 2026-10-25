'use client';

import React, { useState } from 'react';

export function LandingArchitecture() {
  const [selectedRoute, setSelectedRoute] = useState<'A' | 'B' | 'C'>('B');

  const routeDetails = {
    A: {
      name: 'Route A',
      headline: 'Jev Evaluation Only (Zero AI Token Cost)',
      trigger: 'Simple Yes/No query with no detailed report requested (score < 4)',
      tokenCap: 0,
      writerState: 'Bypassed by design',
      speed: '< 20ms',
      description:
        'When the user asks a straightforward question and does not need a written essay, the router assigns Route A. The AI writer is completely bypassed, saving 100% of LLM inference cost. The verdict is calculated exclusively by deterministic Bayesian code.',
    },
    B: {
      name: 'Route B',
      headline: 'Jev Math + Gemma 4 Parallel Synthesis',
      trigger: 'Yes/No question with Moderate complexity or Detailed Report enabled',
      tokenCap: 400,
      writerState: 'Active (Gemma 4 - 400 tokens)',
      speed: '400ms - 800ms',
      description:
        'For queries that need analytical justification without sprawling essays. The code engine updates posterior probability in parallel while Gemma 4 writes a concise, cited intelligence brief constrained to 400 tokens.',
    },
    C: {
      name: 'Route C',
      headline: 'Writer-Heavy Deep Synthesis',
      trigger: 'Open-ended ("Why", "Compare", "Analyze") or Complex / Deep query (score >= 14)',
      tokenCap: 1200,
      writerState: 'Active (Gemma 4 - 1200 tokens)',
      speed: '800ms - 1500ms',
      description:
        'Assigned when questions require multi-clause analysis, cross-market comparisons, or macro trends. Allocates an expanded 1200-token envelope for multi-source intelligence synthesis with strict evidence citations.',
    },
  };

  const current = routeDetails[selectedRoute];

  return (
    <section id="architecture" className="py-20 border-t border-[#222222] bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#ccff4d]">
            SYSTEM DESIGN (SLIDE 05)
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#f4f4f0] tracking-tight">
            Routing & Invariant Pipeline
          </h2>
          <p className="text-sm sm:text-base text-[#9a9a94] max-w-2xl">
            A pure-code router directs traffic before spending a single token. The AI writer is treated as a cited typist, never as an oracle.
          </p>
        </div>

        {/* Visual Architecture Diagram (Recreating Slide 5) */}
        <div className="glass-panel p-6 sm:p-8 rounded-lg border border-[#2a2a2a] space-y-6">
          {/* Layer 1: Inputs */}
          <div className="p-4 rounded bg-black/60 border border-[#222222] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ccff4d]" />
              <span className="text-[#f4f4f0] font-bold">1. INPUT TUPLE:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[#9a9a94]">
              <span className="px-2 py-1 bg-[#111111] rounded border border-[#222222]">
                Question string
              </span>
              <span>+</span>
              <span className="px-2 py-1 bg-[#111111] rounded border border-[#222222]">
                Budget ceiling ($USD)
              </span>
              <span>+</span>
              <span className="px-2 py-1 bg-[#111111] rounded border border-[#222222]">
                Detailed Report toggle
              </span>
            </div>
          </div>

          {/* Layer 2: Code Router Box */}
          <div className="p-5 rounded-lg bg-[#0e0e0e] border border-[#2a2a2a] space-y-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#1f1f1f] border border-[#333333] text-xs font-mono text-[#ccff4d]">
              <span className="font-bold">PURE CODE ROUTER (NO AI)</span>
            </div>
            <div className="font-mono text-xs sm:text-sm text-[#f4f4f0] max-w-xl mx-auto py-1">
              <code>score = (words / 8) + (2 × keywords) + (2 × multi) + (detailed ? 3 : 0)</code>
            </div>
            <div className="text-[11px] text-[#9a9a94] font-mono">
              Deterministic classification: score &lt; 4 (simple) | &lt; 8 (moderate) | &lt; 14 (complex) | deep
            </div>
          </div>

          {/* Layer 3: 3 Route Selector Branches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['A', 'B', 'C'] as const).map((r) => {
              const active = selectedRoute === r;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRoute(r)}
                  className={`p-4 rounded text-left transition cursor-pointer border ${
                    active
                      ? 'bg-[#151515] border-[#ccff4d] shadow-[0_0_15px_rgba(204,255,77,0.15)]'
                      : 'bg-black/60 border-[#222222] hover:border-[#333333]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#ccff4d]">
                      ROUTE {r}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black border border-[#222222] text-[#9a9a94]">
                      {r === 'A' ? '0 tokens' : r === 'B' ? '400 tokens' : '1200 tokens'}
                    </span>
                  </div>
                  <div className="font-serif font-bold text-sm text-[#f4f4f0]">
                    {r === 'A' ? 'Jev Only' : r === 'B' ? 'Jev + Writer' : 'Writer-Heavy'}
                  </div>
                  <p className="text-[11px] text-[#9a9a94] mt-1 line-clamp-2">
                    {r === 'A'
                      ? 'Simple yes/no, no writer call.'
                      : r === 'B'
                      ? 'Analytical brief, token cap 400.'
                      : 'Complex/open questions, token cap 1200.'}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Layer 4: Selected Route Detail Inspection */}
          <div className="p-5 rounded bg-[#111111] border border-[#222222] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-serif font-bold text-base text-[#f4f4f0]">
                {current.name}: {current.headline}
              </span>
              <span className="text-xs font-mono text-[#ccff4d]">
                Token Cap: {current.tokenCap} tokens | Latency: {current.speed}
              </span>
            </div>
            <p className="text-xs text-[#9a9a94] leading-relaxed">
              {current.description}
            </p>
            <div className="text-[11px] font-mono text-[#9a9a94] pt-1 border-t border-[#1f1f1f]">
              <span className="text-[#f4f4f0]">Assignment trigger: </span>
              {current.trigger}
            </div>
          </div>

          {/* Layer 5: Invariant Rule Banner */}
          <div className="p-4 rounded-lg bg-black/80 border border-[#2a2a2a] grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-[#ccff4d]">
                RULE 1: PROBABILITY IS CODE-ONLY
              </div>
              <p className="text-xs text-[#9a9a94] leading-snug">
                The verdict line (&quot;Verdict: 54.2% YES.&quot;) is assembled exclusively from the Jev Bayesian math engine. The AI writer never estimates, calculates, or alters the percentage.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-[#ee86bd]">
                RULE 2: NUMBER CONSISTENCY VALIDATOR
              </div>
              <p className="text-xs text-[#9a9a94] leading-snug">
                Post-generation automated regex scans all numbers in the AI report. If any conflicting percentage appears, the entire writer output is discarded with a formal warning note.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
