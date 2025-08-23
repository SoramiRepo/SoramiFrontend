import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Star, Zap, Shield, Crown, Award, Sparkles, BadgeCheck } from 'lucide-react';

const UserBadges = ({ badges = [], size = 'default', showTooltip = true, expandOnHover = true, circular = false, className = '' }) => {
    // Badge配置
    const badgeConfig = {
        verified: {
            icon: CheckCircle,
            label: 'Verified',
            color: 'bg-blue-500 text-white',
            iconColor: 'text-blue-500',
            description: 'Verified account'
        },
        soramidev: {
            icon: Star,
            label: 'SoramiDev',
            color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
            iconColor: 'text-purple-500',
            description: 'Sorami Developer'
        },
        admin: {
            icon: Shield,
            label: 'Admin',
            color: 'bg-red-500 text-white',
            iconColor: 'text-red-500',
            description: 'Administrator'
        },
        moderator: {
            icon: BadgeCheck,
            label: 'Moderator',
            color: 'bg-green-500 text-white',
            iconColor: 'text-green-500',
            description: 'Community Moderator'
        },
        vip: {
            icon: Crown,
            label: 'VIP',
            color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
            iconColor: 'text-yellow-500',
            description: 'VIP Member'
        },
        premium: {
            icon: Award,
            label: 'Premium',
            color: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
            iconColor: 'text-indigo-500',
            description: 'Premium Member'
        },
        early: {
            icon: Sparkles,
            label: 'Early',
            color: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
            iconColor: 'text-emerald-500',
            description: 'Early Adopter'
        }
    };

    // 尺寸配置
    const sizeConfig = {
        small: {
            container: 'gap-1',
            badge: 'px-1.5 py-0.5 text-xs',
            icon: 'w-3 h-3'
        },
        default: {
            container: 'gap-1.5',
            badge: 'px-2 py-1 text-sm',
            icon: 'w-4 h-4'
        },
        large: {
            container: 'gap-2',
            badge: 'px-3 py-1.5 text-base',
            icon: 'w-5 h-5'
        }
    };

    const currentSize = sizeConfig[size] || sizeConfig.default;

    if (!badges || badges.length === 0) return null;

    return (
        <div className={`flex items-center ${currentSize.container} ${className}`}>
            <AnimatePresence>
                {badges.map((badge, index) => {
                    const config = badgeConfig[badge];
                    if (!config) return null;

                    const IconComponent = config.icon;

                    return (
                        <motion.div
                            key={badge}
                            initial={{ opacity: 0, scale: 0.8, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -5 }}
                            transition={{ 
                                duration: 0.3, 
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            whileHover={{ 
                                scale: 1.1, 
                                y: -2,
                                transition: { duration: 0.2 }
                            }}
                            className="relative group"
                        >
                            <div
                                className={`
                                    flex items-center justify-center
                                    ${circular ? 'w-6 h-6' : currentSize.badge} 
                                    ${config.color}
                                    ${circular ? 'rounded-full' : 'rounded-full'} font-medium
                                    shadow-lg shadow-black/10
                                    hover:shadow-xl hover:shadow-black/20
                                    transition-all duration-200
                                    cursor-default
                                    select-none
                                    overflow-hidden
                                    group
                                `}
                            >
                                <IconComponent className={`${circular ? 'w-3 h-3' : currentSize.icon} flex-shrink-0 ${circular ? '' : 'md:ml-0.5'}`} />
                                {/* PC端hover时显示文字，移动端始终隐藏文字 */}
                                {expandOnHover && (
                                    <span 
                                        className="hidden lg:block whitespace-nowrap transition-all duration-300 ease-out opacity-0 lg:group-hover:opacity-100 max-w-0 lg:group-hover:max-w-xs overflow-hidden ml-1.5"
                                    >
                                        {config.label}
                                    </span>
                                )}
                            </div>

                            {/* 工具提示 */}
                            {showTooltip && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    whileHover={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none whitespace-nowrap"
                                >
                                    <div className="text-center">
                                        <div className="font-semibold">{config.label}</div>
                                        <div className="text-gray-300 text-xs mt-1">
                                            {config.description}
                                        </div>
                                    </div>
                                    {/* 箭头 */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                </motion.div>
                            )}

                            {/* 悬停时的光晕效果 */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                initial={{ scale: 0.8 }}
                                whileHover={{ scale: 1.2 }}
                                transition={{ duration: 0.3 }}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default UserBadges;
