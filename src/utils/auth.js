// 获取认证token
export function getAuthToken() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token;
}

// 获取当前用户信息
export function getCurrentUser() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user;
}

// 获取当前用户ID
export function getCurrentUserId() {
    const user = getCurrentUser();
    return user?._id;
}

// 检查用户是否已登录
export function isAuthenticated() {
    return !!getAuthToken();
}

// 创建带认证的请求头
export function createAuthHeaders() {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// 创建带认证和内容类型的请求头
export function createAuthHeadersWithContentType() {
    const token = getAuthToken();
    return token ? { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' };
}

// 带认证的fetch请求
export async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    return response;
}

// 处理认证错误
export function handleAuthError(response) {
    if (response.status === 401) {
        // 清除无效的token
        localStorage.removeItem('user');
        // 可以在这里添加重定向到登录页的逻辑
        return true; // 表示是认证错误
    }
    return false;
}
