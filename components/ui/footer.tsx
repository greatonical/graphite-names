// components/ui/footer.tsx
"use client";

import React from 'react';
import { Text } from './text';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="">
      <div className="max-w-7xl mx-auto px-4 md:px-20 py-8">
        <div className="flex flex-col desktop:flex-row gap-x-8  items-center justify-center">
          {/* Copyright */}
          <Text className="text-white/40 text-lg">
            ©{currentYear === 2025 ? '2025' : `2025-${currentYear}`} BY GRAPHITE
          </Text>

          {/* Links */}
          <div className="flex items-center space-x-4 md:space-x-2 font-poppins">
            <a 
              href="/terms" 
              className="text-white/40 hover:text-white/60 text-lg transition-colors"
            >
              TERMS OF USE
            </a>
            <span className="text-white/20">|</span>
            <a 
              href="/privacy" 
              className="text-white/40 hover:text-white/60 text-lg transition-colors"
            >
              PRIVACY POLICY
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};