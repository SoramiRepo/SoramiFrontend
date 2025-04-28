import { useState, useEffect } from 'react';
import { fetchPrivateChatList, fetchChatHistory, sendPrivateMessage } from '@/utils/api';
import { connectWS, onNewMessage, sendWSMessage } from '@/utils/ws';
import MessageList from '@/components/MessageList';

export default function MessagePage() {
    const [chatList, setChatList] = useState([]);
    const [currentChatUser, setCurrentChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [unreadMap, setUnreadMap] = useState({});

    useEffect(() => {
        fetchPrivateChatList().then(setChatList).catch(console.error);
        connectWS();
        onNewMessage((msg) => {
            if (msg.from === currentChatUser?._id || msg.to === currentChatUser?._id) {
                setMessages(prev => [...prev, msg]);
            } else {
                setUnreadMap(prev => ({
                    ...prev,
                    [msg.from]: (prev[msg.from] || 0) + 1
                }));
            }
        });
    }, [currentChatUser]); // 一边写代码一边给推友看鸡巴，真烦

    useEffect(() => {
        if (currentChatUser) {
            fetchChatHistory(currentChatUser._id).then(res => {
                setMessages(res.messages);
                setUnreadMap(prev => {
                    const newMap = { ...prev };
                    delete newMap[currentChatUser._id];
                    return newMap;
                });
            }).catch(console.error);
        }
    }, [currentChatUser]);

    const handleSend = async () => {
        if (!input.trim() || !currentChatUser) return;

        try {
            const res = await sendPrivateMessage(currentChatUser._id, input.trim());
            setMessages(prev => [...prev, res.data]);
            setInput('');
        } catch (err) {
            console.error('Send message error:', err);
        }
    };

    return (
        <div className="flex h-[calc(100vh-60px)]">
            {/* 左边：用户列表 */}
            <MessageList
                chatList={chatList}
                currentChatUser={currentChatUser}
                onSelect={setCurrentChatUser}
                unreadMap={unreadMap}
            />

            {/* 右边：聊天窗口 */}
            <div className="flex-1 flex flex-col">
                {currentChatUser ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-4">
                            {messages.map(msg => (
                                <div
                                    key={msg._id}
                                    className={`mb-2 ${msg.from === currentChatUser._id ? 'text-left' : 'text-right'}`}
                                >
                                    <div className="inline-block bg-gray-100 p-2 rounded-md">
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t flex">
                            <input
                                className="flex-1 border rounded p-2 mr-2"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Type a message..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded"
                                onClick={handleSend}
                            >
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        {/* 空列表提示 */}
                        <div className="text-center">
                            <p className="text-xl font-semibold mb-4">No chats yet.</p>
                            <p>Start messaging someone to see your conversations here.</p>
                            <div className="mt-4">
                                <span role="img" aria-label="sparkles" className="text-4xl">✨</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
