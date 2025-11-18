import { Post, PostStatus } from '@/types/display';

interface PostCardProps {
    post: Post;
    onVotePost: (postId: string, vote_choice: boolean) => void;
    onVerifyPost: (postId: string) => void;
    onClick?: () => void;
}

export default function PostCard({ post, onVotePost, onClick,onVerifyPost }: PostCardProps) {
    const handleCardClick = (e: React.MouseEvent) => {
        // 如果点击的是按钮，不触发卡片点击
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        onClick?.();
    };

    const getTitle = (content: string) => {
        // 查找第一个标题（以 # 开头的行）
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            // 匹配 #、##、### 等标题
            if (trimmedLine.startsWith('# ')) {
                return trimmedLine.replace(/^#\s+/, '');
            }
            if (trimmedLine.startsWith('## ')) {
                return trimmedLine.replace(/^##\s+/, '');
            }
            if (trimmedLine.startsWith('### ')) {
                return trimmedLine.replace(/^###\s+/, '');
            }
        }
        // 如果没有找到标题，返回前50个字符作为预览
        const plainText = content.replace(/#+\s/g, "").replace(/[*_`[\]()]/g, "").trim();
        return plainText.length > 0 ? (plainText.slice(0, 50) + (plainText.length > 50 ? "..." : "")) : "No title";
    }

    return (
        <div 
            className='bg-white rounded-[12px] p-4 flex flex-col gap-4 cursor-pointer hover:scale-105 transition-transform duration-300' 
            onClick={handleCardClick}
        >
            {/*显示第一个标题*/}
            <h1 className='text-black text-2xl font-cbyg text-center'>{getTitle(post.content)}</h1>

            <hr className='border-black border-1' />
            <div className={`flex flex-row items-center gap-4 text-white text-xl font-cbyg ${post.status === PostStatus.Active ? 'justify-between' : 'justify-end'}`}>    
                {/* 截止时间 */} 
                {post.status === 'Active' && <div className='text-white bg-[#BDBDBD] rounded-[12px] p-2 text-base font-cbyg items-center flex'>Deadline: <span className='ml-2'>{post.deadline}</span></div>}
                <div className='flex flex-row justify-end gap-4' onClick={(e) => e.stopPropagation()}>
                    <button className='bg-black text-white rounded-[12px] p-2 font-cbyg text-xl hover:scale-105 transition-all duration-300' onClick={() => onVotePost(post.id, true)}>True</button>
                    <button className='bg-black text-white rounded-[12px] p-2 font-cbyg text-xl hover:scale-105 transition-all duration-300' onClick={() => onVotePost(post.id, false)}>False</button>
                    { <button className='bg-[#679533] text-white rounded-[12px] p-2 font-cbyg text-xl hover:scale-105 transition-all duration-300' onClick={()=>onVerifyPost(post.id)}>Verify</button>}
                </div>
            </div>
        </div>
    );
}