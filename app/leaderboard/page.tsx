'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Coins } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import type { Profile } from '@/lib/types';

export default function LeaderboardPage() {
  const { data: topPlayers } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTopPlayers',
    args: [BigInt(10)],
  });

  const mockPlayers: Profile[] = [
    {
      id: BigInt(1),
      owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      name: 'CyberNinja',
      avatarCID: '',
      bioCID: 'Top player in the metaverse',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      socialTokenBalance: BigInt(5000),
      totalEarned: BigInt(25000),
      totalHires: BigInt(50),
    },
    {
      id: BigInt(2),
      owner: '0x842d35Cc6634C0532925a3b844Bc9e7595f0bEc',
      name: 'NeonSamurai',
      avatarCID: '',
      bioCID: 'Elite warrior',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      socialTokenBalance: BigInt(4500),
      totalEarned: BigInt(22000),
      totalHires: BigInt(45),
    },
    {
      id: BigInt(3),
      owner: '0x942d35Cc6634C0532925a3b844Bc9e7595f0bEd',
      name: 'QuantumHacker',
      avatarCID: '',
      bioCID: 'Code master',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      socialTokenBalance: BigInt(4000),
      totalEarned: BigInt(20000),
      totalHires: BigInt(40),
    },
  ];

  const players = (topPlayers as Profile[]) || mockPlayers;

  return (
    <div className="min-h-screen bg-[#0F0F0F] circuit-bg">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="scanlines mb-8">
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                <span className="glow-yellow">GLOBAL</span>{' '}
                <span className="glow-pink">LEADERBOARD</span>
              </h1>
              <p className="text-gray-400 text-sm">
                Top performers in the decentralized network
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {players.slice(0, 3).map((player, index) => (
                <Card
                  key={index}
                  className={`bg-[#1B1B1B] border-2 ${
                    index === 0
                      ? 'border-[#FCEE09] border-glow-yellow'
                      : index === 1
                      ? 'border-[#00FFFF] border-glow-cyan'
                      : 'border-[#FF0080] border-glow-pink'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <Avatar className="h-24 w-24 ring-4 ring-[#0F0F0F]">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.owner}`} />
                          <AvatarFallback className="bg-gradient-to-br from-[#FF0080] to-[#00FFFF] text-white font-orbitron">
                            {player.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -top-2 -right-2 h-10 w-10 rounded-full flex items-center justify-center font-orbitron font-bold ${
                            index === 0
                              ? 'bg-[#FCEE09] text-[#0F0F0F]'
                              : index === 1
                              ? 'bg-[#00FFFF] text-[#0F0F0F]'
                              : 'bg-[#FF0080] text-white'
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      <h3 className="mt-4 font-orbitron text-xl font-bold glow-cyan">
                        {player.name}
                      </h3>

                      <div className="flex gap-2 mt-4">
                        <Badge className="bg-[#FF0080]/20 text-[#FF0080] border-[#FF0080]/50 font-orbitron">
                          <Coins className="h-3 w-3 mr-1" />
                          {player.socialTokenBalance.toString()}
                        </Badge>
                        <Badge className="bg-[#8AFF00]/20 text-[#8AFF00] border-[#8AFF00]/50 font-orbitron">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {player.totalEarned.toString()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-[#1B1B1B] border-[#00FFFF]/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-[#FF0080]/30">
                      <tr className="bg-[#0F0F0F]">
                        <th className="px-6 py-4 text-left font-orbitron text-sm font-bold text-[#00FFFF]">
                          RANK
                        </th>
                        <th className="px-6 py-4 text-left font-orbitron text-sm font-bold text-[#00FFFF]">
                          PLAYER
                        </th>
                        <th className="px-6 py-4 text-left font-orbitron text-sm font-bold text-[#00FFFF]">
                          TOKENS
                        </th>
                        <th className="px-6 py-4 text-left font-orbitron text-sm font-bold text-[#00FFFF]">
                          EARNED
                        </th>
                        <th className="px-6 py-4 text-left font-orbitron text-sm font-bold text-[#00FFFF]">
                          HIRES
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player, index) => (
                        <tr
                          key={index}
                          className="border-b border-[#FF0080]/10 hover:bg-[#FF0080]/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className="font-orbitron font-bold text-[#8AFF00]">
                                #{index + 1}
                              </span>
                              {index < 3 && (
                                <Trophy className="h-4 w-4 ml-2 text-[#FCEE09]" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.owner}`} />
                                <AvatarFallback className="bg-[#00FFFF] text-[#0F0F0F] font-orbitron">
                                  {player.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-orbitron font-bold">{player.name}</p>
                                <p className="text-xs text-gray-500 font-mono">
                                  {player.owner.slice(0, 6)}...{player.owner.slice(-4)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-orbitron text-[#FF0080] font-bold">
                              {player.socialTokenBalance.toString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-orbitron text-[#8AFF00] font-bold">
                              {player.totalEarned.toString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-orbitron text-[#00FFFF] font-bold">
                              {player.totalHires.toString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
