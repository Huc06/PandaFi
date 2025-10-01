export interface Profile {
  id: bigint;
  owner: string;
  name: string;
  avatarCID: string;
  bioCID: string;
  createdAt: bigint;
  socialTokenBalance: bigint;
  totalEarned: bigint;
  totalHires: bigint;
}

export interface Post {
  id: bigint;
  author: string;
  contentCID: string;
  timestamp: bigint;
  likeCount: bigint;
  commentCount: bigint;
  isDeleted: boolean;
}

export interface Hire {
  id: bigint;
  profileId: bigint;
  hirer: string;
  duration: bigint;
  amount: bigint;
  createdAt: bigint;
  completed: boolean;
}
