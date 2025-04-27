import React, { useState, useEffect } from 'react';
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
            if (!originalPost.content) {
                showToast(t('bugFound'), 'error');
                return;
            }

            const response = await fetch(`${config.apiBaseUrl}/api/post/repost`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ repostId: postId }),
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
        <div className="mt-4 flex gap-4 text-sm ml-0 sm:ml-10 items-center">
            <div className="flex gap-4">
                <button
                    onClick={() => setShowReplyInput(prev => !prev)}
                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                    <MessageCircle size={16} />
                    <span className="hidden sm:inline">{t('reply')}</span>
                </button>
                {childPosts.length > 0 && (
                    <button
                        onClick={() => setShowReplies(prev => !prev)}
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                        {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span className="hidden sm:inline">
                            {showReplies ? t('closeReplies') : t('expandReplies')}
                        </span>
                    </button>
                )}
            </div>

            <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'} ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {likeLoading ? (
                    <div className="w-4 h-4 border-2 border-t-2 border-gray-400 rounded-full animate-spin"></div>
                ) : (
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                )}
                <span className="hidden sm:inline">{likeCount}</span>
            </button>

            <button
                onClick={handleShare}
                className="ml-auto text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
                <ShareIcon size={16} />
                <span className="hidden sm:inline">{t('share')}</span>
            </button>

            <button
                onClick={handleRepost}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
                <Repeat2 size={16} />
                <span className="hidden sm:inline">{t('repost')}</span>
            </button>
        </div>
    );
}

export default PostActions;
