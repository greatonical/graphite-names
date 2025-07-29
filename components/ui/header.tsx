import React from "react";
import { GraphiteLogo } from "./logo";
import { ButtonWrapper } from "./button";
import { Text } from "./text";
import { Icon } from "@iconify/react";

export const Header = () => {
  return (
    <header className="w-full flex flex-row items-center justify-between  top-0 fixed px-20 py-7 z-20">
      <GraphiteLogo />
      <ButtonWrapper className="flex flex-row items-center bg-primary text-black-600 rounded-lg px-4 py-2 gap-x-2">
        <Icon icon="tdesign:wallet-filled"/>
        <Text className="text-black-600 text-sm font-medium cursor-pointer">Connect Wallet</Text>
      </ButtonWrapper>
    </header>
  );
};
