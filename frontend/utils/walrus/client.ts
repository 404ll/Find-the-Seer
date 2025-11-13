import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { walrus } from '@mysten/walrus';
import { getFullnodeUrl } from '@mysten/sui/client';

export function createWalrusClient() {
  const client = new SuiJsonRpcClient({
    url: getFullnodeUrl('testnet'),
    // Setting network on your client is required for walrus to work correctly
    network: 'testnet',
  }).$extend(
    walrus(),
  );

  
  return client;
}
