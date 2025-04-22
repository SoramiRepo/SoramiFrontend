import React from 'react';
import { Share as ShareIcon, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from './ToastContext';

function PostActions({ setShowReplyInput, setShowReplies, childPosts, showReplies, postId }) {
    const baseUrl = window.location.origin;
    const { showToast } = useToast();

    const handleShare = () => {
        const fullUrl = `${baseUrl}/post/${postId}`;
        navigator.clipboard.writeText(fullUrl);
        showToast('Link copied!', 'success');
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
        </div>
    );
}

export default PostActions;
