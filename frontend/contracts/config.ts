interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: '0xe43dc8c380f79c085a0ec6638b01ac5288c54ae1b219a07766dcf7f45ed6aabd',
        Seer: '0xa69139805d2e51961f5ef5d91a30d62406a7f0e7a9441175ffb3c8913e85767b',
        Config: '0x291e08820fe4566ec49ea02722a0b62277c31a4b541a8d5c61d2241dd0b897aa',
        AdminCap: '0xf8a7961d355708d8948abb14e4b1eead2051e3cf23409918215a079a9dc6bbec',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}