// lib/hooks/useSubdomainAvailability.ts - Debug Version
"use client";

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatEther, keccak256, toBytes, concat, parseAbi, encodeFunctionData } from 'viem';

// Contract addresses
const SUBDOMAIN_ADDRESS = process.env.NEXT_PUBLIC_SUBDOMAIN_ADDRESS as `0x${string}`;
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;
const RESOLVER_ADDRESS = process.env.NEXT_PUBLIC_RESOLVER_ADDRESS as `0x${string}`;
const TLD_NODE = '0xdb6d6f1b63164285dbeecc46029ccea362278e6a391a29fb0fe4337ec0e6f5fd' as `0x${string}`;

// ABIs
const SUBDOMAIN_ABI = parseAbi([
  'function priceOfSubdomain(bytes32 parentNode, string label) view returns (uint256)',
  'function buySubdomainFixedPrice(bytes32 parentNode, string label, address resolver_, uint64 duration) payable returns (bytes32)',
]);

const REGISTRY_ABI = parseAbi([
  'function isAvailable(bytes32 node) view returns (bool)',
]);

export interface SubdomainResult {
  subdomain: string;
  parentDomain: string;
  fullName: string;
  isAvailable: boolean;
  price: bigint;
  priceInEth: string;
  isLoading: boolean;
  error: string | null;
  subdomainNode?: `0x${string}`;
  parentNode?: `0x${string}`;
}

export const useSubdomainAvailability = () => {
  const [searchedSubdomain, setSearchedSubdomain] = useState<{
    subdomain: string;
    parentDomain: string;
  } | null>(null);

  const { address, isConnected, connector } = useAccount();
  
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ 
    hash,
  });

  // Helper function to create node hash
  const makeNode = useCallback((parent: `0x${string}`, label: string): `0x${string}` => {
    const labelHash = keccak256(toBytes(label));
    return keccak256(concat([parent, labelHash]));
  }, []);

  // Calculate nodes
  const parentNode = searchedSubdomain ? makeNode(TLD_NODE, searchedSubdomain.parentDomain) : undefined;
  const subdomainNode = searchedSubdomain && parentNode ? makeNode(parentNode, searchedSubdomain.subdomain) : undefined;

  // ENHANCED: Better logging for debugging
  console.log('🔍 Debug - Subdomain availability state:', {
    searchedSubdomain,
    parentNode,
    subdomainNode,
    contractAddresses: {
      subdomain: SUBDOMAIN_ADDRESS,
      registry: REGISTRY_ADDRESS,
      tldNode: TLD_NODE
    }
  });

  // Check subdomain price with enhanced error handling
  const { 
    data: price, 
    isLoading: priceLoading, 
    error: priceError,
    refetch: refetchPrice
  } = useReadContract({
    address: SUBDOMAIN_ADDRESS,
    abi: SUBDOMAIN_ABI,
    functionName: 'priceOfSubdomain',
    args: searchedSubdomain && parentNode ? [parentNode, searchedSubdomain.subdomain] : undefined,
    query: {
      enabled: !!searchedSubdomain && !!parentNode,
    },
  });

  // Enhanced logging for price check
  console.log('💰 Debug - Price check result:', {
    price: price?.toString(),
    priceLoading,
    priceError: priceError?.message,
    enabled: !!searchedSubdomain && !!parentNode,
    args: searchedSubdomain && parentNode ? [parentNode, searchedSubdomain.subdomain] : undefined
  });

  // Check if subdomain is available
  const { 
    data: isAvailable, 
    isLoading: availabilityLoading,
    error: availabilityError,
    refetch: refetchAvailability
  } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'isAvailable',
    args: subdomainNode ? [subdomainNode] : undefined,
    query: {
      enabled: !!subdomainNode,
    },
  });

  // Enhanced logging for availability check
  console.log('✅ Debug - Availability check result:', {
    isAvailable,
    availabilityLoading,
    availabilityError: availabilityError?.message,
    enabled: !!subdomainNode,
    args: subdomainNode ? [subdomainNode] : undefined
  });

  const checkSubdomainAvailability = useCallback((subdomain: string, parentDomain: string) => {
    const cleanSubdomain = subdomain.trim().toLowerCase();
    const cleanParentDomain = parentDomain.trim().toLowerCase().replace('.atgraphite', '');
    
    console.log('🔍 Debug - Checking subdomain availability:', {
      originalInput: { subdomain, parentDomain },
      cleanedInput: { cleanSubdomain, cleanParentDomain },
      fullName: `${cleanSubdomain}.${cleanParentDomain}.atgraphite`
    });

    setSearchedSubdomain({
      subdomain: cleanSubdomain,
      parentDomain: cleanParentDomain
    });
  }, []);

  // Check if user is using Graphite wallet
  const isUsingGraphiteWallet = useCallback(() => {
    if (typeof window === 'undefined' || !window.graphite || !connector) {
      return false;
    }
    const connectorId = connector.id;
    const connectorName = connector.name?.toLowerCase() || '';
    return connectorId === 'graphite' || connectorName.includes('graphite');
  }, [connector]);

  // Purchase with Graphite wallet
  const purchaseWithGraphite = useCallback(async (
    subdomain: string,
    parentDomain: string,
    totalPrice: bigint,
    durationYears: number,
    resolverAddress?: `0x${string}`
  ) => {
    console.log('🟣 Debug - Graphite subdomain purchase:', {
      subdomain,
      parentDomain,
      totalPrice: totalPrice.toString(),
      durationYears,
      parentNode: parentNode?.toString()
    });

    if (!window.graphite || !parentNode) {
      throw new Error('Graphite Wallet not available or parent node not found');
    }

    const durationInSeconds = BigInt(durationYears * 365 * 24 * 60 * 60);
    const resolver = resolverAddress || RESOLVER_ADDRESS;
    
    const callData = encodeFunctionData({
      abi: SUBDOMAIN_ABI,
      functionName: 'buySubdomainFixedPrice',
      args: [parentNode, subdomain, resolver, durationInSeconds],
    });

    const txHash = await window.graphite.sendTx({
      to: SUBDOMAIN_ADDRESS,
      value: `0x${totalPrice.toString(16)}`,
      data: callData,
      gas: '0x186A0',
    });

    console.log('🟣 Debug - Graphite subdomain transaction sent:', txHash);
    return txHash;
  }, [parentNode]);

  // Purchase with standard wallet
  const purchaseWithWagmi = useCallback(async (
    subdomain: string,
    parentDomain: string,
    totalPrice: bigint,
    durationYears: number,
    resolverAddress?: `0x${string}`
  ) => {
    console.log('🔵 Debug - MetaMask subdomain purchase:', {
      subdomain,
      parentDomain,
      totalPrice: totalPrice.toString(),
      durationYears,
      parentNode: parentNode?.toString()
    });

    if (!isConnected || !address || !parentNode) {
      throw new Error('Wallet not connected or parent node not found');
    }

    const durationInSeconds = BigInt(durationYears * 365 * 24 * 60 * 60);
    const resolver = resolverAddress || RESOLVER_ADDRESS;
    
    const result = await writeContract({
      address: SUBDOMAIN_ADDRESS,
      abi: SUBDOMAIN_ABI,
      functionName: 'buySubdomainFixedPrice',
      args: [parentNode, subdomain, resolver, durationInSeconds],
      value: totalPrice,
    });

    console.log('🔵 Debug - MetaMask subdomain transaction submitted:', result);
    return result;
  }, [address, isConnected, writeContract, parentNode]);

  // Main purchase function
  const purchaseSubdomain = useCallback(async (
    subdomain: string,
    parentDomain: string,
    totalPrice: bigint,
    durationYears: number,
    resolverAddress?: `0x${string}`
  ) => {
    console.log('🚀 Debug - Purchase subdomain called:', {
      subdomain,
      parentDomain,
      totalPrice: totalPrice.toString(),
      durationYears,
      wallet: isUsingGraphiteWallet() ? 'Graphite' : 'MetaMask'
    });

    if (isUsingGraphiteWallet()) {
      return await purchaseWithGraphite(subdomain, parentDomain, totalPrice, durationYears, resolverAddress);
    } else {
      return await purchaseWithWagmi(subdomain, parentDomain, totalPrice, durationYears, resolverAddress);
    }
  }, [isUsingGraphiteWallet, purchaseWithGraphite, purchaseWithWagmi]);

  // Enhanced error message helper
  function getErrorMessage(priceError: any, availabilityError: any): string | null {
    const error = priceError || availabilityError;
    if (!error) return null;

    console.log('❌ Debug - Error details:', {
      error,
      message: error.message,
      cause: error.cause,
      shortMessage: error.shortMessage
    });

    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('subdomain not available') || message.includes('not available')) {
      return 'Subdomain pricing not enabled for this domain. Please enable subdomain pricing first.';
    }
    
    if (message.includes('no data') || message.includes('0x')) {
      return 'Network error: Please ensure you are connected to Graphite Testnet';
    }
    
    if (message.includes('contract function')) {
      return 'Contract not found: Please switch to Graphite Testnet';
    }
    
    if (message.includes('price not set')) {
      return 'Subdomain pricing not enabled for this domain';
    }
    
    return error.message || 'Unknown error occurred';
  }

  // Create subdomain result object
  const subdomainResult: SubdomainResult | null = searchedSubdomain ? {
    subdomain: searchedSubdomain.subdomain,
    parentDomain: searchedSubdomain.parentDomain,
    fullName: `${searchedSubdomain.subdomain}.${searchedSubdomain.parentDomain}.atgraphite`,
    isAvailable: isAvailable ?? false,
    price: price ?? 0n,
    priceInEth: price ? formatEther(price) : '0',
    isLoading: priceLoading || availabilityLoading,
    error: getErrorMessage(priceError, availabilityError),
    subdomainNode,
    parentNode,
  } : null;

  console.log('📊 Debug - Final subdomain result:', subdomainResult);

  const purchaseError = writeError || receiptError;

  return {
    subdomainResult,
    isSearching: priceLoading || availabilityLoading,
    checkSubdomainAvailability,
    purchaseSubdomain,
    isPurchasing: isPending,
    isConfirming,
    isSuccess,
    purchaseError,
    txHash: hash,
  };
};