import { SessionKey, SealClient } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

/**
 * 使用 SealClient 获取派生密钥（用于合约解密）
 */
export async function fetchDerivedKeysForContract(
  postId: string,
  packageId: string,
  userAddress: string,
  suiClient: SuiClient,
  sealClient: SealClient,
  signPersonalMessage: (args: { message: Uint8Array }) => Promise<{ signature: string }>
): Promise<{
  derivedKeys: Uint8Array[];        
  keyServerAddresses: string[];   
}> {
  // 1. 使用 create 方法创建 SessionKey（异步）
  const sessionKey = await SessionKey.create({
    address: userAddress,
    packageId: packageId,
    ttlMin: 10,
    suiClient: suiClient,
  });

  // 2. 获取需要签名的消息
  const message = sessionKey.getPersonalMessage();
  
  // 3. 签名消息
  const { signature } = await signPersonalMessage({ message });
  
  // 4. 设置签名到 SessionKey
  await sessionKey.setPersonalMessageSignature(signature);

  // 5. 构造访问控制交易
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::seer::seal_approve`,
    arguments: [
      tx.pure.vector("u8", Array.from(Buffer.from(postId.replace('0x', ''), 'hex'))),
      tx.object(postId),
    ],
  });

  const txBytes = await tx.build({ 
    client: suiClient, 
    onlyTransactionKind: true 
  });

  const derivedKeys = await sealClient.getDerivedKeys({ 
    id: postId, 
    txBytes, 
    sessionKey, 
    threshold: 2 
  });

  const derivedKeysArray: Uint8Array[] = Array.from(derivedKeys.values()).map(
    (k: any) =>
      k instanceof Uint8Array ? k : (k.key instanceof Uint8Array ? k.key : new Uint8Array(k))
  );
  return {
    derivedKeys: derivedKeysArray,
    keyServerAddresses: Array.from(derivedKeys.keys())
  };
}