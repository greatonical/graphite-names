// lib/hooks/useDomainExtension.ts
"use client";

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseAbi, encodeFunctionData } from 'viem';
import toast from 'react-hot-toast';
import { style } from '../constants/style.constants';

const REGISTRY_ABI = parseAbi([
  'function priceOf(string label) view returns (uint256)',
  'function renew(string label, uint64 duration) payable',
  'function extendRegistration(string label, uint64 duration) payable',
]);

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

export function useDomainExtension() {
  const { address, connector } = useAccount(); // CHANGED: Added connector from useAccount
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CHANGED: Proper wallet detection using wagmi connector
  const isUsingGraphiteWallet = () => {
    if (typeof window === 'undefined' || !window.graphite || !connector) {
      return false;
    }
    
    // Check the actual connected connector
    const connectorId = connector.id;
    const connectorName = connector.name?.toLowerCase() || '';
    
    console.log('🔍 Domain Extension - Wallet detection:', {
      connectorId,
      connectorName,
      hasGraphiteWindow: !!window.graphite,
      currentAddress: address
    });
    
    // Return true only if we're actually connected via Graphite connector
    return connectorId === 'graphite' || connectorName.includes('graphite');
  };

  const getExtensionPrice = async (label: string, durationSeconds: number): Promise<bigint> => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    try {
      console.log('💰 Getting extension price for:', { label, durationSeconds });
      
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

      console.log('💰 Extension price calculated:', {
        basePrice: basePrice.toString(),
        years: years.toString(),
        totalPrice: totalPrice.toString()
      });

      return totalPrice;
    } catch (err) {
      console.error('Error getting extension price:', err);
      throw new Error('Failed to get extension price');
    }
  };

  // CHANGED: Updated Graphite wallet method with better error handling
  const extendWithGraphite = async (label: string, durationSeconds: number, price: bigint) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    console.log('🟣 Graphite extension - extending domain...', {
      label,
      durationSeconds,
      price: price.toString(),
      address
    });

    // Encode extension function call
    const callData = encodeFunctionData({
      abi: REGISTRY_ABI,
      functionName: 'extendRegistration',
      args: [label, BigInt(durationSeconds)],
    });

    console.log('🟣 Graphite extension - sending transaction...', {
      to: REGISTRY_ADDRESS,
      value: `0x${price.toString(16)}`,
      dataLength: callData.length
    });

    // Send transaction via Graphite wallet
    const txHash = await window.graphite?.sendTx({
      to: REGISTRY_ADDRESS,
      value: `0x${price.toString(16)}`,
      data: callData,
      gas: '0x186A0', // 100,000 gas
    });

    console.log('🟣 Graphite extension - transaction sent:', txHash);
    return txHash;
  };

  // CHANGED: Updated wagmi method with better error handling
  const extendWithWagmi = async (label: string, durationSeconds: number, price: bigint) => {
    if (!address || !walletClient) {
      throw new Error('Wallet not connected');
    }

    console.log('🔵 MetaMask extension - extending domain...', {
      label,
      durationSeconds,
      price: price.toString(),
      address
    });

    console.log('🔵 MetaMask extension - sending transaction...', {
      contract: REGISTRY_ADDRESS,
      function: 'extendRegistration'
    });

    // Execute extension
    const txHash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'extendRegistration',
      args: [label, BigInt(durationSeconds)],
      value: price,
    });

    console.log('🔵 MetaMask extension - transaction sent:', txHash);
    return txHash;
  };

  const extendDomain = async (label: string, durationSeconds: number, price: bigint) => {
    if (!address) {
      throw new Error('Please connect your wallet');
    }

    console.log('🚀 Starting domain extension:', { 
      label, 
      durationSeconds, 
      price: price.toString(),
      wallet: isUsingGraphiteWallet() ? 'Graphite' : 'MetaMask' 
    });

    setLoading(true);
    setError(null);

    try {
      let txHash: string;

      // CHANGED: Better wallet detection and routing
      if (isUsingGraphiteWallet()) {
        console.log('📱 Using Graphite Wallet for domain extension');
        txHash = await extendWithGraphite(label, durationSeconds, price) ?? "";
      } else {
        console.log('🦊 Using MetaMask/Standard wallet for domain extension');
        txHash = await extendWithWagmi(label, durationSeconds, price);
      }

      console.log('✅ Domain extension transaction submitted:', txHash);

      // CHANGED: Wait for transaction confirmation
      if (publicClient && txHash) {
        console.log('⏳ Waiting for transaction confirmation...');
        await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });
        console.log('✅ Transaction confirmed!');
          const confirmId = `confirm-${txHash}`;
        toast.success("🎉 Domain extended", {
          id: confirmId,
          style: style.toast,
          duration: 6000,
        });
      }

      return txHash;
    } catch (err: any) {
      console.error('❌ Domain extension failed:', err);
      
      // CHANGED: Better error message handling
      let errorMessage = 'Extension failed';
      
      if (err?.message) {
        const msg = err.message.toLowerCase();
        if (msg.includes('user rejected') || msg.includes('denied')) {
          errorMessage = 'Transaction cancelled by user';
        } else if (msg.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for extension cost and gas fees';
        } else if (msg.includes('not owner') || msg.includes('unauthorized')) {
          errorMessage = 'You are not the owner of this domain';
        } else if (msg.includes('expired') || msg.includes('grace period')) {
          errorMessage = 'Domain is in grace period or has expired';
        } else if (msg.includes('max registration')) {
          errorMessage = 'Extension would exceed maximum registration period';
        } else {
          errorMessage = err.message;
        }
      }
      
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