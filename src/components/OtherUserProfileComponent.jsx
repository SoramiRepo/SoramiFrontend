import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import config from '../config';

import PostContent from './PostContent';

function OtherUserProfileComponent() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { username } = useParams();

    const handleDelete = (postId) => {
        console.log("Timeline RECV DELETE POST: " + postId);
        setPosts(prev => prev.filter(post => post._id !== postId));
    };

    useEffect(() => {
        // 获取用户资料
        const userUrl = `${config.apiBaseUrl}/api/user/${username}`;
        fetch(userUrl)
            .then((response) => response.json())
            .then((data) => {
                if (data.user) {
                    setUser(data.user);
                    // 获取该用户的帖子
                    const postsUrl = `${config.apiBaseUrl}/api/post/fetch?userId=${data.user._id}&limit=20`;
                    fetch(postsUrl)
                        .then((response) => response.json())
                        .then((data) => {
                            setPosts(data.posts || []);
                            setLoading(false);
                        })
                        .catch((error) => {
                            console.error('Error fetching posts:', error);
                            setError('Failed to load data, please try again later');
                            setLoading(false);
                        });
                } else {
                    setError('User does not exist');
                    setLoading(false);
                }
            })
            .catch((error) => {
                console.error('Error fetching user data:', error);
                setError('Failed to load data, please try again later');
                setLoading(false);
            });
    }, [username]);

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading...</div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-[calc(100vh-1px)] bg-gray-100 pt-[60px] px-4 pb-10 flex justify-center items-start">
            <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl p-6">
                {/* 个人资料部分 */}
                <div className="flex flex-col items-center">
                    <img
                        src={user.avatarimg || '/resource/default-avatar.png'}
                        alt="avatar"
                        className="w-24 h-24 rounded-full object-cover shadow-md"
                    />
                    <h2 className="text-2xl font-semibold mt-4 text-gray-800">
                        {user.avatarname || user.username}
                    </h2>
                    <p className="text-gray-500">@{user.username}</p>
                    <p className="mt-4 text-center text-gray-600">{user.bio || ''}</p>
                    <p className="mt-2 text-sm text-gray-400">
                        Register Time: {new Date(user.registertime).toLocaleString()}
                    </p>
                </div>

                {/* 用户帖子展示 */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800">Posts from @{username}</h3>

                    {loading ? (
                        <div className="mt-4 text-center text-gray-500">Loading...</div>
                    ) : (
                        <div className="space-y-4 mt-4">
                            {!Array.isArray(posts) || posts.length === 0 ? (
                                <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
                                    This user hasn't posted yet.
                                </div>
                            ) : (
                                posts.map((post) => (
                                    <PostContent key={post._id} post={post} allPosts={posts} onDelete={handleDelete} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OtherUserProfileComponent;
