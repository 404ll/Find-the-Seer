"use client";
import OwnPostCard from './OwnPostCard';
import { Post } from '@/types/display';
import { useState, useMemo } from 'react';

interface OwnPostListProps {
    posts: Post[] | null;
    onPostClick?: (post: Post) => void;
}

const ITEMS_PER_PAGE_SINGLE = 5; // 单列时每页显示5个
const ITEMS_PER_PAGE_DOUBLE = 10; // 双列时每页显示10个（2列x5行）

export default function OwnPostList({ posts, onPostClick }: OwnPostListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const safePosts = posts ?? [];
    
    // 判断是否使用单列布局（总数 <= 5）
    const isSingleColumn = safePosts.length <= ITEMS_PER_PAGE_SINGLE;
    
    // 根据布局选择每页显示数量
    const itemsPerPage = isSingleColumn ? ITEMS_PER_PAGE_SINGLE : ITEMS_PER_PAGE_DOUBLE;
    
    // 计算总页数
    const totalPages = Math.ceil(safePosts.length / itemsPerPage) || 1;
    
    // 计算当前页显示的数据
    const currentPosts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return safePosts.slice(startIndex, endIndex);
    }, [currentPage, safePosts, itemsPerPage]);
    
    
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
        <div className='relative flex flex-col gap-4 bg-white rounded-[12px] p-4 max-w-3xl h-[510px]'>
            {safePosts.length === 0 ? (
                <div className="flex h-full items-center justify-center text-black font-cbyg text-2xl">
                    You haven&apos;t created any posts yet.
                </div>
            ) : (
                <>
                    <div className={`${isSingleColumn ? 'grid grid-cols-1' : 'grid grid-cols-2'} gap-4`}>
                        {currentPosts.map((post, index) => (
                            <OwnPostCard 
                                key={`${post.id}-${index}`} 
                                post={post}
                                onClick={() => onPostClick?.(post)}
                            />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 justify-center'>
                            <button 
                                onClick={handlePrevious}
                                disabled={currentPage === 1}
                                className={`text-black font-cbyg text-2xl transition-opacity bg-transparent border-none outline-none ${
                                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
                                }`}
                            > 
                                &lt; 
                            </button>
                            <span className='text-black font-cbyg text-xl'>
                                {currentPage} / {totalPages}
                            </span>
                            <button 
                                onClick={handleNext}
                                disabled={currentPage === totalPages}
                                className={`text-black font-cbyg text-2xl transition-opacity bg-transparent border-none outline-none ${
                                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
                                }`}
                            > 
                                &gt; 
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}