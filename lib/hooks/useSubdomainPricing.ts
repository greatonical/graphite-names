// lib/hooks/useSubdomainPricing.ts
"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseAbi, encodeFunctionData, parseEther } from "viem";
import toast from "react-hot-toast";
import { style } from "../constants/style.constants";

const SUBDOMAIN_ABI = parseAbi([
  "function setSubdomainPrice(bytes32 parentNode, string label, uint256 price)",
  "function priceOfSubdomain(bytes32 parentNode, string label) view returns (uint256)",
]);

const SUBDOMAIN_ADDRESS = process.env
  .NEXT_PUBLIC_SUBDOMAIN_ADDRESS as `0x${string}`;

export function useSubdomainPricing() {
  const { address, connector } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proper wallet detection using wagmi connector
  const isUsingGraphiteWallet = () => {
    if (typeof window === "undefined" || !window.graphite || !connector) {
      return false;
    }

    // Check the actual connected connector
    const connectorId = connector.id;
    const connectorName = connector.name?.toLowerCase() || "";

    console.log("🔍 Subdomain Pricing - Wallet detection:", {
      connectorId,
      connectorName,
      hasGraphiteWindow: !!window.graphite,
      currentAddress: address,
    });

    // Return true only if we're actually connected via Graphite connector
    return connectorId === "graphite" || connectorName.includes("graphite");
  };

  // Updated Graphite wallet method with better error handling
  const setSubdomainPriceWithGraphite = async (
    parentNode: string,
    priceInEther: string
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    console.log("🟣 Graphite subdomain pricing - setting price...", {
      parentNode,
      priceInEther,
      address,
    });

    const priceWei = parseEther(priceInEther);

    // For setting a global price, we use "*" as the label wildcard
    const callData = encodeFunctionData({
      abi: SUBDOMAIN_ABI,
      functionName: "setSubdomainPrice",
      args: [parentNode as `0x${string}`, "*", priceWei],
    });

    console.log("🟣 Graphite subdomain pricing - sending transaction...", {
      to: SUBDOMAIN_ADDRESS,
      dataLength: callData.length,
      priceWei: priceWei.toString(),
    });

    const txHash = await window.graphite?.sendTx({
      to: SUBDOMAIN_ADDRESS,
      data: callData,
      gas: "0x186A0", // 100,000 gas
    });

    console.log("🟣 Graphite subdomain pricing - transaction sent:", txHash);
    return txHash;
  };

  // Updated wagmi method with better error handling
  const setSubdomainPriceWithWagmi = async (
    parentNode: string,
    priceInEther: string
  ) => {
    if (!address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    console.log("🔵 MetaMask subdomain pricing - setting price...", {
      parentNode,
      priceInEther,
      address,
    });

    const priceWei = parseEther(priceInEther);

    console.log("🔵 MetaMask subdomain pricing - sending transaction...", {
      contract: SUBDOMAIN_ADDRESS,
      priceWei: priceWei.toString(),
    });

    const txHash = await walletClient.writeContract({
      address: SUBDOMAIN_ADDRESS,
      abi: SUBDOMAIN_ABI,
      functionName: "setSubdomainPrice",
      args: [parentNode as `0x${string}`, "*", priceWei],
    });

    console.log("🔵 MetaMask subdomain pricing - transaction sent:", txHash);
    return txHash;
  };

  const setSubdomainPrice = async (
    parentNode: string,
    priceInEther: string
  ) => {
    if (!address) {
      throw new Error("Please connect your wallet");
    }

    if (!priceInEther || parseFloat(priceInEther) < 0) {
      throw new Error("Please enter a valid price");
    }

    console.log("🚀 Starting subdomain price setting:", {
      parentNode,
      priceInEther,
      wallet: isUsingGraphiteWallet() ? "Graphite" : "MetaMask",
    });

    setLoading(true);
    setError(null);

    try {
      let txHash: string;

      // Better wallet detection and routing
      if (isUsingGraphiteWallet()) {
        console.log("📱 Using Graphite Wallet for subdomain pricing");
        txHash =
          (await setSubdomainPriceWithGraphite(parentNode, priceInEther)) ?? "";
      } else {
        console.log("🦊 Using MetaMask/Standard wallet for subdomain pricing");
        txHash = await setSubdomainPriceWithWagmi(parentNode, priceInEther);
      }

      console.log("✅ Subdomain price transaction submitted:", txHash);

      // Wait for transaction confirmation
      if (publicClient && txHash) {
        console.log("⏳ Waiting for transaction confirmation...");
        await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });
        console.log("✅ Transaction confirmed!");
        
        // IMPROVED: Better success toast with unique ID to prevent duplicates
        const confirmId = `subdomain-confirm-${txHash}`;
        toast.success("🎉 Subdomains activated successfully!", {
          id: confirmId,
          style: style.toast,
          duration: 6000,
        });
      }

      return txHash;
    } catch (err: any) {
      console.error("❌ Subdomain price setting failed:", err);

      // Better error message handling
      let errorMessage = "Failed to set subdomain price";

      if (err?.message) {
        const msg = err.message.toLowerCase();
        if (msg.includes("user rejected") || msg.includes("denied")) {
          errorMessage = "Transaction cancelled by user";
        } else if (msg.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas fees";
        } else if (msg.includes("not owner") || msg.includes("unauthorized")) {
          errorMessage = "You are not the owner of this domain";
        } else if (msg.includes("invalid price")) {
          errorMessage = "Invalid price value";
        } else {
          errorMessage = err.message;
        }
      }

      // IMPROVED: Show error toast with unique ID
      const errorId = `subdomain-error-${Date.now()}`;
      toast.error(errorMessage, {
        id: errorId,
        style: style.toast,
        duration: 5000,
      });

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSubdomainPrice = async (
    parentNode: string
  ): Promise<bigint | null> => {
    if (!publicClient) {
      return null;
    }

    try {
      const price = await publicClient.readContract({
        address: SUBDOMAIN_ADDRESS,
        abi: SUBDOMAIN_ABI,
        functionName: "priceOfSubdomain",
        args: [parentNode as `0x${string}`, "*"],
      });
      return price;
    } catch (err) {
      console.log("ℹ️ Subdomain price not set for domain:", parentNode);
      // Price not set
      return null;
    }
  };

  return {
    setSubdomainPrice,
    getSubdomainPrice,
    loading,
    error,
  };
}