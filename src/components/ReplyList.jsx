import React, { useState, useEffect } from 'react';
import PostContent from './PostContent';

function ReplyList({ parentId, allPosts, onDelete }) {
    const [childPosts, setChildPosts] = useState([]);

    useEffect(() => {
        // 获取父帖的所有子帖并按时间倒序排序
        const filteredPosts = allPosts.filter(post => post.parent === parentId);
        setChildPosts(filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }, [allPosts, parentId]);

    const handleReplySuccess = (newPost) => {
        setChildPosts(prev => [newPost, ...prev]);
    };

    if (childPosts.length === 0) return null;

    return (
        <div className="mt-4 ml-0 sm:ml-10 space-y-4">
            {childPosts.map((child) => (
                <PostContent
                    key={child._id}
                    post={child}
                    allPosts={allPosts}
                    onDelete={onDelete}
                    onReplySuccess={handleReplySuccess}
                />
            ))}
        </div>
    );
}

export default ReplyList;
