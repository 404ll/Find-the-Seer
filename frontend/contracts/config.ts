interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: '0xd6e0bd682fa91af3d3ab0cf80c9080c580e25d8ef804a2e9f0745ef01cb54265',
        Seer: '0xf2b81b93a168b2f09f96fad4ffa97653dc2327cada1064e7ae3f3db513202868',
        Config: '0xe97db02457ea1ccdf46f0257c1a099033384d94195e76838bdd5c97763816e2d',
        AdminCap: '0x8492052c364541361012ed7e4158a85e6be560c7641a1052bfca3344ee920dfa',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}