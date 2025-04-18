import React from 'react';
import { motion } from 'framer-motion';

function ReplyInput({ replyContent, setReplyContent, handleReplySubmit, isSubmitting }) {
    // 动画配置
    const inputAnimation = {
        initial: { opacity: 0, height: 0, marginTop: 0 },
        animate: { opacity: 1, height: 'auto', marginTop: '10px' },
        exit: { opacity: 0, height: 0, marginTop: 0 },
        transition: { duration: 0.3 },
    };

    return (
        <motion.div
            className="mt-2 ml-0 sm:ml-10 flex gap-2"
            initial={inputAnimation.initial}
            animate={inputAnimation.animate}
            exit={inputAnimation.exit}
            transition={inputAnimation.transition}
        >
            {/* 回复输入框 */}
            <input
                type="text"
                placeholder="Write your reply..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:bg-slate-800 focus:border-1 focus:border-[#2B7FFF] focus:outline-none"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}  // 用户输入时更新回复内容
            />

            {/* 提交按钮 */}
            <button
                onClick={handleReplySubmit}  // 提交回复
                className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${isSubmitting ? 'cursor-wait' : ''}`}
                disabled={isSubmitting}  // 如果正在提交则禁用按钮
            >
                {isSubmitting ? 'Replying...' : 'Reply'}  {/* 根据提交状态切换按钮文本 */}
            </button>
        </motion.div>
    );
}

export default ReplyInput;
