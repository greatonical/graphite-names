// components/ui/ConnectButton.tsx
"use client";
import React from "react";
import { ButtonWrapper } from "./button";
import { Text } from "./text";
import { Icon } from "@iconify/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export const ConnectButton = () => {
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address, chain } = useAccount();

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
      <>
        <ButtonWrapper
          className="flex flex-row items-center bg-primary text-black-600 rounded-lg px-4 py-2 gap-x-2"
          onClick={handleDisconnect}
        >
          <Icon icon="tdesign:wallet-filled" />
          <Text className="text-black-600 text-sm font-medium cursor-pointer">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </Text>
        </ButtonWrapper>
      </>
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
