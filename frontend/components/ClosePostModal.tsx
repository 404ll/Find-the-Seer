interface ClosePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    verifier: string;
    truthRatio: string;
    reward: string;
    trueVotesCount: number;
    falseVotesCount: number;
}

export default function ClosePostModal({ 
    isOpen, 
    onClose, 
    content, 
    verifier, 
    truthRatio, 
    reward, 
    trueVotesCount, 
    falseVotesCount
}: ClosePostModalProps) {
    if (!isOpen) return null;

    // 计算总票数和百分比
    const totalVotes = trueVotesCount + falseVotesCount;
    const truePercentage = totalVotes > 0 ? Math.round((trueVotesCount / totalVotes) * 100) : 0;
    const falsePercentage = totalVotes > 0 ? Math.round((falseVotesCount / totalVotes) * 100) : 0;

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
                <h1 className="text-black text-3xl font-cbyg text-center mt-4">
                    {content}
                </h1>

                {/* 黑色信息框 */}
                <div className="bg-black rounded-[12px] p-4 flex flex-col gap-4">
                    <div className="text-white text-xl font-cbyg">
                        Verifier : <span className="ml-2">{verifier}</span>
                    </div>
                    <div className="text-white text-xl font-cbyg">
                        Truth Ratio : <span className="ml-2">{truthRatio}</span>
                    </div>
                    <div className="text-white text-xl font-cbyg">
                       Your Reward : <span className="ml-2">{reward}</span>
                    </div>
                    
                    {/* TRUE/FALSE 进度条 */}
                    <div className="flex flex-col gap-2 mt-2">
                        {/* TRUE 进度条 */}
                        <div className="flex items-center gap-2">
                            <span className="text-white text-xl font-cbyg whitespace-nowrap">[ TRUE</span>
                            <div className="flex-1 h-3 bg-transparent border border-white border-dashed rounded relative overflow-hidden">
                                <div 
                                    className="h-full bg-white bg-opacity-30"
                                    style={{ 
                                        width: `${truePercentage}%`,
                                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)'
                                    }}
                                />
                            </div>
                            <span className="text-white text-xl font-cbyg whitespace-nowrap">{truePercentage}% ]</span>
                        </div>
                        
                        {/* FALSE 进度条 */}
                        <div className="flex items-center gap-2">
                            <span className="text-white text-xl font-cbyg whitespace-nowrap">[ FALSE</span>
                            <div className="flex-1 h-3 bg-transparent border border-white border-dashed rounded relative overflow-hidden">
                                <div 
                                    className="h-full bg-white bg-opacity-30"
                                    style={{ 
                                        width: `${falsePercentage}%`,
                                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)'
                                    }}
                                />
                            </div>
                            <span className="text-white text-xl font-cbyg whitespace-nowrap">{falsePercentage}% ]</span>
                        </div>
                    </div>
                </div>

                {/* 关闭按钮 */}
                <div className="flex justify-end">
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white rounded-[12px] px-6 py-2 font-cbyg text-xl transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}