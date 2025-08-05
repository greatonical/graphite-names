// app/subdomains/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, AlertCircle, ChevronDown } from "lucide-react";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useUserDomains } from "@/lib/hooks/useUserDomains";
import { useSubdomainAvailability } from "@/lib/hooks/useSubdomainAvailability";
import { SubdomainResult } from "@/components/ui/subdomain-result";

interface Domain {
  name: string;
  expiry: Date;
  daysLeft: number;
  node: string;
  isPrimary?: boolean;
  hasSubdomains?: boolean;
}

export default function SubdomainsPage() {
  const { domains, loading: domainsLoading } = useUserDomains();
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [subdomainName, setSubdomainName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // CHANGED: Updated to use the corrected hook interface
  const {
    subdomainResult,
    isSearching,
    checkSubdomainAvailability,
    purchaseSubdomain,
    isPurchasing,
    isConfirming,
    isSuccess,
    purchaseError,
  } = useSubdomainAvailability();

  // Set first domain as default when domains load
  useEffect(() => {
    if (domains && domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0]);
    }
  }, [domains, selectedDomain]);

  // CHANGED: Updated to use the corrected function signature
  // useEffect(() => {
  //   if (selectedDomain && subdomainName.trim()) {
  //     const cleanSubdomain = subdomainName.trim().toLowerCase();
  //     const cleanParentDomain = selectedDomain.name.replace('.atgraphite', '');
  //     const fullSubdomain = `${cleanSubdomain}.${cleanParentDomain}.atgraphite`;
      
  //     setSearchQuery(fullSubdomain);
      
  //     console.log('🔍 Checking subdomain availability:', {
  //       subdomain: cleanSubdomain,
  //       parentDomain: cleanParentDomain,
  //       fullName: fullSubdomain
  //     });
      
  //     // CHANGED: Pass subdomain and parent domain name (not node)
  //     checkSubdomainAvailability(cleanSubdomain, cleanParentDomain);
  //   } else {
  //     setSearchQuery("");
  //   }
  // }, [selectedDomain, subdomainName, checkSubdomainAvailability]);

  const handleDomainSelect = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowDropdown(false);
  };

  const handleSubdomainChange = (value: string) => {
    // Only allow valid subdomain characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSubdomainName(sanitized);
  };

  const isValidSubdomain = (name: string) => {
    return (
      /^[a-z0-9-]+$/.test(name) &&
      name.length >= 3 &&
      name.length <= 32 &&
      !name.startsWith("-") &&
      !name.endsWith("-")
    );
  };

  // CHANGED: Updated purchase handler to match new hook
  const handlePurchase = async (
    subdomain: string,
    parentDomain: string,
    totalPrice: bigint,
    duration: number
  ) => {
    try {
      console.log("SubdomainsPage: Starting subdomain purchase...", {
        subdomain,
        parentDomain,
        totalPrice: totalPrice.toString(),
        duration,
      });
      
      await purchaseSubdomain(subdomain, parentDomain, totalPrice, duration);
      console.log("SubdomainsPage: Purchase initiated successfully");
    } catch (error) {
      console.error("Subdomain purchase failed:", error);
      // Error is handled by the hook itself
    }
  };

  if (domainsLoading) {
    return (
      <div className="min-h-screen pt-32 px-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if user has no domains
  if (!domains || domains.length === 0) {
    return (
      <div className="min-h-screen pt-32 desktop:px-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-start mb-12">
            <Text className="text-4xl md:text-5xl font-bold mb-4">
              Subdomains
            </Text>
            <Text className="text-white/60 text-lg">
              Create subdomains for your existing domains
            </Text>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white/5 rounded-full p-6 mb-6">
              <AlertCircle className="h-12 w-12 text-white/40" />
            </div>
            <Text className="text-xl font-medium mb-2">No domains created</Text>
            <Text className="text-white/60 text-center max-w-md">
              You need to own at least one domain before you can create
              subdomains. Register a domain first.
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 desktop:px-40 px-4">
      <div className="">
        {/* Title */}
        <div className="text-start mb-12">
          <Text className="text-4xl md:text-5xl font-bold mb-4">
            Subdomains
          </Text>
          <Text className="text-white/60 text-lg">
            Create subdomains for your existing domains
          </Text>
        </div>

        {/* Search Section */}
        <div className="bg-black-600 backdrop-blur-sm border border-gray-700 font-poppins rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Domain Select Dropdown */}
            <div className="relative flex-1">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Select Parent Domain
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  // CHANGED: Disable dropdown during search or purchase
                  disabled={isSearching || isPurchasing || isConfirming}
                  className={`
                    w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 
                    text-left text-white focus:border-primary focus:outline-none 
                    transition-colors flex items-center justify-between
                    ${(isSearching || isPurchasing || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span>
                    {selectedDomain
                      ? selectedDomain.name
                      : "Select a domain..."}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      showDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-black-300 backdrop-blur-md rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {domains.map((domain) => (
                      <button
                        key={domain.name}
                        onClick={() => handleDomainSelect(domain)}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center justify-between"
                      >
                        <div>
                          <Text className="text-white font-medium">
                            {domain.name}
                          </Text>
                          <Text className="text-white/60 text-sm">
                            {domain.daysLeft} days remaining
                          </Text>
                        </div>
                        {domain.isPrimary && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Primary
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subdomain Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Subdomain Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={subdomainName}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  placeholder="Enter subdomain name"
                  // CHANGED: Disable input during search or purchase
                  disabled={isSearching || isPurchasing || isConfirming}
                  className={`
                    w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 
                    text-white placeholder-white/40 focus:border-green-900 focus:outline-none 
                    transition-colors
                    ${(isSearching || isPurchasing || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  maxLength={32}
                />
                {selectedDomain && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 mobile:hidden">
                    .{selectedDomain.name}
                  </div>
                )}
              </div>
              {subdomainName && !isValidSubdomain(subdomainName) && (
                <Text className="text-red-400 text-sm mt-2">
                  Subdomain must be 3-32 characters, contain only letters,
                  numbers, and hyphens
                </Text>
              )}
            </div>
          </div>

          {/* Search Preview */}
          {searchQuery && (
            <div className="bg-white/5 flex flex-col relative rounded-xl p-4 mb-4">
              <Text className="text-white/60 text-sm mb-1">
                Creating subdomain:
              </Text>
              <Text className="text-xl font-medium text-primary break-words">
                {searchQuery}
              </Text>
            </div>
          )}

          {/* Search Button */}
          <Button
            onClick={() => {
              if (selectedDomain && subdomainName.trim()) {
                const cleanSubdomain = subdomainName.trim().toLowerCase();
                const cleanParentDomain = selectedDomain.name.replace('.atgraphite', '');
                checkSubdomainAvailability(cleanSubdomain, cleanParentDomain);
              }
            }}
            disabled={
              !selectedDomain ||
              !subdomainName.trim() ||
              !isValidSubdomain(subdomainName) ||
              isSearching ||
              isPurchasing ||
              isConfirming
            }
            className={`
              w-full py-4 rounded-xl font-semibold transition-all
              ${selectedDomain &&
                subdomainName.trim() &&
                isValidSubdomain(subdomainName) &&
                !isSearching &&
                !isPurchasing &&
                !isConfirming
                ? "bg-primary hover:bg-primary/80 text-black"
                : "bg-white/10 text-white/40 cursor-not-allowed"
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="h-5 w-5" />
              {/* CHANGED: Better loading state text */}
              {isSearching ? "Checking..." : 
               isPurchasing ? "Purchasing..." :
               isConfirming ? "Confirming..." : 
               "Check Availability"}
            </div>
          </Button>
        </div>

        {/* Results */}
        {/* CHANGED: Updated to use subdomainResult from the hook */}
        {subdomainResult && selectedDomain && (
          <SubdomainResult
            // CHANGED: Pass the full subdomainResult object
            subdomainResult={subdomainResult}
            onPurchase={handlePurchase}
            loading={isPurchasing || isConfirming}
            error={purchaseError?.message || subdomainResult.error}
          />
        )}
      </div>
    </div>
  );
}