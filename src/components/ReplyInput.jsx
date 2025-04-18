import React from 'react';
import { motion } from 'framer-motion';

function ReplyInput({ replyContent, setReplyContent, handleReplySubmit, isSubmitting, handlePostSuccess }) {
    const inputAnimation = {
        initial: { opacity: 0, height: 0, marginTop: 0 },
        animate: { opacity: 1, height: 'auto', marginTop: '10px' },
        exit: { opacity: 0, height: 0, marginTop: 0 },
        transition: { duration: 0.3 },
    };

    const submitReply = async () => {
        // Call handleReplySubmit to submit the reply
        const newPost = await handleReplySubmit(); // Make sure handleReplySubmit returns newPost
        if (newPost) {
            handlePostSuccess(newPost); // Update post list with the new post
        }
    };

    return (
        <motion.div
            className="mt-2 ml-0 sm:ml-10 flex gap-2"
            initial={inputAnimation.initial}
            animate={inputAnimation.animate}
            exit={inputAnimation.exit}
            transition={inputAnimation.transition}
        >
            <input
                type="text"
                placeholder="Write your reply..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:bg-slate-800 focus:border-1 focus:border-[#2B7FFF] focus:outline-none"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}  // Update replyContent as user types
            />

            <button
                onClick={submitReply}
                className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${isSubmitting ? 'cursor-wait' : ''}`}
                disabled={isSubmitting}  // Disable button if submitting
            >
                {isSubmitting ? 'Replying...' : 'Reply'}
            </button>
        </motion.div>
    );
}

export default ReplyInput;
