'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Coins, TrendingUp } from 'lucide-react';
import type { Profile } from '@/lib/types';

interface ProfileCardProps {
  profile: Profile;
  onHire?: () => void;
}

export function ProfileCard({ profile, onHire }: ProfileCardProps) {
  return (
    <Card className="bg-[#1B1B1B] border-[#00FFFF]/30 hover:border-[#FF0080]/50 transition-all neon-border overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-[#FF0080]/20 via-[#00FFFF]/20 to-[#8AFF00]/20 holographic" />
      
      <CardContent className="pt-0 px-6 pb-6">
        <div className="flex flex-col items-center -mt-12">
          <Avatar className="h-24 w-24 border-4 border-[#0F0F0F] ring-2 ring-[#FF0080]">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.owner}`} />
            <AvatarFallback className="bg-[#FF0080] text-white font-orbitron">
              {profile.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h3 className="mt-4 font-orbitron text-xl font-bold glow-cyan">
            {profile.name}
          </h3>
          
          <p className="text-xs text-gray-500 font-mono mt-1">
            {profile.owner.slice(0, 6)}...{profile.owner.slice(-4)}
          </p>

          <div className="flex gap-2 mt-4">
            <Badge className="bg-[#FF0080]/20 text-[#FF0080] border-[#FF0080]/50 font-orbitron">
              <Coins className="h-3 w-3 mr-1" />
              {profile.socialTokenBalance.toString()}
            </Badge>
            <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/50 font-orbitron">
              <TrendingUp className="h-3 w-3 mr-1" />
              {profile.totalEarned.toString()}
            </Badge>
          </div>

          <div className="w-full mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Hires</span>
              <span className="font-orbitron text-[#8AFF00]">{profile.totalHires.toString()}</span>
            </div>
          </div>

          {onHire && (
            <Button
              onClick={onHire}
              className="w-full mt-4 bg-gradient-to-r from-[#FF0080] to-[#00FFFF] hover:from-[#00FFFF] hover:to-[#8AFF00] text-white font-orbitron font-bold"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              HIRE PLAYER
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
