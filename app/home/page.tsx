"use client";
import { Button, ButtonWrapper } from "@/components/ui/button";
import { SearchTextInput } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import React, { useEffect, useState } from "react";
import { Typewriter } from "react-simple-typewriter";
import toast from "react-hot-toast";
import { useDomainAvailability } from "@/lib/hooks/useDomainAvailability";
import { DomainResult } from "@/components/ui/domain-result";
import { style } from "@/lib/constants/style.constants";
import { AboutSection } from "@/components/sections/about.section";
import { scrollToHash } from "@/lib/utils/scroll";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    domainResult,
    isSearching,
    checkDomainAvailability,
    purchaseDomain,
    isPurchasing,
    isConfirming,
    isSuccess,
    purchaseError,
    txHash
  } = useDomainAvailability();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      checkDomainAvailability(searchQuery.trim().toLowerCase());
    }
  };

 const handlePurchase = async (
  domain: string,
  totalPrice: bigint,
  duration: number,
  resolver?: `0x${string}`
) => {
  const purchaseId = `purchase-${domain}-${Date.now()}`; // Unique ID for this purchase
  
  try {
    console.log("Home: Starting purchase...", {
      domain,
      totalPrice,
      duration,
      resolver,
    });
    
    // Show loading toast
    toast.loading("Submitting transaction...", { 
      id: purchaseId,
      style: style.toast 
    });
    
    const result = await purchaseDomain(domain, totalPrice, duration, resolver);
    console.log("Home: Purchase initiated successfully", result);
    
    // Update to success toast
    toast.success("Transaction submitted successfully!", { 
      id: purchaseId, // Same ID replaces the loading toast
      style: style.toast,
      duration: 4000
    });
    
  } catch (error: any) {
    console.error("Purchase failed:", error);
    
    const errorMessage = error?.message || "Purchase failed. Please try again.";
    
    // Update to error toast
    toast.error(errorMessage, { 
      id: purchaseId, // Same ID replaces the loading toast
      style: style.toast 
    });
  }
};

// Optional: Add useEffect to show final confirmation
useEffect(() => {
  if (isSuccess && txHash) {
    const confirmId = `confirm-${txHash}`;
    toast.success("🎉 Domain purchased and confirmed!", { 
      id: confirmId,
      style: style.toast,
      duration: 6000 
    });
  }
}, [isSuccess, txHash]);

  // Handle successful purchase
  useEffect(() => {
    if (isSuccess) {
      setSearchQuery("");
      // Optionally refresh the search result
      if (domainResult) {
        setTimeout(() => {
          checkDomainAvailability(domainResult.domain);
        }, 2000); // Wait 2 seconds for the transaction to be processed
      }
    }
  }, [isSuccess, domainResult, checkDomainAvailability]);


  // Handle purchase errors
  useEffect(() => {
    if (purchaseError) {
      console.error("Purchase failed. Please try again.", purchaseError);
      toast.error(`Purchase failed: ${purchaseError.message}`, {
        style: style.toast,
      });
    }
  }, [purchaseError]);

  return (
    <>
      <main className="bg-transparent w-screen h-screen desktop:px-40 px-4 flex flex-col desktop:justify-center mobile:pt-64 relative overflow-y-scroll">
        <h1 className="text-2xl font-medium text-white font-poppins">
          Find your{" "}
          <span className="text-primary font-poppins">
            <Typewriter
              words={["perfect domain", "identity", "profile", "cool spot"]}
              loop={0}
              cursor
              cursorStyle=" "
              typeSpeed={70}
              deleteSpeed={50}
              delaySpeed={1000}
            />
          </span>
          on <span className="text-primary">Graphite</span>
        </h1>

        <div className="flex desktop:flex-row flex-col items-center w-full gap-x-4 mt-2">
          <SearchTextInput
            className="w-full py-5"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <Button
            text={isSearching ? "Searching..." : "Search"}
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="text-black-600 mobile:mt-2 mobile:w-full"
          />
        </div>

        {/* Domain Result */}
        {domainResult && (
          <DomainResult
            result={domainResult}
            onPurchase={handlePurchase}
            isPurchasing={isPurchasing}
            isConfirming={isConfirming}
          />
        )}

        <ButtonWrapper
          className="flex flex-row gap-x-2 items-center absolute desktop:bottom-12 bottom-32 self-center font-medium group bg-white/5 hover:desktop:bg-primary hover:desktop:text-black-600 px-4 py-3 rounded-full"
          onClick={() => {
            scrollToHash("about");
          }}
        >
          <Text className="text-primary group-hover:text-black">
            Scroll down
          </Text>
          <svg
            className="animate-bounce ease-in-out duration-[50] transition-all stroke-white group-hover:stroke-black-600"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="9"
            viewBox="0 0 17 9"
            fill="none"
          >
            <path
              d="M15.5 1L9.20711 7.29289C8.81658 7.68342 8.18342 7.68342 7.79289 7.29289L1.5 0.999999"
              // stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ButtonWrapper>
      </main>
      {/* About Section */}
      <AboutSection />
    </>
  );
}
