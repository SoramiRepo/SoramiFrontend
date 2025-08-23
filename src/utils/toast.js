// Toast通知系统
let toastContainer = null;

// 创建toast容器
const createToastContainer = () => {
    if (toastContainer) return toastContainer;
    
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    `;
    
    document.body.appendChild(toastContainer);
    return toastContainer;
};

// 创建toast元素
const createToast = (message, type = 'info', duration = 5000) => {
    const toast = document.createElement('div');
    
    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    }[type] || 'bg-blue-500';
    
    toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out pointer-events-auto`;
    toast.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-sm font-medium">${message}</span>
            <button class="ml-3 text-white hover:text-gray-200 transition-colors duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;
    
    // 添加关闭按钮事件
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });
    
    return toast;
};

// 显示toast
const showToast = (message, type = 'info', duration = 5000) => {
    const container = createToastContainer();
    const toast = createToast(message, type, duration);
    
    // 添加到容器
    container.appendChild(toast);
    
    // 动画进入
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 10);
    
    // 自动移除
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
    
    return toast;
};

// 移除toast
const removeToast = (toast) => {
    if (!toast || !toast.parentNode) return;
    
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
};

// 导出主要函数
export { showToast, removeToast };

// 便捷方法
export const showSuccess = (message, duration) => showToast(message, 'success', duration);
export const showError = (message, duration) => showToast(message, 'error', duration);
export const showWarning = (message, duration) => showToast(message, 'warning', duration);
export const showInfo = (message, duration) => showToast(message, 'info', duration);
