import React, { useState } from 'react';
import config from '../config';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';

function PostInput({ onPostSuccess }) {
    const [postContent, setPostContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showToast } = useToast();
    const { t } = useTranslation();

    const handlePostSubmit = async () => {
        if (!postContent.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) {
                showToast(t('notLogin'), 'error');
                return;
            }

            const res = await fetch(`${config.apiBaseUrl}/api/post/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: postContent }),
            });

            const data = await res.json();
            if (res.ok) {
                setPostContent("");
                onPostSuccess(data.post);
            } else {
                setError(data.message || t('unknownError'));
            }
        } catch (err) {
            console.error(err);
            setError(t('postFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 rounded-md">
            <textarea
                className="w-full p-2 border border-gray-300 rounded-md dark:text-slate-100"
                rows="4"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={t('shareIdeaHere')}
            />
            {error && <p className="text-red-600 mt-2">{error}</p>}
            <button
                className="relative mt-2 bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePostSubmit}
                disabled={loading}
            >
                {loading ? t('posting') : t('post')}
            </button>
        </div>
    );
}

export default PostInput;
