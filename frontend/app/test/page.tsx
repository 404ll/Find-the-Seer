"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import {
  createAccount,
  createPost,
  decryptAndSettleCryptoVote,
  claimVoteRewards,
  claimVoteRewardsForAuthor,
  setPublicKeys1,
} from "@/contracts/call";
import { ConnectButton } from "@mysten/dapp-kit";
import { getPosts, getAccount, getSeer } from "@/contracts/query";
import { useEffect } from "react";
import { useVote } from "@/hooks/useVote";
import { sealClient } from "@/utils/seal/encrypt";
import { fetchDerivedKeysForContract } from "@/utils/seal/decrypt";
import { networkConfig } from "@/contracts";
import { suiClient } from "@/contracts";
import { useSignPersonalMessage } from "@mysten/dapp-kit";
import { SessionKey } from '@mysten/seal';


export default function TestPage() {

  const KEY_SERVER_0 = '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75';
  const KEY_SERVER_1 = '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8';
  const KEY_SERVER_2 = '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2';

  const KEY_SERVERS = [KEY_SERVER_0, KEY_SERVER_1, KEY_SERVER_2];
  const THRESHOLD = 2;

  const { vote, isEncrypting, error: voteError } = useVote();

  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  // createAccount 参数
  const [accountName, setAccountName] = useState("TestAccount");

  // createPost 参数
  const [blobId, setBlobId] = useState("");
  const [lastingTime, setLastingTime] = useState("86400"); // 1 day in seconds
  const [predictedTrueBp, setPredictedTrueBp] = useState("50");
  const [keyServers, setKeyServers] = useState<string[]>(KEY_SERVERS);
  const [publicKeys, setPublicKeys] = useState<number[][]>([]);
  const [threshold, setThreshold] = useState("2");
  const [accountId, setAccountId] = useState("");

  // votePost 参数
  const [postId, setPostId] = useState("");
  const [cryptoVoteData, setCryptoVoteData] = useState<number[]>([]);
  const [coin, setCoin] = useState("");

  // decryptAndSettleCryptoVote 参数
  const [derivedKeys, setDerivedKeys] = useState<number[][]>([]);
  const [settleKeyServers, setSettleKeyServers] = useState<string[]>([]);
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  
  const getDerivedKeys = async () => {
    if (!currentAccount) return;
  
    // 1. 创建 SessionKey
    const sessionKey = await SessionKey.create({
      address: currentAccount.address,
      packageId: networkConfig.testnet.variables.Package,
      ttlMin: 10,
      suiClient: suiClient,
    });

    signPersonalMessage(
      {
        message: sessionKey.getPersonalMessage(),
      },
      {
        onSuccess: async (result: { signature: string }) => {
          sessionKey.setPersonalMessageSignature(result.signature);
          console.log("signature", result);
          const {derivedKeys, keyServerAddresses} = await fetchDerivedKeysForContract(
            "0xd347ea5d2da53f009b0ae3e5c0c1d231501eb86e80e0aba9be894c4d52c1f618",
            suiClient,
            sealClient,
            sessionKey,
          );
          
          setDerivedKeys(derivedKeys);
          setSettleKeyServers(keyServerAddresses);
        },
        onError: (error) => {
          setError(`签名失败: ${error.message}`);
        },
      }
    );
  }

  const fetchPublicKeys = async (keyServers: string[]): Promise<number[][]> => {
    try {
      const g2Elements = await sealClient.getPublicKeys(keyServers);
      const publicKeysArray: number[][] = g2Elements.map((g2Element) => {
        const bytes = g2Element.toBytes();
        return Array.from(bytes);
      });

      console.log("Public keys:", publicKeysArray);
      return publicKeysArray;
    } catch (error) {
      console.error("获取 public keys 失败:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (keyServers.length > 0) {
      fetchPublicKeys(keyServers)
        .then((keys) => {
          setPublicKeys(keys);
        })
        .catch((error) => {
          console.error("获取 public keys 失败:", error);
        });
    }
  }, [keyServers]);


  useEffect(() => {
      getDerivedKeys();
  }, [currentAccount]);

  useEffect(() => {
    if (currentAccount) {
      getAccount(currentAccount.address).then((response) => {
        console.log(response);
      });
    }
  }, [currentAccount]);

useEffect (() => {
  getSeer()
}, []);

  const handleExecute = async (txPromise: Promise<any>) => {
    try {
      setError("");
      setResult("构建交易中...");
      const tx = await txPromise;
      setResult("等待签名...");

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            setResult(`✅ 成功！交易哈希: ${result.digest}`);
            console.log("交易结果:", result);
          },
          onError: (error) => {
            setError(`❌ 失败: ${error.message}`);
            setResult("");
            console.error("交易错误:", error);
          },
        }
      );
    } catch (err: any) {
      setError(`❌ 构建交易失败: ${err.message}`);
      setResult("");
      console.error("构建交易错误:", err);
    }
  };

  const handleCreateAccount = () => {
    if (!currentAccount) {
      setError("请先连接钱包");
      return;
    }
    handleExecute(createAccount());
  };

const handleSetPublicKeys = async () => {
  if (!currentAccount) {
    setError("请先连接钱包");
    return;
  }
  const tx = await setPublicKeys1(publicKeys);
  handleExecute(Promise.resolve(tx));
};

  const handleCreatePost = () => {
    if (!currentAccount) {
      setError("请先连接钱包");
      return;
    }
    if (!accountId) {
      setError("请输入 Account ID");
      return;
    }
    handleExecute(
      createPost(
        currentAccount.address,
        blobId || "test-blob-id",
        Number(lastingTime),
        Number(predictedTrueBp),
        accountId
      )
    );
  };

  const handleVotePost = async () => {
    if (!currentAccount) {
      setError("请先连接钱包");
      return;
    }
    if (!postId || !accountId) {
      setError("请填写所有必填字段");
      return;
    }

    try {
      const tx = await vote(
        postId,
        accountId,
        true,
        2
      );

      // 执行交易
      handleExecute(Promise.resolve(tx));
    } catch (err: any) {
      setError(err.message);
    }
  };


  const handleDecryptAndSettle = () => {
    if (!currentAccount) {
      setError("请先连接钱包");
      return;
    }
    if (!postId) {
      setError("请输入 Post ID");
      return;
    }
    // console.log("derivedKeys", derivedKeys);
    handleExecute(
      decryptAndSettleCryptoVote(
        currentAccount.address,
        postId,
        derivedKeys,
        settleKeyServers
      )
    );
  };

  const handleClaimRewards = () => {
    if (!currentAccount) {
      setError("请先连接钱包");
      return;
    }
    if (!postId || !accountId) {
      setError("请输入 Post ID 和 Account ID");
      return;
    }
    handleExecute(claimVoteRewards(currentAccount.address, postId, accountId));
  };

  const handleClaimRewardsForAuthor = () => {
    if (!currentAccount) {
      setError("请先连接钱包");
      return;
    }
    if (!postId || !accountId) {
      setError("请输入 Post ID 和 Account ID");
      return;
    }
    handleExecute(
      claimVoteRewardsForAuthor(currentAccount.address, postId, accountId)
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">合约方法测试页面</h1>
        <ConnectButton />
        {!currentAccount && (
          <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 mb-6">
            ⚠️ 请先连接钱包
          </div>
        )}

        {currentAccount && (
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mb-6">
            ✅ 已连接钱包: {currentAccount.address}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-6">
            {result}
          </div>
        )}

        <div className="space-y-8">
          {/* createAccount */}
          <section className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">1. createAccount</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">账户名称:</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入账户名称"
                />
              </div>
              <button
                onClick={handleCreateAccount}
                disabled={isPending || !currentAccount}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded"
              >
                {isPending ? "执行中..." : "创建账户"}
              </button>
            </div>
          </section>

          {/* createPost */}
          <section className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">2. createPost</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Blob ID:</label>
                <input
                  type="text"
                  value={blobId}
                  onChange={(e) => setBlobId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Blob ID"
                />
              </div>
              <div>
                <label className="block mb-2">Account ID:</label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Account ID"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">持续时间 (秒):</label>
                  <input
                    type="number"
                    value={lastingTime}
                    onChange={(e) => setLastingTime(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-2">预测真实 BP:</label>
                  <input
                    type="number"
                    value={predictedTrueBp}
                    onChange={(e) => setPredictedTrueBp(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2">阈值:</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                />
              </div>
              <button
                onClick={handleSetPublicKeys}
                disabled={isPending || !currentAccount}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded"
              >
                {isPending ? "执行中..." : "设置公钥"}
              </button>
              <button
                onClick={handleCreatePost}
                disabled={isPending || !currentAccount}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded"
              >
                {isPending ? "执行中..." : "创建帖子"}
              </button>
            </div>
          </section>

          {/* votePost */}
          <section className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">3. votePost</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Post ID:</label>
                <input
                  type="text"
                  value={postId}
                  onChange={(e) => setPostId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Post ID"
                />
              </div>
              <div>
                <label className="block mb-2">Account ID:</label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Account ID"
                />
              </div>
              <div>
                <label className="block mb-2">Coin Object ID:</label>
                <input
                  type="text"
                  value={coin}
                  onChange={(e) => setCoin(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Coin Object ID"
                />
              </div>
              <button
                onClick={handleVotePost}
                disabled={isPending || !currentAccount}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded"
              >
                {isPending ? "执行中..." : "投票"}
              </button>
            </div>
          </section>

          {/* decryptAndSettleCryptoVote */}
          <section className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">4. decryptAndSettleCryptoVote</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Post ID:</label>
                <input
                  type="text"
                  value={postId}
                  onChange={(e) => setPostId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Post ID"
                />
              </div>
              <button
                onClick={handleDecryptAndSettle}
                disabled={isPending || !currentAccount}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded"
              >
                {isPending ? "执行中..." : "解密并结算"}
              </button>
            </div>
          </section>

          {/* claimVoteRewards */}
          <section className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">5. claimVoteRewards</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Post ID:</label>
                <input
                  type="text"
                  value={postId}
                  onChange={(e) => setPostId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Post ID"
                />
              </div>
              <div>
                <label className="block mb-2">Account ID:</label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Account ID"
                />
              </div>
              <button
                onClick={handleClaimRewards}
                disabled={isPending || !currentAccount}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded"
              >
                {isPending ? "执行中..." : "领取投票奖励"}
              </button>
            </div>
          </section>

          {/* claimVoteRewardsForAuthor */}
          <section className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">6. claimVoteRewardsForAuthor</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Post ID:</label>
                <input
                  type="text"
                  value={postId}
                  onChange={(e) => setPostId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Post ID"
                />
              </div>
              <div>
                <label className="block mb-2">Account ID:</label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入 Account ID"
                />
              </div>
              <button
                onClick={handleClaimRewardsForAuthor}
                disabled={isPending || !currentAccount}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded"
              >
                {isPending ? "执行中..." : "作者领取奖励"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
