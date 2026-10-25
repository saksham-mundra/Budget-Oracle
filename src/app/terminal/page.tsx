'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  getDefaultVendors,
  Vendor,
  X402_TESTNET_VENDOR,
  AGENT_RECIPIENT_ADDRESSES,
} from '@/lib/vendors';
import { routeQuestion, RouteDecision } from '@/lib/router';
import { runAgent, AgentResult } from '@/lib/agent';
import { ReportResponse, buildVerdictLine } from '@/lib/report';
import {
  purchaseFromPaidSource,
  purchaseOracleAgentSession,
  SEPOLIA_EXPLORER_URL,
} from '@/lib/purchase';
import { WalletConnect } from '@/components/WalletConnect';
type TerminalTab = 'actions' | 'report';

export default function TerminalPage() {
  // Input Panel State
  const [question, setQuestion] = useState<string>(
    'Will the Harbor Bridge reopen before December?'
  );
  const [budgetUsd, setBudgetUsd] = useState<number>(0.5);
  const [detailedReport, setDetailedReport] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TerminalTab>('actions');

  // Vendors (fixed testnet evidence providers)
  const [vendors] = useState<Vendor[]>(() => {
    const list = getDefaultVendors();
    return [...list, { ...X402_TESTNET_VENDOR }];
  });

  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isSepolia, setIsSepolia] = useState<boolean>(false);

  // Execution states: initialize agentResult immediately with pure deterministic calculation
  const [agentResult, setAgentResult] = useState<AgentResult>(() => {
    return runAgent('Will the Harbor Bridge reopen before December?', 0.5);
  });
  const [reportResult, setReportResult] = useState<ReportResponse | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [isPurchasingOnChain, setIsPurchasingOnChain] = useState<boolean>(false);
  const [paymentStatusMsg, setPaymentStatusMsg] = useState<string | null>(null);



  // Run History (in-memory only, max 5)


  // Preset Questions
  const presets = [
    {
      label: 'Harbor Bridge',
      query: 'Will the Harbor Bridge reopen before December?',
    },
    {
      label: 'Clinical Trial',
      query: 'Will the FDA approve Phase 3 oncology trial before Q4?',
    },
    {
      label: 'Federal Reserve',
      query: 'Will the Federal Reserve cut rates by 25bps at next meeting?',
    },
    {
      label: 'Freight Rates',
      query:
        'Why did global container freight rates fluctuate in Q3 and how will shipping capacity adapt?',
    },
  ];

  // Router evaluation (pure code, live reactive)
  const routerDecision: RouteDecision = useMemo(() => {
    return routeQuestion(question, detailedReport);
  }, [question, detailedReport]);

  // Execute Agent (Real On-Chain Only)
  const handleRunAgent = useCallback(async () => {
    if (!question.trim()) return;

    setPaymentStatusMsg(null);

    // Enforce real on-chain requirements:
    if (!walletAddress) {
      setPaymentStatusMsg(
        'Wallet Required: Please connect your MetaMask wallet on Ethereum Sepolia to run the on-chain research agent.'
      );
      return;
    }

    if (!isSepolia) {
      setPaymentStatusMsg(
        'Wrong Network: Please switch MetaMask to Ethereum Sepolia (Chain ID 11155111) to execute on-chain agent purchases.'
      );
      return;
    }

    // 1-Transaction x402 Autonomous Research Flow
    setIsPurchasingOnChain(true);
    setPaymentStatusMsg(
      `Prompting MetaMask (1 Transaction): Settle x402 payment of $${budgetUsd.toFixed(3)} to Oracle Agent...`
    );

    const outcome = await purchaseOracleAgentSession(
      budgetUsd,
      walletAddress,
      question.trim()
    );

    setIsPurchasingOnChain(false);

    if (!outcome.success || !outcome.agentResult) {
      setPaymentStatusMsg(
        outcome.message || 'On-chain x402 authorization was cancelled in wallet.'
      );
      return;
    }

    const result = outcome.agentResult;
    setPaymentStatusMsg(
      `✓ x402 payment confirmed on Ethereum Sepolia! Tx: ${outcome.txHash?.slice(0, 14)}... Oracle Agent autonomously executed research across ${result.buys.length} data providers.`
    );

    setAgentResult(result);
    setActiveTab('actions');



    // 4. Generate report via server route (Gemma 4)
    setIsLoadingReport(true);
    setReportResult(null);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          route: routerDecision.route,
          tokenCap: routerDecision.tokenCap,
          finalProbability: result.final,
          buys: result.buys,
          stopReason: result.stopReason,
        }),
      });

      if (res.ok) {
        const data: ReportResponse = await res.json();
        setReportResult(data);
      } else {
        setReportResult({
          verdictLine: buildVerdictLine(result.final),
          reportText: 'Failed to communicate with report generation service.',
          status: 'unavailable',
          engineUsed: 'Server error',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network error';
      setReportResult({
        verdictLine: buildVerdictLine(result.final),
        reportText: `Writer service error: ${msg}`,
        status: 'unavailable',
        engineUsed: 'Network error',
      });
    } finally {
      setIsLoadingReport(false);
    }
  }, [question, budgetUsd, vendors, routerDecision, walletAddress, isSepolia]);

  // Initial load: generate baseline report for initial prompt
  useEffect(() => {
    let isMounted = true;

    const fetchInitialReport = async () => {
      setIsLoadingReport(true);
      try {
        const res = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: 'Will the Harbor Bridge reopen before December?',
            route: 'B',
            tokenCap: 400,
            finalProbability: agentResult.final,
            buys: agentResult.buys,
            stopReason: agentResult.stopReason,
          }),
        });

        if (res.ok && isMounted) {
          const data: ReportResponse = await res.json();
          setReportResult(data);
        }
      } catch {
        // Network unavailable fallback
      } finally {
        if (isMounted) setIsLoadingReport(false);
      }
    };

    fetchInitialReport();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Download Log File
  const handleDownloadLog = () => {
    if (!agentResult) return;

    const logLines = [
      '=================================================================',
      'BUDGET ORACLE — RESEARCH AGENT AUDIT LOG',
      '=================================================================',
      `Generated at:        ${new Date().toISOString()}`,
      `Research Question:   ${question}`,
      `Total Budget:        $${budgetUsd.toFixed(3)} USD`,
      `Protected Reserve:   $${agentResult.reserveUsd.toFixed(3)} USD (1%)`,
      `Total Spent:         $${agentResult.spentUsd.toFixed(3)} USD`,
      `Unspent Remaining:   $${agentResult.unspentUsd.toFixed(3)} USD`,
      `Prior Probability:   ${(agentResult.prior * 100).toFixed(1)}% YES`,
      `Final Probability:   ${(agentResult.final * 100).toFixed(1)}% YES`,
      `Acquisition Result:  ${agentResult.stopReason}`,
      `User Payer Wallet:   ${walletAddress || 'Not connected'}`,
      'Settlement Network:  Ethereum Sepolia (Chain ID: 11155111)',
      '',
      '-----------------------------------------------------------------',
      'ROUTER DECISION (PURE CODE ENGINE)',
      '-----------------------------------------------------------------',
      `Score:               ${routerDecision.score}`,
      `Complexity Level:    ${routerDecision.level.toUpperCase()}`,
      `Yes/No Type:         ${routerDecision.yesNo ? 'YES/NO' : 'OPEN-ENDED'}`,
      `Assigned Route:      Route ${routerDecision.route}`,
      `Writer Token Cap:    ${routerDecision.tokenCap}`,
      '',
      '-----------------------------------------------------------------',
      'AGENT EXECUTION LOG (DETAILED STEP-BY-STEP)',
      '-----------------------------------------------------------------',
      ...agentResult.log.map((entry, idx) => {
        if (entry.type === 'buy') {
          return `Step ${idx + 1}: [BUY] ${entry.vendorName}
  Cost:           $${entry.priceUsd.toFixed(3)} USD
  Delta:          ${entry.delta > 0 ? '+' : ''}${entry.delta}
  Before:         ${((entry.before ?? 0) * 100).toFixed(1)}%
  After:          ${((entry.after ?? 0) * 100).toFixed(1)}%
  Shift:          ${entry.shiftPoints?.toFixed(2)} pts (${entry.perCent?.toFixed(2)} pts/cent)
  Tx Reference:   ${entry.txRef} (${entry.sourceType})`;
        } else {
          return `Step ${idx + 1}: [BLOCKED] ${entry.vendorName}
  Cost:           $${entry.priceUsd.toFixed(3)} USD
  Reason:         ${entry.reason}`;
        }
      }),
      '',
      '-----------------------------------------------------------------',
      'SYNTHESIS REPORT',
      '-----------------------------------------------------------------',
      buildVerdictLine(agentResult.final),
      reportResult?.reportText ? reportResult.reportText : '(No writer report generated)',
      '=================================================================',
      'Honesty Verification: Jev=simulated, x402=Ethereum Sepolia testnet (11155111)',
      'Limitations are part of the proof.',
      '=================================================================',
    ];

    const blob = new Blob([logLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-oracle-log-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reserveAmount = budgetUsd * 0.1;
  const maxSpendable = budgetUsd - reserveAmount;
  const spentPct = Math.min(100, (agentResult.spentUsd / budgetUsd) * 100);
  const reservePct = 10;
  const unspentPct = Math.max(0, 100 - spentPct - reservePct);

  return (
    <div className="w-full min-h-screen bg-black text-[#f4f4f0] selection:bg-[#ccff4d] selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#222222] bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-[#9a9a94] hover:text-[#f4f4f0] transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>←</span>
              <span>Overview</span>
            </Link>
            <span className="text-[#333333]">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ccff4d] shadow-[0_0_8px_#ccff4d] animate-pulse-subtle" />
              <span className="font-serif text-lg font-bold text-[#f4f4f0] tracking-tight whitespace-nowrap">
                Budget Oracle
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#161616] border border-[#2a2a2a] text-[#888888]">
                Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WalletConnect
              onAddressChange={setWalletAddress}
              onNetworkChange={setIsSepolia}
            />
          </div>
        </div>
      </header>

      {/* Main Dynamic Modular Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================
              LEFT COLUMN: MISSION CONTROL & SETTLEMENT CONFIG (5 cols)
          ======================================================== */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* 1. Research Mission Control Card */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="question-input"
                  className="text-xs font-serif font-bold uppercase tracking-wider text-[#f4f4f0]"
                >
                  Research Question
                </label>
                <span className="text-[10px] font-mono text-[#9a9a94]">
                  Pure-code Bayesian evaluation
                </span>
              </div>

              <textarea
                id="question-input"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter a research question..."
                className="w-full px-3.5 py-2.5 bg-black border border-[#2a2a2a] text-[#f4f4f0] rounded-lg text-sm placeholder-[#9a9a94]/50 focus:border-[#ccff4d] transition focus:outline-none resize-none leading-relaxed"
              />

              {/* Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-[#9a9a94] uppercase tracking-wider font-mono">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setQuestion(p.query)}
                      className="px-2.5 py-1 bg-black hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ccff4d]/60 text-xs text-[#f4f4f0] rounded-md transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Controller */}
              <div className="pt-3 border-t border-[#1f1f1f] space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="budget-input" className="text-xs font-medium text-[#9a9a94]">
                    USD Budget
                  </label>
                  <div className="text-[11px] font-mono text-[#888888]">
                    Reserve: <span className="text-[#ee86bd]">${reserveAmount.toFixed(3)}</span> (1% protected)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#ccff4d]">
                      $
                    </span>
                    <input
                      id="budget-input"
                      type="number"
                      min="0.01"
                      step="0.05"
                      value={budgetUsd}
                      onChange={(e) =>
                        setBudgetUsd(Math.max(0.01, parseFloat(e.target.value) || 0.01))
                      }
                      className="w-full pl-7 pr-3 py-2 bg-black border border-[#2a2a2a] focus:border-[#ccff4d] text-[#f4f4f0] rounded-lg text-sm font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {[0.1, 0.25, 0.5, 1.0].map((b) => (
                      <button
                        key={b}
                        onClick={() => setBudgetUsd(b)}
                        className={`px-2 py-1.5 text-xs font-mono rounded border transition cursor-pointer ${
                          budgetUsd === b
                            ? 'bg-[#ccff4d]/15 text-[#ccff4d] border-[#ccff4d]'
                            : 'bg-black text-[#9a9a94] border-[#2a2a2a] hover:border-[#444444]'
                        }`}
                      >
                        ${b.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#888888]">
                  <span>Max Spendable: ${maxSpendable.toFixed(3)}</span>
                  <span>Per-Purchase Cap: $0.080</span>
                </div>
              </div>

              {/* Detailed Report Switch */}
              <div className="pt-2 border-t border-[#1f1f1f]">
                <label className="flex items-center gap-2.5 text-xs text-[#f4f4f0] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={detailedReport}
                    onChange={(e) => setDetailedReport(e.target.checked)}
                    className="w-4 h-4 rounded bg-black border-[#2a2a2a] text-[#ccff4d] accent-[#ccff4d] cursor-pointer"
                  />
                  <span>Force Deep Report (Routes to Route B/C)</span>
                </label>
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  id="run-agent-btn"
                  onClick={handleRunAgent}
                  disabled={isPurchasingOnChain}
                  className="flex-1 py-3 px-4 bg-[#ccff4d] hover:bg-[#b8f037] text-black font-semibold text-sm rounded-lg shadow-[0_0_20px_rgba(204,255,77,0.25)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPurchasingOnChain ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                      <span>Signing in MetaMask...</span>
                    </>
                  ) : (
                    <>
                      <span>Run Agent (On-Chain)</span>
                      <span className="font-mono text-base">→</span>
                    </>
                  )}
                </button>


              </div>

              {paymentStatusMsg && (
                <div className="p-3 bg-black/80 border border-[#2a2a2a] rounded-lg text-xs text-[#ccff4d] font-mono animate-fadeIn leading-relaxed break-words">
                  {paymentStatusMsg}
                </div>
              )}
            </div>

            {/* 2. Autonomous Multi-Agent Settlement Card */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      walletAddress && isSepolia
                        ? 'bg-[#ccff4d] shadow-[0_0_8px_#ccff4d]'
                        : 'bg-[#ee86bd]'
                    }`}
                  />
                  <span className="font-serif font-bold text-xs text-[#f4f4f0]">
                    x402 Settlement Gateway
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded bg-[#ccff4d]/15 text-[#ccff4d] border border-[#ccff4d]/40">
                  REAL ON-CHAIN
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-[#9a9a94]">
                <div className="flex justify-between items-center">
                  <span>Network:</span>
                  <span className="font-mono text-[#f4f4f0]">Ethereum Sepolia (11155111)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Payer Wallet:</span>
                  {walletAddress ? (
                    <a
                      href={`${SEPOLIA_EXPLORER_URL}/address/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#ccff4d] hover:underline"
                    >
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)} ↗
                    </a>
                  ) : (
                    <span className="text-[#ee86bd] font-mono">Not connected</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span>Flow:</span>
                  <span className="text-[#f4f4f0]">User Wallet → Agent Address</span>
                </div>
              </div>
            </div>

            {/* 3. Pure Code Router Card */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ccff4d]" />
                  <span className="font-serif font-bold text-xs text-[#f4f4f0]">
                    Pure Code Router
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-bold font-mono rounded bg-black border border-[#2a2a2a] text-[#ccff4d]">
                  Route {routerDecision.route}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-black/60 p-2 rounded border border-[#1f1f1f]">
                  <div className="text-[10px] text-[#888888] uppercase">Score</div>
                  <div className="font-mono text-sm font-bold text-[#f4f4f0]">
                    {routerDecision.score}
                  </div>
                </div>

                <div className="bg-black/60 p-2 rounded border border-[#1f1f1f]">
                  <div className="text-[10px] text-[#888888] uppercase">Level</div>
                  <div className="font-mono text-sm font-semibold capitalize text-[#f4f4f0]">
                    {routerDecision.level}
                  </div>
                </div>

                <div className="bg-black/60 p-2 rounded border border-[#1f1f1f]">
                  <div className="text-[10px] text-[#888888] uppercase">Type</div>
                  <div className="font-mono text-sm font-semibold text-[#f4f4f0]">
                    {routerDecision.yesNo ? 'Yes/No' : 'Open'}
                  </div>
                </div>

                <div className="bg-black/60 p-2 rounded border border-[#1f1f1f]">
                  <div className="text-[10px] text-[#888888] uppercase">Token Cap</div>
                  <div className="font-mono text-sm font-bold text-[#ccff4d]">
                    {routerDecision.tokenCap}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: RESULTS, TABS & INTERACTIVE WORKSPACE (7 cols)
          ======================================================== */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-5">
            {/* 1. Verdict & Probability Hero Widget */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <div className="text-[11px] font-mono text-[#888888] uppercase tracking-wider">
                    Bayesian Log-Odds Probability
                  </div>
                  <div className="text-5xl sm:text-6xl font-serif font-extrabold text-[#ccff4d] tracking-tight mt-1">
                    {(agentResult.final * 100).toFixed(1)}% YES
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs font-mono text-[#9a9a94]">
                    Prior: <span className="text-[#f4f4f0]">{(agentResult.prior * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-xs font-mono text-[#ccff4d]">
                    Delta:{' '}
                    {agentResult.final >= agentResult.prior ? '+' : ''}
                    {((agentResult.final - agentResult.prior) * 100).toFixed(1)} pts
                  </div>
                  <div className="text-[10px] font-mono text-[#888888]">
                    Spent: ${agentResult.spentUsd.toFixed(3)} / ${budgetUsd.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Visual Budget Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-[#1f1f1f]">
                <div className="w-full h-2.5 bg-black rounded-full overflow-hidden flex border border-[#222222]">
                  <div
                    style={{ width: `${spentPct}%` }}
                    className="bg-[#ccff4d] transition-all duration-500"
                    title={`Spent: $${agentResult.spentUsd.toFixed(3)} (${spentPct.toFixed(0)}%)`}
                  />
                  <div
                    style={{ width: `${unspentPct}%` }}
                    className="bg-[#333333] transition-all duration-500"
                    title={`Unspent: $${agentResult.unspentUsd.toFixed(3)}`}
                  />
                  <div
                    style={{ width: `${reservePct}%` }}
                    className="bg-[#ee86bd] transition-all duration-500"
                    title={`Protected Reserve: $${reserveAmount.toFixed(3)} (1%)`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#888888]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#ccff4d]" />
                    Spent (${agentResult.spentUsd.toFixed(3)})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#333333]" />
                    Unspent (${agentResult.unspentUsd.toFixed(3)})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#ee86bd]" />
                    Reserve (${reserveAmount.toFixed(3)})
                  </span>
                </div>
              </div>

              {/* Code-Enforced Verdict Line */}
              <div className="mt-4 pt-3 border-t border-[#1f1f1f] text-sm font-serif font-bold text-[#f4f4f0]">
                {buildVerdictLine(agentResult.final)}
              </div>
            </div>

            {/* 2. Dynamic Modular Tabbed Workspace */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
              {/* Tab Bar */}
              <div className="flex items-center gap-1 p-2 bg-black/60 border-b border-[#222222] overflow-x-auto text-xs scrollbar-none">
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`px-3 py-2 rounded-lg font-medium transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'actions'
                      ? 'bg-[#181818] text-[#ccff4d] border border-[#ccff4d]/40 shadow-[0_0_10px_rgba(204,255,77,0.1)]'
                      : 'text-[#9a9a94] hover:text-[#f4f4f0] hover:bg-[#141414]'
                  }`}
                >
                  <span>⚡ Actions Stream</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black font-mono">
                    {agentResult.log.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-3 py-2 rounded-lg font-medium transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'report'
                      ? 'bg-[#181818] text-[#ccff4d] border border-[#ccff4d]/40 shadow-[0_0_10px_rgba(204,255,77,0.1)]'
                      : 'text-[#9a9a94] hover:text-[#f4f4f0] hover:bg-[#141414]'
                  }`}
                >
                  <span>📄 Synthesis Report</span>
                  {isLoadingReport && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ccff4d] animate-ping" />
                  )}
                </button>




              </div>

              {/* Tab Contents Pane */}
              <div className="p-5">
                {/* TAB 1: ACTIONS STREAM */}
                {activeTab === 'actions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
                      <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#9a9a94]">
                        Autonomous Agent Purchasing Log
                      </h3>
                      <span className="text-[11px] font-mono text-[#888888]">
                        Threshold: &ge; 1.00 pt/&cent;
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {agentResult.log.map((entry, index) => {
                        const isBuy = entry.type === 'buy';

                        return (
                          <div
                            key={entry.id || index}
                            className={`p-3.5 rounded-lg border text-xs transition ${
                              isBuy
                                ? 'bg-black/70 border-[#2a2a2a] hover:border-[#383838]'
                                : 'bg-black/30 border-[#1f1f1f]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-1.5 py-0.5 font-mono text-[10px] font-bold rounded uppercase ${
                                    isBuy
                                      ? 'bg-[#ccff4d]/20 text-[#ccff4d] border border-[#ccff4d]/40'
                                      : 'bg-[#ee86bd]/15 text-[#ee86bd] border border-[#ee86bd]/30'
                                  }`}
                                >
                                  {isBuy ? 'BOUGHT' : 'BLOCKED'}
                                </span>
                                <span className="font-semibold text-sm text-[#f4f4f0]">
                                  {entry.vendorName}
                                </span>
                                <span className="text-[#9a9a94] font-mono">
                                  (${entry.priceUsd.toFixed(3)})
                                </span>
                              </div>

                              <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded bg-[#ccff4d]/10 text-[#ccff4d] border border-[#ccff4d]/40">
                                REAL (ON-CHAIN)
                              </span>
                            </div>

                            {isBuy ? (
                              <div className="space-y-2 pt-2 border-t border-[#1f1f1f]">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#9a9a94]">
                                  <div>
                                    <span>Shift: </span>
                                    <span className="text-[#f4f4f0] font-mono">
                                      {((entry.before ?? 0) * 100).toFixed(1)}% →{' '}
                                      {((entry.after ?? 0) * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span>Efficiency: </span>
                                    <span className="text-[#ccff4d] font-mono font-bold">
                                      {entry.perCent?.toFixed(2)} pts/¢
                                    </span>
                                  </div>
                                  <div className="col-span-2 truncate">
                                    <span>On-Chain Tx: </span>
                                    {entry.txRef?.startsWith('0x') ? (
                                      <a
                                        href={`${SEPOLIA_EXPLORER_URL}/tx/${entry.txRef}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-[#ccff4d] underline text-[11px] hover:text-[#b8f037]"
                                        title="Inspect transaction on Sepolia Etherscan"
                                      >
                                        {entry.txRef.slice(0, 14)}... ↗
                                      </a>
                                    ) : (
                                      <span className="font-mono text-[#f4f4f0] text-[11px]">
                                        {entry.txRef}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {entry.evidence && (
                                  <div className="pt-2 border-t border-[#1f1f1f] space-y-2">
                                    {entry.evidence.headline && (
                                      <div className="text-xs font-semibold text-[#f4f4f0] flex items-center gap-1.5">
                                        <span className="text-[#ccff4d] text-[10px]">●</span>
                                        <span>{entry.evidence.headline}</span>
                                      </div>
                                    )}

                                    {entry.evidence.sources && entry.evidence.sources.length > 0 && (
                                      <div className="space-y-1.5 pt-1">
                                        <div className="text-[10px] uppercase font-mono font-bold text-[#9a9a94] flex items-center justify-between">
                                          <span>Verified Web Sources:</span>
                                          <span className="text-[9px] text-[#ccff4d]">
                                            {entry.evidence.engineUsed || 'Real Web Scraper'}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5">
                                          {entry.evidence.sources.slice(0, 3).map((s, sIdx) => (
                                            <div
                                              key={sIdx}
                                              className="bg-black/50 p-2 rounded border border-[#222222] text-[11px] space-y-0.5"
                                            >
                                              <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#ccff4d] hover:underline font-medium block truncate"
                                                title={s.title}
                                              >
                                                {s.title} ↗
                                              </a>
                                              <p className="text-[#a0a09a] text-[10px] line-clamp-2">
                                                {s.snippet}
                                              </p>
                                              <div className="text-[9px] text-[#70706a] uppercase pt-0.5 flex items-center gap-2">
                                                {s.publisher && <span>Pub: {s.publisher}</span>}
                                                {s.publishedDate && <span>• {s.publishedDate}</span>}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[#9a9a94] italic text-[11px] pt-1">
                                Safeguard Block: {entry.reason}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Final STOP Card */}
                    <div className="p-3 bg-black/60 border border-[#2a2a2a] rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 bg-[#ee86bd]/20 border border-[#ee86bd] text-[#ee86bd] text-xs font-bold font-mono uppercase tracking-wider rounded">
                          STOP
                        </span>
                        <span className="text-xs text-[#f4f4f0] font-medium">
                          {agentResult.stopReason}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SYNTHESIS REPORT */}
                {activeTab === 'report' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
                      <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#9a9a94]">
                        Cited Intelligence Brief (Gemma 4)
                      </h3>
                      {isLoadingReport && (
                        <span className="text-xs text-[#ccff4d] animate-pulse">
                          Synthesizing with Gemma 4...
                        </span>
                      )}
                    </div>

                    <div className="text-base font-serif font-bold text-[#f4f4f0] pb-1">
                      {buildVerdictLine(agentResult.final)}
                    </div>

                    {isLoadingReport ? (
                      <div className="p-6 text-center text-xs text-[#9a9a94] italic space-y-2">
                        <div className="w-4 h-4 border-2 border-[#ccff4d] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p>Generating cited report via Gemma 4 API (Route {routerDecision.route}, token cap {routerDecision.tokenCap})...</p>
                      </div>
                    ) : reportResult?.status === 'discarded' ? (
                      <div className="p-3.5 bg-[#ee86bd]/10 border border-[#ee86bd] rounded-lg text-xs text-[#ee86bd] leading-relaxed">
                        {reportResult.discardNote || 'Writer output discarded: it contained a conflicting number.'}
                      </div>
                    ) : reportResult?.reportText ? (
                      <div className="text-xs text-[#f4f4f0] leading-relaxed whitespace-pre-wrap font-sans bg-black/50 p-4 rounded-lg border border-[#1f1f1f]">
                        {reportResult.reportText}
                      </div>
                    ) : routerDecision.route === 'A' ? (
                      <div className="p-4 bg-black/40 border border-[#1f1f1f] rounded-lg text-xs text-[#9a9a94] italic">
                        Route A (Token Cap 0): Pure Jev log-odds verdict evaluation only. Writer call bypassed by architectural design.
                      </div>
                    ) : (
                      <div className="p-4 bg-black/40 border border-[#1f1f1f] rounded-lg text-xs text-[#9a9a94] italic">
                        Writer unavailable. Provide API credentials in .env.local to enable real-time synthesis.
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        id="download-log-btn"
                        onClick={handleDownloadLog}
                        className="px-4 py-2 bg-black hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ccff4d] text-xs font-medium text-[#f4f4f0] rounded-lg transition flex items-center gap-2 cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 text-[#ccff4d]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download Audit Log (.txt)
                      </button>
                    </div>
                  </div>
                )}




              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-10 text-xs text-[#9a9a94] border-t border-[#222222] mt-10">
        <p className="font-serif italic text-sm text-[#f4f4f0] mb-1">
          &ldquo;Limitations are part of the proof.&rdquo;
        </p>
        <p className="text-[11px] text-[#666666]">
          Budget Oracle • Autonomous x402 Evidence Purchasing Console • Ethereum Sepolia Testnet
        </p>
      </footer>
    </div>
  );
}
