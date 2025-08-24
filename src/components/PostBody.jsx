import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ImageGrid from './ImageGrid';

function PostBody({ content, images = [] }) {
    // 从 Markdown 内容中提取图片
    const extractImagesFromMarkdown = (markdownContent) => {
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const extractedImages = [];
        let match;
        
        while ((match = imageRegex.exec(markdownContent)) !== null) {
            extractedImages.push({
                url: match[2],
                filename: match[1] || 'Image'
            });
        }
        
        return extractedImages;
    };

    // 获取所有图片（优先使用传入的 images，否则从 Markdown 提取）
    const allImages = images.length > 0 ? images : extractImagesFromMarkdown(content);

    // 过滤掉 Markdown 中的图片语法，避免显示问题
    const filteredContent = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');

    return (
        <div className="mt-2 ml-0 sm:ml-10 prose prose-slate max-w-none dark:prose-invert">
            {/* 如果有图片，先显示图片网格 */}
            {allImages.length > 0 && (
                <ImageGrid images={allImages} />
            )}
            
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // 隐藏 Markdown 中的图片，因为我们已经用网格显示了
                    img({ node, src, alt, ...props }) {
                        return null; // 不渲染 Markdown 中的图片
                    },
                    // 自定义代码块组件
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <div className="relative rounded-md overflow-auto max-h-[200px]">
                                <SyntaxHighlighter
                                    style={atomOneLight}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {filteredContent}
            </ReactMarkdown>
        </div>
    );
}

export default PostBody;
