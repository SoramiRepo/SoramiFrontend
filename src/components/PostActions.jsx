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

                const data = await response.json();

                if (response.ok) {
                    setIsLiked(data.post.isLiked);  // Update isLiked from response
                    setLikeCount(data.post.likeCount);  // Update likeCount from response
                } else {
                    showToast(data.message || t('operationFailed'), 'error');
                }
            } catch (error) {
                console.error('Fetch Post Details Error:', error);
                showToast(t('operationFailed'), 'error');
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

            const data = await response.json();

            if (response.ok) {
                showToast(t('reposted'), 'success');
                onRepostClick?.(data.post);
            } else {
                showToast(data.message || t('repostFailed'), 'error');
            }
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

            const data = await response.json();

            if (response.ok) {
                setIsLiked(!isLiked);
                setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
                if (getCurrentUserId() !== originalPost.author._id) {
                    await createNotification(
                        'like',
                        originalPost.author._id,
                        postId,
                        `${currentUsername} liked your post`
                    );
                }
            } else {
                showToast(data.message || t('operationFailed'), 'error');
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
                    onClick={() => setShowReplyInput(prev => !prev)}
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
                        onClick={() => setShowReplies(prev => !prev)}
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
                onClick={handleLike}
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
                onClick={handleRepost}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Repeat2 size={16} />
                <span className="hidden sm:inline font-medium">{t('repost')}</span>
            </motion.button>

            <motion.button
                onClick={handleShare}
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
