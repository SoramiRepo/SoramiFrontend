import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'timeago.js';
import { Link } from 'react-router-dom';
import { Trash2, AlertTriangle, Check, X } from 'lucide-react';
import UserBadges from './UserBadges';
import { useTranslation } from 'react-i18next';

function PostHeader({ post, onDelete, currentUserId, parentPost, deleting }) {
    const { t } = useTranslation();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = (e) => {
        e.stopPropagation();
        onDelete(e);
        setShowDeleteConfirm(false);
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
    };

    return (
        <div className="flex items-start gap-x-4 relative">
            <Link to={`/${post.author?.username}`}>
                <img
                    src={post.author?.avatarimg || '/resource/default-avatar.png'}
                    alt="avatar"
                    className="w-[40px] h-[40px] rounded-full object-cover"
                />
            </Link>
            <div>
                <div className="flex items-center space-x-2 font-semibold text-sm text-black dark:text-white">
                    {post.author?.avatarname || post.author?.username}
                    <UserBadges badges={post.author?.badges || []} />
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    {format(post.createdAt)}
                </div>
                {post.parent && parentPost && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Reply to <span className="font-semibold">{parentPost.author?.avatarname || parentPost.author?.username}</span>
                    </div>
                )}
            </div>
            
            {/* Delete Button */}
            {currentUserId === post.author?._id && (
                <div className="absolute top-2 right-2">
                    <AnimatePresence mode="wait">
                        {!showDeleteConfirm ? (
                            <motion.button
                                key="delete-button"
                                onClick={handleDeleteClick}
                                disabled={deleting}
                                className="group relative p-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                {deleting ? (
                                    <motion.div
                                        className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                ) : (
                                    <>
                                        <Trash2 size={16} className="text-red-500 group-hover:text-red-600 dark:text-red-400 dark:group-hover:text-red-300" />
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                    </>
                                )}
                            </motion.button>
                        ) : (
                            <motion.div
                                key="delete-confirm"
                                className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl shadow-lg"
                                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                <AlertTriangle size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                                <span className="text-xs text-red-700 dark:text-red-300 font-medium whitespace-nowrap">
                                    {t('delete_confirm')}
                                </span>
                                <div className="flex items-center gap-1">
                                    <motion.button
                                        onClick={handleConfirmDelete}
                                        className="p-1 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Check size={12} />
                                    </motion.button>
                                    <motion.button
                                        onClick={handleCancelDelete}
                                        className="p-1 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X size={12} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default PostHeader;
