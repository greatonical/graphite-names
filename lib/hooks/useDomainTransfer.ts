// lib/hooks/useDomainTransfer.ts
"use client";

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseAbi, encodeFunctionData } from 'viem';

// CHANGES: Updated ABI with correct function names from actual contract
const REGISTRY_ABI = parseAbi([
  'function nodeToToken(bytes32 node) view returns (uint256)',
  'function transferNode(bytes32 node, address to)',
  'function getDomain(bytes32 node) view returns (address owner, address resolver, uint64 expiry, bytes32 parent)',
  'function transferWithSig(bytes32 node, address from, address to, uint256 nonce, uint256 deadline, bytes calldata signature)',
  'function nonces(address account) view returns (uint256)',
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

  // CHANGES: Updated to use the correct transferNode function
  const transferWithGraphite = async (node: string, to: string) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    // Verify we own the domain
    const domainInfo = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'getDomain',
      args: [node as `0x${string}`],
    });

    const currentOwner = domainInfo[0];
    if (currentOwner.toLowerCase() !== address.toLowerCase()) {
      throw new Error('You do not own this domain');
    }

    // CHANGES: Use transferNode function directly
    const callData = encodeFunctionData({
      abi: REGISTRY_ABI,
      functionName: 'transferNode',
      args: [node as `0x${string}`, to as `0x${string}`],
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

    // Verify we own the domain
    const domainInfo = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'getDomain',
      args: [node as `0x${string}`],
    });

    const currentOwner = domainInfo[0];
    if (currentOwner.toLowerCase() !== address.toLowerCase()) {
      throw new Error('You do not own this domain');
    }

    // CHANGES: Use transferNode function directly
    const txHash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'transferNode',
      args: [node as `0x${string}`, to as `0x${string}`],
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