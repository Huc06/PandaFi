# 🔐 PandaFi Smart Contract

> **SocialFiProfile.sol** - The core smart contract powering PandaFi's decentralized social network

---

## 📋 Contract Overview

**Contract Name**: `SocialFiProfile`  
**Network**: U2U Subnet Testnet  
**Deployed Address**: `0x7e791c42ca37c9bebe335f2d90ca41872a28a025`  
**Solidity Version**: `^0.8.30`  
**License**: MIT

### Inheritance
- `ERC721` - NFT standard for post ownership
- `Ownable` - Access control for admin functions
- `IERC20` - Interface for U2U token payments

---

## 🏗️ Architecture

### Data Structures

```solidity
struct Profile {
    uint256 id;                    // Unique profile ID (1-indexed)
    address owner;                 // Wallet address
    string name;                   // Display name
    string avatarCID;             // IPFS CID for avatar
    string bioCID;                // IPFS CID for bio
    uint256 createdAt;            // Timestamp
    uint256 socialTokenBalance;   // Earned tokens
    uint256 totalEarned;          // Lifetime earnings
    uint256 totalHires;           // Times hired
}

struct Post {
    uint256 id;                    // Unique post ID (1-indexed)
    uint256 profileId;            // Author's profile ID
    string contentCID;            // IPFS CID for content
    uint256 timestamp;            // Creation time
    uint256 likeCount;            // Total likes
    uint256 commentCount;         // Total comments
    uint256 tipAmount;            // Total tips received
    bool isForSale;               // Listed for sale?
    uint256 price;                // Sale price in U2U tokens
    bool isDeleted;               // Soft delete flag
}

struct Comment {
    uint256 id;                    // Unique comment ID (1-indexed)
    uint256 postId;               // Parent post ID
    address author;               // Commenter address
    string contentCID;            // IPFS CID for comment
    uint256 timestamp;            // Creation time
}

struct Hire {
    uint256 id;                    // Unique hire ID (1-indexed)
    uint256 profileId;            // Hired player's profile ID
    address hirer;                // Hirer's address
    uint256 duration;             // Duration in hours
    uint256 amount;               // Total payment
    uint256 createdAt;            // Hire timestamp
    bool completed;               // Completion status
}
```

---

## 📝 Core Functions

### Profile Management

#### `createProfile(string _name, string _avatarCID, string _bioCID)`
Creates a new user profile.

**Parameters**:
- `_name`: Display name for the profile
- `_avatarCID`: IPFS CID of avatar image
- `_bioCID`: IPFS CID of bio content

**Emits**: `ProfileCreated(uint256 profileId, address owner)`

**Example**:
```solidity
createProfile("CyberNinja", "QmX...", "QmY...")
```

---

#### `getProfile(uint256 _profileId) → Profile`
Retrieves profile data by ID.

**Parameters**:
- `_profileId`: Profile ID (1-indexed)

**Returns**: `Profile` struct

---

### Post Management

#### `createPost(uint256 _profileId, string _contentCID)`
Creates a new post as an NFT.

**Parameters**:
- `_profileId`: Author's profile ID
- `_contentCID`: IPFS CID of post content

**Requirements**:
- Caller must own the profile
- Mints an ERC721 NFT to the creator

**Emits**: `PostCreated(uint256 postId, uint256 profileId)`

---

#### `likePost(uint256 _postId)`
Increments the like count for a post.

**Parameters**:
- `_postId`: Post ID to like

**Emits**: `PostLiked(uint256 postId, address liker)`

---

#### `tipPost(uint256 _postId, uint256 _amount)`
Sends U2U tokens as a tip to the post author.

**Parameters**:
- `_postId`: Post ID to tip
- `_amount`: Tip amount in U2U tokens (wei)

**Requirements**:
- Caller must approve contract to spend tokens first
- Transfers tokens from tipper to contract
- Credits author's `socialTokenBalance`

**Emits**: `PostTipped(uint256 postId, address tipper, uint256 amount)`

**Flow**:
```
1. User: u2uToken.approve(contract, amount)
2. User: contract.tipPost(postId, amount)
3. Contract: u2uToken.transferFrom(user, contract, amount)
4. Update: profiles[authorId].socialTokenBalance += amount
```

---

### Marketplace Functions

#### `sellPost(uint256 _postId, uint256 _price)`
Lists a post NFT for sale.

**Parameters**:
- `_postId`: Post ID to sell
- `_price`: Sale price in U2U tokens (wei)

**Requirements**:
- Caller must be NFT owner

**Emits**: `PostForSale(uint256 postId, uint256 price)`

---

#### `buyPost(uint256 _postId)`
Purchases a listed post NFT.

**Parameters**:
- `_postId`: Post ID to buy

**Requirements**:
- Post must be listed for sale
- Buyer must approve contract to spend `price` tokens
- Transfers NFT ownership to buyer
- Sends payment to seller

**Emits**: `PostBought(uint256 postId, address buyer, uint256 price)`

**Flow**:
```
1. Seller: contract.sellPost(postId, price)
2. Buyer: u2uToken.approve(contract, price)
3. Buyer: contract.buyPost(postId)
4. Contract: u2uToken.transferFrom(buyer, seller, price)
5. Contract: _transfer(seller, buyer, postId)
```

---

### Comment System

#### `addComment(uint256 _postId, string _contentCID)`
Adds a comment to a post.

**Parameters**:
- `_postId`: Parent post ID
- `_contentCID`: IPFS CID of comment content

**Emits**: `CommentAdded(uint256 postId, uint256 commentId, address author)`

---

#### `getComment(uint256 _commentId) → Comment`
Retrieves comment data by ID.

**Parameters**:
- `_commentId`: Comment ID (1-indexed)

**Returns**: `Comment` struct

---

### Talent Marketplace

#### `hirePlayer(uint256 _profileId, uint256 _duration, uint256 _ratePerHour)`
Hires a player for a specified duration.

**Parameters**:
- `_profileId`: Profile ID to hire
- `_duration`: Duration in hours
- `_ratePerHour`: Hourly rate in U2U tokens (wei)

**Requirements**:
- Cannot hire yourself
- Must approve contract to spend `duration * ratePerHour` tokens
- Payment held in escrow until completed

**Emits**: `PlayerHired(uint256 hireId, uint256 profileId, address hirer, uint256 amount)`

**Flow**:
```
1. Hirer: u2uToken.approve(contract, duration * rate)
2. Hirer: contract.hirePlayer(profileId, duration, rate)
3. Contract: u2uToken.transferFrom(hirer, contract, totalAmount)
4. Store hire data in escrow
```

---

#### `completeHire(uint256 _hireId)`
Completes a hire and releases payment to the player.

**Parameters**:
- `_hireId`: Hire ID to complete

**Requirements**:
- Only profile owner can complete
- Hire must not be already completed
- Transfers payment from contract to player
- Updates player's stats

**Emits**: `HireCompleted(uint256 hireId, uint256 profileId)`

**Flow**:
```
1. Player: contract.completeHire(hireId)
2. Contract: hires[hireId].completed = true
3. Contract: u2uToken.transfer(player, amount)
4. Update: totalEarned += amount, totalHires += 1
```

---

### Leaderboard

#### `getTopPlayers(uint256 _topN) → Profile[]`
Retrieves top N players.

**Parameters**:
- `_topN`: Number of top players to fetch

**Returns**: Array of `Profile` structs

**Note**: Currently returns first N profiles. For production, implement sorting by `totalEarned` or reputation score.

---

## 🔥 Events

```solidity
event ProfileCreated(uint256 indexed profileId, address owner);
event PostCreated(uint256 indexed postId, uint256 profileId);
event PostLiked(uint256 indexed postId, address liker);
event PostTipped(uint256 indexed postId, address tipper, uint256 amount);
event PostForSale(uint256 indexed postId, uint256 price);
event PostBought(uint256 indexed postId, address buyer, uint256 price);
event CommentAdded(uint256 indexed postId, uint256 commentId, address author);
event PlayerHired(uint256 indexed hireId, uint256 profileId, address hirer, uint256 amount);
event HireCompleted(uint256 indexed hireId, uint256 profileId);
```

---

## 🧪 Testing Guide

### Prerequisites

1. **U2U Testnet Wallet**
   - Get testnet U2U from [U2U Faucet](https://faucet.uniultra.xyz/)
   - Add U2U Testnet to MetaMask:
     ```
     Network Name: U2U Subnet Testnet
     RPC URL: https://rpc-nebulas-testnet.uniultra.xyz
     Chain ID: 2484
     Currency: U2U
     ```

2. **U2U Test Tokens**
   - Contract requires ERC20 token for payments
   - Deploy a test ERC20 or use existing testnet token

---

### Test Scenarios

#### 1. Create Profile
```javascript
// Web3.js / Ethers.js
await contract.createProfile("TestUser", "QmAvatar...", "QmBio...");
// Check: profileCount should increment
// Check: profiles[profileCount].owner === msg.sender
```

#### 2. Create Post
```javascript
const profileId = 1; // Your profile ID
await contract.createPost(profileId, "QmPostContent...");
// Check: postCount should increment
// Check: You own the NFT (ownerOf(postCount) === msg.sender)
```

#### 3. Tip Post
```javascript
const postId = 1;
const tipAmount = ethers.parseEther("10"); // 10 U2U

// Step 1: Approve
await u2uToken.approve(contractAddress, tipAmount);

// Step 2: Tip
await contract.tipPost(postId, tipAmount);

// Check: posts[postId].tipAmount increased
// Check: Author's socialTokenBalance increased
```

#### 4. Buy/Sell Post
```javascript
// Seller lists post
await contract.sellPost(postId, ethers.parseEther("100"));

// Buyer purchases
await u2uToken.approve(contractAddress, ethers.parseEther("100"));
await contract.buyPost(postId);

// Check: ownerOf(postId) === buyer
// Check: posts[postId].isForSale === false
```

#### 5. Hire Player
```javascript
const targetProfileId = 2;
const duration = 10; // hours
const rate = ethers.parseEther("5"); // 5 U2U/hour
const totalCost = duration * rate;

// Approve + Hire
await u2uToken.approve(contractAddress, totalCost);
await contract.hirePlayer(targetProfileId, duration, rate);

// Check: hireCount increased
// Check: hires[hireCount].completed === false

// Complete hire (as profile owner)
await contract.completeHire(hireCount);

// Check: Player's totalEarned increased
// Check: hires[hireCount].completed === true
```

---

## ⚙️ Deployment

### Hardhat Deployment Script

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const u2uTokenAddress = "0xYourU2UTokenAddress"; // Replace with actual token
  
  const SocialFiProfile = await hre.ethers.getContractFactory("SocialFiProfile");
  const contract = await SocialFiProfile.deploy(u2uTokenAddress);
  
  await contract.waitForDeployment();
  
  console.log("SocialFiProfile deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Deployment Command
```bash
npx hardhat run scripts/deploy.js --network u2u_testnet
```

### Hardhat Config
```javascript
// hardhat.config.js
module.exports = {
  solidity: "0.8.30",
  networks: {
    u2u_testnet: {
      url: "https://rpc-nebulas-testnet.uniultra.xyz",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 2484
    }
  }
};
```

---

## 🔒 Security Considerations

### Current Implementation

✅ **Implemented**:
- Reentrancy protection via OpenZeppelin contracts
- Owner-only restrictions on critical functions
- Input validation (address(0) checks)
- Event emissions for transparency

⚠️ **Potential Improvements**:
- Add rate limiting for spam prevention
- Implement reputation/moderation system
- Add withdrawal function for contract owner
- Consider using pull-payment pattern for tips/hires
- Add pausable functionality for emergency stops

### Audit Checklist

- [ ] Test all functions with edge cases
- [ ] Check gas optimization opportunities
- [ ] Verify ERC20 token approval/transfer flows
- [ ] Test NFT transfer edge cases
- [ ] Implement emergency pause mechanism
- [ ] Add comprehensive access controls
- [ ] Consider formal audit for mainnet

---

## 📊 Gas Estimates

| Function | Estimated Gas | Notes |
|----------|---------------|-------|
| `createProfile` | ~150k | One-time setup |
| `createPost` | ~180k | Includes NFT minting |
| `likePost` | ~45k | Simple state update |
| `tipPost` | ~80k | Includes token transfer |
| `sellPost` | ~50k | State update only |
| `buyPost` | ~120k | Token + NFT transfer |
| `addComment` | ~100k | Storage write |
| `hirePlayer` | ~150k | Escrow creation |
| `completeHire` | ~90k | Payment release |

*Estimates based on U2U Testnet. Actual gas may vary.*

---

## 🚀 Future Enhancements

### Phase 2: Advanced Features
- [ ] **Staking Mechanism**: Stake tokens for profile boosts
- [ ] **DAO Governance**: Token-weighted voting on platform changes
- [ ] **Content Moderation**: Community-driven flagging system
- [ ] **NFT Royalties**: Creator royalties on post resales
- [ ] **Profile NFTs**: Mint profiles as NFTs for portability

### Phase 3: Scaling
- [ ] **Layer 2 Integration**: Move to U2U Layer 2 for lower fees
- [ ] **Batch Operations**: Bulk likes/comments in single tx
- [ ] **IPFS Pinning**: Decentralized content storage guarantees
- [ ] **Cross-chain Bridge**: Connect with other networks

---

## 📚 Resources

- **OpenZeppelin Contracts**: [docs.openzeppelin.com](https://docs.openzeppelin.com/contracts/)
- **U2U Network Docs**: [docs.uniultra.xyz](https://docs.uniultra.xyz)
- **Solidity Documentation**: [docs.soliditylang.org](https://docs.soliditylang.org)
- **Hardhat**: [hardhat.org](https://hardhat.org)

---

## 📞 Support

For contract-related questions or issues:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/pandafi/issues)
- **Discord**: Join our dev community
- **Email**: dev@pandafi.io

---

## 📄 License

This contract is released under the **MIT License**.

```
Copyright (c) 2025 PandaFi Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
...
```

---

<div align="center">

**Built with ❤️ for the U2U Hackathon 2025**

[🏠 Main Project](../README.md) • [📱 Frontend Docs](../app/README.md) • [🔧 Deployment Guide](./DEPLOY.md)

</div>

