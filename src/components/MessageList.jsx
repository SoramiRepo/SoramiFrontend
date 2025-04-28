export default function MessageList({ chatList, currentChatUser, onSelect, unreadMap }) {
    if (chatList.length === 0) {
        return (
            <div className="w-1/3 p-4 flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <p className="text-xl font-semibold mb-4">No contacts yet</p>
                    <p>Start a conversation with someone to see them here!</p>
                    <div className="mt-4">
                        <span role="img" aria-label="sparkles" className="text-4xl">✨</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-1/3 border-r overflow-y-auto">
            {chatList.map(user => {
                const unreadCount = unreadMap[user._id] || 0;
                return (
                    <div
                        key={user._id}
                        className={`p-4 cursor-pointer hover:bg-gray-100 ${currentChatUser?._id === user._id ? 'bg-gray-200' : ''}`}
                        onClick={() => onSelect(user)}
                    >
                        <div className="flex items-center space-x-3 relative">
                            {user.avatarimg ? (
                                <img src={user.avatarimg} alt="avatar" className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm">
                                    {user.avatarname?.[0] || user.username?.[0]}
                                </div>
                            )}
                            <div className="font-semibold">{user.username}</div>

                            {/* 未读红点 */}
                            {unreadCount > 0 && (
                                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-red-500 w-4 h-4 rounded-full text-xs text-white flex items-center justify-center">
                                    {unreadCount}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
