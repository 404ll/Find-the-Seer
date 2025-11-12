import { getRandomAggregator, WALRUS_AGGREGATORS } from './client';

export interface DownloadOptions {
  blobId: string;
  timeout?: number;
  maxRetries?: number;
}

export async function downloadBlob(
  options: DownloadOptions
): Promise<Uint8Array> {
  const { blobId, timeout = 10000, maxRetries = 3 } = options;

  let lastError: Error | null = null;

  for (const aggregator of WALRUS_AGGREGATORS) {
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        console.log(`[Walrus] 尝试从 ${aggregator} 下载 ${blobId} (第 ${retry + 1} 次)`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${aggregator}/v1/${blobId}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.arrayBuffer();
        console.log(`[Walrus] 下载成功: ${blob.byteLength} 字节`);

        return new Uint8Array(blob);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[Walrus] 下载失败 (${aggregator}):`, lastError.message);
      }
    }
  }

  throw new Error(
    `无法从 Walrus 下载 blob ${blobId}: ${lastError?.message || '所有聚合器都失败了'}`
  );
}

/**
 * 获取 Walrus blob 的可展示 URL
 * 返回可以直接用于 <img> 或 <video> 标签的 URL
 */
export async function getBlobUrl(blobId: string): Promise<string> {
    const data = await downloadBlob({ blobId });
    const mimeType = detectMimeType(data);
    const blob = new Blob([data as any], { type: mimeType });
    return URL.createObjectURL(blob);
  }
/**
 * 获取 Walrus blob 的聚合器直链
 * 注意：这个 URL 依赖聚合器的可用性
 */
export function getAggregatorUrl(blobId: string): string {
  const aggregator = getRandomAggregator();
  return `${aggregator}/v1/${blobId}`;
}

/**
 * 检测文件类型（从二进制数据）
 */
export function detectMimeType(buffer: Uint8Array): string {
  const hex = Array.from(buffer.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  // 图片格式
  if (hex.startsWith('FFD8FF')) return 'image/jpeg';
  if (hex.startsWith('89504E47')) return 'image/png';
  if (hex.startsWith('47494638')) return 'image/gif';
  if (hex.startsWith('52494646') && hex.includes('57454250')) return 'image/webp';

  // 视频格式
  const fourcc = new TextDecoder().decode(buffer.slice(4, 8));
  if (fourcc === 'ftyp') return 'video/mp4';
  if (hex.startsWith('1A45DFA3')) return 'video/webm';

  // 文本格式
  if (hex.startsWith('7B') || hex.startsWith('5B')) return 'application/json';

  return 'application/octet-stream';
}