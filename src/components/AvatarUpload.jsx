import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import uploadService from '../services/uploadService';
import { useToast } from './ToastContext';

const AvatarUpload = ({ currentAvatar, onAvatarChange, onAvatarUrlChange }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentAvatar || '');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    const { t } = useTranslation();
    const { showToast } = useToast();

    // 处理文件选择
    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // 验证文件
            uploadService.validateFile(file, {
                maxSize: 1 * 1024 * 1024, // 1MB for avatar
                allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            });

            // 创建预览
            const preview = uploadService.createFilePreview(file);
            setPreviewUrl(preview);

            // 上传文件
            await uploadFile(file);

        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    // 上传文件
    const uploadFile = async (file) => {
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) {
                throw new Error('No authentication token found');
            }

            // 模拟上传进度
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 20;
                });
            }, 200);

            const result = await uploadService.uploadAvatar(file, token);
            
            clearInterval(progressInterval);
            setUploadProgress(100);

            // 更新头像URL
            const avatarUrl = result.file.url;
            if (onAvatarChange) {
                onAvatarChange(avatarUrl);
            }
            if (onAvatarUrlChange) {
                onAvatarUrlChange(avatarUrl);
            }

            showToast('Avatar uploaded successfully!', 'success');

        } catch (error) {
            console.error('Avatar upload error:', error);
            showToast(error.message || 'Failed to upload avatar', 'error');
            
            // 恢复原始头像
            setPreviewUrl(currentAvatar || '');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // 删除头像
    const handleRemoveAvatar = () => {
        setPreviewUrl('');
        if (onAvatarChange) {
            onAvatarChange('');
        }
        if (onAvatarUrlChange) {
            onAvatarUrlChange('');
        }
        
        // 清理文件输入
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 触发文件选择
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            {/* 头像预览区域 */}
            <div className="relative">
                <motion.div
                    className="w-32 h-32 rounded-full border-4 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                >
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                            onError={() => {
                                setPreviewUrl('');
                                showToast('Failed to load image', 'error');
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </motion.div>

                {/* 上传进度覆盖层 */}
                <AnimatePresence>
                    {isUploading && (
                        <motion.div
                            className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="text-white text-center">
                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <div className="text-sm font-medium">{Math.round(uploadProgress)}%</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 编辑按钮 */}
                {!isUploading && (
                    <button
                        onClick={triggerFileSelect}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
                        title="Change avatar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* 操作按钮 */}
            <div className="flex space-x-2">
                <motion.button
                    onClick={triggerFileSelect}
                    disabled={isUploading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isUploading ? 'Uploading...' : (previewUrl ? 'Change Avatar' : 'Upload Avatar')}
                </motion.button>

                {previewUrl && !isUploading && (
                    <motion.button
                        onClick={handleRemoveAvatar}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Remove
                    </motion.button>
                )}
            </div>

            {/* 文件要求说明 */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                <p>Supported formats: JPG, PNG, GIF, WebP</p>
                <p>Maximum size: 1MB</p>
            </div>
        </div>
    );
};

export default AvatarUpload;
