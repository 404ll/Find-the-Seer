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
        Package: '0xd8251b3c097c52f27a3414cc98ffc82990bf07d8b75b6f62cdb56d352aeb0293',
        Seer: '0xb78e7c6cb1c247864a2592999d8c2903259cb40f9818bf6125ea108141598dd9',
        Config: '0x60f3dbfdf36022fbf4c2a2c5b4bc2a6baed754c764e651db083b1243f9475111',
        AdminCap: '0x2fb286df9e884a4ec1afe58379c7736ae69a2354bcfe89c12b72627bff3a44a2',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}