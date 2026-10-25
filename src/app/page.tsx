'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getDefaultVendors, Vendor } from '@/lib/vendors';
import { routeQuestion, RouteDecision } from '@/lib/router';
import { runAgent, AgentResult, AgentLogEntry } from '@/lib/agent';
import { ReportResponse, buildVerdictLine } from '@/lib/report';
import { WalletConnect } from '@/components/WalletConnect';
import { VendorTable } from '@/components/VendorTable';
import { CompareChart } from '@/components/CompareChart';
import { HonestStatusPanel } from '@/components/HonestStatusPanel';

interface HistoryItem {
  id: string;
  timestamp: string;
  question: string;
  budgetUsd: number;
  finalProbability: number;
  stopReason: string;
  route: string;
}

export default function BudgetOraclePage() {
  // Input Panel State
  const [question, setQuestion] = useState<string>(
    'Will the Harbor Bridge reopen before December?'
  );
  const [budgetUsd, setBudgetUsd] = useState<number>(0.5);
  const [detailedReport, setDetailedReport] = useState<boolean>(false);

  // Vendors state
  const [vendors, setVendors] = useState<Vendor[]>(getDefaultVendors());

  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isBaseSepolia, setIsBaseSepolia] = useState<boolean>(false);

  // Agent execution results
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [reportResult, setReportResult] = useState<ReportResponse | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  // Compare results ($0.10, $0.50, $1.00)
  const [compareResults, setCompareResults] = useState<
    { budget: number; result: AgentResult }[] | null
  >(null);

  // Run History (in-memory only, max 5)
  const [runHistory, setRunHistory] = useState<HistoryItem[]>([]);

  // System environment status (client-safe reflection)
  const jevModeLabel = 'Jev: simulated'; // Default simulated mode
  const x402StatusLabel = isBaseSepolia
    ? 'x402: Base Sepolia (Connected)'
    : 'x402: Base Sepolia Testnet';

  // Preset Questions
  const presets = [
    {
      label: 'Bridge',
      query: 'Will the Harbor Bridge reopen before December?',
    },
    {
      label: 'Sales',
      query: 'Will Q4 enterprise software sales exceed projections?',
    },
    {
      label: 'Open question',
      query:
        'Why did global container freight rates fluctuate in Q3 and how will shipping capacity adapt?',
    },
  ];

  // Router evaluation (pure code, live reactive)
  const routerDecision: RouteDecision = useMemo(() => {
    return routeQuestion(question, detailedReport);
  }, [question, detailedReport]);

  // Execute Agent
  const handleRunAgent = useCallback(async () => {
    if (!question.trim()) return;

    // 1. Run deterministic spending agent
    const result = runAgent(question.trim(), budgetUsd, vendors);
    setAgentResult(result);

    // 2. Add to in-memory run history (max 5 items)
    setRunHistory((prev) => {
      const newItem: HistoryItem = {
        id: `run-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        question: question.trim(),
        budgetUsd,
        finalProbability: result.final,
        stopReason: result.stopReason,
        route: routerDecision.route,
      };
      return [newItem, ...prev].slice(0, 5);
    });

    // 3. Generate report via server route
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
  }, [question, budgetUsd, vendors, routerDecision]);

  // Run on initial page mount with default question and budget
  useEffect(() => {
    handleRunAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compare across 3 budgets ($0.10, $0.50, $1.00)
  const handleCompare = () => {
    if (!question.trim()) return;
    const testBudgets = [0.1, 0.5, 1.0];
    const results = testBudgets.map((b) => ({
      budget: b,
      result: runAgent(question.trim(), b, vendors),
    }));
    setCompareResults(results);
  };

  // Download Log File
  const handleDownloadLog = () => {
    if (!agentResult) return;

    const logLines = [
      '=================================================================',
      'BUDGET ORACLE — ALGORITHMIC AUDIT LOG',
      '=================================================================',
      `Generated At:        ${new Date().toISOString()}`,
      `Research Question:   "${agentResult.question}"`,
      `Total Budget:        $${agentResult.budgetUsd.toFixed(3)} USD`,
      `Protected Reserve:   $${agentResult.reserveUsd.toFixed(3)} USD (10%)`,
      `Spent USD:           $${agentResult.spentUsd.toFixed(3)} USD`,
      `Unspent USD:         $${agentResult.unspentUsd.toFixed(3)} USD`,
      `Prior Probability:   ${(agentResult.prior * 100).toFixed(1)}% YES`,
      `Final Probability:   ${(agentResult.final * 100).toFixed(1)}% YES`,
      `Acquisition Result:  ${agentResult.stopReason}`,
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
      'Honesty Verification: Jev=simulated, x402=Base Sepolia testnet',
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

  const hasRealDataUsed = agentResult?.buys.some((b) => b.sourceType === 'real_testnet');

  return (
    <main className="w-full min-h-screen bg-black text-[#f4f4f0] px-4 py-8">
      {/* Responsive single column container, max width 760px */}
      <div className="max-w-[760px] mx-auto space-y-6">
        {/* ========================================================
            1. HEADER SECTION
        ======================================================== */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#2a2a2a]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#ccff4d]/15 text-[#ccff4d] border border-[#ccff4d]/30">
                Simulated prototype
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#222222] text-[#9a9a94] border border-[#333333]">
                Testnet Active
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#f4f4f0] tracking-tight">
              Budget Oracle
            </h1>
            <p className="text-sm text-[#9a9a94] mt-1">
              An agent that buys evidence only when it is worth the price.
            </p>
          </div>

          <WalletConnect
            onAddressChange={setWalletAddress}
            onNetworkChange={setIsBaseSepolia}
          />
        </header>

        {/* ========================================================
            2. INPUT PANEL SECTION
        ======================================================== */}
        <section className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-5 space-y-4">
          <div>
            <label
              htmlFor="question-input"
              className="block text-xs font-serif font-semibold text-[#f4f4f0] mb-1.5"
            >
              Research Question (Yes/No or Open-Ended)
            </label>
            <input
              id="question-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Will the Harbor Bridge reopen before December?"
              className="w-full px-3.5 py-2.5 bg-black border border-[#2a2a2a] text-[#f4f4f0] rounded text-sm placeholder-[#9a9a94]/50 focus:border-[#ccff4d] transition"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#9a9a94]">Presets:</span>
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setQuestion(p.query)}
                className="px-2.5 py-1 bg-black hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-[#ccff4d] text-xs text-[#f4f4f0] rounded transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#1f1f1f]">
            {/* Budget Input */}
            <div className="flex items-center gap-2">
              <label htmlFor="budget-input" className="text-xs text-[#9a9a94] font-medium">
                USD Budget:
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono text-[#ccff4d]">$</span>
                <input
                  id="budget-input"
                  type="number"
                  min="0.01"
                  step="0.05"
                  value={budgetUsd}
                  onChange={(e) =>
                    setBudgetUsd(Math.max(0.01, parseFloat(e.target.value) || 0.01))
                  }
                  className="w-24 px-2 py-1.5 bg-black border border-[#2a2a2a] focus:border-[#ccff4d] text-[#f4f4f0] rounded text-sm font-mono"
                />
              </div>
            </div>

            {/* Detailed report checkbox */}
            <label className="flex items-center gap-2 text-xs text-[#f4f4f0] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={detailedReport}
                onChange={(e) => setDetailedReport(e.target.checked)}
                className="w-4 h-4 rounded bg-black border-[#2a2a2a] text-[#ccff4d] accent-[#ccff4d] cursor-pointer"
              />
              <span>Detailed report (Routes to Route B/C)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="run-agent-btn"
              onClick={handleRunAgent}
              className="px-5 py-2.5 bg-[#ccff4d] hover:bg-[#b8f037] text-black font-semibold text-sm rounded shadow transition cursor-pointer"
            >
              Run Agent
            </button>
            <button
              id="compare-btn"
              onClick={handleCompare}
              className="px-4 py-2.5 bg-black hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ccff4d] text-[#f4f4f0] text-sm font-medium rounded transition cursor-pointer"
            >
              Compare ($0.10, $0.50, $1.00)
            </button>
          </div>
        </section>

        {/* ========================================================
            3. STATUS BADGES SECTION
        ======================================================== */}
        <section className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2.5 py-1 bg-[#111111] border border-[#2a2a2a] rounded flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ccff4d]" />
            <span className="text-[#9a9a94]">Jev:</span>
            <span className="font-mono text-[#f4f4f0]">{jevModeLabel}</span>
          </div>

          <div className="px-2.5 py-1 bg-[#111111] border border-[#2a2a2a] rounded flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ccff4d]" />
            <span className="text-[#9a9a94]">Writer:</span>
            <span className="font-mono text-[#f4f4f0]">
              Gemma 4 (Google Gen AI)
            </span>
          </div>

          <div className="px-2.5 py-1 bg-[#111111] border border-[#2a2a2a] rounded flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ccff4d]" />
            <span className="text-[#9a9a94]">x402:</span>
            <span className="font-mono text-[#f4f4f0]">{x402StatusLabel}</span>
          </div>

          <div className="px-2.5 py-1 bg-[#111111] border border-[#2a2a2a] rounded flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                walletAddress ? 'bg-[#ccff4d]' : 'bg-[#9a9a94]'
              }`}
            />
            <span className="text-[#9a9a94]">Wallet:</span>
            <span className="font-mono text-[#f4f4f0]">
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : 'Not connected'}
            </span>
          </div>
        </section>

        {/* ========================================================
            4. ROUTER PANEL SECTION
        ======================================================== */}
        <section className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs uppercase font-serif font-bold tracking-wider text-[#9a9a94]">
              Router Decision (Pure Code Engine)
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-bold font-mono rounded bg-black border border-[#2a2a2a] text-[#ccff4d]">
              Route {routerDecision.route}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-black/50 p-2.5 rounded border border-[#1f1f1f]">
              <div className="text-[10px] text-[#9a9a94] uppercase">Score</div>
              <div className="font-mono text-sm font-bold text-[#f4f4f0]">
                {routerDecision.score}
              </div>
            </div>

            <div className="bg-black/50 p-2.5 rounded border border-[#1f1f1f]">
              <div className="text-[10px] text-[#9a9a94] uppercase">Level</div>
              <div className="font-mono text-sm font-semibold capitalize text-[#f4f4f0]">
                {routerDecision.level}
              </div>
            </div>

            <div className="bg-black/50 p-2.5 rounded border border-[#1f1f1f]">
              <div className="text-[10px] text-[#9a9a94] uppercase">Question Type</div>
              <div className="font-mono text-sm font-semibold text-[#f4f4f0]">
                {routerDecision.yesNo ? 'Yes/No' : 'Open'}
              </div>
            </div>

            <div className="bg-black/50 p-2.5 rounded border border-[#1f1f1f]">
              <div className="text-[10px] text-[#9a9a94] uppercase">Assigned Route</div>
              <div className="font-mono text-sm font-bold text-[#ccff4d]">
                Route {routerDecision.route}
              </div>
            </div>

            <div className="bg-black/50 p-2.5 rounded border border-[#1f1f1f]">
              <div className="text-[10px] text-[#9a9a94] uppercase">Token Cap</div>
              <div className="font-mono text-sm font-bold text-[#f4f4f0]">
                {routerDecision.tokenCap} tokens
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            5. WHAT THE AGENT DID SECTION
        ======================================================== */}
        {agentResult && (
          <section className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1f1f1f]">
              <h2 className="text-base font-serif font-bold text-[#f4f4f0]">
                What the Agent Did
              </h2>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-[#9a9a94]">
                  Prior: <span className="text-[#f4f4f0]">{(agentResult.prior * 100).toFixed(1)}%</span>
                </span>
                <span className="text-[#9a9a94]">
                  Budget: <span className="text-[#f4f4f0]">${agentResult.budgetUsd.toFixed(2)}</span>
                </span>
                <span className="text-[#9a9a94]">
                  Reserve (10%):{' '}
                  <span className="text-[#ee86bd]">${agentResult.reserveUsd.toFixed(3)}</span>
                </span>
              </div>
            </div>

            {/* Log Entry Cards */}
            <div className="space-y-2.5">
              {agentResult.log.map((entry, index) => {
                const isBuy = entry.type === 'buy';

                return (
                  <div
                    key={entry.id || index}
                    className={`p-3.5 rounded border text-xs transition ${
                      isBuy
                        ? 'bg-black/70 border-[#2a2a2a]'
                        : 'bg-black/30 border-[#1f1f1f]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
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

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                            entry.sourceType === 'real_testnet'
                              ? 'bg-[#ccff4d]/10 text-[#ccff4d] border border-[#ccff4d]'
                              : 'bg-[#1f1f1f] text-[#9a9a94]'
                          }`}
                        >
                          {entry.sourceType === 'real_testnet'
                            ? 'REAL (testnet)'
                            : 'SIMULATED'}
                        </span>
                      </div>
                    </div>

                    {isBuy ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1f1f1f] text-[#9a9a94]">
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
                          <span>Tx Ref: </span>
                          <span className="font-mono text-[#f4f4f0] text-[11px]">
                            {entry.txRef}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#9a9a94] italic text-[11px] pt-1">
                        Reason: {entry.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ========================================================
                6. STOP BADGE SECTION
            ======================================================== */}
            <div className="mt-4 pt-3 border-t border-[#1f1f1f] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#ee86bd]/20 border border-[#ee86bd] text-[#ee86bd] text-xs font-bold font-mono uppercase tracking-wider rounded">
                  STOP
                </span>
                <span className="text-xs text-[#f4f4f0] font-medium">
                  {agentResult.stopReason}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            7. RESULT SECTION
        ======================================================== */}
        {agentResult && (
          <section className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-6 text-center space-y-2">
            <div className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#222222] text-[#9a9a94] border border-[#333333]">
              {hasRealDataUsed ? 'Real data used' : 'Simulated'}
            </div>

            <div className="text-5xl sm:text-6xl font-serif font-extrabold text-[#ccff4d] tracking-tight">
              {(agentResult.final * 100).toFixed(1)}% YES
            </div>

            <p className="text-xs text-[#9a9a94] font-mono">
              Spent ${agentResult.spentUsd.toFixed(3)} of ${agentResult.budgetUsd.toFixed(2)}, unspent ${agentResult.unspentUsd.toFixed(3)}
            </p>
          </section>
        )}

        {/* ========================================================
            8. REPORT SECTION
        ======================================================== */}
        {agentResult && (
          <section className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
              <h2 className="text-sm uppercase font-serif font-bold tracking-wider text-[#9a9a94]">
                Synthesis Report
              </h2>
              {isLoadingReport && (
                <span className="text-xs text-[#ccff4d] animate-pulse">
                  Synthesizing with Gemma 4...
                </span>
              )}
            </div>

            {/* Verdict line built by code only */}
            <div className="text-base font-serif font-bold text-[#f4f4f0]">
              {buildVerdictLine(agentResult.final)}
            </div>

            {/* AI Writer Output or Status */}
            {isLoadingReport ? (
              <p className="text-xs text-[#9a9a94] italic">
                Calling Gemma 4 API (Route {routerDecision.route}, token cap {routerDecision.tokenCap})...
              </p>
            ) : reportResult?.status === 'discarded' ? (
              <div className="p-3 bg-[#ee86bd]/10 border border-[#ee86bd] rounded text-xs text-[#ee86bd]">
                {reportResult.discardNote || 'Writer output discarded: it contained a conflicting number.'}
              </div>
            ) : reportResult?.reportText ? (
              <div className="text-xs text-[#f4f4f0] leading-relaxed whitespace-pre-wrap font-sans bg-black/40 p-3.5 rounded border border-[#1f1f1f]">
                {reportResult.reportText}
              </div>
            ) : routerDecision.route === 'A' ? (
              <p className="text-xs text-[#9a9a94] italic">
                Route A (token cap 0): Jev evaluation only, writer call bypassed by design.
              </p>
            ) : (
              <p className="text-xs text-[#9a9a94] italic">
                Writer unavailable: add your API key to .env.local
              </p>
            )}
          </section>
        )}

        {/* ========================================================
            9. DOWNLOAD LOG BUTTON SECTION
        ======================================================== */}
        {agentResult && (
          <div className="flex justify-end">
            <button
              id="download-log-btn"
              onClick={handleDownloadLog}
              className="px-4 py-2 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ccff4d] text-xs font-medium text-[#f4f4f0] rounded transition flex items-center gap-2 cursor-pointer"
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
        )}

        {/* ========================================================
            10. COMPARE CHART SECTION
        ======================================================== */}
        {compareResults && <CompareChart results={compareResults} />}

        {/* ========================================================
            11. RUN HISTORY SECTION (IN-MEMORY ONLY)
        ======================================================== */}
        <section className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase font-serif font-bold tracking-wider text-[#9a9a94]">
              Run History (Last 5 In-Memory)
            </h2>
            <span className="text-[10px] text-[#9a9a94]">Session only (no localStorage)</span>
          </div>

          {runHistory.length === 0 ? (
            <p className="text-xs text-[#9a9a94] italic">No runs executed yet.</p>
          ) : (
            <div className="space-y-2">
              {runHistory.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-black/60 border border-[#1f1f1f] rounded text-xs"
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span className="text-[#9a9a94] font-mono">#{idx + 1}</span>
                    <span className="text-[#f4f4f0] truncate max-w-[320px]">
                      {item.question}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className="text-[#9a9a94]">${item.budgetUsd.toFixed(2)}</span>
                    <span className="font-bold text-[#ccff4d]">
                      {(item.finalProbability * 100).toFixed(1)}% YES
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================
            12. FICTIONAL DATA SOURCES TABLE SECTION
        ======================================================== */}
        <VendorTable
          vendors={vendors}
          onChange={setVendors}
          onReset={() => setVendors(getDefaultVendors())}
        />

        {/* ========================================================
            13. HONEST STATUS PANEL SECTION
        ======================================================== */}
        <HonestStatusPanel />

        {/* ========================================================
            14. FOOTER SECTION
        ======================================================== */}
        <footer className="text-center py-8 text-xs text-[#9a9a94] border-t border-[#2a2a2a]">
          <p className="font-serif italic text-sm text-[#f4f4f0] mb-1">
            &ldquo;Limitations are part of the proof.&rdquo;
          </p>
          <p className="text-[11px] text-[#9a9a94]">
            Budget Oracle • Algorithmic Evidence Purchasing Agent • Next.js & Tailwind CSS
          </p>
        </footer>
      </div>
    </main>
  );
}
