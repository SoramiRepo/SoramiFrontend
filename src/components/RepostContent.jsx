import React from 'react';
import { useTranslation } from 'react-i18next';
import { Repeat2 } from 'lucide-react';
import PostHeader from './PostHeader';
import PostBody from './PostBody';

const RepostContent = ({ post, onDelete, currentUserId, parentPost }) => {
    const { t } = useTranslation();

    if (!post.repost) return null;

    // 获取原始帖子（repost链的最后一个）
    const getOriginalPost = (currentPost) => {
        let post = currentPost;
        while (post.repost) {
            post = post.repost;
        }
        return post;
    };

    const originalPost = getOriginalPost(post);
    const repostAuthor = post.author;
    const originalAuthor = originalPost.author;

    return (
        <div>
            {/* Repost指示器 */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <Repeat2 size={14} className="text-gray-400" />
                <span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                        {repostAuthor?.avatarname || repostAuthor?.username}
                    </span>
                    {' '}{t('repostedBy')}{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                        {originalAuthor?.avatarname || originalAuthor?.username}
                    </span>
                </span>
            </div>

            {/* 原始帖子内容 */}
            <div>
                <PostHeader 
                    post={originalPost} 
                    onDelete={onDelete} 
                    currentUserId={currentUserId} 
                    parentPost={parentPost} 
                />
                <PostBody content={originalPost.content} />
            </div>
        </div>
    );
};

export default RepostContent;
