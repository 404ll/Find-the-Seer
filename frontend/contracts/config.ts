interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'devnet' | 'testnet' | 'mainnet';

const configs = {
    devnet: {
        Package: process.env.DEVNET_PACKAGE_ID!,
    },
    testnet: {
        Package: '0x260c54d5968888aa1220d9fae4c56155d11ae10ec4b8b1f4d4b86036359e5116',
        Seer: '0xdf10a4c967dad0cd7802ec0622a48dc6f88388f0ac66305b40a067bc7d04f034',
        Config: '0x28f94fae16bc7b886ec65cdb9bc21b13775446fa61a55d85b7b9090b364260ad',
        AdminCap: '0x01b9b11256513b85d81fa38b072de60d15f259341753f1ee2607e9edc265c682',
    },
    mainnet: {
        Package: process.env.MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}