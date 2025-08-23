import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, UserPlus, Edit3, ArrowLeft, Grid3X3, Heart, MessageCircle } from 'lucide-react';
import config from '../config';
import PostList from './PostList';
import UserBadges from './UserBadges';
import FollowBackIndicator from './FollowBackIndicator';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';
import { createNotification } from '../utils/notificationUtils.js';

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
    const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'followers', 'following'
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleDelete = (postId) => {
        setPosts(prev => {
            // 移除主帖子
            const filteredPosts = prev.filter(post => post._id !== postId);
            
            // 同时移除所有相关的子帖子（回复）
            const postsWithoutChildren = filteredPosts.filter(post => {
                // 如果这个帖子是已删除帖子的回复，也要移除
                if (post.parent === postId) {
                    return false;
                }
                return true;
            });
            
            return postsWithoutChildren;
        });
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
            if (!currentUserId || !token) return;
    
            setLoading(true);
            try {
                const userRes = await fetch(`${config.apiBaseUrl}/api/user/${username}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
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
    
                const postsRes = await fetch(`${config.apiBaseUrl}/api/post/fetch?userId=${userData.user._id}&limit=20`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const postsData = await postsRes.json();
                
                console.log('Posts API Response:', postsData); // 调试信息
                
                if (postsRes.ok) {
                    setPosts(postsData.posts || []);
                } else {
                    console.error('Failed to fetch posts:', postsData);
                    setPosts([]);
                }
    
                setLoading(false);
            } catch (err) {
                console.error('Error loading user/posts:', err);
                setError(t('Failed to load data'));
                setLoading(false);
            }
        };
    
        fetchData();
    }, [username, currentUserId, token, t]);

    const handleFollowToggle = async () => {
        if (!token || !user) return showToast(t('Please login'), 'error');
    
        const endpoint = isFollowing ? 'unfollow' : 'follow';
        const previousState = isFollowing; // 保存之前的状态
        const currentUsername = JSON.parse(localStorage.getItem('user'))?.username;
        
        try {
            // 乐观更新UI
            setIsFollowing(!isFollowing);
            
            const res = await fetch(`${config.apiBaseUrl}/api/user/${endpoint}/${user._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
    
            const result = await res.json();
    
            if (res.ok) {
                // 成功：创建通知和更新计数
                if (!previousState) { // 关注成功
                    // 创建关注通知
                    try {
                        await createNotification(
                            'follow',
                            user._id,
                            null, // follow通知通常不需要post ID
                            `${currentUsername} followed you`
                        );
                    } catch (notificationErr) {
                        console.error('Failed to create follow notification:', notificationErr);
                        // 通知创建失败不影响关注操作
                    }
                    
                    // 更新关注者数量
                    setUser(prev => ({
                        ...prev,
                        followersCount: prev.followersCount + 1
                    }));
                } else { // 取消关注成功
                    // 更新关注者数量
                    setUser(prev => ({
                        ...prev,
                        followersCount: Math.max(0, prev.followersCount - 1)
                    }));
                }
            } else {
                // 失败：回滚UI状态
                setIsFollowing(previousState);
                showToast(result.message || t('Failed'), 'error');
            }
        } catch (err) {
            // 错误：回滚UI状态
            setIsFollowing(previousState);
            console.error('Follow toggle error:', err);
            showToast(t('Failed, please try again'), 'error');
        }
    };

    if (loading) {
        return (
            <motion.div 
                className="min-h-screen flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <motion.div
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div 
                className="min-h-screen flex items-center justify-center p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-2xl p-8 text-center max-w-md">
                    <div className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</div>
                </div>
            </motion.div>
        );
    }

    const tabs = [
        { id: 'posts', label: t('Posts'), icon: Grid3X3, count: posts.length },
        { id: 'followers', label: t('Followers'), icon: Users, count: user?.followersCount || 0 },
        { id: 'following', label: t('Following'), icon: UserPlus, count: user?.followingCount || 0 }
    ];

    return (
        <motion.div 
            className="min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-4xl mx-auto px-4 py-8">
                {user && (
                    <>
                        {/* Profile Header */}
                        <motion.div 
                            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden mb-8"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            {/* Cover Background */}
                            <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
                                <div className="absolute inset-0 bg-black/20"></div>
                            </div>

                            <div className="px-8 pb-8">
                                {/* Avatar */}
                                <motion.div 
                                    className="relative -mt-16 mb-6"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                >
                                    <div className="w-32 h-32 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 shadow-2xl">
                                        <img
                                            src={user.avatarimg || '/resource/default-avatar.png'}
                                            alt="avatar"
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                </motion.div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    <div>
                                        <motion.h1 
                                            className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2"
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            {user.avatarname || user.username}
                                            <UserBadges badges={user.badges} size="large" />
                                            <FollowBackIndicator currentUserId={currentUserId} followerList={user.following} />
                                        </motion.h1>
                                        <p className="text-gray-500 dark:text-gray-400 text-lg">@{user.username}</p>
                                    </div>

                                    {/* Action Button */}
                                    {currentUserId && (
                                        <motion.div
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            {user._id !== currentUserId ? (
                                                <motion.button
                                                    onClick={handleFollowToggle}
                                                    className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                                                        isFollowing
                                                            ? 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 hover:bg-gray-300/80 dark:hover:bg-gray-600/80'
                                                            : 'bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-lg shadow-blue-500/25'
                                                    }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <UserPlus size={18} />
                                                    {isFollowing ? t('Unfollow') : t('Follow')}
                                                </motion.button>
                                            ) : (
                                                <motion.button
                                                    onClick={() => navigate('/edit-profile')}
                                                    className="px-6 py-3 rounded-2xl font-semibold bg-green-500/90 text-white hover:bg-green-600/90 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-green-500/25"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <Edit3 size={18} />
                                                    {t('Edit Profile')}
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Bio */}
                                {user.bio && (
                                    <motion.p 
                                        className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        {user.bio}
                                    </motion.p>
                                )}

                                {/* Join Date */}
                                <motion.div 
                                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-6"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Calendar size={16} />
                                    <span>{t('Register Time')}: {new Date(user.registertime).toLocaleDateString()}</span>
                                </motion.div>

                                {/* Stats */}
                                <motion.div 
                                    className="flex gap-8"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('Posts')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.followersCount}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('Followers')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.followingCount}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('Following')}</div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Tabs */}
                        <motion.div 
                            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <div className="flex border-b border-gray-200/50 dark:border-gray-700/50">
                                {tabs.map((tab) => (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 px-3 sm:px-6 py-4 text-center font-medium transition-all duration-200 relative ${
                                            activeTab === tab.id
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                                            <tab.icon size={18} />
                                            {/* 在移动端隐藏文字标签，只显示图标和数字 */}
                                            <span className="hidden sm:inline">{tab.label}</span>
                                            <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                                {tab.count}
                                            </span>
                                        </div>
                                        {activeTab === tab.id && (
                                            <motion.div
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                                                layoutId="activeTab"
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'posts' && (
                                        <motion.div
                                            key="posts"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {posts.length > 0 ? (
                                                <PostList posts={posts} setPosts={setPosts} />
                                            ) : (
                                                <div className="text-center py-12">
                                                    <Grid3X3 size={48} className="mx-auto text-gray-400 mb-4" />
                                                    <p className="text-gray-500 dark:text-gray-400">{t('No posts yet')}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'followers' && (
                                        <motion.div
                                            key="followers"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {user.followers && user.followers.length > 0 ? (
                                                <div className="space-y-4">
                                                    {user.followers.map((follower, index) => (
                                                        <motion.div
                                                            key={follower._id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                        >
                                                            <Link to={`/${follower.username}`}>
                                                                <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                                                                    <img
                                                                        src={follower.avatarimg || '/resource/default-avatar.png'}
                                                                        alt={follower.username}
                                                                        className="w-12 h-12 rounded-full object-cover"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                                                {follower.avatarname || follower.username}
                                                                            </span>
                                                                            <UserBadges badges={follower.badges} size="small" showTooltip={false} />
                                                                        </div>
                                                                        <p className="text-gray-500 dark:text-gray-400">@{follower.username}</p>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                                                    <p className="text-gray-500 dark:text-gray-400">{t('No followers yet.')}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'following' && (
                                        <motion.div
                                            key="following"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {user.following && user.following.length > 0 ? (
                                                <div className="space-y-4">
                                                    {user.following.map((following, index) => (
                                                        <motion.div
                                                            key={following._id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                        >
                                                            <Link to={`/${following.username}`}>
                                                                <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                                                                    <img
                                                                        src={following.avatarimg || '/resource/default-avatar.png'}
                                                                        alt={following.username}
                                                                        className="w-12 h-12 rounded-full object-cover"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                                                {following.avatarname || following.username}
                                                                            </span>
                                                                            <UserBadges badges={following.badges} size="small" showTooltip={false} />
                                                                        </div>
                                                                        <p className="text-gray-500 dark:text-gray-400">@{following.username}</p>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <UserPlus size={48} className="mx-auto text-gray-400 mb-4" />
                                                    <p className="text-gray-500 dark:text-gray-400">{t('Not following anyone yet.')}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default OtherUserProfileComponent;
