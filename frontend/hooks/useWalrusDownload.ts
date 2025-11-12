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
        const blob = await downloadBlob({ blobId: blobId! });

        if (cancelled) return;

        const mime = detectMimeType(blob);
        const url = URL.createObjectURL(new Blob([blob as any], { type: mime }));

        setData(blob);
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