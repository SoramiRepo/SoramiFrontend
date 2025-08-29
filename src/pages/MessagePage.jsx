import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  ArrowLeft, 
  Phone, 
  Video, 
  Info, 
  Filter,
  X,
  MessageCircle,
  Users,
  Sparkles
} from 'lucide-react';
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, private, group
  
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

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
    setFilterType('all');
    searchInputRef.current?.focus();
  };

  // 过滤聊天会话
  const filteredChats = useMemo(() => {
    let filtered = chatSessions;
    
    // 按类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(chat => chat.type === filterType);
    }
    
    // 按搜索查询过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(chat => {
        if (chat.type === 'group') {
          return chat.name.toLowerCase().includes(query) ||
                 chat.description?.toLowerCase().includes(query) ||
                 chat.participants.some(user => 
                   user.username.toLowerCase().includes(query)
                 );
        } else {
          return chat.participants.some(user => 
            user.username.toLowerCase().includes(query) ||
            user.display_name?.toLowerCase().includes(query)
          );
        }
      });
    }
    
    return filtered;
  }, [chatSessions, searchQuery, filterType]);

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
    <div className="h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 移动端头部 */}
      {isMobile && currentChat && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm"
        >
          <button
            onClick={handleBackToList}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={currentChat.avatar_url || '/default-avatar.png'}
                alt={currentChat.name}
                className="w-10 h-10 rounded-full ring-2 ring-blue-200 dark:ring-blue-700"
              />
              {currentChat.type === 'private' && (
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                  currentChat.participants[0]?.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {currentChat.name}
              </h3>
              {currentChat.type === 'private' && (
                <span className={`text-xs ${
                  currentChat.participants[0]?.is_online ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {currentChat.participants[0]?.is_online ? t('online') : t('offline')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
              <Phone size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
              <Video size={18} />
            </button>
            <button 
              onClick={() => setShowGroupInfo(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
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
              className={`w-full md:w-96 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col shadow-lg ${
                isMobile ? 'absolute inset-0 z-10' : ''
              }`}
            >
              {/* 头部 */}
              <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">
                        {t('messages')}
                      </h1>
                      <p className="text-blue-100 text-sm">
                        {chatSessions.length} {t('conversations')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 group"
                    title={t('create_group')}
                  >
                    <Plus size={20} className="text-white group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                {/* 搜索框 */}
                <div className="relative">
                  <div className={`relative transition-all duration-300 ${
                    searchFocused ? 'scale-105' : 'scale-100'
                  }`}>
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={t('search_contacts')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className="w-full pl-12 pr-12 py-3 bg-white/90 dark:bg-gray-700/90 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-white/50 focus:bg-white dark:focus:bg-gray-600 transition-all duration-300 shadow-lg"
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* 过滤器 */}
                  <div className="flex items-center space-x-2 mt-3">
                    <Filter size={16} className="text-blue-100" />
                    <div className="flex bg-white/20 rounded-lg p-1">
                      {[
                        { key: 'all', label: t('all'), icon: MessageCircle },
                        { key: 'private', label: t('private'), icon: MessageCircle },
                        { key: 'group', label: t('groups'), icon: Users }
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setFilterType(key)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                            filterType === key
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-blue-100 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon size={14} className="inline mr-1" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 聊天列表 */}
              <div className="flex-1 overflow-y-auto p-2">
                <ChatList
                  chats={filteredChats}
                  onChatSelect={handleChatSelect}
                  currentChat={currentChat}
                  searchQuery={searchQuery}
                />
              </div>

              {/* 连接状态 */}
              <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/50">
                <div className={`flex items-center justify-between ${
                  isConnected ? 'text-green-600' : 'text-red-500'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {isConnected ? t('connected') : t('disconnected')}
                    </span>
                  </div>
                  {isConnected && (
                    <Sparkles size={16} className="animate-pulse" />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 聊天窗口 */}
        {currentChat && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
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
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
          >
            <div className="text-center max-w-md">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
              >
                <MessageCircle className="w-16 h-16 text-blue-500 dark:text-blue-400" />
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
              >
                {t('select_chat')}
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed"
              >
                {t('select_chat_hint')}
              </motion.p>
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
