import Image from 'next/image';
import { Post } from '@/types/display';

interface PostCardProps {
    post: Post;
    onClick?: () => void;
}

export default function PostCard({ post, onClick }: PostCardProps) {
    const handleCardClick = (e: React.MouseEvent) => {
        // 如果点击的是按钮，不触发卡片点击
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        onClick?.();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (
        <div 
            className='bg-white rounded-[12px] p-4 flex flex-col gap-4 cursor-pointer hover:scale-105 transition-transform duration-300' 
            onClick={handleCardClick}
        >
            {/*截断显示content，超过100字符后显示...*/}
            <h1 className='text-black text-2xl font-cbyg text-center '>{post.content.length > 40 ? post.content.slice(0, 40) + '...' : post.content}</h1>
            <div className='flex justify-center'>
                {post.image && <Image src={post.image} alt="Post Image" width={100} height={100} />}
            </div>
            <hr className='border-black border-1' />
            <div className='flex flex-row justify-between items-center gap-4 text-white text-2xl font-cbyg'>    
           {/* 截止时间 */} 
            <div className='text-white bg-[#BDBDBD] rounded-[12px] p-2 text-xl font-cbyg items-center flex'>Deadline: <span className='ml-2'>{formatDate(post.createdAt + post.lastingTime)}</span></div>
            <div className='flex flex-row justify-end gap-4' onClick={(e) => e.stopPropagation()}>
                <button className='bg-black text-white rounded-[12px] p-2 font-cbyg text-xl hover:scale-105 transition-all duration-300'>True</button>
                <button className='bg-black text-white rounded-[12px] p-2 font-cbyg text-xl hover:scale-105 transition-all duration-300'>False</button>
                {post.status === 'Active' && <button className='bg-[#679533] text-white rounded-[12px] p-2 font-cbyg text-xl hover:scale-105 transition-all duration-300'>Verify</button>}
            </div>
            </div>
        </div>
    );
}