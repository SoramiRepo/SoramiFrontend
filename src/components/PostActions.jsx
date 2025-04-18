import React from 'react';

function PostActions({ setShowReplyInput, setShowReplies, childPosts, showReplies }) {
    return (
        <div className="mt-4 flex gap-4 text-sm ml-0 sm:ml-10">
            <button
                onClick={() => setShowReplyInput(prev => !prev)}
                className="text-blue-500 hover:underline"
            >
                Reply
            </button>
            {childPosts.length > 0 && (
                <button
                    onClick={() => setShowReplies(prev => !prev)}
                    className="text-blue-500 hover:underline"
                >
                    {showReplies ? 'Close replies' : 'Expand Replies'}
                </button>
            )}
        </div>
    );
}

export default PostActions;
