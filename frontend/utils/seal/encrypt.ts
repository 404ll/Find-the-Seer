import { SealClient, KeyServerConfig } from '@mysten/seal';
import { networkConfig } from "@/contracts/index";
import { suiClient } from '@/contracts/index';

//从合约对象中取得
function getTestnetKeyServers(): KeyServerConfig[] {
    return [
      {
        objectId: '0x34401905bebdf8c04f3cd5f04f442a39372c8dc321c29edfb4f9cb30b23ab96',
        weight: 1,
      },
      {
        objectId: '0xd726ecf6f7036ee3557cd6c7b93a49b231070e8eecada9cfa157e40e3f02e5d3',
        weight: 1,
      },
      {
        objectId: '0xdba72804cc9504a82bbaa13ed4a83a0e2c6219d7e45125cf57fd10cbab957a97',
        weight: 1,
      },
    ];
  }

  const serverConfigs = getTestnetKeyServers();

  const sealClient = new SealClient({
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
  
  const aad = addressToBytes32(userAddress);
  
  // 3. 加密
  const { encryptedObject } = await sealClient.encrypt({
    threshold: threshold,
    packageId: packageId,
    id: postId,
    data: message,
    aad: aad,
  });
  
  return encryptedObject;
}

/**
 * 批量为多个投票者加密（用于测试）
 */
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

/**
 * 生成随机 nonce（如果需要）
 */
export function generateNonce(length: number = 5): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}