import { Post } from '@/types/display';

interface OwnPostCardProps {    
    post: Post;
    onClick?: () => void;
}

export default function OwnPostCard({ post, onClick }: OwnPostCardProps) {

    return (
        <div 
            className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-[12px] p-4 flex flex-col gap-4 hover:scale-105 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group'
            onClick={onClick}
        >
            <div className='flex flex-row justify-between items-center gap-4 text-white text-2xl font-cbyg'>
                <div className="group-hover:text-purple-300 transition-colors">{post.id.slice(0, 12) + "..."}</div>
                {post.status === 'Active' ? <div className="bg-[#679533] rounded-[8px] p-2 text-black text-xl font-cbyg justify-end shadow-[0_0_10px_#679533]">Active</div> : <div className="bg-[#BDBDBD] rounded-[8px] p-2 text-black text-xl font-cbyg justify-center">Closed</div>}
            </div>
        </div>
    )};
        