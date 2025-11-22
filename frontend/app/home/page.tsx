"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import PostList from '@/components/PostList';
import { Post } from '@/types/display';
import PostDetail from '@/components/PostDetail';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx';
import { useDerivedKeys } from '@/hooks/useDerivedKeys';
// import {}
import { createAccountAndVotePost, decryptAndSettleCryptoVote, votePost } from '@/contracts/call';
import { useSeerData } from '@/hooks/useSeerData';
import { encryptVote } from '@/utils/seal/encrypt';
import { networkConfig } from '@/contracts/index';
import { toast } from 'sonner';


const ITEMS_PER_PAGE = 9; // 每页显示6个（3列x2行）

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { user, refreshUser } = useUser();
  const currentAccount = useCurrentAccount();
  const { 
    fetchDerivedKeys 
  } = useDerivedKeys();
  const { 
    seer, 
    refreshSeerAfterTx 
  } = useSeerData();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);



  const {handleSignAndExecuteTransaction: createAccountAndVotePostTx} = useBetterSignAndExecuteTransaction({ tx: createAccountAndVotePost});
  const {handleSignAndExecuteTransaction: votePostTx} = useBetterSignAndExecuteTransaction({ tx: votePost});
  const {handleSignAndExecuteTransaction: verifyPostTx} = useBetterSignAndExecuteTransaction({ tx: decryptAndSettleCryptoVote});

  const triggerDataRefresh = useCallback((address?: string) => {
    if (address) {
      refreshUser(address);
    }
    refreshSeerAfterTx();
  }, [refreshUser, refreshSeerAfterTx]);

  const totalPages = useMemo(() => {
    const totalPosts = seer?.posts.length ?? 0;
    return Math.ceil(totalPosts / ITEMS_PER_PAGE);
  }, [seer]);

  useEffect(() => {
    if (currentAccount) {
      refreshUser(currentAccount.address);
    }
  }, [currentAccount, refreshUser]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // 上一页
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 下一页
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleClosePostDetail = () => {
    setSelectedPost(null);
  };


  const handleVotePost = async (postId: string, vote_choice: boolean) => {
    if (!currentAccount) {
      console.error("Current account not found");
      return;
    } 

    const cryptoVoteData = await encryptVote(vote_choice, currentAccount.address, networkConfig.testnet.variables.Package, postId);
    console.log("encryptedCryptoVoteData", cryptoVoteData);
    if(!user) {
      createAccountAndVotePostTx({ address: currentAccount.address, postId, cryptoVoteData }).onSuccess(() => {
        console.log("Vote post successfully");  
        triggerDataRefresh(currentAccount.address);
      }).onError((error) => {
        console.error(error);
      }).execute();
      return;
    }

    votePostTx({ address: currentAccount.address, postId, accountId: user.id, cryptoVoteData }).onSuccess(() => {
      console.log("Vote post successfully");
      toast.success("Vote post successfully");
      triggerDataRefresh(currentAccount.address);
    }).onError((error) => {
      console.error(error);
      toast.error("Vote post failed");
    }).execute();
  };

  const handleVerifyPost = async (postId: string) => {
    if (!currentAccount) {
      console.error("Current account not found");
      return;
    }
    
    try {
      // 获取 derived keys（返回 Promise，可以直接 await）
      const { derivedKeys: fetchedDerivedKeys, keyServerAddresses: fetchedKeyServers } = 
        await fetchDerivedKeys(postId);
      console.log(fetchedDerivedKeys,fetchedKeyServers);
      verifyPostTx({ 
        address: currentAccount.address, 
        postId, 
        derivedKeys: fetchedDerivedKeys, 
        keyServers: fetchedKeyServers 
      }).onSuccess(() => {
        console.log("Verify post successfully");
        triggerDataRefresh(currentAccount.address);
      }).onError((error) => {
        console.error(error);
      }).execute();
    } catch (error) {
      console.error("Failed to fetch derived keys:", error);
    }
  };

  return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="fixed inset-0 pointer-events-none z-0">
                {/* 左上角装饰 */}
                <div className="absolute top-20 left-10 opacity-60">
                    <Image src="/logo/wal_1.png" alt="Decoration" width={150} height={150} className="object-contain" />
                </div>
                {/* 右上角装饰 */}
                <div className="absolute top-28 right-20 opacity-60">
                    <Image src="/logo/wal_3.png" alt="Decoration" width={120} height={120} className="object-contain" />
                </div>
                {/* 左下角装饰 */}
                <div className="absolute bottom-40 left-16 opacity-60">
                    <Image src="/logo/wal_4.png" alt="Decoration" width={100} height={100} className="object-contain" />
                </div>
                {/* 中间右侧装饰 */}
                <div className="absolute top-1/2 right-10 -translate-y-1/7 opacity-60">
                    <Image src="/logo/wal_5.png" alt="Decoration" width={130} height={130} className="object-contain" />
                </div>
                {/* 渐变效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30"></div>
            </div>
        <div className='flex-1 px-8 py-14'>
          <div className='grid grid-cols-1 gap-4 relative z-10 pt-10'>
            <PostList posts={seer?.posts || []} onPostClick={handlePostClick} onVotePost={handleVotePost} onVerifyPost={handleVerifyPost} />
          </div>
        </div>
       
        {totalPages > 1 && (
          <div className='flex items-center gap-4 justify-center pb-8'>
            <button 
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`text-white font-cbyg text-2xl transition-opacity bg-transparent border-none outline-none ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
              }`}
            > 
              &lt; 
            </button>
            <span className='text-white font-cbyg text-xl'>
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`text-white font-cbyg text-2xl transition-opacity bg-transparent border-none outline-none ${
                currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
              }`}
            > 
              &gt; 
            </button>
          </div>
        )}

        {selectedPost && (
            <PostDetail
                post={selectedPost}
                onClose={handleClosePostDetail}
            />
        )}
      </div>
  );
}