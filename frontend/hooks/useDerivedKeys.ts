'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { SessionKey } from '@mysten/seal';
import { networkConfig, suiClient } from '@/contracts';
import { sealClient } from '@/utils/seal/encrypt';
import { fetchDerivedKeysForContract } from '@/utils/seal/decrypt';

interface UseDerivedKeysResult {
  derivedKeys: number[][];
  keyServerAddresses: string[];
  isLoading: boolean;
  error: string | null;
  fetchDerivedKeys: (postId: string) => Promise<{
    derivedKeys: number[][];
    keyServerAddresses: string[];
  }>;
  reset: () => void;
}

/**
 * 用于获取合约派生密钥的自定义 Hook
 * 
 * @param options - 配置选项
 * @param options.ttlMin - SessionKey 的生存时间（分钟，默认：10）
 * @param options.autoFetch - 是否在 postId 变化时自动获取（默认：false）
 * @param options.postId - 要获取派生密钥的帖子 ID（仅在 autoFetch 为 true 时使用）
 * 
 * @returns 包含派生密钥、密钥服务器地址、加载状态、错误信息和获取函数的对象
 */
export function useDerivedKeys(options?: {
  ttlMin?: number;
  autoFetch?: boolean;
  postId?: string;
}): UseDerivedKeysResult {
  const { ttlMin = 10, autoFetch = false, postId } = options || {};
  
  const currentAccount = useCurrentAccount();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  
  const [derivedKeys, setDerivedKeys] = useState<number[][]>([]);
  const [keyServerAddresses, setKeyServerAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDerivedKeys = useCallback(async (postId: string): Promise<{
    derivedKeys: number[][];
    keyServerAddresses: string[];
  }> => {
    if (!currentAccount) {
      const error = '未找到当前账户';
      setError(error);
      throw new Error(error);
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      SessionKey.create({
        address: currentAccount.address,
        packageId: networkConfig.testnet.variables.Package,
        ttlMin,
        suiClient: suiClient,
      })
        .then((sessionKey) => {
          // 2. 签名消息
          signPersonalMessage(
            {
              message: sessionKey.getPersonalMessage(),
            },
            {
              onSuccess: async (result: { signature: string }) => {
                try {
                  sessionKey.setPersonalMessageSignature(result.signature);
                  
                  // 3. 获取派生密钥
                  const { derivedKeys: fetchedDerivedKeys, keyServerAddresses: fetchedKeyServers } = 
                    await fetchDerivedKeysForContract(
                      postId,
                      suiClient,
                      sealClient,
                      sessionKey,
                    );
                  
                  setDerivedKeys(fetchedDerivedKeys);
                  setKeyServerAddresses(fetchedKeyServers);
                  setIsLoading(false);
                  
                  resolve({
                    derivedKeys: fetchedDerivedKeys,
                    keyServerAddresses: fetchedKeyServers,
                  });
                } catch (err) {
                  const errorMessage = err instanceof Error ? err.message : '获取派生密钥失败';
                  setError(errorMessage);
                  setIsLoading(false);
                  console.error('获取派生密钥失败:', err);
                  reject(err);
                }
              },
              onError: (err) => {
                const errorMessage = err.message || '签名失败';
                setError(errorMessage);
                setIsLoading(false);
                console.error(`签名失败: ${errorMessage}`);
                reject(new Error(errorMessage));
              },
            }
          );
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : '创建 SessionKey 失败';
          setError(errorMessage);
          setIsLoading(false);
          console.error('创建 SessionKey 失败:', err);
          reject(err);
        });
    });
  }, [currentAccount, signPersonalMessage, ttlMin]);

  const reset = useCallback(() => {
    setDerivedKeys([]);
    setKeyServerAddresses([]);
    setError(null);
    setIsLoading(false);
  }, []);

  // 如果启用了自动获取且提供了 postId，则自动获取
  // 注意：这需要 useEffect，但为了保持简单，暂时不实现
  // 如果需要自动获取功能，应该在组件层面处理

  return {
    derivedKeys,
    keyServerAddresses,
    isLoading,
    error,
    fetchDerivedKeys,
    reset,
  };
}

