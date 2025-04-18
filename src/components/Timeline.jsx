import React from 'react';
import PostContent from './PostContent';

function Timeline({ posts, setPosts }) {

    const handleDelete = (postId) => {
        setPosts(prev => prev.filter(post => post._id !== postId));
    };

    if (!posts || posts.length === 0) {
        return <p className="text-gray-500 text-center">No Posts</p>;
    }

    // Filter out reply posts (those that have a parent)
    const mainPosts = posts.filter(post => !post.parent);

    return (
        <div className="space-y-4">
            {mainPosts.length === 0 ? (
                <p className="text-gray-500 text-center">No main posts to display</p>
            ) : (
                mainPosts.map(post => (
                    <PostContent
                        key={post._id}
                        post={post}
                        allPosts={posts}
                        onDelete={handleDelete}
                    />
                ))
            )}
        </div>
    );
}

export default Timeline;
