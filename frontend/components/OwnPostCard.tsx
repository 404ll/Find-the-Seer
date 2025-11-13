import { Post } from '@/types/display';

interface OwnPostCardProps {    
    post: Post;
    onClick?: () => void;
}


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
    return plainText.length > 0 ? (plainText.slice(0, 25) + (plainText.length > 25 ? "..." : "")) : "No title";
}

export default function OwnPostCard({ post, onClick }: OwnPostCardProps) {

    return (
        <div 
            className='bg-black rounded-[12px] p-4 flex flex-col gap-4 hover:scale-105 transition-all duration-300 cursor-pointer'
            onClick={onClick}
        >
            <div className='flex flex-row justify-between items-center gap-4 text-white text-2xl font-cbyg'>
                <div>{getTitle(post.content)}</div>
                {post.status === 'Active' ? <div className="bg-[#679533] rounded-[8px] p-2 text-black text-xl font-cbyg justify-end">Active</div> : <div className="bg-[#BDBDBD] rounded-[8px] p-2 text-white text-xl font-cbyg justify-center">Closed</div>}
            </div>
        </div>
    )};
        