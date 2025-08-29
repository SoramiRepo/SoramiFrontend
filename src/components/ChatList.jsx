import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users, MessageCircle, Pin, VolumeX, Clock, Check, CheckCheck } from 'lucide-react';
import useMessageStore from '../hooks/useMessageStore';

const ChatList = ({ chats, onChatSelect, currentChat, searchQuery }) => {
  const { t } = useTranslation();
  const { getUnreadCount, isUserOnline } = useMessageStore();

  // 高亮搜索文本
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 font-medium">
          {part}
        </span>
      ) : part
    );
  };

  if (chats.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <MessageCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            {searchQuery ? t('no_search_results') : t('no_contacts')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {searchQuery 
              ? t('try_different_search')
              : t('start_conversation_hint')
            }
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((chat, index) => {
        const unreadCount = getUnreadCount(chat.id);
        const isSelected = currentChat?.id === chat.id;
        const isGroup = chat.type === 'group';
        
        // 获取显示名称和头像
        let displayName, avatarUrl, isOnline, lastSeen;
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
          lastSeen = otherUser?.last_seen;
        }

        // 获取最后消息预览
        let lastMessagePreview = '';
        let lastMessageTime = '';
        let messageStatus = null;
        
        if (chat.last_message) {
          const { type, content, created_at, status } = chat.last_message;
          lastMessageTime = new Date(created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          switch (type) {
            case 'text':
              lastMessagePreview = content.length > 35 ? `${content.substring(0, 35)}...` : content;
              break;
            case 'image':
              lastMessagePreview = '📷 Image';
              break;
            case 'file':
              lastMessagePreview = '📎 File';
              break;
            case 'audio':
              lastMessagePreview = '🎵 Audio';
              break;
            default:
              lastMessagePreview = content;
          }
          
          // 消息状态图标
          if (status === 'sent') messageStatus = <Check size={14} className="text-gray-400" />;
          else if (status === 'delivered') messageStatus = <CheckCheck size={14} className="text-gray-400" />;
          else if (status === 'read') messageStatus = <CheckCheck size={14} className="text-blue-500" />;
        }

        // 获取在线状态文本
        const getOnlineStatus = () => {
          if (isGroup) return null;
          if (isOnline) return t('online');
          if (lastSeen) {
            const now = new Date();
            const lastSeenDate = new Date(lastSeen);
            const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
            
            if (diffMinutes < 1) return t('just_now');
            if (diffMinutes < 60) return `${diffMinutes}m ${t('ago')}`;
            if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ${t('ago')}`;
            return lastSeenDate.toLocaleDateString();
          }
          return t('offline');
        };

        return (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => onChatSelect(chat)}
              className={`w-full p-4 rounded-2xl transition-all duration-300 text-left group ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-600 shadow-lg'
                  : 'hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-md border-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* 头像 */}
                <div className="relative flex-shrink-0">
                  <div className="relative">
                    <img
                      src={avatarUrl || '/default-avatar.png'}
                      alt={displayName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-300 dark:group-hover:ring-blue-500 transition-all duration-300"
                    />
                    
                    {/* 群组图标 */}
                    {isGroup && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <Users className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    
                    {/* 在线状态指示器 */}
                    {!isGroup && (
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    )}
                  </div>
                </div>

                {/* 聊天信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                      {highlightText(displayName, searchQuery)}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {/* 消息状态 */}
                      {messageStatus && (
                        <div className="flex items-center space-x-1">
                          {messageStatus}
                        </div>
                      )}
                      
                      {/* 时间 */}
                      {lastMessageTime && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {lastMessageTime}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 在线状态 */}
                  {!isGroup && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-xs font-medium ${
                        isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {getOnlineStatus()}
                      </span>
                    </div>
                  )}
                  
                  {/* 最后消息 */}
                  {lastMessagePreview && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                        {highlightText(lastMessagePreview, searchQuery)}
                      </p>
                      
                      {/* 未读消息计数 */}
                      {unreadCount > 0 && (
                        <div className="ml-3 flex-shrink-0">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full min-w-[20px] h-5">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ChatList;
