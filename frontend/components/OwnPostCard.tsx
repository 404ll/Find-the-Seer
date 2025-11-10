import { Post } from '@/types/display';

interface OwnPostCardProps {    
    post: Post;
    onClick?: () => void;
}

export default function OwnPostCard({ post, onClick }: OwnPostCardProps) {

    return (
        <div 
            className='bg-black rounded-[12px] p-4 flex flex-col gap-4 hover:scale-105 transition-all duration-300 cursor-pointer'
            onClick={onClick}
        >
            <div className='flex flex-row justify-between items-center gap-4 text-white text-2xl font-cbyg'>
                <div>{post.content.length > 25 ? post.content.slice(0, 25) + '...' : post.content}</div>
                {post.status === 'Active' ? <div className="bg-[#679533] rounded-[8px] p-2 text-black text-xl font-cbyg justify-end">Active</div> : <div className="bg-[#BDBDBD] rounded-[8px] p-2 text-white text-xl font-cbyg justify-center">Closed</div>}
            </div>
        </div>
    )};
        