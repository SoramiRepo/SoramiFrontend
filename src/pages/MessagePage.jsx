import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Plus, MoreVertical, ArrowLeft, Phone, Video, Info } from 'lucide-react';
import useMessageStore from '../hooks/useMessageStore';
import { useWebSocket } from '../hooks/useWebSocket';
import messageService from '../services/messageService';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupInfoModal from '../components/GroupInfoModal';

const MessagePage = () => {
    const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  
  const {
    chatSessions,
    currentChat,
    setCurrentChat,
    setChatSessions,
    setLoading,
    setError,
    clearError,
  } = useMessageStore();

  const { isConnected } = useWebSocket();
  const searchInputRef = useRef(null);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowChatList(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 加载聊天会话
  useEffect(() => {
    const loadChatSessions = async () => {
      try {
        setLoading(true);
        clearError();
        const response = await messageService.getChatSessions();
        if (response.success) {
          setChatSessions(response.data);
        }
        } catch (error) {
        setError(error.message);
        } finally {
        setLoading(false);
      }
    };

        loadChatSessions();
  }, [setChatSessions, setLoading, setError, clearError]);

  // 处理聊天选择
  const handleChatSelect = (chat) => {
    setCurrentChat(chat);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  // 返回聊天列表
  const handleBackToList = () => {
    setCurrentChat(null);
    setShowChatList(true);
  };

  // 过滤聊天会话
  const filteredChats = chatSessions.filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (chat.type === 'group') {
      return chat.name.toLowerCase().includes(query) ||
             chat.description?.toLowerCase().includes(query);
    } else {
      return chat.participants.some(user => 
        user.username.toLowerCase().includes(query)
      );
    }
  });

  // 处理创建群组
  const handleCreateGroup = async (groupData) => {
    try {
      const response = await messageService.createGroup(groupData);
      if (response.success) {
        setShowCreateGroup(false);
        // 重新加载聊天会话
        const sessionsResponse = await messageService.getChatSessions();
        if (sessionsResponse.success) {
          setChatSessions(sessionsResponse.data);
        }
      }
        } catch (error) {
      setError(error.message);
    }
  };
    
    return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      {/* 移动端头部 */}
      {isMobile && currentChat && (
                <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={handleBackToList}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center space-x-2">
            <img
              src={currentChat.avatar_url || '/default-avatar.png'}
              alt={currentChat.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {currentChat.name}
                                        </h3>
              {currentChat.type === 'private' && (
                <span className={`text-xs ${currentChat.participants[0]?.is_online ? 'text-green-500' : 'text-gray-500'}`}>
                  {currentChat.participants[0]?.is_online ? t('online') : t('offline')}
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
            <button 
              onClick={() => setShowGroupInfo(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Info size={18} />
            </button>
                                        </div>
                                    </motion.div>
                                )}

      <div className="flex h-full">
        {/* 聊天列表 */}
        <AnimatePresence>
          {showChatList && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${
                isMobile ? 'absolute inset-0 z-10' : ''
              }`}
            >
              {/* 头部 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('messages')}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title={t('create_group')}
                    >
                      <Plus size={20} />
                    </button>
                                            </div>
                                </div>

                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('search_contacts')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
                  />
                </div>
                            </div>
                            
              {/* 聊天列表 */}
              <div className="flex-1 overflow-y-auto">
                <ChatList
                  chats={filteredChats}
                  onChatSelect={handleChatSelect}
                  currentChat={currentChat}
                />
                        </div>

              {/* 连接状态 */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className={`flex items-center space-x-2 text-sm ${
                  isConnected ? 'text-green-500' : 'text-red-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span>
                    {isConnected ? t('connected') : t('disconnected')}
                  </span>
                </div>
                        </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 聊天窗口 */}
        {currentChat && (
                        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <ChatWindow
              chat={currentChat}
              onBackToList={handleBackToList}
              isMobile={isMobile}
            />
          </motion.div>
        )}

        {/* 空状态 */}
        {!currentChat && !isMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900"
          >
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                            </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {t('select_chat')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                                {t('select_chat_hint')}
                            </p>
            </div>
                        </motion.div>
                )}
            </div>

      {/* 创建群组模态框 */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSubmit={handleCreateGroup}
      />

      {/* 群组信息模态框 */}
      <GroupInfoModal
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        group={currentChat}
      />
        </div>
    );
};

export default MessagePage;
