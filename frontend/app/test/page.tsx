"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import {
  createAccount,
  createPost,
  votePost,
  decryptAndSettleCryptoVote,
  claimVoteRewards,
  claimVoteRewardsForAuthor,
} from "@/contracts/call";
import { ConnectButton } from "@mysten/dapp-kit";
import { getSeer,getAccount } from "@/contracts/query";
import { useEffect } from "react";


export default function TestPage() {
  const KEY_SERVER_0 = '0x34401905bebdf8c04f3cd5f04f442a39372c8dc321c29edfb4f9cb30b23ab96';
const KEY_SERVER_1 = '0xd726ecf6f7036ee3557cd6c7b93a49b231070e8eecada9cfa157e40e3f02e5d3';
const KEY_SERVER_2 = '0xdba72804cc9504a82bbaa13ed4a83a0e2c6219d7e45125cf57fd10cbab957a97';
const KEY_SERVERS = [KEY_SERVER_0, KEY_SERVER_1, KEY_SERVER_2];


function hexToBytes(hex: string): number[] {
    // 移除可能的 '0x' 前缀
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes: number[] = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16));
    }
    return bytes;
  }
let pk0 = 'a58bfa576a8efe2e2730bc664b3dbe70257d8e35106e4af7353d007dba092d722314a0aeb6bca5eed735466bbf471aef01e4da8d2efac13112c51d1411f6992b8604656ea2cf6a33ec10ce8468de20e1d7ecbfed8688a281d462f72a41602161';
let pk1 = 'a9ce55cfa7009c3116ea29341151f3c40809b816f4ad29baa4f95c1bb23085ef02a46cf1ae5bd570d99b0c6e9faf525306224609300b09e422ae2722a17d2a969777d53db7b52092e4d12014da84bffb1e845c2510e26b3c259ede9e42603cd6';
let pk2 = '93b3220f4f3a46fb33074b590cda666c0ebc75c7157d2e6492c62b4aebc452c29f581361a836d1abcbe1386268a5685103d12dec04aadccaebfa46d4c92e2f2c0381b52d6f2474490d02280a9e9d8c889a3fce2753055e06033f39af86676651';
const PUBLIC_KEYS: number[][] = [
    hexToBytes(pk0),
    hexToBytes(pk1),
    hexToBytes(pk2),
  ];

  const THRESHOLD = 2;

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
  const [keyServers, setKeyServers] = useState<string[]>([]);
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

  useEffect(() => {
    getSeer().then((response) => {
      console.log(response);
  });
}, []);
useEffect(() => {
  if (currentAccount) {
    getAccount(currentAccount.address).then((response) => {
      console.log(response);
    });
  }
}, [currentAccount]);

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
    handleExecute(createAccount(accountName));
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
        KEY_SERVERS,
        PUBLIC_KEYS,
        THRESHOLD,
        // keyServers,
        // publicKeys,
        // Number(threshold),
        accountId
      )
    );
  };

  const handleVotePost = () => {
    if (!currentAccount) {
      setError("请先连接钱包");
      return;
    }
    if (!postId || !accountId) {
      setError("请输入 Post ID 和 Account ID");
      return;
    }
    handleExecute(
      votePost(
        currentAccount.address,
        postId,
        accountId,
        cryptoVoteData,
        coin
      )
    );
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
