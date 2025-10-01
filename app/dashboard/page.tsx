'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { CreatePost } from '@/components/posts/create-post';
import { PostCard } from '@/components/posts/post-card';
import { ProfileCard } from '@/components/profile/profile-card';
import { useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import type { Post, Profile } from '@/lib/types';

export default function DashboardPage() {
  const { data: postCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'postCount',
  });

  const { data: topPlayers } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTopPlayers',
    args: [BigInt(5)],
  });

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

  const postTotal = typeof postCount === 'bigint' ? Number(postCount) : 0;
  const postContracts = Array.from({ length: postTotal }, (_, idx) => {
    const id = idx + 1; // IDs start at 1
    return {
      address: CONTRACT_ADDRESS as typeof CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'posts' as const,
      args: [BigInt(id)],
    };
  });

  const postsQuery = useReadContracts({
    contracts: postContracts as any,
    scopeKey: `posts-${postTotal}-${refreshKey}`,
    query: { enabled: postContracts.length > 0, refetchOnWindowFocus: false },
  } as any) as any;

  const postsData = (postsQuery?.data as any[] | undefined)
    ?.map((res) => {
      if (res && res.status === 'success') {
        const r = res.result as any;
        // Contract returns array [id, profileId, contentCID, timestamp, likeCount, commentCount, tipAmount, isForSale, price, isDeleted]
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
      } else {
        console.log('❌ Failed post result:', res);
        return undefined;
      }
    })
    .filter(Boolean)
    .filter((p: any) => !!p && !p.isDeleted) as any[] | undefined;

  console.log('📊 PostCount:', postTotal, '| Posts data:', postsData);

  // resolve authors via getProfile(profileId)
  const uniqueProfileIds = postsData ? Array.from(new Set(postsData.map((p: any) => p.profileId as bigint))) : [];
  const profileContracts = uniqueProfileIds.map((pid) => ({
    address: CONTRACT_ADDRESS as typeof CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProfile' as const,
    args: [pid],
  }));
  const profilesQuery = useReadContracts({
    contracts: profileContracts as any,
    scopeKey: `authors-${uniqueProfileIds.length}-${refreshKey}`,
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
          // getProfile returns array [id, owner, name, avatarCID, bioCID, createdAt, socialTokenBalance, totalEarned, totalHires]
          const owner = Array.isArray(pr) ? pr[1] : (typeof pr?.owner === 'string' ? pr.owner : '');
          const name = Array.isArray(pr) ? pr[2] : (typeof pr?.name === 'string' ? pr.name : '');
          if (owner) {
            console.log(`✅ Mapped profileId ${pid} → owner ${owner}, name ${name}`);
            map[pid] = { owner, name };
          } else {
            console.log(`❌ No owner found for profileId ${pid}, raw:`, pr);
          }
        }
      });
    }
    console.log('📝 Final profileIdToInfo map:', map);
    return map;
  })();

  const postsWithAuthors = postsData
    ? postsData.map((p: any) => ({
        id: p.id as bigint,
        author: profileIdToInfo[String(p.profileId)]?.owner || '',
        contentCID: p.contentCID as string,
        timestamp: p.timestamp as bigint,
        likeCount: p.likeCount as bigint,
        commentCount: p.commentCount as bigint,
        tipAmount: p.tipAmount as bigint | undefined,
        isForSale: p.isForSale as boolean | undefined,
        price: p.price as bigint | undefined,
        isDeleted: p.isDeleted as boolean,
      })) as Post[]
    : undefined;

  const sortedPosts = postsWithAuthors
    ? [...postsWithAuthors].sort((a, b) => Number(b.timestamp - a.timestamp))
    : undefined;

  return (
    <div className="min-h-screen bg-[#0F0F0F] circuit-bg">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="scanlines">
                  <h1 className="font-orbitron text-3xl font-bold mb-2">
                    <span className="glow-pink">NEURAL</span>{' '}
                    <span className="glow-cyan">FEED</span>
                  </h1>
                  <p className="text-gray-400 text-sm mb-6">
                    Real-time updates from the decentralized network
                  </p>
                </div>

                <CreatePost />

                <div className="space-y-4">
                  {sortedPosts && sortedPosts.length > 0
                    ? sortedPosts.map((p, idx) => {
                        const info = profileIdToInfo[String((p as any).profileId)] as ProfileInfo | undefined;
                        const ownerAddr = info?.owner || (typeof p.author === 'string' ? p.author : '');
                        const displayName = (info?.name && info.name.trim().length > 0)
                          ? info.name
                          : (ownerAddr ? `${ownerAddr.slice(0, 6)}...${ownerAddr.slice(-4)}` : 'Unknown');
                        const idStr = (p && (p as any).id != null) ? String((p as any).id) : `post`;
                        return (
                          <PostCard
                            key={`${idStr}-${idx}`}
                            post={p}
                            authorName={displayName}
                          />
                        );
                      })
                    : [1, 2, 3, 4, 5].map((i) => (
                        <PostCard
                          key={i}
                          post={{
                            id: BigInt(i),
                            author: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                            contentCID: `This is a sample post #${i} showcasing the power of decentralized social networks. Join the revolution! 🚀`,
                            // Use deterministic, static values to avoid SSR/client hydration mismatch
                            timestamp: BigInt(1700000000 + i * 3600),
                            likeCount: BigInt(10 * i),
                            commentCount: BigInt(5 * i),
                            isDeleted: false,
                          }}
                          authorName={`CyberUser${i}`}
                        />
                      ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="scanlines">
                  <h2 className="font-orbitron text-xl font-bold mb-4 glow-green">
                    TOP PLAYERS
                  </h2>
                </div>

                {topPlayers && Array.isArray(topPlayers) ? (
                  topPlayers.slice(0, 3).map((profile: Profile, index: number) => (
                    <ProfileCard key={index} profile={profile} />
                  ))
                ) : (
                  [1, 2, 3].map((i) => (
                    <ProfileCard
                      key={i}
                      profile={{
                        id: BigInt(i),
                        owner: `0x${i}42d35Cc6634C0532925a3b844Bc9e7595f0bEb`,
                        name: `CyberElite${i}`,
                        avatarCID: '',
                        bioCID: 'Elite player in the metaverse',
                        createdAt: BigInt(Math.floor(Date.now() / 1000)),
                        socialTokenBalance: BigInt(1000 * i),
                        totalEarned: BigInt(5000 * i),
                        totalHires: BigInt(10 * i),
                      }}
                    />
                  ))
                )}

                <div className="bg-gradient-to-br from-[#FF0080]/20 to-[#00FFFF]/20 rounded-lg p-6 border border-[#8AFF00]/30 holographic">
                  <h3 className="font-orbitron text-lg font-bold text-[#FCEE09] mb-3 glow-yellow">
                    NETWORK STATS
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Total Posts</span>
                      <span className="font-orbitron text-[#00FFFF] font-bold">
                        {postCount?.toString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Active Users</span>
                      <span className="font-orbitron text-[#8AFF00] font-bold">1,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Total Value Locked</span>
                      <span className="font-orbitron text-[#FF0080] font-bold">$2.5M</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
