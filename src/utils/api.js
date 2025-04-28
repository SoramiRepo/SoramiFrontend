export async function fetchPrivateChatList() {
    const res = await fetch('/api/message/chatlist', { credentials: 'include' });
    return res.json();
}

export async function fetchChatHistory(userId) {
    const res = await fetch(`/api/message/history/${userId}`, { credentials: 'include' });
    return res.json();
}

export async function sendPrivateMessage(toUserId, content) {
    const res = await fetch('/api/message/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to: toUserId, content }),
    });
    return res.json();
}
