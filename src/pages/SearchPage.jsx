import React, { useEffect, useState } from 'react';
import config from '../config';
import PostList from '../components/PostList';
import UserBadges from '../components/UserBadges';
import FollowBackIndicator from '../components/FollowBackIndicator';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function SearchPage() {
    const { t } = useTranslation();
    const [keyword, setKeyword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [token, setToken] = useState('');
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = "Sorami - " + t('search');
    }, [t]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setCurrentUserId(userData.id);
            setToken(userData.token);
        }
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        const trimmed = keyword.trim();
        if (!trimmed) return;

        setSearchTerm(trimmed);
        setLoading(true);

        try {
            const [userRes, postRes] = await Promise.all([
                fetch(`${config.apiBaseUrl}/api/user/search?keyword=${trimmed}`),
                fetch(`${config.apiBaseUrl}/api/post/fetch?keyword=${trimmed}`)
            ]);

            const userData = await userRes.json();
            const postData = await postRes.json();

            setUsers(userData.users || []);
            setPosts(postData.posts || []);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto dark:text-gray-300">
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="border flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:bg-slate-800 px-3 py-2 rounded w-full focus:border-1 focus:border-[#2B7FFF] focus:outline-none"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                    {t('search_button')}
                </button>
            </form>

            {searchTerm && (
                <>
                    <h2 className="text-xl font-semibold mb-4">{t('search_results_for')}: <span className="text-blue-600">{searchTerm}</span></h2>

                    {loading ? (
                        <p>{t('loading')}</p>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-2">{t('users')}</h3>
                                {users.length === 0 ? (
                                    <p className="text-gray-500">{t('no_users_found')}</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {users.map(user => (
                                            <li key={user._id} className="flex items-center gap-3">
                                                <Link to={`/${user.username}`} className="flex items-center gap-3">
                                                    <img 
                                                        src={user.avatarimg || '/resource/default-avatar.png'} 
                                                        className="w-10 h-10 rounded-full object-cover" 
                                                        alt="avatar" 
                                                    />
                                                    <div>
                                                        <div className="font-semibold flex items-center">
                                                            {user.avatarname || user.username}
                                                            <UserBadges badges={user.badges} />
                                                            <FollowBackIndicator currentUserId={currentUserId} followerList={user.following} />
                                                        </div>
                                                        <div className="text-sm text-gray-500">@{user.username}</div>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">{t('posts')}</h3>
                                {posts.length === 0 ? (
                                    <p className="text-gray-500">{t('no_posts_found')}</p>
                                ) : (
                                    <div className="space-y-4">
                                        <PostList posts={posts}  setPosts={setPosts} />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default SearchPage;
