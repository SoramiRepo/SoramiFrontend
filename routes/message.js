import express from 'express';
import messageController from '../controllers/messageController.js';
import groupController from '../controllers/groupController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要身份验证
router.use(authenticateToken);

// ==================== 消息相关路由 ====================

// 发送私信
router.post('/private', messageController.sendPrivateMessage);

// 发送群组消息
router.post('/group', messageController.sendGroupMessage);

// 获取聊天历史
router.get('/chat/:chatId/history', messageController.getChatHistory);

// 获取聊天会话列表
router.get('/sessions', messageController.getChatSessions);

// 标记消息为已读
router.put('/:messageId/read', messageController.markMessageAsRead);

// 删除消息
router.delete('/:messageId', messageController.deleteMessage);

// 获取未读消息计数
router.get('/unread', messageController.getUnreadCount);

// 搜索消息
router.get('/chat/:chatId/search', messageController.searchMessages);

// ==================== 群组相关路由 ====================

// 创建群组
router.post('/groups', groupController.createGroup);

// 获取群组列表
router.get('/groups', groupController.getGroups);

// 获取群组详情
router.get('/groups/:groupId', groupController.getGroupDetails);

// 更新群组信息
router.put('/groups/:groupId', groupController.updateGroup);

// 加入群组
router.post('/groups/:groupId/join', groupController.joinGroup);

// 离开群组
router.post('/groups/:groupId/leave', groupController.leaveGroup);

// 添加群组成员
router.post('/groups/:groupId/members/:memberId', groupController.addGroupMember);

// 移除群组成员
router.delete('/groups/:groupId/members/:memberId', groupController.removeGroupMember);

// 搜索群组
router.get('/groups/search', groupController.searchGroups);

export default router;
