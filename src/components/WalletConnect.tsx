'use client';

import React, { useState, useEffect, useCallback } from 'react';

const BASE_SEPOLIA_CHAIN_ID_HEX = '0x14a34'; // 84532 in hex
const BASE_SEPOLIA_CHAIN_ID_DEC = 84532;

interface WalletConnectProps {
  onAddressChange?: (address: string | null) => void;
  onNetworkChange?: (isBaseSepolia: boolean) => void;
}

export function WalletConnect({ onAddressChange, onNetworkChange }: WalletConnectProps) {
  const [hasProvider, setHasProvider] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isBaseSepolia, setIsBaseSepolia] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkNetwork = useCallback((currentChain: string | null) => {
    if (!currentChain) {
      setIsBaseSepolia(false);
      onNetworkChange?.(false);
      return;
    }
    const dec = parseInt(currentChain, 16);
    const valid = currentChain === BASE_SEPOLIA_CHAIN_ID_HEX || dec === BASE_SEPOLIA_CHAIN_ID_DEC;
    setIsBaseSepolia(valid);
    onNetworkChange?.(valid);
  }, [onNetworkChange]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setHasProvider(true);
      // Check existing accounts
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accs = accounts as string[];
          if (accs && accs.length > 0) {
            setAddress(accs[0]);
            onAddressChange?.(accs[0]);
          }
        })
        .catch(() => {});

      // Check current chain
      window.ethereum
        .request({ method: 'eth_chainId' })
        .then((chain) => {
          const c = chain as string;
          setChainId(c);
          checkNetwork(c);
        })
        .catch(() => {});

      // Event listeners
      const handleAccountsChanged = (accs: unknown) => {
        const list = accs as string[];
        const first = list && list.length > 0 ? list[0] : null;
        setAddress(first);
        onAddressChange?.(first);
      };

      const handleChainChanged = (c: unknown) => {
        const newChain = c as string;
        setChainId(newChain);
        checkNetwork(newChain);
      };

      window.ethereum.on?.('accountsChanged', handleAccountsChanged);
      window.ethereum.on?.('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
      };
    } else {
      setHasProvider(false);
    }
  }, [checkNetwork, onAddressChange]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setErrorMsg('Install MetaMask to connect a testnet wallet.');
      return;
    }

    setIsConnecting(true);
    setErrorMsg(null);

    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        onAddressChange?.(accounts[0]);
      }

      const currentChain = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string;
      setChainId(currentChain);
      checkNetwork(currentChain);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Wallet connection declined';
      setErrorMsg(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToBaseSepolia = async () => {
    if (!window.ethereum) return;
    setErrorMsg(null);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (switchError: unknown) {
      // Chain 4902 error indicates chain has not been added to wallet
      const err = switchError as { code?: number };
      if (err?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Base Sepolia Testnet',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org'],
              },
            ],
          });
        } catch (addError: unknown) {
          const msg = addError instanceof Error ? addError.message : 'Failed to add Base Sepolia';
          setErrorMsg(msg);
        }
      } else {
        const msg = switchError instanceof Error ? switchError.message : 'Failed to switch chain';
        setErrorMsg(msg);
      }
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (id: string | null) => {
    if (!id) return 'Unknown Network';
    const dec = parseInt(id, 16);
    if (dec === 84532 || id === BASE_SEPOLIA_CHAIN_ID_HEX) return 'Base Sepolia';
    if (dec === 1) return 'Ethereum Mainnet';
    if (dec === 8453) return 'Base Mainnet';
    if (dec === 11155111) return 'Sepolia';
    return `Chain ID: ${dec || id}`;
  };

  return (
    <div className="flex flex-col items-end gap-1.5 text-xs">
      {!hasProvider ? (
        <div className="flex items-center gap-2">
          <span className="text-[#9a9a94]">No Web3 wallet</span>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-[#111111] hover:bg-[#222222] border border-[#2a2a2a] text-[#ee86bd] rounded font-medium transition"
          >
            Install MetaMask to connect a testnet wallet.
          </a>
        </div>
      ) : !address ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="px-3 py-1.5 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ccff4d] text-[#f4f4f0] rounded font-medium transition flex items-center gap-2 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#9a9a94]" />
          {isConnecting ? 'Connecting...' : 'Connect wallet'}
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#111111] border border-[#2a2a2a] rounded">
            <span
              className={`w-2 h-2 rounded-full ${
                isBaseSepolia ? 'bg-[#ccff4d]' : 'bg-[#ee86bd]'
              }`}
            />
            <span className="text-[#f4f4f0] font-mono">{shortenAddress(address)}</span>
            <span className="text-[#9a9a94]">({getNetworkName(chainId)})</span>
          </div>

          {!isBaseSepolia && (
            <button
              onClick={switchToBaseSepolia}
              className="px-2.5 py-1 bg-[#ee86bd]/10 hover:bg-[#ee86bd]/20 border border-[#ee86bd] text-[#ee86bd] rounded font-semibold transition cursor-pointer"
            >
              Switch to Base Sepolia
            </button>
          )}
        </div>
      )}

      {errorMsg && <p className="text-[#ee86bd] text-[11px] text-right">{errorMsg}</p>}

      {/* Permanent safety note required by specification */}
      <span className="text-[10px] text-[#9a9a94] italic tracking-tight">
        Testnet only. Never connect a wallet that holds real funds.
      </span>
    </div>
  );
}
