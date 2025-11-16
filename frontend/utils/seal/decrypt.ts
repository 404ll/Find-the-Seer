import { SessionKey, SealClient } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import { networkConfig } from '@/contracts';


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

  const derivedKeysArray: number[][] = keyServerAddresses.map((keyServerAddress) => {
    const derivedKey = derivedKeys.get(keyServerAddress);
    if (!derivedKey) {
      throw new Error(`could not find derived key for key server ${keyServerAddress}`);
    }
    const derivedKeyString = derivedKey.toString();
    const derivedKeyBytes = fromHex(derivedKeyString);
    return Array.from(derivedKeyBytes);

  });
  return {
    derivedKeys: derivedKeysArray,
    keyServerAddresses: keyServerAddresses
  };
}