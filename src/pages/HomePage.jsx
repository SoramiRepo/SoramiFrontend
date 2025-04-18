import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams } from 'react-router-dom';
import config from '../config';

import NavBar from '../components/NavBar'; // 引入 NavBar 组件
import Sidebar from '../components/Sidebar';
import PostInput from '../components/PostInput';
import Timeline from '../components/Timeline';
import ProfileComponent from '../components/ProfileComponent';
import OtherUserProfileComponent from '../components/OtherUserProfileComponent';

function HomePage() {
    const [posts, setPosts] = useState([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { username } = useParams();

    const handleSidebarToggle = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const handlePostSuccess = (newPost) => {
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    const user = JSON.parse(localStorage.getItem('user'));

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

    // 始终渲染 Sidebar 和 NavBar，不受路由影响
    return (
        <div className="relative min-h-screen bg-gray-100 overflow-x-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* 遮罩层 */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
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
                ) : username && username !== 'profile' ? (
                    <OtherUserProfileComponent />
                ) : (
                    <>
                        <div className="bg-white p-6 shadow-lg rounded-lg">
                            <PostInput onPostSuccess={handlePostSuccess} />
                            <Timeline posts={posts} setPosts={setPosts} />
                        </div>
                    </>
                )}

            </motion.div>
        </div>
    );
}

export default HomePage;
