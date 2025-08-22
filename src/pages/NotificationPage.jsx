import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Heart, MessageCircle, UserPlus, Repeat, Eye, CheckCheck, Trash2, Filter } from 'lucide-react';
import config from '../config';
import { formatDistanceToNow } from 'date-fns';
import cn from "../utils/cn";
import { useTranslation } from 'react-i18next';

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const [selectedType, setSelectedType] = useState('all'); // 'all', 'like', 'reply', 'follow', 'repost'
    const navigate = useNavigate();
    const { t } = useTranslation();

    const token = JSON.parse(localStorage.getItem('user'))?.token;
    
    useEffect(() => {
        document.title = t('notifications_title');
    }, [t]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!token) return;

            try {
                const res = await fetch(`${config.apiBaseUrl}/api/notification/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                if (res.ok) {
                    setNotifications(data.notifications || []);
                }
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [token]);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like':
                return <Heart size={16} className="text-red-500" />;
            case 'reply':
                return <MessageCircle size={16} className="text-blue-500" />;
            case 'follow':
                return <UserPlus size={16} className="text-green-500" />;
            case 'repost':
                return <Repeat size={16} className="text-purple-500" />;
            default:
                return <Bell size={16} className="text-gray-500" />;
        }
    };

    const renderMessage = (n) => {
        const from = n.from?.username || t('unknown_user');
        switch (n.type) {
            case 'like':
                return `@${from} ${t('notification_like')}`;
            case 'reply':
                return `@${from} ${t('notification_reply')}: ${n.message}`;
            case 'follow':
                return `@${from} ${t('notification_follow')}`;
            case 'repost':
                return `@${from} ${t('notification_repost')}`;
            default:
                return n.message || t('notification_new');
        }
    };

    // Filter notifications based on selected filters
    const filteredNotifications = notifications.filter(n => {
        const matchesReadFilter = filter === 'all' || 
            (filter === 'unread' && !n.isRead) || 
            (filter === 'read' && n.isRead);
        
        const matchesTypeFilter = selectedType === 'all' || n.type === selectedType;
        
        return matchesReadFilter && matchesTypeFilter;
    });

    const markAllAsRead = async () => {
        try {
            const res = await fetch(`${config.apiBaseUrl}/api/notification/mark-all-read`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, isRead: true }))
                );
            }
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const handleView = async (n) => {
        if (!n.isRead) {
            try {
                await fetch(`${config.apiBaseUrl}/api/notification/read/${n._id}`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotifications((prev) =>
                    prev.map((item) =>
                        item._id === n._id ? { ...item, isRead: true } : item
                    )
                );
            } catch (err) {
                console.error('Failed to mark as read', err);
            }
        }
        navigate(`/post/${n.post._id}`);
    };

    const filterOptions = [
        { id: 'all', label: t('All'), count: notifications.length },
        { id: 'unread', label: t('Unread'), count: notifications.filter(n => !n.isRead).length },
        { id: 'read', label: t('Read'), count: notifications.filter(n => n.isRead).length }
    ];

    const typeOptions = [
        { id: 'all', label: t('All Types'), icon: Bell },
        { id: 'like', label: t('Likes'), icon: Heart },
        { id: 'reply', label: t('Replies'), icon: MessageCircle },
        { id: 'follow', label: t('Follows'), icon: UserPlus },
        { id: 'repost', label: t('Reposts'), icon: Repeat }
    ];

    if (loading) {
        return (
            <motion.div 
                className="min-h-screen flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <motion.div
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div 
                    className="text-center mb-8"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <motion.h1 
                        className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Bell className="text-blue-500" size={36} />
                        {t('notifications')}
                    </motion.h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Stay updated with your latest activities
                    </p>
                </motion.div>

                {/* Controls */}
                <motion.div 
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden mb-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Filter Tabs */}
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.map((option) => (
                                    <motion.button
                                        key={option.id}
                                        onClick={() => setFilter(option.id)}
                                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                                            filter === option.id
                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                : 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span>{option.label}</span>
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                            {option.count}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                {notifications.some((n) => !n.isRead) && (
                                    <motion.button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500/90 text-white rounded-xl hover:bg-green-600/90 transition-colors duration-200 shadow-lg shadow-green-500/25"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <CheckCheck size={16} />
                                        {t('mark_all_read')}
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex flex-wrap gap-2">
                                {typeOptions.map((option) => (
                                    <motion.button
                                        key={option.id}
                                        onClick={() => setSelectedType(option.id)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                            selectedType === option.id
                                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                                                : 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <option.icon size={14} />
                                        <span>{option.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Notifications List */}
                <motion.div 
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="p-6">
                        {filteredNotifications.length === 0 ? (
                            <motion.div 
                                className="text-center py-16"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bell size={40} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {notifications.length === 0 ? t('no_notifications') : t('No matching notifications')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {notifications.length === 0 
                                        ? "You're all caught up! Check back later for new notifications."
                                        : "Try adjusting your filters to see more notifications."
                                    }
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {filteredNotifications.map((n, index) => (
                                        <motion.div
                                            key={n._id}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                            transition={{ 
                                                duration: 0.3,
                                                delay: index * 0.05
                                            }}
                                            whileHover={{ y: -2 }}
                                            className={cn(
                                                'flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer group relative overflow-hidden',
                                                !n.isRead
                                                    ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50 shadow-lg shadow-blue-500/10'
                                                    : 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-50/80 dark:hover:bg-gray-600/50'
                                            )}
                                            onClick={() => n.post && handleView(n)}
                                        >
                                            {/* Unread Indicator */}
                                            {!n.isRead && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                                            )}

                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={n.from?.avatarimg || '/resource/default-avatar.png'}
                                                    alt="avatar"
                                                    className="w-12 h-12 rounded-full object-cover shadow-md"
                                                />
                                                {/* Notification Type Icon */}
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                                                    {getNotificationIcon(n.type)}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                                                        {renderMessage(n)}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {n.post && (
                                                            <motion.div
                                                                className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium"
                                                                whileHover={{ scale: 1.05 }}
                                                            >
                                                                <Eye size={12} />
                                                                {t('view')}
                                                            </motion.div>
                                                        )}
                                                        {!n.isRead && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default NotificationPage;
