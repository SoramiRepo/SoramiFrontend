import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import config from '../config';
import PostList from './PostList';
import UserBadges from './UserBadges';
import FollowBackIndicator from './FollowBackIndicator';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';

function OtherUserProfileComponent() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { username } = useParams();
    const { showToast } = useToast();
    const [currentUserId, setCurrentUserId] = useState(null);
    const [token, setToken] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [viewFollowers, setViewFollowers] = useState(false);
    const [viewFollowing, setViewFollowing] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleDelete = (postId) => {
        setPosts(prev => prev.filter(post => post._id !== postId));
    };

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setCurrentUserId(userData.id);
            setToken(userData.token);
        } else {
            setLoading(false);
            setError(t('Please log in to view profiles'));
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUserId) return;
    
            setLoading(true);
            try {
                const userRes = await fetch(`${config.apiBaseUrl}/api/user/${username}`);
                const userData = await userRes.json();
    
                if (!userRes.ok || !userData.user) {
                    setError(t('User does not exist'));
                    setLoading(false);
                    return;
                }
    
                const followers = Array.isArray(userData.user.followers) ? userData.user.followers : [];
                const isUserFollowing = followers.some(follower => String(follower._id) === String(currentUserId));
    
                setUser({
                    ...userData.user,
                    followers,
                    following: userData.user.following,
                    followersCount: followers.length,
                    followingCount: userData.user.following.length
                });
    
                setIsFollowing(isUserFollowing);
    
                const postsRes = await fetch(`${config.apiBaseUrl}/api/post/fetch?userId=${userData.user._id}&limit=20`);
                const postsData = await postsRes.json();
                setPosts(postsData.posts || []);
    
                setLoading(false);
            } catch (err) {
                console.error('Error loading user/posts:', err);
                setError(t('Failed to load data'));
                setLoading(false);
            }
        };
    
        fetchData();
    }, [username, currentUserId]);

    const handleFollowToggle = async () => {
        if (!token || !user) return showToast(t('Please login'), 'error');
    
        const endpoint = isFollowing ? 'unfollow' : 'follow';
    
        try {
            const res = await fetch(`${config.apiBaseUrl}/api/user/${endpoint}/${user._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
    
            const result = await res.json();
    
            if (res.ok) {
                setIsFollowing(prevState => !prevState);
            } else {
                showToast(result.message || t('Failed'), 'error');
            }
        } catch (err) {
            console.error('Follow toggle error:', err);
            showToast(t('Failed, please try again'), 'error');
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">{t('Loading...')}</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-[calc(100vh-1px)] pt-[60px] px-4 pb-10 flex justify-center items-start">
            <div className="w-full max-w-xl bg-white shadow-xl dark:bg-gray-800 rounded-2xl p-6">
                {user && (
                    <div className="flex flex-col items-center">
                        <img
                            src={user.avatarimg || '/resource/default-avatar.png'}
                            alt="avatar"
                            className="w-24 h-24 rounded-full object-cover shadow-md"
                        />
                        {currentUserId ? (
                            user._id !== currentUserId ? (
                                <button
                                    onClick={handleFollowToggle}
                                    className={`mt-4 px-4 py-2 rounded-full text-sm font-medium transition ${
                                        isFollowing
                                            ? 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                >
                                    {isFollowing ? t('Unfollow') : t('Follow')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/edit-profile')}
                                    className="mt-4 px-4 py-2 rounded-full text-sm font-medium transition bg-green-500 text-white hover:bg-green-600"
                                >
                                    {t('Edit Profile')}
                                </button>
                            )
                        ) : null}

                        <h2 className="text-2xl font-semibold mt-4 text-gray-800 dark:text-gray-100 flex items-center">
                            <span>{user.avatarname || user.username}</span>
                            <UserBadges badges={user.badges} />
                            <FollowBackIndicator currentUserId={currentUserId} followerList={user.following} />
                        </h2>

                        <p className="text-gray-500">@{user.username}</p>
                        <p className="mt-4 text-center text-gray-600 dark:text-gray-300">{user.bio || ''}</p>
                        <p className="mt-2 text-sm text-gray-400">
                            {t('Register Time')}: {new Date(user.registertime).toLocaleString()}
                        </p>

                        <div className="mt-4 flex space-x-6 text-gray-600 dark:text-gray-300">
                            <button onClick={() => setViewFollowers(true)} className="flex items-center space-x-2">
                                <span>{user.followersCount}</span>
                                <span>{t('Followers')}</span>
                            </button>
                            <button onClick={() => setViewFollowing(true)} className="flex items-center space-x-2">
                                <span>{user.followingCount}</span>
                                <span>{t('Following')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {viewFollowers && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('Followers')}</h3>
                            {user.followers && user.followers.length > 0 ? (
                                user.followers.map(follower => (
                                    <div className="space-y-4 mt-4">
                                        <Link to={`/${follower.username}`}>
                                            <div key={follower._id} className="flex items-center space-x-2">
                                                <img
                                                    src={follower.avatarimg || '/resource/default-avatar.png'}
                                                    alt={follower.username}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <span>{follower.avatarname || follower.username}</span>
                                                <UserBadges badges={follower.badges} />
                                            </div>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500 dark:bg-gray-800">
                                    {t('No followers yet.')}
                                </div>
                            )}
                        </div>
                )}

                {viewFollowing && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('Following')}</h3>
                            {user.following && user.following.length > 0 ? (
                                user.following.map(following => (
                                    <Link to={`/${following.username}`}>
                                        <div className="space-y-4 mt-4"></div>
                                            <div key={following._id} className="flex items-center space-x-2">
                                                <img
                                                    src={following.avatarimg || '/resource/default-avatar.png'}
                                                    alt={following.username}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <span>{following.avatarname || following.username}</span>
                                                <UserBadges badges={following.badges} />
                                            </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500 dark:bg-gray-800">
                                    {t('Not following anyone yet.')}
                                </div>
                            )}
                        </div>
                )}

                {!viewFollowers && !viewFollowing && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('Posts')}</h3>
                        <PostList posts={posts}  setPosts={setPosts} onDelete={handleDelete} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default OtherUserProfileComponent;
