import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams } from 'react-router-dom';
import config from '../config';
import i18n from '../i18n'
import NavBar from '../components/NavBar'; // 引入 NavBar 组件
import Sidebar from '../components/Sidebar';
import FloatingPostButton from '../components/FloatingPostButton';
import Timeline from '../components/PostList';
import ProfileComponent from '../components/ProfileComponent';
import OtherUserProfileComponent from '../components/OtherUserProfileComponent';
import SearchPage from './SearchPage'
import PostPage from './PostPage';
import EditProfile from '../components/EditProfile';
import NotificationPage from './NotificationPage';
import InstallPWAButton from '../components/InstallPWAButton';
import { useTranslation } from 'react-i18next'
import MessagePage from './MessagePage';

function HomePage() {
    const { t } = useTranslation()
    const [posts, setPosts] = useState([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { username } = useParams();
    const [unreadCount, setUnreadCount] = useState(0);

    const handleSidebarToggle = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const handlePostSuccess = (newPost) => {
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    const user = JSON.parse(localStorage.getItem('user'));


    useEffect(() => {
        let themeColorMetaTag = document.querySelector('meta[name="theme-color"]');
        
        if (!themeColorMetaTag) {
            themeColorMetaTag = document.createElement('meta');
            themeColorMetaTag.setAttribute('name', 'theme-color');
            document.head.appendChild(themeColorMetaTag);
        }
    
        function updateThemeColor() {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (darkModeMediaQuery.matches) {
                themeColorMetaTag.setAttribute('content', '#111827');
            } else {
                themeColorMetaTag.setAttribute('content', '#f3f4f6');
            }
        }
        
            updateThemeColor();
        
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);
        
            return () => {
                window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateThemeColor);
            };
    }, []);

    // 窗口标题
    useEffect(() => {
        document.title = "Sorami";
    }, []);

    // PWA Test
    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            console.log('👍 App is installable!');
          // 可以保存 e 并显示自定义“安装”按钮
        });
    }, []);

    // 这里加载帖子
    useEffect(() => {
        fetch(`${config.apiBaseUrl}/api/post/all`)
        .then(res => res.json())
        .then(data => {
            if (data.posts) {
                setPosts(data.posts);
            }
        });
    }, []);

    // 加载未读通知数量
    useEffect(() => {
        const fetchUnreadCount = async () => {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) return;

            try {
                const res = await fetch(`${config.apiBaseUrl}/api/notification/unread-count`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok) {
                    setUnreadCount(data.count);
                }
            } catch (err) {
                console.error('Failed to get unread count:', err);
            }
        };

        fetchUnreadCount();
    }, []);

    // 更新未读通知数量的函数
    const updateUnreadCount = async () => {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (!token) return;

        try {
            const res = await fetch(`${config.apiBaseUrl}/api/notification/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setUnreadCount(data.count);
            }
        } catch (err) {
            console.error('Failed to get unread count:', err);
        }
    };

    // 始终渲染 Sidebar 和 NavBar，不受路由影响
    return (
        <div className="relative dark:bg-gray-900 min-h-screen bg-gray-100 overflow-x-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} unreadCount={unreadCount} />

            {/* 遮罩层 */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* 导航栏 */}
            <NavBar handleSidebarToggle={handleSidebarToggle} isSidebarOpen={isSidebarOpen} user={user} /> {/* 使用 NavBar */}

            {/* 页面主内容 */}
            <motion.div
                initial={{ x: 0 }}
                animate={{ x: isSidebarOpen ? 240 : 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="pt-[90px] px-4 pb-10 lg:ml-72"
            >
                {/* 根据路由渲染不同的内容 */}
                {location.pathname === '/profile' ? (
                    <ProfileComponent />
                ) : location.pathname === '/edit-profile' ? (
                    <EditProfile />
                ) : username && username !== 'profile' ? (
                    <OtherUserProfileComponent />
                ) : location.pathname === '/search' ? (
                    <SearchPage />
                ) : location.pathname === '/notifications' ? (
                    <NotificationPage onNotificationUpdate={updateUnreadCount} />
                ) : location.pathname ===  '/messages' ? (
                    <MessagePage />
                ) : location.pathname.startsWith('/post/') ?  
                (
                    <PostPage />
                ) : (
                    <>
                        {/* Posts Content */}
                        <motion.div 
                            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            {/* Posts List */}
                            <div className="p-6">
                                {posts.length === 0 ? (
                                    <motion.div 
                                        className="text-center py-16"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                            {t('No posts yet')}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                                            Be the first to share something amazing!
                                        </p>
                                        <motion.button
                                            onClick={() => document.querySelector('[data-post-button]')?.click()}
                                            className="px-6 py-3 bg-blue-500/90 text-white rounded-xl hover:bg-blue-600/90 transition-colors duration-200 shadow-lg shadow-blue-500/25"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {t('Create First Post')}
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Timeline posts={posts} setPosts={setPosts} />
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        {/* Floating Post Button */}
                        <FloatingPostButton onPostSuccess={handlePostSuccess} />
                    </>
                )}

            </motion.div>
            <InstallPWAButton />
        </div>
    );
}

export default HomePage;
