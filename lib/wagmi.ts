import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Chain } from 'wagmi/chains';

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
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'SocialFi dApp',
  projectId: 'YOUR_PROJECT_ID',
  chains: [u2uNebulasTestnet],
  ssr: false,
});
