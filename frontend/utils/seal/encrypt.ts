import { SealClient, KeyServerConfig, DemType, EncryptedObject } from '@mysten/seal';
import { suiClient } from '@/contracts/index';
import { fromHex } from '@mysten/sui/utils';

//后来由合约对象中取得
function getTestnetKeyServers(): KeyServerConfig[] {
    return [
      {
        objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
        weight: 1,
      },
      {
        objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
        weight: 1,
      },
      {
        objectId: '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2',
        weight: 1,
      },
    ];
  }

  
  const serverConfigs = getTestnetKeyServers();

  export const sealClient = new SealClient({
    suiClient,
    serverConfigs,
    verifyKeyServers: false,
  });



/**
 * 为投票加密数据
 * @param voteChoice - true=赞成, false=反对
 * @param userAddress - 投票者地址
 * @param packageId - seer 包地址
 * @param postId - 帖子 ID
 * @param threshold - 解密阈值
 * @returns 加密后的投票数据（可直接提交到合约）
 */
export async function encryptVote(
  voteChoice: boolean,
  userAddress: string,
  packageId: string,
  postId: string,
  threshold: number = 2
): Promise<Uint8Array> {
  const message = new Uint8Array([voteChoice ? 0x01 : 0x00]);

  const aad = fromHex(userAddress);
  
  const { encryptedObject: encryptedObjectBytes } = await sealClient.encrypt({
    demType: DemType.Hmac256Ctr,
    // kemType: KemType.x25519,
    threshold: threshold,
    packageId: packageId,
    id: postId, 
    data: message,
    aad: aad, 
  });
  
  const encryptedObject = EncryptedObject.parse(encryptedObjectBytes);
  console.log("encryptedObject", encryptedObject);
  return encryptedObjectBytes;
}

export const fetchPublicKeys = async (keyServers: string[]): Promise<number[][]> => {
  const g2Elements = await sealClient.getPublicKeys(keyServers);
  const publicKeysArray: number[][] = g2Elements.map((g2Element) => {
    const bytes = g2Element.toBytes();
    return Array.from(bytes);
  });

  console.log("Public keys:", publicKeysArray);
  return publicKeysArray;
};

