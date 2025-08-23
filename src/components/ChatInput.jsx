import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Image, Smile, X } from 'lucide-react';
import { startTyping, stopTyping } from '../utils/ws';
import { useTranslation } from 'react-i18next';

const ChatInput = ({ 
    onSend, 
    receiverId, 
    disabled = false, 
    placeholder = "Type a message..." 
}) => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const currentUserId = JSON.parse(localStorage.getItem('user'))?._id;

    // 处理输入变化
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInput(value);

        // 输入提示逻辑
        if (value.trim() && !isTyping) {
            setIsTyping(true);
            startTyping(receiverId);
        } else if (!value.trim() && isTyping) {
            setIsTyping(false);
            stopTyping(receiverId);
        }

        // 重置输入提示定时器
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (value.trim()) {
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                stopTyping(receiverId);
            }, 2000);
        }
    };

    // 处理发送消息
    const handleSend = async () => {
        if (!input.trim() || disabled) return;

        const messageData = {
            receiverId,
            content: input.trim(),
            messageType: 'text'
        };

        console.log('ChatInput sending message:', messageData);

        try {
            await onSend(messageData);
            setInput('');
            setIsTyping(false);
            stopTyping(receiverId);
            
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    // 处理回车键
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 处理文件选择
    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // 文件大小限制 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        if (type === 'image') {
            // 图片类型验证
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
        }

        setSelectedFile({ file, type });
        setShowFileMenu(false);
    };

    // 处理文件上传
    const handleFileUpload = async () => {
        if (!selectedFile || disabled) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile.file);
            formData.append('receiverId', receiverId);
            formData.append('messageType', selectedFile.type);

            // 这里应该调用文件上传API
            // const response = await uploadFile(formData);
            
            // 模拟上传成功
            const messageData = {
                receiverId,
                content: selectedFile.file.name, // 实际应该是文件URL
                messageType: selectedFile.type
            };

            await onSend(messageData);
            setSelectedFile(null);
        } catch (error) {
            console.error('Failed to upload file:', error);
        } finally {
            setIsUploading(false);
        }
    };

    // 清理定时器
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTyping) {
                stopTyping(receiverId);
            }
        };
    }, [isTyping, receiverId]);

    return (
        <div className="border-t bg-white dark:bg-gray-800 p-4">
            {/* 文件上传预览 */}
            {selectedFile && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                                <span className="text-white text-xs">
                                    {selectedFile.type === 'image' ? '🖼️' : '📎'}
                                </span>
                            </div>
                            <div>
                                <div className="text-sm font-medium">{selectedFile.file.name}</div>
                                <div className="text-xs text-gray-500">
                                    {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleFileUpload}
                                disabled={isUploading || disabled}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isUploading ? t('uploading') : t('send')}
                            </button>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 输入区域 */}
            <div className="flex items-end gap-3">
                {/* 文件菜单按钮 */}
                <div className="relative">
                    <button
                        onClick={() => setShowFileMenu(!showFileMenu)}
                        disabled={disabled}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                        <Paperclip size={20} />
                    </button>

                    <AnimatePresence>
                        {showFileMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10"
                            >
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <Image size={16} />
                                    {t('image')}
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <Paperclip size={16} />
                                    {t('file')}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 文本输入 */}
                <div className="flex-1">
                    <textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder={placeholder}
                        className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        rows={1}
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                </div>

                {/* 发送按钮 */}
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || disabled}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </div>

            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                onChange={(e) => handleFileSelect(e, 'file')}
                className="hidden"
            />
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'image')}
                className="hidden"
            />
        </div>
    );
};

export default ChatInput;
