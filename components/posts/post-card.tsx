'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Trash2, ShoppingCart, DollarSign, Tag, Coins } from 'lucide-react';
import type { Post } from '@/lib/types';
import { useAccount, useWaitForTransactionReceipt, useWriteContract, useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';
import type { Address, Abi } from 'viem';
import { parseUnits, formatUnits } from 'viem';
import type { Comment } from '@/lib/types';
import { toast } from 'sonner';
import { XEmbed } from '@/components/x-embed';

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'amount' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { type: 'address', name: 'owner' },
      { type: 'address', name: 'spender' }
    ],
    outputs: [{ type: 'uint256' }]
  }
] as const;

interface PostCardProps {
  post: Post;
  authorName?: string;
  onLike?: () => void;
  onDelete?: () => void;
}

// Function to detect and extract URLs from text
const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// Function to check if URL is embeddable
const isEmbeddableUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // YouTube URLs
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return true;
    }
    
    // X (Twitter) URLs
    if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

export function PostCard({ post, authorName = 'Anonymous', onLike, onDelete }: PostCardProps) {
  const { address } = useAccount();
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [tipInput, setTipInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [tokenPriceInput, setTokenPriceInput] = useState('');
  const [tokenAmountInput, setTokenAmountInput] = useState('');
  const [postPriceInTokenInput, setPostPriceInTokenInput] = useState('');
  const [isTokenOps, setIsTokenOps] = useState(false);
  const [showFetchedOnce, setShowFetchedOnce] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const authorAddr = typeof post.author === 'string' ? post.author : '';
  const isAuthor = !!address && !!authorAddr && address.toLowerCase() === authorAddr.toLowerCase();

  // Share functions
  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareToTwitter = () => {
    const text = `Check out this post on PandaFi!`;
    const url = `${window.location.origin}/dashboard?post=${post.id}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareToLinkedIn = () => {
    const text = `Check out this post on PandaFi!`;
    const url = `${window.location.origin}/dashboard?post=${post.id}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, '_blank');
  };

  const shareToFacebook = () => {
    const url = `${window.location.origin}/dashboard?post=${post.id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PandaFi Post',
          text: 'Check out this post on PandaFi!',
          url: `${window.location.origin}/dashboard?post=${post.id}`,
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copy link
      const url = `${window.location.origin}/dashboard?post=${post.id}`;
      await copyToClipboard(url);
    }
  };
  const likeCountValue = typeof post.likeCount === 'bigint' ? Number(post.likeCount) : Number(post.likeCount ?? 0);
  const displayName = authorName && authorName !== 'Anonymous'
    ? authorName
    : (authorAddr ? `${authorAddr.slice(0, 6)}...${authorAddr.slice(-4)}` : 'Anonymous');
  const ts = Number(post.timestamp);
  const displayDate = Number.isFinite(ts) && ts > 0
    ? new Date(ts * 1000).toISOString().slice(0, 10)
    : '-';

  const { writeContract, data: likeHash, isPending: isLiking } = useWriteContract();
  const { isLoading: likeConfirming, isSuccess: likeConfirmed } = useWaitForTransactionReceipt({ hash: likeHash });
  const { data: txHash, isPending: isActionPending } = { data: undefined as any, isPending: false } as any;

  // Read U2U token address from contract
  const { data: u2uTokenAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'u2uToken',
  } as any);

  // Read on-chain comments when comments panel is open
  const { data: commentCountData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'commentCount',
    query: { enabled: showComments },
  } as any);
  const commentCount = typeof commentCountData === 'bigint' ? Number(commentCountData) : 0;

  const commentContracts = React.useMemo(
    () => Array.from({ length: commentCount }, (_, i) => ({
      address: CONTRACT_ADDRESS as typeof CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'comments' as const,
      args: [BigInt(i + 1)],
    })),
    [commentCount]
  );

  const commentsQuery = useReadContracts({
    contracts: commentContracts as any,
    query: { enabled: showComments && commentContracts.length > 0 },
  } as any) as any;

  const chainComments: Comment[] = React.useMemo(() => {
    const rows = commentsQuery?.data as any[] | undefined;
    if (!rows) return [];
    return rows
      .map((res) => (res && res.status === 'success' ? (res.result as any) : undefined))
      .filter(Boolean)
      .map((r: any) => ({
        id: r[0] as bigint,
        postId: r[1] as bigint,
        author: r[2] as string,
        contentCID: r[3] as string,
        timestamp: r[4] as bigint,
      }))
      .filter((c: Comment) => c.postId === post.id);
  }, [commentsQuery?.data, post.id]);

  React.useEffect(() => {
    if (showComments && !showFetchedOnce) setShowFetchedOnce(true);
  }, [showComments, showFetchedOnce]);

  const totalCommentCount = React.useMemo(() => {
    const base = typeof post.commentCount === 'bigint' ? Number(post.commentCount) : Number(post.commentCount ?? 0);
    return (chainComments?.length && chainComments.length > 0)
      ? chainComments.length
      : base + localComments.length;
  }, [post.commentCount, chainComments, localComments.length]);
  const commentCountText = String(totalCommentCount);

  const handleLike = async () => {
    try {
      setLiked((v) => !v);
      writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'likePost',
        args: [post.id],
      } as any);
      toast.message('Submitting like...');
    } catch (e) {
      setLiked((v) => !v);
      toast.error('Failed to like post');
    }
  };

  if (likeConfirmed) {
    // notify feed to refresh counts
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('post:updated'));
    }
  }

  const handleTip = async () => {
    const hasTip = ((CONTRACT_ABI as unknown) as any[]).some((f: any) => f.name === 'tipPost');
    if (!hasTip) return toast.info('Contract has no tipPost yet');
    const value = tipInput.trim();
    if (!value || !address || !u2uTokenAddress) return;
    setIsTipping(true);
    try {
      const amountWei = parseUnits(value, 18);
      const tokenAddr = u2uTokenAddress as Address;
      
      // Step 1: Approve (simplified - always approve the amount)
      toast.message('Approving U2U token...');
      await writeContract({
        address: tokenAddr,
        abi: ERC20_ABI as unknown as Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amountWei],
        gas: BigInt(100000),
      } as any);
      toast.success('Approval submitted, waiting for confirmation...');
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for confirmation
      
      // Step 2: Tip
      console.log('Calling tipPost with:', { postId: String(post.id), amountWei: String(amountWei) });
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'tipPost',
        args: [post.id, amountWei],
        gas: BigInt(150000),
      } as any);
      setTipInput('');
      toast.success('Tip submitted!');
      window.dispatchEvent(new CustomEvent('post:updated'));
    } catch (e: any) {
      console.error('Tip error:', e);
      toast.error(e?.message || 'Failed to tip');
    } finally {
      setIsTipping(false);
    }
  };

  const handleSell = async () => {
    const hasSell = ((CONTRACT_ABI as unknown) as any[]).some((f: any) => f.name === 'sellPost');
    if (!hasSell) return toast.info('Contract has no sellPost yet');
    const price = priceInput.trim();
    if (!price) return;
    try {
      const priceWei = parseUnits(price, 18);
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'sellPost',
        args: [post.id, priceWei],
      } as any);
      toast.success('Post listed for sale');
      window.dispatchEvent(new CustomEvent('post:updated'));
    } catch (e) {
      toast.error('Failed to list post');
    }
  };

  const handleSetPostTokenForSale = async () => {
    const hasFn = ((CONTRACT_ABI as unknown) as any[]).some((f: any) => f.name === 'setPostTokenForSale');
    if (!hasFn) return toast.info('Contract has no setPostTokenForSale');
    const priceTxt = tokenPriceInput.trim();
    const amountTxt = tokenAmountInput.trim();
    if (!priceTxt || !amountTxt) return;
    try {
      const priceWei = parseUnits(priceTxt, 18);
      const amount = BigInt(amountTxt);
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'setPostTokenForSale',
        args: [post.id, priceWei, amount],
      } as any);
      toast.success('Post tokens listed for sale');
      window.dispatchEvent(new CustomEvent('post:updated'));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to list post tokens');
    }
  };

  const handleBuyPostTokens = async () => {
    const hasFn = ((CONTRACT_ABI as unknown) as any[]).some((f: any) => f.name === 'buyPostTokens');
    if (!hasFn) return toast.info('Contract has no buyPostTokens');
    const amountTxt = tokenAmountInput.trim();
    if (!amountTxt || !address || !u2uTokenAddress) return;
    setIsTokenOps(true);
    try {
      const amount = BigInt(amountTxt);
      const totalCost = (post as any).tokenPrice && typeof (post as any).tokenPrice === 'bigint'
        ? (post as any).tokenPrice * amount
        : undefined;
      const tokenAddr = u2uTokenAddress as Address;
      if (totalCost) {
        toast.message('Approving U2U token...');
        await writeContract({
          address: tokenAddr,
          abi: ERC20_ABI as unknown as Abi,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS, totalCost],
        } as any);
        await new Promise((r) => setTimeout(r, 3000));
      }
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'buyPostTokens',
        args: [post.id, amount],
      } as any);
      toast.success('Buy post tokens submitted');
      window.dispatchEvent(new CustomEvent('post:updated'));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to buy post tokens');
    } finally {
      setIsTokenOps(false);
    }
  };

  const handleSellWithPostToken = async () => {
    const hasFn = ((CONTRACT_ABI as unknown) as any[]).some((f: any) => f.name === 'sellPostWithPostToken');
    if (!hasFn) return toast.info('Contract has no sellPostWithPostToken');
    const priceTxt = postPriceInTokenInput.trim();
    if (!priceTxt) return;
    try {
      const priceInPostToken = BigInt(priceTxt);
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'sellPostWithPostToken',
        args: [post.id, priceInPostToken],
      } as any);
      toast.success('Post listed (post token)');
      window.dispatchEvent(new CustomEvent('post:updated'));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to list post with post token');
    }
  };

  const handleBuyWithPostToken = async () => {
    const hasFn = ((CONTRACT_ABI as unknown) as any[]).some((f: any) => f.name === 'buyPostWithPostToken');
    if (!hasFn) return toast.info('Contract has no buyPostWithPostToken');
    const postToken = (post as any).postToken as string | undefined;
    const priceInPostToken = (post as any).priceInPostToken as bigint | undefined;
    if (!postToken || !priceInPostToken) return toast.info('Post token sale not available');
    setIsTokenOps(true);
    try {
      // Approve postToken to contract
      await writeContract({
        address: postToken as Address,
        abi: ERC20_ABI as unknown as Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, priceInPostToken],
      } as any);
      await new Promise((r) => setTimeout(r, 3000));
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'buyPostWithPostToken',
        args: [post.id],
      } as any);
      toast.success('Purchase with post token submitted');
      window.dispatchEvent(new CustomEvent('post:updated'));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to buy with post token');
    } finally {
      setIsTokenOps(false);
    }
  };

  const handleBuy = async () => {
    const hasBuy = ((CONTRACT_ABI as unknown) as any[]).some((f: any) => f.name === 'buyPost');
    if (!hasBuy) return toast.info('Contract has no buyPost yet');
    if (!post.isForSale || !post.price || !address || !u2uTokenAddress) return;
    setIsBuying(true);
    try {
      const priceWei = post.price;
      const tokenAddr = u2uTokenAddress as Address;
      
      // Step 1: Approve
      toast.message('Approving U2U token...');
      await writeContract({
        address: tokenAddr,
        abi: ERC20_ABI as unknown as Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, priceWei],
        gas: BigInt(100000),
      } as any);
      toast.success('Approval submitted, waiting for confirmation...');
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for confirmation
      
      // Step 2: Buy
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'buyPost',
        args: [post.id],
        gas: BigInt(200000),
      } as any);
      toast.success('Purchase submitted!');
      window.dispatchEvent(new CustomEvent('post:updated'));
    } catch (e: any) {
      console.error('Buy error:', e);
      toast.error(e?.message || 'Failed to buy post');
    } finally {
      setIsBuying(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    const hasAddComment = ((CONTRACT_ABI as unknown) as any[]).some((f: any) => f.name === 'addComment');
    // Optimistic add to local list
    const now = BigInt(Math.floor(Date.now() / 1000));
    const newComment: Comment = {
      id: BigInt(localComments.length + 1),
      postId: post.id,
      author: authorAddr || address || '0x',
      contentCID: commentInput,
      timestamp: now,
    };
    console.log('Optimistic newComment:', newComment);
    setLocalComments((prev) => [...prev, newComment]);
    setCommentInput('');
    if (!hasAddComment) {
      toast.info('Comment saved locally. Add addComment/getComments to contract to persist.');
      return;
    }
    try {
      console.log('Sending addComment tx with:', { postId: post.id, contentCID: commentInput });
      await writeContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI as unknown as Abi,
        functionName: 'addComment',
        args: [post.id, commentInput],
      } as any);
      toast.message('Submitting comment...');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('post:updated'));
      }
    } catch (e) {
      toast.error('Failed to send comment on-chain');
    }
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
              
              {/* Auto-embed URLs */}
              {(() => {
                const urls = extractUrls(post.contentCID);
                const embeddableUrls = urls.filter(isEmbeddableUrl);
                
                if (embeddableUrls.length > 0) {
                  return (
                    <div className="mt-4 space-y-4">
                      {embeddableUrls.map((url, index) => (
                        <div key={index} className="rounded-lg overflow-hidden border border-[#00FFFF]/20">
                          <XEmbed url={url} align="center" />
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
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
              disabled={isLiking || likeConfirming}
              className={`font-orbitron ${
                liked ? 'text-[#FF0080]' : 'text-gray-400'
              } hover:text-[#FF0080]`}
            >
              <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-current' : ''}`} />
              {likeCountValue + (liked ? 1 : 0)}
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#00FFFF] font-orbitron" onClick={() => setShowComments((v) => !v)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              {commentCountText}
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#8AFF00] font-orbitron" onClick={handleShare}>
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
      <div className="px-6 pb-4">
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-[#0F0F0F] rounded-lg border border-[#FF0080]/30 space-y-2">
              <div className="flex items-center justify-between">
              <div className="font-orbitron text-sm text-[#FF0080] flex items-center"><DollarSign className="h-4 w-4 mr-1" /> Tip</div>
              <div className="text-xs text-gray-500">{typeof post.tipAmount === 'bigint' ? `${formatUnits(post.tipAmount, 18)} U2U` : '0 U2U'}</div>
            </div>
            <div className="flex gap-2">
              <input
                value={tipInput}
                onChange={(e) => setTipInput(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Amount (U2U)"
                className="flex-1 bg-[#1B1B1B] border border-[#00FFFF]/30 rounded px-2 py-1 text-sm"
                inputMode="decimal"
                aria-label="Tip amount in U2U"
              />
              <Button size="sm" onClick={handleTip} disabled={!tipInput.trim() || isTipping} className="bg-[#FF0080] text-white font-orbitron disabled:opacity-50">
                {isTipping ? 'Processing...' : 'Send'}
              </Button>
            </div>
          </div>
          <div className="p-3 bg-[#0F0F0F] rounded-lg border border-[#00FFFF]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-orbitron text-sm text-[#00FFFF] flex items-center"><Tag className="h-4 w-4 mr-1" /> Sell (U2U)</div>
              <div className="text-xs text-gray-500">
                {post.isForSale ? (
                  <span className="text-[#8AFF00] font-bold">FOR SALE: {typeof post.price === 'bigint' ? `${formatUnits(post.price, 18)} U2U` : '0 U2U'}</span>
                ) : (
                  'Not for sale'
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Price (U2U)"
                className="flex-1 bg-[#1B1B1B] border border-[#00FFFF]/30 rounded px-2 py-1 text-sm"
                disabled={!isAuthor}
              />
              {isAuthor ? (
                <Button size="sm" onClick={handleSell} className="bg-[#00FFFF] text-[#0F0F0F] font-orbitron">
                  List (U2U)
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleBuy} 
                  disabled={isBuying || !post.isForSale} 
                  className="bg-[#8AFF00] text-[#0F0F0F] font-orbitron disabled:opacity-50"
                  title={!post.isForSale ? 'This post is not for sale' : `Buy for ${typeof post.price === 'bigint' ? formatUnits(post.price, 18) : '0'} U2U`}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" /> {isBuying ? 'Buying...' : (post.isForSale ? 'Buy Now' : 'Not Available')}
                </Button>
              )}
            </div>
          </div>
          <div className="p-3 bg-[#0F0F0F] rounded-lg border border-[#FCEE09]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-orbitron text-sm text-[#FCEE09] flex items-center"><Coins className="h-4 w-4 mr-1" /> Post Token</div>
              <div className="text-xs text-gray-500">
                {(post as any).postToken ? (
                  <span className="text-[#8AFF00] font-bold">
                    Token: {String((post as any).postToken).slice(0, 6)}...{String((post as any).postToken).slice(-4)}
                  </span>
                ) : (
                  'Tokenized on create'
                )}
              </div>
            </div>
            {(post as any).postToken && (
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono break-all">{String((post as any).postToken)}</span>
                  <button
                    className="px-1 py-0.5 border border-[#FCEE09]/30 rounded hover:bg-[#FCEE09]/10"
                    onClick={() => navigator.clipboard.writeText(String((post as any).postToken))}
                    title="Copy token address"
                  >Copy</button>
                  <a
                    className="px-1 py-0.5 border border-[#FCEE09]/30 rounded hover:bg-[#FCEE09]/10"
                    href={`https://u2uscan.xyz/address/${String((post as any).postToken)}`}
                    target="_blank" rel="noreferrer"
                    title="View on Explorer"
                  >Explorer</a>
                </div>
                <div>
                  Price/Token: {(post as any).tokenPrice ? `${formatUnits((post as any).tokenPrice, 18)} U2U` : 'Not listed'}
                </div>
                <div>
                  Available: {(post as any).tokensForSale != null ? String((post as any).tokensForSale) : '—'}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={tokenPriceInput}
                onChange={(e) => setTokenPriceInput(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Token price (U2U)"
                className="bg-[#1B1B1B] border border-[#FCEE09]/30 rounded px-2 py-1 text-sm"
                disabled={!isAuthor}
              />
              <input
                value={tokenAmountInput}
                onChange={(e) => setTokenAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Amount"
                className="bg-[#1B1B1B] border border-[#FCEE09]/30 rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex gap-2">
              {isAuthor ? (
                <Button size="sm" onClick={handleSetPostTokenForSale} className="bg-[#FCEE09] text-[#0F0F0F] font-orbitron">List Tokens</Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleBuyPostTokens}
                  disabled={
                    isTokenOps ||
                    !(post as any).tokenPrice ||
                    !((post as any).tokensForSale && ((post as any).tokensForSale as bigint) > BigInt(0))
                  }
                  className="bg-[#FCEE09] text-[#0F0F0F] font-orbitron disabled:opacity-50"
                  title={
                    !(post as any).tokenPrice
                      ? 'Token not listed yet'
                      : (!((post as any).tokensForSale && ((post as any).tokensForSale as bigint) > BigInt(0))
                          ? 'No tokens available'
                          : 'Buy tokens')
                  }
                >Buy Tokens</Button>
              )}
            </div>
          </div>
          <div className="p-3 bg-[#0F0F0F] rounded-lg border border-[#FF0080]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-orbitron text-sm text-[#FF0080] flex items-center"><Tag className="h-4 w-4 mr-1" /> Sell Post w/ Tokens</div>
              <div className="text-xs text-gray-500">
                {(post as any).isForSaleInPostToken ? (
                  <span className="text-[#8AFF00] font-bold">FOR SALE: {(post as any).priceInPostToken?.toString?.() || ''} post tokens</span>
                ) : (
                  'Not for sale in tokens'
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={postPriceInTokenInput}
                onChange={(e) => setPostPriceInTokenInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Amount (post tokens)"
                className="bg-[#1B1B1B] border border-[#FF0080]/30 rounded px-2 py-1 text-sm"
                disabled={!isAuthor}
              />
            </div>
            <div className="flex gap-2">
              {isAuthor ? (
                <Button size="sm" onClick={handleSellWithPostToken} className="bg-[#FF0080] text-white font-orbitron">List Post w/ Tokens</Button>
              ) : (
                <Button size="sm" onClick={handleBuyWithPostToken} disabled={isTokenOps || !(post as any).isForSaleInPostToken} className="bg-[#FF0080] text-white font-orbitron disabled:opacity-50">Buy w/ Tokens</Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showComments && (
        <div className="px-6 pb-4">
          <div className="mt-4 p-4 bg-[#0F0F0F] rounded-lg border border-[#00FFFF]/30 space-y-4">
            <div className="space-y-3">
              {(chainComments.length > 0 ? chainComments : localComments).length === 0 ? (
                <p className="text-xs text-gray-500">No comments yet.</p>
              ) : (
                (chainComments.length > 0 ? chainComments : localComments).map((c) => (
                  <div key={c.id.toString()} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-gray-400">{c.author.slice(0, 6)}...{c.author.slice(-4)}</span>
                      <span className="text-xs text-gray-500" suppressHydrationWarning>
                        {new Date(Number(c.timestamp) * 1000).toISOString().slice(0, 10)}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-200">{(c as any).contentCID ?? (c as any).content}</p>
                  </div>
                ))
              )}
            </div>
            <Textarea
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="min-h-[80px] bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF] resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" className="bg-gradient-to-r from-[#FF0080] to-[#00FFFF] text-white font-orbitron" onClick={handleAddComment}>
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1B1B1B] border border-[#00FFFF]/30 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-orbitron text-[#00FFFF] mb-4">Share Post</h3>
            
            <div className="space-y-3">
              <Button
                onClick={shareViaWebAPI}
                className="w-full bg-gradient-to-r from-[#FF0080] to-[#00FFFF] text-white font-orbitron"
              >
                Share via Device
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={shareToTwitter}
                  variant="outline"
                  className="border-[#1DA1F2] text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white font-orbitron"
                >
                  Twitter
                </Button>
                <Button
                  onClick={shareToLinkedIn}
                  variant="outline"
                  className="border-[#0077B5] text-[#0077B5] hover:bg-[#0077B5] hover:text-white font-orbitron"
                >
                  LinkedIn
                </Button>
                <Button
                  onClick={shareToFacebook}
                  variant="outline"
                  className="border-[#4267B2] text-[#4267B2] hover:bg-[#4267B2] hover:text-white font-orbitron"
                >
                  Facebook
                </Button>
                <Button
                  onClick={() => copyToClipboard(`${window.location.origin}/dashboard?post=${post.id}`)}
                  variant="outline"
                  className="border-[#8AFF00] text-[#8AFF00] hover:bg-[#8AFF00] hover:text-black font-orbitron"
                >
                  Copy Link
                </Button>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#00FFFF]/20">
              <Button
                onClick={() => setShowShareModal(false)}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white font-orbitron"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
