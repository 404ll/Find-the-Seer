interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: '0xeb4960b0ba6ce087a7d3442bccc024f3f04c7aeefbed5c2dbf8fc722a9f61bbb',
        Seer: '0x1a1f36752fd4fea650c45bbefa029ce3d88c221aa815134b97279b8f48473ddb',
        Config: '0xe457a62ec899884139f18e1fd291d7cd8870be2256e8dba3a8820c592fec9ee5',
        AdminCap: '0xb0a2cdf41bcb0c6a2dff6103ab336dc18e76a1c13a3d273e9f0a254032ece583',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}