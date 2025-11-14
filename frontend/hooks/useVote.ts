import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { encryptVote } from '@/utils/seal/encrypt';
import { votePost } from '@/contracts/call';
import { networkConfig } from '@/contracts';

export function useVote() {
  const currentAccount = useCurrentAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = async (
    postId: string,
    accountId: string,
    voteChoice: boolean,
    threshold: number = 2
  ) => {
    if (!currentAccount) {
      throw new Error("请先连接钱包");
    }

    try {
      setIsEncrypting(true);
      setError(null);

      // 1. 加密投票
      const encryptedVote = await encryptVote(
        voteChoice,
        currentAccount.address,
        networkConfig.testnet.variables.Package,
        postId,
        threshold
      );

      // 2. 转换为 number[]
      const cryptoVoteData = Array.from(encryptedVote);

      // 3. 返回交易
      return votePost(
        currentAccount.address,
        postId,
        accountId,
        cryptoVoteData,
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsEncrypting(false);
    }
  };

  return {
    vote,
    isEncrypting,
    error,
  };
}