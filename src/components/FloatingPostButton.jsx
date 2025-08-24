import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Send } from 'lucide-react';
import config from '../config';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';
import ImageUpload from './ImageUpload';

function FloatingPostButton({ onPostSuccess }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
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
                setIsModalOpen(false);
                showToast(t('postSuccess'), 'success');
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

    const handleCloseModal = () => {
        if (!loading) {
            setIsModalOpen(false);
            setPostContent("");
            setError(null);
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

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isModalOpen && !loading) {
                handleCloseModal();
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleEscKey);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen, loading]);

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                data-post-button
                className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-600"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                aria-label={t('createPost')}
            >
                <Plus size={24} />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-50 bg-white/20 dark:bg-black/20 backdrop-blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                        />
                        
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.div
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] flex flex-col border border-white/20 dark:border-gray-700/50"
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Modal Header - 固定在顶部 */}
                                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                                        {t('createPost')}
                                    </h2>
                                    <motion.button
                                        onClick={handleCloseModal}
                                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        disabled={loading}
                                    >
                                        <X size={20} />
                                    </motion.button>
                                </div>

                                {/* Modal Body - 可滚动区域 */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                                    <div className="space-y-4">
                                        {/* 文本输入区域 */}
                                        <div className="relative">
                                            <textarea
                                                className="w-full p-4 border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                rows="6"
                                                value={postContent}
                                                onChange={(e) => setPostContent(e.target.value)}
                                                placeholder={t('shareIdeaHere')}
                                                disabled={loading}
                                            />
                                            
                                            {/* 字符计数 */}
                                            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                                {postContent.length}/1000
                                            </div>
                                        </div>
                                        
                                        {/* 图片上传区域 */}
                                        <ImageUpload 
                                            onMarkdownInsert={handleMarkdownInsert}
                                            maxImages={9}
                                        />
                                        
                                        {error && (
                                            <motion.div
                                                className="p-3 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-lg"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Modal Footer - 固定在底部，始终可见 */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:space-x-3 space-y-2 sm:space-y-0 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        💡 {t('markdownSupportHint')}
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <motion.button
                                            onClick={handleCloseModal}
                                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 rounded-lg"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            disabled={loading}
                                        >
                                            {t('cancel')}
                                        </motion.button>
                                        
                                        <motion.button
                                            onClick={handlePostSubmit}
                                            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                postContent.trim() && !loading
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            }`}
                                            whileHover={postContent.trim() && !loading ? { scale: 1.05 } : {}}
                                            whileTap={postContent.trim() && !loading ? { scale: 0.95 } : {}}
                                            disabled={!postContent.trim() || loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <motion.div
                                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    />
                                                    <span>{t('posting')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} />
                                                    <span>{t('post')}</span>
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default FloatingPostButton;
