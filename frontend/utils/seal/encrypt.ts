import { SealClient, KeyServerConfig, DemType, EncryptedObject } from '@mysten/seal';
import { networkConfig } from "@/contracts/index";
import { suiClient } from '@/contracts/index';
import { toHex,fromHex } from '@mysten/sui/utils';

//从合约对象中取得
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
  // 1. 准备投票消息（1字节）
  const message = new Uint8Array([voteChoice ? 0x01 : 0x00]);

  const aad = fromHex(userAddress);
  
  const { encryptedObject } = await sealClient.encrypt({
    demType: DemType.Hmac256Ctr,
    // kemType: KemType.x25519,
    threshold: threshold,
    packageId: packageId,
    id: postId, 
    data: message,
    aad: aad, 
  });
  
  const encryptedObjectBytes = EncryptedObject.parse(encryptedObject);
  console.log("encryptedObjectBytes", encryptedObjectBytes);
  return encryptedObject;
}


export async function encryptMultipleVotes(
  votes: Array<{
    choice: boolean;
    address: string;
  }>,
  packageId: string,
  postId: string,
  threshold: number = 2
): Promise<Uint8Array[]> {
  const encryptedVotes: Uint8Array[] = [];
  
  for (const vote of votes) {
    const encrypted = await encryptVote(
      vote.choice,
      vote.address,
      packageId,
      postId,
      threshold
    );
    encryptedVotes.push(encrypted);
  }
  
  return encryptedVotes;
}

/**
 * 将地址转换为32字节
 */
export function addressToBytes32(address: string): Uint8Array {
  // 移除 0x 前缀
  let hex = address.replace('0x', '');
  
  hex = hex.padStart(64, '0');
  
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

