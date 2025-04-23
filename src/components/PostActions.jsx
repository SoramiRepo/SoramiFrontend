import React from 'react';
import { Share as ShareIcon, MessageCircle, ChevronDown, ChevronUp, Repeat2 } from 'lucide-react';
import config from '../config';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';

function PostActions({
    setShowReplyInput,
    setShowReplies,
    childPosts,
    showReplies,
    postId,
    onRepostClick,
    originalPost
}) {
    const baseUrl = window.location.origin;
    const { showToast } = useToast();
    const { t } = useTranslation();

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
