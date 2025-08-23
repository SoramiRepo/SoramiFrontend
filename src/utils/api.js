import config from '../config';
import { getAuthToken } from './auth';

// 发送消息
export async function sendMessage(receiverId, content, messageType = 'text') {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/message/send`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId, content, messageType }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send message');
    }

    return res.json();
}

// 获取聊天记录
export async function fetchChatHistory(targetUserId, page = 1, limit = 50) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/message/chat/${targetUserId}?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch chat history');
    }

    return res.json();
}

// 获取聊天会话列表
export async function fetchChatSessions(page = 1, limit = 20) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/message/sessions?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        if (res.status === 429) {
            throw new Error('Too Many Requests - Rate limit exceeded');
        }
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch chat sessions');
    }

    return res.json();
}

// 删除消息
export async function deleteMessage(messageId) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/message/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete message');
    }

    return res.json();
}

// 标记消息为已读
export async function markMessageAsRead(messageId) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/message/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to mark message as read');
    }

    return res.json();
}

// 获取未读消息数
export async function fetchUnreadMessageCount() {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/message/unread/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        if (res.status === 429) {
            throw new Error('Too Many Requests - Rate limit exceeded');
        }
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch unread count');
    }

    return res.json();
}

// 向后兼容的旧API函数（重命名以避免冲突）
export async function fetchPrivateChatList() {
    return fetchChatSessions();
}

export async function fetchPrivateChatHistory(userId) {
    return fetchChatHistory(userId);
}

export async function sendPrivateMessage(toUserId, content) {
    return sendMessage(toUserId, content);
}
