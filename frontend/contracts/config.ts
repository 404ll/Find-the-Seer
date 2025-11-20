interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        // Package: '0xe43dc8c380f79c085a0ec6638b01ac5288c54ae1b219a07766dcf7f45ed6aabd',
        Package: '0x4997fed4d0d65358dbac7f1491156f976794c0227b35b02c9ce1554705cd9e4d',
        Seer: '0x43f1488db4b1d24ab7b38bb28d12e4444c191af4c128184f1594f3666503b96e  ',
        Config: '0x25c27302e8711eda6137c33ed2961cdda9fcb0a449bf6f03cb9df8cfdaa94e5a',
        AdminCap: '0xba83d04d1aa95e73bc2d6333ce9c56f90e697c843931127d5b295f8c6fc0acf4',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}