import { networkConfig } from "@/contracts/index";
/**
 * 从密钥服务器获取派生密钥
 * @param postId - 帖子 ID
 * @param keyServerUrls - 密钥服务器 API 地址
 * @param threshold - 需要几个密钥
 * @returns 派生密钥和对应的服务器地址
 */
export async function fetchDerivedKeysForPost(
    postId: string,
    keyServerUrls: string[],
    threshold: number = 2
  ): Promise<{
    derivedKeys: string[];        // 十六进制字符串数组
    keyServerAddresses: string[]; // 对应的服务器地址
  }> {
    const derivedKeys: string[] = [];
    const keyServerAddresses: string[] = [];
    
    for (let i = 0; i < keyServerUrls.length && derivedKeys.length < threshold; i++) {
      try {
        const response = await fetch(keyServerUrls[i], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: networkConfig.testnet.variables.Package,
            postId: postId,
          })
        });
        
        if (!response.ok) {
          console.warn(`密钥服务器 ${i} 返回错误: ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        
        derivedKeys.push(data.derivedKey);
        keyServerAddresses.push(data.address); 
        
      } catch (error) {
        console.error(`从服务器 ${i} 获取密钥失败:`, error);
      }
    }
    
    if (derivedKeys.length < threshold) {
      throw new Error(`只获取到 ${derivedKeys.length} 个密钥，需要至少 ${threshold} 个`);
    }
    
    return {
      derivedKeys: derivedKeys.slice(0, threshold),
      keyServerAddresses: keyServerAddresses.slice(0, threshold)
    };
  }
  
  export function hexToBytes(hex: string): number[] {
    const cleanHex = hex.replace('0x', '');
    const bytes: number[] = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16));
    }
    return bytes;
  }