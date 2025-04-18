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
            <div style={{ minHeight: 'calc(100vh - 10px)' }} className="hidden lg:block fixed top-1 left-1 z-50 w-72 bg-[#F6F8FA] text-black p-6 shadow-lg rounded-xl">
                <SidebarContent />
            </div>

            <motion.div
                initial="closed"
                animate={isOpen ? 'open' : 'closed'}
                variants={{
                    open: { x: 0 },
                    closed: { x: -300 },
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className="fixed top-0 left-0 z-50 w-72 min-h-screen bg-[#F6F8FA] text-black p-6 shadow-lg rounded-r-xl lg:hidden"
            >
                <div className="flex justify-end mb-4">
                    <button onClick={onClose} className="text-black text-3xl hover:text-gray-400">
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
                                ${isActive ? 'bg-blue-600 text-white' : 'text-black hover:bg-blue-600'} 
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
