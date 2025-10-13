"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  MessageSquare,
  User,
  Briefcase,
  TrendingUp,
  Video,
  Tv,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Feed" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/live", icon: Video, label: "Live" },
  { href: "/tv", icon: Tv, label: "TV" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/hires", icon: Briefcase, label: "Hires" },
  { href: "/trending", icon: TrendingUp, label: "Trending" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-[#00FFFF]/30 bg-[#1B1B1B]/50 backdrop-blur-sm circuit-bg">
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-orbitron text-sm font-medium transition-all",
                isActive
                  ? "bg-[#FF0080]/20 text-[#FF0080] border border-[#FF0080]/50 border-glow-pink"
                  : "text-gray-400 hover:bg-[#00FFFF]/10 hover:text-[#00FFFF] hover:border-[#00FFFF]/30 border border-transparent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-[#8AFF00]/30">
        <div className="bg-gradient-to-br from-[#FF0080]/20 to-[#00FFFF]/20 rounded-lg p-4 border border-[#FF0080]/30">
          <h3 className="font-orbitron text-sm font-bold text-[#8AFF00] mb-2">
            BOOST YOUR PROFILE
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Stake tokens to increase visibility and earn rewards
          </p>
          <button className="w-full bg-gradient-to-r from-[#FF0080] to-[#00FFFF] text-white font-orbitron text-xs font-bold py-2 rounded hover:opacity-90 transition-opacity">
            STAKE NOW
          </button>
        </div>
      </div>
    </aside>
  );
}
