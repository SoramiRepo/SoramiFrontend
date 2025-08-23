import { io } from 'socket.io-client';
import config from '../config';

let socket = null;
let isConnected = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// 事件处理器映射
const eventHandlers = {
    new_message: [],
    message_sent: [],
    user_typing: [],
    user_stopped_typing: [],
    message_read: [],
    user_online: [],
    user_offline: [],
    room_joined: [],
    room_left: [],
    connected: [],
    connect_error: [],
    disconnect: []
};

// 连接WebSocket
export function connectWS() {
    if (socket && isConnected) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.token) {
        console.error('No authentication token available');
        return;
    }

    try {
        socket = io(config.apiBaseUrl, {
            auth: { token: user.token },
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        setupSocketListeners();
    } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
    }
}

// 设置Socket监听器
function setupSocketListeners() {
    if (!socket) return;

    // 连接成功
    socket.on('connect', () => {
        console.log('WebSocket connected');
        isConnected = true;
        reconnectAttempts = 0;
        emitEvent('connected', { userId: getCurrentUserId(), message: 'Connected successfully' });
    });

    // 连接错误
    socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        isConnected = false;
        emitEvent('connect_error', error);
        
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
        }
    });

    // 断开连接
    socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        isConnected = false;
        emitEvent('disconnect', { reason });
        
        if (reason === 'io server disconnect') {
            // 服务器主动断开，尝试重新连接
            setTimeout(() => {
                if (socket) socket.connect();
            }, 1000);
        }
    });

    // 新消息
    socket.on('new_message', (data) => {
        console.log('New message received:', data);
        emitEvent('new_message', data);
    });

    // 消息发送确认
    socket.on('message_sent', (data) => {
        console.log('Message sent confirmation:', data);
        emitEvent('message_sent', data);
    });

    // 用户正在输入
    socket.on('user_typing', (data) => {
        console.log('User typing:', data);
        emitEvent('user_typing', data);
    });

    // 用户停止输入
    socket.on('user_stopped_typing', (data) => {
        console.log('User stopped typing:', data);
        emitEvent('user_stopped_typing', data);
    });

    // 消息已读
    socket.on('message_read', (data) => {
        console.log('Message read:', data);
        emitEvent('message_read', data);
    });

    // 用户上线
    socket.on('user_online', (data) => {
        console.log('User online:', data);
        emitEvent('user_online', data);
    });

    // 用户下线
    socket.on('user_offline', (data) => {
        console.log('User offline:', data);
        emitEvent('user_offline', data);
    });

    // 房间加入
    socket.on('room_joined', (data) => {
        console.log('Room joined:', data);
        emitEvent('room_joined', data);
    });

    // 房间离开
    socket.on('room_left', (data) => {
        console.log('Room left:', data);
        emitEvent('room_left', data);
    });
}

import { getCurrentUserId } from './auth';

// 发送消息
export function sendWSMessage(data) {
    if (!socket || !isConnected) {
        console.error('WebSocket not connected');
        return false;
    }

    try {
        socket.emit('send_message', data);
        return true;
    } catch (error) {
        console.error('Failed to send message:', error);
        return false;
    }
}

// 开始输入提示
export function startTyping(receiverId) {
    if (!socket || !isConnected) return false;
    
    try {
        socket.emit('typing_start', { receiverId });
        return true;
    } catch (error) {
        console.error('Failed to start typing indicator:', error);
        return false;
    }
}

// 停止输入提示
export function stopTyping(receiverId) {
    if (!socket || !isConnected) return false;
    
    try {
        socket.emit('typing_stop', { receiverId });
        return true;
    } catch (error) {
        console.error('Failed to stop typing indicator:', error);
        return false;
    }
}

// 标记消息为已读
export function markMessageAsReadWS(messageId) {
    if (!socket || !isConnected) return false;
    
    try {
        socket.emit('mark_read', { messageId });
        return true;
    } catch (error) {
        console.error('Failed to mark message as read:', error);
        return false;
    }
}

// 加入聊天房间
export function joinChatRoom(otherUserId) {
    if (!socket || !isConnected) return false;
    
    try {
        socket.emit('join_room', { otherUserId });
        return true;
    } catch (error) {
        console.error('Failed to join chat room:', error);
        return false;
    }
}

// 离开聊天房间
export function leaveChatRoom(otherUserId) {
    if (!socket || !isConnected) return false;
    
    try {
        socket.emit('leave_room', { otherUserId });
        return true;
    } catch (error) {
        console.error('Failed to leave chat room:', error);
        return false;
    }
}

// 注册事件监听器
export function onEvent(eventName, callback) {
    if (eventHandlers[eventName]) {
        eventHandlers[eventName].push(callback);
    }
}

// 移除事件监听器
export function offEvent(eventName, callback) {
    if (eventHandlers[eventName]) {
        const index = eventHandlers[eventName].indexOf(callback);
        if (index > -1) {
            eventHandlers[eventName].splice(index, 1);
        }
    }
}

// 触发事件
function emitEvent(eventName, data) {
    if (eventHandlers[eventName]) {
        eventHandlers[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${eventName} event handler:`, error);
            }
        });
    }
}

// 向后兼容的函数
export function onNewMessage(callback) {
    onEvent('new_message', callback);
}

// 断开连接
export function disconnectWS() {
    if (socket) {
        socket.disconnect();
        socket = null;
        isConnected = false;
    }
}

// 获取连接状态
export function isWSConnected() {
    return isConnected;
}

// 获取Socket实例（用于高级操作）
export function getSocket() {
    return socket;
}
