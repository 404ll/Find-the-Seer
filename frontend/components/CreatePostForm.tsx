"use client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useState } from "react";
import MDEditor from "./MdEditor";
import { WalrusFile } from "@mysten/walrus";
import { uploadPostContent } from "@/utils/walrus/upload";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface CreatePostFormProps {
  onClose: () => void;
  onCreate: (address: string, blobId: string, lastingTime: number, predictedTrueBp: number) => void;
}
export default function CreatePostForm({ onClose, onCreate }: CreatePostFormProps) {
  const [epoch, setEpoch] = useState<number>(1);
  const [trueRatio, setTrueRatio] = useState<number>(7);
  const [content, setContent] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const falseRatio = 10 - trueRatio;
  const [blobId, setBlobId] = useState<string | null>(null);
  const currentAccount = useCurrentAccount();
  const handleEpochChange = (delta: number) => {
    setEpoch(prev => Math.max(1, prev + delta));
  };

  const handleTrueRatioChange = (value: number) => {
    const newValue = Math.max(1, Math.min(9, value));
    setTrueRatio(newValue);
  };

  const handleCreate = async () => {

    if (!content.trim()) {
      setUploadError("内容不能为空");
      return;
    }
    if (!currentAccount) {
      setUploadError("请先连接钱包");
      return;
    }
    // 使用代付，不需要检查钱包连接
    setIsUploading(true);
    setUploadError(null);

    try {
      // 将 content 转换为 Markdown 文件
      const markdownContent = new TextEncoder().encode(content);  
      const markdownFile = WalrusFile.from({
        contents: markdownContent,
        identifier: `post.md`,
        tags: {
          'content-type': 'text/markdown',
        },
      });

      // 上传到 walrus（使用代付 keypair，无需用户钱包签名）
      const result = await uploadPostContent({
        file: markdownFile,
        epochs: epoch,
      });

      // console.log("上传成功,blobId:", result.blobId);
      setBlobId(result.blobId);
      // 上传成功后关闭表单
      const lastingTime = epoch * 24 - 4;
      console.log("trueRatio",trueRatio)
      // trueRatio 是 1-9，表示 true:false 的比例，需要转换为万分比 (0-10000)
      // 例如：trueRatio = 7 表示 7:3，true 的比例是 7/10 = 70% = 7000 BP
      const trueBp = (trueRatio / 10) * 10000;
      onCreate(currentAccount.address, result.blobId, lastingTime, trueBp);
      // onClose();
    } catch (error) {
      console.error("上传失败:", error);
      setUploadError(error instanceof Error ? error.message : "upload failed, please try again");
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
      <Card className="relative max-w-2xl w-full mx-4 bg-white rounded-[12px] px-16 py-8 flex flex-col gap-6 text-black font-cbyg border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <span className="text-gray-600 text-xl font-cbyg">X</span>
        </button>

        <CardContent className="flex flex-col gap-6 p-0">
        <div className="flex flex-col gap-2">
        <div className="text-2xl font-cbyg">Write down your prophecy and thoughts </div>
            <MDEditor value={content} onChange={setContent} />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="text-2xl font-cbyg whitespace-nowrap">Truth ratio:</label>
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative flex items-center gap-2 flex-row">
                  <input
                    type="range"
                    min="1"
                    max="9"
                    value={trueRatio}
                    onChange={(e) => handleTrueRatioChange(Number(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-custom"
                    style={{
                      background: `linear-gradient(to right, #000 0%, #000 ${((trueRatio - 1) / 8) * 100}%, #e5e7eb ${((trueRatio - 1) / 8) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                <div className="text-center text-xl font-cbyg">
                <span className="text-black">{trueRatio}</span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-black">{falseRatio}</span>
              </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-2xl font-cbyg whitespace-nowrap">Epoch :</label>
            <div className="flex-1 flex items-center gap-2">
              <button
                onClick={() => handleEpochChange(-1)}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-md font-cbyg text-2xl transition-colors"
              >
                −
              </button>
              <div className="flex-1 bg-gray-100 border-gray-200 rounded-md px-4 py-2 text-center font-cbyg text-xl min-w-[80px]">
                {epoch}
              </div>
              <button
                onClick={() => handleEpochChange(1)}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-md font-cbyg text-2xl transition-colors"
              >
                +
              </button>
              <span className="text-xl font-cbyg text-gray-600">epochs</span>
            </div>
          </div>

          {/* <div className="flex items-center gap-4">
            <label className="text-2xl font-cbyg whitespace-nowrap">Image :</label>
            <div className="flex items-center gap-2">
              <Image src="/icon/upload.svg" alt="Upload" width={20} height={20} />
              <span className="text-black text-xl font-cbyg">Upload</span>
            </div>
          </div> */}
        </CardContent>

        {uploadError && (
          <div className="text-red-500 text-lg font-cbyg">
            {uploadError}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            disabled={isUploading}
            className="bg-black text-white rounded-md px-6 py-2 font-cbyg text-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "uploading..." : "Create"}
          </button>
        </div>
      </Card>
    </div>
  );
}
