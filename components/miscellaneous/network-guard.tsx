// components/NetworkGuard.tsx
"use client"
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useState } from 'react';
import { ButtonWrapper } from '../ui/button';

const GRAPHITE_TESTNET_ID = 54170;

export const NetworkGuard = ({ children }: { children: React.ReactNode }) => {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const [switching, setSwitching] = useState(false);

  const handleSwitchNetwork = async () => {
    setSwitching(true);
    try {
      await switchChain({ chainId: GRAPHITE_TESTNET_ID });
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setSwitching(false);
    }
  };

  // Show warning if connected but on wrong network
  if (isConnected && chainId !== GRAPHITE_TESTNET_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-poppins">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-black-500 border border-black-300 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4">
              Wrong Network
            </h2>
            <p className="text-gray-300 mb-6">
              Graphite DNS is only available on Graphite Testnet. Please switch networks to continue.
            </p>
            <div className="space-y-3">
              {/* <p className="text-sm text-gray-400">
                Current: <span className="text-red-400">{chainId}</span>
              </p> */}
              <p className="text-sm text-gray-400">
                Required: <span className="text-primary">{GRAPHITE_TESTNET_ID} (Graphite Testnet)</span>
              </p>
            </div>
            <ButtonWrapper
              onClick={handleSwitchNetwork}
              disabled={switching}
              className="mt-6 bg-primary hover:desktop:bg-primary/80 disabled:bg-gray-600 text-black-600 px-6 py-2 rounded-lg transition-colors"
            >
              {switching ? 'Switching...' : 'Switch to Graphite Testnet'}
            </ButtonWrapper>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};