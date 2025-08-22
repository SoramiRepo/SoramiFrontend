import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, Mail, User, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
            {/* Desktop Sidebar */}
            <div style={{ minHeight: 'calc(100vh - 10px)' }} className="hidden lg:block fixed top-2 left-2 z-50 w-72 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 dark:text-white text-black p-6 shadow-2xl rounded-2xl">
                <SidebarContent unreadCount={unreadCount} t={t} onClose={onClose} handleLanguageChange={handleLanguageChange} language={language} />
            </div>

            {/* Mobile Sidebar */}
            <motion.div
                initial="closed"
                animate={isOpen ? 'open' : 'closed'}
                variants={{
                    open: { x: 0 },
                    closed: { x: -320 },
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 z-50 w-80 min-h-screen text-black dark:text-white shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl lg:hidden border-r border-white/20 dark:border-gray-800/50"
            >
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                    <h1 className="text-2xl font-bold">{t('appName')}</h1>
                    <motion.button 
                        onClick={onClose} 
                        className="p-2 rounded-full bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </motion.button>
                </div>
                
                {/* Mobile Content */}
                <div className="p-6">
                    <SidebarContent onClose={onClose} unreadCount={unreadCount} t={t} handleLanguageChange={handleLanguageChange} language={language} isMobile={true} />
                </div>
            </motion.div>
        </>
    );
}

const SidebarContent = ({ onClose, unreadCount, t, handleLanguageChange, language, isMobile = false }) => {
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    
    // Get current language info
    const currentLanguage = languageOptions.find(lang => lang.code === language) || languageOptions[0];

    return (
        <>
            {!isMobile && (
                <h1 className="text-3xl font-bold mb-8 text-center">{t('appName')}</h1>
            )}
            <nav className={isMobile ? 'space-y-2' : 'space-y-4'}>
                {menuItems.map((item, index) => {
                    const isNotification = item.name === 'notifications';
                    return (
                        <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <NavLink
                                to={item.path}
                                onClick={() => onClose?.()}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative
                                    ${isActive 
                                        ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/25' 
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                                    } 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 backdrop-blur-sm`
                                }
                            >
                                <div className="relative">
                                    {item.icon}
                                    {isNotification && unreadCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
                                        >
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </motion.span>
                                    )}
                                </div>
                                <span className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
                                    {t(item.name)}
                                </span>
                            </NavLink>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Language Dropdown */}
            <div className={`${isMobile ? 'mt-6' : 'mt-8'} relative`}>
                <motion.button
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center gap-3">
                        <Globe size={18} className="text-gray-500 dark:text-gray-400" />
                        <img src={currentLanguage.flag} alt={currentLanguage.name} className="w-5 h-3 rounded-sm" />
                        <span className={`font-medium text-gray-900 dark:text-white ${isMobile ? 'text-sm' : 'text-base'}`}>
                            {currentLanguage.name}
                        </span>
                    </div>
                    <motion.div
                        animate={{ rotate: isLanguageDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
                    </motion.div>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isLanguageDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl z-20 overflow-hidden"
                        >
                            {languageOptions.map((lang, index) => (
                                <motion.button
                                    key={lang.code}
                                    onClick={() => {
                                        handleLanguageChange(lang.code);
                                        setIsLanguageDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-150 ${
                                        language === lang.code 
                                            ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                            : 'text-gray-900 dark:text-white'
                                    }`}
                                    whileHover={{ x: 4 }}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <img src={lang.flag} alt={lang.name} className="w-5 h-3 rounded-sm" />
                                    <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                                        {lang.name}
                                    </span>
                                    {language === lang.code && (
                                        <motion.div 
                                            className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.1 }}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default Sidebar;
