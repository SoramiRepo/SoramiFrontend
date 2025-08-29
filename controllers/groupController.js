import Group from '../models/Group.js';
import ChatSession from '../models/ChatSession.js';
import User from '../models/User.js';
import { validateObjectId } from '../utils/validation.js';
import logger from '../utils/logger.js';

class GroupController {
  // 创建群组
  async createGroup(req, res) {
    try {
      const { name, description, avatarUrl, memberIds } = req.body;
      const creatorId = req.user.id;

      // 验证参数
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Group name is required'
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Group name is too long (max 100 characters)'
        });
      }

      if (description && description.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Group description is too long (max 500 characters)'
        });
      }

      // 验证成员ID
      const validMemberIds = [];
      if (memberIds && Array.isArray(memberIds)) {
        for (const memberId of memberIds) {
          if (validateObjectId(memberId)) {
            const user = await User.findById(memberId);
            if (user) {
              validMemberIds.push(memberId);
            }
          }
        }
      }

      // 确保创建者在成员列表中
      if (!validMemberIds.includes(creatorId)) {
        validMemberIds.push(creatorId);
      }

      // 创建群组
      const group = new Group({
        name: name.trim(),
        description: description?.trim(),
        avatarUrl,
        creator: creatorId,
        members: validMemberIds.map(memberId => ({
          userId: memberId,
          role: memberId === creatorId ? 'creator' : 'member'
        }))
      });

      await group.save();

      // 创建聊天会话
      await ChatSession.createGroupSession(group);

      // 返回群组信息
      const populatedGroup = await Group.findById(group._id)
        .populate('creator', 'username avatarUrl')
        .populate('members.userId', 'username avatarUrl')
        .populate('admins', 'username avatarUrl');

      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: populatedGroup
      });

    } catch (error) {
      logger.error('Error creating group:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // 获取群组列表
  async getGroups(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type, category, search } = req.query;

      // 计算分页
      const skip = (page - 1) * limit;

      // 构建查询条件
      const query = {
        status: 'active',
        'members.userId': userId,
        'members.isActive': true
      };

      if (type) {
        query.type = type;
      }

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$text = { $search: search };
      }

      // 获取群组
      const groups = await Group.find(query)
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('creator', 'username avatarUrl')
        .populate('members.userId', 'username avatarUrl')
        .populate('admins', 'username avatarUrl');

      // 获取总数
      const total = await Group.countDocuments(query);

      res.json({
        success: true,
        message: 'Groups retrieved successfully',
        data: groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Error getting groups:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // 获取群组详情
  async getGroupDetails(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      // 验证参数
      if (!validateObjectId(groupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID'
        });
      }

      // 获取群组信息
      const group = await Group.findById(groupId)
        .populate('creator', 'username avatarUrl')
        .populate('members.userId', 'username avatarUrl')
        .populate('admins', 'username avatarUrl');

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      // 检查用户是否是群组成员
      const isMember = group.members.some(member => 
        member.userId.equals(userId) && member.isActive
      );

      if (!isMember && group.type === 'secret') {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this group'
        });
      }

      res.json({
        success: true,
        message: 'Group details retrieved successfully',
        data: group
      });

    } catch (error) {
      logger.error('Error getting group details:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // 更新群组信息
  async updateGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { name, description, avatarUrl, settings } = req.body;
      const userId = req.user.id;

      // 验证参数
      if (!validateObjectId(groupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID'
        });
      }

      // 获取群组
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      // 检查用户是否有权限编辑群组
      if (!group.hasPermission(userId, 'manage_group')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this group'
        });
      }

      // 更新群组信息
      if (name !== undefined) {
        if (name.length > 100) {
          return res.status(400).json({
            success: false,
            message: 'Group name is too long (max 100 characters)'
          });
        }
        group.name = name.trim();
      }

      if (description !== undefined) {
        if (description.length > 500) {
          return res.status(400).json({
            success: false,
            message: 'Group description is too long (max 500 characters)'
          });
        }
        group.description = description.trim();
      }

      if (avatarUrl !== undefined) {
        group.avatarUrl = avatarUrl;
      }

      if (settings !== undefined) {
        group.settings = { ...group.settings, ...settings };
      }

      await group.save();

      // 更新聊天会话
      const chatSession = await ChatSession.findOne({ chatId: `group_${groupId}` });
      if (chatSession) {
        chatSession.name = group.name;
        chatSession.description = group.description;
        chatSession.avatarUrl = group.avatarUrl;
        await chatSession.save();
      }

      // 返回更新后的群组
      const updatedGroup = await Group.findById(groupId)
        .populate('creator', 'username avatarUrl')
        .populate('members.userId', 'username avatarUrl')
        .populate('admins', 'username avatarUrl');

      res.json({
        success: true,
        message: 'Group updated successfully',
        data: updatedGroup
      });

    } catch (error) {
      logger.error('Error updating group:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // 加入群组
  async joinGroup(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      // 验证参数
      if (!validateObjectId(groupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID'
        });
      }

      // 获取群组
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      // 检查群组状态
      if (group.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Group is not active'
        });
      }

      // 检查用户是否已经是成员
      const existingMember = group.members.find(member => 
        member.userId.equals(userId) && member.isActive
      );

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this group'
        });
      }

      // 检查群组是否已满
      if (group.memberCount >= group.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Group is full'
        });
      }

      // 添加成员
      await group.addMember(userId, 'member');

      // 更新聊天会话
      let chatSession = await ChatSession.findOne({ chatId: `group_${groupId}` });
      if (chatSession) {
        await chatSession.addParticipant(userId, 'member');
      }

      res.json({
        success: true,
        message: 'Successfully joined the group'
      });

    } catch (error) {
      logger.error('Error joining group:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // 离开群组
  async leaveGroup(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      // 验证参数
      if (!validateObjectId(groupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID'
        });
      }

      // 获取群组
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      // 检查用户是否是群组成员
      const member = group.members.find(m => 
        m.userId.equals(userId) && m.isActive
      );

      if (!member) {
        return res.status(400).json({
          success: false,
          message: 'You are not a member of this group'
        });
      }

      // 创建者不能离开群组
      if (member.role === 'creator') {
        return res.status(400).json({
          success: false,
          message: 'Group creator cannot leave the group'
        });
      }

      // 移除成员
      await group.removeMember(userId);

      // 更新聊天会话
      const chatSession = await ChatSession.findOne({ chatId: `group_${groupId}` });
      if (chatSession) {
        await chatSession.removeParticipant(userId);
      }

      res.json({
        success: true,
        message: 'Successfully left the group'
      });

    } catch (error) {
      logger.error('Error leaving group:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // 添加群组成员
  async addGroupMember(req, res) {
    try {
      const { groupId, memberId } = req.params;
      const userId = req.user.id;

      // 验证参数
      if (!validateObjectId(groupId) || !validateObjectId(memberId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID or member ID'
        });
      }

      // 获取群组
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      // 检查用户是否有权限添加成员
      if (!group.hasPermission(userId, 'manage_members')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to add members'
        });
      }

      // 检查要添加的用户是否存在
      const userToAdd = await User.findById(memberId);
      if (!userToAdd) {
        return res.status(404).json({
          success: false,
          message: 'User to add not found'
        });
      }

      // 检查用户是否已经是成员
      const existingMember = group.members.find(member => 
        member.userId.equals(memberId) && member.isActive
      );

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this group'
        });
      }

      // 检查群组是否已满
      if (group.memberCount >= group.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Group is full'
        });
      }

      // 添加成员
      await group.addMember(memberId, 'member');

      // 更新聊天会话
      let chatSession = await ChatSession.findOne({ chatId: `group_${groupId}` });
      if (chatSession) {
        await chatSession.addParticipant(memberId, 'member');
      }

      res.json({
        success: true,
        message: 'Member added successfully'
      });

    } catch (error) {
      logger.error('Error adding group member:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // 移除群组成员
  async removeGroupMember(req, res) {
    try {
      const { groupId, memberId } = req.params;
      const userId = req.user.id;

      // 验证参数
      if (!validateObjectId(groupId) || !validateObjectId(memberId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID or member ID'
        });
      }

      // 获取群组
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      // 检查用户是否有权限移除成员
      if (!group.hasPermission(userId, 'manage_members')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to remove members'
        });
      }

      // 检查要移除的成员
      const memberToRemove = group.members.find(m => 
        m.userId.equals(memberId) && m.isActive
      );

      if (!memberToRemove) {
        return res.status(400).json({
          success: false,
          message: 'User is not a member of this group'
        });
      }

      // 不能移除创建者
      if (memberToRemove.role === 'creator') {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove group creator'
        });
      }

      // 不能移除比自己权限高的成员
      const currentMember = group.members.find(m => m.userId.equals(userId));
      if (memberToRemove.role === 'admin' && currentMember.role !== 'creator') {
        return res.status(403).json({
          success: false,
          message: 'You can only remove members with lower or equal permissions'
        });
      }

      // 移除成员
      await group.removeMember(memberId);

      // 更新聊天会话
      const chatSession = await ChatSession.findOne({ chatId: `group_${groupId}` });
      if (chatSession) {
        await chatSession.removeParticipant(memberId);
      }

      res.json({
        success: true,
        message: 'Member removed successfully'
      });

    } catch (error) {
      logger.error('Error removing group member:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // 搜索群组
  async searchGroups(req, res) {
    try {
      const { q: query, type, category, page = 1, limit = 20 } = req.query;

      // 计算分页
      const skip = (page - 1) * limit;

      // 构建查询条件
      const searchQuery = {
        status: 'active'
      };

      if (query) {
        searchQuery.$text = { $search: query };
      }

      if (type) {
        searchQuery.type = type;
      }

      if (category) {
        searchQuery.category = category;
      }

      // 获取群组
      const groups = await Group.searchGroups(query, searchQuery)
        .skip(skip)
        .limit(parseInt(limit));

      // 获取总数
      const total = await Group.countDocuments(searchQuery);

      res.json({
        success: true,
        message: 'Groups searched successfully',
        data: groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Error searching groups:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new GroupController();
