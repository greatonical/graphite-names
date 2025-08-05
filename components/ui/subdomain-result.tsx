// components/ui/SubdomainResult.tsx
"use client";

import React, { useState } from 'react';
import { Check, X, AlertCircle, Calendar } from 'lucide-react';
import { Text } from './text';
import { Button } from './button';

// CHANGED: Updated to match the SubdomainResult interface from the hook
interface SubdomainResult {
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

// CHANGED: Updated component props to match new interface
interface SubdomainResultProps {
  subdomainResult: SubdomainResult;
  onPurchase: (subdomain: string, parentDomain: string, totalPrice: bigint, duration: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const DURATION_OPTIONS = [
  { label: '1 Year', value: 1 },
  { label: '2 Years', value: 2 },
  { label: '3 Years', value: 3 },
  { label: '5 Years', value: 5 },
  { label: '10 Years', value: 10 },
];

export const SubdomainResult: React.FC<SubdomainResultProps> = ({
  subdomainResult,
  onPurchase,
  loading,
  error
}) => {
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0]);
  const [purchasing, setPurchasing] = useState(false);

  const formatPrice = (priceWei: bigint) => {
    if (priceWei === BigInt(0)) return 'Free';
    const eth = Number(priceWei) / 1e18;
    return `${eth.toFixed(4)} @G`;
  };

  const getTotalPrice = () => {
    if (!subdomainResult.price) return BigInt(0);
    return subdomainResult.price * BigInt(selectedDuration.value);
  };

  const calculateExpiry = () => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + selectedDuration.value);
    return expiry;
  };

  // CHANGED: Updated to match new function signature
  const handlePurchase = async () => {
    if (!subdomainResult.isAvailable || purchasing || loading) return;

    setPurchasing(true);
    try {
      const totalPrice = getTotalPrice();
      console.log('🛒 SubdomainResult: Starting purchase...', {
        subdomain: subdomainResult.subdomain,
        parentDomain: subdomainResult.parentDomain,
        totalPrice: totalPrice.toString(),
        duration: selectedDuration.value
      });

      // CHANGED: Pass the correct parameters
      await onPurchase(
        subdomainResult.subdomain,
        subdomainResult.parentDomain,
        totalPrice,
        selectedDuration.value
      );
      
      console.log('🛒 SubdomainResult: Purchase completed');
    } catch (err) {
      console.error('🛒 SubdomainResult: Purchase failed:', err);
      // Error handling is done by the parent component/hook
    } finally {
      setPurchasing(false);
    }
  };

  // CHANGED: Use subdomainResult.isLoading or loading prop
  if (subdomainResult.isLoading || loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <Text className="ml-3 text-white/60">Checking availability...</Text>
        </div>
      </div>
    );
  }

  // CHANGED: Check both error sources
  const displayError = error || subdomainResult.error;
  if (displayError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <div>
            <Text className="text-red-400 font-medium">Error</Text>
            <Text className="text-red-300/80 text-sm break-words">{displayError}</Text>
          </div>
        </div>
      </div>
    );
  }

  // CHANGED: Use subdomainResult.isAvailable
  const isAvailable = subdomainResult.isAvailable;

  return (
    <div className={`backdrop-blur-sm border rounded-2xl p-6 ${
      isAvailable 
        ? 'bg-green-500/10 border-green-500/20' 
        : 'bg-red-500/10 border-red-500/20'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-full ${
          isAvailable ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          {isAvailable ? (
            <Check className="h-6 w-6 text-green-400" />
          ) : (
            <X className="h-6 w-6 text-red-400" />
          )}
        </div>
        <div>
          <Text className={`text-xl font-semibold ${
            isAvailable ? 'text-green-400' : 'text-red-400'
          }`}>
            {isAvailable ? 'Available' : 'Not Available'}
          </Text>
          {/* CHANGED: Use fullName from subdomainResult */}
          <Text className="text-white/60 break-words">
            {subdomainResult.fullName}
          </Text>
        </div>
      </div>

      {isAvailable ? (
        <>
          {/* Price and Duration Selection */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Duration Selection */}
            <div>
              <Text className="text-sm font-medium mb-3">Registration Duration</Text>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDuration(option)}
                    // CHANGED: Disable during purchase
                    disabled={purchasing}
                    className={`
                      p-3 rounded-xl border transition-colors
                      ${selectedDuration.value === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }
                      ${purchasing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <Text className="text-sm font-medium">{option.label}</Text>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="space-y-4">
              <div>
                <Text className="text-sm font-medium mb-2">Price Summary</Text>
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <Text className="text-white/60">Base Price:</Text>
                    <Text className="font-medium">
                      {formatPrice(subdomainResult.price)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-white/60">Duration:</Text>
                    <Text className="font-medium">{selectedDuration.label}</Text>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between">
                      <Text className="font-medium">Total:</Text>
                      <Text className="text-xl font-bold text-primary">
                        {formatPrice(getTotalPrice())}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <Text className="text-blue-400 font-medium text-sm">
                    Registration Details
                  </Text>
                </div>
                <Text className="text-blue-300/80 text-sm">
                  Expires: {calculateExpiry().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                {/* CHANGED: Show parent domain info */}
                <Text className="text-blue-300/60 text-xs mt-1">
                  Under: {subdomainResult.parentDomain}.atgraphite
                </Text>
              </div>
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={purchasing || subdomainResult.price === BigInt(0)}
            className={`
              w-full py-4 rounded-xl font-semibold transition-all
              ${!purchasing && subdomainResult.price !== BigInt(0)
                ? 'bg-primary hover:bg-primary/80 text-black'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
              }
            `}
          >
            {/* CHANGED: Better button text */}
            {purchasing 
              ? 'Creating Subdomain...' 
              : `Create Subdomain for ${formatPrice(getTotalPrice())}`
            }
          </Button>

          {/* CHANGED: Added loading indicator during purchase */}
          {purchasing && (
            <div className="mt-4 flex items-center justify-center gap-2 text-white/60">
              <div className="w-4 h-4 border-2 border-white/20 border-t-primary rounded-full animate-spin"></div>
              <Text className="text-sm">Processing subdomain creation...</Text>
            </div>
          )}
        </>
      ) : (
        /* Not Available Message */
        <div className="text-center py-4">
          <Text className="text-red-300 mb-2">
            This subdomain is already taken or cannot be registered.
          </Text>
          <Text className="text-red-300/60 text-sm">
            Try a different subdomain name or check if subdomain pricing is enabled for this domain.
          </Text>
        </div>
      )}
    </div>
  );
};