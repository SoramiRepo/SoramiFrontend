import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams } from 'react-router-dom';
import config from '../config';

import NavBar from '../components/NavBar'; // 引入 NavBar 组件
import Sidebar from '../components/Sidebar';
import PostInput from '../components/PostInput';
import Timeline from '../components/PostList';
import ProfileComponent from '../components/ProfileComponent';
import OtherUserProfileComponent from '../components/OtherUserProfileComponent';
import SearchPage from './SearchPage'
import PostPage from './PostPage';
import EditProfile from '../components/EditProfile';
import NotificationPage from './NotificationPage';
import InstallPWAButton from '../components/InstallPWAButton';

function HomePage() {
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
        // Dynamically create the theme-color meta tag if it doesn't exist
        let themeColorMetaTag = document.querySelector('meta[name="theme-color"]');
        
        if (!themeColorMetaTag) {
            themeColorMetaTag = document.createElement('meta');
            themeColorMetaTag.setAttribute('name', 'theme-color');
            document.head.appendChild(themeColorMetaTag);
        }
    
        function updateThemeColor() {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            // Set the content of theme-color based on system preference
            if (darkModeMediaQuery.matches) {
                themeColorMetaTag.setAttribute('content', '#111827'); // Dark mode color
            } else {
                themeColorMetaTag.setAttribute('content', '#f3f4f6'); // Light mode color
            }
        }
        
            // Initial theme color setup
            updateThemeColor();
        
            // Listen for changes in system theme preference
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);
        
            // Cleanup listener when component unmounts
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
                    <NotificationPage />
                ) : location.pathname.startsWith('/post/') ?  
                (
                    <PostPage />
                ) : (
                    <>
                        <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-lg">
                            <PostInput onPostSuccess={handlePostSuccess} />
                            <Timeline posts={posts} setPosts={setPosts} />
                        </div>
                    </>
                )}

            </motion.div>
            <InstallPWAButton />
        </div>
    );
}

export default HomePage;
