'use client';

import React, { useState, useEffect, useCallback } from 'react';

const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // 11155111 in hex
const SEPOLIA_CHAIN_ID_DEC = 11155111;

interface WalletConnectProps {
  onAddressChange?: (address: string | null) => void;
  onNetworkChange?: (isSepolia: boolean) => void;
  showDisclaimer?: boolean;
}

export function WalletConnect({
  onAddressChange,
  onNetworkChange,
  showDisclaimer = false,
}: WalletConnectProps) {
  const [hasProvider, setHasProvider] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isSepolia, setIsSepolia] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkNetwork = useCallback((currentChain: string | null) => {
    if (!currentChain) {
      setIsSepolia(false);
      onNetworkChange?.(false);
      return;
    }
    const dec = parseInt(currentChain, 16);
    const valid = currentChain === SEPOLIA_CHAIN_ID_HEX || dec === SEPOLIA_CHAIN_ID_DEC;
    setIsSepolia(valid);
    onNetworkChange?.(valid);
  }, [onNetworkChange]);

  useEffect(() => {
    let isMounted = true;
    const eth = typeof window !== 'undefined' ? window.ethereum : undefined;

    if (!eth) {
      return;
    }

    const initWalletState = async () => {
      try {
        const [accounts, currentChain] = await Promise.all([
          eth.request({ method: 'eth_accounts' }) as Promise<string[]>,
          eth.request({ method: 'eth_chainId' }) as Promise<string>,
        ]);

        if (!isMounted) return;
        setHasProvider(true);

        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          onAddressChange?.(accounts[0]);
        }

        if (currentChain) {
          setChainId(currentChain);
          checkNetwork(currentChain);
        }
      } catch {
        if (isMounted) {
          setHasProvider(true);
        }
      }
    };

    initWalletState();

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

    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);

    return () => {
      isMounted = false;
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
      eth.removeListener?.('chainChanged', handleChainChanged);
    };
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

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    setErrorMsg(null);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Sepolia',
                nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia-rpc.publicnode.com'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError: unknown) {
          const msg = addError instanceof Error ? addError.message : 'Failed to add Sepolia testnet';
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
    if (!id) return 'Unknown';
    const dec = parseInt(id, 16);
    if (dec === 11155111 || id === SEPOLIA_CHAIN_ID_HEX) return 'Sepolia';
    if (dec === 84532) return 'Base Sepolia';
    if (dec === 1) return 'Mainnet';
    if (dec === 8453) return 'Base';
    return `ID: ${dec || id}`;
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {!hasProvider ? (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 bg-[#141414] hover:bg-[#202020] border border-[#2a2a2a] text-[#ee86bd] rounded-full font-mono text-[11px] transition whitespace-nowrap"
          title="Install MetaMask to connect a testnet wallet"
        >
          Install MetaMask
        </a>
      ) : !address ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="px-3 py-1.5 bg-[#141414] hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-[#ccff4d] text-[#f4f4f0] rounded-full font-medium transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
          title="Connect MetaMask (Ethereum Sepolia testnet only)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#9a9a94]" />
          <span>{isConnecting ? 'Connecting...' : 'Connect wallet'}</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] border border-[#2a2a2a] rounded-full font-mono text-xs whitespace-nowrap"
            title={`Connected to ${getNetworkName(chainId)}. Testnet only.`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSepolia ? 'bg-[#ccff4d] shadow-[0_0_6px_#ccff4d]' : 'bg-[#ee86bd]'
              }`}
            />
            <span className="text-[#f4f4f0]">{shortenAddress(address)}</span>
            <span className="text-[#888888] text-[10px]">({getNetworkName(chainId)})</span>
          </div>

          {!isSepolia && (
            <button
              onClick={switchToSepolia}
              className="px-2.5 py-1 bg-[#ee86bd]/15 hover:bg-[#ee86bd]/25 border border-[#ee86bd] text-[#ee86bd] rounded-full font-semibold text-[11px] transition cursor-pointer whitespace-nowrap"
            >
              Switch to Sepolia
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <span className="text-[#ee86bd] text-[11px] font-mono whitespace-nowrap" title={errorMsg}>
          {errorMsg.slice(0, 30)}...
        </span>
      )}

      {showDisclaimer && (
        <span className="text-[10px] text-[#9a9a94] italic tracking-tight whitespace-nowrap">
          Testnet only.
        </span>
      )}
    </div>
  );
}
