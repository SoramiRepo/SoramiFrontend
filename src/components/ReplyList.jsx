import React, { useState, useEffect } from 'react';
import PostContent from './PostContent';

function ReplyList({ parentId, allPosts, onDelete }) {
    const [childPosts, setChildPosts] = useState([]);

    useEffect(() => {
        // 筛选当前帖子下的所有回复
        setChildPosts(allPosts.filter(post => post.parent === parentId));
    }, [allPosts, parentId]);

    // 处理新回复
    const handleReplySuccess = (newPost) => {
        setChildPosts(prev => [...prev, newPost]);
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
                    onReplySuccess={handleReplySuccess} // 传递给 PostContent 处理回复
                />
            ))}
        </div>
    );
}

export default ReplyList;
