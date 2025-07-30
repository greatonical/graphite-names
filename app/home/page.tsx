"use client";
import { Button, ButtonWrapper } from "@/components/ui/button";
import { SearchTextInput } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import React, { useState } from "react";
import { Typewriter } from "react-simple-typewriter";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <main className="bg-transparent w-screen h-screen px-40 flex flex-col justify-center relative">
      <h1 className="text-2xl font-medium text-white font-poppins">
        Find your{" "}
        <span className="text-primary font-poppins">
          <Typewriter
            words={[
              "perfect domain",
              "identity",
              "profile",
              "cool spot",
            ]}
            loop={0}
            cursor
            cursorStyle=" "
            typeSpeed={70}
            deleteSpeed={50}
            delaySpeed={1000}
          />
        </span>
        on <span className="text-green-400">Graphite</span>
      </h1>

      <div className="flex flex-row items-center w-full gap-x-4 mt-2">
        <SearchTextInput
          className="w-full py-5"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <Button text="Search" className="text-black-600" />
      </div>

      <ButtonWrapper className="flex flex-row gap-x-2 items-center absolute bottom-12 self-center font-medium bg-black-600/50 px-4 py-3 rounded-full">
        <Text className="text-primary">Scroll down</Text>
         <svg
          className="animate-bounce ease-in-out duration-[50] transition-all"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="9"
          viewBox="0 0 17 9"
          fill="none"
        >
          <path
            d="M15.5 1L9.20711 7.29289C8.81658 7.68342 8.18342 7.68342 7.79289 7.29289L1.5 0.999999"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ButtonWrapper>
    </main>
  );
}
