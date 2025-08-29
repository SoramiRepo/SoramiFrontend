import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, Image as ImageIcon, File, Smile, MoreVertical } from 'lucide-react';
import useMessageStore from '../hooks/useMessageStore';
import { useWebSocket } from '../hooks/useWebSocket';
import messageService from '../services/messageService';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import ImageUpload from './ImageUpload';

const ChatWindow = ({ chat, onBackToList, isMobile }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    messages: chatMessages,
    setMessages,
    addMessage,
    clearUnreadCount,
    isUserTyping,
  } = useMessageStore();

  const {
    sendMessage,
    joinChat,
    leaveChat,
    sendTypingStatus,
    markMessageAsRead,
  } = useWebSocket();

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

  // 获取当前聊天的消息
  const messages = chatMessages[chat.id] || [];

  // 加入聊天室
  useEffect(() => {
    if (chat?.id) {
      joinChat(chat.id);
      loadChatHistory();
      clearUnreadCount(chat.id);
    }

    return () => {
      if (chat?.id) {
        leaveChat(chat.id);
      }
    };
  }, [chat?.id, joinChat, leaveChat, clearUnreadCount]);

  // 滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载聊天历史
  const loadChatHistory = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await messageService.getChatHistory(chat.id, page);
      
      if (response.success) {
        const newMessages = response.data;
        
        if (page === 1) {
          setMessages(chat.id, newMessages);
        } else {
          setMessages(chat.id, [...newMessages, ...messages]);
        }
        
        setHasMore(newMessages.length === response.limit);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载更多消息
  const loadMoreMessages = () => {
    if (!isLoading && hasMore) {
      loadChatHistory(currentPage + 1);
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const messageData = {
      type: 'text',
      content: message.trim(),
    };

    try {
      // 添加临时消息到UI
      const tempMessage = {
        id: `temp_${Date.now()}`,
        chat_id: chat.id,
        sender_id: currentUserId,
        sender: { id: currentUserId, username: 'You' },
        type: 'text',
        content: message.trim(),
        status: 'sending',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      addMessage(chat.id, tempMessage);
      setMessage('');

      // 发送消息
      const response = await sendMessage(chat.id, messageData);
      
      if (response.success) {
        // 更新消息状态
        // 这里WebSocket会收到新消息并更新状态
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // 可以显示错误提示
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file) => {
    try {
      setIsLoading(true);
      
      // 上传文件
      const uploadResponse = await messageService.uploadFile(file, chat.id);
      
      if (uploadResponse.success) {
        const messageData = {
          type: file.type.startsWith('image/') ? 'image' : 'file',
          content: file.name,
          file_url: uploadResponse.data.url,
          file_name: file.name,
          file_size: file.size,
        };

        // 发送文件消息
        await sendMessage(chat.id, messageData);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsLoading(false);
      setShowImageUpload(false);
    }
  };

  // 处理输入状态
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // 发送正在输入状态
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(chat.id, true);
    }

    // 清除之前的定时器
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 设置新的定时器
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(chat.id, false);
    }, 1000);
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理表情选择
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* 桌面端头部 */}
      {!isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <img
              src={chat.avatar_url || '/default-avatar.png'}
              alt={chat.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {chat.name}
              </h2>
              {chat.type === 'private' && (
                <span className={`text-sm ${chat.participants[0]?.is_online ? 'text-green-500' : 'text-gray-500'}`}>
                  {chat.participants[0]?.is_online ? t('online') : t('offline')}
                </span>
              )}
              {chat.type === 'group' && (
                <span className="text-sm text-gray-500">
                  {chat.participants?.length || 0} {t('members')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Phone size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Video size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 加载更多按钮 */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMoreMessages}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-blue-500 hover:text-blue-600 disabled:opacity-50"
            >
              {isLoading ? t('loading') : t('load_more')}
            </button>
          </div>
        )}

        {/* 正在输入提示 */}
        {isUserTyping(chat.id) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-sm text-gray-500"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>{t('is_typing')}</span>
          </motion.div>
        )}

        {/* 消息列表 */}
        <AnimatePresence>
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUserId}
              showAvatar={index === 0 || messages[index - 1]?.sender_id !== msg.sender_id}
            />
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-3">
          {/* 文件上传按钮 */}
          <div className="relative">
            <button
              onClick={() => setShowImageUpload(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Paperclip size={20} />
            </button>
            
            {/* 文件上传模态框 */}
            <AnimatePresence>
              {showImageUpload && (
                <ImageUpload
                  onClose={() => setShowImageUpload(false)}
                  onUpload={handleFileUpload}
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
              )}
            </AnimatePresence>
          </div>

          {/* 表情按钮 */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Smile size={20} />
            </button>
            
            {/* 表情选择器 */}
            <AnimatePresence>
              {showEmojiPicker && (
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              )}
            </AnimatePresence>
          </div>

          {/* 消息输入框 */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={t('type_message')}
              rows={1}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg resize-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
