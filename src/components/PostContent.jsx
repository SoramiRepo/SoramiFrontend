import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PostHeader from './PostHeader';
import PostBody from './PostBody';
import PostActions from './PostActions';
import ReplyInput from './ReplyInput';
import ReplyList from './ReplyList';
import RepostBox from './RepostBox';
import config from '../config';
import { useToast } from './ToastContext';
import { createNotification } from '../utils/notificationUtils.js'
import { useTranslation } from 'react-i18next';

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
    const [showSuccess, setShowSuccess] = useState(false);
    const { t } = useTranslation();
    const currentUserId = getCurrentUserId();
    const { showToast } = useToast();

    const childPosts = allPosts.filter(p => p.parent === post._id);
    const parentPost = allPosts.find(p => p._id === post.parent);

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

            if (res.ok) {
                setReplyContent('');
                setShowReplies(true);
                onReplySuccess?.(result.reply);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
                await createNotification('reply', post.author, post._id, replyContent);
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
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="relative mx-auto flex max-w-full flex-col gap-y-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 dark:text-white"
            >
                <PostHeader post={post} onDelete={handleDelete} currentUserId={currentUserId} parentPost={parentPost} />

                <RepostBox repost={post.repost} />

                <PostBody content={post.content} />

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

                {showReplyInput && (
                    <>
                        <ReplyInput
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            handleReplySubmit={handleReplySubmit}
                            isSubmitting={isSubmitting}
                        />
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-green-500 text-sm font-semibold mt-2 ml-0 sm:ml-10"
                                >
                                    {t('reply_post_success')}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

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
