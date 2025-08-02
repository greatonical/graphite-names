// components/ui/AlternateConnectButton.tsx
"use client";
import React, { useRef, useState } from "react";
import { ButtonWrapper } from "./button";
import { Text } from "./text";
import { Icon } from "@iconify/react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { ProfileModal } from "../modal/profile.modal";
import { handleCopy } from "@/lib/utils/clipboard";

export const AlternateConnectButton = () => {
  const { openConnectModal } = useConnectModal();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { isConnected, address } = useAccount();
  const profileButtonRef = useRef<any>(null);

  const handleInstallGraphite = () => {
    window.open(
      "https://chromewebstore.google.com/detail/fbgdgmhhhlimaanngeakidegojjbbbbm?utm_source=item-share-cb",
      "_blank"
    );
  };

  const handleUseOtherWallets = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  // If connected, show disconnect button with address
  if (isConnected) {
    return (
      <div className="flex flex-row items-center gap-x-3">
        <ButtonWrapper
          className="flex flex-row items-center bg-primary text-black-600 rounded-lg px-4 py-2 gap-x-2"
          onClick={()=>{handleCopy(address?.toString()!)}}
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
          className="flex items-center justify-center w-8 h-8 bg-primary hover:bg-opacity-90 rounded-full transition-colors cursor-pointer"
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
    <div className="flex flex-col sm:flex-row items-center gap-2">
      {/* Install Graphite Button */}
      <ButtonWrapper
        className="flex flex-row items-center bg-primary text-black-600 rounded-lg px-4 py-2 gap-x-2 hover:bg-opacity-90 transition-colors"
        onClick={handleInstallGraphite}
      >
        <Icon icon="mdi:download" />
        <Text className="text-black-600 text-sm font-medium cursor-pointer">
          Install Graphite
        </Text>
      </ButtonWrapper>

      {/* Divider */}
      {/* <Text className="text-gray-400 text-sm">or</Text> */}

      {/* Use Other Wallets Button */}
      <ButtonWrapper
        className="flex flex-row items-center border border-primary text-primary bg-transparent hover:bg-primary hover:text-black-600 rounded-lg px-4 py-2 gap-x-2 transition-colors"
        onClick={handleUseOtherWallets}
      >
        <Icon icon="tdesign:wallet-filled" />
        <p className="text-sm font-medium cursor-pointer font-poppins">
          Use Other Wallets
        </p>
      </ButtonWrapper>
    </div>
  );
};
