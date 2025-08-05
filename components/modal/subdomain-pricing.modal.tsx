// components/modal/subdomain-pricing.modal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, CheckCircle, X } from 'lucide-react';
import { Text } from '../ui/text';
import { Button, ButtonWrapper } from '../ui/button';
import { useSubdomainPricing } from '@/lib/hooks/useSubdomainPricing';

interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
}

interface SubdomainPricingProps {
  domain: Domain;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubdomainPricing: React.FC<SubdomainPricingProps> = ({
  domain,
  onClose,
  onSuccess
}) => {
  const [price, setPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState<bigint | null>(null);
  const { setSubdomainPrice, getSubdomainPrice, loading, error } = useSubdomainPricing();

  useEffect(() => {
    // Fetch current price when component mounts
    const fetchCurrentPrice = async () => {
      const existing = await getSubdomainPrice(domain.node);
      setCurrentPrice(existing);
      if (existing && existing > 0) {
        setPrice((Number(existing) / 1e18).toString());
      }
    };

    fetchCurrentPrice();
  }, [domain.node, getSubdomainPrice]);

  const handleSetPrice = async () => {
    if (!price.trim()) return;

    try {
      await setSubdomainPrice(domain.node, price);
      // CHANGED: Call onSuccess first to refresh domain list
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to set subdomain price:', err);
      // CHANGED: Error is now handled by the hook itself via setError
    }
  };

  const formatPrice = (priceWei: bigint) => {
    const eth = Number(priceWei) / 1e18;
    return `${eth} @G`;
  };

  const isValidPrice = price && !isNaN(parseFloat(price)) && parseFloat(price) >= 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Text className="text-xl font-semibold">Subdomain Settings</Text>
              <Text className="text-white/60 text-sm">{domain.name}</Text>
            </div>
          </div>
          {/* CHANGED: Added close button with proper disable state */}
          <ButtonWrapper
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/60" />
          </ButtonWrapper>
        </div>

        {/* Current Status */}
        {currentPrice !== null && currentPrice > 0 ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <Text className="text-primary font-medium text-sm">
                Subdomains Enabled
              </Text>
            </div>
            <Text className="text-green-300/80 text-sm">
              Current price: {formatPrice(currentPrice)} per subdomain
            </Text>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <Text className="text-yellow-500 font-medium text-sm">
                Subdomains Disabled
              </Text>
            </div>
            <Text className="text-yellow-300/80 text-sm">
              Set a price to enable subdomain creation under your domain
            </Text>
          </div>
        )}

        {/* Price Input */}
        <div className="mb-6">
          <Text className="text-sm font-medium mb-2">
            Subdomain Price (in @G)
          </Text>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.01"
              step="0.001"
              min="0"
              // CHANGED: Disable input during loading
              disabled={loading}
              className={`
                w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 
                text-white placeholder-white/40 focus:border-primary focus:outline-none 
                transition-colors pr-12
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40">
              @G
            </div>
          </div>
          <Text className="text-white/60 text-xs mt-1">
            This price will be charged for each subdomain created under {domain.name}
          </Text>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <Text className="text-blue-400 font-medium text-sm mb-2">
            How it works:
          </Text>
          <ul className="text-blue-300/80 text-sm space-y-1">
            <li>• Users can create subdomains like "app.{domain.name}"</li>
            <li>• Each subdomain costs the price you set</li>
            <li>• You receive the payment for each subdomain created</li>
            <li>• You can update the price anytime</li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            {/* CHANGED: Better error text formatting for long messages */}
            <Text className="text-red-400 text-sm break-words leading-relaxed">
              {error}
            </Text>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            // CHANGED: Disable cancel during loading to prevent issues
            disabled={loading}
            className={`
              flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 
              rounded-xl transition-colors
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSetPrice}
            disabled={!isValidPrice || loading}
            className={`
              flex-1 py-3 px-4 rounded-xl transition-colors font-medium
              ${isValidPrice && !loading
                ? 'bg-primary hover:bg-primary/80 text-black'
                : 'bg-white/5 text-white/40 cursor-not-allowed'
              }
            `}
          >
            {/* CHANGED: Better loading state text */}
            {loading ? 'Setting...' : currentPrice ? 'Update Price' : 'Enable Subdomains'}
          </Button>
        </div>

        {/* CHANGED: Added loading indicator for better UX */}
        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-white/60">
            <div className="w-4 h-4 border-2 border-white/20 border-t-primary rounded-full animate-spin"></div>
            <Text className="text-sm">Processing price update...</Text>
          </div>
        )}
      </div>
    </div>
  );
};