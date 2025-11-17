import { Post } from "@/types/display";

interface NowPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: Post;
}

export default function NowPostModal({ 
    isOpen, 
    onClose, 
    post, 
}: NowPostModalProps) {
    if (!isOpen) return null;
    const truthRatioTrue = post.trueRatio;
    const truthRatioFalse = 10 - truthRatioTrue;
    const truthRatioDisplay = `${truthRatioTrue} / ${truthRatioFalse}`;

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[12px] p-6 flex flex-col gap-6 relative max-w-2xl w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                    <span className="text-gray-600 text-xl font-cbyg">X</span>
                </button>

                {/* 主要内容 */}
                <h1 className="text-black text-2xl font-cbyg text-center mt-4 whitespace-pre-wrap break-words max-w-full overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {post.content}
                </h1>

                {/* 黑色信息框 */}
                <div className="bg-black rounded-[12px] p-4 flex flex-col gap-3">
                    <div className="text-white text-xl font-cbyg">
                        Verifier : <span className="ml-2">{post.votecount}</span>
                    </div>
                    <div className="text-white text-xl font-cbyg">
                        Truth Ratio : <span className="ml-2">{truthRatioDisplay}</span>
                    </div>
                </div>

                {/* 关闭按钮 */}
                {post.status === 'Verify' && (
                    <div className="flex justify-end">
                        <button
                            className="bg-[#679533] text-white rounded-[12px] px-6 py-2 font-cbyg text-xl transition-colors hover:scale-105 duration-300"
                        >
                            Verify
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}