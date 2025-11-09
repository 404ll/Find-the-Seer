"use client";
import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import PostList from '@/components/PostList';

const posts = [
    {
        id: '1',
        content: 'The world is ending',
        image: 'https://via.placeholder.com/150',
    },
    {
        id: '2',
        content: "It's raining today",
        image: 'https://via.placeholder.com/150',
    },
    {
        id: '3',
        content: "It's raining today",
        image: 'https://via.placeholder.com/150',
    },
    {
        id: '4',
        content: "It's raining today",
        image: 'https://via.placeholder.com/150',
    },
    {
        id: '5',
        content: 'Another post',
        image: 'https://via.placeholder.com/150',
    },
    {
        id: '6',
        content: 'More content',
        image: 'https://via.placeholder.com/150',
    },
    {
        id: '7',
        content: 'Even more posts',
        image: 'https://via.placeholder.com/150',
    },
    {
        id: '8',
        content: 'Last post',
        image: 'https://via.placeholder.com/150',
    },
];

const ITEMS_PER_PAGE = 9; // 每页显示6个（3列x2行）

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
      <div className="min-h-screen flex flex-col bg-black relative">
        <Navbar />
        <div className='grid grid-cols-1 gap-4 px-8 py-14'>
            <PostList posts={currentPosts} />
        </div>
       
        {totalPages > 1 && (
          <div className='absolute bottom-0 left-1/2 -translate-x-1/2 pb-8 flex items-center gap-4 justify-center'>
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
      </div>
  );
}