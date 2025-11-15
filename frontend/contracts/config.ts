interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: '0x5807995b1eb87b0806b0598d01155e1deb92c341860b996d9973893327e5b538',
        Seer: '0x4412883865bc7b7632ca17690135eed5f3d7e564de9c96855c1adac545ff37c5',
        Config: '0x5576a0fe2198c27812f166a2680a9cee6f1a701952dad3cdf99cc443d7d9b2b8',
        AdminCap: '0xb2a34460dd4af7b4e2b48ec7bae952475cc6c35234d623bbfffe86525e78c5e4',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}