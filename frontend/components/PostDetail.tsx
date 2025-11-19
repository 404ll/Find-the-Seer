import { Post, PostStatus } from "@/types/display";
import { parseMarkdown } from "@/utils/markdownParse";
interface PostDetailProps {
    post: Post;
    onClose?: () => void;
}

export default function PostDetail({ post, onClose }: PostDetailProps) {
    // 计算总票数
    const truthRatioTrue = post.trueRatio;
    const truthRatioFalse = 10 - truthRatioTrue;
    const truthRatioDisplay = `${truthRatioTrue} / ${truthRatioFalse}`;
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
                <div
                    className="text-black text-2xl font-cbyg text-center whitespace-pre-wrap break-words max-w-full overflow-hidden"
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                    {parseMarkdown(post.content)}
                </div>
            </div>

            {/* 黑色信息框 */}
            <div className="bg-black rounded-[12px] p-4 flex flex-col gap-4">
                {/* 基本信息 */}
                <div className="text-white text-xl font-cbyg">
                    Status : <span className="ml-2">{post.status}</span>
                </div>
                <div className="text-white text-xl font-cbyg">
                    Created At : <span className="ml-2">{post.createdAt}</span>
                </div>
                <div className="text-white text-xl font-cbyg">
                  Verify  Deadline : <span className="ml-2">{post.deadline}</span>
                </div>
                <div className="text-white text-xl font-cbyg">
                   Lasting Time : <span className="ml-2">{Math.round(post.lastingTime)} hours</span>
                </div>
                <div className="text-white text-xl font-cbyg">
                    Total Votes : <span className="ml-2">{post.votecount}</span>
                </div>
                <div className="text-white text-xl font-cbyg">
                    Truth Ratio : <span className="ml-2">{truthRatioDisplay}</span>
                </div>

            </div>
            </div>
        </div>
    );
}