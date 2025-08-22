import React, { useState, useEffect, useMemo } from 'react';
import ReplyItem from './ReplyItem';
import { useTranslation } from 'react-i18next';

function ReplyList({ parentId, allPosts, onDelete, onReplySuccess }) {
    const [childPosts, setChildPosts] = useState([]);
    const { t } = useTranslation();

    // 使用useMemo优化性能，避免每次渲染都重新计算
    const filteredChildPosts = useMemo(() => {
        return allPosts
            .filter(post => post.parent === parentId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [allPosts, parentId]);

    useEffect(() => {
        setChildPosts(filteredChildPosts);
    }, [filteredChildPosts]);

    const handleReplySuccess = (newPost) => {
        setChildPosts(prev => [newPost, ...prev]);
    };

    if (childPosts.length === 0) return null;

    return (
        <div className="mt-4 space-y-2">
            {childPosts.map((child, index) => (
                <div key={child._id} className="relative">
                    <ReplyItem
                        post={child}
                        allPosts={allPosts}
                        onDelete={onDelete}
                        onReplySuccess={handleReplySuccess}
                        isLast={index === childPosts.length - 1}
                    />
                </div>
            ))}
        </div>
    );
}

export default ReplyList;
