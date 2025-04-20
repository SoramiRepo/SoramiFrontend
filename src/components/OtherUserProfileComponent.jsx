import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import config from '../config';
import PostList from './PostList';

function OtherUserProfileComponent() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { username } = useParams();

    const [currentUserId, setCurrentUserId] = useState(null);
    const [token, setToken] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [viewFollowers, setViewFollowers] = useState(false); // 控制是否显示关注者列表
    const [viewFollowing, setViewFollowing] = useState(false); // 控制是否显示关注列表

    const handleDelete = (postId) => {
        setPosts(prev => prev.filter(post => post._id !== postId));
    };

    // 获取当前登录用户信息
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setCurrentUserId(userData.id);
            setToken(userData.token);
        } else {
            console.log("没有找到用户信息，请登录");
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUserId) return; // 当前用户未加载时，跳过请求
    
            setLoading(true);
            try {
                const userRes = await fetch(`${config.apiBaseUrl}/api/user/${username}`);
                const userData = await userRes.json();
    
                if (!userRes.ok || !userData.user) {
                    setError('User does not exist');
                    setLoading(false);
                    return;
                }
    
                // 确保 followers 是一个数组
                const followers = Array.isArray(userData.user.followers) ? userData.user.followers : [];
                console.log('Followers Array:', followers);
                console.log('currentUserId:', currentUserId);
    
                // 调试：打印 followers 数组的每个元素
                followers.forEach((follower, index) => {
                    console.log(`follower[${index}] ->`, follower, 'Type:', typeof follower);
                });
                console.log('currentUserId Type:', typeof currentUserId);
    
                // 强制转换类型为字符串后进行比对
                const isUserFollowing = followers.some(follower => String(follower._id) === String(currentUserId));
                console.log('isUserFollowing:', isUserFollowing);
    
                setUser({
                    ...userData.user,
                    followers,
                    following: userData.user.following,
                    followersCount: followers.length,
                    followingCount: userData.user.following.length
                });
    
                // 更新是否关注
                setIsFollowing(isUserFollowing);
    
                const postsRes = await fetch(`${config.apiBaseUrl}/api/post/fetch?userId=${userData.user._id}&limit=20`);
                const postsData = await postsRes.json();
                setPosts(postsData.posts || []);
    
                setLoading(false);
            } catch (err) {
                console.error('Error loading user/posts:', err);
                setError('Failed to load data');
                setLoading(false);
            }
        };
    
        fetchData();
    }, [username, currentUserId]);

    // 关注按钮
    const handleFollowToggle = async () => {
        if (!token || !user) return alert('请先登录');
    
        console.log("当前登录用户ID:", currentUserId);
        console.log("目标用户ID:", user._id);
    
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
            console.log('Follow toggle result:', result);
    
            if (res.ok) {
                // 切换关注状态
                setIsFollowing(prevState => !prevState);
            } else {
                alert(result.message || '操作失败');
            }
        } catch (err) {
            console.error('Follow toggle error:', err);
            alert('操作失败，请稍后重试');
        }
    };

    // Loading and error states
    if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    console.log("isFollowing:", isFollowing); // 调试输出关注状态

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
                        {currentUserId && user._id !== currentUserId && (
                            <button
                                onClick={handleFollowToggle}
                                className={`mt-4 px-4 py-2 rounded-full text-sm font-medium transition ${
                                    isFollowing
                                        ? 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                            >
                                {isFollowing ? '取消关注' : '关注'}
                            </button>
                        )}
                        <h2 className="text-2xl font-semibold mt-4 text-gray-800 dark:text-gray-100">
                            {user.avatarname || user.username}
                        </h2>
                        <p className="text-gray-500">@{user.username}</p>
                        <p className="mt-4 text-center text-gray-600 dark:text-gray-300">{user.bio || ''}</p>
                        <p className="mt-2 text-sm text-gray-400">
                            Register Time: {new Date(user.registertime).toLocaleString()}
                        </p>

                        {/* 显示关注数和粉丝数（横向展示） */}
                        <div className="mt-4 flex space-x-6 text-gray-600 dark:text-gray-300">
                            <button onClick={() => setViewFollowers(true)} className="flex items-center space-x-2">
                                <span>{user.followersCount}</span>
                                <span>Followers</span>
                            </button>
                            <button onClick={() => setViewFollowing(true)} className="flex items-center space-x-2">
                                <span>{user.followingCount}</span>
                                <span>Following</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 关注者列表 */}
                {viewFollowers && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Followers</h3>
                        <div className="space-y-4 mt-4">
                            {user.followers && user.followers.length > 0 ? (
                                user.followers.map(follower => (
                                    <div key={follower._id} className="flex items-center space-x-4">
                                        <img
                                            src={follower.avatarimg || '/resource/default-avatar.png'}
                                            alt={follower.username}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <span>{follower.avatarname}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500 dark:bg-gray-800">
                                    No followers yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 关注列表 */}
                {viewFollowing && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Following</h3>
                        <div className="space-y-4 mt-4">
                            {user.following && user.following.length > 0 ? (
                                user.following.map(following => (
                                    <div key={following._id} className="flex items-center space-x-4">
                                        <img
                                            src={following.avatarimg || '/resource/default-avatar.png'}
                                            alt={following.username}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <span>{following.avatarname}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500 dark:bg-gray-800">
                                    Not following anyone yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 用户帖子展示 */}
                {!viewFollowers && !viewFollowing && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Posts</h3>
                        <PostList posts={posts} onDelete={handleDelete} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default OtherUserProfileComponent;
