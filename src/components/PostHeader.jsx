import React from 'react';
import { format } from 'timeago.js';
import { Link } from 'react-router-dom';

function PostHeader({ post, onDelete, currentUserId, parentPost }) {
    return (
        <div className="flex items-start gap-x-4">
            <Link to={`/${post.author?.username}`}>
                <img
                    src={post.author?.avatarimg || '/resource/default-avatar.png'}
                    alt="avatar"
                    className="w-[40px] h-[40px] rounded-full object-cover"
                />
            </Link>
            <div>
                <div className="font-semibold text-sm text-black dark:text-white">
                    {post.author?.avatarname || post.author?.username}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    {format(post.createdAt)}
                </div>
                {/* "回复给"部分移动到名字下方 */}
                {post.parent && parentPost && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Reply to <span className="font-semibold">{parentPost.author?.avatarname || parentPost.author?.username}</span>
                    </div>
                )}
            </div>
            {currentUserId === post.author?._id && (
                <button
                    onClick={onDelete}
                    className="absolute top-2 right-2 text-xs text-red-500 hover:underline"
                >
                    Delete
                </button>
            )}
        </div>
    );
}

export default PostHeader;
