import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, Mail, User, ChevronDown, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const menuItems = [
    { name: 'posts', icon: <Home size={20} />, path: '/' },
    { name: 'search', icon: <Search size={20} />, path: '/search' },
    { name: 'notifications', icon: <Bell size={20} />, path: '/notifications' },
    { name: 'messages', icon: <Mail size={20} />, path: '/messages' },
    { name: 'profile', icon: <User size={20} />, path: '/profile' },
];

// Language options configuration
const languageOptions = [
    { code: 'en', name: 'English', flag: '/resource/flags/US.png' },
    { code: 'cn', name: '中文', flag: '/resource/flags/CN.png' },
    { code: 'tw', name: '繁體中文', flag: '/resource/flags/TW.png' },
    { code: 'jp', name: '日本語', flag: '/resource/flags/JP.png' },
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
                <SidebarContent unreadCount={unreadCount} t={t} onClose={onClose} handleLanguageChange={handleLanguageChange} language={language} />
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
                <SidebarContent onClose={onClose} unreadCount={unreadCount} t={t} handleLanguageChange={handleLanguageChange} language={language} />
            </motion.div>
        </>
    );
}

const SidebarContent = ({ onClose, unreadCount, t, handleLanguageChange, language }) => {
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    
    // Get current language info
    const currentLanguage = languageOptions.find(lang => lang.code === language) || languageOptions[0];

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

            {/* Language Dropdown */}
            <div className="mt-8 relative">
                <button
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <div className="flex items-center gap-3">
                        <Globe size={20} className="text-gray-500 dark:text-gray-400" />
                        <img src={currentLanguage.flag} alt={currentLanguage.name} className="w-6 h-4 rounded-sm" />
                        <span className="font-medium text-gray-900 dark:text-white">{currentLanguage.name}</span>
                    </div>
                    <ChevronDown 
                        size={16} 
                        className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                            isLanguageDropdownOpen ? 'rotate-180' : ''
                        }`} 
                    />
                </button>

                {/* Dropdown Menu */}
                {isLanguageDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10"
                    >
                        {languageOptions.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    handleLanguageChange(lang.code);
                                    setIsLanguageDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                                    language === lang.code 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                        : 'text-gray-900 dark:text-white'
                                } ${lang.code === languageOptions[0].code ? 'rounded-t-lg' : ''} ${
                                    lang.code === languageOptions[languageOptions.length - 1].code ? 'rounded-b-lg' : ''
                                }`}
                            >
                                <img src={lang.flag} alt={lang.name} className="w-6 h-4 rounded-sm" />
                                <span className="font-medium">{lang.name}</span>
                                {language === lang.code && (
                                    <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>
        </>
    );
};

export default Sidebar;
