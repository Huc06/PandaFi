'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#FF0080]/30 bg-[#0F0F0F]/95 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="relative">
              <Zap className="h-8 w-8 text-[#FF0080]" fill="#FF0080" />
              <div className="absolute inset-0 animate-ping">
                <Zap className="h-8 w-8 text-[#FF0080] opacity-20" fill="#FF0080" />
              </div>
            </div>
            <span className="font-orbitron text-2xl font-bold glow-pink">
              SOCIAL<span className="text-[#00FFFF]">FI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="font-orbitron text-sm font-medium hover:text-[#FF0080] transition-colors"
            >
              FEED
            </Link>
            <Link 
              href="/leaderboard" 
              className="font-orbitron text-sm font-medium hover:text-[#00FFFF] transition-colors"
            >
              LEADERBOARD
            </Link>
            <Link 
              href="/messages" 
              className="font-orbitron text-sm font-medium hover:text-[#8AFF00] transition-colors"
            >
              MESSAGES
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <ConnectButton 
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
