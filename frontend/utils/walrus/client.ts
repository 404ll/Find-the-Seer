import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { walrus } from '@mysten/walrus';

export function createWalrusClient() {
  const suiClient = new SuiClient({
    url: getFullnodeUrl('testnet'),
  });

  return suiClient.$extend(
    walrus({
      uploadRelay: {
        host: 'https://publisher.walrus-testnet.walrus.space',
        sendTip: {
          max: 10_000,
        },
      },
      storageNodeClientOptions: {
        timeout: 60_000,
        onError: (error: any) => {
          console.error('Walrus storage node error:', error);
        },
      },
    })
  );
}

export const WALRUS_AGGREGATORS = [
  'https://aggregator.walrus-testnet.walrus.space',
  'https://wal-aggregator-testnet.staketab.org',
  'https://walrus-testnet-aggregator.bartestnet.com',
  'https://walrus-testnet.blockscope.net',
];

export function getRandomAggregator(): string {
  return WALRUS_AGGREGATORS[Math.floor(Math.random() * WALRUS_AGGREGATORS.length)];
}