import React from 'react';
import { Share as ShareIcon, MessageCircle, ChevronDown, ChevronUp, Repeat2 } from 'lucide-react';
import config from '../config';
import { useToast } from './ToastContext';

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

    const handleShare = () => {
        const fullUrl = `${baseUrl}/post/${postId}`;
        navigator.clipboard.writeText(fullUrl);
        showToast('Link copied!', 'success');
    };

    const handleRepost = async () => {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        
        if (!token) {
            showToast('Please login', 'error');
            return;
        }

        if (!originalPost) {
            showToast('Original post not found', 'error');
            return;
        }

        try {
            // 目前有bug，所以不要用
            if (!originalPost.content) {
                showToast('有bug，别用', 'error');
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
                showToast('Reposted', 'success');
                // Update the UI to show reposted post
                onRepostClick?.(data.post); // Calling parent component's callback to update the UI
            } else {
                showToast(data.message || 'Repost Failed', 'error');
            }
        } catch (error) {
            console.error('Repost error:', error);
            showToast('Repost Failed', 'error');
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
                    <span className="hidden sm:inline">Reply</span>
                </button>
                {childPosts.length > 0 && (
                    <button
                        onClick={() => setShowReplies(prev => !prev)}
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                        {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span className="hidden sm:inline">
                            {showReplies ? 'Close replies' : 'Expand Replies'}
                        </span>
                    </button>
                )}
            </div>
            <button
                onClick={handleShare}
                className="ml-auto text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
                <ShareIcon size={16} />
                <span className="hidden sm:inline">Share</span>
            </button>

            <button
                onClick={handleRepost}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
                <Repeat2 size={16} />
                <span className="hidden sm:inline">Repost</span>
            </button>
        </div>
    );
}

export default PostActions;
