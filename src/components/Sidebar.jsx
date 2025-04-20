import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
    { name: 'Posts', icon: <Home size={20} />, path: '/' },
    { name: 'Search', icon: <Search size={20} />, path: '/search' },
    { name: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
    { name: 'Messages', icon: <Mail size={20} />, path: '/messages' },
    { name: 'Profile', icon: <User size={20} />, path: '/profile' },
];

function Sidebar({ isOpen = false, onClose }) {
    return (
        <>
            {/* 桌面端静态 Sidebar */}
            <div style={{ minHeight: 'calc(100vh - 10px)' }} className="hidden lg:block fixed top-1 left-1 z-50 w-72 bg-[#F6F8FA80] dark:bg-[#1e293b80] backdrop-blur-sm dark:text-white text-black p-6 shadow-lg rounded-xl">
                <SidebarContent />
            </div>

            <motion.div
                initial="closed"
                animate={isOpen ? 'open' : 'closed'}
                variants={{
                    open: { x: 5 },
                    closed: { x: -300 },
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className="fixed top-1 left-0 z-50 w-72 min-h-screen text-black dark:text-white p-6 shadow-lg bg-[#F6F8FA80] dark:bg-[#1e293b80] backdrop-blur-sm rounded-xl lg:hidden"
            >
                <div className="flex justify-end mb-4">
                    <button onClick={onClose} className="hover:bg-none text-black text-3xl hover:text-gray-400 dark:text-white">
                        &times;
                    </button>
                </div>
                <SidebarContent onClose={onClose} />
            </motion.div>
        </>
    );
}

function SidebarContent({ onClose }) {
    return (
        <>
            <h1 className="text-3xl font-bold mb-8 text-center">Sorami</h1>
            <ul className="space-y-5">
                {menuItems.map((item, index) => (
                    <li key={index}>
                        <NavLink
                            to={item.path}
                            onClick={() => onClose?.()} // 安全调用
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-5 py-3 rounded-full transition-all 
                                ${isActive ? 'bg-blue-600 text-white' : 'text-black dark:text-white hover:bg-blue-600'} 
                                hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 
                                transform hover:scale-105`
                            }
                        >
                            {item.icon}
                            <span className="text-lg font-medium">{item.name}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </>
    );
}

export default Sidebar;
