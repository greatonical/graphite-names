// lib/hooks/useDomainExtension.ts
"use client";

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseAbi, encodeFunctionData } from 'viem';

const REGISTRY_ABI = parseAbi([
  'function priceOf(string label) view returns (uint256)',
  'function renew(string label, uint64 duration) payable',
  'function extendRegistration(string label, uint64 duration) payable',
]);

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

export function useDomainExtension() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUsingGraphiteWallet = () => {
    return typeof window !== 'undefined' && !!window.graphite;
  };

  const getExtensionPrice = async (label: string, durationSeconds: number): Promise<bigint> => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    try {
      // Get base price for the domain
      const basePrice = await publicClient.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'priceOf',
        args: [label],
      });

      // Calculate total price based on duration (price is per year, so multiply by years)
      const years = BigInt(Math.ceil(durationSeconds / (365 * 24 * 60 * 60)));
      const totalPrice = basePrice * years;

      return totalPrice;
    } catch (err) {
      console.error('Error getting extension price:', err);
      throw new Error('Failed to get extension price');
    }
  };

  const extendWithGraphite = async (label: string, durationSeconds: number, price: bigint) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // Encode extension function call
    const callData = encodeFunctionData({
      abi: REGISTRY_ABI,
      functionName: 'extendRegistration',
      args: [label, BigInt(durationSeconds)],
    });

    // Send transaction via Graphite wallet
    const txHash = await window.graphite?.sendTx({
      to: REGISTRY_ADDRESS,
      value: `0x${price.toString(16)}`,
      data: callData,
      gas: '0x186A0', // 100,000 gas
    });

    return txHash;
  };

  const extendWithWagmi = async (label: string, durationSeconds: number, price: bigint) => {
    if (!address || !walletClient) {
      throw new Error('Wallet not connected');
    }

    // Execute extension
    const txHash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'extendRegistration',
      args: [label, BigInt(durationSeconds)],
      value: price,
    });

    return txHash;
  };

  const extendDomain = async (label: string, durationSeconds: number, price: bigint) => {
    if (!address) {
      throw new Error('Please connect your wallet');
    }

    setLoading(true);
    setError(null);

    try {
      let txHash: string;

      if (isUsingGraphiteWallet()) {
        txHash = await extendWithGraphite(label, durationSeconds, price) ?? "";
      } else {
        txHash = await extendWithWagmi(label, durationSeconds, price);
      }

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });
      }

      return txHash;
    } catch (err: any) {
      const errorMessage = err?.message || 'Extension failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    getExtensionPrice,
    extendDomain,
    loading,
    error,
  };
}