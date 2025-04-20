import React, { useState } from 'react';
import config from '../config';

function PostInput({ onPostSuccess }) {
    const [postContent, setPostContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);  // Added error state

    const handlePostSubmit = async () => {
        if (!postContent.trim()) return;

        setLoading(true);
        setError(null);  // Reset error state on new submission

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) {
                alert("Not login");
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
                onPostSuccess(data.post);  // Update the parent state with new post
            } else {
                setError(data.message || 'Unknown Error');
            }
        } catch (err) {
            console.error(err);
            setError("Post failed, please try again");
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
                placeholder="Share your idea here..."
            />
            {error && <p className="text-red-600 mt-2">{error}</p>}  {/* Show error message */}
            <button
                className="relative mt-2 bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePostSubmit}
                disabled={loading}
            >
                {loading ? 'Posting...' : 'Post'}
            </button>
        </div>
    );
}

export default PostInput;
