'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Search } from 'lucide-react';

export default function MessagesPage() {
  const conversations = [
    { id: 1, name: 'CyberNinja', lastMessage: 'Hey, interested in collaboration?', time: '2m ago', unread: 2 },
    { id: 2, name: 'NeonSamurai', lastMessage: 'Thanks for the hire!', time: '1h ago', unread: 0 },
    { id: 3, name: 'QuantumHacker', lastMessage: 'Check out my latest post', time: '3h ago', unread: 1 },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] circuit-bg">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="scanlines mb-8">
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                <span className="glow-cyan">SECURE</span>{' '}
                <span className="glow-green">MESSAGES</span>
              </h1>
              <p className="text-gray-400 text-sm">
                Encrypted peer-to-peer communication
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 bg-[#1B1B1B] border-[#00FFFF]/30">
                <CardContent className="p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      className="pl-10 bg-[#0F0F0F] border-[#FF0080]/30 focus:border-[#FF0080]"
                    />
                  </div>

                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FF0080]/10 cursor-pointer transition-colors border border-transparent hover:border-[#FF0080]/30"
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-[#00FFFF]/50">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`} />
                          <AvatarFallback className="bg-[#00FFFF] text-[#0F0F0F] font-orbitron">
                            {conv.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-orbitron font-bold text-sm truncate">{conv.name}</p>
                            <span className="text-xs text-gray-500">{conv.time}</span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                        </div>
                        {conv.unread > 0 && (
                          <div className="h-5 w-5 rounded-full bg-[#FF0080] flex items-center justify-center">
                            <span className="text-xs font-bold">{conv.unread}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-[#1B1B1B] border-[#FF0080]/30 flex flex-col h-[600px]">
                <div className="border-b border-[#00FFFF]/30 p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 ring-2 ring-[#FF0080]/50">
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" />
                      <AvatarFallback className="bg-[#FF0080] text-white font-orbitron">
                        CN
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-orbitron font-bold">CyberNinja</p>
                      <p className="text-xs text-[#8AFF00]">● Online</p>
                    </div>
                  </div>
                </div>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-[#0F0F0F] border border-[#00FFFF]/30 rounded-lg p-3 max-w-[70%]">
                      <p className="text-sm">Hey! I saw your profile. Interested in a collaboration?</p>
                      <span className="text-xs text-gray-500 mt-1 block">10:30 AM</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-[#FF0080]/20 to-[#00FFFF]/20 border border-[#FF0080]/30 rounded-lg p-3 max-w-[70%]">
                      <p className="text-sm">Sure! What did you have in mind?</p>
                      <span className="text-xs text-gray-500 mt-1 block">10:32 AM</span>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="bg-[#0F0F0F] border border-[#00FFFF]/30 rounded-lg p-3 max-w-[70%]">
                      <p className="text-sm">I'm working on a new DeFi project. Would love to have you on board!</p>
                      <span className="text-xs text-gray-500 mt-1 block">10:35 AM</span>
                    </div>
                  </div>
                </CardContent>

                <div className="border-t border-[#00FFFF]/30 p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      className="flex-1 bg-[#0F0F0F] border-[#FF0080]/30 focus:border-[#FF0080]"
                    />
                    <Button className="bg-gradient-to-r from-[#FF0080] to-[#00FFFF] hover:from-[#00FFFF] hover:to-[#8AFF00] text-white font-orbitron font-bold">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
