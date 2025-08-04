// lib/hooks/useDomainAvailability.ts - Fixed for Balance Issue
import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatEther, keccak256, toBytes, concat, encodeFunctionData, parseAbi } from 'viem';

// Your deployed contract addresses
const REGISTRY_ADDRESS = '0xC3682c6be995e239D83fAa3a30037390c1c444E5' as `0x${string}`;
const RESOLVER_ADDRESS = '0x0f9B77b3C4482093156300606Bef326424897b3a' as `0x${string}`;
const TLD_NODE = '0xdb6d6f1b63164285dbeecc46029ccea362278e6a391a29fb0fe4337ec0e6f5fd' as `0x${string}`;

// ABI matching your exact contract
const REGISTRY_ABI = parseAbi([
  'function priceOf(string label) view returns (uint256)',
  'function isAvailable(bytes32 node) view returns (bool)',
  'function buyFixedPrice(string label, address resolver_, uint64 duration) payable returns (bytes32)',
]);

export interface DomainResult {
  domain: string;
  isAvailable: boolean;
  price: bigint;
  priceInEth: string;
  isLoading: boolean;
  error: string | null;
  node?: `0x${string}`;
}

interface GraphiteTxState {
  isPending: boolean;
  hash?: string;
  error?: Error;
  isSuccess?: boolean;
}

export const useDomainAvailability = () => {
  const [searchedDomain, setSearchedDomain] = useState<string>('');
  const [graphiteTxState, setGraphiteTxState] = useState<GraphiteTxState>({ 
    isPending: false,
    isSuccess: false 
  });
  
  const { address, isConnected, connector } = useAccount();
  
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: wagmiSuccess, error: receiptError } = useWaitForTransactionReceipt({ 
    hash,
  });

  // Create node hash
  const makeNode = useCallback((parent: `0x${string}`, label: string): `0x${string}` => {
    const labelHash = keccak256(toBytes(label));
    return keccak256(concat([parent, labelHash]));
  }, []);

  const domainNode = searchedDomain ? makeNode(TLD_NODE, searchedDomain) : undefined;

  // Get price for the domain
  const { 
    data: price, 
    isLoading: priceLoading, 
    error: priceError,
    refetch: refetchPrice
  } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'priceOf',
    args: searchedDomain ? [searchedDomain] : undefined,
    query: {
      enabled: !!searchedDomain,
    },
  });

  // Check if domain is available
  const { 
    data: isAvailable, 
    isLoading: availabilityLoading,
    error: availabilityError,
    refetch: refetchAvailability
  } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'isAvailable',
    args: domainNode ? [domainNode] : undefined,
    query: {
      enabled: !!domainNode,
    },
  });

  const checkDomainAvailability = useCallback((domain: string) => {
    const cleanDomain = domain.trim().toLowerCase();
    setSearchedDomain(cleanDomain);
    // Reset previous transaction state
    setGraphiteTxState({ isPending: false, isSuccess: false });
  }, []);

  // Check if user is using Graphite wallet
  const isUsingGraphiteWallet = useCallback(() => {
    return connector?.id === 'graphite' && typeof window !== 'undefined' && !!window.graphite;
  }, [connector]);

  // Purchase with Graphite wallet directly - FIXED BALANCE CHECK
  const purchaseWithGraphite = useCallback(async (
    domain: string,
    totalPrice: bigint,
    durationYears: number,
    resolverAddress?: `0x${string}`
  ) => {
    console.log('🔥 Starting Graphite purchase:', {
      domain,
      totalPrice: totalPrice.toString(),
      durationYears,
      resolverAddress,
      registryAddress: REGISTRY_ADDRESS
    });

    if (!window.graphite) {
      throw new Error('Graphite Wallet not available');
    }

    setGraphiteTxState({ isPending: true, isSuccess: false });

    try {
      // 1. Ensure wallet is enabled
      const isEnabled = await window.graphite.isEnabled();
      if (!isEnabled) {
        console.log('📱 Enabling Graphite wallet...');
        await window.graphite.enable();
      }

      // 2. Check and switch network if needed
      const currentNetwork = await window.graphite.getActiveNetwork();
      console.log('🌐 Current network:', currentNetwork);
      
      if (currentNetwork !== 'testnet') {
        console.log('🔄 Switching to testnet...');
        await window.graphite.changeActiveNetwork('testnet');
      }

      // 3. Get current address and balance - FIXED BALANCE HANDLING
      const graphiteAddress = await window.graphite.getAddress();
      console.log('💰 Graphite address:', graphiteAddress);
      
      // CHANGES: Skip balance check or make it more flexible
      try {
        const balance = await window.graphite.getBalance();
        console.log('💰 Raw balance response:', balance, typeof balance);
        
        // CHANGES: Try to parse balance but don't fail if it's wrong
        let balanceWei: bigint;
        try {
          if (typeof balance === 'string') {
            balanceWei = BigInt(balance);
          } else if (typeof balance === 'number') {
            balanceWei = BigInt(Math.floor(balance));
          } else if (typeof balance === 'object' && balance !== null) {
            // Handle object responses
            const balObj = balance as any;
            if (balObj.value) {
              balanceWei = BigInt(balObj.value);
            } else if (balObj.wei) {
              balanceWei = BigInt(balObj.wei);
            } else if (balObj.balance) {
              balanceWei = BigInt(balObj.balance);
            } else {
              throw new Error('Unknown balance object format');
            }
          } else {
            throw new Error('Unknown balance format');
          }
          
          console.log('💰 Parsed balance:', balanceWei.toString(), 'wei');
          console.log('💰 Required:', totalPrice.toString(), 'wei');
          console.log('💰 Balance in @G:', formatEther(balanceWei));
          console.log('💰 Required in @G:', formatEther(totalPrice));
          
          // CHANGES: Add buffer for gas costs
          const gasBuffer = BigInt('100000000000000000'); // 0.1 @G buffer for gas
          const requiredWithBuffer = totalPrice + gasBuffer;
          
          if (balanceWei < requiredWithBuffer) {
            console.warn('⚠️ Balance might be insufficient (including gas buffer)');
            console.log('💰 Available:', formatEther(balanceWei), '@G');
            console.log('💰 Required (with gas):', formatEther(requiredWithBuffer), '@G');
            // Don't throw error, let the transaction fail naturally
          }
        } catch (balanceParseError) {
          console.warn('⚠️ Could not parse balance, skipping balance check:', balanceParseError);
          // Continue without balance check
        }
      } catch (balanceError) {
        console.warn('⚠️ Could not get balance, skipping balance check:', balanceError);
        // Continue without balance check - let wallet handle it
      }

      // 4. Prepare transaction data
      const durationInSeconds = BigInt(durationYears * 365 * 24 * 60 * 60);
      const resolver = resolverAddress || RESOLVER_ADDRESS;
      
      // Encode the function call data
      const callData = encodeFunctionData({
        abi: REGISTRY_ABI,
        functionName: 'buyFixedPrice',
        args: [domain, resolver, durationInSeconds],
      });
      
      const txParams = {
        to: REGISTRY_ADDRESS,
        value: `0x${totalPrice.toString(16)}`,
        data: callData,
        gas: '0x2DC6C0' // Your increased gas limit
      };

      console.log('📦 Final transaction params:', {
        to: txParams.to,
        value: txParams.value,
        gas: txParams.gas,
        dataLength: callData.length,
        decodedArgs: [domain, resolver, durationInSeconds.toString()],
        priceInEth: formatEther(totalPrice)
      });

      // 5. Send transaction using Graphite's sendTx method
      console.log('📤 Sending transaction to Graphite wallet...');
      const txHash = await window.graphite.sendTx(txParams);
      
      console.log('✅ Graphite transaction sent:', txHash);
      
      setGraphiteTxState({ 
        isPending: false, 
        hash: txHash,
        isSuccess: true
      });
      
      // Wait a moment then refresh domain availability
      setTimeout(() => {
        refetchAvailability();
        refetchPrice();
      }, 3000);
      
      return txHash;

    } catch (error: any) {
      console.error('❌ Graphite purchase failed:', error);
      console.error('❌ Error details:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        data: error?.data
      });
      
      // CHANGES: Better error messages
      let errorMessage = 'Purchase failed. Please try again.';
      
      if (error?.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('insufficient funds') || msg.includes('insufficient balance')) {
          errorMessage = 'Insufficient @G balance. Please check your wallet balance and try again.';
        } else if (msg.includes('user rejected') || msg.includes('denied')) {
          errorMessage = 'Transaction cancelled by user';
        } else if (msg.includes('gas')) {
          errorMessage = 'Gas estimation failed. Please try again.';
        } else if (msg.includes('nonce')) {
          errorMessage = 'Nonce error. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      const finalError = new Error(errorMessage);
      
      setGraphiteTxState({ 
        isPending: false, 
        error: finalError,
        isSuccess: false
      });
      
      throw finalError;
    }
  }, [refetchAvailability, refetchPrice]);

  // Standard wagmi purchase (for MetaMask and other wallets)
  const purchaseWithWagmi = useCallback(async (
    domain: string, 
    totalPrice: bigint, 
    durationYears: number,
    resolverAddress?: `0x${string}`
  ) => {
    console.log('🦊 Starting MetaMask/Standard purchase:', {
      domain,
      totalPrice: totalPrice.toString(),
      durationYears,
      resolverAddress
    });

    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    const durationInSeconds = BigInt(durationYears * 365 * 24 * 60 * 60);
    const resolver = resolverAddress || RESOLVER_ADDRESS;
    
    const result = await writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'buyFixedPrice',
      args: [domain, resolver, durationInSeconds],
      value: totalPrice,
    });

    console.log('✅ Wagmi transaction submitted:', result);
    return result;
  }, [address, isConnected, writeContract]);

  // Main purchase function that chooses the right method
  const purchaseDomain = useCallback(async (
    domain: string, 
    totalPrice: bigint, 
    durationYears: number,
    resolverAddress?: `0x${string}`
  ) => {
    console.log('🚀 Purchase domain called:', {
      domain,
      totalPrice: totalPrice.toString(),
      durationYears,
      resolverAddress,
      isUsingGraphite: isUsingGraphiteWallet(),
      connectorId: connector?.id
    });

    // Reset any previous errors
    setGraphiteTxState(prev => ({ ...prev, error: undefined }));

    if (isUsingGraphiteWallet()) {
      console.log('📱 Using Graphite wallet method');
      return await purchaseWithGraphite(domain, totalPrice, durationYears, resolverAddress);
    } else {
      console.log('🦊 Using standard wagmi method');
      return await purchaseWithWagmi(domain, totalPrice, durationYears, resolverAddress);
    }
  }, [isUsingGraphiteWallet, purchaseWithGraphite, purchaseWithWagmi, connector]);

  // Create domain result object
  const domainResult: DomainResult | null = searchedDomain ? {
    domain: searchedDomain,
    isAvailable: isAvailable ?? false,
    price: price ?? 0n,
    priceInEth: price ? formatEther(price) : '0',
    isLoading: priceLoading || availabilityLoading,
    error: priceError?.message || availabilityError?.message || null,
    node: domainNode,
  } : null;

  // Combine success states from both wallet types
  const isSuccess = wagmiSuccess || graphiteTxState.isSuccess;
  const allErrors = writeError || receiptError || graphiteTxState.error;

  return {
    domainResult,
    isSearching: priceLoading || availabilityLoading,
    checkDomainAvailability,
    purchaseDomain,
    isPurchasing: isPending || graphiteTxState.isPending,
    isConfirming,
    isSuccess,
    purchaseError: allErrors,
    isUsingGraphiteWallet: isUsingGraphiteWallet(),
    // Additional debug info
    txHash: hash || graphiteTxState.hash,
  };
};