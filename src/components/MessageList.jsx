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
            <div className="h-full flex flex-col bg-white dark:bg-gray-800">
                <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                        {t('messages')}
                    </h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <motion.span 
                                className="text-2xl md:text-3xl"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                ✨
                            </motion.span>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('no_contacts')}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                            {t('start_conversation_hint')}
                        </p>
                    </motion.div>
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
        <div className="h-full flex flex-col bg-white dark:bg-gray-800">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {t('messages')}
                </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">{/* 内容将在下面替换 */}
            
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
                            whileTap={{ scale: 0.98 }}
                            className={`
                                p-4 md:p-5 cursor-pointer border-b border-gray-100 dark:border-gray-700
                                hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200
                                ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}
                                active:bg-gray-100 dark:active:bg-gray-600
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
                                            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover" 
                                        />
                                    ) : (
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                                            {otherUser.avatarname?.[0] || otherUser.username?.[0]}
                                        </div>
                                    )}
                                    
                                    {/* 在线状态指示器 */}
                                    {otherUser.isOnline && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                                    )}
                                </div>

                                {/* 用户信息和消息预览 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm md:text-base">
                                            {otherUser.avatarname || otherUser.username}
                                        </h3>
                                        {session && session.lastMessageAt && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                                {format(session.lastMessageAt)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                                            {getLastMessagePreview(session)}
                                        </p>
                                        
                                        {/* 未读消息数 */}
                                        {unreadCount > 0 && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                whileHover={{ scale: 1.1 }}
                                                className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5"
                                            >
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
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
        </div>
    );
}
