// components/ui/DomainMenu.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { ArrowRightLeft, Calendar } from 'lucide-react';
import { Text } from '../ui/text';
import { ButtonWrapper } from '../ui/button';

interface DomainMenuProps {
  onTransfer: () => void;
  onExtend: () => void;
  onClose: () => void;
}

export const DomainMenu: React.FC<DomainMenuProps> = ({ 
  onTransfer, 
  onExtend, 
  onClose 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems = [
    {
      icon: ArrowRightLeft,
      label: 'Transfer name',
      onClick: onTransfer,
    },
    {
      icon: Calendar,
      label: 'Extend registration',
      onClick: onExtend,
    },
  ];

  return (
    <div 
      ref={menuRef}
      className="absolute right-6 top-full mt-2 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl overflow-hidden min-w-[200px]"
    >
      {menuItems.map((item, index) => (
        <ButtonWrapper
          key={index}
          onClick={item.onClick}
          className="w-full flex items-center gap-3 px-4 py-3 group hover:desktop:bg-primary transition-colors text-left"
        >
          <item.icon className="h-4 w-4 text-white/60 group-hover:desktop:text-black-600" />
          <Text className="text-white group-hover:desktop:text-black-600 text-sm font-medium">
            {item.label}
          </Text>
        </ButtonWrapper>
      ))}
    </div>
  );
};