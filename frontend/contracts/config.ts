interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: '0x493f9427fb2463d0419697c1f92100ff5dc25c2482c1367b2f1d31b34163c96f',
        Seer: '0xa1dcecacc8257dac8f80e21bafdfbde6f396bd179e8c420a108e615d7f3e0ed8',
        Config: '0xf0c84b05ddbe2e3b24f74420693b1567955befe82f1fffaae31c7680d3fd65e5',
        AdminCap: '0xa66c034cb690909a0591986d24b68248463a41b3c4c844a87ce8c1785d0e8a48',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}