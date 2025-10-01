'use client';

import React, { useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, Coins, TrendingUp, UserPlus } from 'lucide-react';
import type { Hire } from '@/lib/types';
import { useAccount, useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';
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
  }
] as const;

export default function HiresPage() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [showHireForm, setShowHireForm] = useState(false);
  const [profileIdInput, setProfileIdInput] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [rateInput, setRateInput] = useState('');
  const [isHiring, setIsHiring] = useState(false);

  const { data: hireCountData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hireCount',
  });

  const { data: u2uTokenAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'u2uToken',
  } as any);

  const hireCount = typeof hireCountData === 'bigint' ? Number(hireCountData) : 0;

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

  const hires: Hire[] = useMemo(() => {
    if (!hiresResults) return [];
    return hiresResults
      .map((res) => (res && res.status === 'success' ? (res.result as any) : undefined))
      .filter(Boolean)
      .map((r: any) => ({
        id: r.id as bigint,
        profileId: r.profileId as bigint,
        hirer: r.hirer as string,
        duration: r.duration as bigint,
        amount: r.amount as bigint,
        createdAt: r.createdAt as bigint,
        completed: r.completed as boolean,
      }));
  }, [hiresResults]);

  const activeHires = hires.filter((h) => !h.completed);
  const completedHires = hires.filter((h) => h.completed);

  const handleHire = async () => {
    if (!profileIdInput || !durationInput || !rateInput || !address || !u2uTokenAddress) {
      toast.error('Please fill all fields');
      return;
    }
    setIsHiring(true);
    try {
      const profileId = BigInt(profileIdInput);
      const duration = BigInt(durationInput);
      const ratePerHour = parseUnits(rateInput, 18);
      const totalAmount = ratePerHour * duration;
      const tokenAddr = u2uTokenAddress as Address;

      // Step 1: Approve
      toast.message('Approving U2U token...');
      await writeContract({
        address: tokenAddr,
        abi: ERC20_ABI as unknown as Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, totalAmount],
      } as any);
      toast.success('Approval submitted, waiting for confirmation...');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Step 2: Hire
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'hirePlayer',
        args: [profileId, duration, ratePerHour],
      } as any);
      toast.success('Hire submitted!');
      setShowHireForm(false);
      setProfileIdInput('');
      setDurationInput('');
      setRateInput('');
    } catch (e: any) {
      console.error('Hire error:', e);
      toast.error(e?.message || 'Failed to hire player');
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
          <div className="max-w-5xl mx-auto">
            <div className="scanlines mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-orbitron text-3xl font-bold mb-2">
                    <span className="glow-yellow">YOUR</span>{' '}
                    <span className="glow-pink">HIRES</span>
                  </h1>
                  <p className="text-gray-400 text-sm">Track active and past hires</p>
                </div>
                <Button
                  onClick={() => setShowHireForm(!showHireForm)}
                  className="bg-gradient-to-r from-[#FF0080] to-[#00FFFF] hover:from-[#00FFFF] hover:to-[#8AFF00] text-white font-orbitron font-bold"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  HIRE PLAYER
                </Button>
              </div>
            </div>

            {showHireForm && (
              <Card className="bg-[#1B1B1B] border-[#FCEE09]/30 mb-6">
                <CardHeader>
                  <CardTitle className="font-orbitron text-[#FCEE09]">HIRE A PLAYER</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 font-orbitron">Profile ID</label>
                      <Input
                        type="number"
                        value={profileIdInput}
                        onChange={(e) => setProfileIdInput(e.target.value)}
                        placeholder="1"
                        className="bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF] mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-orbitron">Duration (hours)</label>
                      <Input
                        type="number"
                        value={durationInput}
                        onChange={(e) => setDurationInput(e.target.value)}
                        placeholder="10"
                        className="bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF] mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-orbitron">Rate/Hour (U2U)</label>
                      <Input
                        type="text"
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="0.5"
                        className="bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF] mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowHireForm(false)}
                      className="font-orbitron"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleHire}
                      disabled={isHiring}
                      className="bg-gradient-to-r from-[#FF0080] to-[#00FFFF] text-white font-orbitron"
                    >
                      {isHiring ? 'Processing...' : 'CONFIRM HIRE'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-[#1B1B1B] border-[#00FFFF]/30">
              <CardHeader>
                <CardTitle className="font-orbitron text-[#00FFFF]">ACTIVE HIRES</CardTitle>
              </CardHeader>
              <CardContent>
                {activeHires.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No active hires yet.</p>
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
                <CardTitle className="font-orbitron text-[#00FFFF]">COMPLETED HIRES</CardTitle>
              </CardHeader>
              <CardContent>
                {completedHires.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No completed hires yet.</p>
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


