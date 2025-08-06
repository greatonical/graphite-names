// lib/hooks/useGraphiteKYC.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

// Graphite API endpoints
const GRAPHITE_API_BASE = 'https://api.test.atgraphite.com/api';

// You'll need to set up a proxy route in your Next.js app
const PROXY_BASE = '/api/graphite-proxy';

interface KYCData {
  address: string;
  kycLevel: number;
  isActivated: boolean;
  reputation: number;
  lastUpdated: string;
  status: string;
  message?: string;
}

interface GraphiteKYCState {
  data: KYCData | null;
  loading: boolean;
  error: string | null;
  isKYCVerified: boolean;
  isAccountActivated: boolean;
  kycLevel: number;
  reputation: number;
}

export const useGraphiteKYC = () => {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<GraphiteKYCState>({
    data: null,
    loading: false,
    error: null,
    isKYCVerified: false,
    isAccountActivated: false,
    kycLevel: 0,
    reputation: 0,
  });

  console.log('🔍 GraphiteKYC - Hook initialized:', {
    address,
    isConnected
  });

  // Fetch KYC data from Graphite API using correct parameters
  const fetchKYCData = useCallback(async (userAddress: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log(`📡 GraphiteKYC - Fetching KYC data for ${userAddress}`);

      // Build the correct API URL with query parameters
      const apiUrl = new URL(GRAPHITE_API_BASE);
      apiUrl.searchParams.set('module', 'account');
      apiUrl.searchParams.set('action', 'kyc');
      apiUrl.searchParams.set('address', userAddress);
      apiUrl.searchParams.set('tag', 'latest');
      // Note: API key should be handled securely via environment variables
      if (process.env.NEXT_PUBLIC_GRAPHITE_API_KEY) {
        apiUrl.searchParams.set('apikey', process.env.NEXT_PUBLIC_GRAPHITE_API_KEY);
      }

      console.log(`📡 GraphiteKYC - API URL: ${apiUrl.toString()}`);

      // Method 1: Try direct API call (might fail due to CORS)
      let response: Response | null = null;
      let data: any = null;

      try {
        console.log('📡 GraphiteKYC - Attempting direct API call...');
        response = await fetch(apiUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          data = await response.json();
          console.log('✅ GraphiteKYC - Direct API call successful:', data);
        } else {
          throw new Error(`API responded with status: ${response.status}`);
        }
      } catch (directError) {
        console.log('⚠️ GraphiteKYC - Direct API call failed, trying proxy...', directError);

        // Method 2: Try through proxy
        try {
          const proxyUrl = `${PROXY_BASE}/kyc?address=${userAddress}&tag=latest`;
          response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            data = await response.json();
            console.log('✅ GraphiteKYC - Proxy API call successful:', data);
          } else {
            throw new Error(`Proxy API responded with status: ${response.status}`);
          }
        } catch (proxyError) {
          console.error('❌ GraphiteKYC - Proxy API call failed:', proxyError);
          throw new Error('Unable to fetch KYC data from Graphite API');
        }
      }

      // Parse the Graphite API response format
      let kycData: KYCData;

      if (data.status === '1' && data.result) {
        // Successful response format
        const result = data.result;
        kycData = {
          address: userAddress,
          kycLevel: parseInt(result.kycLevel || result.kyc_level || '0'),
          isActivated: result.isActivated === 'true' || result.is_activated === true || result.activated === true,
          reputation: parseInt(result.reputation || result.reputationScore || '0'),
          status: data.status,
          message: data.message,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        // Handle error response or unexpected format
        console.warn('⚠️ GraphiteKYC - Unexpected API response format:', data);
        kycData = {
          address: userAddress,
          kycLevel: 0,
          isActivated: false,
          reputation: 0,
          status: data.status || '0',
          message: data.message || 'Unknown response format',
          lastUpdated: new Date().toISOString(),
        };
      }

      console.log('📊 GraphiteKYC - Parsed data:', kycData);

      // Update state
      setState({
        data: kycData,
        loading: false,
        error: null,
        isKYCVerified: kycData.kycLevel > 0,
        isAccountActivated: kycData.isActivated,
        kycLevel: kycData.kycLevel,
        reputation: kycData.reputation,
      });

    } catch (error: any) {
      console.error('❌ GraphiteKYC - Error fetching KYC data:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch KYC data',
      }));
    }
  }, []);

  // Alternative method for account activation status
  const fetchActivationStatus = useCallback(async (userAddress: string) => {
    try {
      console.log('📡 GraphiteKYC - Checking activation status...');
      
      // Build URL for activation check
      const apiUrl = new URL(GRAPHITE_API_BASE);
      apiUrl.searchParams.set('module', 'account');
      apiUrl.searchParams.set('action', 'activation');
      apiUrl.searchParams.set('address', userAddress);
      apiUrl.searchParams.set('tag', 'latest');
      if (process.env.NEXT_PUBLIC_GRAPHITE_API_KEY) {
        apiUrl.searchParams.set('apikey', process.env.NEXT_PUBLIC_GRAPHITE_API_KEY);
      }

      // Try direct API call first
      let response: Response;
      try {
        response = await fetch(apiUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
      } catch (directError) {
        console.log('⚠️ GraphiteKYC - Direct activation API failed, trying proxy...');
        response = await fetch(`${PROXY_BASE}/activation?address=${userAddress}&tag=latest`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ GraphiteKYC - Activation status data:', data);
        return data;
      }
      return null;
    } catch (error) {
      console.warn('⚠️ GraphiteKYC - Activation status check failed:', error);
      return null;
    }
  }, []);

  // Main fetch function that tries multiple methods
  const fetchUserKYC = useCallback(async () => {
    if (!address) {
      console.log('⚠️ GraphiteKYC - No address provided');
      setState(prev => ({ 
        ...prev, 
        data: null, 
        loading: false,
        isKYCVerified: false,
        isAccountActivated: false,
        kycLevel: 0,
        reputation: 0,
      }));
      return;
    }

    console.log(`🚀 GraphiteKYC - Starting KYC check for ${address}`);

    try {
      // Try main KYC API first
      await fetchKYCData(address);
      
      // Also try to get activation status if KYC call succeeded
      const activationData = await fetchActivationStatus(address);
      if (activationData && activationData.result) {
        setState(prev => ({
          ...prev,
          isAccountActivated: activationData.result.isActivated === 'true' || activationData.result.activated === true,
          data: prev.data ? {
            ...prev.data,
            isActivated: activationData.result.isActivated === 'true' || activationData.result.activated === true
          } : prev.data
        }));
      }
      
    } catch (mainError) {
      console.log('⚠️ GraphiteKYC - Main API failed:', mainError);
      
      // If main API fails, set default values with error
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Unable to fetch KYC data from Graphite API. API may be unavailable or require authentication.',
        data: {
          address: address,
          kycLevel: 0,
          isActivated: false,
          reputation: 0,
          status: '0',
          message: 'API request failed',
          lastUpdated: new Date().toISOString(),
        },
        isKYCVerified: false,
        isAccountActivated: false,
        kycLevel: 0,
        reputation: 0,
      }));
    }
  }, [address, fetchKYCData, fetchActivationStatus]);

  // Auto-fetch when address changes
  useEffect(() => {
    if (isConnected && address) {
      console.log('🔄 GraphiteKYC - Address connected, fetching KYC data...');
      fetchUserKYC();
    } else {
      // Reset state when disconnected
      setState({
        data: null,
        loading: false,
        error: null,
        isKYCVerified: false,
        isAccountActivated: false,
        kycLevel: 0,
        reputation: 0,
      });
    }
  }, [address, isConnected, fetchUserKYC]);

  // Utility functions
  const getKYCLevelText = useCallback((level: number): string => {
    switch (level) {
      case 0: return 'Not Verified';
      case 1: return 'Basic Verification';
      case 2: return 'Enhanced Verification';
      case 3: return 'Premium Verification';
      default: return `Level ${level}`;
    }
  }, []);

  const getReputationText = useCallback((reputation: number): string => {
    if (reputation >= 90) return 'Excellent';
    if (reputation >= 70) return 'Good';
    if (reputation >= 50) return 'Fair';
    if (reputation >= 30) return 'Poor';
    return 'Very Poor';
  }, []);

  return {
    // Raw data
    ...state,
    
    // Utility functions
    refetchKYC: fetchUserKYC,
    getKYCLevelText: () => getKYCLevelText(state.kycLevel),
    getReputationText: () => getReputationText(state.reputation),
    
    // Computed status
    canPerformActions: state.isKYCVerified && state.isAccountActivated,
    needsKYC: !state.isKYCVerified && state.isAccountActivated,
    needsActivation: !state.isAccountActivated,
    
    // Debug info
    debugInfo: {
      address,
      isConnected,
      apiEndpoints: {
        kyc: `${GRAPHITE_API_BASE}?module=account&action=kyc&address=${address}&tag=latest`,
        activation: `${GRAPHITE_API_BASE}?module=account&action=activation&address=${address}&tag=latest`,
        proxyKyc: `${PROXY_BASE}/kyc?address=${address}&tag=latest`,
        proxyActivation: `${PROXY_BASE}/activation?address=${address}&tag=latest`,
      },
    },
  };
};