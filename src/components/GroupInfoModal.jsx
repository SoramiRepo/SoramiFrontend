import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Users, Settings, UserPlus, UserMinus, Crown, Edit, Camera } from 'lucide-react';
import messageService from '../services/messageService';

const GroupInfoModal = ({ isOpen, onClose, group }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
  const isCreator = group?.creator?.id === currentUserId;

  // 初始化表单数据
  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setDescription(group.description || '');
    }
  }, [group]);

  // 加载可用用户
  useEffect(() => {
    if (showAddMember) {
      loadAvailableUsers();
    }
  }, [showAddMember]);

  // 加载可用用户
  const loadAvailableUsers = async () => {
    try {
      // 这里应该调用API获取用户列表
      // 暂时使用模拟数据
      const mockUsers = [
        { id: '1', username: 'user1', avatar_url: '/default-avatar.png' },
        { id: '2', username: 'user2', avatar_url: '/default-avatar.png' },
        { id: '3', username: 'user3', avatar_url: '/default-avatar.png' },
        { id: '4', username: 'user4', avatar_url: '/default-avatar.png' },
        { id: '5', username: 'user5', avatar_url: '/default-avatar.png' },
      ];
      setAvailableUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  // 过滤用户
  const filteredUsers = availableUsers.filter(user => 
    !group?.participants?.find(participant => participant.id === user.id) &&
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 开始编辑
  const startEditing = () => {
    setIsEditing(true);
    setError('');
  };

  // 取消编辑
  const cancelEditing = () => {
    setGroupName(group.name || '');
    setDescription(group.description || '');
    setIsEditing(false);
    setError('');
  };

  // 保存编辑
  const saveEditing = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const updates = {
        name: groupName.trim(),
        description: description.trim(),
      };

      await messageService.updateGroup(group.id, updates);
      setIsEditing(false);
      // 这里应该更新本地状态
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 添加成员
  const addMember = async (user) => {
    try {
      await messageService.addGroupMember(group.id, user.id);
      setShowAddMember(false);
      setSearchQuery('');
      // 这里应该更新本地状态
    } catch (error) {
      setError(error.message);
    }
  };

  // 移除成员
  const removeMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await messageService.removeGroupMember(group.id, userId);
      // 这里应该更新本地状态
    } catch (error) {
      setError(error.message);
    }
  };

  // 离开群组
  const leaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      await messageService.leaveGroup(group.id);
      onClose();
      // 这里应该更新本地状态
    } catch (error) {
      setError(error.message);
    }
  };

  if (!isOpen || !group) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('group_info')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 内容 */}
          <div className="p-4 space-y-4">
            {/* 群组头像和名称 */}
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={group.avatar_url || '/default-avatar.png'}
                  alt={group.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                {isCreator && (
                  <button className="absolute bottom-0 right-0 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
                    <Camera size={16} />
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-semibold"
                    maxLength={50}
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('enter_group_description')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center resize-none"
                    maxLength={200}
                  />
                </div>
              ) : (
                <div className="mt-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {group.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {group.participants?.length || 0} {t('members')}
                  </p>
                </div>
              )}

              {/* 编辑按钮 */}
              {isCreator && !isEditing && (
                <button
                  onClick={startEditing}
                  className="mt-3 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Edit size={16} className="inline mr-2" />
                  {t('edit')}
                </button>
              )}

              {/* 保存/取消按钮 */}
              {isEditing && (
                <div className="mt-3 flex space-x-2 justify-center">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={saveEditing}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? t('saving') : t('save')}
                  </button>
                </div>
              )}
            </div>

            {/* 成员列表 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t('members')} ({group.participants?.length || 0})
                </h4>
                {isCreator && (
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <UserPlus size={16} />
                  </button>
                )}
              </div>

              {/* 添加成员 */}
              {showAddMember && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('search_users')}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <Users className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>

                  {searchQuery && filteredUsers.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => addMember(user)}
                          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          <img
                            src={user.avatar_url || '/default-avatar.png'}
                            alt={user.username}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {user.username}
                          </span>
                          <UserPlus size={16} className="text-blue-500 ml-auto" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 成员列表 */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {group.participants?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <img
                        src={member.avatar_url || '/default-avatar.png'}
                        alt={member.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.username}
                          </span>
                          {member.id === group.creator?.id && (
                            <Crown size={14} className="text-yellow-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {member.id === group.creator?.id ? t('creator') : t('member')}
                        </span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {isCreator && member.id !== currentUserId && (
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title={t('remove_member')}
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {/* 底部按钮 */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {isCreator ? (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('close')}
                </button>
              ) : (
                <button
                  onClick={leaveGroup}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('leave_group')}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GroupInfoModal;
