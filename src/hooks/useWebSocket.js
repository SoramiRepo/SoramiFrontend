import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useMessageStore from './useMessageStore';
import config from '../config';

export const useWebSocket = () => {
  const socketRef = useRef(null);
  const {
    addMessage,
    updateMessageStatus,
    addOnlineUser,
    removeOnlineUser,
    setTypingUser,
    updateChatSession,
    incrementUnreadCount,
    clearUnreadCount,
  } = useMessageStore();

  // 连接WebSocket
  const connect = useCallback(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.token) {
      console.error('No authentication token available');
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    try {
      socketRef.current = io(config.apiBaseUrl, {
        auth: { token: user.token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      setupEventListeners();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, []);

  // 断开连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // 设置事件监听器
  const setupEventListeners = useCallback(() => {
    if (!socketRef.current) return;

    // 连接成功
    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
    });

    // 连接错误
    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // 断开连接
    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    // 新消息
    socketRef.current.on('new_message', (data) => {
      console.log('New message received:', data);
      addMessage(data.chat_id, data.message);
      
      // 如果不是当前聊天，增加未读计数
      const currentChat = useMessageStore.getState().currentChat;
      if (currentChat?.id !== data.chat_id) {
        incrementUnreadCount(data.chat_id);
      }
      
      // 更新聊天会话的最后消息
      updateChatSession(data.chat_id, {
        last_message: data.message,
        last_activity: Date.now(),
      });
    });

    // 消息状态更新
    socketRef.current.on('message_status', (data) => {
      updateMessageStatus(data.chat_id, data.message_id, data.status);
    });

    // 用户上线
    socketRef.current.on('user_online', (data) => {
      addOnlineUser(data.user_id);
    });

    // 用户下线
    socketRef.current.on('user_offline', (data) => {
      removeOnlineUser(data.user_id);
    });

    // 用户正在输入
    socketRef.current.on('user_typing', (data) => {
      setTypingUser(data.chat_id, data.user_id, true);
    });

    // 用户停止输入
    socketRef.current.on('user_stopped_typing', (data) => {
      setTypingUser(data.chat_id, data.user_id, false);
    });

    // 消息已读
    socketRef.current.on('message_read', (data) => {
      clearUnreadCount(data.chat_id);
    });

    // 群组事件
    socketRef.current.on('group_created', (data) => {
      console.log('Group created:', data);
    });

    socketRef.current.on('group_updated', (data) => {
      console.log('Group updated:', data);
    });

    socketRef.current.on('user_joined_group', (data) => {
      console.log('User joined group:', data);
    });

    socketRef.current.on('user_left_group', (data) => {
      console.log('User left group:', data);
    });
  }, [addMessage, updateMessageStatus, addOnlineUser, removeOnlineUser, setTypingUser, updateChatSession, incrementUnreadCount, clearUnreadCount]);

  // 发送消息
  const sendMessage = useCallback((chatId, messageData) => {
    if (!socketRef.current?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('send_message', {
        chat_id: chatId,
        ...messageData,
      }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }, []);

  // 加入聊天室
  const joinChat = useCallback((chatId) => {
    if (!socketRef.current?.connected) {
      throw new Error('WebSocket not connected');
    }

    socketRef.current.emit('join_chat', { chat_id: chatId });
  }, []);

  // 离开聊天室
  const leaveChat = useCallback((chatId) => {
    if (!socketRef.current?.connected) {
      throw new Error('WebSocket not connected');
    }

    socketRef.current.emit('leave_chat', { chat_id: chatId });
  }, []);

  // 发送正在输入状态
  const sendTypingStatus = useCallback((chatId, isTyping) => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('typing_status', {
      chat_id: chatId,
      is_typing: isTyping,
    });
  }, []);

  // 标记消息为已读
  const markMessageAsRead = useCallback((chatId, messageId) => {
    if (!socketRef.current?.connected) {
      throw new Error('WebSocket not connected');
    }

    socketRef.current.emit('mark_read', {
      chat_id: chatId,
      message_id: messageId,
    });
  }, []);

  // 创建群组
  const createGroup = useCallback((groupData) => {
    if (!socketRef.current?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('create_group', groupData, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }, []);

  // 加入群组
  const joinGroup = useCallback((groupId) => {
    if (!socketRef.current?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('join_group', { group_id: groupId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }, []);

  // 离开群组
  const leaveGroup = useCallback((groupId) => {
    if (!socketRef.current?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('leave_group', { group_id: groupId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }, []);

  // 组件挂载时连接
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
    sendMessage,
    joinChat,
    leaveChat,
    sendTypingStatus,
    markMessageAsRead,
    createGroup,
    joinGroup,
    leaveGroup,
  };
};
