import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useMessageStore from '../hooks/useMessageStore';
import messageService from '../services/messageService';

const MessageButton = ({ targetUser, className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const { addChatSession, getChatSession } = useMessageStore();
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

  // 检查是否已经存在聊天会话
  const existingChat = getChatSession(`private_${currentUserId}_${targetUser.id}`);

  // 处理发送私信
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setIsSending(true);
      setError('');

      // 发送私信
      const response = await messageService.sendPrivateMessage(
        targetUser.id,
        message.trim()
      );

      if (response.success) {
        // 创建或更新聊天会话
        const chatSession = {
          id: `private_${currentUserId}_${targetUser.id}`,
          type: 'private',
          name: targetUser.username,
          avatar_url: targetUser.avatar_url,
          participants: [
            { id: currentUserId, username: 'You', avatar_url: '/default-avatar.png' },
            { id: targetUser.id, username: targetUser.username, avatar_url: targetUser.avatar_url }
          ],
          last_message: {
            id: response.data.id,
            type: 'text',
            content: message.trim(),
            sender_id: currentUserId,
            created_at: Date.now()
          },
          last_activity: Date.now(),
          unread_count: 0
        };

        addChatSession(chatSession);
        
        // 跳转到私信页面
        navigate('/messages');
        setShowQuickMessage(false);
        setMessage('');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSending(false);
    }
  };

  // 直接跳转到私信页面
  const goToMessages = () => {
    if (existingChat) {
      navigate('/messages');
    } else {
      setShowQuickMessage(true);
    }
  };

  return (
    <>
      {/* 私信按钮 */}
      <motion.button
        onClick={goToMessages}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
      >
        <MessageCircle size={18} />
        <span>
          {existingChat ? t('view_messages') : t('send_message')}
        </span>
      </motion.button>

      {/* 快速私信模态框 */}
      {showQuickMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQuickMessage(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <img
                  src={targetUser.avatar_url || '/default-avatar.png'}
                  alt={targetUser.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {t('send_message_to')} {targetUser.username}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('start_conversation')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickMessage(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 消息输入 */}
            <div className="p-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('type_message')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                maxLength={500}
              />
              
              {/* 字符计数 */}
              <div className="text-right text-sm text-gray-500 mt-1">
                {message.length}/500
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="text-red-500 text-sm mt-2 text-center">
                  {error}
                </div>
              )}

              {/* 按钮 */}
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowQuickMessage(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('sending')}</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{t('send')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default MessageButton;
