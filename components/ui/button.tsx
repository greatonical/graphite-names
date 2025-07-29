"use client";
import React, { useEffect, useState } from "react";
import {
  ButtonProps,
  MotionButtonProps,
  MotionButtonWrapperProps,
} from "@lib/interface/ui.interface";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { isMobile } from "@/lib/constants/global.constants";

export const Button: React.FC<MotionButtonProps> = ({
  text,
  children,
  className,
  onClick,
  ...props
}) => {
  return (
    <motion.button
      whileTap={{ opacity: 0.5 }}
      className={twMerge(
        `bg-primary flex flex-col items-center justify-center transition-all text-black-900 font-poppins font-medium px-7 py-5 rounded-lg cursor-pointer`,
        className
      )}
      onClick={(event) => {
        if (onClick) {
          onClick(event);
        }
      }}
      {...props}
    >
      {text ? text : children}
      {/* <div className="text-center w-full">(Beta Version)</div> */}
    </motion.button>
  );
};

export const CustomButton: React.FC<ButtonProps> = ({
  text,
  className,
  children,
  onClick,
  ...props
}) => {
  return (
    <button
      className={twMerge(
        `bg-primary hover:bg-gradient-to-br from-healthcare-primary to-cyan-400 text-white text-sm font-brandon-black w-fit h-10 px-7  rounded-lg`,
        className
      )}
      onClick={(event) => {
        if (onClick) {
          onClick(event);
        }
      }}
      {...props}
    >
      {children ? children : text}
    </button>
  );
};

export const OutlinedButton: React.FC<ButtonProps> = ({
  text,
  className,
  ...props
}) => {
  return (
    <button
      className={twMerge(
        `border-white border-2 px-4 text-white text-7xl p-10 bg-white bg-opacity-5 backdrop-blur-lg font-cera font-black rounded-full cursor-pointer bg-gradient-to-r desktop:hover:from-white/90 desktop:hover:via-transparent desktop:hover:to-white/90 transition-transform ease-in-out duration-1000`,
        className
      )}
      {...props}
    >
      {text}
    </button>
  );
};

export const ButtonWrapper: React.FC<MotionButtonWrapperProps> = ({
  className,
  onClick,
  ...props
}) => {
  return (
    <motion.button
      whileTap={{ opacity: isMobile() ? 1 : 0.5 }}
      className={`transition-all cursor-pointer ${className}`}
      onClick={(event) => {
        if (onClick) {
          onClick(event);
        }
      }}
      {...props}
    >
      {props.children}
    </motion.button>
  );
};