// lib/hooks/useSubdomainAvailability.ts
"use client";

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseAbi, encodeFunctionData, keccak256, toHex } from 'viem';

const SUBDOMAIN_ABI = parseAbi([
  'function priceOfSubdomain(bytes32 parentNode, string label) view returns (uint256)',
  'function buySubdomainFixedPrice(bytes32 parentNode, string label, address resolver_, uint64 duration) payable returns (bytes32)',
]);

const REGISTRY_ABI = parseAbi([
  'function isAvailable(bytes32 node) view returns (bool)',
]);

const SUBDOMAIN_ADDRESS = process.env.NEXT_PUBLIC_SUBDOMAIN_ADDRESS as `0x${string}`;
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;
const RESOLVER_ADDRESS = process.env.NEXT_PUBLIC_RESOLVER_ADDRESS as `0x${string}`;

interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
}

export function useSubdomainAvailability() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [price, setPrice] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSubdomainNode = (label: string, parentNode: string): `0x${string}` => {
    const labelHash = keccak256(toHex(label));
    return keccak256(`0x${parentNode.slice(2)}${labelHash.slice(2)}` as `0x${string}`);
  };

  const isUsingGraphiteWallet = () => {
    return typeof window !== 'undefined' && !!window.graphite;
  };

  const checkAvailability = useCallback(async (label: string, parentNode: string) => {
    if (!publicClient) {
      setError('Public client not available');
      return;
    }

    setLoading(true);
    setError(null);
    setAvailability(null);
    setPrice(null);

    try {
      // Generate subdomain node
      const subdomainNode = generateSubdomainNode(label, parentNode);

      // Check if subdomain is available
      const isAvailable = await publicClient.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'isAvailable',
        args: [subdomainNode],
      });

      setAvailability(isAvailable);

      if (isAvailable) {
        try {
          // Get subdomain price from SubdomainRegistrar
          const subdomainPrice = await publicClient.readContract({
            address: SUBDOMAIN_ADDRESS,
            abi: SUBDOMAIN_ABI,
            functionName: 'priceOfSubdomain',
            args: [parentNode as `0x${string}`, label],
          });

          setPrice(subdomainPrice);
        } catch (priceError: any) {
          // CHANGES: Handle "Price not set" error gracefully
          console.log('Subdomain price error:', priceError);
          
          if (priceError.message?.includes('Price not set') || 
              priceError.message?.includes('execution reverted')) {
            // Price not set by parent domain owner - subdomain creation not enabled
            setError('Subdomain creation is not enabled for this domain. The domain owner needs to set a price first.');
            setAvailability(false);
          } else {
            setError('Failed to get subdomain price');
          }
          setPrice(null);
        }
      }
    } catch (err) {
      console.error('Error checking subdomain availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  const purchaseWithGraphite = async (
    label: string,
    parentNode: string,
    duration: number,
    totalPrice: bigint
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const callData = encodeFunctionData({
      abi: SUBDOMAIN_ABI,
      functionName: 'buySubdomainFixedPrice',
      args: [
        parentNode as `0x${string}`,
        label,
        RESOLVER_ADDRESS,
        BigInt(duration)
      ],
    });

    const txHash = await window.graphite?.sendTx({
      to: SUBDOMAIN_ADDRESS,
      value: totalPrice > 0 ? `0x${totalPrice.toString(16)}` : '0x0',
      data: callData,
      gas: '0x186A0', // 100,000 gas
    });

    return txHash;
  };

  const purchaseWithWagmi = async (
    label: string,
    parentNode: string,
    duration: number,
    totalPrice: bigint
  ) => {
    if (!address || !walletClient) {
      throw new Error('Wallet not connected');
    }

    const txHash = await walletClient.writeContract({
      address: SUBDOMAIN_ADDRESS,
      abi: SUBDOMAIN_ABI,
      functionName: 'buySubdomainFixedPrice',
      args: [
        parentNode as `0x${string}`,
        label,
        RESOLVER_ADDRESS,
        BigInt(duration)
      ],
      value: totalPrice,
    });

    return txHash;
  };

  const purchaseSubdomain = useCallback(async (
    label: string,
    parentDomain: Domain,
    durationYears: number = 1
  ) => {
    if (!address) {
      throw new Error('Please connect your wallet');
    }

    if (!price) {
      throw new Error('Price not available');
    }

    setLoading(true);
    setError(null);

    try {
      const durationSeconds = durationYears * 365 * 24 * 60 * 60;
      const totalPrice = price * BigInt(durationYears);

      let txHash: string;

      if (isUsingGraphiteWallet()) {
        txHash = await purchaseWithGraphite(label, parentDomain.node, durationSeconds, totalPrice) ?? "";
      } else {
        txHash = await purchaseWithWagmi(label, parentDomain.node, durationSeconds, totalPrice);
      }

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });
      }

      // Reset state after successful purchase
      setAvailability(null);
      setPrice(null);

      return txHash;
    } catch (err: any) {
      const errorMessage = err?.message || 'Subdomain purchase failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address, price, publicClient]);

  return {
    checkAvailability,
    purchaseSubdomain,
    availability,
    price,
    loading,
    error,
  };
}