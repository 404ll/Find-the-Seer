'use client';

import { useState, useEffect } from 'react';
import { downloadBlob, getBlobUrl, detectMimeType } from '@/utils/walrus/download';

export function useWalrusDownload(blobId: string | null) {
  const [data, setData] = useState<Uint8Array | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blobId) {
      setData(null);
      setObjectUrl(null);
      setMimeType(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await downloadBlob({ blobId: blobId! });

        if (cancelled) return;

        // 使用从 tags 中提取的 MIME 类型，如果没有则使用检测到的
        const mime = result.mimeType || detectMimeType(result.bytes);
        const bytes = new Uint8Array(result.bytes);
        const url = URL.createObjectURL(new Blob([bytes], { type: mime }));

        setData(result.bytes);
        setMimeType(mime);
        setObjectUrl(url);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [blobId]);

  return {
    data,
    objectUrl,
    mimeType,
    isLoading,
    error,
  };
}