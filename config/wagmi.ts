import { http, createConfig } from 'wagmi';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { graphiteWallet } from '@/lib/wallets/graphite.wallet';

// Define Graphite mainnet chain
const graphiteMainnet = {
  id: 440017,
  name: 'Graphite Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Graphite',
    symbol: '@G',
  },
  rpcUrls: {
    default: { http: ['https://anon-entrypoint-1.atgraphite.com'] },
    public: { http: ['https://anon-entrypoint-1.atgraphite.com'] },
  },
  blockExplorers: {
    default: { name: 'GraphiteScan', url: 'https://main.atgraphite.com' },
  },
} as const;

// Define Graphite testnet chain
const graphiteTestnet = {
  id: 54170,
  name: 'Graphite Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Graphite',
    symbol: '@G',
  },
  rpcUrls: {
    default: { http: ['https://anon-entrypoint-test-1.atgraphite.com'] },
    public: { http: ['https://anon-entrypoint-test-1.atgraphite.com'] },
  },
  blockExplorers: {
    default: { name: 'GraphiteScan Testnet', url: 'https://test.atgraphite.com' },
  },
  testnet: true,
} as const;

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [graphiteWallet],
    },
  ],
  {
    appName: 'Graphite Names',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
  }
);

export const config = createConfig({
  connectors,
  chains: [graphiteMainnet, graphiteTestnet],
  transports: {
    [graphiteMainnet.id]: http(),
    [graphiteTestnet.id]: http(),
  },
});

export { graphiteMainnet, graphiteTestnet };