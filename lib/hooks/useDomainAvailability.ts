// lib/hooks/useDomainAvailability.ts - Fixed for Balance Issue
import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatEther, keccak256, toBytes, concat, encodeFunctionData, parseAbi, parseEther } from 'viem';

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

  // Helper function to parse Graphite wallet balance
  const parseGraphiteBalance = useCallback((balance: any): bigint => {
    console.log('🔍 Parsing balance:', balance, typeof balance);
    
    if (typeof balance === 'string') {
      // Handle hex string
      if (balance.startsWith('0x')) {
        return BigInt(balance);
      }
      // Handle decimal string
      if (balance.includes('.')) {
        return parseEther(balance);
      }
      // Handle wei string
      return BigInt(balance);
    }
    
    if (typeof balance === 'number') {
      // Assume it's in Ether if it's a reasonable number
      if (balance < 1000) {
        return parseEther(balance.toString());
      }
      // Otherwise assume it's in wei
      return BigInt(Math.floor(balance));
    }
    
    if (typeof balance === 'object' && balance !== null) {
      // Handle various object formats
      const balObj = balance as any;
      
      if (balObj.value !== undefined) {
        return typeof balObj.value === 'string' ? BigInt(balObj.value) : BigInt(Math.floor(balObj.value));
      }
      
      if (balObj.wei !== undefined) {
        return typeof balObj.wei === 'string' ? BigInt(balObj.wei) : BigInt(Math.floor(balObj.wei));
      }
      
      if (balObj.balance !== undefined) {
        return typeof balObj.balance === 'string' ? BigInt(balObj.balance) : BigInt(Math.floor(balObj.balance));
      }
      
      if (balObj.ether !== undefined) {
        return parseEther(balObj.ether.toString());
      }
    }
    
    throw new Error(`Unsupported balance format: ${typeof balance}`);
  }, []);

  // Purchase with Graphite wallet directly - MAJOR FIXES
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

      // 3. Get current address
      const graphiteAddress = await window.graphite.getAddress();
      console.log('💰 Graphite address:', graphiteAddress);
      
      // 4. IMPROVED BALANCE CHECK
      try {
        const rawBalance = await window.graphite.getBalance();
        console.log('💰 Raw balance from wallet:', rawBalance);
        
        const balanceWei = parseGraphiteBalance(rawBalance);
        console.log('💰 Parsed balance:', balanceWei.toString(), 'wei');
        console.log('💰 Balance in @G:', formatEther(balanceWei));
        console.log('💰 Required price:', formatEther(totalPrice), '@G');
        
        // More generous gas estimation - increase buffer
        const gasBuffer = parseEther('0.1'); // 0.1 @G buffer for gas
        const requiredWithBuffer = totalPrice + gasBuffer;
        
        console.log('💰 Required with gas buffer:', formatEther(requiredWithBuffer), '@G');
        
        if (balanceWei < requiredWithBuffer) {
          throw new Error(
            `Insufficient @G balance. You have ${formatEther(balanceWei)} @G but need ${formatEther(requiredWithBuffer)} @G (including gas)`
          );
        }
        
        console.log('✅ Balance check passed');
        
      } catch (balanceError) {
        console.error('❌ Balance check failed:', balanceError);
        // If it's our custom insufficient funds error, re-throw it
        if (balanceError instanceof Error && balanceError.message.includes('Insufficient @G balance')) {
          throw balanceError;
        }
        // For other balance parsing errors, show a warning but continue
        console.warn('⚠️ Could not verify balance, proceeding with transaction...');
      }

      // 5. Prepare transaction data
      const durationInSeconds = BigInt(durationYears * 365 * 24 * 60 * 60);
      const resolver = resolverAddress || RESOLVER_ADDRESS;
      
      // Encode the function call data
      const callData = encodeFunctionData({
        abi: REGISTRY_ABI,
        functionName: 'buyFixedPrice',
        args: [domain, resolver, durationInSeconds],
      });
      
      // IMPROVED GAS ESTIMATION - try multiple gas values
      const gasOptions = [
        '0x2DC6C0', // ~3M gas (your current value)
        '0x3D0900', // ~4M gas  
        '0x4C4B40', // ~5M gas
      ];
      
      const txParams = {
        to: REGISTRY_ADDRESS,
        value: `0x${totalPrice.toString(16)}`,
        data: callData,
        gas: gasOptions[1], // Start with 4M gas
      };

      console.log('📦 Final transaction params:', {
        to: txParams.to,
        value: txParams.value,
        valueInEth: formatEther(totalPrice),
        gas: txParams.gas,
        gasDecimal: parseInt(txParams.gas, 16),
        dataLength: callData.length,
        decodedArgs: [domain, resolver, durationInSeconds.toString()],
      });

      // 6. Send transaction using Graphite's sendTx method
      console.log('📤 Sending transaction to Graphite wallet...');
      
      let txHash: string;
      let lastError: any;
      
      // Try different gas values if the first one fails
      for (let i = 0; i < gasOptions.length; i++) {
        try {
          const currentTxParams = { ...txParams, gas: gasOptions[i] };
          console.log(`🔄 Attempting transaction with gas: ${gasOptions[i]} (${parseInt(gasOptions[i], 16)} decimal)`);
          
          txHash = await window.graphite.sendTx(currentTxParams);
          console.log('✅ Transaction successful with gas:', gasOptions[i]);
          break;
          
        } catch (gasError: any) {
          console.warn(`⚠️ Transaction failed with gas ${gasOptions[i]}:`, gasError);
          lastError = gasError;
          
          // If this was the last attempt, throw the error
          if (i === gasOptions.length - 1) {
            throw gasError;
          }
          
          // Wait a bit before trying again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!txHash!) {
        throw lastError || new Error('All gas attempts failed');
      }
      
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
      
      // IMPROVED ERROR MESSAGES
      let errorMessage = 'Purchase failed. Please try again.';
      
      if (error?.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('insufficient') && msg.includes('@g')) {
          // Our custom balance error message
          errorMessage = error.message;
        } else if (msg.includes('insufficient funds') || msg.includes('insufficient balance')) {
          errorMessage = 'Insufficient @G balance. Please check your wallet balance and try again.';
        } else if (msg.includes('user rejected') || msg.includes('denied') || msg.includes('cancel')) {
          errorMessage = 'Transaction cancelled by user';
        } else if (msg.includes('gas')) {
          errorMessage = 'Gas estimation failed. The transaction may require more gas than available.';
        } else if (msg.includes('nonce')) {
          errorMessage = 'Nonce error. Please try again.';
        } else if (msg.includes('network') || msg.includes('connection')) {
          errorMessage = 'Network connection error. Please check your connection and try again.';
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
  }, [refetchAvailability, refetchPrice, parseGraphiteBalance]);

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
    
    const result = writeContract({
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