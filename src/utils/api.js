import config from '../config';
import { getAuthToken } from './auth';

// 获取用户信息
export async function fetchUser(userId) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        let errorMessage = 'Failed to fetch user';
        try {
            const error = await res.json();
            errorMessage = error.message || errorMessage;
        } catch (e) {
            if (res.status === 400) errorMessage = 'Invalid input data';
            else if (res.status === 401) errorMessage = 'Authentication required';
            else if (res.status === 403) errorMessage = 'Access denied';
            else if (res.status === 404) errorMessage = 'User not found';
            else if (res.status === 429) errorMessage = 'Too many requests';
        }
        throw new Error(errorMessage);
    }

    return res.json();
}

// 更新用户资料
export async function updateUserProfile(userData) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/user/profile`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
    });

    if (!res.ok) {
        let errorMessage = 'Failed to update profile';
        try {
            const error = await res.json();
            errorMessage = error.message || errorMessage;
        } catch (e) {
            if (res.status === 400) errorMessage = 'Invalid input data';
            else if (res.status === 401) errorMessage = 'Authentication required';
            else if (res.status === 403) errorMessage = 'Access denied';
            else if (res.status === 429) errorMessage = 'Too many requests';
        }
        throw new Error(errorMessage);
    }

    return res.json();
}

// 关注用户
export async function followUser(userId) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/user/${userId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        let errorMessage = 'Failed to follow user';
        try {
            const error = await res.json();
            errorMessage = error.message || errorMessage;
        } catch (e) {
            if (res.status === 400) errorMessage = 'Invalid input data';
            else if (res.status === 401) errorMessage = 'Authentication required';
            else if (res.status === 403) errorMessage = 'Access denied';
            else if (res.status === 404) errorMessage = 'User not found';
            else if (res.status === 429) errorMessage = 'Too many requests';
        }
        throw new Error(errorMessage);
    }

    return res.json();
}

// 取消关注用户
export async function unfollowUser(userId) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/user/${userId}/unfollow`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        let errorMessage = 'Failed to unfollow user';
        try {
            const error = await res.json();
            errorMessage = error.message || errorMessage;
        } catch (e) {
            if (res.status === 400) errorMessage = 'Invalid input data';
            else if (res.status === 401) errorMessage = 'Authentication required';
            else if (res.status === 403) errorMessage = 'Access denied';
            else if (res.status === 404) errorMessage = 'User not found';
            else if (res.status === 429) errorMessage = 'Too many requests';
        }
        throw new Error(errorMessage);
    }

    return res.json();
}

// 获取用户关注列表
export async function fetchUserFollows(userId, type = 'followers') {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${config.apiBaseUrl}/api/user/${userId}/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        let errorMessage = `Failed to fetch ${type}`;
        try {
            const error = await res.json();
            errorMessage = error.message || errorMessage;
        } catch (e) {
            if (res.status === 400) errorMessage = 'Invalid input data';
            else if (res.status === 401) errorMessage = 'Authentication required';
            else if (res.status === 403) errorMessage = 'Access denied';
            else if (res.status === 404) errorMessage = 'User not found';
            else if (res.status === 429) errorMessage = 'Too many requests';
        }
        throw new Error(errorMessage);
    }

    return res.json();
}
