'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, TrendingUp, Coins, UserPlus, Briefcase } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import type { Profile } from '@/lib/types';
import { parseUnits, formatUnits } from 'viem';
import type { Address, Abi } from 'viem';
import { toast } from 'sonner';

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'amount' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { type: 'address', name: 'owner' },
      { type: 'address', name: 'spender' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { type: 'address', name: 'account' }
    ],
    outputs: [{ type: 'uint256' }]
  }
] as const;

export default function LeaderboardPage() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [selectedPlayer, setSelectedPlayer] = useState<Profile | null>(null);
  const [durationInput, setDurationInput] = useState('');
  const [rateInput, setRateInput] = useState('');
  const [isHiring, setIsHiring] = useState(false);

  const { data: topPlayers } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTopPlayers',
    args: [BigInt(10)],
  });

  const { data: u2uTokenAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'u2uToken',
  } as any);

  // Get U2U balance
  const { data: u2uBalance } = useReadContract({
    address: u2uTokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  } as any);

  // Get current allowance
  const { data: currentAllowance } = useReadContract({
    address: u2uTokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && u2uTokenAddress ? [address, CONTRACT_ADDRESS] : undefined,
  } as any);

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

  // Get real profile count to verify profiles exist
  const { data: profileCountData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'profileCount',
  });
  const profileCount = typeof profileCountData === 'bigint' ? Number(profileCountData) : 0;

  console.log('👥 Leaderboard Debug:', { 
    topPlayers: topPlayers ? (topPlayers as any).length : 0,
    profileCount,
    mockPlayers: mockPlayers.length 
  });

  // Only use real profiles if they exist, otherwise show mock
  const players = (topPlayers && (topPlayers as Profile[]).length > 0) 
    ? (topPlayers as Profile[]) 
    : (profileCount > 0 ? [] : mockPlayers);

  const handleHire = async () => {
    if (!selectedPlayer || !durationInput || !rateInput || !address || !u2uTokenAddress) {
      toast.error('Please fill all fields');
      return;
    }
    setIsHiring(true);
    try {
      const profileId = selectedPlayer.id;
      const duration = BigInt(durationInput);
      const ratePerHour = parseUnits(rateInput, 18);
      const totalAmount = ratePerHour * duration;
      const tokenAddr = u2uTokenAddress as Address;

      if (u2uBalance && (u2uBalance as bigint) < totalAmount) {
        toast.error(`Insufficient U2U balance. Need ${formatUnits(totalAmount, 18)} U2U`);
        return;
      }

      // Step 1: Check current allowance first
      if (currentAllowance && (currentAllowance as bigint) >= totalAmount) {
        toast.success('Already approved! Proceeding to hire...');
      } else {
        // Step 1: Approve
        toast.message('Step 1/2: Approving U2U token...');
        
        const approveHash = await writeContract({
          address: tokenAddr,
          abi: ERC20_ABI as unknown as Abi,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS, totalAmount],
          gas: BigInt(100000),
        } as any);
        toast.success('Approval submitted! Waiting 5s for confirmation...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      // Step 2: Hire
      toast.message('Step 2/2: Hiring player...');
      const hireHash = await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'hirePlayer',
        args: [profileId, duration, ratePerHour],
        gas: BigInt(250000),
      } as any);
      toast.success('Hire transaction submitted! Check Hires page in a moment.');
      
      // Wait a bit before closing dialog
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSelectedPlayer(null);
      setDurationInput('');
      setRateInput('');
    } catch (e: any) {
      const errorMsg = e?.shortMessage || e?.message || 'Transaction failed';
      
      // Parse common errors
      if (errorMsg.includes('insufficient')) {
        toast.error('Insufficient U2U balance or not enough approved tokens');
      } else if (errorMsg.includes('user rejected') || errorMsg.includes('User denied')) {
        toast.error('Transaction rejected by user');
      } else if (errorMsg.includes('Profile does not exist')) {
        toast.error('Player profile not found on contract');
      } else {
        toast.error(`Failed: ${errorMsg.slice(0, 100)}`);
      }
    } finally {
      setIsHiring(false);
    }
  };

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
              {profileCount === 0 && (
                <div className="mt-4 p-3 bg-[#FF0080]/10 border border-[#FF0080]/30 rounded-lg">
                  <p className="text-[#FF0080] text-sm font-orbitron">
                    ⚠️ No profiles on contract yet. Create your profile first to enable hiring!
                  </p>
                </div>
              )}
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
                        <th className="px-6 py-4 text-center font-orbitron text-sm font-bold text-[#00FFFF]">
                          ACTION
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
                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              onClick={() => setSelectedPlayer(player)}
                              disabled={profileCount === 0}
                              className="bg-gradient-to-r from-[#FF0080] to-[#00FFFF] hover:from-[#00FFFF] hover:to-[#8AFF00] text-white font-orbitron disabled:opacity-50 disabled:cursor-not-allowed"
                              title={profileCount === 0 ? 'No profiles on contract yet' : 'Hire this player'}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Hire
                            </Button>
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

      {/* Hire Dialog */}
      <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="bg-[#1B1B1B] border-[#00FFFF]/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-2xl text-[#00FFFF]">HIRE PLAYER</DialogTitle>
          </DialogHeader>
          {selectedPlayer && (
            <div className="space-y-6">
              {/* Player Info */}
              <div className="flex items-center gap-4 p-4 bg-[#0F0F0F] rounded-lg border border-[#FF0080]/30">
                <Avatar className="h-16 w-16 ring-2 ring-[#00FFFF]">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPlayer.owner}`} />
                  <AvatarFallback className="bg-gradient-to-br from-[#FF0080] to-[#00FFFF] text-white font-orbitron">
                    {selectedPlayer.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-orbitron text-xl font-bold text-[#00FFFF]">{selectedPlayer.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedPlayer.owner.slice(0, 6)}...{selectedPlayer.owner.slice(-4)}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-[#FF0080]/20 text-[#FF0080] border-[#FF0080]/50 font-orbitron">
                      <Coins className="h-3 w-3 mr-1" />
                      {selectedPlayer.socialTokenBalance.toString()} Tokens
                    </Badge>
                    <Badge className="bg-[#8AFF00]/20 text-[#8AFF00] border-[#8AFF00]/50 font-orbitron">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {selectedPlayer.totalEarned.toString()} Earned
                    </Badge>
                    <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/50 font-orbitron">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {selectedPlayer.totalHires.toString()} Hires
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Hire Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-orbitron text-gray-400">Duration (hours)</label>
                  <Input
                    type="number"
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                    placeholder="e.g. 10"
                    className="mt-1 bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-orbitron text-gray-400">Rate per Hour (U2U)</label>
                  <Input
                    type="text"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="e.g. 0.5"
                    className="mt-1 bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF] text-white"
                  />
                </div>
                {durationInput && rateInput && (
                  <div className="p-3 bg-[#0F0F0F] rounded border border-[#FCEE09]/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Total Cost:</span>
                      <span className="font-orbitron text-lg font-bold text-[#FCEE09]">
                        {(parseFloat(durationInput) * parseFloat(rateInput)).toFixed(2)} U2U
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlayer(null)}
                  className="flex-1 font-orbitron border-[#FF0080]/30 text-white hover:bg-[#FF0080]/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleHire}
                  disabled={isHiring || !durationInput || !rateInput}
                  className="flex-1 bg-gradient-to-r from-[#FF0080] to-[#00FFFF] hover:from-[#00FFFF] hover:to-[#8AFF00] text-white font-orbitron disabled:opacity-50"
                >
                  {isHiring ? 'Processing...' : 'CONFIRM HIRE'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
