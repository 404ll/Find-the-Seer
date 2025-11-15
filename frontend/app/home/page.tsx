"use client";
import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PostList from '@/components/PostList';
import { Post, PostStatus } from '@/types/display';
import PostDetail from '@/components/PostDetail';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
const posts: Post[] = [
      {
          content: "# The World is Ending\n\nIn **100 seconds** from now, the world as we know it will come to an end.\n\n## What to expect:\n- Complete chaos\n- Final moments\n- The end of everything\n\n> This is a prophecy that cannot be ignored.",
          createdAt: "2025-01-01",
          lastingTime: 100,
          trueVotesCount: 45,
          falseVotesCount: 15,
          status: PostStatus.Active,
          votecount: 60,
          trueFalseRatio: 7,
      },
      {
          content: "# Prophecy of Change\n\nThe world is ending, but this is not the end. It is a **new beginning**.\n\n## Signs to watch:\n1. The stars will align\n2. The earth will shake\n3. A new era will dawn",
          createdAt: "2025-01-01",
          lastingTime: 100,
          trueVotesCount: 30,
          falseVotesCount: 20,
          status: PostStatus.Verify,
          votecount: 50,
          trueFalseRatio: 6,
      },
      {
          content: "## Silent Prophecy\n\nSometimes, the most powerful messages are those left unspoken.\n\n*The silence speaks volumes.*",
          createdAt: "2025-01-01",
          lastingTime: 100,
          trueVotesCount: 25,
          falseVotesCount: 35,
          status: PostStatus.Active,
          votecount: 60,
          trueFalseRatio: 5,
      },
      {
          content: "# The Final Countdown\n\n**Time is running out.**\n\nThe world is ending, and we must prepare.\n\n### What we know:\n- The prophecy is clear\n- The signs are everywhere\n- The end is near\n\n> Trust in the prophecy.",
          createdAt: "2025-01-01",
          lastingTime: 100,
          trueVotesCount: 50,
          falseVotesCount: 10,
          status: PostStatus.Active,
          votecount: 60,
          trueFalseRatio: 8,
      },
      {
          content: "# Past Prophecy\n\nThis prophecy has already come to pass.\n\nThe world ended, and we survived.\n\n## Lessons learned:\n- Prophecies can be true\n- But we are stronger\n- We endure",
          createdAt: "2025-01-01",
          lastingTime: 0,
          trueVotesCount: 20,
          falseVotesCount: 30,
          status: PostStatus.Closed,
          votecount: 50,
          trueFalseRatio: 4,
      },
      {
          content: "## The Seer's Vision\n\nThe world is ending, but not in the way you think.\n\n**Key points:**\n- Transformation, not destruction\n- Evolution, not extinction\n- Hope, not despair\n\n> The future is unwritten.",
          createdAt: "2025-01-01",
          lastingTime: 100,
          trueVotesCount: 40,
          falseVotesCount: 20,
          status: PostStatus.Verify,
          votecount: 60,
          trueFalseRatio: 6,
      },
];

const ITEMS_PER_PAGE = 9; // 每页显示6个（3列x2行）

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { account, isLoading, error, refreshAccount } = useUser();
  const currentAccount = useCurrentAccount();
  console.log(account);
  useEffect(() => {
    if (currentAccount) {
      refreshAccount(currentAccount.address);
    }
  }, [currentAccount]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  // 计算总页数
  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);

  // 计算当前页显示的数据
  const currentPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return posts.slice(startIndex, endIndex);
  }, [currentPage]);

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
            <PostList posts={currentPosts} onPostClick={handlePostClick} />
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