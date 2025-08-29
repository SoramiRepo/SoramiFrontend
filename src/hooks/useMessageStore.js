import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useMessageStore = create(
  devtools(
    persist(
      (set, get) => ({
        // 聊天会话列表
        chatSessions: [],
        // 当前选中的聊天
        currentChat: null,
        // 消息列表
        messages: {},
        // 未读消息计数
        unreadCounts: {},
        // 在线用户
        onlineUsers: new Set(),
        // 正在输入的用户
        typingUsers: {},
        // 加载状态
        isLoading: false,
        // 错误信息
        error: null,

        // 设置聊天会话列表
        setChatSessions: (sessions) => set({ chatSessions: sessions }),
        
        // 添加聊天会话
        addChatSession: (session) => set((state) => ({
          chatSessions: [session, ...state.chatSessions.filter(s => s.id !== session.id)]
        })),
        
        // 更新聊天会话
        updateChatSession: (sessionId, updates) => set((state) => ({
          chatSessions: state.chatSessions.map(session =>
            session.id === sessionId ? { ...session, ...updates } : session
          )
        })),
        
        // 设置当前聊天
        setCurrentChat: (chat) => set({ currentChat: chat }),
        
        // 添加消息
        addMessage: (chatId, message) => set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message]
          }
        })),
        
        // 设置消息列表
        setMessages: (chatId, messages) => set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: messages
          }
        })),
        
        // 更新消息状态
        updateMessageStatus: (chatId, messageId, status) => set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(msg =>
              msg.id === messageId ? { ...msg, status } : msg
            )
          }
        })),
        
        // 设置未读计数
        setUnreadCount: (chatId, count) => set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [chatId]: count
          }
        })),
        
        // 增加未读计数
        incrementUnreadCount: (chatId) => set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [chatId]: (state.unreadCounts[chatId] || 0) + 1
          }
        })),
        
        // 清除未读计数
        clearUnreadCount: (chatId) => set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [chatId]: 0
          }
        })),
        
        // 设置在线用户
        setOnlineUsers: (users) => set({ onlineUsers: new Set(users) }),
        
        // 添加在线用户
        addOnlineUser: (userId) => set((state) => ({
          onlineUsers: new Set([...state.onlineUsers, userId])
        })),
        
        // 移除在线用户
        removeOnlineUser: (userId) => set((state) => {
          const newSet = new Set(state.onlineUsers);
          newSet.delete(userId);
          return { onlineUsers: newSet };
        }),
        
        // 设置正在输入的用户
        setTypingUser: (chatId, userId, isTyping) => set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [chatId]: isTyping ? userId : null
          }
        })),
        
        // 设置加载状态
        setLoading: (loading) => set({ isLoading: loading }),
        
        // 设置错误信息
        setError: (error) => set({ error }),
        
        // 清除错误
        clearError: () => set({ error: null }),
        
        // 获取聊天会话
        getChatSession: (chatId) => {
          const state = get();
          return state.chatSessions.find(session => session.id === chatId);
        },
        
        // 获取消息列表
        getMessages: (chatId) => {
          const state = get();
          return state.messages[chatId] || [];
        },
        
        // 获取未读计数
        getUnreadCount: (chatId) => {
          const state = get();
          return state.unreadCounts[chatId] || 0;
        },
        
        // 获取总未读计数
        getTotalUnreadCount: () => {
          const state = get();
          return Object.values(state.unreadCounts).reduce((total, count) => total + count, 0);
        },
        
        // 检查用户是否在线
        isUserOnline: (userId) => {
          const state = get();
          return state.onlineUsers.has(userId);
        },
        
        // 检查用户是否正在输入
        isUserTyping: (chatId, userId) => {
          const state = get();
          return state.typingUsers[chatId] === userId;
        },
      }),
      {
        name: 'message-store',
        partialize: (state) => ({
          chatSessions: state.chatSessions,
          unreadCounts: state.unreadCounts,
        }),
      }
    )
  )
);

export default useMessageStore;
