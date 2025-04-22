import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import config from '../config';
import { formatDistanceToNow } from 'date-fns'; // 如果哪个傻逼提交pr把这里换成`timeago.js`我非要杀了你不可！！！
import cn from "../utils/cn";

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) return;

            try {
                const res = await fetch(`${config.apiBaseUrl}/api/notification/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
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
    }, []);

    const renderMessage = (n) => {
        const from = n.from?.username || 'Unknown User';
        switch (n.type) {
            case 'like':
                return `@${from} Liked your post`;
            case 'reply':
                return `@${from} Replied you: ${n.message}`;
            case 'follow':
                return `@${from} Followed you`;
            case 'repost':
                return `@${from} Reposted from you`;
            default:
                return n.message || 'You have a new notification';
        }
    };

    if (loading) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold mb-4">Notifications</h1>

            {notifications.length === 0 ? (
                <p className="text-gray-500">Nothing here</p>
            ) : (
                <ul className="space-y-3">
                    {notifications.map((n) => (
                        <li
                            key={n._id}
                            className={cn(
                                'flex items-start gap-3 p-3 rounded-lg border transition hover:bg-gray-50 dark:hover:bg-slate-700',
                                !n.isRead && 'bg-blue-50 dark:bg-slate-800 border-blue-300'
                            )}
                        >
                            <img
                                src={n.from?.avatarimg || '/default-avatar.png'}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <p className="text-sm mb-1">
                                    {renderMessage(n)}
                                    {n.post && (
                                        <Link
                                            to={`/post/${n.post._id}`}
                                            className="ml-2 text-blue-500 hover:underline"
                                        >
                                            View
                                        </Link>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">
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
