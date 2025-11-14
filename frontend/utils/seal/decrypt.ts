import { SessionKey, SealClient } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import { networkConfig } from '@/contracts';
import { SecureVersion } from 'tls';


export async function fetchDerivedKeysForContract(
  postId: string,
  suiClient: SuiClient,
  sealClient: SealClient,
  sessionKey: SessionKey,
): Promise<{
  derivedKeys: number[][];        
  keyServerAddresses: string[];   
}> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${networkConfig.testnet.variables.Package}::seer::seal_approve`,
    arguments: [
      tx.pure.vector("u8", fromHex(postId)),
      tx.object(postId),
      tx.object.clock(),
    ],
  });

  const txBytes = await tx.build({ 
    client: suiClient, 
    onlyTransactionKind: true 
  });

  console.log("txBytes", txBytes);

  const derivedKeys = await sealClient.getDerivedKeys({ 
    id: postId, 
    txBytes, 
    sessionKey, 
    threshold: 2 
  });

  console.log("derivedKeys", derivedKeys);

  const keyServerAddresses = Array.from(derivedKeys.keys());
  let count = 0;

  const derivedKeysArray: Uint8Array[] = Array.from(derivedKeys.values()).map(
    (derivedKey: any) => {
      if (derivedKey && derivedKey.key && typeof derivedKey.key.toBytes === 'function') {
        return derivedKey.key.toBytes();
      }
      count++;
      if (derivedKey instanceof Uint8Array) {
        return derivedKey;
      }
      console.warn("无法解析 DerivedKey:", derivedKey);
      return new Uint8Array(0);
    }
  );
  // 因为seal_approve的参数是id，所以需要将id的顺序反转，后来改
  console.log("derivedKeysArray--------------------------------------------------------", derivedKeysArray);
  const derivedKeysA: number[][] = derivedKeysArray.map((key: Uint8Array) => Array.from(key));
  const derivedKeysB: number[][] = [derivedKeysA[1], derivedKeysA[0]];
  return {
    derivedKeys: derivedKeysB,
    keyServerAddresses: keyServerAddresses
  };
}