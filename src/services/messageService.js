import config from '../config';
import { getAuthToken } from '../utils/auth';

class MessageService {
  constructor() {
    this.baseUrl = `${config.apiBaseUrl}/api/message`;
  }

  // 获取认证头
  getHeaders() {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // 获取聊天会话列表
  async getChatSessions(page = 1, limit = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/sessions?page=${page}&limit=${limit}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
      throw error;
    }
  }

  // 获取聊天历史
  async getChatHistory(chatId, page = 1, limit = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/${chatId}/history?page=${page}&limit=${limit}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      throw error;
    }
  }

  // 发送私信
  async sendPrivateMessage(receiverId, content, type = 'text', fileData = null) {
    try {
      const messageData = {
        receiver_id: receiverId,
        type,
        content,
      };

      if (fileData) {
        Object.assign(messageData, fileData);
      }

      const response = await fetch(`${this.baseUrl}/send/private`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send private message:', error);
      throw error;
    }
  }

  // 发送群组消息
  async sendGroupMessage(groupId, content, type = 'text', fileData = null) {
    try {
      const messageData = {
        group_id: groupId,
        type,
        content,
      };

      if (fileData) {
        Object.assign(messageData, fileData);
      }

      const response = await fetch(`${this.baseUrl}/send/group`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send group message:', error);
      throw error;
    }
  }

  // 标记消息为已读
  async markMessageAsRead(messageId) {
    try {
      const response = await fetch(`${this.baseUrl}/read/${messageId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw error;
    }
  }

  // 删除消息
  async deleteMessage(messageId) {
    try {
      const response = await fetch(`${this.baseUrl}/message/${messageId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  // 获取未读消息计数
  async getUnreadCount() {
    try {
      const response = await fetch(`${this.baseUrl}/unread/count`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      throw error;
    }
  }

  // 创建群组
  async createGroup(groupData) {
    try {
      const response = await fetch(`${this.baseUrl}/group/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  // 获取群组列表
  async getGroups(page = 1, limit = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/groups?page=${page}&limit=${limit}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      throw error;
    }
  }

  // 获取群组详情
  async getGroupDetails(groupId) {
    try {
      const response = await fetch(`${this.baseUrl}/group/${groupId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch group details:', error);
      throw error;
    }
  }

  // 加入群组
  async joinGroup(groupId) {
    try {
      const response = await fetch(`${this.baseUrl}/group/${groupId}/join`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to join group:', error);
      throw error;
    }
  }

  // 离开群组
  async leaveGroup(groupId) {
    try {
      const response = await fetch(`${this.baseUrl}/group/${groupId}/leave`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  }

  // 更新群组信息
  async updateGroup(groupId, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/group/${groupId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  }

  // 添加群组成员
  async addGroupMember(groupId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/group/${groupId}/member/${userId}`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to add group member:', error);
      throw error;
    }
  }

  // 移除群组成员
  async removeGroupMember(groupId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/group/${groupId}/member/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to remove group member:', error);
      throw error;
    }
  }

  // 搜索聊天记录
  async searchMessages(chatId, query, page = 1, limit = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/${chatId}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to search messages:', error);
      throw error;
    }
  }



  // 上传文件
  async uploadFile(file, chatId) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chat_id', chatId);

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': this.getHeaders().Authorization,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }
}

export default new MessageService();
