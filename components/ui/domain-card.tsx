// components/ui/DomainCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { Text } from "./text";
import { ButtonWrapper } from "./button";
import { useSubdomainList } from "@/lib/hooks/useSubdomainList";

interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
  hasSubdomains?: boolean;
}

interface DomainCardProps {
  domain: Domain;
  onMenuClick: (e: React.MouseEvent) => void;
  isSubdomainsExpanded?: boolean;
  onSubdomainsToggle?: () => void;
  showMenu: boolean;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  onMenuClick,
  showMenu,
  isSubdomainsExpanded = false,
  onSubdomainsToggle,
}) => {
  // CHANGES: Added state for subdomain expansion and subdomain data fetching
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    subdomains,
    loading: subdomainsLoading,
    hasSubdomains,
  } = useSubdomainList(domain.node);

  const getStatusColor = (daysLeft: number) => {
    if (daysLeft <= 30) return "text-red-500 bg-red-500/10";
    if (daysLeft <= 90) return "text-yellow-500 bg-yellow-500/10";
    return "text-primary bg-primary/10";
  };

  const getStatusText = (daysLeft: number) => {
    if (daysLeft <= 0) return "Expired";
    if (daysLeft === 1) return "1 day left";
    return `${daysLeft} days left`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // CHANGES: Sync internal state with external prop
  useEffect(() => {
    setIsExpanded(isSubdomainsExpanded);
  }, [isSubdomainsExpanded]);

  // CHANGES: Return hasSubdomains info to parent for menu visibility
  useEffect(() => {
    if (onSubdomainsToggle) {
      // This effect can be used to notify parent about subdomain availability
    }
  }, [hasSubdomains, onSubdomainsToggle]);

  return (
    <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center justify-between">
        {/* Domain Info */}
        <div className="flex-1">
          <div className="flex items-center gap-y-4 gap-x-3 mb-2">
            <Text className="text-xl font-semibold text-white">
              {domain.name}
            </Text>

            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium font-poppins ${getStatusColor(
                domain.daysLeft
              )}`}
            >
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
                ? "bg-white/20 text-white"
                : "hover:bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            <MoreVertical className="h-5 w-5" />
          </ButtonWrapper>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t rounded-xl border-white/10 bg-white/5 mt-5">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Text className="font-medium text-white">Subdomains</Text>
              <Text className="text-white/60 text-sm">
                {subdomainsLoading
                  ? "Loading..."
                  : `${subdomains.length} subdomain${
                      subdomains.length !== 1 ? "s" : ""
                    }`}
              </Text>
            </div>

            {subdomainsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : subdomains.length > 0 ? (
              <div className="space-y-3">
                {subdomains.map((subdomain) => (
                  <div
                    key={subdomain.node}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="font-medium text-white mb-1">
                          {subdomain.fullName}
                        </Text>
                        <Text className="text-white/60 text-sm">
                          Expires: {formatDate(subdomain.expiry)}
                        </Text>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            subdomain.daysLeft
                          )}`}
                        >
                          {getStatusText(subdomain.daysLeft)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <Text
                  className="text-primary mt-4 cursor-pointer text-base text-center"
                  onClick={onSubdomainsToggle}
                >
                  Hide subdomains
                </Text>
              </div>
            ) : (
              <div className="text-center py-8">
                <Text className="text-white/60">No subdomains created yet</Text>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
