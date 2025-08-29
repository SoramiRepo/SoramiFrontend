# Sorami 私信功能使用说明

## 功能概述

Sorami 私信功能是一个完整的实时聊天系统，支持私信和群组聊天，使用 Protobuf 进行数据序列化，WebSocket 进行实时通信。

## 主要特性

### 1. 私信功能
- 支持一对一私信
- 实时消息推送
- 消息状态跟踪（发送中、已发送、已送达、已读）
- 支持文本、图片、文件等多种消息类型
- 未读消息计数

### 2. 群组聊天
- 创建和管理群组
- 添加/移除群组成员
- 群组信息编辑
- 群组权限管理

### 3. 用户体验
- 响应式设计，完美适配移动端
- 流畅的动画效果
- 实时在线状态显示
- 正在输入提示
- 表情选择器
- 文件上传支持

## 技术架构

### 前端技术栈
- **React 18** - 用户界面框架
- **Zustand** - 状态管理
- **Socket.io-client** - WebSocket 客户端
- **Framer Motion** - 动画库
- **Tailwind CSS** - 样式框架
- **Protobuf** - 数据序列化

### 核心组件

#### 1. 状态管理 (`useMessageStore`)
```javascript
import useMessageStore from '../hooks/useMessageStore';

const {
  chatSessions,        // 聊天会话列表
  currentChat,         // 当前选中的聊天
  messages,            // 消息列表
  unreadCounts,        // 未读消息计数
  addChatSession,      // 添加聊天会话
  addMessage,          // 添加消息
  // ... 更多方法
} = useMessageStore();
```

#### 2. WebSocket 连接 (`useWebSocket`)
```javascript
import { useWebSocket } from '../hooks/useWebSocket';

const {
  isConnected,         // 连接状态
  sendMessage,         // 发送消息
  joinChat,            // 加入聊天室
  leaveChat,           // 离开聊天室
  // ... 更多方法
} = useWebSocket();
```

#### 3. API 服务 (`messageService`)
```javascript
import messageService from '../services/messageService';

// 发送私信
await messageService.sendPrivateMessage(receiverId, content);

// 获取聊天历史
await messageService.getChatHistory(chatId, page, limit);

// 创建群组
await messageService.createGroup(groupData);
```

## 使用方法

### 1. 发送私信

#### 从个人主页发起私信
```jsx
import MessageButton from '../components/MessageButton';

<MessageButton 
  targetUser={user} 
  className="w-full"
/>
```

#### 在私信页面发送消息
```jsx
import { useWebSocket } from '../hooks/useWebSocket';

const { sendMessage } = useWebSocket();

const handleSend = async () => {
  try {
    await sendMessage(chatId, {
      type: 'text',
      content: 'Hello!'
    });
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
```

### 2. 创建群组

```jsx
import CreateGroupModal from '../components/CreateGroupModal';

const [showCreateGroup, setShowCreateGroup] = useState(false);

<CreateGroupModal
  isOpen={showCreateGroup}
  onClose={() => setShowCreateGroup(false)}
  onSubmit={handleCreateGroup}
/>
```

### 3. 管理群组

```jsx
import GroupInfoModal from '../components/GroupInfoModal';

const [showGroupInfo, setShowGroupInfo] = useState(false);

<GroupInfoModal
  isOpen={showGroupInfo}
  onClose={() => setShowGroupInfo(false)}
  group={currentChat}
/>
```

## 路由配置

私信功能的路由配置在 `App.jsx` 中：

```jsx
<Route path="messages" element={<MessagePage />} />
```

## 国际化支持

私信功能支持多语言，主要翻译键包括：

- `messages` - 消息
- `search_contacts` - 搜索联系人
- `type_message` - 输入消息
- `create_group` - 创建群组
- `online` / `offline` - 在线/离线状态
- `is_typing` - 正在输入

## 移动端适配

- 响应式布局，自动适配不同屏幕尺寸
- 移动端优化的触摸交互
- 移动端特有的导航模式（聊天列表 ↔ 聊天窗口）

## 性能优化

- 使用 Zustand 进行高效的状态管理
- 消息分页加载，避免一次性加载过多数据
- WebSocket 连接复用
- 组件懒加载和代码分割

## 安全特性

- JWT 认证
- WebSocket 连接验证
- 消息权限控制
- 文件上传类型限制

## 扩展功能

### 1. 添加新的消息类型
在 `MessageBubble.jsx` 中添加新的消息类型渲染逻辑：

```jsx
case 'video':
  return (
    <div className="video-message">
      {/* 视频消息渲染逻辑 */}
    </div>
  );
```

### 2. 自定义表情包
在 `EmojiPicker.jsx` 中添加新的表情分类：

```jsx
const categories = [
  // ... 现有分类
  { id: 'custom', name: 'Custom', icon: '🎨' },
];
```

### 3. 消息搜索
使用 `messageService.searchMessages()` 实现消息搜索功能。

## 故障排除

### 常见问题

1. **WebSocket 连接失败**
   - 检查网络连接
   - 验证 JWT token 是否有效
   - 确认后端服务是否正常运行

2. **消息发送失败**
   - 检查用户权限
   - 验证接收者 ID 是否正确
   - 查看控制台错误信息

3. **图片上传失败**
   - 检查文件大小限制
   - 验证文件类型是否支持
   - 确认存储服务配置

### 调试模式

在开发环境中，可以启用详细日志：

```javascript
// 在 useWebSocket.js 中
console.log('WebSocket event:', eventType, data);
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。
