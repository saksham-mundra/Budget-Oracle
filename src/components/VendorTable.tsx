'use client';

import React from 'react';
import { Vendor, getDefaultVendors } from '@/lib/vendors';

interface VendorTableProps {
  vendors: Vendor[];
  onChange: (updated: Vendor[]) => void;
  onReset: () => void;
}

export function VendorTable({ vendors, onChange, onReset }: VendorTableProps) {
  const handlePriceChange = (id: string, newPrice: number) => {
    const updated = vendors.map((v) =>
      v.id === id ? { ...v, priceUsd: Math.max(0.001, Math.min(1.0, newPrice)) } : v
    );
    onChange(updated);
  };

  const handleDeltaChange = (id: string, newDelta: number) => {
    const updated = vendors.map((v) =>
      v.id === id ? { ...v, delta: Math.max(-2.5, Math.min(2.5, newDelta)) } : v
    );
    onChange(updated);
  };

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#f4f4f0]">
            Fictional Data Sources & Pricing
          </h2>
          <p className="text-xs text-[#9a9a94]">
            Edit vendor prices and log-odds push directions. Negative deltas push toward NO, positive toward YES.
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-3 py-1.5 bg-black hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ccff4d] text-xs font-medium text-[#f4f4f0] rounded transition cursor-pointer"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2a2a2a] text-[#9a9a94]">
              <th className="py-2.5 px-3 font-medium">Source / Vendor</th>
              <th className="py-2.5 px-3 font-medium">Type</th>
              <th className="py-2.5 px-3 font-medium">Agent Recipient Wallet</th>
              <th className="py-2.5 px-3 font-medium">Price (USD)</th>
              <th className="py-2.5 px-3 font-medium">Push Delta</th>
              <th className="py-2.5 px-3 font-medium">Direction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f1f]">
            {vendors.map((v) => {
              const isSimulated = v.sourceType === 'simulated';
              const directionLabel =
                v.delta > 0 ? `+YES (+${v.delta.toFixed(2)})` : `-NO (${v.delta.toFixed(2)})`;
              const directionColor =
                v.delta > 0 ? 'text-[#ccff4d]' : 'text-[#ee86bd]';

              return (
                <tr key={v.id} className="hover:bg-[#161616] transition">
                  <td className="py-2.5 px-3 font-medium text-[#f4f4f0]">
                    <div>{v.name}</div>
                    <div className="text-[11px] text-[#9a9a94] font-normal line-clamp-1">
                      {v.description}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${
                        isSimulated
                          ? 'bg-[#222222] text-[#9a9a94] border border-[#333333]'
                          : 'bg-[#ccff4d]/10 text-[#ccff4d] border border-[#ccff4d]'
                      }`}
                    >
                      {isSimulated ? 'SIMULATED' : 'REAL (testnet)'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#9a9a94]">
                    {v.agentAddress ? `${v.agentAddress.slice(0, 6)}...${v.agentAddress.slice(-4)}` : 'Dynamic Agent'}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[#9a9a94]">$</span>
                      <input
                        type="number"
                        step="0.005"
                        min="0.001"
                        max="0.500"
                        value={v.priceUsd}
                        onChange={(e) =>
                          handlePriceChange(v.id, parseFloat(e.target.value) || 0.001)
                        }
                        className="w-20 px-2 py-1 bg-black border border-[#2a2a2a] focus:border-[#ccff4d] text-[#f4f4f0] rounded text-xs font-mono"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="0.05"
                      min="-2.0"
                      max="2.0"
                      value={v.delta}
                      onChange={(e) =>
                        handleDeltaChange(v.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1 bg-black border border-[#2a2a2a] focus:border-[#ccff4d] text-[#f4f4f0] rounded text-xs font-mono"
                    />
                  </td>
                  <td className={`py-2.5 px-3 font-mono font-semibold ${directionColor}`}>
                    {directionLabel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
