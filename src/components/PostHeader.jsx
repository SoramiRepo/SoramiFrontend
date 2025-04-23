import React from 'react';
import { format } from 'timeago.js';
import { Link } from 'react-router-dom';
import UserBadges from './UserBadges';
import { useTranslation } from 'react-i18next';

function PostHeader({ post, onDelete, currentUserId, parentPost, deleting }) {
    const { t } = useTranslation();
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
            {currentUserId === post.author?._id && (
                <button
                    onClick={onDelete}
                    className="absolute top-2 right-2 text-xs text-red-500 hover:underline disabled:opacity-50 flex items-center gap-1"
                    disabled={deleting}
                >
                    {deleting ? (
                        <span className="loader border-red-500"></span>
                    ) : (
                        t('delete')
                    )}
                </button>
            )}
        </div>
    );
}

export default PostHeader;
