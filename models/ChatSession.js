import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  // 聊天类型：private, group
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  
  // 聊天ID
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 聊天名称（群组名称或私信显示名）
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  // 聊天头像URL
  avatarUrl: {
    type: String
  },
  
  // 聊天描述（群组描述）
  description: {
    type: String,
    maxlength: 500
  },
  
  // 参与者列表
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'creator'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 群组信息（仅群组聊天）
  groupInfo: {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    maxMembers: {
      type: Number,
      default: 100
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  
  // 最后一条消息
  lastMessage: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    content: String,
    type: String,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  },
  
  // 最后活动时间
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // 未读消息计数（按用户）
  unreadCounts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  
  // 置顶状态
  isPinned: {
    type: Boolean,
    default: false
  },
  
  // 静音状态
  isMuted: {
    type: Boolean,
    default: false
  },
  
  // 归档状态
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // 设置
  settings: {
    allowImages: {
      type: Boolean,
      default: true
    },
    allowFiles: {
      type: Boolean,
      default: true
    },
    allowLinks: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// 索引优化
chatSessionSchema.index({ type: 1, lastActivity: -1 });
chatSessionSchema.index({ 'participants.userId': 1 });
chatSessionSchema.index({ isPinned: 1, lastActivity: -1 });

// 虚拟字段：参与者数量
chatSessionSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// 虚拟字段：是否为群组
chatSessionSchema.virtual('isGroup').get(function() {
  return this.type === 'group';
});

// 确保虚拟字段被序列化
chatSessionSchema.set('toJSON', { virtuals: true });
chatSessionSchema.set('toObject', { virtuals: true });

// 静态方法：创建私信会话
chatSessionSchema.statics.createPrivateSession = function(user1Id, user2Id) {
  const chatId = [user1Id, user2Id].sort().join('_');
  
  return this.findOneAndUpdate(
    { chatId: `private_${chatId}` },
    {
      type: 'private',
      chatId: `private_${chatId}`,
      participants: [
        { userId: user1Id, role: 'member' },
        { userId: user2Id, role: 'member' }
      ],
      lastActivity: new Date()
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

// 静态方法：创建群组会话
chatSessionSchema.statics.createGroupSession = function(data) {
  return this.create({
    type: 'group',
    chatId: `group_${data._id}`,
    name: data.name,
    description: data.description,
    avatarUrl: data.avatarUrl,
    participants: data.members.map(memberId => ({
      userId: memberId,
      role: memberId.equals(data.creator) ? 'creator' : 'member'
    })),
    groupInfo: {
      creator: data.creator,
      admins: [data.creator],
      maxMembers: data.maxMembers || 100,
      isPublic: data.isPublic || false
    },
    lastActivity: new Date()
  });
};

// 实例方法：添加参与者
chatSessionSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => p.userId.equals(userId));
  
  if (!existingParticipant) {
    this.participants.push({
      userId,
      role,
      joinedAt: new Date(),
      lastSeen: new Date()
    });
    
    // 初始化未读计数
    this.unreadCounts.push({
      userId,
      count: 0
    });
  }
  
  return this.save();
};

// 实例方法：移除参与者
chatSessionSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => !p.userId.equals(userId));
  this.unreadCounts = this.unreadCounts.filter(u => !u.userId.equals(userId));
  
  return this.save();
};

// 实例方法：更新最后消息
chatSessionSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = {
    id: message._id,
    content: message.content,
    type: message.type,
    senderId: message.senderId,
    createdAt: message.createdAt
  };
  
  this.lastActivity = new Date();
  
  return this.save();
};

// 实例方法：增加未读计数
chatSessionSchema.methods.incrementUnreadCount = function(userId) {
  const unreadCount = this.unreadCounts.find(u => u.userId.equals(userId));
  
  if (unreadCount) {
    unreadCount.count += 1;
  } else {
    this.unreadCounts.push({
      userId,
      count: 1
    });
  }
  
  return this.save();
};

// 实例方法：清除未读计数
chatSessionSchema.methods.clearUnreadCount = function(userId) {
  const unreadCount = this.unreadCounts.find(u => u.userId.equals(userId));
  
  if (unreadCount) {
    unreadCount.count = 0;
  }
  
  return this.save();
};

// 实例方法：检查用户权限
chatSessionSchema.methods.hasPermission = function(userId, permission) {
  const participant = this.participants.find(p => p.userId.equals(userId));
  
  if (!participant) return false;
  
  switch (permission) {
    case 'send_message':
      return !this.isMuted;
    case 'manage_members':
      return ['admin', 'creator'].includes(participant.role);
    case 'manage_group':
      return participant.role === 'creator';
    default:
      return false;
  }
};

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
