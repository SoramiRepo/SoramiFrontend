import React, { useState } from 'react';
import config from '../config';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';
import ImageUpload from './ImageUpload';

function PostInput({ onPostSuccess }) {
    const [postContent, setPostContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showToast } = useToast();
    const { t } = useTranslation();

    const handlePostSubmit = async () => {
        if (!postContent.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) {
                showToast(t('notLogin'), 'error');
                return;
            }

            const res = await fetch(`${config.apiBaseUrl}/api/post/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: postContent }),
            });

            const data = await res.json();
            if (res.ok) {
                setPostContent("");
                onPostSuccess(data.post);
            } else {
                setError(data.message || t('unknownError'));
            }
        } catch (err) {
            console.error(err);
            setError(t('postFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleMarkdownInsert = (markdown) => {
        // 在光标位置插入Markdown
        const textarea = document.querySelector('textarea');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = postContent.substring(0, start) + markdown + postContent.substring(end);
            setPostContent(newContent);
            
            // 设置光标位置到插入内容之后
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + markdown.length, start + markdown.length);
            }, 0);
        }
    };

    return (
        <div className="p-4 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
                {/* 文本输入区域 */}
                <div className="relative">
                    <textarea
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:text-slate-100 dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        rows="4"
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder={t('shareIdeaHere')}
                        disabled={loading}
                    />
                    
                    {/* 字符计数 */}
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {postContent.length}/1000
                    </div>
                </div>
                
                {/* 图片上传区域 */}
                <ImageUpload 
                    onMarkdownInsert={handleMarkdownInsert}
                    maxImages={9}
                />
                
                {/* 错误提示 */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                )}
                
                {/* 提交按钮 */}
                <div className="flex justify-end">
                    <button
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                            postContent.trim() && !loading
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={handlePostSubmit}
                        disabled={!postContent.trim() || loading}
                    >
                        {loading ? (
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>{t('posting')}</span>
                            </div>
                        ) : (
                            t('post')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PostInput;
