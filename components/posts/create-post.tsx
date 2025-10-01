'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image, Send } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { toast } from 'sonner';

export function CreatePost() {
  const { address } = useAccount();
  const [content, setContent] = useState('');
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createPost',
        args: [content],
      });
      
      toast.success('Post created successfully!');
      setContent('');
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
