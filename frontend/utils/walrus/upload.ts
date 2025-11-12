import { createWalrusClient } from './client';
import type { Signer } from '@mysten/sui/cryptography';

export interface UploadPostOptions {
  file: File | Uint8Array | Blob;
  signer: Signer;
  epochs?: number;
  deletable?: boolean;
}

export interface UploadPostResult {
  blobId: string;
  size: number;
  contentType: string;
}

export async function uploadPostContent(
  options: UploadPostOptions
): Promise<UploadPostResult> {
  const { file, signer, epochs = 3, deletable = true } = options;

  let blob: Uint8Array;
  let contentType: string = 'application/octet-stream';

  if (file instanceof File) {
    blob = new Uint8Array(await file.arrayBuffer());
    contentType = file.type || contentType;
  } else if (file instanceof Blob) {
    blob = new Uint8Array(await file.arrayBuffer());
    contentType = file.type || contentType;
  } else {
    blob = file;
  }

  console.log('[Walrus] 开始上传:', {
    size: blob.length,
    contentType,
    epochs,
  });

  const client = createWalrusClient();

  try {
    const result = await client.walrus.writeBlob({
      blob,
      deletable,
      epochs,
      signer,
    });

    console.log('[Walrus] 上传成功:', result.blobId);

    return {
      blobId: result.blobId,
      size: blob.length,
      contentType,
    };
  } catch (error) {
    console.error('[Walrus] 上传失败:', error);
    throw new Error(`上传失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function createUploadFlow(options: Omit<UploadPostOptions, 'signer'>) {
  const { file, epochs = 3, deletable = true } = options;

  const client = createWalrusClient();

  return {
    async prepare() {
      let blob: Uint8Array;
      let contentType: string = 'application/octet-stream';

      if (file instanceof File) {
        blob = new Uint8Array(await file.arrayBuffer());
        contentType = file.type || contentType;
      } else if (file instanceof Blob) {
        blob = new Uint8Array(await file.arrayBuffer());
        contentType = file.type || contentType;
      } else {
        blob = file;
      }

      const flow = client.walrus.writeBlobFlow({ blob });
      await flow.encode();

      return {
        flow,
        blobId: flow.getBlob(),
        size: blob.length,
        contentType,
      };
    },

    registerTransaction(flow: any, ownerAddress: string) {
      return flow.register({
        epochs,
        owner: ownerAddress,
        deletable,
      });
    },

    async upload(flow: any, registerTxDigest: string) {
      await flow.upload({ digest: registerTxDigest });
    },

    certifyTransaction(flow: any) {
      return flow.certify();
    },
  };
}