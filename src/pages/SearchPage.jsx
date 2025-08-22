import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, FileText, Sparkles, TrendingUp, Clock, X } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'users', 'posts'
    const [searchHistory, setSearchHistory] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        document.title = "Sorami - " + t('search');
    }, [t]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setCurrentUserId(userData.id);
            setToken(userData.token);
        }
        
        // Load search history from localStorage
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSearchHistory(history);
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        // 立即隐藏搜索建议，防止任何自动选中行为
        setShowSuggestions(false);
        
        const trimmed = keyword.trim();
        if (!trimmed) return;

        setSearchTerm(trimmed);
        setLoading(true);

        // Add to search history
        const newHistory = [trimmed, ...searchHistory.filter(item => item !== trimmed)].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));

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

    const handleQuickSearch = (term) => {
        setKeyword(term);
        setSearchTerm(term);
        setShowSuggestions(false);
        // 直接执行搜索逻辑，而不是调用handleSearch
        const trimmed = term.trim();
        if (!trimmed) return;

        setLoading(true);

        // Add to search history
        const newHistory = [trimmed, ...searchHistory.filter(item => item !== trimmed)].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));

        // 执行搜索
        Promise.all([
            fetch(`${config.apiBaseUrl}/api/user/search?keyword=${trimmed}`),
            fetch(`${config.apiBaseUrl}/api/post/fetch?keyword=${trimmed}`)
        ]).then(async ([userRes, postRes]) => {
            const userData = await userRes.json();
            const postData = await postRes.json();

            setUsers(userData.users || []);
            setPosts(postData.posts || []);
        }).catch(err => {
            console.error('Search failed:', err);
        }).finally(() => {
            setLoading(false);
        });
    };

    const clearSearch = () => {
        setKeyword('');
        setSearchTerm('');
        setUsers([]);
        setPosts([]);
        setActiveTab('all');
    };

    const tabs = [
        { id: 'all', label: t('All'), icon: Sparkles, count: users.length + posts.length },
        { id: 'users', label: t('Users'), icon: Users, count: users.length },
        { id: 'posts', label: t('Posts'), icon: FileText, count: posts.length }
    ];

    const filteredUsers = activeTab === 'all' || activeTab === 'users' ? users : [];
    const filteredPosts = activeTab === 'all' || activeTab === 'posts' ? posts : [];

    return (
        <motion.div 
            className="min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Search Header */}
                <motion.div 
                    className="text-center mb-12"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <motion.h1 
                        className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {t('search')}
                    </motion.h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        {t('search_placeholder')}
                    </p>
                </motion.div>

                {/* Search Form */}
                <motion.div 
                    className="max-w-2xl mx-auto mb-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <form onSubmit={handleSearch} className="relative">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => {
                                    setKeyword(e.target.value);
                                    setShowSuggestions(e.target.value.length > 0);
                                }}
                                onFocus={() => setShowSuggestions(keyword.length > 0)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // 按回车键时立即隐藏搜索建议，防止自动选中
                                        setShowSuggestions(false);
                                    }
                                }}
                                placeholder={t('search_placeholder')}
                                className="w-full pl-12 pr-12 py-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                            />
                            {keyword && (
                                <motion.button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X size={16} className="text-gray-400" />
                                </motion.button>
                            )}
                        </div>
                        
                        {/* Search Suggestions */}
                        <AnimatePresence>
                            {showSuggestions && (
                                <motion.div
                                    className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden z-10"
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    tabIndex="-1"
                                >
                                    {/* Search History */}
                                    {searchHistory.length > 0 && (
                                        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                <Clock size={14} />
                                                <span>{t('Recent Searches')}</span>
                                            </div>
                                            <div className="space-y-2">
                                                {searchHistory.slice(0, 5).map((term, index) => (
                                                    <motion.button
                                                        key={term}
                                                        type="button"
                                                        tabIndex="-1"
                                                        onClick={() => handleQuickSearch(term)}
                                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center gap-2"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                    >
                                                        <Search size={14} className="text-gray-400" />
                                                        <span className="text-gray-700 dark:text-gray-300">{term}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Trending Searches */}
                                    <div className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                            <TrendingUp size={14} />
                                            <span>{t('Trending')}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Sorami', 'Technology', 'Design', 'Development'].map((term, index) => (
                                                <motion.button
                                                    key={term}
                                                    type="button"
                                                    tabIndex="-1"
                                                    onClick={() => handleQuickSearch(term)}
                                                    className="px-3 py-1 bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200/50 dark:hover:bg-blue-800/40 transition-colors duration-200"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.1 + index * 0.05 }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {term}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>

                {/* Search Results */}
                {searchTerm && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {/* Results Header */}
                        <div className="text-center mb-8">
                            <motion.h2 
                                className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                            >
                                {t('search_results_for')}: <span className="text-blue-600 dark:text-blue-400">{searchTerm}</span>
                            </motion.h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Found {users.length + posts.length} results
                            </p>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <motion.div 
                                className="flex items-center justify-center py-16"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <motion.div
                                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                            </motion.div>
                        )}

                        {/* Results Content */}
                        {!loading && (
                            <>
                                {/* Tabs */}
                                <motion.div 
                                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden mb-8"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
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
                                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:text-blue-400"
                                                        layoutId="activeTab"
                                                    />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    <div className="p-6">
                                        <AnimatePresence mode="wait">
                                            {/* Users Tab */}
                                            {(activeTab === 'all' || activeTab === 'users') && filteredUsers.length > 0 && (
                                                <motion.div
                                                    key="users"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="mb-8"
                                                >
                                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                        <Users size={20} className="text-blue-500" />
                                                        {t('Users')} ({filteredUsers.length})
                                                    </h3>
                                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                        {filteredUsers.map((user, index) => (
                                                            <motion.div
                                                                key={user._id}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                whileHover={{ y: -5 }}
                                                                className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 hover:shadow-lg transition-all duration-200 border border-white/20 dark:border-gray-600/50"
                                                            >
                                                                <Link to={`/${user.username}`} className="flex items-center gap-3">
                                                                    <img 
                                                                        src={user.avatarimg || '/resource/default-avatar.png'} 
                                                                        className="w-12 h-12 rounded-full object-cover shadow-md" 
                                                                        alt="avatar" 
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                                                                            <span className="truncate">{user.avatarname || user.username}</span>
                                                                            <UserBadges badges={user.badges} />
                                                                            <FollowBackIndicator currentUserId={currentUserId} followerList={user.following} />
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
                                                                    </div>
                                                                </Link>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Posts Tab */}
                                            {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
                                                <motion.div
                                                    key="posts"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                        <FileText size={20} className="text-green-500" />
                                                        {t('Posts')} ({filteredPosts.length})
                                                    </h3>
                                                    <div className="space-y-4">
                                                        <PostList posts={filteredPosts} setPosts={setPosts} />
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* No Results */}
                                            {filteredUsers.length === 0 && filteredPosts.length === 0 && !loading && (
                                                <motion.div
                                                    className="text-center py-16"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.3 }}
                                                >
                                                    <Search size={64} className="mx-auto text-gray-400 mb-4" />
                                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                                        {t('No results found')}
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        Try different keywords or check your spelling
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* Empty State */}
                {!searchTerm && !loading && (
                    <motion.div 
                        className="text-center py-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Sparkles size={64} className="mx-auto text-blue-500 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {t('Start Searching')}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Search for users, posts, or anything you're interested in
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {['Technology', 'Design', 'Development', 'Art'].map((term, index) => (
                                <motion.button
                                    key={term}
                                    onClick={() => handleQuickSearch(term)}
                                    className="px-4 py-2 bg-blue-500/90 text-white rounded-xl hover:bg-blue-600/90 transition-colors duration-200 shadow-lg shadow-blue-500/25"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.7 + index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {term}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

export default SearchPage;
