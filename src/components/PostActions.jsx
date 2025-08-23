import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share as ShareIcon, MessageCircle, ChevronDown, ChevronUp, Repeat2, Heart } from 'lucide-react';
import config from '../config';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';
import { createNotification } from '../utils/notificationUtils.js'
import { getCurrentUserId } from '../utils/getCurrentUserId.js';

function PostActions({
    setShowReplyInput,
    setShowReplies,
    childPosts,
    showReplies,
    postId,
    onRepostClick,
    originalPost,
    initialLiked = false,
    initialLikeCount = 0,
}) {
    const baseUrl = window.location.origin;
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [likeLoading, setLikeLoading] = useState(false);
    const currentUsername = JSON.parse(localStorage.getItem('user'))?.username;


    // Fetch post details on component mount
    useEffect(() => {
        const fetchPostDetails = async () => {
            try {
                const response = await fetch(`${config.apiBaseUrl}/api/post/${postId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}`,
                    },
                });

                if (response.status === 404) {
                    console.log('Post not found (404) in PostActions');
                    // 帖子不存在，但不显示错误提示，因为这是正常情况
                    return;
                }

                if (!response.ok) {
                    console.error('Failed to fetch post details, status:', response.status);
                    return;
                }

                const data = await response.json();
                setIsLiked(data.post.isLiked);  // Update isLiked from response
                setLikeCount(data.post.likeCount);  // Update likeCount from response
            } catch (error) {
                console.error('Fetch Post Details Error:', error);
                // 不显示错误提示，因为这可能是因为帖子被删除
            }
        };

        fetchPostDetails();
    }, [postId, showToast, t]);

    const handleShare = () => {
        const fullUrl = `${baseUrl}/post/${postId}`;
        navigator.clipboard.writeText(fullUrl);
        showToast(t('linkCopied'), 'success');
    };

    const handleRepost = async () => {
        const token = JSON.parse(localStorage.getItem('user'))?.token;

        if (!token) {
            showToast(t('pleaseLogin'), 'error');
            return;
        }

        if (!originalPost) {
            showToast(t('originalPostNotFound'), 'error');
            return;
        }

        try {
            // 检查是否是repost的repost，如果是则获取原始帖子
            let targetPostId = postId;
            let targetPost = originalPost;
            
            // 如果当前帖子是repost，则repost原始帖子而不是repost本身
            if (originalPost.repost) {
                targetPostId = originalPost.repost._id;
                targetPost = originalPost.repost;
            }

            if (!targetPost.content) {
                showToast(t('bugFound'), 'error');
                return;
            }

            const response = await fetch(`${config.apiBaseUrl}/api/post/repost`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ repostId: targetPostId }),
            });

            if (response.status === 404) {
                console.log('Post not found (404) during repost');
                showToast('Post no longer exists', 'error');
                return;
            }

            if (!response.ok) {
                const data = await response.json();
                showToast(data.message || t('repostFailed'), 'error');
                return;
            }

            const data = await response.json();
            
            // 通知由后端API创建，前端不需要重复创建
            showToast(t('reposted'), 'success');
            onRepostClick?.(data.post);
        } catch (error) {
            console.error('Repost error:', error);
            showToast(t('repostFailed'), 'error');
        }
    };

    const handleLike = async () => {
        const token = JSON.parse(localStorage.getItem('user'))?.token;

        if (!token) {
            showToast(t('pleaseLogin'), 'error');
            return;
        }

        if (likeLoading) return; // 防止重复点击
        setLikeLoading(true);

        try {
            const endpoint = isLiked ? 'unlike' : 'like';
            const response = await fetch(`${config.apiBaseUrl}/api/post/${postId}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 404) {
                console.log('Post not found (404) during like/unlike');
                showToast('Post no longer exists', 'error');
                return;
            }

            if (!response.ok) {
                const data = await response.json();
                showToast(data.message || t('operationFailed'), 'error');
                return;
            }

            const data = await response.json();
            setIsLiked(!isLiked);
            setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
            
            // 只有like时才创建通知，unlike时不创建通知
            if (!isLiked && getCurrentUserId() !== originalPost.author._id) {
                await createNotification(
                    'like',
                    originalPost.author._id,
                    postId,
                    `${currentUsername} liked your post`
                );
            }
        } catch (error) {
            console.error('Like error:', error);
            showToast(t('operationFailed'), 'error');
        } finally {
            setLikeLoading(false);
        }
    };

    return (
        <div className="mt-4 flex gap-2 text-sm ml-0 sm:ml-10 items-center">
            <div className="flex gap-2">
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowReplyInput(prev => !prev);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                        setShowReplyInput ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <MessageCircle size={16} />
                    <span className="hidden sm:inline font-medium">{t('reply')}</span>
                </motion.button>
                
                {childPosts.length > 0 && (
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowReplies(prev => !prev);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                            showReplies ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span className="hidden sm:inline font-medium">
                            {childPosts.length}
                        </span>
                    </motion.button>
                )}
            </div>

            <motion.button
                onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                }}
                disabled={likeLoading}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                    isLiked ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' : 'text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={!likeLoading ? { scale: 1.05 } : {}}
                whileTap={!likeLoading ? { scale: 0.95 } : {}}
            >
                {likeLoading ? (
                    <motion.div
                        className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                ) : (
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                )}
                <span className="hidden sm:inline font-medium">{likeCount}</span>
            </motion.button>

            <motion.button
                onClick={(e) => {
                    e.stopPropagation();
                    handleRepost();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Repeat2 size={16} />
                <span className="hidden sm:inline font-medium">{t('repost')}</span>
            </motion.button>

            <motion.button
                onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                }}
                className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <ShareIcon size={16} />
                <span className="hidden sm:inline font-medium">{t('share')}</span>
            </motion.button>
        </div>
    );
}

export default PostActions;
