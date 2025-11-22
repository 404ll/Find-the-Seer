import { WalrusFile } from '@mysten/walrus';
import { createWalrusClient } from './client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export interface UploadPostOptions {
  file: WalrusFile;
  epochs: number;
}

// Walrus 上传返回结果的完整类型定义
export interface WalrusBlobStorage {
  end_epoch: number;
  id: {
    id: string;
  };
  start_epoch: number;
  storage_size: string;
}

export interface WalrusBlobObject {
  blob_id: string;
  certified_epoch: number | null;
  deletable: boolean;
  encoding_type: number;
  id: {
    id: string;
  };
  registered_epoch: number;
  size: string;
  storage: WalrusBlobStorage;
}

export interface UploadPostResult {
  blobId: string;
  blobObject: WalrusBlobObject;
  id: string;
}

// 创建用于代付的 keypair（从环境变量读取私钥）
function getSponsorKeypair(): Ed25519Keypair {
  const privateKey = process.env.NEXT_PUBLIC_WALRUS_SPONSOR_KEY;
  
  // 调试信息（仅在开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('[Walrus] 环境变量检查:', {
      exists: !!privateKey,
      length: privateKey?.length || 0,
      firstChars: privateKey?.substring(0, 10) || 'N/A'
    });
  }
  
  if (!privateKey) {
    throw new Error(
      'NEXT_PUBLIC_WALRUS_SPONSOR_KEY 环境变量未设置。\n' +
      '请在 .env.local 文件中添加：NEXT_PUBLIC_WALRUS_SPONSOR_KEY=你的私钥\n' +
      '注意：需要重启开发服务器才能读取新的环境变量'
    );
  }

  const cleanKey = privateKey.trim();
  
  if (cleanKey.length === 0) {
    throw new Error(
      'NEXT_PUBLIC_WALRUS_SPONSOR_KEY 环境变量为空。\n' +
      '请检查 .env.local 文件中的值是否正确'
    );
  }

  // 尝试多种格式
  // 方法1: 直接使用（fromSecretKey 可能支持字符串）
  try {
    return Ed25519Keypair.fromSecretKey(cleanKey as any);
  } catch (e1) {
    // 方法2: 尝试作为 base64
    try {
      const keyBytes = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
      if (keyBytes.length === 32) {
        return Ed25519Keypair.fromSecretKey(keyBytes);
      }
    } catch (e2) {
      // 方法3: 尝试作为 hex
      try {
        if (cleanKey.length === 64) {
          const keyBytes = Uint8Array.from(Buffer.from(cleanKey, 'hex'));
          if (keyBytes.length === 32) {
            return Ed25519Keypair.fromSecretKey(keyBytes);
          }
        }
      } catch (e3) {
        // 所有方法都失败
        throw new Error(
          `无法解析私钥。请检查 NEXT_PUBLIC_WALRUS_SPONSOR_KEY 的格式。\n` +
          `当前值长度: ${cleanKey.length}\n` +
          `支持的格式：\n` +
          `1. 直接使用私钥字符串（如 contractBuilder.ts 中的方式）\n` +
          `2. Base64 编码的 32 字节私钥\n` +
          `3. Hex 编码的 32 字节私钥（64 字符）\n` +
          `错误详情: ${e1 instanceof Error ? e1.message : String(e1)}`
        );
      }
    }
  }

  // 理论上不会到达这里
  throw new Error('无法创建 keypair');
}

export async function uploadPostContent(
  options: UploadPostOptions,
  maxRetries: number = 2
): Promise<UploadPostResult> {
  const { file, epochs } = options;

  let lastError: Error | null = null;
  
  // 重试逻辑：在网络不稳定时提高成功率
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Walrus] 开始上传 (尝试 ${attempt}/${maxRetries})...`);
      
      const client = await createWalrusClient();
      const sponsorSigner = getSponsorKeypair();

      // 使用 Upload Relay 上传（只需上传一次，relay 会处理与存储节点的通信）
      const results = await client.walrus.writeFiles({
        files: [file],
        epochs,
        deletable: true,
        signer: sponsorSigner,
      });

      // writeFiles 返回数组，取第一个结果
      if (!results || results.length === 0) {
        throw new Error('上传失败：未返回结果');
      }

      const result = results[0];
      console.log(`[Walrus] ✅ 上传成功 (尝试 ${attempt}/${maxRetries}):`, {
        blobId: result.blobId,
        objectId: result.blobObject.id.id,
      });

      return result;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`[Walrus] ❌ 上传失败 (尝试 ${attempt}/${maxRetries}):`, error);
      
      // 如果还有重试机会，等待后重试
      if (attempt < maxRetries) {
        const delayMs = 1000 * attempt; // 递增延迟：1秒、2秒
        console.log(`[Walrus] ⏳ ${delayMs}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // 所有重试都失败
  throw new Error(
    `上传失败（已尝试 ${maxRetries} 次）: ${lastError?.message || '未知错误'}`
  );
}
