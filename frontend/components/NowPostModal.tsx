interface NowPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    verifier?: string;
    truthRatio?: string;
}

export default function NowPostModal({ 
    isOpen, 
    onClose, 
    content, 
    verifier = "100", 
    truthRatio = "70%" 
}: NowPostModalProps) {
    if (!isOpen) return null;

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
                <div className="bg-black rounded-[12px] p-4 flex flex-col gap-3">
                    <div className="text-white text-xl font-cbyg">
                        Verifier : <span className="ml-2">{verifier}</span>
                    </div>
                    <div className="text-white text-xl font-cbyg">
                        Truth Ratio : <span className="ml-2">{truthRatio}</span>
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