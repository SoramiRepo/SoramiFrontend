import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users, MessageCircle, Pin, VolumeX } from 'lucide-react';
import useMessageStore from '../hooks/useMessageStore';

const ChatList = ({ chats, onChatSelect, currentChat }) => {
  const { t } = useTranslation();
  const { getUnreadCount, isUserOnline } = useMessageStore();

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('no_contacts')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('start_conversation_hint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {chats.map((chat, index) => {
        const unreadCount = getUnreadCount(chat.id);
        const isSelected = currentChat?.id === chat.id;
        const isGroup = chat.type === 'group';
        
        // 获取显示名称和头像
        let displayName, avatarUrl, isOnline;
        if (isGroup) {
          displayName = chat.name;
          avatarUrl = chat.avatar_url;
          isOnline = false; // 群组不显示在线状态
        } else {
          const otherUser = chat.participants.find(user => 
            user.id !== JSON.parse(localStorage.getItem('user'))?.id
          );
          displayName = otherUser?.username || 'Unknown User';
          avatarUrl = otherUser?.avatar_url;
          isOnline = isUserOnline(otherUser?.id);
        }

        // 获取最后消息预览
        let lastMessagePreview = '';
        if (chat.last_message) {
          const { type, content } = chat.last_message;
          switch (type) {
            case 'text':
              lastMessagePreview = content.length > 30 ? `${content.substring(0, 30)}...` : content;
              break;
            case 'image':
              lastMessagePreview = '📷 Image';
              break;
            case 'file':
              lastMessagePreview = '📎 File';
              break;
            default:
              lastMessagePreview = content;
          }
        }

        return (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => onChatSelect(chat)}
              className={`w-full p-3 rounded-xl transition-all duration-200 text-left ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* 头像 */}
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarUrl || '/default-avatar.png'}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  
                  {/* 群组图标 */}
                  {isGroup && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {/* 在线状态指示器 */}
                  {!isGroup && (
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  )}
                </div>

                {/* 聊天信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium truncate ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {displayName}
                    </h3>
                    
                    <div className="flex items-center space-x-1">
                      {/* 置顶图标 */}
                      {chat.is_pinned && (
                        <Pin className="w-3 h-3 text-yellow-500" />
                      )}
                      
                      {/* 静音图标 */}
                      {chat.is_muted && (
                        <VolumeX className="w-3 h-3 text-gray-400" />
                      )}
                      
                      {/* 时间 */}
                      {chat.last_activity && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(chat.last_activity)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 最后消息 */}
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${
                      unreadCount > 0 
                        ? 'text-gray-900 dark:text-white font-medium' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {lastMessagePreview || t('no_messages')}
                    </p>
                    
                    {/* 未读消息计数 */}
                    {unreadCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

// 格式化时间
const formatTime = (timestamp) => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffInHours = (now - messageTime) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'now';
  } else if (diffInHours < 24) {
    return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'yesterday';
  } else {
    return messageTime.toLocaleDateString();
  }
};

export default ChatList;
