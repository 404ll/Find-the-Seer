'use client';

import { useState } from 'react';
import { uploadPostContent, createUploadFlow } from '@/utils/walrus/upload';
import type { Signer } from '@mysten/sui/cryptography';

export function useWalrusUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * 简单上传（一步完成）
   */
  async function uploadFile(file: File, signer: Signer): Promise<string> {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const result = await uploadPostContent({
        file,
        signer,
        epochs: 3,
        deletable: true,
      });

      setUploadProgress(100);
      return result.blobId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * 分步上传（用于钱包签名）
   */
  function createFlow(file: File) {
    return createUploadFlow({ file, epochs: 3, deletable: true });
  }

  return {
    uploadFile,
    createFlow,
    isUploading,
    uploadProgress,
    error,
  };
}