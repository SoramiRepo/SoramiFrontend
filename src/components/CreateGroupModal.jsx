import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Users, Search, Plus, UserMinus } from 'lucide-react';
import messageService from '../services/messageService';

const CreateGroupModal = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载可用用户
  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

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
    !selectedUsers.find(selected => selected.id === user.id) &&
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 添加用户到群组
  const addUserToGroup = (user) => {
    setSelectedUsers(prev => [...prev, user]);
    setSearchQuery('');
  };

  // 从群组中移除用户
  const removeUserFromGroup = (userId) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  // 处理提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        member_ids: selectedUsers.map(user => user.id),
      };

      await onSubmit(groupData);
      handleClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 关闭模态框
  const handleClose = () => {
    setGroupName('');
    setDescription('');
    setSelectedUsers([]);
    setSearchQuery('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
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
              {t('create_group')}
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* 群组名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('group_name')} *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t('enter_group_name')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                maxLength={50}
              />
            </div>

            {/* 群组描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('enter_group_description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                maxLength={200}
              />
            </div>

            {/* 已选择的成员 */}
            {selectedUsers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('selected_members')} ({selectedUsers.length})
                </label>
                <div className="space-y-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={user.avatar_url || '/default-avatar.png'}
                          alt={user.username}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user.username}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUserFromGroup(user.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        <UserMinus size={16} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 搜索用户 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('add_members')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_users')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 用户列表 */}
              {searchQuery && filteredUsers.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addUserToGroup(user)}
                      className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <img
                        src={user.avatar_url || '/default-avatar.png'}
                        alt={user.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {user.username}
                      </span>
                      <Plus size={16} className="text-blue-500 ml-auto" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {/* 按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading || !groupName.trim() || selectedUsers.length === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? t('creating') : t('create_group')}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateGroupModal;
