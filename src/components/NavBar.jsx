import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

function NavBar({ handleSidebarToggle, isSidebarOpen, user }) {
    const location = useLocation();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div 
            className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/50 shadow-xl z-40"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="flex items-center justify-between relative h-16 px-4 sm:px-6 lg:px-8">
                {/* Left Section */}
                <div className="flex items-center">
                    {/* Hamburger Menu Button - Mobile Only */}
                    {!isSidebarOpen && (
                        <motion.button
                            onClick={handleSidebarToggle}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 backdrop-blur-sm transition-colors duration-200 lg:hidden"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Menu size={20} className="text-gray-700 dark:text-gray-300" />
                        </motion.button>
                    )}
                    
                    {/* Spacer for PC to balance layout */}
                    <div className="hidden lg:block w-10"></div>
                </div>

                {/* Logo - Center */}
                <motion.div 
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                >
                    <Link to="/" className="flex items-center justify-center">
                        <motion.img 
                            src="/resource/logo.png" 
                            alt="Sorami Logo" 
                            className="w-10 h-10 rounded-xl shadow-lg"
                            animate={{ 
                                rotate: isHovered ? 360 : 0,
                                boxShadow: isHovered 
                                    ? "0 10px 25px rgba(59, 130, 246, 0.3)" 
                                    : "0 4px 6px rgba(0, 0, 0, 0.1)"
                            }}
                            transition={{ 
                                rotate: { duration: 0.6, ease: "easeInOut" },
                                boxShadow: { duration: 0.3 }
                            }}
                        />
                    </Link>
                </motion.div>

                {/* Right Section - Avatar */}
                <div className="flex items-center">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                    >
                        <Link 
                            to="/profile" 
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-lg hover:shadow-xl transition-shadow duration-200"
                        >
                            <img
                                src={user?.avatarimg || '/resource/default-avatar.png'}
                                alt="User Avatar"
                                className="w-full h-full rounded-xl object-cover border-2 border-white/20"
                            />
                        </Link>
                        
                        {/* Online Status Indicator */}
                        <motion.div
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </motion.div>
                </div>

                {/* Background Blur Effect on Mobile Menu */}
                {isSidebarOpen && (
                    <motion.div
                        className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </div>
        </motion.div>
    );
}

export default NavBar;
