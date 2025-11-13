import React from 'react';

/**
 * 解析 Markdown 文本并返回 React 元素数组
 * 支持：标题、粗体、斜体、代码、列表、引用等
 */
export const parseMarkdown = (md: string): React.ReactNode[] => {
  if (!md || md.trim() === '') {
    return [React.createElement('p', { key: 'empty', className: 'text-gray-400' }, 'No content')];
  }

  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  const processInlineFormatting = (text: string): React.ReactNode => {
    // 处理行内代码（优先处理，避免与其他格式冲突）
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    const codeRegex = /`([^`]+)`/g;
    let match;

    while ((match = codeRegex.exec(text)) !== null) {
      // 添加代码前的文本
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(...processTextFormatting(beforeText));
      }
      // 添加代码
      parts.push(
        React.createElement(
          'code',
          {
            key: `code-${match.index}`,
            className: 'bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono',
          },
          match[1]
        )
      );
      lastIndex = match.index + match[0].length;
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(...processTextFormatting(remainingText));
    }

    return parts.length > 0 ? React.createElement(React.Fragment, {}, ...parts) : text;
  };

  const processTextFormatting = (text: string): React.ReactNode[] => {
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    // 处理粗体 **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        // 处理斜体
        parts.push(...processItalic(beforeText));
      }
      parts.push(
        React.createElement(
          'strong',
          { key: `bold-${match.index}`, className: 'font-bold' },
          match[1]
        )
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(...processItalic(remainingText));
    }

    return parts.length > 0 ? parts : [text];
  };

  const processItalic = (text: string): React.ReactNode[] => {
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    // 处理斜体 *text*（不在粗体和代码中）
    const italicRegex = /(^|[^*])\*([^*]+?)\*([^*]|$)/g;
    let match;

    while ((match = italicRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        React.createElement(
          'em',
          { key: `italic-${match.index}`, className: 'italic' },
          match[2]
        )
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(
          React.createElement(
            'ul',
            {
              key: `ul-${elements.length}`,
              className: 'list-disc list-inside mb-1 ml-4',
            },
            ...listItems.map((item, idx) =>
              React.createElement(
                'li',
                { key: idx, className: 'mb-0.5' },
                processInlineFormatting(item)
              )
            )
          )
        );
      } else {
        elements.push(
          React.createElement(
            'ol',
            {
              key: `ol-${elements.length}`,
              className: 'list-decimal list-inside mb-1 ml-4',
            },
            ...listItems.map((item, idx) =>
              React.createElement(
                'li',
                { key: idx, className: 'mb-0.5' },
                processInlineFormatting(item)
              )
            )
          )
        );
      }
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim();

    // 空行
    if (trimmedLine === '') {
      flushList();
      elements.push(React.createElement('br', { key: `br-${idx}` }));
      return;
    }

    // 标题
    if (trimmedLine.startsWith('### ')) {
      flushList();
      elements.push(
        React.createElement(
          'h3',
            {
              key: `h3-${idx}`,
              className: 'text-lg font-bold text-black mt-2 mb-0.5',
            },
          processInlineFormatting(trimmedLine.replace(/^### /, ''))
        )
      );
      return;
    }
    if (trimmedLine.startsWith('## ')) {
      flushList();
      elements.push(
        React.createElement(
          'h2',
            {
              key: `h2-${idx}`,
              className: 'text-xl font-bold text-black mt-2 mb-0.5',
            },
          processInlineFormatting(trimmedLine.replace(/^## /, ''))
        )
      );
      return;
    }
    if (trimmedLine.startsWith('# ')) {
      flushList();
      elements.push(
        React.createElement(
          'h1',
            {
              key: `h1-${idx}`,
              className: 'text-2xl font-bold text-black mt-2 mb-0.5',
            },
          processInlineFormatting(trimmedLine.replace(/^# /, ''))
        )
      );
      return;
    }

    // 引用
    if (trimmedLine.startsWith('> ')) {
      flushList();
      elements.push(
        React.createElement(
          'blockquote',
            {
              key: `quote-${idx}`,
              className: 'border-l-4 border-gray-300 pl-4 my-1 italic text-gray-700',
            },
          processInlineFormatting(trimmedLine.replace(/^> /, ''))
        )
      );
      return;
    }

    // 无序列表
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(trimmedLine.replace(/^[-*] /, ''));
      return;
    }

    // 有序列表
    const orderedListMatch = trimmedLine.match(/^(\d+)\.\s(.+)$/);
    if (orderedListMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(orderedListMatch[2]);
      return;
    }

    // 普通段落
    flushList();
    elements.push(
      React.createElement(
        'p',
          {
            key: `p-${idx}`,
            className: 'text-black text-xl leading-normal mb-0.5',
          },
        processInlineFormatting(trimmedLine)
      )
    );
  });

  // 处理剩余的列表项
  flushList();

  return elements.length > 0
    ? elements
    : [React.createElement('p', { key: 'empty', className: 'text-gray-400' }, 'No content')];
};
