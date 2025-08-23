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
    const currentUserId = JSON.parse(localStorage.getItem('user'))?._id;

    // 初始化WebSocket连接
    useEffect(() => {
        connectWS();
        
        // 监听WebSocket事件
        const handleNewMessage = (data) => {
            console.log('WebSocket new_message received:', data);
            const { message, sessionId } = data;
            
            // 确保消息格式正确
            if (!message) {
                console.error('Invalid message format:', data);
                return;
            }
            
            // 更新消息列表 - 检查是否属于当前会话
            const isCurrentSession = currentChatUser && (
                (message.sender?._id === currentChatUser._id || message.sender === currentChatUser._id) ||
                (message.receiver === currentChatUser._id || message.receiver?._id === currentChatUser._id)
            );
            
            if (isCurrentSession) {
                console.log('Adding message to current session:', message);
                setMessages(prev => [...prev, message]);
                
                // 标记消息为已读
                if ((message.receiver === currentUserId || message.receiver?._id === currentUserId) && !message.isRead) {
                    markMessageAsRead(message._id);
                }
            }
            
            // 更新未读消息数
            if (message.receiver === currentUserId || message.receiver?._id === currentUserId) {
                const senderId = message.sender?._id || message.sender;
                if (senderId) {
                    setUnreadMap(prev => ({
                        ...prev,
                        [senderId]: (prev[senderId] || 0) + 1
                    }));
                }
            }
            
            // 更新会话列表
            updateChatSessions();
        };

        const handleMessageSent = (data) => {
            // 消息发送确认，可以更新UI状态
            console.log('Message sent confirmation:', data);
            
            // 如果消息发送成功，可以更新消息状态
            if (data.messageId) {
                setMessages(prev => prev.map(msg => 
                    msg._id === data.messageId ? { ...msg, isSent: true } : msg
                ));
            }
        };

        const handleUserTyping = (data) => {
            if (data.userId === currentChatUser?._id) {
                setIsTyping(true);
                setTypingUser(data.username);
            }
        };

        const handleUserStoppedTyping = (data) => {
            if (data.userId === currentChatUser?._id) {
                setIsTyping(false);
                setTypingUser(null);
            }
        };

        const handleMessageRead = (data) => {
            // 更新消息已读状态
            setMessages(prev => prev.map(msg => 
                msg._id === data.messageId 
                    ? { ...msg, isRead: true, readAt: data.readAt }
                    : msg
            ));
        };

        const handleUserOnline = (data) => {
            // 更新用户在线状态
            updateUserOnlineStatus(data.userId, true);
        };

        const handleUserOffline = (data) => {
            // 更新用户离线状态
            updateUserOnlineStatus(data.userId, false);
        };

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
    }, [currentChatUser, currentUserId]);

    // 加载聊天会话列表
    useEffect(() => {
        loadChatSessions();
        loadUnreadCount();
    }, []);

    // 加载聊天记录
    useEffect(() => {
        if (currentChatUser) {
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
    }, [currentChatUser]);

    // 自动滚动到底部
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    // 加载聊天记录
    const loadChatHistory = async (page = 1, append = false) => {
        if (!currentChatUser) return;
        
        try {
            setIsLoading(true);
            const response = await fetchChatHistory(currentChatUser._id, page);
            const newMessages = response.messages || [];
            
            if (append) {
                setMessages(prev => [...newMessages, ...prev]);
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
    };

    // 标记所有消息为已读
    const markAllMessagesAsRead = async (messagesToMark) => {
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
        if (unreadMessages.length > 0) {
            setUnreadMap(prev => ({
                ...prev,
                [currentChatUser._id]: Math.max(0, (prev[currentChatUser._id] || 0) - unreadMessages.length)
            }));
        }
    };

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
                setMessages(prev => prev.map(msg => 
                    msg._id === tempMessage._id ? response.message : msg
                ));
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
    const handleDeleteMessage = (messageId) => {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
    };

    // 标记消息为已读
    const handleMarkMessageAsRead = async (messageId) => {
        try {
            await markMessageAsRead(messageId);
            setMessages(prev => prev.map(msg => 
                msg._id === messageId ? { ...msg, isRead: true } : msg
            ));
        } catch (error) {
            console.error('Failed to mark message as read:', error);
        }
    };

    // 更新聊天会话列表（添加防抖）
    const updateChatSessions = useCallback(
        debounce(() => {
            loadChatSessions();
            loadUnreadCount();
        }, 1000), // 1秒防抖
        [loadChatSessions, loadUnreadCount]
    );

    // 更新用户在线状态
    const updateUserOnlineStatus = (userId, isOnline) => {
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
    };

    // 滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 加载更多消息
    const loadMoreMessages = () => {
        if (hasMore && !isLoading) {
            loadChatHistory(currentPage + 1, true);
        }
    };

    return (
        <div className="flex h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900">
            {/* 左边：聊天会话列表 */}
            <MessageList
                chatList={chatSessions}
                currentChatUser={currentChatUser}
                onSelect={setCurrentChatUser}
                unreadMap={unreadMap}
            />

            {/* 右边：聊天窗口 */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
                {currentChatUser ? (
                    <>
                        {/* 聊天头部 */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <img
                                    src={currentChatUser.avatarimg || '/resource/default-avatar.png'}
                                    alt="avatar"
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {currentChatUser.avatarname || currentChatUser.username}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${currentChatUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {currentChatUser.isOnline ? t('online') : t('offline')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 输入提示 */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {typingUser} {t('is_typing')}...
                                </motion.div>
                            )}
                        </div>

                        {/* 消息列表 */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* 加载更多按钮 */}
                            {hasMore && (
                                <div className="text-center">
                                    <button
                                        onClick={loadMoreMessages}
                                        disabled={isLoading}
                                        className="px-4 py-2 text-sm text-blue-500 hover:text-blue-600 disabled:opacity-50"
                                    >
                                        {isLoading ? t('loading') : t('load_more')}
                                    </button>
                                </div>
                            )}
                            
                            {/* 消息列表 */}
                            <AnimatePresence>
                                {messages.map((message) => {
                                    const isOwn = message.sender?._id === currentUserId || message.sender === currentUserId;
                                    console.log('Rendering message:', { 
                                        id: message._id, 
                                        content: message.content, 
                                        sender: message.sender, 
                                        isOwn, 
                                        isTemp: message.isTemp 
                                    });
                                    
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
                            
                            {/* 滚动到底部的引用 */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* 调试：添加测试消息按钮 */}
                        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                            <button 
                                onClick={() => {
                                    const testMessage = {
                                        _id: `test_${Date.now()}`,
                                        sender: { _id: currentUserId, username: "我", avatarimg: "/resource/default-avatar.png" },
                                        receiver: currentChatUser._id,
                                        content: "这是一条测试消息",
                                        messageType: 'text',
                                        isRead: false,
                                        createdAt: new Date(),
                                        isTemp: true
                                    };
                                    console.log('Adding test message:', testMessage);
                                    setMessages(prev => [...prev, testMessage]);
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded mb-2"
                            >
                                添加测试消息
                            </button>
                        </div>

                        {/* 聊天输入 */}
                        <ChatInput
                            onSend={handleSendMessage}
                            receiverId={currentChatUser._id}
                            placeholder={t('type_message')}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <p className="text-xl font-semibold mb-4">{t('select_chat')}</p>
                            <p>{t('select_chat_hint')}</p>
                            <div className="mt-4">
                                <span role="img" aria-label="chat" className="text-4xl">💬</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
