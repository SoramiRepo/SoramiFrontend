import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import ChatSession from '../models/ChatSession.js';
import User from '../models/User.js';
import logger from './logger.js';

class SocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.userRooms = new Map(); // userId -> Set of roomIds

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // 设置中间件
  setupMiddleware() {
    // 身份验证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // 移除Bearer前缀
        const cleanToken = token.replace('Bearer ', '');
        
        // 验证JWT token
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        
        if (!decoded.id) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // 验证用户是否存在
        const user = await User.findById(decoded.id);
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        // 将用户信息附加到socket
        socket.userId = decoded.id;
        socket.user = user;
        
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: ' + error.message));
      }
    });
  }

  // 设置事件处理器
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User ${socket.userId} connected with socket ${socket.id}`);
      
      this.handleConnection(socket);
      this.handleDisconnection(socket);
      this.handleJoinChat(socket);
      this.handleLeaveChat(socket);
      this.handleTyping(socket);
      this.handleStopTyping(socket);
      this.handleMessageRead(socket);
    });
  }

  // 处理连接
  handleConnection(socket) {
    const userId = socket.userId;
    
    // 记录用户连接
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);
    this.userRooms.set(userId, new Set());

    // 更新用户在线状态
    this.updateUserOnlineStatus(userId, true);

    // 广播用户上线事件
    this.broadcastUserStatus(userId, true);
  }

  // 处理断开连接
  handleDisconnection(socket) {
    const userId = socket.userId;
    
    logger.info(`User ${userId} disconnected from socket ${socket.id}`);

    // 清理连接记录
    this.connectedUsers.delete(userId);
    this.userSockets.delete(socket.id);
    
    // 获取用户所在的房间
    const userRooms = this.userRooms.get(userId) || new Set();
    
    // 从所有房间中移除用户
    userRooms.forEach(roomId => {
      socket.leave(roomId);
    });
    
    this.userRooms.delete(userId);

    // 更新用户离线状态
    this.updateUserOfflineStatus(userId);

    // 广播用户下线事件
    this.broadcastUserStatus(userId, false);
  }

  // 处理加入聊天
  handleJoinChat(socket) {
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;
        const userId = socket.userId;

        if (!chatId) {
          socket.emit('error', { message: 'Chat ID is required' });
          return;
        }

        // 验证用户是否有权限加入这个聊天
        const chatSession = await ChatSession.findOne({ chatId });
        if (!chatSession) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const isParticipant = chatSession.participants.some(p => p.userId.equals(userId));
        if (!isParticipant) {
          socket.emit('error', { message: 'You do not have access to this chat' });
          return;
        }

        // 加入房间
        socket.join(chatId);
        
        // 记录用户加入的房间
        let userRooms = this.userRooms.get(userId);
        if (!userRooms) {
          userRooms = new Set();
          this.userRooms.set(userId, userRooms);
        }
        userRooms.add(chatId);

        logger.info(`User ${userId} joined chat ${chatId}`);
        socket.emit('joined_chat', { chatId });

      } catch (error) {
        logger.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });
  }

  // 处理离开聊天
  handleLeaveChat(socket) {
    socket.on('leave_chat', async (data) => {
      try {
        const { chatId } = data;
        const userId = socket.userId;

        if (!chatId) {
          socket.emit('error', { message: 'Chat ID is required' });
          return;
        }

        // 离开房间
        socket.leave(chatId);
        
        // 从用户房间记录中移除
        const userRooms = this.userRooms.get(userId);
        if (userRooms) {
          userRooms.delete(chatId);
        }

        logger.info(`User ${userId} left chat ${chatId}`);
        socket.emit('left_chat', { chatId });

      } catch (error) {
        logger.error('Error leaving chat:', error);
        socket.emit('error', { message: 'Failed to leave chat' });
      }
    });
  }

  // 处理打字状态
  handleTyping(socket) {
    socket.on('typing', (data) => {
      const { chatId } = data;
      const userId = socket.userId;

      if (!chatId) return;

      // 广播给房间内的其他用户
      socket.to(chatId).emit('user_typing', {
        chatId,
        userId,
        username: socket.user.username
      });
    });
  }

  // 处理停止打字
  handleStopTyping(socket) {
    socket.on('stop_typing', (data) => {
      const { chatId } = data;
      const userId = socket.userId;

      if (!chatId) return;

      // 广播给房间内的其他用户
      socket.to(chatId).emit('user_stopped_typing', {
        chatId,
        userId,
        username: socket.user.username
      });
    });
  }

  // 处理消息已读
  handleMessageRead(socket) {
    socket.on('message_read', async (data) => {
      try {
        const { messageId, chatId } = data;
        const userId = socket.userId;

        if (!messageId || !chatId) return;

        // 更新消息状态
        const message = await Message.findById(messageId);
        if (message) {
          await message.markAsRead(userId);
          
          // 广播消息已读事件
          socket.to(chatId).emit('message_read', {
            messageId,
            chatId,
            userId,
            readAt: new Date()
          });
        }

      } catch (error) {
        logger.error('Error handling message read:', error);
      }
    });
  }

  // 发送新消息事件
  async sendNewMessage(message, chatId) {
    try {
      // 获取消息的完整信息
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'username avatarUrl')
        .populate('receiverId', 'username avatarUrl')
        .populate('groupId', 'name avatarUrl');

      // 广播给房间内的所有用户
      this.io.to(chatId).emit('new_message', {
        message: populatedMessage,
        chatId
      });

      // 更新消息状态为已送达
      await this.updateMessageDeliveryStatus(message, chatId);

    } catch (error) {
      logger.error('Error sending new message event:', error);
    }
  }

  // 更新消息送达状态
  async updateMessageDeliveryStatus(message, chatId) {
    try {
      const chatSession = await ChatSession.findOne({ chatId });
      if (!chatSession) return;

      // 获取房间内的在线用户
      const onlineUsers = new Set();
      const sockets = await this.io.in(chatId).fetchSockets();
      
      sockets.forEach(socket => {
        if (socket.userId && socket.userId !== message.senderId.toString()) {
          onlineUsers.add(socket.userId);
        }
      });

      // 标记为已送达
      for (const userId of onlineUsers) {
        await message.markAsDelivered(userId);
      }

      // 广播送达状态更新
      this.io.to(chatId).emit('message_status', {
        messageId: message._id,
        chatId,
        status: 'delivered',
        deliveredTo: Array.from(onlineUsers)
      });

    } catch (error) {
      logger.error('Error updating message delivery status:', error);
    }
  }

  // 更新用户在线状态
  async updateUserOnlineStatus(userId, isOnline) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date()
      });
    } catch (error) {
      logger.error('Error updating user online status:', error);
    }
  }

  // 更新用户离线状态
  async updateUserOfflineStatus(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date()
      });
    } catch (error) {
      logger.error('Error updating user offline status:', error);
    }
  }

  // 广播用户状态变化
  broadcastUserStatus(userId, isOnline) {
    try {
      // 获取用户所在的房间
      const userRooms = this.userRooms.get(userId) || new Set();
      
      userRooms.forEach(roomId => {
        this.io.to(roomId).emit(isOnline ? 'user_online' : 'user_offline', {
          userId,
          timestamp: new Date()
        });
      });
    } catch (error) {
      logger.error('Error broadcasting user status:', error);
    }
  }

  // 获取在线用户列表
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // 检查用户是否在线
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // 获取用户的socket
  getUserSocket(userId) {
    const socketId = this.connectedUsers.get(userId);
    return socketId ? this.io.sockets.sockets.get(socketId) : null;
  }

  // 发送消息给特定用户
  sendToUser(userId, event, data) {
    const socket = this.getUserSocket(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  // 广播消息给房间
  broadcastToRoom(roomId, event, data, excludeSocketId = null) {
    if (excludeSocketId) {
      this.io.to(roomId).except(excludeSocketId).emit(event, data);
    } else {
      this.io.to(roomId).emit(event, data);
    }
  }

  // 获取服务器统计信息
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalSockets: this.io.engine.clientsCount,
      rooms: this.io.sockets.adapter.rooms.size
    };
  }
}

export default SocketServer;
