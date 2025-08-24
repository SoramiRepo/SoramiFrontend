import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'timeago.js';
import { MoreVertical, Trash2, Check, CheckCheck } from 'lucide-react';
import { deleteMessage } from '../utils/api';
import { useTranslation } from 'react-i18next';

const ChatMessage = ({ 
    message, 
    isOwnMessage, 
    onDelete, 
    onMarkAsRead,
    showAvatar = true 
}) => {
    const { t } = useTranslation();
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // 调试信息
    console.log('ChatMessage render:', {
        messageId: message._id,
        content: message.content,
        isOwnMessage,
        showAvatar,
        messageType: message.messageType,
        isTemp: message.isTemp
    });

    const handleDelete = async () => {
        if (isDeleting) return;
        
        setIsDeleting(true);
        try {
            await deleteMessage(message._id);
            onDelete?.(message._id);
        } catch (error) {
            console.error('Failed to delete message:', error);
        } finally {
            setIsDeleting(false);
            setShowMenu(false);
        }
    };

    const handleMarkAsRead = () => {
        if (!message.isRead) {
            onMarkAsRead?.(message._id);
        }
        setShowMenu(false);
    };

    const getMessageStatus = () => {
        if (isOwnMessage) {
            if (message.isRead) {
                return <CheckCheck size={14} className="text-blue-500" />;
            } else {
                return <Check size={14} className="text-gray-400" />;
            }
        }
        return null;
    };

    const getMessageContent = () => {
        console.log('Rendering message content:', { 
            content: message.content, 
            messageType: message.messageType,
            isTemp: message.isTemp 
        });
        
        // 确保内容存在
        if (!message.content) {
            console.warn('Message has no content:', message);
            return <div className="text-sm text-gray-400 italic">无内容</div>;
        }
        
        switch (message.messageType) {
            case 'image':
                return (
                    <div className="flex justify-center">
                        <img 
                            src={message.content} 
                            alt="Image message" 
                            className="max-w-full h-auto rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                            style={{ maxHeight: '200px', maxWidth: '300px' }}
                            onClick={() => window.open(message.content, '_blank')}
                        />
                    </div>
                );
            case 'file':
                return (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs">📎</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">File</div>
                            <div className="text-xs text-gray-500 truncate">{message.content}</div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                    </div>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex gap-2 md:gap-3 mb-3 md:mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
            key={message._id} // 确保key唯一性
        >
            {/* 头像 */}
            {showAvatar && (
                <div className="flex-shrink-0">
                    <img
                        src={message.sender?.avatarimg || message.senderInfo?.avatarimg || '/resource/default-avatar.png'}
                        alt="avatar"
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover"
                    />
                </div>
            )}

            {/* 消息内容 */}
            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%]`}>
                {/* 用户名（仅显示他人消息） */}
                {!isOwnMessage && showAvatar && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                        {message.sender?.avatarname || message.sender?.username || 
                         message.senderInfo?.avatarname || message.senderInfo?.username}
                    </div>
                )}

                {/* 消息气泡 */}
                <div className="relative group">
                    <div
                        className={`
                            inline-block px-3 py-2 md:px-4 md:py-3 rounded-2xl max-w-full break-words
                            ${isOwnMessage 
                                ? 'bg-blue-500 text-white rounded-br-md shadow-md' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm'
                            }
                        `}
                    >
                        {getMessageContent()}
                    </div>

                    {/* 消息操作菜单 */}
                    {isOwnMessage && (
                        <div className="absolute top-0 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                                <MoreVertical size={14} />
                            </button>

                            {/* 下拉菜单 */}
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute top-0 right-0 mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                                >
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Trash2 size={14} />
                                        {isDeleting ? t('deleting') : t('delete')}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                {/* 消息状态和时间 */}
                <div className={`flex items-center gap-2 mt-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {getMessageStatus()}
                    {message.isTemp && (
                        <span className="text-xs text-gray-400 italic">发送中...</span>
                    )}
                    {!message.isTemp && (
                        <span className="text-xs text-gray-400">
                            {format(message.createdAt)}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ChatMessage;
