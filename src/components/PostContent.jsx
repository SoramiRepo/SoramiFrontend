import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PostHeader from './PostHeader';
import PostBody from './PostBody';
import PostActions from './PostActions';
import ReplyInput from './ReplyInput';
import ReplyList from './ReplyList';
import RepostContent from './RepostContent';
import config from '../config';
import { useToast } from './ToastContext';
import { createNotification } from '../utils/notificationUtils.js'
import { getCurrentUserId } from '../utils/getCurrentUserId.js';
import { useTranslation } from 'react-i18next';

function PostContent({ post, allPosts = [], onDelete, onReplySuccess, defaultExpanded = false }) {
    const [showReplies, setShowReplies] = useState(defaultExpanded);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);

    const { t } = useTranslation();
    const currentUserId = getCurrentUserId();
    const { showToast } = useToast();

    const childPosts = allPosts.filter(p => p.parent === post._id);
    const parentPost = allPosts.find(p => p._id === post.parent);

    const handleDelete = async (e) => {
        e.stopPropagation();
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (!token) return showToast('Not logged in, cannot delete posts', 'error');

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
        if (!replyContent.trim()) return null;

        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (!token) {
            showToast(`Not logged in, can't reply`, 'error');
            return null;
        }

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
                onReplySuccess?.(result.reply);
                await createNotification('reply', post.author, post._id, replyContent);
                return result.reply;
            } else {
                showToast(result.message || 'Reply failed', 'error');
                return null;
            }
        } catch (err) {
            console.error('Reply error:', err);
            showToast('Server Error', 'error');
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="relative mx-auto flex max-w-full flex-col gap-y-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 dark:text-white"
            >
                {post.repost ? (
                    <RepostContent 
                        post={post} 
                        onDelete={handleDelete} 
                        currentUserId={currentUserId} 
                        parentPost={parentPost} 
                    />
                ) : (
                    <>
                        <PostHeader post={post} onDelete={handleDelete} currentUserId={currentUserId} parentPost={parentPost} />
                        <PostBody content={post.content} />
                    </>
                )}

                <PostActions
                    postId={post._id}
                    originalPost={post}
                    setShowReplyInput={setShowReplyInput}
                    setShowReplies={setShowReplies}
                    childPosts={childPosts}
                    showReplies={showReplies}
                    isRepost={!!post.repost}
                    initialLiked={post.isLiked}
                    initialLikeCount={post.likeCount}
                />

                <AnimatePresence>
                    {showReplyInput && (
                        <ReplyInput
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            handleReplySubmit={handleReplySubmit}
                            isSubmitting={isSubmitting}
                            onClose={() => setShowReplyInput(false)}
                        />
                    )}
                </AnimatePresence>

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
