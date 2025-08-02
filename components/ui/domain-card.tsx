// components/ui/DomainCard.tsx
"use client";

import React from 'react';
import { MoreVertical } from 'lucide-react';
import { Text } from './text';
import { ButtonWrapper } from './button';

interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
}

interface DomainCardProps {
  domain: Domain;
  onMenuClick: (e: React.MouseEvent) => void;
  showMenu: boolean;
}

export const DomainCard: React.FC<DomainCardProps> = ({ 
  domain, 
  onMenuClick, 
  showMenu 
}) => {
  const getStatusColor = (daysLeft: number) => {
    if (daysLeft <= 30) return 'text-red-500 bg-red-500/10';
    if (daysLeft <= 90) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-primary bg-primary/10';
  };

  const getStatusText = (daysLeft: number) => {
    if (daysLeft <= 0) return 'Expired';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center justify-between">
        {/* Domain Info */}
        <div className="flex-1">
          <div className="flex items-center gap-y-4 gap-x-3 mb-2">
            <Text className="text-xl font-semibold text-white">
              {domain.name}
            </Text>
            
            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium font-poppins ${getStatusColor(domain.daysLeft)}`}>
              {getStatusText(domain.daysLeft)}
            </span>

            {/* Primary Badge */}
            {domain.isPrimary && (
              <span className="px-3 py-1 rounded-full text-xs font-medium font-poppins bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Primary
              </span>
            )}
          </div>
          
          <Text className="text-white/60 text-sm">
            Expires: {formatDate(domain.expiry)}
          </Text>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* <ButtonWrapper
            className="text-green-400 hover:text-green-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-400/10 transition-colors"
          >
            Manage
          </ButtonWrapper> */}

          <ButtonWrapper
            onClick={onMenuClick}
            className={`p-2 rounded-lg transition-colors ${
              showMenu 
                ? 'bg-white/20 text-white' 
                : 'hover:bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            <MoreVertical className="h-5 w-5" />
          </ButtonWrapper>
        </div>
      </div>
    </div>
  );
};