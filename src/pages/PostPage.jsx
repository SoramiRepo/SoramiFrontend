import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import config from '../config';
import PostContent from '../components/PostContent';
import { useTranslation } from 'react-i18next';

function PostPage() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('user'))?.token;
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                
                const res = await fetch(`${config.apiBaseUrl}/api/post/${id}`, { headers });
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

    const handleReplySuccess = (newPost) => {
        console.log(t('new_post_added'), newPost);
        setReplies(prev => [...prev, newPost]);
    };

    if (loading) return <div className="p-4 text-center">{t('loading')}</div>;
    if (!post) return <div className="p-4 text-center text-red-500">{t('post_not_found')}</div>;

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold mb-4 dark:text-white">{t('post')}</h1>
            <PostContent
                post={post}
                allPosts={[post, ...replies]}
                onReplySuccess={handleReplySuccess}
                defaultExpanded={true}
            />
        </div>
    );
}

export default PostPage;
