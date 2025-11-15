interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: '0x323cb3835afa758577865aef42625bd98adebb65d7ed178257bf9ee094ef1f11',
        Seer: '0xa6bbcae9f7eb44555d521f01c64eaabe151a256701a7e75434f876a13db0f771',
        Config: '0x54285a88dd8bdfc790d26cf7b6e9927d8013c066528c93e91dfcb0673316d062',
        AdminCap: '0xed3ec2dd84efe44860274b0fdad7387ef6ce4a796ae5cd44c878aa94e101a69d',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}