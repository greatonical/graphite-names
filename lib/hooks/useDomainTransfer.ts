// lib/hooks/useDomainTransfer.ts
"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseAbi, encodeFunctionData } from "viem";
import toast from "react-hot-toast";
import { style } from "../constants/style.constants";

// CHANGED: Updated ABI with correct function names from actual contract
const REGISTRY_ABI = parseAbi([
  "function nodeToToken(bytes32 node) view returns (uint256)",
  "function transferNode(bytes32 node, address to)",
  "function getDomain(bytes32 node) view returns (address owner, address resolver, uint64 expiry, bytes32 parent)",
  "function transferWithSig(bytes32 node, address from, address to, uint256 nonce, uint256 deadline, bytes calldata signature)",
  "function nonces(address account) view returns (uint256)",
]);

const REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

export function useDomainTransfer() {
  const { address, connector } = useAccount(); // CHANGED: Added connector from useAccount
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CHANGED: Proper wallet detection using wagmi connector
  const isUsingGraphiteWallet = () => {
    if (typeof window === "undefined" || !window.graphite || !connector) {
      return false;
    }

    // Check the actual connected connector
    const connectorId = connector.id;
    const connectorName = connector.name?.toLowerCase() || "";

    console.log("🔍 Wallet detection:", {
      connectorId,
      connectorName,
      hasGraphiteWindow: !!window.graphite,
      currentAddress: address,
    });

    // Return true only if we're actually connected via Graphite connector
    return connectorId === "graphite" || connectorName.includes("graphite");
  };

  // CHANGED: Updated to use the correct transferNode function
  const transferWithGraphite = async (node: string, to: string) => {
    if (!address || !publicClient) {
      throw new Error("Wallet not connected");
    }

    console.log("🟣 Graphite transfer - checking domain ownership...");

    // Verify we own the domain
    const domainInfo = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "getDomain",
      args: [node as `0x${string}`],
    });

    const currentOwner = domainInfo[0];
    if (currentOwner.toLowerCase() !== address.toLowerCase()) {
      throw new Error("You do not own this domain");
    }

    console.log("🟣 Graphite transfer - encoding transaction...");

    // CHANGED: Use transferNode function directly
    const callData = encodeFunctionData({
      abi: REGISTRY_ABI,
      functionName: "transferNode",
      args: [node as `0x${string}`, to as `0x${string}`],
    });

    console.log("🟣 Graphite transfer - sending transaction...", {
      to: REGISTRY_ADDRESS,
      dataLength: callData.length,
      recipient: to,
    });

    // Send transaction via Graphite wallet
    const txHash = await window.graphite?.sendTx({
      to: REGISTRY_ADDRESS,
      data: callData,
      gas: "0x186A0", // 100,000 gas
    });

    console.log("🟣 Graphite transfer - transaction sent:", txHash);
    return txHash;
  };

  // CHANGED: Added proper MetaMask/wagmi transfer function
  const transferWithWagmi = async (node: string, to: string) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    console.log("🔵 MetaMask transfer - checking domain ownership...");

    // Verify we own the domain
    const domainInfo = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "getDomain",
      args: [node as `0x${string}`],
    });

    const currentOwner = domainInfo[0];
    if (currentOwner.toLowerCase() !== address.toLowerCase()) {
      throw new Error("You do not own this domain");
    }

    console.log("🔵 MetaMask transfer - sending transaction...", {
      from: address,
      to: to,
      contract: REGISTRY_ADDRESS,
    });

    // CHANGED: Use transferNode function directly with proper wagmi pattern
    const txHash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "transferNode",
      args: [node as `0x${string}`, to as `0x${string}`],
    });

    console.log("🔵 MetaMask transfer - transaction sent:", txHash);
    return txHash;
  };

  const transferDomain = async (node: string, to: string) => {
    if (!address) {
      throw new Error("Please connect your wallet");
    }

    if (!to.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid recipient address");
    }

    if (to.toLowerCase() === address.toLowerCase()) {
      throw new Error("Cannot transfer to yourself");
    }

    console.log("🚀 Starting domain transfer:", {
      node,
      to,
      wallet: isUsingGraphiteWallet() ? "Graphite" : "MetaMask",
    });

    setLoading(true);
    setError(null);

    try {
      let txHash: string;

      // CHANGED: Better wallet detection and routing
      if (isUsingGraphiteWallet()) {
        console.log("🪨 Using Graphite Wallet for transfer");
        txHash = (await transferWithGraphite(node, to)) ?? "";
      } else {
        console.log("🦊 Using MetaMask/Standard wallet for transfer");
        txHash = await transferWithWagmi(node, to);
      }

      console.log("✅ Transfer transaction submitted:", txHash);

      // CHANGED: Wait for transaction confirmation
      if (publicClient && txHash) {
        console.log("⏳ Waiting for transaction confirmation...");
        await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });
        console.log("✅ Transaction confirmed!");
        const confirmId = `confirm-${txHash}`;
        toast.success("🎉 Domain transferred and confirmed!", {
          id: confirmId,
          style: style.toast,
          duration: 6000,
        });
      }

      return txHash;
    } catch (err: any) {
      console.error("❌ Transfer failed:", err);

      // CHANGED: Better error message handling
      let errorMessage = "Transfer failed";

      if (err?.message) {
        const msg = err.message.toLowerCase();
        if (msg.includes("user rejected") || msg.includes("denied")) {
          errorMessage = "Transaction cancelled by user";
        } else if (msg.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas fees";
        } else if (msg.includes("not owner") || msg.includes("do not own")) {
          errorMessage = "You do not own this domain";
        } else if (msg.includes("invalid address")) {
          errorMessage = "Invalid recipient address";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    transferDomain,
    loading,
    error,
  };
}
