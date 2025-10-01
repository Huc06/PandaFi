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
import { Edit, Coins, TrendingUp, Briefcase, Save } from 'lucide-react';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { address } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const { writeContract, isPending } = useWriteContract();

  const handleCreateProfile = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createProfile',
        args: [name, '', bio],
      });
      
      toast.success('Profile created successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to create profile');
      console.error(error);
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
                    <p className="text-gray-400 text-center py-8">
                      No posts yet. Start sharing your thoughts!
                    </p>
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
