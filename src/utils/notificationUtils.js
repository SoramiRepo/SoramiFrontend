import config from '../config';

export const createNotification = async (type, to, post, message) => {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    if (!token) {
        console.error('Error -> No login');
        return;
    }

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/notification/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                type,      // 通知类型（'like', 'reply' 等）
                to,        // 接收通知的用户 ID
                post,      // 相关的帖子 ID（可选）
                message,   // 消息内容
            }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Notification created -> ', data.notification);
        } else {
            console.error('Failed to create notification -> ', data.message);
        }
    } catch (err) {
        console.error('Error on creating notifications -> ', err);
    }
};
