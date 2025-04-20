import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PostHeader from './PostHeader';
import PostBody from './PostBody';
import PostActions from './PostActions';
import ReplyInput from './ReplyInput';
import ReplyList from './ReplyList';
import config from '../config';

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

    const childPosts = allPosts.filter(p => p.parent === post._id);
    const parentPost = allPosts.find(p => p._id === post.parent);

    const handleDelete = async (e) => {
        e.stopPropagation();
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (!token) return alert('Not logged in, cannot delete posts');

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
            } else {
                alert(result.message || 'Deletion failed');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Server Error: ' + err);
        }
    };

    const handleReplySubmit = async () => {
        if (!replyContent.trim()) return;
    
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (!token) return alert(`Not logged in, can't reply`);
    
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
    
            if (res.ok) {
                setReplyContent('');
                setShowReplies(true);
    
                if (result.newPost) {
                    onReplySuccess?.(result.newPost); // 调用回调更新父级的 childPosts
                }
    
                alert(result.message);
            } else {
                alert(result.message || 'Reply failed');
            }
        } catch (err) {
            console.error('Reply error:', err);
            alert('Server Error');
        } finally {
            setIsSubmitting(false);
        }
    };
    

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative mx-auto flex max-w-full flex-col gap-y-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10  dark:text-white`}
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
                <ReplyInput
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    handleReplySubmit={handleReplySubmit}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* 嵌套回复 */}
            {showReplies && childPosts.length > 0 && (
                <ReplyList
                    parentId={post._id}
                    allPosts={allPosts}
                    onDelete={onDelete}
                    onReplySuccess={onReplySuccess} // 确保传递了 `onReplySuccess`
                />
            )}
        </motion.div>
    );
}

export default PostContent;
