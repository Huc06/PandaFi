'use client';

import React, { useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Coins, TrendingUp } from 'lucide-react';
import type { Hire } from '@/lib/types';
import { useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';

export default function HiresPage() {
  const { data: hireCountData, isLoading: isLoadingCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hireCount',
  });

  const hireCount = typeof hireCountData === 'bigint' ? Number(hireCountData) : 0;
  
  console.log('📊 Hires Debug:', { hireCountData, hireCount, isLoadingCount });

  const hireIdArgs = useMemo(() => {
    return Array.from({ length: hireCount }, (_, i) => ({
      address: CONTRACT_ADDRESS as typeof CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'hires' as const,
      args: [BigInt(i + 1)], // hires are 1-indexed
    }));
  }, [hireCount]);

  const hiresQuery = useReadContracts({
    // Cast to any to avoid excessive type instantiation from large ABI types
    contracts: hireIdArgs as any,
    query: {
      enabled: hireIdArgs.length > 0,
    },
  } as any) as any;
  const hiresResults = hiresQuery?.data as any[] | undefined;
  const isLoadingHires = hiresQuery?.isLoading;

  const hires: Hire[] = useMemo(() => {
    if (!hiresResults) return [];
    console.log('📦 Raw hires results:', hiresResults);
    const mapped = hiresResults
      .map((res, idx) => {
        if (res && res.status === 'success') {
          const r = res.result as any;
          console.log(`✅ Hire ${idx + 1}:`, r);
          return {
            id: r.id as bigint,
            profileId: r.profileId as bigint,
            hirer: r.hirer as string,
            duration: r.duration as bigint,
            amount: r.amount as bigint,
            createdAt: r.createdAt as bigint,
            completed: r.completed as boolean,
          };
        } else {
          console.log(`❌ Failed hire ${idx + 1}:`, res);
          return undefined;
        }
      })
      .filter(Boolean);
    console.log('🎯 Mapped hires:', mapped);
    return mapped as Hire[];
  }, [hiresResults]);

  const activeHires = hires.filter((h) => !h.completed);
  const completedHires = hires.filter((h) => h.completed);

  console.log('🔥 Active hires:', activeHires.length, '| Completed:', completedHires.length);

  return (
    <div className="min-h-screen bg-[#0F0F0F] circuit-bg">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="scanlines mb-8">
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                <span className="glow-yellow">YOUR</span>{' '}
                <span className="glow-pink">HIRES</span>
              </h1>
              <p className="text-gray-400 text-sm">Track active and past hires. Visit <span className="text-[#00FFFF]">Leaderboard</span> to hire new players.</p>
            </div>

            <Card className="bg-[#1B1B1B] border-[#00FFFF]/30">
              <CardHeader>
                <CardTitle className="font-orbitron text-[#00FFFF]">ACTIVE HIRES {isLoadingCount || isLoadingHires ? '(Loading...)' : `(${activeHires.length})`}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCount || isLoadingHires ? (
                  <p className="text-gray-400 text-center py-8">Loading hires...</p>
                ) : hireCount === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-2">No hires found on contract yet.</p>
                    <p className="text-xs text-gray-500">Total hires on chain: {hireCount}</p>
                  </div>
                ) : activeHires.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-2">No active hires.</p>
                    <p className="text-xs text-gray-500">Total hires: {hires.length} (all completed)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeHires.map((hire) => (
                      <div key={hire.id.toString()} className="flex items-center justify-between p-4 rounded-lg border border-[#FF0080]/30 bg-[#0F0F0F]/50">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${hire.hirer}`} />
                            <AvatarFallback className="bg-[#00FFFF] text-[#0F0F0F] font-orbitron">
                              HI
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-orbitron font-bold">Hire #{hire.id.toString()}</p>
                            <p className="text-xs text-gray-500 font-mono">By {hire.hirer.slice(0, 6)}...{hire.hirer.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#FF0080]/20 text-[#FF0080] border-[#FF0080]/50 font-orbitron">
                            <Coins className="h-3 w-3 mr-1" />
                            {hire.amount.toString()}
                          </Badge>
                          <Badge className="bg-[#8AFF00]/20 text-[#8AFF00] border-[#8AFF00]/50 font-orbitron">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {hire.duration.toString()}h
                          </Badge>
                          <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/50 font-orbitron">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {hire.completed ? 'COMPLETED' : 'ACTIVE'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#1B1B1B] border-[#00FFFF]/30 mt-6">
              <CardHeader>
                <CardTitle className="font-orbitron text-[#00FFFF]">COMPLETED HIRES {isLoadingHires ? '(Loading...)' : `(${completedHires.length})`}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHires ? (
                  <p className="text-gray-400 text-center py-8">Loading hires...</p>
                ) : completedHires.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-2">No completed hires yet.</p>
                    <p className="text-xs text-gray-500">Total hires: {hires.length} (all active)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedHires.map((hire) => (
                      <div key={hire.id.toString()} className="flex items-center justify-between p-4 rounded-lg border border-[#00FFFF]/30 bg-[#0F0F0F]/50">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${hire.hirer}`} />
                            <AvatarFallback className="bg-[#00FFFF] text-[#0F0F0F] font-orbitron">
                              HI
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-orbitron font-bold">Hire #{hire.id.toString()}</p>
                            <p className="text-xs text-gray-500 font-mono">By {hire.hirer.slice(0, 6)}...{hire.hirer.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#FF0080]/20 text-[#FF0080] border-[#FF0080]/50 font-orbitron">
                            <Coins className="h-3 w-3 mr-1" />
                            {hire.amount.toString()}
                          </Badge>
                          <Badge className="bg-[#8AFF00]/20 text-[#8AFF00] border-[#8AFF00]/50 font-orbitron">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {hire.duration.toString()}h
                          </Badge>
                          <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/50 font-orbitron">
                            <Briefcase className="h-3 w-3 mr-1" />
                            COMPLETED
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
