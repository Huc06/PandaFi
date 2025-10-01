'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import type { Post } from '@/lib/types';
import { useAccount } from 'wagmi';

interface PostCardProps {
  post: Post;
  authorName?: string;
  onLike?: () => void;
  onDelete?: () => void;
}

export function PostCard({ post, authorName = 'Anonymous', onLike, onDelete }: PostCardProps) {
  const { address } = useAccount();
  const [liked, setLiked] = useState(false);
  const authorAddr = typeof post.author === 'string' ? post.author : '';
  const isAuthor = !!address && !!authorAddr && address.toLowerCase() === authorAddr.toLowerCase();
  const likeCountValue = typeof post.likeCount === 'bigint' ? Number(post.likeCount) : Number(post.likeCount ?? 0);
  const commentCountText = typeof post.commentCount === 'bigint' ? post.commentCount.toString() : String(post.commentCount ?? 0);
  const displayName = authorName && authorName !== 'Anonymous'
    ? authorName
    : (authorAddr ? `${authorAddr.slice(0, 6)}...${authorAddr.slice(-4)}` : 'Anonymous');
  const ts = Number(post.timestamp);
  const displayDate = Number.isFinite(ts) && ts > 0
    ? new Date(ts * 1000).toISOString().slice(0, 10)
    : '-';

  const handleLike = () => {
    setLiked(!liked);
    onLike?.();
  };

  return (
    <Card className="bg-[#1B1B1B] border-[#FF0080]/30 hover:border-[#00FFFF]/50 transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12 ring-2 ring-[#00FFFF]/50">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${authorAddr}`} />
            <AvatarFallback className="bg-[#00FFFF] text-[#0F0F0F] font-orbitron">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-orbitron font-bold text-[#00FFFF]">{displayName}</h4>
                <p className="text-xs text-gray-500 font-mono">
                  {authorAddr ? `${authorAddr.slice(0, 6)}...${authorAddr.slice(-4)}` : 'Unknown'}
                </p>
              </div>
              <span className="text-xs text-gray-500" suppressHydrationWarning>
                {displayDate}
              </span>
            </div>

            <div className="mt-4 p-4 bg-[#0F0F0F] rounded-lg border border-[#8AFF00]/30">
              <p className="text-sm text-gray-300 leading-relaxed">
                {post.contentCID}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-[#FF0080]/20 pt-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`font-orbitron ${
                liked ? 'text-[#FF0080]' : 'text-gray-400'
              } hover:text-[#FF0080]`}
            >
              <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-current' : ''}`} />
              {likeCountValue + (liked ? 1 : 0)}
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#00FFFF] font-orbitron">
              <MessageCircle className="h-4 w-4 mr-2" />
              {commentCountText}
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#8AFF00] font-orbitron">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {isAuthor && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 font-orbitron"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
