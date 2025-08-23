import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PostContent from './PostContent';
import { useTranslation } from 'react-i18next';

function PostList({ posts, setPosts }) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleDelete = (postId) => {
        setPosts(prev => {
            // 移除主帖子
            const filteredPosts = prev.filter(post => post._id !== postId);
            
            // 同时移除所有相关的子帖子（回复）
            const postsWithoutChildren = filteredPosts.filter(post => {
                // 如果这个帖子是已删除帖子的回复，也要移除
                if (post.parent === postId) {
                    return false;
                }
                return true;
            });
            
            return postsWithoutChildren;
        });
    };

    const handleReplySuccess = (newPost) => {
        console.log('Adding new post in PostList:', newPost); 
        setPosts(prev => [...prev, newPost]);
    };

    if (!posts || posts.length === 0) {
        return (
            <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('noPosts')}</p>
            </motion.div>
        );
    }

    // 确保只渲染有效的帖子（作者存在的）
    const mainPosts = posts.filter(post => post && !post.parent && post.author);

    return (
        <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <AnimatePresence>
                {mainPosts.map((post, index) => (
                    <motion.div
                        key={post._id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ 
                            duration: 0.4,
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 100,
                            damping: 15
                        }}
                        whileHover={{ 
                            y: -2,
                            transition: { duration: 0.2 }
                        }}
                        onClick={(e) => {
                            if (e.target.closest('button') || e.target.closest('img') || e.target.closest('input') || e.target.tagName === 'A') return;
                            navigate(`/post/${post._id}`);
                        }}
                        className="cursor-pointer group"
                    >
                        <div className="relative">
                            {/* Connection Line */}
                            {index < mainPosts.length - 1 && (
                                <div className="absolute left-8 top-16 w-0.5 h-6 bg-gradient-to-b from-blue-200 to-transparent dark:from-blue-700 dark:to-transparent z-0" />
                            )}
                            
                            {/* Post Content */}
                            <div className="relative z-10">
                                <PostContent
                                    post={post}
                                    allPosts={posts}
                                    onDelete={handleDelete}
                                    onReplySuccess={handleReplySuccess}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}

export default PostList;
