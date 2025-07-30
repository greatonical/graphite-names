// graphiteWallet.ts
import { Wallet } from "@rainbow-me/rainbowkit";
import { createConnector } from "wagmi";
import type { Chain } from "viem";

declare global {
  interface Window {
    graphite?: {
      enable(): Promise<string>;
      isEnabled(): Promise<boolean>;
      request(args: { method: string; params?: any[] }): Promise<any>;
      getBalance(): Promise<number>;
      getAddress(): Promise<string>;
      getAccountInfo(): Promise<object>;
      sendTx(params: any): Promise<string>;
      activateAccount(): Promise<string>;
      updateKycLevel(level: number): Promise<string>;
      updateKycFilter(filter: number): Promise<string>;
      getLastKycRequest(): Promise<object>;
      getActiveNetwork(): Promise<"mainnet" | "testnet">;
      changeActiveNetwork(
        network: "mainnet" | "testnet"
      ): Promise<"mainnet" | "testnet">;
    };
  }
}

// Custom connector for Graphite Wallet
function graphiteWalletConnector() {
  return createConnector((config) => ({
    id: "graphite",
    name: "Graphite Wallet",
    type: "injected" as const,

    async setup() {
      // Setup logic if needed
    },

    async getProvider() {
      if (typeof window === "undefined") {
        throw new Error("Window is not available");
      }

      if (!window.graphite) {
        throw new Error("Graphite Wallet not installed");
      }

      return window.graphite;
    },

    async connect({ chainId } = {}) {
      try {
        if (!window.graphite) {
          throw new Error("Graphite Wallet not installed");
          alert("Graphite is not installed")
        }

        const address = await window.graphite.enable();
        const defaultChainId = chainId || 440017;

        return {
          accounts: [address as `0x${string}`],
          chainId: Number(defaultChainId), // Ensure it's a number
        };
      } catch (error) {
        throw error;
      }
    },

    async disconnect() {
      // Graphite doesn't seem to have a disconnect method
      // Handle disconnection logic here if needed
    },

    async getAccounts() {
      if (!window.graphite) {
        return [];
      }

      try {
        const isEnabled = await window.graphite.isEnabled();
        if (!isEnabled) {
          return [];
        }

        const address = await window.graphite.getAddress();
        return [address as `0x${string}`];
      } catch {
        return [];
      }
    },

    async getChainId() {
      if (!window.graphite) {
        throw new Error("Graphite Wallet not installed");
      }

      const network = await window.graphite.getActiveNetwork();
      // Return number, not string
      return network === "mainnet" ? 440017 : 54170;
    },

    async isAuthorized() {
      if (!window.graphite) {
        return false;
      }

      try {
        return await window.graphite.isEnabled();
      } catch {
        return false;
      }
    },

    async switchChain({ chainId }) {
      if (!window.graphite) {
        throw new Error("Graphite Wallet not installed");
      }

      // Define the chain objects
      const graphiteMainnet = {
        id: 440017,
        name: "Graphite Mainnet",
        nativeCurrency: {
          decimals: 18,
          name: "Graphite",
          symbol: "@G",
        },
        rpcUrls: {
          default: { http: ["https://anon-entrypoint-1.atgraphite.com"] },
          public: { http: ["https://anon-entrypoint-1.atgraphite.com"] },
        },
        blockExplorers: {
          default: { name: "GraphiteScan", url: "https://main.atgraphite.com" },
        },
      };

      const graphiteTestnet = {
        id: 54170,
        name: "Graphite Testnet",
        nativeCurrency: {
          decimals: 18,
          name: "Graphite",
          symbol: "@G",
        },
        rpcUrls: {
          default: { http: ["https://anon-entrypoint-test-1.atgraphite.com"] },
          public: { http: ["https://anon-entrypoint-test-1.atgraphite.com"] },
        },
        blockExplorers: {
          default: {
            name: "GraphiteScan Testnet",
            url: "https://test.atgraphite.com",
          },
        },
        testnet: true,
      };

      // Map chain ID to Graphite network and return appropriate chain
      let network: "mainnet" | "testnet";
      let chain;

      if (chainId === 440017) {
        network = "mainnet";
        chain = graphiteMainnet;
      } else if (chainId === 54170) {
        network = "testnet";
        chain = graphiteTestnet;
      } else {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      await window.graphite.changeActiveNetwork(network);

      return chain;
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit("disconnect");
      } else {
        config.emitter.emit("change", {
          accounts: accounts as `0x${string}`[],
        });
      }
    },

    onChainChanged(chainId) {
      const id = Number(chainId);
      config.emitter.emit("change", { chainId: id });
    },

    async onConnect(connectInfo) {
      const chainId =
        typeof connectInfo.chainId === "string"
          ? parseInt(connectInfo.chainId, 16)
          : connectInfo.chainId;

      // Get accounts when connecting
      const accounts = await this.getAccounts();

      config.emitter.emit("connect", {
        accounts: accounts as readonly `0x${string}`[],
        chainId,
      });
    },

    onDisconnect(error) {
      config.emitter.emit("disconnect");
    },

    onMessage(message) {
      // Handle messages if needed
    },
  }));
}

// Define the Graphite Wallet for RainbowKit
export const graphiteWallet = (): Wallet => ({
  id: "graphite",
  name: "Graphite Wallet",
  iconUrl: "/images/graphite-icon.png", // Add your Graphite wallet icon
  iconBackground: "#1a1a1a", // Adjust to match Graphite branding
  installed: true,

  downloadUrls: {
    chrome: "https://chromewebstore.google.com/detail/fbgdgmhhhlimaanngeakidegojjbbbbm?utm_source=item-share-cb", // Update with actual URL
    browserExtension: "https://chromewebstore.google.com/detail/fbgdgmhhhlimaanngeakidegojjbbbbm?utm_source=item-share-cb", // Update with actual URL
  },

  createConnector: (walletDetails) => graphiteWalletConnector(),

  extension: {
    instructions: {
      learnMoreUrl: "https://docs.atgraphite.com/ecosystem/graphite-wallet",
      steps: [
        {
          description:
            "We recommend putting Graphite Wallet on your home screen for faster access to your wallet.",
          step: "install",
          title: "Install the Graphite Wallet extension",
        },
        {
          description:
            "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          step: "create",
          title: "Create or Import a Wallet",
        },
        {
          description:
            "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          step: "refresh",
          title: "Refresh your browser",
        },
      ],
    },
  },
});
