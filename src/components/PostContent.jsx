import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PostHeader from './PostHeader';
import PostBody from './PostBody';
import PostActions from './PostActions';
import ReplyInput from './ReplyInput';
import ReplyList from './ReplyList';
import config from '../config';
import { useToast } from './ToastContext';

const getCurrentUserId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.id || user?._id || null;
    } catch {
        return null;
    }
};

function PostContent({ post, allPosts = [], onDelete, onReplySuccess, defaultExpanded = false }) {
    const [showReplies, setShowReplies] = useState(defaultExpanded);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const currentUserId = getCurrentUserId();
    const { showToast } = useToast();
    const [showSuccess, setShowSuccess] = useState(false); // 用于显示成功提示

    const childPosts = allPosts.filter(p => p.parent === post._id);  // 获取所有子回复
    const parentPost = allPosts.find(p => p._id === post.parent);    // 获取父帖子

    const handleDelete = async (e) => {
        e.stopPropagation();
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (!token) return showToast('Not logged in, cannot delete posts', 'error');

        const confirmed = window.confirm('Are you sure you want to delete this post?');
        if (!confirmed) return;

        try {
            const res = await fetch(`${config.apiBaseUrl}/api/post/delete/${post._id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await res.json();
            if (res.ok) {
                onDelete?.(post._id);
                showToast('Post deleted successfully', 'success');
            } else {
                showToast(result.message || 'Deletion failed', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Server Error: ' + err, 'error');
        }
    };

    const handleReplySubmit = async () => {
        console.log('Reply submit triggered');
        if (!replyContent.trim()) return;
    
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (!token) return showToast(`Not logged in, can't reply`, 'error');
    
        setIsSubmitting(true);
    
        try {
            const res = await fetch(`${config.apiBaseUrl}/api/post/reply/${post._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: replyContent }),
            });
    
            const result = await res.json();
    
            console.log('Full Response:', result);
    
            if (res.ok) {
                setReplyContent('');
                setShowReplies(true);
                console.log('res.ok', res.ok);
    
                if (result.reply) {  // 这里更改为 result.reply
                    console.log('result.reply', result.reply);  // 确保这里打印
                    onReplySuccess?.(result.reply);
                } else {
                    console.error('No reply returned from server');
                }
    
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
            } else {
                showToast(result.message || 'Reply failed', 'error');
            }
        } catch (err) {
            console.error('Reply error:', err);
            showToast('Server Error', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                key={post._id} // 为了触发动画，确保每个 Post 的 key 唯一
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }} // 删除时淡出并向下移动
                transition={{ duration: 0.3 }}
                className="relative mx-auto flex max-w-full flex-col gap-y-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 dark:text-white"
            >
                {/* 头像 + 名称 + 时间 */}
                <PostHeader post={post} onDelete={handleDelete} currentUserId={currentUserId} parentPost={parentPost} />

                {/* 正文 */}
                <PostBody content={post.content} />

                {/* 按钮区 */}
                <PostActions
                    setShowReplyInput={setShowReplyInput}
                    setShowReplies={setShowReplies}
                    childPosts={childPosts}
                    showReplies={showReplies}
                />

                {/* 回复输入框 */}
                {showReplyInput && (
                    <>
                        <ReplyInput
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            handleReplySubmit={handleReplySubmit}
                            isSubmitting={isSubmitting}
                        />

                        {/* 回复成功动画 */}
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-green-500 text-sm font-semibold mt-2 ml-0 sm:ml-10"
                                >
                                    ✅ Reply posted successfully!
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {/* 嵌套回复 */}
                {showReplies && (
                    <ReplyList
                        parentId={post._id}
                        allPosts={allPosts}
                        onDelete={onDelete}
                        onReplySuccess={onReplySuccess}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
}

export default PostContent;
