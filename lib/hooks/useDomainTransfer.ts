// lib/hooks/useDomainTransfer.ts
"use client";

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseAbi, encodeFunctionData } from 'viem';

const REGISTRY_ABI = parseAbi([
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function nodeToTokenId(bytes32 node) view returns (uint256)',
]);

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

export function useDomainTransfer() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUsingGraphiteWallet = () => {
    return typeof window !== 'undefined' && !!window.graphite;
  };

  const transferWithGraphite = async (node: string, to: string) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    // Get token ID from node
    const tokenId = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'nodeToTokenId',
      args: [node as `0x${string}`],
    });

    // Encode transfer function call
    const callData = encodeFunctionData({
      abi: REGISTRY_ABI,
      functionName: 'safeTransferFrom',
      args: [address, to as `0x${string}`, tokenId],
    });

    // Send transaction via Graphite wallet
    const txHash = await window.graphite?.sendTx({
      to: REGISTRY_ADDRESS,
      data: callData,
      gas: '0x186A0', // 100,000 gas
    });

    return txHash;
  };

  const transferWithWagmi = async (node: string, to: string) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error('Wallet not connected');
    }

    // Get token ID from node
    const tokenId = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'nodeToTokenId',
      args: [node as `0x${string}`],
    });

    // Execute transfer
    const txHash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'safeTransferFrom',
      args: [address, to as `0x${string}`, tokenId],
    });

    return txHash;
  };

  const transferDomain = async (node: string, to: string) => {
    if (!address) {
      throw new Error('Please connect your wallet');
    }

    if (!to.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid recipient address');
    }

    if (to.toLowerCase() === address.toLowerCase()) {
      throw new Error('Cannot transfer to yourself');
    }

    setLoading(true);
    setError(null);

    try {
      let txHash: string;

      if (isUsingGraphiteWallet()) {
        txHash = await transferWithGraphite(node, to) ?? "";
      } else {
        txHash = await transferWithWagmi(node, to);
      }

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });
      }

      return txHash;
    } catch (err: any) {
      const errorMessage = err?.message || 'Transfer failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    transferDomain,
    loading,
    error,
  };
}