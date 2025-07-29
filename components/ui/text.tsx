    "use client";
import { TextProps, CopyableTextProps } from "@lib/interface/ui.interface"
import { twMerge } from 'tailwind-merge'
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";


export const Text:React.FC<TextProps> = ({
    className,
    children,
    text,
        ...props
    }) => {
      return (
        <div className={twMerge(`font-poppins text-white`, className) } {...props}>
           {children ? children : text}
        </div>
      )
    }

    export const FaqTitle:React.FC<TextProps> = ({
    className,
    children,
    text,
        ...props
    }) => {
      return (
        <div className={twMerge(`font-poppins text-4xl font-bold text-primary`, className) } {...props}>
           {children ? children : text}
        </div>
      )
    }



/**
 * CopyableText wraps any inline content and shows a copy icon.
 * When clicked, it copies `text` to clipboard, shows a checkmark for 2s, then reverts.
 */
export const CopyableText: React.FC<CopyableTextProps> = ({ text, className = "", children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <span
      className={`inline-flex items-center space-x-2 cursor-pointer ${className}`}
      onClick={handleCopy}
    >
      <span>{children ?? text}</span>
      {copied ? (
        <Check className="text-primary" size={16} />
      ) : (
        <Copy className="text-white/50 hover:text-white" size={16} />
      )}
    </span>
  );
};
