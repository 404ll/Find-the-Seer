import { Post } from "@/types/display";
import Image from "next/image";

interface PostDetailProps {
    post: Post;
    onClose?: () => void;
}

export default function PostDetail({ post, onClose }: PostDetailProps) {
    // 计算总票数
    const totalVotes = post.trueVotesCount + post.falseVotesCount;

    // 格式化日期
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

    // 格式化持续时间（秒转小时/分钟）
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
        }
        return `${minutes}分钟`;
    };

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-3xl mx-4 bg-white rounded-[12px] p-6 flex flex-col gap-6 border border-gray-200 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 关闭按钮 */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors z-10"
                    >
                        <span className="text-gray-600 text-xl font-cbyg">X</span>
                    </button>
                )}

                {/* 主要内容 */}
            <div className="flex flex-col gap-4">
                <h1 className="text-black text-2xl font-cbyg text-center whitespace-pre-wrap break-words max-w-full overflow-hidden" 
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {post.content}
                </h1>

                {/* 图片 */}
                {post.image && (
                    <div className="flex justify-center my-4">
                        <div className="relative w-full max-w-md h-auto rounded-lg overflow-hidden">
                            <Image 
                                src={post.image} 
                                alt="Post Image" 
                                width={300} 
                                height={300}
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 黑色信息框 */}
            <div className="bg-black rounded-[12px] p-4 flex flex-col gap-4">
                {/* 基本信息 */}
                <div className="text-white text-xl font-cbyg">
                    Status : <span className="ml-2">{post.status}</span>
                </div>
                <div className="text-white text-xl font-cbyg">
                    Created At : <span className="ml-2">{formatDate(post.createdAt)}</span>
                </div>
                <div className="text-white text-xl font-cbyg">
                    Lasting Time : <span className="ml-2">{formatDuration(post.lastingTime)}</span>
                </div>
                <div className="text-white text-xl font-cbyg">
                    Total Votes : <span className="ml-2">{totalVotes}</span>
                </div>

            </div>
            </div>
        </div>
    );
}