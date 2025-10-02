'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Search } from 'lucide-react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { toast } from 'sonner';
import PubNub from 'pubnub';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';

interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: number;
  isMine: boolean;
}

interface Conversation {
  id: number;
  address: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export default function MessagesPage() {
  const { address } = useAccount();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const pubnubRef = useRef<PubNub | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Get all profiles from contract
  const { data: profileCountData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'profileCount',
  });
  const profileCount = typeof profileCountData === 'bigint' ? Number(profileCountData) : 0;

  // Fetch all profiles
  const allProfileContracts = React.useMemo(() => {
    return Array.from({ length: profileCount }, (_, i) => ({
      address: CONTRACT_ADDRESS as typeof CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getProfile' as const,
      args: [BigInt(i + 1)],
    }));
  }, [profileCount]);

  const allProfilesQuery = useReadContracts({
    contracts: allProfileContracts as any,
    query: { enabled: profileCount > 0 },
  } as any) as any;

  // Convert profiles to conversations (exclude self)
  React.useEffect(() => {
    console.log('🔍 Messages Debug:', {
      hasData: !!allProfilesQuery?.data,
      address,
      profileCount,
      queryStatus: allProfilesQuery?.status,
    });

    if (!allProfilesQuery?.data || !address) return;

    const rows = allProfilesQuery.data as any[];
    const convs: Conversation[] = [];

    console.log('📦 Raw profiles data:', rows.length);

    rows.forEach((res, idx) => {
      console.log(`Profile ${idx + 1}:`, res);
      
      if (res && res.status === 'success') {
        const pr = res.result as any;
        
        // Try both object and array access patterns
        const profileAddress = (pr?.owner || (Array.isArray(pr) ? pr[1] : '')) as string;
        const profileName = (pr?.name || (Array.isArray(pr) ? pr[2] : '')) as string;

        console.log(`  ├─ Address: ${profileAddress}`);
        console.log(`  ├─ Name: ${profileName}`);
        console.log(`  ├─ Is Self: ${profileAddress?.toLowerCase() === address.toLowerCase()}`);

        // Don't include self in conversations
        if (profileAddress && profileAddress.toLowerCase() !== address.toLowerCase()) {
          // Check if we have stored messages with this person
          const storedMessages = localStorage.getItem(`messages-${profileAddress.toLowerCase()}`);
          const lastMsg = storedMessages 
            ? JSON.parse(storedMessages).slice(-1)[0]?.content || 'Start a conversation'
            : 'Start a conversation';

          convs.push({
            id: idx + 1,
            address: profileAddress,
            name: profileName || `User ${idx + 1}`,
            lastMessage: lastMsg,
            time: '',
            unread: 0,
          });
          console.log(`  └─ ✅ Added to conversations`);
        } else {
          console.log(`  └─ ⏭️ Skipped (self or invalid)`);
        }
      }
    });

    console.log('👥 Available conversations:', convs.length, convs);
    setConversations(convs);
  }, [allProfilesQuery?.data, address]);

  // PubNub connection
  useEffect(() => {
    if (!address) return;

    // Initialize PubNub
    const pubnub = new PubNub({
      publishKey: 'demo', // Replace with your PubNub publish key
      subscribeKey: 'demo', // Replace with your PubNub subscribe key
      uuid: address, // Use wallet address as unique ID
    });

    // Subscribe to user's personal channel (to receive messages)
    const myChannel = `chat-${address.toLowerCase()}`;
    pubnub.subscribe({
      channels: [myChannel],
    });

    console.log('🔌 PubNub connected, listening on:', myChannel);
    setIsConnected(true);
    toast.success('Connected to chat server');

    // Listen for messages
    pubnub.addListener({
      message: (event) => {
        console.log('📨 Received message:', event);
        const data = event.message as any;
        
        // Add received message to state
        const newMessage: Message = {
          id: event.timetoken.toString(),
          sender: data.sender,
          receiver: data.receiver,
          content: data.content,
          timestamp: Number(event.timetoken) / 10000, // PubNub timetoken to ms
          isMine: false,
        };
        
        setMessages((prev) => [...prev, newMessage]);
        toast.message(`New message from ${data.senderName || data.sender.slice(0, 6) + '...'}`);
      },
      status: (statusEvent) => {
        console.log('PubNub status:', statusEvent);
        if (statusEvent.category === 'PNConnectedCategory') {
          setIsConnected(true);
        }
      },
    });

    pubnubRef.current = pubnub;

    return () => {
      pubnub.unsubscribeAll();
      pubnub.removeAllListeners();
      setIsConnected(false);
    };
  }, [address]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !address || !pubnubRef.current) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: address,
      receiver: selectedConversation.address,
      content: messageInput,
      timestamp: Date.now(),
      isMine: true,
    };

    try {
      // Send to receiver's channel via PubNub
      const receiverChannel = `chat-${selectedConversation.address.toLowerCase()}`;
      
      await pubnubRef.current.publish({
        channel: receiverChannel,
        message: {
          sender: address,
          receiver: selectedConversation.address,
          content: messageInput,
          senderName: 'You', // You can replace with profile name
        },
      });

      console.log('✅ Message sent to:', receiverChannel);
      
      // Add to local state
      setMessages((prev) => [...prev, message]);
      setMessageInput('');

      // Update conversation last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: messageInput.slice(0, 30) + '...', time: 'Just now' }
            : conv
        )
      );
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    // Load messages for this conversation (from local storage)
    const storageKey = `messages-${conv.address.toLowerCase()}`;
    const storedMessages = localStorage.getItem(storageKey);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([]);
    }
  };

  // Save messages to localStorage
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const storageKey = `messages-${selectedConversation.address.toLowerCase()}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
      
      // Update conversation last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.address.toLowerCase() === selectedConversation.address.toLowerCase()
            ? { ...conv, lastMessage: messages[messages.length - 1].content.slice(0, 30) + (messages[messages.length - 1].content.length > 30 ? '...' : ''), time: 'Now' }
            : conv
        )
      );
    }
  }, [messages, selectedConversation]);

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
                Real-time peer-to-peer messaging via PubNub
                {isConnected && <span className="text-[#8AFF00] ml-2">● Connected</span>}
                {!isConnected && <span className="text-[#FF0080] ml-2">● Disconnected</span>}
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
                    {conversations.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">No profiles found yet.</p>
                        <p className="text-xs mt-2">Other users need to create profiles first.</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FF0080]/10 cursor-pointer transition-colors border ${
                          selectedConversation?.id === conv.id
                            ? 'border-[#FF0080]/50 bg-[#FF0080]/10'
                            : 'border-transparent hover:border-[#FF0080]/30'
                        }`}
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-[#00FFFF]/50">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.address}`} />
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-[#1B1B1B] border-[#FF0080]/30 flex flex-col h-[600px]">
                {selectedConversation ? (
                  <>
                    <div className="border-b border-[#00FFFF]/30 p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 ring-2 ring-[#FF0080]/50">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.address}`} />
                          <AvatarFallback className="bg-[#FF0080] text-white font-orbitron">
                            {selectedConversation.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-orbitron font-bold">{selectedConversation.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{selectedConversation.address.slice(0, 6)}...{selectedConversation.address.slice(-4)}</p>
                        </div>
                      </div>
                    </div>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`rounded-lg p-3 max-w-[70%] ${
                                msg.isMine
                                  ? 'bg-gradient-to-r from-[#FF0080]/20 to-[#00FFFF]/20 border border-[#FF0080]/30'
                                  : 'bg-[#0F0F0F] border border-[#00FFFF]/30'
                              }`}
                            >
                              <p className="text-sm break-words">{msg.content}</p>
                              <span className="text-xs text-gray-500 mt-1 block">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </CardContent>

                    <div className="border-t border-[#00FFFF]/30 p-4">
                      <div className="flex space-x-2">
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 bg-[#0F0F0F] border-[#FF0080]/30 focus:border-[#FF0080]"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                          className="bg-gradient-to-r from-[#FF0080] to-[#00FFFF] hover:from-[#00FFFF] hover:to-[#8AFF00] text-white font-orbitron font-bold disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p className="font-orbitron">Select a conversation to start messaging</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
