// lib/hooks/useSubdomainPricing.ts
"use client";

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseAbi, encodeFunctionData, parseEther } from 'viem';

const SUBDOMAIN_ABI = parseAbi([
  'function setSubdomainPrice(bytes32 parentNode, string label, uint256 price)',
  'function priceOfSubdomain(bytes32 parentNode, string label) view returns (uint256)',
]);

const SUBDOMAIN_ADDRESS = process.env.NEXT_PUBLIC_SUBDOMAIN_ADDRESS as `0x${string}`;

export function useSubdomainPricing() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUsingGraphiteWallet = () => {
    return typeof window !== 'undefined' && !!window.graphite;
  };

  const setSubdomainPriceWithGraphite = async (
    parentNode: string,
    priceInEther: string
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const priceWei = parseEther(priceInEther);

    // For setting a global price, we use "*" as the label wildcard
    const callData = encodeFunctionData({
      abi: SUBDOMAIN_ABI,
      functionName: 'setSubdomainPrice',
      args: [parentNode as `0x${string}`, "*", priceWei],
    });

    const txHash = await window.graphite?.sendTx({
      to: SUBDOMAIN_ADDRESS,
      data: callData,
      gas: '0x186A0', // 100,000 gas
    });

    return txHash;
  };

  const setSubdomainPriceWithWagmi = async (
    parentNode: string,
    priceInEther: string
  ) => {
    if (!address || !walletClient) {
      throw new Error('Wallet not connected');
    }

    const priceWei = parseEther(priceInEther);

    const txHash = await walletClient.writeContract({
      address: SUBDOMAIN_ADDRESS,
      abi: SUBDOMAIN_ABI,
      functionName: 'setSubdomainPrice',
      args: [parentNode as `0x${string}`, "*", priceWei],
    });

    return txHash;
  };

  const setSubdomainPrice = async (parentNode: string, priceInEther: string) => {
    if (!address) {
      throw new Error('Please connect your wallet');
    }

    if (!priceInEther || parseFloat(priceInEther) < 0) {
      throw new Error('Please enter a valid price');
    }

    setLoading(true);
    setError(null);

    try {
      let txHash: string;

      if (isUsingGraphiteWallet()) {
        txHash = await setSubdomainPriceWithGraphite(parentNode, priceInEther)?? "";
      } else {
        txHash = await setSubdomainPriceWithWagmi(parentNode, priceInEther);
      }

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });
      }

      return txHash;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to set subdomain price';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSubdomainPrice = async (parentNode: string): Promise<bigint | null> => {
    if (!publicClient) {
      return null;
    }

    try {
      const price = await publicClient.readContract({
        address: SUBDOMAIN_ADDRESS,
        abi: SUBDOMAIN_ABI,
        functionName: 'priceOfSubdomain',
        args: [parentNode as `0x${string}`, "*"],
      });

      return price;
    } catch (err) {
      // Price not set
      return null;
    }
  };

  return {
    setSubdomainPrice,
    getSubdomainPrice,
    loading,
    error,
  };
}