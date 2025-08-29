import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // 消息类型：text, image, file, system
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text',
    required: true
  },
  
  // 聊天类型：private, group
  chatType: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  
  // 聊天ID（私信为sender_receiver格式，群组为群组ID）
  chatId: {
    type: String,
    required: true,
    index: true
  },
  
  // 发送者ID
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 接收者ID（私信时使用）
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 群组ID（群组消息时使用）
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  
  // 消息内容
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  // 文件URL（图片、文件消息时使用）
  fileUrl: {
    type: String
  },
  
  // 文件名
  fileName: {
    type: String
  },
  
  // 文件大小（字节）
  fileSize: {
    type: Number
  },
  
  // 消息状态：sending, sent, delivered, read, failed
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // 已读用户列表
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 已送达用户列表
  deliveredTo: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 回复的消息ID
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // 转发自的消息ID
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // 元数据（表情、链接预览等）
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// 索引优化
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });

// 虚拟字段：格式化文件大小
messageSchema.virtual('formattedFileSize').get(function() {
  if (!this.fileSize) return null;
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = this.fileSize;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
});

// 确保虚拟字段被序列化
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

// 静态方法：创建私信
messageSchema.statics.createPrivateMessage = function(data) {
  const chatId = [data.senderId, data.receiverId].sort().join('_');
  
  return this.create({
    type: data.type,
    chatType: 'private',
    chatId: `private_${chatId}`,
    senderId: data.senderId,
    receiverId: data.receiverId,
    content: data.content,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileSize: data.fileSize,
    replyTo: data.replyTo,
    forwardedFrom: data.forwardedFrom,
    metadata: data.metadata
  });
};

// 静态方法：创建群组消息
messageSchema.statics.createGroupMessage = function(data) {
  return this.create({
    type: data.type,
    chatType: 'group',
    chatId: `group_${data.groupId}`,
    senderId: data.senderId,
    groupId: data.groupId,
    content: data.content,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileSize: data.fileSize,
    replyTo: data.replyTo,
    forwardedFrom: data.forwardedFrom,
    metadata: data.metadata
  });
};

// 实例方法：标记为已读
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.userId.equals(userId));
  
  if (!existingRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

// 实例方法：标记为已送达
messageSchema.methods.markAsDelivered = function(userId) {
  const existingDelivery = this.deliveredTo.find(delivery => delivery.userId.equals(userId));
  
  if (!existingDelivery) {
    this.deliveredTo.push({
      userId,
      deliveredAt: new Date()
    });
  }
  
  return this.save();
};

// 实例方法：更新状态
messageSchema.methods.updateStatus = function(status) {
  this.status = status;
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
