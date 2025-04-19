import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import config from '../config';
import PostContent from '../components/PostContent';

function PostPage() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`${config.apiBaseUrl}/api/post/${id}`);
                const data = await res.json();

                setPost(data.post || null);
                setReplies(Array.isArray(data.replies) ? data.replies : []);
            } catch (err) {
                console.error('Failed to fetch post:', err);
                setPost(null);
                setReplies([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (!post) return <div className="p-4 text-center text-red-500">Post not found</div>;

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold mb-4">Post</h1>
            <PostContent 
                post={post} 
                allPosts={[post, ...replies]} 
                defaultExpanded={true}  // ✅ 新增：让 PostContent 中的 reply 默认展开
            />
        </div>
    );
}

export default PostPage;
