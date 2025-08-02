// components/ui/SubdomainResult.tsx
"use client";

import React, { useState } from 'react';
import { Check, X, AlertCircle, Calendar } from 'lucide-react';
import { Text } from './text';
import { Button } from './button';

interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
}

interface SubdomainResultProps {
  subdomain: string;
  parentDomain: Domain;
  availability: boolean | null;
  price: bigint | null;
  onPurchase: (label: string, parentDomain: Domain, duration: number) => Promise<string>;
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
  subdomain,
  parentDomain,
  availability,
  price,
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
    if (!price) return BigInt(0);
    return price * BigInt(selectedDuration.value);
  };

  const calculateExpiry = () => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + selectedDuration.value);
    return expiry;
  };

  const handlePurchase = async () => {
    if (!availability || purchasing) return;

    setPurchasing(true);
    try {
      await onPurchase(subdomain, parentDomain, selectedDuration.value);
    } catch (err) {
      console.error('Purchase failed:', err);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <Text className="ml-3 text-white/60">Checking availability...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <div>
            <Text className="text-red-400 font-medium">Error</Text>
            <Text className="text-red-300/80 text-sm">{error}</Text>
          </div>
        </div>
      </div>
    );
  }

  if (availability === null) return null;

  return (
    <div className={`backdrop-blur-sm border rounded-2xl p-6 ${
      availability 
        ? 'bg-green-500/10 border-green-500/20' 
        : 'bg-red-500/10 border-red-500/20'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-full ${
          availability ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          {availability ? (
            <Check className="h-6 w-6 text-green-400" />
          ) : (
            <X className="h-6 w-6 text-red-400" />
          )}
        </div>
        <div>
          <Text className={`text-xl font-semibold ${
            availability ? 'text-green-400' : 'text-red-400'
          }`}>
            {availability ? 'Available' : 'Not Available'}
          </Text>
          <Text className="text-white/60">
            {subdomain}.{parentDomain.name}
          </Text>
        </div>
      </div>

      {availability ? (
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
                    className={`p-3 rounded-xl border transition-colors ${
                      selectedDuration.value === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                    }`}
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
                    <Text className="font-medium">{price ? formatPrice(price) : '—'}</Text>
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
              </div>
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={purchasing || !price}
            className={`w-full py-4 rounded-xl font-semibold transition-all ${
              !purchasing && price !== null
                ? 'bg-primary hover:bg-primary/80 text-black'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {purchasing ? 'Creating Subdomain...' : `Create Subdomain for ${formatPrice(getTotalPrice())}`}
          </Button>
        </>
      ) : (
        /* Not Available Message */
        <div className="text-center py-4">
          <Text className="text-red-300 mb-2">
            This subdomain is already taken or cannot be registered.
          </Text>
          <Text className="text-red-300/60 text-sm">
            Try a different subdomain name.
          </Text>
        </div>
      )}
    </div>
  );
};