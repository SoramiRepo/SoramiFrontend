import React, { useState, useEffect, useRef, useCallback } from 'react';
import { debounce, handle429Error } from '../utils/rateLimiter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    fetchChatSessions, 
    fetchChatHistory, 
    sendMessage, 
    markMessageAsRead,
    fetchUnreadMessageCount 
} from '../utils/api';
import { 
    connectWS, 
    onEvent, 
    offEvent, 
    sendWSMessage, 
    joinChatRoom, 
    leaveChatRoom,
    isWSConnected 
} from '../utils/ws';
import { getCurrentUserId } from '../utils/auth';
import MessageList from '../components/MessageList';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ToastContext';

export default function MessagePage() {
    const { t } = useTranslation();
    const { showToast } = useToast();
    
    const [chatSessions, setChatSessions] = useState([]);
    const [currentChatUser, setCurrentChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadMap, setUnreadMap] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    
    const messagesEndRef = useRef(null);
    
    // 获取当前用户ID
    const currentUserId = getCurrentUserId();
    
    // 调试信息
    console.log('MessagePage - Current user ID:', currentUserId);
    console.log('MessagePage - localStorage user:', localStorage.getItem('user'));
    
    // 如果还是获取不到，尝试其他方法
    if (!currentUserId) {
        console.error('Failed to get current user ID! Available localStorage keys:', Object.keys(localStorage));
        console.log('localStorage contents:', {
            user: localStorage.getItem('user'),
            token: localStorage.getItem('token'),
            userId: localStorage.getItem('userId'),
            currentUserId: localStorage.getItem('currentUserId')
        });
    }

    // ==================== 核心函数定义 ====================
    
    // 加载聊天会话列表
    const loadChatSessions = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetchChatSessions();
            setChatSessions(response.sessions || []);
        } catch (error) {
            console.error('Failed to load chat sessions:', error);
            if (!handle429Error(error, showToast, t)) {
                showToast(t('failed_to_load_chats'), 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [showToast, t]);

    // 加载未读消息数
    const loadUnreadCount = useCallback(async () => {
        try {
            const response = await fetchUnreadMessageCount();
            const unreadData = response.unreadCount || {};
            setUnreadMap(unreadData);
        } catch (error) {
            console.error('Failed to load unread count:', error);
            if (!handle429Error(error, showToast, t)) {
                showToast(t('failed_to_load_unread_count'), 'error');
            }
        }
    }, [showToast, t]);

    // 标记所有消息为已读
    const markAllMessagesAsRead = useCallback(async (messagesToMark) => {
        const unreadMessages = messagesToMark.filter(msg => 
            !msg.isRead && msg.receiver === currentUserId
        );
        
        for (const message of unreadMessages) {
            try {
                await markMessageAsRead(message._id);
            } catch (error) {
                console.error('Failed to mark message as read:', error);
            }
        }
        
        // 更新未读消息数
        if (unreadMessages.length > 0 && currentChatUser) {
            setUnreadMap(prev => ({
                ...prev,
                [currentChatUser._id]: Math.max(0, (prev[currentChatUser._id] || 0) - unreadMessages.length)
            }));
        }
    }, [currentUserId, currentChatUser]);

    // 加载聊天记录
    const loadChatHistory = useCallback(async (page = 1, append = false) => {
        if (!currentChatUser) return;
        
        try {
            setIsLoading(true);
            const response = await fetchChatHistory(currentChatUser._id, page);
            const newMessages = response.messages || [];
            
            // 调试：检查服务端返回的消息格式
            console.log('Loaded messages from server:', newMessages);
            console.log('Current user ID:', currentUserId);
            newMessages.forEach((msg, index) => {
                console.log(`Message ${index}:`, {
                    id: msg._id,
                    content: msg.content,
                    sender: msg.sender,
                    senderType: typeof msg.sender,
                    senderId: msg.sender?._id || msg.sender,
                    isOwnMessage: (msg.sender?._id === currentUserId || msg.sender === currentUserId)
                });
            });
            
            if (append) {
                setMessages(prev => {
                    // 去重逻辑：避免重复消息
                    const existingIds = new Set(prev.map(msg => msg._id));
                    const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg._id));
                    return [...uniqueNewMessages, ...prev];
                });
            } else {
                setMessages(newMessages);
            }
            
            setHasMore(newMessages.length === 50); // 假设每页50条消息
            setCurrentPage(page);
            
            // 标记所有消息为已读
            markAllMessagesAsRead(newMessages);
        } catch (error) {
            console.error('Failed to load chat history:', error);
            showToast(t('failed_to_load_messages'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentChatUser, currentUserId, showToast, t, markAllMessagesAsRead]);

    // 更新聊天会话列表（添加防抖）
    const updateChatSessions = useCallback(
        debounce(() => {
            loadChatSessions();
            loadUnreadCount();
        }, 1000), // 1秒防抖
        [loadChatSessions, loadUnreadCount]
    );

    // 更新用户在线状态
    const updateUserOnlineStatus = useCallback((userId, isOnline) => {
        setChatSessions(prev => prev.map(session => {
            // 处理新的API格式（直接有otherUser字段）
            if (session.otherUser && session.otherUser._id === userId) {
                return {
                    ...session,
                    otherUser: { ...session.otherUser, isOnline }
                };
            }
            
            // 兼容旧的participants格式
            if (session.participants && Array.isArray(session.participants)) {
                const otherUser = session.participants.find(p => p._id !== currentUserId);
                if (otherUser?._id === userId) {
                    return {
                        ...session,
                        participants: session.participants.map(p => 
                            p._id === userId ? { ...p, isOnline } : p
                        )
                    };
                }
            }
            
            return session;
        }));
    }, [currentUserId]);

    // 滚动到底部
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // 加载更多消息
    const loadMoreMessages = useCallback(() => {
        if (hasMore && !isLoading) {
            loadChatHistory(currentPage + 1, true);
        }
    }, [hasMore, isLoading, currentPage, loadChatHistory]);

    // ==================== WebSocket事件处理 ====================
    
    // WebSocket事件处理函数
    const handleNewMessage = useCallback((data) => {
        console.log('WebSocket new_message received:', data);
        const { message, sessionId } = data;
        
        // 确保消息格式正确
        if (!message) {
            console.error('Invalid message format:', data);
            return;
        }
        
        // 更新消息列表 - 检查是否属于当前会话
        const isCurrentSession = currentChatUser && (
            (message.sender?._id === currentChatUser._id || message.sender?.id === currentChatUser._id || message.sender === currentChatUser._id) ||
            (message.receiver === currentChatUser._id || message.receiver?._id === currentChatUser._id || message.receiver === currentChatUser._id)
        );
        
        if (isCurrentSession) {
            console.log('Adding message to current session:', message);
            
            // 检查是否是自己发送的消息（避免重复添加）
            const isOwnMessage = (message.sender?._id === currentUserId || message.sender?.id === currentUserId || message.sender === currentUserId);
            
            setMessages(prev => {
                // 检查消息是否已经存在，避免重复
                const messageExists = prev.some(msg => msg._id === message._id);
                if (messageExists) {
                    console.log('Message already exists, skipping:', message._id);
                    return prev;
                }
                
                // 如果是自己发送的消息，检查是否已经有相同内容的消息（临时消息或已发送消息）
                if (isOwnMessage) {
                    const sameContentExists = prev.some(msg => 
                        msg.content === message.content && 
                        (msg.sender?._id === currentUserId || msg.sender?.id === currentUserId || msg.sender === currentUserId) &&
                        Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000 // 5秒内的消息
                    );
                    
                    if (sameContentExists) {
                        console.log('Same content message already exists, skipping WebSocket message:', message._id);
                        return prev;
                    }
                }
                
                return [...prev, message];
            });
            
            // 标记消息为已读
            if ((message.receiver === currentUserId || message.receiver?._id === currentUserId || message.receiver?.id === currentUserId) && !message.isRead) {
                markMessageAsRead(message._id);
            }
        }
        
        // 更新未读消息数
        if (message.receiver === currentUserId || message.receiver?._id === currentUserId || message.receiver?.id === currentUserId) {
            const senderId = message.sender?._id || message.sender?.id || message.sender;
            if (senderId) {
                setUnreadMap(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1
                }));
            }
        }
        
        // 更新会话列表
        updateChatSessions();
    }, [currentChatUser, currentUserId, updateChatSessions]);

    const handleMessageSent = useCallback((data) => {
        console.log('Message sent confirmation:', data);
        
        if (data.messageId) {
            setMessages(prev => prev.map(msg => 
                msg._id === data.messageId ? { ...msg, isSent: true } : msg
            ));
        }
    }, []);

    const handleUserTyping = useCallback((data) => {
        if (data.userId === currentChatUser?._id) {
            setIsTyping(true);
            setTypingUser(data.username);
        }
    }, [currentChatUser]);

    const handleUserStoppedTyping = useCallback((data) => {
        if (data.userId === currentChatUser?._id) {
            setIsTyping(false);
            setTypingUser(null);
        }
    }, [currentChatUser]);

    const handleMessageRead = useCallback((data) => {
        setMessages(prev => prev.map(msg => 
            msg._id === data.messageId 
                ? { ...msg, isRead: true, readAt: data.readAt }
                : msg
        ));
    }, []);

    const handleUserOnline = useCallback((data) => {
        updateUserOnlineStatus(data.userId, true);
    }, [updateUserOnlineStatus]);

    const handleUserOffline = useCallback((data) => {
        updateUserOnlineStatus(data.userId, false);
    }, [updateUserOnlineStatus]);

    // ==================== useEffect钩子 ====================
    
    // 初始化WebSocket连接和事件监听器
    useEffect(() => {
        connectWS();
        
        // 注册事件监听器
        onEvent('new_message', handleNewMessage);
        onEvent('message_sent', handleMessageSent);
        onEvent('user_typing', handleUserTyping);
        onEvent('user_stopped_typing', handleUserStoppedTyping);
        onEvent('message_read', handleMessageRead);
        onEvent('user_online', handleUserOnline);
        onEvent('user_offline', handleUserOffline);

        // 清理函数
        return () => {
            offEvent('new_message', handleNewMessage);
            offEvent('message_sent', handleMessageSent);
            offEvent('user_typing', handleUserTyping);
            offEvent('user_stopped_typing', handleUserStoppedTyping);
            offEvent('message_read', handleMessageRead);
            offEvent('user_online', handleUserOnline);
            offEvent('user_offline', handleUserOffline);
        };
    }, [handleNewMessage, handleMessageSent, handleUserTyping, handleUserStoppedTyping, handleMessageRead, handleUserOnline, handleUserOffline]);

    // 组件卸载时清理所有状态
    useEffect(() => {
        return () => {
            setMessages([]);
            setChatSessions([]);
            setUnreadMap({});
            setCurrentChatUser(null);
            setCurrentPage(1);
            setHasMore(true);
        };
    }, []);

    // 加载聊天会话列表和未读消息数
    useEffect(() => {
        loadChatSessions();
        loadUnreadCount();
    }, [loadChatSessions, loadUnreadCount]);

    // 加载聊天记录
    useEffect(() => {
        if (currentChatUser) {
            // 清理之前的消息状态
            setMessages([]);
            setCurrentPage(1);
            setHasMore(true);
            
            loadChatHistory();
            // 加入聊天房间
            if (isWSConnected()) {
                joinChatRoom(currentChatUser._id);
            }
        }
        
        return () => {
            if (currentChatUser && isWSConnected()) {
                leaveChatRoom(currentChatUser._id);
            }
        };
    }, [currentChatUser, loadChatHistory]);

    // 自动滚动到底部
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // ==================== 消息处理函数 ====================
    
    // 发送消息
    const handleSendMessage = async (messageData) => {
        if (!currentChatUser) return;
        
        try {
            // 获取当前用户信息
            const currentUser = JSON.parse(localStorage.getItem('user'));
            
            // 先添加到本地消息列表（乐观更新）
            const tempMessage = {
                _id: `temp_${Date.now()}`,
                sender: { 
                    _id: currentUserId,
                    username: currentUser?.username,
                    avatarname: currentUser?.avatarname,
                    avatarimg: currentUser?.avatarimg
                },
                receiver: currentChatUser._id,
                content: messageData.content || "测试消息内容", // 确保有内容
                messageType: messageData.messageType || 'text', // 确保有类型
                isRead: false,
                createdAt: new Date(),
                isTemp: true // 标记为临时消息
            };
            
            console.log('Adding temp message:', tempMessage);
            console.log('Current messages before adding:', messages);
            setMessages(prev => {
                // 检查是否已经有相同的临时消息
                const hasTempMessage = prev.some(msg => 
                    msg.isTemp && 
                    msg.content === tempMessage.content && 
                    msg.createdAt.getTime() === tempMessage.createdAt.getTime()
                );
                
                if (hasTempMessage) {
                    console.log('Temp message already exists, skipping');
                    return prev;
                }
                
                const newMessages = [...prev, tempMessage];
                console.log('New messages after adding temp:', newMessages);
                return newMessages;
            });
            
            // 发送消息
            console.log('Sending to API with data:', {
                receiverId: messageData.receiverId,
                content: messageData.content,
                messageType: messageData.messageType
            });
            
            const response = await sendMessage(
                messageData.receiverId, 
                messageData.content, 
                messageData.messageType
            );
            
            console.log('API response:', response);
            
            // 检查API响应格式
            if (response.message && typeof response.message === 'object') {
                // 如果返回的是消息对象，替换临时消息
                console.log('Replacing temp message with real message object:', response.message);
                setMessages(prev => {
                    // 检查是否已经存在相同的消息
                    const messageExists = prev.some(msg => 
                        msg._id === response.message._id || 
                        (msg.content === response.message.content && 
                         msg.createdAt && response.message.createdAt &&
                         Math.abs(new Date(msg.createdAt).getTime() - new Date(response.message.createdAt).getTime()) < 1000)
                    );
                    
                    if (messageExists) {
                        console.log('Message already exists, removing temp message');
                        return prev.filter(msg => msg._id !== tempMessage._id);
                    }
                    
                    return prev.map(msg => 
                        msg._id === tempMessage._id ? response.message : msg
                    );
                });
            } else if (response.message && typeof response.message === 'string') {
                // 如果返回的是字符串（如"Message sent successfully"），保持临时消息
                console.log('API returned success string, keeping temp message:', response.message);
                // 只更新临时消息状态，不替换内容
                setMessages(prev => prev.map(msg => 
                    msg._id === tempMessage._id ? { ...msg, isTemp: false, isSent: true } : msg
                ));
            } else {
                console.warn('Unexpected API response format:', response);
                // 保持临时消息，标记为已发送
                setMessages(prev => prev.map(msg => 
                    msg._id === tempMessage._id ? { ...msg, isTemp: false, isSent: true } : msg
                ));
            }
            
            // 更新会话列表
            updateChatSessions();
            
            // 通过WebSocket发送（确保消息格式正确）
            if (isWSConnected()) {
                const wsMessage = {
                    receiverId: messageData.receiverId,
                    content: messageData.content,
                    messageType: messageData.messageType,
                    sender: currentUserId
                };
                console.log('Sending WebSocket message:', wsMessage);
                sendWSMessage(wsMessage);
            }
            
        } catch (error) {
            console.error('Failed to send message:', error);
            showToast(t('failed_to_send_message'), 'error');
            
            // 移除临时消息
            setMessages(prev => prev.filter(msg => !msg.isTemp));
        }
    };

    // 删除消息
    const handleDeleteMessage = useCallback((messageId) => {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
    }, []);

    // 标记消息为已读
    const handleMarkMessageAsRead = useCallback(async (messageId) => {
        try {
            await markMessageAsRead(messageId);
            setMessages(prev => prev.map(msg => 
                msg._id === messageId ? { ...msg, isRead: true } : msg
            ));
        } catch (error) {
            console.error('Failed to mark message as read:', error);
        }
    }, []);

    // ==================== 移动端状态管理 ====================
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

    // 监听窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 移动端选择聊天后自动关闭侧边栏
    const handleChatSelect = useCallback((user) => {
        setCurrentChatUser(user);
        if (windowWidth < 768) {
            setIsMobileMenuOpen(false);
        }
    }, [windowWidth]);

    // ==================== 渲染部分 ====================
    
    return (
        <div className="flex h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900 relative">
            {/* 移动端遮罩 */}
            {isMobileMenuOpen && windowWidth < 768 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/20 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* 左侧聊天列表 */}
            <motion.div
                className={`
                    ${windowWidth < 768 ? 'fixed' : 'relative'} 
                    ${windowWidth < 768 ? 'inset-y-0 left-0' : ''} 
                    ${windowWidth < 768 ? 'w-80' : 'w-1/3'} 
                    ${windowWidth < 768 ? 'z-50' : 'z-0'}
                    ${windowWidth < 768 && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
                    transition-transform duration-300 ease-in-out
                    bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
                    shadow-xl md:shadow-none
                `}
                initial={false}
                animate={{ 
                    x: windowWidth < 768 ? (isMobileMenuOpen ? 0 : -320) : 0 
                }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
                <MessageList
                    chatList={chatSessions}
                    currentChatUser={currentChatUser}
                    onSelect={handleChatSelect}
                    unreadMap={unreadMap}
                />
            </motion.div>

            {/* 右侧聊天区域 */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
                {currentChatUser ? (
                    <>
                        {/* 聊天头部 */}
                        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {/* 移动端菜单按钮 */}
                            <div className="flex items-center gap-3">
                                {windowWidth < 768 && (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsMobileMenuOpen(true)}
                                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </motion.button>
                                )}
                                
                                {/* 用户信息 */}
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            src={currentChatUser.avatarimg || '/resource/default-avatar.png'}
                                            alt="avatar"
                                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                                        />
                                        {/* 在线状态 */}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                                            currentChatUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                        }`}></div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base truncate">
                                            {currentChatUser.avatarname || currentChatUser.username}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                                {currentChatUser.isOnline ? t('online') : t('offline')}
                                            </span>
                                            {currentChatUser.isOnline && (
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 输入提示 */}
                            <AnimatePresence>
                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full text-xs md:text-sm text-blue-600 dark:text-blue-400"
                                    >
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="hidden md:inline">{typingUser} {t('is_typing')}...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 消息列表 */}
                        <div className="flex-1 overflow-y-auto">
                            {/* 加载更多按钮 */}
                            {hasMore && (
                                <div className="text-center p-4">
                                    <motion.button
                                        onClick={loadMoreMessages}
                                        disabled={isLoading}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                <span>{t('loading')}</span>
                                            </div>
                                        ) : (
                                            t('load_more')
                                        )}
                                    </motion.button>
                                </div>
                            )}
                            
                            {/* 消息容器 */}
                            <div className="px-4 pb-4 space-y-4">
                                <AnimatePresence>
                                    {messages.map((message) => {
                                        // 兼容两种字段名：_id 和 id
                                        const senderId = message.sender?._id || message.sender?.id || message.sender;
                                        const isOwn = senderId === currentUserId;
                                        
                                        return (
                                            <ChatMessage
                                                key={message._id}
                                                message={message}
                                                isOwnMessage={isOwn}
                                                onDelete={handleDeleteMessage}
                                                onMarkAsRead={handleMarkMessageAsRead}
                                                showAvatar={!isOwn}
                                            />
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                            
                            {/* 滚动到底部的引用 */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* 聊天输入 */}
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <ChatInput
                                onSend={handleSendMessage}
                                receiverId={currentChatUser._id}
                                placeholder={t('type_message')}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center max-w-md mx-auto"
                        >
                            {/* 移动端显示菜单按钮 */}
                            {windowWidth < 768 && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="mb-6 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
                                >
                                    {t('select_chat')}
                                </motion.button>
                            )}
                            
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <motion.span 
                                    className="text-3xl md:text-4xl"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    💬
                                </motion.span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                {t('select_chat')}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                                {t('select_chat_hint')}
                            </p>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
