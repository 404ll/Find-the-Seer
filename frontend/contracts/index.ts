import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { getContractConfig } from "./config";
import { SuiGrpcClient } from "@mysten/sui/grpc";

type NetworkVariables = ReturnType<typeof useNetworkVariables>;

function getNetworkVariables(network: Network) {
    return networkConfig[network].variables;
}

type Network = "devnet" | "testnet" | "mainnet"

const network = (process.env.NEXT_PUBLIC_NETWORK as Network) || "testnet";

const { networkConfig, useNetworkVariables } = createNetworkConfig({
    devnet: {
        url: getFullnodeUrl("devnet"),
        variables: getContractConfig("devnet"),
    },
    testnet: {
        url: getFullnodeUrl("testnet"),
        variables: getContractConfig("testnet"),
    },
    mainnet: {
        url: getFullnodeUrl("mainnet"),
        variables: getContractConfig("mainnet"),
    }
});

// 创建全局 SuiClient 实例
const suiClient = new SuiClient({ url: networkConfig[network].url });
const suiGrpcClient = new SuiGrpcClient({
    network: 'testnet',
    baseUrl: 'https://fullnode.testnet.sui.io:443',
  });
export { getNetworkVariables, networkConfig, network, suiClient,useNetworkVariables, suiGrpcClient };
export type { NetworkVariables };

