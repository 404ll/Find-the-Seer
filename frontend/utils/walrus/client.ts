import { SuiClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';

export async function createWalrusClient() {
  // 使用动态导入确保 walrus 只在客户端运行时加载
  const { walrus } = await import('@mysten/walrus');
  
  const client = new SuiClient({
    url: getFullnodeUrl('testnet'),
    network: 'testnet',
  }).$extend(
    walrus({
      uploadRelay: {
        host: 'https://upload-relay.testnet.walrus.space',
        timeout: 60000,
        sendTip: {
          max: 1000,
        },
      },
      storageNodeClientOptions: {
        timeout: 30000,
        onError: (error) => {
          console.warn('[Walrus Storage Node]', error.message);
        },
      },
    }),
  );
  
  return client;
}
