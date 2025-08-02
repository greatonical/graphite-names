// components/ui/TransferModal.tsx
"use client";

import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { Text } from '../ui/text';
import { Button, ButtonWrapper } from '../ui/button';
import { useDomainTransfer } from '@/lib/hooks/useDomainTransfer';

interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
}

interface TransferModalProps {
  domain: Domain;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ 
  domain, 
  onClose, 
  onSuccess 
}) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const { transferDomain, loading, error } = useDomainTransfer();

  const handleTransfer = async () => {
    if (!recipientAddress.trim()) return;

    try {
      await transferDomain(domain.node, recipientAddress.trim());
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const canTransfer = recipientAddress.trim() && isValidAddress(recipientAddress.trim());

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <Text className="text-xl font-semibold">Transfer Domain</Text>
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
          <Text className="text-white/60 text-sm">
            Expires: {domain.expiry.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </div>

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <Text className="text-yellow-500 font-medium text-sm mb-1">
                Transfer Warning
              </Text>
              <Text className="text-yellow-300/80 text-sm">
                Once transferred, you will lose control of this domain. This action cannot be undone.
              </Text>
            </div>
          </div>
        </div>

        {/* Recipient Address Input */}
        <div className="mb-6">
          <Text className="text-sm font-medium mb-2">Recipient Address</Text>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:outline-none transition-colors"
          />
          {recipientAddress && !isValidAddress(recipientAddress) && (
            <Text className="text-red-400 text-sm mt-2">
              Please enter a valid Ethereum address
            </Text>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 ">
            <Text className="text-red-400 text-sm break-words">{error}</Text>
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
            onClick={handleTransfer}
            disabled={!canTransfer || loading}
            className={`flex-1 py-3 px-4 rounded-xl transition-colors ${
              canTransfer && !loading
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white/5 text-white/40 cursor-not-allowed'
            }`}
          >
            {loading ? 'Transferring...' : 'Transfer Domain'}
          </Button>
        </div>
      </div>
    </div>
  );
};