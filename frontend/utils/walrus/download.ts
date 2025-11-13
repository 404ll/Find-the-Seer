import { createWalrusClient } from './client';
import type { WalrusFile } from '@mysten/walrus';

export interface DownloadOptions {
  blobId: string;
  timeout?: number;
  maxRetries?: number;
}

interface DownloadBlobResult {
  file: WalrusFile;
  content: string;
  bytes: Uint8Array;
  identifier: string | null;
  tags: Record<string, string>;
}

async function downloadBlob(
  options: DownloadOptions
): Promise<WalrusFile> {
  console.log('[Walrus] 下载 blobId:', options.blobId);
  const client = createWalrusClient();
  const result = await client.walrus.getBlob({
    blobId: options.blobId,
  });

  // Get files by identifier
const files = await result.files();
if (files.length === 0) {
  throw new Error('下载失败：未找到文件');
}
// 取第一个文件
  const file = files[0];
  return file;
}

async function getFileContent(file: WalrusFile): Promise<string> {
  const content = await file.text();
  console.log('[Walrus] 文件内容:', content);
  return content;
}

export async function readUserPostContent(blobId: string) : Promise<string> {
  try {
    const file = await downloadBlob({ blobId });
    const content = await getFileContent(file);
    console.log('[Walrus] 文件内容:', content);
    return content;
  } catch (error) {
    console.error('[Walrus] 读取文件内容失败:', error);
    throw error;
  }
}