// components/Spinner.tsx
import React from "react";
import { motion } from "framer-motion";

export const Spinner = ({ className = "mr-2 w-5 h-5 text-white" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export const TokenFormSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Success Checkmark
export const SuccessCheckmark = () => (
  <motion.svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-24 w-24 text-green-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </motion.svg>
);

export const CoinRowSkeleton = () => (
  <>
    {/* Desktop */}
    <span className="bg-white/5 mobile:hidden flex flex-row items-center gap-x-4 pr-4 rounded-xl w-full backdrop-blur-xl animate-pulse">
      <div className="w-48 h-48 rounded-2xl bg-gray-700"></div>
      <div className="flex flex-col gap-y-2">
        <div className="h-5 w-48 bg-gray-700 rounded"></div>
        <div className="h-4 w-16 bg-gray-700 rounded"></div>
        <div className="h-4 w-28 bg-gray-700 rounded"></div>
      </div>
    </span>

    {/* Mobile */}
    <span className="bg-white/5 desktop:hidden flex flex-row items-center gap-x-4 pr-4 rounded-xl w-full backdrop-blur-xl animate-pulse">
      <div className="w-24 h-24 rounded-2xl bg-gray-700"></div>
      <div className="flex flex-col gap-y-2">
        <div className="h-5 w-24 bg-gray-700 rounded"></div>
        <div className="h-4 w-16 bg-gray-700 rounded"></div>
        <div className="h-4 w-28 bg-gray-700 rounded"></div>
      </div>
    </span>
  </>
);

export const WebSocketStatus: React.FC<{
  isConnected: boolean;
  isSubscribed?: boolean;
  className?: string;
}> = ({ isConnected, isSubscribed, className }) => {
  return (
    <div className={`flex items-center gap-2 text-xs ${className || ""}`}>
      <div
        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className={isConnected ? "text-green-400" : "text-red-400"}>
        {isConnected ? "WebSocket connected" : "WebSocket disconnected"}
      </span>
      {isSubscribed && (
        <span className="text-blue-400">• Subscription active</span>
      )}
    </div>
  );
};
