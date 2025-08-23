import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../config';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';
import PasskeyManager from './PasskeyManager';
import AvatarUpload from './AvatarUpload';

function EditProfile() {
    const [formData, setFormData] = useState({
        avatarname: '',
        avatarimg: '',
        bio: ''
    });
    const [originalData, setOriginalData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // 加载用户数据
    useEffect(() => {
        const loadUserData = () => {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData) {
                const data = {
                    avatarname: userData.avatarname || '',
                    avatarimg: userData.avatarimg || '',
                    bio: userData.bio || ''
                };
                setFormData(data);
                setOriginalData(data);
            }
        };
        loadUserData();
    }, []);

    // 检查是否有变更
    useEffect(() => {
        const changed = Object.keys(formData).some(key => 
            formData[key] !== originalData[key]
        );
        setHasChanges(changed);
    }, [formData, originalData]);

    // 处理表单字段变更
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 处理头像变更
    const handleAvatarChange = (avatarUrl) => {
        handleInputChange('avatarimg', avatarUrl);
    };

    // 重置表单
    const handleReset = () => {
        setFormData(originalData);
    };

    // 提交表单
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!hasChanges) {
            showToast('No changes to save', 'info');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) {
                showToast(t('notLoggedIn'), 'error');
                return;
            }

            // 只发送有变更的字段
            const changedData = {};
            Object.keys(formData).forEach(key => {
                if (formData[key] !== originalData[key]) {
                    if (formData[key].trim()) {
                        changedData[key] = formData[key].trim();
                    } else if (originalData[key]) {
                        // 如果原来有值现在为空，则设为空字符串
                        changedData[key] = '';
                    }
                }
            });

            if (Object.keys(changedData).length === 0) {
                showToast('No valid changes to save', 'info');
                return;
            }

            const res = await fetch(`${config.apiBaseUrl}/api/user/edit-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(changedData),
            });

            const result = await res.json();
            if (res.ok) {
                // 更新本地存储
                const userData = JSON.parse(localStorage.getItem('user'));
                Object.keys(changedData).forEach(key => {
                    userData[key] = changedData[key];
                });
                
                // 如果后端返回了用户数据，使用后端数据
                if (result.user) {
                    Object.keys(result.user).forEach(key => {
                        if (key !== 'id') { // 跳过 id 字段，使用原来的
                            userData[key] = result.user[key];
                        }
                    });
                }
                
                localStorage.setItem('user', JSON.stringify(userData));

                // 更新原始数据
                setOriginalData(formData);
                
                showToast(t('profileUpdated') || 'Profile updated successfully', 'success');
                
                // 可选：导航到个人资料页面
                // navigate('/profile');
            } else {
                showToast(result.message || t('failedToUpdateProfile'), 'error');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            showToast(t('serverError') || 'Server error occurred', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* 页面标题 */}
            <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('editProfile') || 'Edit Profile'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('manageProfile') || 'Manage your profile information and security settings'}
                </p>
            </motion.div>

            {/* 标签页导航 */}
            <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit mx-auto">
                {[
                    { id: 'profile', label: t('profileTab') || 'Profile', icon: '👤' },
                    { id: 'security', label: t('securityTab') || 'Security', icon: '🔒' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
                            activeTab === tab.id
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* 标签页内容 */}
            <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* 头像上传区域 */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
                                    {t('profilePicture') || 'Profile Picture'}
                                </h3>
                                <AvatarUpload
                                    currentAvatar={formData.avatarimg}
                                    onAvatarChange={handleAvatarChange}
                                    onAvatarUrlChange={(url) => handleInputChange('avatarimg', url)}
                                />
                            </div>
                        </div>

                        {/* 个人信息表单 */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                        {t('personalInformation') || 'Personal Information'}
                                    </h3>
                                    
                                    <div className="space-y-6">
                                        {/* 昵称字段 */}
                                        <div>
                                            <label htmlFor="avatarname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('displayName') || 'Display Name'}
                                            </label>
                                            <input
                                                type="text"
                                                id="avatarname"
                                                value={formData.avatarname}
                                                onChange={(e) => handleInputChange('avatarname', e.target.value)}
                                                placeholder={t('enterDisplayName') || 'Enter your display name'}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                            />
                                        </div>

                                        {/* 个人简介字段 */}
                                        <div>
                                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Bio
                                            </label>
                                            <textarea
                                                id="bio"
                                                value={formData.bio}
                                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                                placeholder="Tell us about yourself..."
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
                                            />
                                        </div>

                                        {/* 头像URL字段（高级选项） */}
                                        <div>
                                            <label htmlFor="avatarimg" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Avatar URL (Advanced)
                                            </label>
                                            <input
                                                type="url"
                                                id="avatarimg"
                                                value={formData.avatarimg}
                                                onChange={(e) => handleInputChange('avatarimg', e.target.value)}
                                                placeholder="https://example.com/avatar.jpg"
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                You can also paste an image URL directly here
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 操作按钮 */}
                                <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                                        <motion.button
                                            type="submit"
                                            disabled={isSubmitting || !hasChanges}
                                            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                                                hasChanges && !isSubmitting
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            }`}
                                            whileHover={hasChanges && !isSubmitting ? { scale: 1.02 } : {}}
                                            whileTap={hasChanges && !isSubmitting ? { scale: 0.98 } : {}}
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Saving...</span>
                                                </div>
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </motion.button>

                                        {hasChanges && (
                                            <motion.button
                                                type="button"
                                                onClick={handleReset}
                                                className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                            >
                                                Reset
                                            </motion.button>
                                        )}
                                    </div>

                                    {hasChanges && (
                                        <motion.p
                                            className="text-sm text-amber-600 dark:text-amber-400 mt-3 flex items-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            You have unsaved changes
                                        </motion.p>
                                    )}
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'security' && (
                    <motion.div
                        key="security"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <PasskeyManager />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default EditProfile;
