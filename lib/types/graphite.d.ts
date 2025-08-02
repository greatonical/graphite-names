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

export {}