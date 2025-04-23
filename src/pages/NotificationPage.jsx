import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import config from '../config';
import { formatDistanceToNow } from 'date-fns';
import cn from "../utils/cn";
import { useTranslation } from 'react-i18next';

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
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

    if (loading) return <div className="p-4 text-center">{t('loading')}</div>;

    return (
        <div className="p-4 max-w-2xl mx-auto bg-white dark:bg-slate-900 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('notifications')}</h1>
                {notifications.some((n) => !n.isRead) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-500 hover:underline dark:text-blue-400"
                    >
                        {t('mark_all_read')}
                    </button>
                )}
            </div>
    
            {notifications.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">{t('no_notifications')}</p>
            ) : (
                <ul className="space-y-3">
                    {notifications.map((n) => (
                        <li
                            key={n._id}
                            className={cn(
                                'flex items-start gap-3 p-3 rounded-lg border transition hover:bg-gray-50 dark:hover:bg-slate-800',
                                !n.isRead
                                    ? 'bg-blue-50 dark:bg-slate-800 border-blue-300 dark:border-slate-600'
                                    : 'border-gray-200 dark:border-slate-700'
                            )}
                        >
                            <img
                                src={n.from?.avatarimg || '/default-avatar.png'}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <p className="text-sm mb-1 text-gray-900 dark:text-gray-100">
                                    {renderMessage(n)}
                                    {n.post && (
                                        <button
                                            onClick={() => handleView(n)}
                                            className="ml-2 text-blue-500 hover:underline dark:text-blue-400"
                                        >
                                            {t('view')}
                                        </button>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NotificationPage;
