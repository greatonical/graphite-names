// app/manage/page.tsx
"use client";

import React, { useState } from 'react';
import { Plus, MoreVertical, ArrowRightLeft, Calendar, AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/text';
import { ButtonWrapper } from '@/components/ui/button';
import { useUserDomains } from '@/lib/hooks/useUserDomains';
import { DomainCard } from '@/components/ui/domain-card';
import { DomainMenu } from '@/components/menu/domain-options.menu';
import { TransferModal } from '@/components/modal/transfer-domain.modal';
import { ExtendModal } from '@/components/modal/extend-domain.modal';


interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
}

export default function ManagePage() {
  const { domains, loading, error, refreshDomains } = useUserDomains();
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleTransfer = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowTransferModal(true);
    setActiveMenu(null);
  };

  const handleExtend = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowExtendModal(true);
    setActiveMenu(null);
  };

  const handleMenuClick = (domainName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === domainName ? null : domainName);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-4 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 px-4 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <Text className="text-lg text-center mb-2">Failed to load domains</Text>
            <Text className="text-white/60 text-center">{error}</Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-4 md:px-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Text className="text-4xl font-bold">My Graphite Names</Text>
          <ButtonWrapper className="bg-white/10 hover:desktop:bg-primary hover:desktop:text-black-500 rounded-full p-3 transition-colors duration-500">
            <Plus className="h-6 w-6" />
          </ButtonWrapper>
        </div>

        {/* Domains List */}
        {domains && domains.length > 0 ? (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div key={domain.name} className="relative">
                <DomainCard 
                  domain={domain}
                  onMenuClick={(e) => handleMenuClick(domain.name, e)}
                  showMenu={activeMenu === domain.name}
                />
                
                {activeMenu === domain.name && (
                  <DomainMenu
                    onTransfer={() => handleTransfer(domain)}
                    onExtend={() => handleExtend(domain)}
                    onClose={() => setActiveMenu(null)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white/5 rounded-full p-6 mb-6">
              <AlertCircle className="h-12 w-12 text-white/40" />
            </div>
            <Text className="text-xl font-medium mb-2">No domains created</Text>
            <Text className="text-white/60 text-center max-w-md">
              You haven't registered any domains yet. Start by searching for your perfect domain name.
            </Text>
          </div>
        )}

        {/* Modals */}
        {showTransferModal && selectedDomain && (
          <TransferModal
            domain={selectedDomain}
            onClose={() => {
              setShowTransferModal(false);
              setSelectedDomain(null);
            }}
            onSuccess={refreshDomains}
          />
        )}

        {showExtendModal && selectedDomain && (
          <ExtendModal
            domain={selectedDomain}
            onClose={() => {
              setShowExtendModal(false);
              setSelectedDomain(null);
            }}
            onSuccess={refreshDomains}
          />
        )}
      </div>
    </div>
  );
}