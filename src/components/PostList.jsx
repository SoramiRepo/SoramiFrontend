import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostContent from './PostContent';

function PostList({ posts, setPosts }) {
    const navigate = useNavigate();

    const handleDelete = (postId) => {
        setPosts(prev => prev.filter(post => post._id !== postId));
    };

    if (!posts || posts.length === 0) {
        return <p className="text-gray-500 text-center">No Posts</p>;
    }

    const mainPosts = posts.filter(post => !post.parent);

    return (
        <div className="space-y-4">
            {mainPosts.length === 0 ? (
                <p className="text-gray-500 text-center">No main posts to display</p>
            ) : (
                mainPosts.map(post => (
                    <div
                        key={post._id}
                        onClick={(e) => {
                            // 避免点击按钮触发跳转
                            if (e.target.closest('button') || e.target.closest('img') || e.target.tagName === 'A') return;
                            navigate(`/post/${post._id}`);
                        }}
                        className="cursor-pointer"
                    >
                        <PostContent
                            post={post}
                            allPosts={posts}
                            onDelete={handleDelete}
                        />
                    </div>
                ))
            )}
        </div>
    );
}

export default PostList;
