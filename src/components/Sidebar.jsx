import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const menuItems = [
    { name: 'posts', icon: <Home size={20} />, path: '/' },
    { name: 'search', icon: <Search size={20} />, path: '/search' },
    { name: 'notifications', icon: <Bell size={20} />, path: '/notifications' },
    { name: 'messages', icon: <Mail size={20} />, path: '/messages' },
    { name: 'profile', icon: <User size={20} />, path: '/profile' },
];

function Sidebar({ isOpen = false, onClose, unreadCount = 0 }) {
    const { t, i18n } = useTranslation();
    const [language, setLanguage] = useState(i18n.language);  // Store the current language

    // Handle language change
    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang); // Change the language using i18n
        setLanguage(lang); // Update state to re-render component
    };

    useEffect(() => {
        if (i18n.language !== language) {
            setLanguage(i18n.language); // Sync state with i18n language change
        }
    }, [i18n.language, language]);

    return (
        <>
            <div style={{ minHeight: 'calc(100vh - 10px)' }} className="hidden lg:block fixed top-1 left-1 z-50 w-72 bg-[#F6F8FA80] dark:bg-[#1e293b80] backdrop-blur-sm dark:text-white text-black p-6 shadow-lg rounded-xl">
                <SidebarContent unreadCount={unreadCount} t={t} onClose={onClose} handleLanguageChange={handleLanguageChange} />
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
                <SidebarContent onClose={onClose} unreadCount={unreadCount} t={t} handleLanguageChange={handleLanguageChange} />
            </motion.div>
        </>
    );
}

const SidebarContent = ({ onClose, unreadCount, t, handleLanguageChange }) => {
    return (
        <>
            <h1 className="text-3xl font-bold mb-8 text-center">{t('appName')}</h1>
            <ul className="space-y-5">
                {menuItems.map((item, index) => {
                    const isNotification = item.name === 'notifications';
                    return (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                onClick={() => onClose?.()}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-5 py-3 rounded-full transition-all 
                                    ${isActive ? 'bg-blue-600 text-white' : 'text-black dark:text-white hover:bg-blue-600'} 
                                    hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 
                                    transform hover:scale-105 relative`
                                }
                            >
                                {item.icon}
                                <span className="text-lg font-medium">{t(item.name)}</span>
                                {isNotification && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>

            {/* Language Switcher */}
            <div className="mt-8 flex justify-center gap-4">
                <button onClick={() => handleLanguageChange('en')} className="text-xl">
                    <img src="/resource/flags/US.png" width={50} />
                </button>
                <button onClick={() => handleLanguageChange('cn')} className="text-xl">
                    <img src="/resource/flags/CN.png" width={50} />
                </button>
                <button onClick={() => handleLanguageChange('tw')} className="text-xl">
                    <img src="/resource/flags/TW.png" width={50} />
                </button>
            </div>
        </>
    );
};

export default Sidebar;
