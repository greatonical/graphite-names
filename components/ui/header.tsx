"use client";
import React, { useEffect, useState } from "react";
import { GraphiteLogo } from "./logo";
import { useGraphiteWallet } from "@/lib/hooks/useGraphiteWallet";
import { ConnectButton } from "./connect-button";
import { AlternateConnectButton } from "./alternate-connect-button";
import { Image } from "./image";
import { Text } from "./text";
import { NavbarHamburgerIcon } from "../icons/hamburger-icon";
import { NavbarExitIcon } from "../icons/exit-icon";
import { scrollToHash } from "@/lib/utils/scroll";
import { Menu, X } from "lucide-react";
import { ButtonWrapper } from "./button";
import { routes } from "@/lib/constants/global.constants";
import { useRouter } from "next/navigation";

export const Header = () => {
  const { isInstalled: isGraphiteInstalled } = useGraphiteWallet();

  const [opened, setOpened] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (opened) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
  }, [opened]);

  return (
    <>
      <header className="w-full flex flex-row items-center justify-between  top-0 fixed px-20 py-7 z-20 bg-transparent backdrop-blur-md mobile:hidden">
        <GraphiteLogo />
        {/* {isG
      raphiteInstalled ? <ConnectButton />: <AlternateConnectButton/>} */}
        <AlternateConnectButton />
      </header>

      {/* Mobile Header */}
      <header className="w-full h-fit fixed top-0 z-40 flex flex-col items-center justify-between desktop:hidden">
        {!opened && (
          <div className=" z-40 pt-4 flex flex-row w-full items-center justify-between pl-2 pr-6 pb-4 bg-white/0 backdrop-blur-sm  ">
            <GraphiteLogo />

            <ButtonWrapper
              onClick={() => {
                setOpened(!opened);
              }}
            >
              <Menu className="text-primary w-8 h-8" stroke="#72FB9D" />
            </ButtonWrapper>
          </div>
        )}

        {opened && (
          <div className="flex flex-col w-full h-screen items-center bg-primary-dark/5 backdrop-blur-lg">
            <ButtonWrapper
              className="self-end z-40 mr-6 my-10"
              onClick={() => {
                setOpened(!opened);
              }}
            >
              {/* <NavbarExitIcon /> */}
              <X className="text-primary w-8 h-8" stroke="#72FB9D"/>

            </ButtonWrapper>

            <ul className="w-full flex flex-col items-start justify-center gap-[3px] gap-y-10 px-7 mt-14 text-white font-semibold">
              <Text
                className="font-poppins font-semibold text-white  hover:text-primary cursor-pointer transition-all hover:-translate-y-1 text-2xl"
                onClick={() => {
                  router.push("/home");
                  setOpened(!opened);
                }}
              >
                Home
              </Text>
              {routes.map((route) => (
                <li
                  key={route.id}
                  className="font-poppins font-semibold text-white  hover:text-primary cursor-pointer transition-all hover:-translate-y-1 text-2xl"
                  onClick={() => {
                    router.push(route.link);
                    setOpened(!opened);
                  }}
                >
                  {route.title}
                </li>
              ))}
              <Text
                className="font-poppins font-semibold text-white  hover:text-primary cursor-pointer transition-all hover:-translate-y-1 text-2xl"
                onClick={() => {
                  scrollToHash("about");
                  setOpened(!opened);
                }}
              >
                About
              </Text>
              <AlternateConnectButton />
            </ul>
          </div>
        )}
      </header>
    </>
  );
};
