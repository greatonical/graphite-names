// components/ui/DomainResult.tsx
"use client";
import React, { useState } from "react";
import { ButtonWrapper } from "./button";
import { Text } from "./text";
import { Icon } from "@iconify/react";
import { DomainResult as DomainResultType } from "@/lib/hooks/useDomainAvailability";
import { formatEther } from "viem";

interface DomainResultProps {
  result: DomainResultType;
  onPurchase: (
    domain: string,
    price: bigint,
    duration: number,
    resolver?: `0x${string}`
  ) => void;
  isPurchasing: boolean;
  isConfirming: boolean;
}

export const DomainResult: React.FC<DomainResultProps> = ({
  result,
  onPurchase,
  isPurchasing,
  isConfirming,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customResolver, setCustomResolver] = useState("");
  const [duration, setDuration] = useState(1); // Default 1 year

  const { domain, isAvailable, price, priceInEth, isLoading, error } = result;

  // Calculate total price based on duration
  const totalPrice = price * BigInt(duration);
  const totalPriceInEth = formatEther(totalPrice);

  const handlePurchase = () => {
    const resolverAddress = customResolver.trim() || undefined;
    onPurchase(domain, totalPrice, duration, resolverAddress as `0x${string}`);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-6 mt-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
          <div className="h-4 bg-gray-600 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-900/20 border border-red-500 rounded-lg p-6 mt-4">
        <div className="flex items-center space-x-3">
          <Icon icon="mdi:alert-circle" className="w-6 h-6 text-red-400" />
          <Text className="text-red-400 font-medium">{error}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black-500 backdrop-blur-sm border border-black-300 rounded-lg p-6 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className={`w-3 h-3 rounded-full ${
              isAvailable ? "bg-primary" : "bg-red-500"
            }`}
          ></div>

          <div className="space-y-1">
            <Text className="text-white text-lg font-semibold font-poppins">
              {domain}.atgraphite
            </Text>
            <Text
              className={`text-sm font-poppins ${
                isAvailable ? "text-primary" : "text-red-400"
              }`}
            >
              {isAvailable ? "Available" : "Not Available"}
            </Text>
          </div>
        </div>

        {isAvailable && (
          <div className="flex flex-col gap-y-2 items-end">
            {/* Duration Selector */}
            <div className="flex items-center space-x-2">
              <Text className="text-gray-400 text-sm font-poppins">
                Duration:
              </Text>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm font-poppins focus:border-primary focus:outline-none"
                disabled={isPurchasing || isConfirming}
              >
                <option value={1}>1 Year</option>
                <option value={2}>2 Years</option>
                <option value={3}>3 Years</option>
                <option value={5}>5 Years</option>
                <option value={10}>10 Years</option>
              </select>
            </div>

            <view className="flex items-center space-x-4">
              <div className="text-right space-y-2">
                {/* Price Display */}
                <div>
                  <Text className="text-gray-400 text-xs font-poppins">
                    {duration > 1
                      ? `${priceInEth} @G × ${duration} years`
                      : "Price"}
                  </Text>
                  <Text className="text-white text-xl font-bold font-poppins">
                    {totalPriceInEth} @G
                  </Text>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <ButtonWrapper
                  className="flex flex-row items-center bg-primary hover:bg-primary/90 text-black-600 rounded-lg px-6 py-3 gap-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handlePurchase}
                  disabled={isPurchasing || isConfirming}
                >
                  {isPurchasing || isConfirming ? (
                    <>
                      <Icon
                        icon="mdi:loading"
                        className="w-4 h-4 animate-spin"
                      />
                      <Text className="text-black-600 text-sm font-medium font-poppins">
                        {isPurchasing ? "Confirming..." : "Processing..."}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:shopping" className="w-4 h-4" />
                      <Text className="text-black-600 text-sm font-medium font-poppins">
                        Buy Domain
                      </Text>
                    </>
                  )}
                </ButtonWrapper>

                {/* <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                disabled={isPurchasing || isConfirming}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button> */}
              </div>
            </view>
          </div>
        )}
      </div>

      {/* Advanced Options */}
      {isAvailable && showAdvanced && (
        <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <Text className="text-white text-sm font-medium font-poppins mb-2">
            Advanced Options
          </Text>
          <div className="space-y-2">
            <label className="block">
              <Text className="text-gray-400 text-xs font-poppins mb-1">
                Custom Resolver (optional)
              </Text>
              <input
                type="text"
                value={customResolver}
                onChange={(e) => setCustomResolver(e.target.value)}
                placeholder="0x... (leave empty for default)"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono focus:border-primary focus:outline-none"
                disabled={isPurchasing || isConfirming}
              />
            </label>
            <Text className="text-gray-500 text-xs font-poppins">
              Leave empty to use the default resolver. Only change if you know
              what you're doing.
            </Text>
          </div>
        </div>
      )}

      {!isAvailable && (
        <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
          <Text className="text-gray-300 text-sm font-poppins">
            This domain is already registered. Try searching for a different
            name.
          </Text>
        </div>
      )}
    </div>
  );
};
