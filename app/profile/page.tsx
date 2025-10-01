'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Coins, TrendingUp, Briefcase, Save, Tag } from 'lucide-react';
import { useAccount, useWriteContract, useReadContract, useReadContracts } from 'wagmi';
import type { Address, Abi } from 'viem';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';
import { formatUnits, parseUnits } from 'viem';
import { Button as UIButton } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { address } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const { writeContract, isPending } = useWriteContract();
  const [refreshKey, setRefreshKey] = useState(0);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

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
    scopeKey: `profile-posts-${total}-${refreshKey}`,
    query: { enabled: postContracts.length > 0, refetchOnWindowFocus: false },
  } as any) as any;

  const rawPosts = ((postsQuery?.data as any[] | undefined)
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
    .filter(Boolean) || []);

  const uniqueProfileIds = rawPosts.length ? Array.from(new Set(rawPosts.map((p: any) => p.profileId as bigint))) : [];
  const profileContracts = uniqueProfileIds.map((pid) => ({
    address: CONTRACT_ADDRESS as typeof CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProfile' as const,
    args: [pid],
  }));
  const profilesQuery2 = useReadContracts({
    contracts: profileContracts as any,
    scopeKey: `profile-authors-${uniqueProfileIds.length}-${refreshKey}`,
    query: { enabled: profileContracts.length > 0 },
  } as any) as any;
  const profileIdToOwner: Record<string, string> = (() => {
    const map: Record<string, string> = {};
    const rows = profilesQuery2?.data as any[] | undefined;
    if (rows) {
      rows.forEach((res, idx) => {
        if (res && res.status === 'success') {
          const pr = res.result as any;
          const pid = String(uniqueProfileIds[idx]);
          // getProfile returns array: [id, owner, name, ...]
          const owner = Array.isArray(pr) ? pr[1] : (typeof pr?.owner === 'string' ? pr.owner : '');
          if (owner) map[pid] = owner;
        }
      });
    }
    return map;
  })();

  const myPosts = rawPosts
    .map((p: any) => ({
      id: p.id as bigint,
      author: profileIdToOwner[String(p.profileId)] || '',
      contentCID: p.contentCID as string,
      timestamp: p.timestamp as bigint,
      likeCount: p.likeCount as bigint,
      commentCount: p.commentCount as bigint,
      tipAmount: p.tipAmount as bigint | undefined,
      isForSale: p.isForSale as boolean | undefined,
      price: p.price as bigint | undefined,
      isDeleted: p.isDeleted as boolean,
    }))
    .filter((p: any) => p.author && address && p.author.toLowerCase() === address.toLowerCase());

  const handleCreateProfile = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'createProfile',
        args: [name, '', bio],
      } as any);
      
      toast.success('Profile created successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to create profile');
      console.error(error);
    }
  };

  const handleListForSale = async (postId: bigint) => {
    const key = String(postId);
    const raw = priceInputs[key]?.trim();
    if (!raw) return;
    try {
      const priceWei = parseUnits(raw, 18);
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'sellPost',
        args: [postId, priceWei],
      } as any);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      // noop
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] circuit-bg">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-[#1B1B1B] border-[#FF0080]/30 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-[#FF0080]/20 via-[#00FFFF]/20 to-[#8AFF00]/20 holographic" />
              
              <CardContent className="pt-0 px-6 pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 space-y-4 md:space-y-0 md:space-x-6">
                  <Avatar className="h-32 w-32 border-4 border-[#0F0F0F] ring-4 ring-[#FF0080]">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`} />
                    <AvatarFallback className="bg-gradient-to-br from-[#FF0080] to-[#00FFFF] text-white font-orbitron text-2xl">
                      YOU
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-4">
                        <Input
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF] font-orbitron"
                        />
                        <Textarea
                          placeholder="Your bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF]"
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="font-orbitron text-3xl font-bold glow-cyan mb-2">
                          {name || 'Your Name'}
                        </h1>
                        <p className="text-gray-400 text-sm mb-4">
                          {bio || 'Add a bio to tell others about yourself'}
                        </p>
                      </>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Badge className="bg-[#FF0080]/20 text-[#FF0080] border-[#FF0080]/50 font-orbitron">
                        <Coins className="h-3 w-3 mr-1" />
                        0 Tokens
                      </Badge>
                      <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/50 font-orbitron">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        0 Earned
                      </Badge>
                      <Badge className="bg-[#8AFF00]/20 text-[#8AFF00] border-[#8AFF00]/50 font-orbitron">
                        <Briefcase className="h-3 w-3 mr-1" />
                        0 Hires
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={isEditing ? handleCreateProfile : () => setIsEditing(true)}
                    disabled={isPending}
                    className="bg-gradient-to-r from-[#FF0080] to-[#00FFFF] hover:from-[#00FFFF] hover:to-[#8AFF00] text-white font-orbitron font-bold"
                  >
                    {isPending ? (
                      'SAVING...'
                    ) : isEditing ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        SAVE
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        EDIT
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="posts" className="mt-6">
              <TabsList className="bg-[#1B1B1B] border border-[#00FFFF]/30">
                <TabsTrigger value="posts" className="font-orbitron data-[state=active]:bg-[#FF0080]/20 data-[state=active]:text-[#FF0080]">
                  POSTS
                </TabsTrigger>
                <TabsTrigger value="hires" className="font-orbitron data-[state=active]:bg-[#00FFFF]/20 data-[state=active]:text-[#00FFFF]">
                  HIRES
                </TabsTrigger>
                <TabsTrigger value="activity" className="font-orbitron data-[state=active]:bg-[#8AFF00]/20 data-[state=active]:text-[#8AFF00]">
                  ACTIVITY
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-6">
                <Card className="bg-[#1B1B1B] border-[#FF0080]/30">
                  <CardHeader>
                    <CardTitle className="font-orbitron text-[#FF0080]">YOUR POSTS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myPosts.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        No posts yet. Start sharing your thoughts!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {myPosts.map((p: any) => (
                          <div key={String(p.id)} className="p-4 rounded-lg border border-[#00FFFF]/30 bg-[#0F0F0F]/50">
                            <div className="flex items-center justify-between">
                              <div className="font-orbitron text-[#00FFFF] text-sm">Post #{String(p.id)}</div>
                              <div className="text-xs text-gray-500" suppressHydrationWarning>
                                {new Date(Number(p.timestamp) * 1000).toISOString().slice(0, 10)}
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-300">{p.contentCID}</p>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                              <div>
                                <div className="text-xs text-gray-400">Sale Status</div>
                                <div className="font-orbitron text-[#8AFF00]">
                                  {p.isForSale ? `For sale` : 'Not for sale'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Price</div>
                                <div className="font-orbitron text-[#FCEE09]">
                                  {typeof p.price === 'bigint' ? `${formatUnits(p.price, 18)} U2U` : '0 U2U'}
                                </div>
                              </div>
                              <div className="flex gap-2 items-center">
                                <input
                                  value={priceInputs[String(p.id)] || ''}
                                  onChange={(e) => setPriceInputs((s) => ({ ...s, [String(p.id)]: e.target.value.replace(/[^0-9.]/g, '') }))}
                                  placeholder="Set price (U2U)"
                                  className="flex-1 bg-[#1B1B1B] border border-[#00FFFF]/30 rounded px-2 py-1 text-sm"
                                />
                                <UIButton size="sm" className="bg-[#00FFFF] text-[#0F0F0F] font-orbitron" onClick={() => handleListForSale(p.id)}>
                                  <Tag className="h-4 w-4 mr-1" /> List
                                </UIButton>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hires" className="mt-6">
                <Card className="bg-[#1B1B1B] border-[#00FFFF]/30">
                  <CardHeader>
                    <CardTitle className="font-orbitron text-[#00FFFF]">HIRE HISTORY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-center py-8">
                      No hires yet. Start collaborating with others!
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card className="bg-[#1B1B1B] border-[#8AFF00]/30">
                  <CardHeader>
                    <CardTitle className="font-orbitron text-[#8AFF00]">RECENT ACTIVITY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-center py-8">
                      No activity yet. Get started by creating your profile!
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
