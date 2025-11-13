"use client";
import { useState } from "react";

interface MDEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MDEditor({ value, onChange }: MDEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  const parseMarkdown = (md: string) => {
    let html = md;
    // 标题
    html = html.replace(
      /^### (.*?)$/gm,
      '<h3 className="text-lg font-bold">$1</h3>'
    );
    html = html.replace(
      /^## (.*?)$/gm,
      '<h2 className="text-xl font-bold">$1</h2>'
    );
    html = html.replace(
      /^# (.*?)$/gm,
      '<h1 className="text-2xl font-bold">$1</h1>'
    );
    // 粗体
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // 斜体
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // 代码块
    html = html.replace(
      /`(.*?)`/g,
      '<code className="bg-gray-100 px-2 py-1 rounded">$1</code>'
    );
    // 换行
    html = html
      .split("\n")
      .map((line, idx) => `<p key="${idx}">${line}</p>`)
      .join("");
    return html;
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setIsPreview(false)}
            className={`px-3 py-1 rounded font-cbyg text-sm transition-all ${
              !isPreview
                ? "bg-black text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`px-3 py-1 rounded font-cbyg text-sm transition-all ${
              isPreview
                ? "bg-black text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            Preview
          </button>
        </div>
        <span className="text-xs text-gray-500 font-cbyg">
          Support Markdown
        </span>
      </div>

      {!isPreview ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Start writing your post like this:
# Is it raining ?
## love rainy days, looks like it’s about to rain in Chengdu today. I bet it’s raining where you are too!`}
          className="w-full min-h-64 p-4 bg-gray-100 border-2 border-gray-200 rounded-md font-cbyg text-sm leading-relaxed focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
        />
      ) : (
        <div className="w-full min-h-64 p-4 bg-gray-50 border-2 border-gray-200 rounded-md font-cbyg text-sm leading-relaxed overflow-auto">
          {value ? (
            <div className="prose prose-sm max-w-none">
              {value.split("\n").map((line, idx) => {
                const trimmedLine = line.trim();
                
                // 处理标题（必须在行首）
                if (trimmedLine.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="text-lg font-bold mt-2 mb-1">
                      {trimmedLine.replace(/^### /, "")}
                    </h3>
                  );
                }
                if (trimmedLine.startsWith("## ")) {
                  return (
                    <h2 key={idx} className="text-xl font-bold mt-3 mb-2">
                      {trimmedLine.replace(/^## /, "")}
                    </h2>
                  );
                }
                if (trimmedLine.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-2xl font-bold mt-4 mb-2">
                      {trimmedLine.replace(/^# /, "")}
                    </h1>
                  );
                }
                
                // 处理列表项
                if (trimmedLine.startsWith("- ")) {
                  return (
                    <ul key={idx} className="list-disc list-inside mb-2">
                      <li className="ml-2">
                        {trimmedLine.replace(/^- /, "")}
                      </li>
                    </ul>
                  );
                }
                
                // 处理空行
                if (trimmedLine === "") {
                  return <br key={idx} />;
                }
                
                // 处理普通文本中的格式
                let formattedText = line;
                // 先处理粗体（避免与斜体冲突）
                formattedText = formattedText.replace(
                  /\*\*(.*?)\*\*/g,
                  "<strong>$1</strong>"
                );
                // 处理行内代码（在斜体之前处理，避免冲突）
                formattedText = formattedText.replace(
                  /`(.*?)`/g,
                  "<code className='bg-gray-100 px-1 py-0.5 rounded text-sm'>$1</code>"
                );
                // 处理斜体（单星号，且不在粗体和代码中）
                formattedText = formattedText.replace(
                  /(^|[^*])\*([^*]+?)\*([^*]|$)/g,
                  "$1<em>$2</em>$3"
                );

                return (
                  <p
                    key={idx}
                    className="mb-1 text-black"
                    dangerouslySetInnerHTML={{ __html: formattedText }}
                  />
                );
              })}
            </div>
          ) : (
            <span className="text-gray-400">Preview will show here...</span>
          )}
        </div>
      )}
    </div>
  );
}
