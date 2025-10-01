'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';
import type { Post } from '@/lib/types';

export default function TrendingPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const bump = () => setRefreshKey((k) => k + 1);
    window.addEventListener('post:created', bump);
    window.addEventListener('post:updated', bump);
    return () => {
      window.removeEventListener('post:created', bump);
      window.removeEventListener('post:updated', bump);
    };
  }, []);

  const { data: postCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'postCount',
  });

  const total = typeof postCount === 'bigint' ? Number(postCount) : 0;
  const postContracts = Array.from({ length: total }, (_, idx) => {
    const id = idx + 1;
    return {
      address: CONTRACT_ADDRESS as typeof CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'posts' as const,
      args: [BigInt(id)],
    };
  });

  const postsQuery = useReadContracts({
    contracts: postContracts as any,
    scopeKey: `trending-${total}-${refreshKey}`,
    query: { enabled: postContracts.length > 0, refetchOnWindowFocus: false },
  } as any) as any;

  const rawPosts = (postsQuery?.data as any[] | undefined)
    ?.map((res) => {
      if (res && res.status === 'success') {
        const r = res.result as any;
        // posts() returns array [id, profileId, contentCID, timestamp, likeCount, commentCount, tipAmount, isForSale, price, isDeleted]
        return {
          id: r[0] as bigint,
          profileId: r[1] as bigint,
          contentCID: r[2] as string,
          timestamp: r[3] as bigint,
          likeCount: r[4] as bigint,
          commentCount: r[5] as bigint,
          tipAmount: r[6] as bigint,
          isForSale: r[7] as boolean,
          price: r[8] as bigint,
          isDeleted: r[9] as boolean,
        };
      }
      return undefined;
    })
    .filter(Boolean) as any[] | undefined;

  const uniqueProfileIds = rawPosts ? Array.from(new Set(rawPosts.map((p: any) => p.profileId as bigint))) : [];
  const profileContracts = uniqueProfileIds.map((pid) => ({
    address: CONTRACT_ADDRESS as typeof CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProfile' as const,
    args: [pid],
  }));
  const profilesQuery = useReadContracts({
    contracts: profileContracts as any,
    scopeKey: `trending-authors-${uniqueProfileIds.length}-${refreshKey}`,
    query: { enabled: profileContracts.length > 0 },
  } as any) as any;
  type ProfileInfo = { owner: string; name?: string };
  const profileIdToInfo: Record<string, ProfileInfo> = (() => {
    const map: Record<string, ProfileInfo> = {};
    const rows = profilesQuery?.data as any[] | undefined;
    if (rows) {
      rows.forEach((res, idx) => {
        if (res && res.status === 'success') {
          const pr = res.result as any;
          const pid = String(uniqueProfileIds[idx]);
          // getProfile returns array: [id, owner, name, ...]
          const owner = Array.isArray(pr) ? pr[1] : (typeof pr?.owner === 'string' ? pr.owner : '');
          const name = Array.isArray(pr) ? pr[2] : (typeof pr?.name === 'string' ? pr.name : '');
          if (owner) map[pid] = { owner, name };
        }
      });
    }
    return map;
  })();

  const posts = rawPosts
    ?.map((p: any) => ({
      id: p.id as bigint,
      author: profileIdToInfo[String(p.profileId)]?.owner || '',
      contentCID: p.contentCID as string,
      timestamp: p.timestamp as bigint,
      likeCount: p.likeCount as bigint,
      commentCount: p.commentCount as bigint,
      isDeleted: p.isDeleted as boolean,
    }))
    .filter((p: any) => !!p && !p.isDeleted && typeof p.author === 'string' && p.author !== '0x0000000000000000000000000000000000000000') as Post[] | undefined;

  const sorted = posts ? [...posts].sort((a, b) => Number(b.likeCount - a.likeCount)) : [];
  const top = sorted.slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0F0F0F] circuit-bg">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="scanlines mb-8">
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                <span className="glow-pink">TRENDING</span>{' '}
                <span className="glow-cyan">POSTS</span>
              </h1>
              <p className="text-gray-400 text-sm">Most liked posts on the network</p>
            </div>

            <div className="space-y-4">
              {top.length === 0 ? (
                <Card className="bg-[#1B1B1B] border-[#00FFFF]/30">
                  <CardContent className="p-6 text-center text-gray-400">
                    No trending posts yet.
                  </CardContent>
                </Card>
              ) : (
                top.map((p, idx) => (
                  <Card key={`${String(p.id)}-${idx}`} className="bg-[#1B1B1B] border-[#FF0080]/30">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-orbitron text-[#00FFFF] font-bold">
                            {typeof p.author === 'string' && p.author.length >= 10
                              ? `${p.author.slice(0, 6)}...${p.author.slice(-4)}`
                              : p.author || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500" suppressHydrationWarning>
                            {new Date(Number(p.timestamp) * 1000).toISOString().slice(0, 10)}
                          </div>
                        </div>
                        <div className="font-orbitron text-[#FF0080]">❤ {Number(p.likeCount)}</div>
                      </div>
                      <p className="mt-3 text-sm text-gray-200 leading-relaxed">{p.contentCID}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


