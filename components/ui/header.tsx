"use client";
import React from "react";
import { GraphiteLogo } from "./logo";
import { useGraphiteWallet } from "@/lib/hooks/useGraphiteWallet";
import { ConnectButton } from "./connect-button";
import { AlternateConnectButton } from "./alternate-connect-button";

export const Header = () => {
  const { isInstalled: isGraphiteInstalled } = useGraphiteWallet();

  return (
    <header className="w-full flex flex-row items-center justify-between  top-0 fixed px-20 py-7 z-20">
      <GraphiteLogo />
      {isGraphiteInstalled ? <ConnectButton />: <AlternateConnectButton/>}
    </header>
  );
};
