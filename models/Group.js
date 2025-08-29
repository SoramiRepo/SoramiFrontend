import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema({
  // 群组名称
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  
  // 群组描述
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // 群组头像URL
  avatarUrl: {
    type: String
  },
  
  // 群组封面URL
  coverUrl: {
    type: String
  },
  
  // 创建者
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 管理员列表
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 成员列表
  members: [{
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
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // 群组类型：public, private, secret
  type: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'private'
  },
  
  // 最大成员数
  maxMembers: {
    type: Number,
    default: 100,
    min: 2,
    max: 1000
  },
  
  // 邀请码
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // 邀请链接
  inviteLink: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // 群组设置
  settings: {
    // 是否允许成员邀请
    allowMemberInvite: {
      type: Boolean,
      default: false
    },
    
    // 是否允许成员查看其他成员
    allowMemberView: {
      type: Boolean,
      default: true
    },
    
    // 是否允许成员发送消息
    allowMemberMessage: {
      type: Boolean,
      default: true
    },
    
    // 是否允许成员发送媒体
    allowMemberMedia: {
      type: Boolean,
      default: true
    },
    
    // 是否允许成员编辑群组信息
    allowMemberEdit: {
      type: Boolean,
      default: false
    },
    
    // 是否需要管理员审核新成员
    requireAdminApproval: {
      type: Boolean,
      default: false
    },
    
    // 是否启用消息审核
    enableMessageModeration: {
      type: Boolean,
      default: false
    }
  },
  
  // 群组统计
  stats: {
    messageCount: {
      type: Number,
      default: 0
    },
    memberCount: {
      type: Number,
      default: 0
    },
    activeMemberCount: {
      type: Number,
      default: 0
    }
  },
  
  // 标签
  tags: [{
    type: String,
    maxlength: 20
  }],
  
  // 分类
  category: {
    type: String,
    maxlength: 50
  },
  
  // 位置信息
  location: {
    country: String,
    city: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  
  // 状态：active, inactive, suspended, deleted
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 索引优化
groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ type: 1, status: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ tags: 1 });
groupSchema.index({ category: 1 });

// 虚拟字段：成员数量
groupSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.isActive).length;
});

// 虚拟字段：活跃成员数量
groupSchema.virtual('activeMemberCount').get(function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.members.filter(member => 
    member.isActive && member.lastSeen > thirtyDaysAgo
  ).length;
});

// 确保虚拟字段被序列化
groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

// 中间件：保存前处理
groupSchema.pre('save', function(next) {
  // 自动生成邀请码
  if (!this.inviteCode) {
    this.inviteCode = this.generateInviteCode();
  }
  
  // 自动生成邀请链接
  if (!this.inviteLink) {
    this.inviteLink = this.generateInviteLink();
  }
  
  // 确保创建者在管理员列表中
  if (this.creator && !this.admins.includes(this.creator)) {
    this.admins.push(this.creator);
  }
  
  // 更新统计信息
  this.stats.memberCount = this.memberCount;
  this.stats.activeMemberCount = this.activeMemberCount;
  
  next();
});

// 实例方法：生成邀请码
groupSchema.methods.generateInviteCode = function() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// 实例方法：生成邀请链接
groupSchema.methods.generateInviteLink = function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/join-group/${this.inviteCode}`;
};

// 实例方法：添加成员
groupSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.userId.equals(userId));
  
  if (existingMember) {
    existingMember.isActive = true;
    existingMember.lastSeen = new Date();
  } else {
    this.members.push({
      userId,
      role,
      joinedAt: new Date(),
      lastSeen: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// 实例方法：移除成员
groupSchema.methods.removeMember = function(userId) {
  const member = this.members.find(m => m.userId.equals(userId));
  
  if (member) {
    member.isActive = false;
  }
  
  return this.save();
};

// 实例方法：更新成员角色
groupSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(m => m.userId.equals(userId));
  
  if (member) {
    member.role = newRole;
  }
  
  return this.save();
};

// 实例方法：检查用户权限
groupSchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(m => m.userId.equals(userId) && m.isActive);
  
  if (!member) return false;
  
  switch (permission) {
    case 'send_message':
      return this.settings.allowMemberMessage;
    case 'send_media':
      return this.settings.allowMemberMedia;
    case 'invite_members':
      return this.settings.allowMemberInvite || member.role === 'admin' || member.role === 'creator';
    case 'manage_members':
      return member.role === 'admin' || member.role === 'creator';
    case 'manage_group':
      return member.role === 'creator';
    case 'view_members':
      return this.settings.allowMemberView;
    default:
      return false;
  }
};

// 实例方法：增加消息计数
groupSchema.methods.incrementMessageCount = function() {
  this.stats.messageCount += 1;
  return this.save();
};

// 静态方法：搜索群组
groupSchema.statics.searchGroups = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery)
    .populate('creator', 'username avatarUrl')
    .populate('members.userId', 'username avatarUrl')
    .sort({ createdAt: -1 });
};

// 静态方法：获取用户加入的群组
groupSchema.statics.getUserGroups = function(userId) {
  return this.find({
    'members.userId': userId,
    'members.isActive': true,
    status: 'active'
  })
    .populate('creator', 'username avatarUrl')
    .populate('members.userId', 'username avatarUrl')
    .sort({ lastActivity: -1 });
};

const Group = mongoose.model('Group', groupSchema);

export default Group;
