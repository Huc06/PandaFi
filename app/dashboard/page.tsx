'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { CreatePost } from '@/components/posts/create-post';
import { PostCard } from '@/components/posts/post-card';
import { ProfileCard } from '@/components/profile/profile-card';
import { useReadContract } from 'wagmi';
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
                  {[1, 2, 3, 4, 5].map((i) => (
                    <PostCard
                      key={i}
                      post={{
                        id: BigInt(i),
                        author: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                        contentCID: `This is a sample post #${i} showcasing the power of decentralized social networks. Join the revolution! 🚀`,
                        timestamp: BigInt(Date.now() / 1000 - i * 3600),
                        likeCount: BigInt(Math.floor(Math.random() * 100)),
                        commentCount: BigInt(Math.floor(Math.random() * 50)),
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
                        createdAt: BigInt(Date.now() / 1000),
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
