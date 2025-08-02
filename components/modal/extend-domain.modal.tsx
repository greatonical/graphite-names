// components/ui/ExtendModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Text } from '../ui/text';
import { Button, ButtonWrapper } from '../ui/button';
import { useDomainExtension } from '@/lib/hooks/useDomainExtension';

interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
}

interface ExtendModalProps {
  domain: Domain;
  onClose: () => void;
  onSuccess: () => void;
}

const DURATION_OPTIONS = [
  { label: '1 Year', value: 1, seconds: 365 * 24 * 60 * 60 },
  { label: '2 Years', value: 2, seconds: 2 * 365 * 24 * 60 * 60 },
  { label: '3 Years', value: 3, seconds: 3 * 365 * 24 * 60 * 60 },
  { label: '5 Years', value: 5, seconds: 5 * 365 * 24 * 60 * 60 },
  { label: '10 Years', value: 10, seconds: 10 * 365 * 24 * 60 * 60 },
];

export const ExtendModal: React.FC<ExtendModalProps> = ({ 
  domain, 
  onClose, 
  onSuccess 
}) => {
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0]);
  const { extendDomain, getExtensionPrice, loading, error } = useDomainExtension();
  const [price, setPrice] = useState<bigint | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const calculateNewExpiry = () => {
    const newExpiry = new Date(domain.expiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + selectedDuration.value);
    return newExpiry;
  };

  const formatPrice = (priceWei: bigint) => {
    const eth = Number(priceWei) / 1e18;
    return eth.toFixed(4);
  };

  const fetchPrice = async () => {
    setPriceLoading(true);
    try {
      const domainLabel = domain.name.replace('.atgraphite', '');
      const extensionPrice = await getExtensionPrice(domainLabel, selectedDuration.seconds);
      setPrice(extensionPrice);
    } catch (err) {
      console.error('Failed to fetch extension price:', err);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
  }, [selectedDuration]);

  const handleExtend = async () => {
    if (!price) return;

    try {
      const domainLabel = domain.name.replace('.atgraphite', '');
      await extendDomain(domainLabel, selectedDuration.seconds, price);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Extension failed:', err);
    }
  };

  const canExtend = price !== null && !loading && !priceLoading;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <Text className="text-xl font-semibold">Extend Registration</Text>
          </div>
          <ButtonWrapper
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/60" />
          </ButtonWrapper>
        </div>

        {/* Domain Info */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <Text className="text-lg font-medium mb-1">{domain.name}</Text>
          <Text className="text-white/60 text-sm mb-2">
            Current expiry: {domain.expiry.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-white/60" />
            <Text className="text-white/60 text-sm">
              {domain.daysLeft} days remaining
            </Text>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="mb-6">
          <Text className="text-sm font-medium mb-3">Extension Duration</Text>
          <div className="grid grid-cols-2 gap-2">
            {DURATION_OPTIONS.map((option) => (
              <ButtonWrapper
                key={option.value}
                onClick={() => setSelectedDuration(option)}
                className={`p-3 rounded-xl border transition-colors ${
                  selectedDuration.value === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <Text className="text-sm font-medium">{option.label}</Text>
              </ButtonWrapper>
            ))}
          </div>
        </div>

        {/* New Expiry Date */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
          <Text className="text-green-400 font-medium text-sm mb-1">
            New Expiry Date
          </Text>
          <Text className="text-green-300 text-sm">
            {calculateNewExpiry().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </div>

        {/* Price Display */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <Text className="text-sm font-medium">Extension Cost</Text>
            <div className="text-right">
              {priceLoading ? (
                <div className="animate-pulse bg-white/20 h-5 w-16 rounded"></div>
              ) : price ? (
                <Text className="text-lg font-semibold text-primary">
                  {formatPrice(price)} @G
                </Text>
              ) : (
                <Text className="text-red-400 text-sm">Failed to load price</Text>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <Text className="text-red-400 text-sm">{error}</Text>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <ButtonWrapper
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl transition-colors"
          >
            <Text className="font-medium">Cancel</Text>
          </ButtonWrapper>
          <Button
            onClick={handleExtend}
            disabled={!canExtend}
            className={`flex-1 py-3 px-4 rounded-xl transition-colors ${
              canExtend
                ? 'bg-primary hover:bg-primary/80 text-black'
                : 'bg-white/5 text-white/40 cursor-not-allowed'
            }`}
          >
            {loading ? 'Extending...' : `Extend for ${selectedDuration.label}`}
          </Button>
        </div>
      </div>
    </div>
  );
};