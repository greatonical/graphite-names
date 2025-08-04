// components/ui/ProfileModal.tsx
"use client";
import React, { useRef, useEffect } from "react";
import { Text } from "../ui/text";
import { Icon } from "@iconify/react";
import { useDisconnect } from "wagmi";
import { routes } from "@/lib/constants/global.constants";
import { useRouter } from "next/navigation";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  triggerRef,
}) => {
  const { disconnect } = useDisconnect();
const router = useRouter()

  const modalRef = useRef<HTMLDivElement>(null);

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const handleManageSubdomains = () => {
    // Navigate to subdomains page or open subdomains modal
    console.log("Navigate to manage subdomains");
    onClose();
  };

  const handleAuction = () => {
    // Navigate to auction page or open auction modal
    console.log("Navigate to auction");
    onClose();
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="absolute right-20 top-20 mt-2 w-64 bg-black-600 rounded-lg shadow-lg border border-gray-700 py-2 z-50"
    >
      {routes.map((route) => (
        <button
          onClick={()=>{router.push(route.link); onClose()}}
          className="w-full flex flex-row items-center px-4 py-2 text-left hover:bg-neutral-700/80 transition-colors cursor-pointer"
          key={route.id}
        >
          <Icon
            icon={route.icon}
            className="w-4 h-4 mr-3 text-gray-400"
          />
          <Text className="text-white text-sm">
            {route.title}
          </Text>
        </button>
      ))}

   

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

      {/* Disconnect */}
      <button
        onClick={handleDisconnect}
        className="w-full flex flex-row items-center px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Icon
          icon="mdi:logout"
          className="w-4 h-4 mr-3 text-red-600 dark:text-red-400"
        />
        <Text className="text-red-600 dark:text-red-400 text-sm">
          Disconnect
        </Text>
      </button>
    </div>
  );
};
