import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Chain } from 'wagmi/chains';

// U2U Mainnet
const u2uMainnet: Chain = {
  id: 39,
  name: 'U2U Solaris Mainnet',
  nativeCurrency: { name: 'U2U', symbol: 'U2U', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.uniultra.xyz'],
    },
    public: {
      http: ['https://rpc-mainnet.uniultra.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2U Explorer',
      url: 'https://u2uscan.xyz',
    },
  },
  testnet: false,
};

// U2U Testnet
const u2uNebulasTestnet: Chain = {
  id: 2484,
  name: 'U2U Network Nebulas',
  nativeCurrency: { name: 'U2U', symbol: 'U2U', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc-nebulas-testnet.u2u.xyz'],
      webSocket: ['wss://ws-nebulas-testnet.u2u.xyz'],
    },
    public: {
      http: ['https://rpc-nebulas-testnet.u2u.xyz'],
      webSocket: ['wss://ws-nebulas-testnet.u2u.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2U Testnet Explorer',
      url: 'https://testnet.u2uscan.xyz',
    },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'SocialFi dApp',
  projectId: 'YOUR_PROJECT_ID',
  chains: [u2uMainnet, u2uNebulasTestnet],
  ssr: false,
});
