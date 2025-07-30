// components/ui/ConnectButton.tsx
"use client";
import React, { useRef, useState } from "react";
import { ButtonWrapper } from "./button";
import { Text } from "./text";
import { Icon } from "@iconify/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ProfileModal } from "../modal/profile.modal";
import { copyToClipboard, handleCopy } from "@/lib/utils/clipboard";

export const ConnectButton = () => {
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address, chain } = useAccount();

  // States
  const profileButtonRef = useRef<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Find your Graphite connector
  const graphiteConnector = connectors.find(
    (connector) => connector.id === "graphite"
  );

  const handleConnect = () => {
    if (graphiteConnector) {
      connect({ connector: graphiteConnector });
    } else {
      alert("Graphite wallet is not installed");
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // If connected, show disconnect button with address
  if (isConnected) {
    return (
      <div className="flex flex-row items-center gap-x-3">
        <ButtonWrapper
          className="flex flex-row items-center bg-primary text-black-600 rounded-lg px-4 py-2 gap-x-2"
          onClick={() => {
            handleCopy(address?.toString()!);
          }}
          //   onClick={handleDisconnect}
        >
          <Icon icon="tdesign:wallet-filled" />
          <Text className="text-black-600 text-sm font-medium cursor-pointer">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </Text>
        </ButtonWrapper>
        <button
          ref={profileButtonRef}
          onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
          className="flex items-center justify-center w-8 h-8 bg-primary hover:bg-opacity-90 rounded-full transition-colors"
        >
          <Icon icon="mdi:account" className="w-5 h-5 text-black-600" />
        </button>
        {/* Profile Modal */}
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          triggerRef={profileButtonRef}
        />
      </div>
    );
  }

  // If not connected, show connect button
  return (
    <ButtonWrapper
      className="flex flex-row items-center bg-primary text-black-600 rounded-lg px-4 py-2 gap-x-2"
      onClick={handleConnect}
      disabled={isPending}
    >
      <Icon icon="tdesign:wallet-filled" />
      <Text className="text-black-600 text-sm font-medium cursor-pointer">
        {isPending ? "Connecting..." : "Connect Wallet"}
      </Text>
    </ButtonWrapper>
  );
};
