interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: '0x4f718869f5749d37206db46a83463e901a9a07e456797c17068c5c3547cd4357',
        Seer: '0xd58e21ff77fe4cc477fde08bdc32981c98c406402679071c7aad2a263ab119a9',
        Config: '0x74b6d7ca4a5691c676231781225e9b0f9b6302b4e2b2d72682b19518a0c1bdf1',
        AdminCap: '0xf617cd683d2c41c61a2dd207436bf1bfe2c4af6aceb7ace7741740d26f1f372e',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}