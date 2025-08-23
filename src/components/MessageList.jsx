import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'timeago.js';
import { useTranslation } from 'react-i18next';

export default function MessageList({ 
    chatList, 
    currentChatUser, 
    onSelect, 
    unreadMap,
    onDeleteSession 
}) {
    const { t } = useTranslation();

    if (!chatList || chatList.length === 0) {
        return (
            <div className="w-1/3 p-4 flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <p className="text-xl font-semibold mb-4">{t('no_contacts')}</p>
                    <p>{t('start_conversation_hint')}</p>
                    <div className="mt-4">
                        <span role="img" aria-label="sparkles" className="text-4xl">✨</span>
                    </div>
                </div>
            </div>
        );
    }

    const getLastMessagePreview = (session) => {
        if (!session || !session.lastMessage) return t('no_messages');
        
        const content = session.lastMessage.content;
        if (!content) return t('no_messages');
        
        if (session.lastMessage.messageType === 'image') {
            return '🖼️ Image';
        } else if (session.lastMessage.messageType === 'file') {
            return '📎 File';
        } else {
            return content.length > 30 ? content.substring(0, 30) + '...' : content;
        }
    };

    const getOtherUser = (session) => {
        // 安全检查：确保session存在
        if (!session) {
            console.warn('Invalid session data:', session);
            return null;
        }
        
        // 检查是否直接有otherUser字段（新的API格式）
        if (session.otherUser) {
            if (session.otherUser._id) {
                return session.otherUser;
            } else {
                console.warn('Invalid otherUser data:', session.otherUser);
                return null;
            }
        }
        
        // 兼容旧的participants格式
        if (session.participants && Array.isArray(session.participants) && session.participants.length > 0) {
            const currentUserId = JSON.parse(localStorage.getItem('user'))?._id;
            const otherUser = session.participants.find(p => p && p._id && p._id !== currentUserId) || session.participants[0];
            
            if (!otherUser || !otherUser._id) {
                console.warn('Invalid user data in participants:', otherUser);
                return null;
            }
            
            return otherUser;
        }
        
        console.warn('No valid user data found in session:', session);
        return null;
    };

    return (
        <div className="w-1/3 border-r overflow-y-auto bg-white dark:bg-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('messages')}
                </h2>
            </div>
            
            <AnimatePresence>
                {chatList.map((session, index) => {
                    const otherUser = getOtherUser(session);
                    
                    // 跳过无效的会话数据
                    if (!otherUser) {
                        console.warn('Skipping invalid session:', session);
                        return null;
                    }
                    
                    const unreadCount = unreadMap[otherUser._id] || 0;
                    const isActive = currentChatUser?._id === otherUser._id;
                    
                    return (
                        <motion.div
                            key={session._id || otherUser._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                                p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700
                                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200
                                ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}
                            `}
                            onClick={() => onSelect(otherUser)}
                        >
                            <div className="flex items-start space-x-3 relative">
                                {/* 头像 */}
                                <div className="flex-shrink-0 relative">
                                    {otherUser.avatarimg ? (
                                        <img 
                                            src={otherUser.avatarimg} 
                                            alt="avatar" 
                                            className="w-12 h-12 rounded-full object-cover" 
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-semibold">
                                            {otherUser.avatarname?.[0] || otherUser.username?.[0]}
                                        </div>
                                    )}
                                    
                                    {/* 在线状态指示器 */}
                                    {otherUser.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                                    )}
                                </div>

                                {/* 用户信息和消息预览 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                            {otherUser.avatarname || otherUser.username}
                                        </h3>
                                        {session && session.lastMessageAt && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                                {format(session.lastMessageAt)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                        {getLastMessagePreview(session)}
                                    </p>
                                </div>

                                {/* 未读消息数 */}
                                {unreadCount > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </motion.div>
                                )}
                            </div>

                            {/* 会话操作菜单（可选） */}
                            {isActive && onDeleteSession && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession(session._id);
                                        }}
                                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        {t('delete_conversation')}
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
