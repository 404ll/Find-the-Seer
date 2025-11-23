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
      <div className="min-h-screen flex flex-col bg-black relative overflow-hidden selection:bg-purple-500/30">
        <Navbar />
        
        {/* Noise Texture Overlay */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 opacity-10 mix-blend-overlay"
          style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Background Graffiti Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
            {/* Spray Paint Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-blue-900/20 rounded-full blur-[140px]" />
            <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-pink-900/10 rounded-full blur-[100px]" />

            {/* Decorative Images */}
            <div className="absolute top-20 -left-10 opacity-30 rotate-[-12deg] mix-blend-screen hover:opacity-50 transition-opacity duration-700">
                <Image src="/logo/wal_1.png" alt="Graffiti Art" width={350} height={350} className="object-contain" />
            </div>
            <div className="absolute bottom-40 left-10 opacity-20 rotate-[8deg] mix-blend-screen">
                <Image src="/logo/wal_4.png" alt="Graffiti Art" width={250} height={250} className="object-contain" />
            </div>
            <div className="absolute top-1/2 right-0 translate-x-1/3 -translate-y-1/2 opacity-20 rotate-[-5deg] mix-blend-screen">
                <Image src="/logo/wal_5.png" alt="Graffiti Art" width={450} height={450} className="object-contain" />
            </div>
        </div>

        <div className='flex-1 px-4 md:px-12 py-10 relative z-10'>
          {/* Header Section */}
          <div className="flex flex-col items-center justify-center mb-16 pt-8">
            <h1 className="text-7xl md:text-9xl font-cbyg text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transform -rotate-2 tracking-widest relative">
              THE WALL
            </h1>
            <p className="mt-4 text-xl md:text-2xl font-cbyg text-gray-400 tracking-[0.2em] uppercase opacity-80 border-b border-gray-800 pb-2">
              Where Prophecies Live
            </p>
          </div>

          <div className='w-full max-w-7xl mx-auto'>
            {(!seer?.posts || seer.posts.length === 0) ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] border-2 border-dashed border-gray-800 rounded-3xl bg-black/20 backdrop-blur-sm">
                <h2 className="text-6xl font-cbyg text-gray-600 mb-6 tracking-wide animate-pulse">Silence...</h2>
                <p className="text-2xl font-cbyg text-gray-700 tracking-wider">Be the first to speak.</p>
              </div>
            ) : (
              <PostList posts={seer.posts} onPostClick={handlePostClick} onVotePost={handleVotePost} onVerifyPost={handleVerifyPost} />
            )}
          </div>
        </div>
       
        {totalPages > 1 && (
          <div className='flex items-center gap-8 justify-center pb-12 relative z-10'>
            <button 
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`font-cbyg text-3xl transition-all duration-300 ${
                currentPage === 1 
                  ? 'text-gray-700 cursor-not-allowed' 
                  : 'text-white hover:text-purple-400 hover:scale-125 cursor-pointer drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
              }`}
            > 
              PREV
            </button>
            <div className="relative">
              <span className='text-white font-cbyg text-4xl tracking-widest'>
                {currentPage}<span className="text-gray-600 mx-2">/</span>{totalPages}
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
            </div>
            <button 
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`font-cbyg text-3xl transition-all duration-300 ${
                currentPage === totalPages 
                  ? 'text-gray-700 cursor-not-allowed' 
                  : 'text-white hover:text-purple-400 hover:scale-125 cursor-pointer drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
              }`}
            > 
              NEXT 
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