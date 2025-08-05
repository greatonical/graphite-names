"use client";
import React, { useEffect, useState, useCallback, memo } from "react";
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

// Memoize logo to prevent unnecessary re-renders
const MemoizedGraphiteLogo = memo(GraphiteLogo);

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

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [opened]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleToggleMenu = useCallback(() => {
    setOpened((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setOpened(false);
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
      setOpened(false);
    },
    [router]
  );

  const handleScrollToSection = useCallback((hash: string) => {
    router.push(`/#${hash}`);
    // scrollToHash(hash);
    setOpened(false);
  }, []);

  return (
    <>
      {/* Desktop Header */}
      <header className="w-full flex flex-row items-center justify-between top-0 fixed px-20 py-7 z-20 bg-transparent backdrop-blur-md mobile:hidden">
        <MemoizedGraphiteLogo />
        <AlternateConnectButton />
      </header>

      {/* Mobile Header */}
      <header className="w-full h-fit fixed top-0 z-40 flex flex-col items-center justify-between desktop:hidden">
        {/* Logo Container - Always Present, Never Unmounts */}
        <div
          className={`z-40 pt-4 flex flex-row w-full items-center justify-between pl-2 pr-6 pb-4 backdrop-blur-sm transition-all duration-50 ease-in-out ${
            opened ? "bg-black-600/40" : "bg-white/0"
          }`}
        >
          <MemoizedGraphiteLogo />

          <ButtonWrapper onClick={handleToggleMenu}>
            {opened ? (
              <X className="text-primary w-8 h-8" stroke="#72FB9D" />
            ) : (
              <Menu className="text-primary w-8 h-8" stroke="#72FB9D" />
            )}
          </ButtonWrapper>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`
            flex flex-col w-full items-center bg-black-600/40 backdrop-blur-lg
            transition-all duration-300 ease-in-out
            ${
              opened
                ? "h-screen opacity-100 pointer-events-auto"
                : "h-0 opacity-0 pointer-events-none overflow-hidden"
            }
          `}
        >
          <ul className="w-full flex flex-col items-start justify-center gap-[3px] gap-y-10 px-7 mt-14 text-white font-semibold">
            <Text
              className="font-poppins font-semibold text-white hover:text-primary cursor-pointer transition-all hover:-translate-y-1 text-2xl"
              onClick={() => handleNavigate("/home")}
            >
              Home
            </Text>
            {routes.map((route) => (
              <li
                key={route.id}
                className="font-poppins font-semibold text-white hover:text-primary cursor-pointer transition-all hover:-translate-y-1 text-2xl"
                onClick={() => handleNavigate(route.link)}
              >
                {route.title}
              </li>
            ))}
            <Text
              className="font-poppins font-semibold text-white hover:text-primary cursor-pointer transition-all hover:-translate-y-1 text-2xl"
              onClick={() => handleScrollToSection("about")}
            >
              About
            </Text>
            <AlternateConnectButton />
          </ul>
        </div>
      </header>
    </>
  );
};
