// 速率限制处理工具

// API调用缓存，避免重复请求
const apiCallCache = new Map();
const pendingRequests = new Map();

// 防抖函数
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 带重试的API调用
export async function apiCallWithRetry(apiCall, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await apiCall();
            return result;
        } catch (error) {
            lastError = error;
            
            // 如果是429错误，使用指数退避重试
            if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1); // 指数退避
                    console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
                    await sleep(delay);
                    continue;
                }
            }
            
            // 对于其他错误，不重试
            throw error;
        }
    }
    
    throw lastError;
}

// 带缓存的API调用（避免重复请求）
export async function apiCallWithCache(key, apiCall, cacheTime = 5000) {
    // 检查缓存
    const cached = apiCallCache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
        return cached.data;
    }
    
    // 检查是否有相同的请求正在进行
    if (pendingRequests.has(key)) {
        return await pendingRequests.get(key);
    }
    
    // 创建新的请求
    const promise = (async () => {
        try {
            const result = await apiCall();
            // 缓存结果
            apiCallCache.set(key, {
                data: result,
                timestamp: Date.now()
            });
            return result;
        } finally {
            // 清理pending请求
            pendingRequests.delete(key);
        }
    })();
    
    pendingRequests.set(key, promise);
    return await promise;
}

// 处理429错误的响应
export function handle429Error(error, showToast, t) {
    if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.warn('Rate limit exceeded, please slow down API calls');
        if (showToast && t) {
            showToast(t('rate_limit_exceeded') || 'Too many requests, please wait', 'warning');
        }
        return true;
    }
    return false;
}

// 睡眠函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 清理缓存
export function clearApiCache() {
    apiCallCache.clear();
    pendingRequests.clear();
}

// 获取缓存状态
export function getCacheStats() {
    return {
        cacheSize: apiCallCache.size,
        pendingRequests: pendingRequests.size
    };
}

// 智能API调用包装器
export async function smartApiCall(key, apiCall, options = {}) {
    const {
        useCache = true,
        cacheTime = 5000,
        maxRetries = 3,
        baseDelay = 1000,
        onError = null
    } = options;
    
    try {
        if (useCache) {
            return await apiCallWithCache(key, () => 
                apiCallWithRetry(apiCall, maxRetries, baseDelay), 
                cacheTime
            );
        } else {
            return await apiCallWithRetry(apiCall, maxRetries, baseDelay);
        }
    } catch (error) {
        if (onError) {
            onError(error);
        }
        throw error;
    }
}
