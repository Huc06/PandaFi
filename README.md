# 🌐 PandaFi - Decentralized SocialFi Platform

<div align="center">

![PandaFi Banner](https://img.shields.io/badge/Built%20on-U2U%20Network-FF0080?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-13.5-000000?style=for-the-badge&logo=next.js)
![Smart Contracts](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)
![License](https://img.shields.io/badge/License-MIT-00FFFF?style=for-the-badge)

**The Future of Social Networking Meets Web3**

[📱 Live Demo](https://pandafi-dapp.vercel.app) • [🎥 Video Demo](https://youtu.be/demo) • [📊 Pitch Deck](https://pitch.com/pandafi)

> **Note**: Replace the links above with your actual deployment URLs before submission

</div>

---

## 🚀 Overview

**PandaFi** is a fully decentralized SocialFi platform built on the **U2U Network Nebulas Testnet**, combining the best of social media with DeFi mechanics. Users can create profiles as NFTs, monetize content, hire talent, and engage in real-time peer-to-peer communication—all powered by blockchain technology.

### 🎯 Problem We're Solving

Traditional social media platforms:
- ❌ Centralized control over user data
- ❌ No direct monetization for creators
- ❌ Platform takes most of the revenue
- ❌ No true ownership of content
- ❌ Limited transparency

**PandaFi** revolutionizes this by:
- ✅ Decentralized ownership via NFT profiles
- ✅ Direct P2P monetization (tips, content sales)
- ✅ Smart contract-based talent marketplace
- ✅ Real-time encrypted messaging
- ✅ 100% transparent on-chain interactions

---

## ✨ Key Features

### 🎭 NFT Profile System
- Mint your identity as an ERC721 NFT
- Store profile data on IPFS (avatar, bio)
- Build reputation with social tokens
- Track earnings and hires on-chain

### 💰 Content Monetization
- **Post-to-Earn**: Create posts and earn tips
- **Sell Posts**: List content for sale as NFTs
- **Secondary Market**: Buy and trade popular posts
- **Micro-tipping**: Send U2U tokens to creators

### 🤝 Decentralized Talent Marketplace
- Hire top players by the hour
- Smart contract escrow for payments
- Reputation-based leaderboard
- Track active and completed hires

### 💬 Real-Time P2P Messaging
- Wallet-to-wallet encrypted chat
- PubNub-powered real-time communication
- No central server storing messages
- Cross-device message persistence

### 📊 Social Feed & Discovery
- Neural feed with real-time updates
- Trending posts algorithm
- Like, comment, and share content
- Profile-based content filtering

---

## 🏗️ Architecture

### System Flow Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │ Web3    │              │ JSON-RPC│             │
│  Frontend   │◄───────►│ Wagmi/Viem   │◄───────►│ U2U Network │
│  (Next.js)  │         │              │         │  Testnet    │
│             │         └──────────────┘         │             │
└─────┬───────┘                                  └──────┬──────┘
      │                                                  │
      │ PubNub WebSocket                                │ Reads/Writes
      │                                                  │
      ▼                                                  ▼
┌─────────────┐                              ┌─────────────────┐
│             │                              │                 │
│   PubNub    │                              │ Smart Contract  │
│  Real-time  │                              │   (ERC721 +     │
│  Messaging  │                              │    Logic)       │
│             │                              │                 │
└─────────────┘                              └─────────────────┘
      │                                                  │
      │                                                  │
      ▼                                                  ▼
┌─────────────┐                              ┌─────────────────┐
│ Local       │                              │ IPFS            │
│ Storage     │                              │ (Content)       │
└─────────────┘                              └─────────────────┘
```

### Data Flow: Post Creation

```
User Input → Frontend Validation → Get ProfileID
      ↓
Estimate Gas → Display Fee → User Confirms
      ↓
Sign Transaction → Submit to U2U Network
      ↓
Contract Execution → Emit Event → Update State
      ↓
Frontend Listens → Update UI → Show Toast
```

### Tech Stack

**Frontend**
- ⚛️ **Next.js 13** - React framework with App Router
- 🎨 **TailwindCSS** - Utility-first styling
- 🌈 **shadcn/ui** - Beautiful UI components
- 🔗 **Wagmi v2** - React Hooks for Ethereum
- 🦄 **RainbowKit** - Wallet connection UI
- 📡 **PubNub** - Real-time messaging

**Smart Contracts**
- 💎 **Solidity 0.8.20** - Smart contract language
- 🏛️ **ERC721** - NFT profile standard
- 💵 **ERC20** - U2U token integration
- 🔒 **OpenZeppelin** - Audited contract libraries

**Blockchain**
- 🌌 **U2U Network Nebulas Testnet** (ChainID: 2484)
- 🚀 RPC: `https://rpc-nebulas-testnet.u2u.xyz`
- 🔍 Explorer: `https://testnet.u2uscan.xyz`

### Contract Architecture

```
PandaFiContract (ERC721)
├── Profile Management
│   ├── createProfile() - Mint NFT profile
│   ├── getProfile() - Fetch user data
│   └── getTopPlayers() - Leaderboard query
│
├── Content System
│   ├── createPost() - Publish content
│   ├── likePost() - Engage with posts
│   ├── addComment() - Add comments
│   ├── tipPost() - Send tips (ERC20)
│   ├── sellPost() - List for sale
│   └── buyPost() - Purchase content
│
└── Talent Marketplace
    ├── hirePlayer() - Create hire contract
    ├── completeHire() - Finalize hire
    └── getHire() - Query hire details
```

**Contract Address**: `0x3c3bcf8ac2ff69e4d0a1eeb98c1a2c7ba39a27a2`

---

## 🎨 User Interface

### Cyberpunk Aesthetic
- Dark mode with neon accents
- Circuit board background animations
- Glowing text effects
- Futuristic typography (Orbitron font)
- Smooth transitions and micro-interactions

### Pages
1. **Feed** - Neural network-style content stream
2. **Profile** - Personal dashboard with posts and stats
3. **Leaderboard** - Top players ranking
4. **Messages** - P2P encrypted chat
5. **Hires** - Active and completed talent contracts
6. **Trending** - Viral content discovery

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pandafi-dapp.git
cd pandafi-dapp

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

1. **Add U2U Network to MetaMask**

   **U2U Mainnet** (Production):
   - Network Name: `U2U Solaris Mainnet`
   - RPC URL: `https://rpc-mainnet.uniultra.xyz`
   - Chain ID: `39`
   - Currency Symbol: `U2U`
   - Block Explorer: `https://u2uscan.xyz`

   **U2U Testnet** (Development):
   - Network Name: `U2U Network Nebulas`
   - RPC URL: `https://rpc-nebulas-testnet.u2u.xyz`
   - Chain ID: `2484`
   - Currency Symbol: `U2U`
   - Block Explorer: `https://testnet.u2uscan.xyz`

2. **Get Testnet Tokens**
   - Visit U2U Testnet Faucet (if available)
   - Request test U2U tokens

3. **Connect Wallet**
   - Click "Connect Wallet" button
   - Select MetaMask or your preferred wallet
   - Approve connection

4. **Create Your Profile**
   - Navigate to Profile page
   - Click "Edit Profile"
   - Enter name and bio
   - Submit transaction to mint NFT

---

## 📖 Usage Guide

### 1. Creating Content
```
Dashboard → Type post content → Click "POST"
→ Confirm transaction → Post appears on feed
```

### 2. Monetizing Content
```
Profile → Select post → Set price → Click "List for Sale"
→ Post becomes tradeable NFT
```

### 3. Tipping Creators
```
Feed → View post → Enter tip amount → Click "Send"
→ Approve U2U token → Confirm tip transaction
```

### 4. Hiring Talent
```
Leaderboard → Select player → Click "Hire"
→ Enter duration & rate → Confirm hire
→ Auto-approve U2U token → Submit hire contract
```

### 5. P2P Messaging
```
Messages → Select conversation → Type message
→ Real-time delivery to recipient's wallet
```

---

## 🔐 Smart Contract Functions

### Core Functions

```solidity
// Profile Management
function createProfile(string _name, string _avatarCID, string _bioCID)
function getProfile(uint256 _profileId) returns (Profile)
function getTopPlayers(uint256 _count) returns (Profile[])

// Content Interaction
function createPost(uint256 _profileId, string _contentCID)
function likePost(uint256 _postId)
function addComment(uint256 _postId, string _contentCID)
function tipPost(uint256 _postId, uint256 _amount)

// Marketplace
function sellPost(uint256 _postId, uint256 _price)
function buyPost(uint256 _postId)

// Talent Marketplace
function hirePlayer(uint256 _profileId, uint256 _duration, uint256 _ratePerHour)
function completeHire(uint256 _hireId)
function getHire(uint256 _hireId) returns (Hire)
```

### Events

```solidity
event ProfileCreated(uint256 profileId, address owner)
event PostCreated(uint256 postId, uint256 profileId)
event PostLiked(uint256 postId, address liker)
event PostTipped(uint256 postId, address tipper, uint256 amount)
event HireCreated(uint256 hireId, uint256 profileId, address hirer)
```

---

## 📸 Screenshots

### Dashboard - Neural Feed
```
┌─────────────────────────────────────────────────────────┐
│  🌐 PandaFi         FEED  LEADERBOARD  MESSAGES  👤    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📝 Share your thoughts with the network...      │  │
│  │ [Media] [POST]                                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 👤 hulk • 2h ago                                 │  │
│  │ Check out this amazing new feature! 🚀           │  │
│  │                                                   │  │
│  │ ❤️ 42  💬 12  💰 Tip  🛒 Buy                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [TOP PLAYERS]  [NETWORK STATS]                        │
└─────────────────────────────────────────────────────────┘
```

### Leaderboard - Talent Discovery
```
┌─────────────────────────────────────────────────────────┐
│  🏆 GLOBAL LEADERBOARD                                  │
├─────────────────────────────────────────────────────────┤
│  RANK  PLAYER      TOKENS  EARNED  HIRES  ACTION       │
│  ───────────────────────────────────────────────────── │
│  #1 🏆 hulk        5,000   25,000   50    [Hire]       │
│  #2 🥈 CyberNinja  4,200   18,500   32    [Hire]       │
│  #3 🥉 NeonSamurai 3,800   15,000   28    [Hire]       │
└─────────────────────────────────────────────────────────┘
```

### Messages - P2P Chat
```
┌─────────────────────────────────────────────────────────┐
│  💬 SECURE MESSAGES              ● Connected            │
├────────────┬────────────────────────────────────────────┤
│ Contacts   │  Chat with hulk                            │
├────────────┤                                             │
│ 👤 hulk    │  hulk: Hey, interested in collaboration?   │
│ 👤 khoa    │  You: Sure! Let's discuss details          │
│ 👤 nam     │  hulk: Great! When are you available?      │
│            │                                             │
│            │  [Type message...]              [Send 📤]  │
└────────────┴────────────────────────────────────────────┘
```

---

## 💎 Tokenomics & Rewards

### Social Token Distribution
- **🎁 Profile Creation**: 100 PANDA tokens (one-time)
- **📝 Post Creation**: 10 PANDA tokens per post
- **❤️ Receiving Likes**: 1 PANDA token per like
- **💬 Engaging**: 2 PANDA tokens per comment
- **💰 Tips Received**: +5% bonus PANDA tokens
- **🏆 Leaderboard Top 10**: Weekly bonus pool distribution

### Utility
- **💎 Profile Boosting**: Stake PANDA to increase visibility
- **🎨 Premium Features**: Custom themes, badges, emojis
- **🗳️ Governance**: Vote on platform changes (future DAO)
- **💵 Monetization**: Convert to U2U or use in marketplace

### Token Economy Flow
```
User Actions → Earn PANDA Tokens
      ↓
Stake/Spend PANDA → Premium Features
      ↓
Platform Growth → Token Value ↑
      ↓
More Users → More Activity → More Rewards
```

---

## 🎯 Hackathon Highlights

### Innovation
- ✨ First SocialFi platform on U2U Network
- 🔐 True P2P messaging with wallet-to-wallet encryption
- 💎 NFT-based identity with on-chain reputation
- 🤖 Decentralized talent marketplace

### Technical Excellence
- 📱 Responsive, production-ready UI
- ⚡ Optimized gas usage with batched transactions
- 🔄 Real-time updates with custom event system
- 🛡️ Secure smart contracts with OpenZeppelin

### User Experience
- 🎨 Beautiful cyberpunk design
- 🚀 Smooth wallet integration
- 💬 Intuitive messaging interface
- 📊 Clear data visualization

### Impact
- 🌍 Empowers content creators globally
- 💰 Direct monetization without intermediaries
- 🤝 Transparent talent marketplace
- 🔓 Data ownership and privacy

---

## 🛠️ Development

### Project Structure

```
pandafi-dapp/
├── app/                    # Next.js 13 App Router
│   ├── dashboard/          # Main feed
│   ├── profile/            # User profile
│   ├── leaderboard/        # Top players
│   ├── messages/           # P2P chat
│   ├── hires/              # Talent marketplace
│   └── trending/           # Trending posts
├── components/
│   ├── layout/             # Header, Sidebar
│   ├── posts/              # Post card, Create post
│   ├── profile/            # Profile card
│   └── ui/                 # shadcn components
├── lib/
│   ├── contract.ts         # ABI & address
│   ├── wagmi.ts            # Wagmi config
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utilities
└── public/                 # Static assets
```

### Building for Production

```bash
# Build optimized static export
pnpm build

# Output directory: ./dist
# Deploy to any static hosting (Vercel, Netlify, IPFS)
```

### Environment Variables

```env
NEXT_PUBLIC_PUBNUB_PUBLISH_KEY=your_publish_key
NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY=your_subscribe_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Wallet connection (MetaMask, WalletConnect)
- [ ] Profile creation and NFT minting
- [ ] Post creation with gas estimation
- [ ] Like, comment, tip interactions
- [ ] Post buying/selling with ERC20 approval
- [ ] Talent hiring with token approval
- [ ] Real-time messaging between 2 wallets
- [ ] Responsive design on mobile/tablet

### Test Accounts
- **Creator**: `0x5c11A1ca210530A37090f3335AE7D2EBbdaFFc44`
- **Buyer**: `0xFE0eD87d5A9c960469DEbf019f8BADe5d64f56CC`
- **Player**: `0xbb4f6F0DD356C4B49dd62E065b9d292A848513E3`

---

## 🏆 Development Progress

### ✅ Completed (Hackathon MVP)

**Core Infrastructure**
- [x] U2U Network Nebulas testnet integration
- [x] Wagmi v2 + RainbowKit wallet connection
- [x] Next.js 13 App Router with TypeScript
- [x] TailwindCSS + shadcn/ui component system

**Smart Contract Features**
- [x] ERC721 NFT profile system
- [x] Profile creation with on-chain metadata
- [x] Post creation and management
- [x] Like and comment functionality
- [x] ERC20 token tipping system
- [x] Post buying/selling marketplace
- [x] Talent hiring with escrow
- [x] Leaderboard query functions

**Frontend Features**
- [x] Profile creation and editing
- [x] Content posting with gas estimation
- [x] Real-time feed updates
- [x] Like, comment, tip interactions
- [x] Post listing and purchasing
- [x] Player hiring from leaderboard
- [x] Hire history tracking
- [x] Wallet-to-wallet P2P messaging (PubNub)
- [x] Responsive cyberpunk UI design
- [x] Toast notifications

**User Experience**
- [x] Multi-wallet support (MetaMask, WalletConnect, etc.)
- [x] ERC20 token approval flow
- [x] Transaction error handling
- [x] Loading states and optimistic updates
- [x] Local storage for message persistence

---

### 🚧 In Progress (Post-Hackathon)

**Q1 2026 - Enhanced Features**
- [ ] IPFS integration for content storage (currently using CIDs)
- [ ] Enhanced search and filtering
- [ ] Push notification system
- [ ] Profile analytics dashboard
- [ ] Advanced content moderation tools

**Q2 2026 - Scaling & Mobile**
- [ ] Mobile app (React Native)
- [ ] Performance optimization for large datasets
- [ ] GraphQL API for efficient queries
- [ ] Content recommendation algorithm
- [ ] Multi-language support

**Q3 2026 - DeFi Integration**
- [ ] DAO governance for platform decisions
- [ ] Token staking for premium features
- [ ] NFT marketplace integration
- [ ] Liquidity pools for social tokens
- [ ] Cross-chain bridge support (Ethereum, Polygon)

**Q4 2026 - Advanced Features**
- [ ] Video and audio content support
- [ ] Live streaming integration
- [ ] AI-powered content recommendations
- [ ] Decentralized advertising marketplace
- [ ] Creator grants and funding program

---

## 👥 Team

| Role | Member | Contributions |
|------|--------|---------------|
| 🚀 **Lead Developer** | [@yourusername](https://github.com/yourusername) | Full-stack development, Smart Contracts, Architecture |
| 🎨 **UI/UX Designer** | [@designer](https://github.com/designer) | Cyberpunk design system, Component library |
| ⛓️ **Blockchain Engineer** | [@blockchain](https://github.com/blockchain) | Contract optimization, Gas efficiency |
| 💬 **Community Manager** | [@community](https://github.com/community) | Documentation, Testing, User feedback |

> **Note**: Replace with your actual team member names and GitHub profiles

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **U2U Network** - For providing the testnet infrastructure
- **OpenZeppelin** - For secure smart contract libraries
- **RainbowKit** - For beautiful wallet connection UX
- **shadcn/ui** - For amazing UI components
- **PubNub** - For real-time messaging infrastructure

---

## 📞 Contact

- **Website**: [pandafi.io](#)
- **Twitter**: [@PandaFi](#)
- **Discord**: [Join our community](#)
- **Email**: team@pandafi.io

---

<div align="center">

**Built with ❤️ for the U2U Hackathon**

⭐ Star us on GitHub if you like this project!

</div>

