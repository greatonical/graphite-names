"use client"
import { SearchTextInputProps } from "@lib/interface/ui.interface";
import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const SearchTextInput: React.FC<SearchTextInputProps> = ({
  title,
  className,
  searchQuery,
  setSearchQuery,
  ...props
}) => {
  const [isInputFocused, setInputFocused] = useState(false);
  const isActive = isInputFocused || searchQuery.length > 0;
  return (
    <div
      className={twMerge(
        `flex flex-row items-center border-2 rounded-lg p-4 gap-x-4 px-5 bg-black-500 font-poppins transition-all ${
          isActive ? "border-green-900" : "border-black-300"
        }`,
        className
      )}
    >
      <SearchIcon stroke={isActive ? "#fff" : "#B8B8B8"} />
      <input
        type="text"
        placeholder="Search coin"
        className=" w-full text-white placeholder-outline bg-transparent focus:outline-none focus:border-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        {...props}
      />
      {isActive && (
        <button className="mr-2" onClick={() => setSearchQuery("")}>
          <XIcon className="w-4 h-4 text-black-100" />
        </button>
      )}
    </div>
  );
};
