import { Post } from "@/types/display";
import { parseMarkdown } from "@/utils/markdownParse";
interface PostDetailProps {
    post: Post;
    onClose?: () => void;
}

export default function PostDetail({ post, onClose }: PostDetailProps) {
    // 计算总票数
    const truthRatioTrue = post.trueRatio;
    const truthRatioFalse = 10 - truthRatioTrue;
    const truthRatioDisplay = post.status === 'Closed' ? `${truthRatioTrue} / ${truthRatioFalse}` : '??? / ???';
    return (
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-3xl bg-white rounded-sm p-1 flex flex-col gap-0 shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 装饰性边框效果 */}
                <div className="absolute -top-2 -left-2 w-full h-full border-2 border-white/30 -z-10 pointer-events-none"></div>
                <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-white/30 -z-10 pointer-events-none"></div>

                {/* 内容容器 */}
                <div className="bg-white p-6 md:p-8 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200">
                    {/* 关闭按钮 */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 group z-20"
                        >
                            <div className="relative">
                                <span className="text-4xl font-cbyg text-black group-hover:scale-110 transition-transform inline-block">X</span>
                                <span className="absolute top-0 left-0 text-4xl font-cbyg text-red-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-[2px] group-hover:-translate-y-[2px] transition-all -z-10">X</span>
                            </div>
                        </button>
                    )}

                    {/* 标题/内容区域 */}
                    <div className="mb-8">
                        <div
                            className="text-black text-2xl md:text-3xl font-cbyg leading-relaxed whitespace-pre-wrap break-words"
                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                        >
                            {parseMarkdown(post.content)}
                        </div>
                    </div>

                    <hr className="border-black border-2 mb-8" />

                    {/* 黑色信息框 - 重新设计为更粗犷的样式 */}
                    <div className="bg-black text-white p-6 relative overflow-hidden group">
                        {/* 装饰背景 */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 relative z-10">
                            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                <span className="font-cbyg text-gray-400 text-xl">Status</span>
                                <span className="font-cbyg text-2xl text-white">{post.status}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                <span className="font-cbyg text-gray-400 text-xl">Created</span>
                                <span className="font-cbyg text-xl text-white">{post.createdAt}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                <span className="font-cbyg text-gray-400 text-xl">Deadline</span>
                                <span className="font-cbyg text-xl text-white">{post.deadline}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                <span className="font-cbyg text-gray-400 text-xl">Duration</span>
                                <span className="font-cbyg text-2xl text-white">{Math.round(post.lastingTime)}h</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                <span className="font-cbyg text-gray-400 text-xl">Votes</span>
                                <span className="font-cbyg text-2xl text-white">{post.votecount}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                <span className="font-cbyg text-gray-400 text-xl">Truth Ratio</span>
                                <span className="font-cbyg text-2xl text-white tracking-widest">{truthRatioDisplay}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}