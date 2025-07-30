// components/ui/AlternateConnectButton.tsx
"use client"
import React from "react";
import { ButtonWrapper } from "./button";
import { Text } from "./text";
import { Icon } from "@iconify/react";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export const AlternateConnectButton = () => {
  const { openConnectModal } = useConnectModal();

  const handleInstallGraphite = () => {
    window.open('https://chromewebstore.google.com/detail/fbgdgmhhhlimaanngeakidegojjbbbbm?utm_source=item-share-cb', '_blank');
  };

  const handleUseOtherWallets = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

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