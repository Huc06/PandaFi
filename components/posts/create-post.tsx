'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image, Send } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useGasPrice, useReadContract, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import type { Address, Abi } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { toast } from 'sonner';

export function CreatePost() {
  const { address } = useAccount();
  const [content, setContent] = useState('');
  // Defaults for new ABI (tokenized posts)
  const defaultTokenName = 'PostToken';
  const defaultTokenSymbol = 'PST';
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { data: gasPrice } = useGasPrice();

  // Resolve current user's profileId by scanning profiles 1..profileCount for owner == address
  const { data: profileCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'profileCount',
  } as any);

  const totalProfiles = typeof profileCount === 'bigint' ? Number(profileCount) : 0;
  const profileContracts = Array.from({ length: totalProfiles }, (_, idx) => ({
    address: CONTRACT_ADDRESS as typeof CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProfile' as const,
    args: [BigInt(idx + 1)],
  }));

  const profilesQuery = useReadContracts({
    contracts: profileContracts as any,
    query: { enabled: !!address && profileContracts.length > 0 },
  } as any) as any;

  const myProfileId: bigint | undefined = (() => {
    const rows = profilesQuery?.data as any[] | undefined;
    if (!rows || !address) return undefined;
    for (const row of rows) {
      if (row && row.status === 'success') {
        const p = row.result as any;
        if (p && typeof p.owner === 'string' && p.owner.toLowerCase() === address.toLowerCase()) {
          return p.id as bigint;
        }
      }
    }
    return undefined;
  })();

  const simulate = useSimulateContract({
    address: CONTRACT_ADDRESS as any,
    abi: CONTRACT_ABI as any,
    functionName: 'createPost',
    // New ABI: createPost(profileId, contentCID, tokenName, tokenSymbol)
    args:
      myProfileId !== undefined
        ? [myProfileId, content, defaultTokenName, defaultTokenSymbol]
        : undefined,
    value: BigInt(0),
    query: { enabled: !!content.trim() && myProfileId !== undefined },
  } as any) as any;

  const estimatedFeeU2U = (() => {
    const gp = gasPrice as bigint | undefined;
    const req = simulate?.data?.request as { gas?: bigint } | undefined;
    if (!gp || !req?.gas) return undefined;
    try {
      return formatUnits(req.gas * gp, 18);
    } catch {
      return undefined;
    }
  })();

  useEffect(() => {
    if (isSuccess) {
      window.dispatchEvent(new CustomEvent('post:created'));
      setContent('');
    }
  }, [isSuccess]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      if (!myProfileId) {
        toast.error('No profile found. Please create your profile first.');
        return;
      }
      if (simulate?.data?.request) {
        writeContract(simulate.data.request as any);
      } else {
        writeContract({
          address: CONTRACT_ADDRESS as Address,
          abi: CONTRACT_ABI as unknown as Abi,
          functionName: 'createPost',
          // Pass required token params for new ABI
          args: [myProfileId, content, defaultTokenName, defaultTokenSymbol],
          value: BigInt(0),
        } as any);
      }
      
      toast.success('Post submitted! Waiting for confirmation...');
    } catch (error) {
      toast.error('Failed to create post');
      console.error(error);
    }
  };

  return (
    <Card className="bg-[#1B1B1B] border-[#FF0080]/30 border-glow-pink">
      <CardContent className="pt-6">
        <div className="flex space-x-4">
          <Avatar className="h-12 w-12 ring-2 ring-[#FF0080]/50">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`} />
            <AvatarFallback className="bg-[#FF0080] text-white font-orbitron">
              YOU
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="Share your thoughts with the network..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF] resize-none font-exo"
            />

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-[#8AFF00] font-orbitron"
              >
                <Image className="h-4 w-4 mr-2" />
                Media
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isPending || isConfirming || !content.trim()}
                className="bg-gradient-to-r from-[#FF0080] to-[#00FFFF] hover:from-[#00FFFF] hover:to-[#8AFF00] text-white font-orbitron font-bold"
              >
                {isPending || isConfirming ? (
                  'POSTING...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    POST
                  </>
                )}
              </Button>
            </div>
            {estimatedFeeU2U && (
              <div className="text-right text-xs text-gray-500 mt-2">
                Estimated fee: {estimatedFeeU2U} U2U
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
