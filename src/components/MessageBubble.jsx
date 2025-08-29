import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Clock, Download, Play, Pause } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isOwn, showAvatar }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // 获取消息状态图标
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock size={14} className="text-gray-400" />;
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      case 'failed':
        return <span className="text-red-500 text-xs">!</span>;
      default:
        return null;
    }
  };

  // 渲染消息内容
  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        );

      case 'image':
        return (
          <div className="relative">
            {!imageLoaded && !imageError && (
              <div className="w-64 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            )}
            
            {imageError ? (
              <div className="w-64 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <div>Failed to load image</div>
                  <button 
                    onClick={() => setImageError(false)}
                    className="text-blue-500 hover:text-blue-600 text-sm mt-1"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <img
                src={message.file_url}
                alt={message.content}
                className={`max-w-64 max-h-64 rounded-lg object-cover ${
                  imageLoaded ? 'block' : 'hidden'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Download size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{message.file_name}</div>
              <div className="text-xs text-gray-500">
                {(message.file_size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              <Download size={16} />
            </button>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setAudioPlaying(!audioPlaying)}
              className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              {audioPlaying ? (
                <Pause size={20} className="text-white" />
              ) : (
                <Play size={20} className="text-white ml-1" />
              )}
            </button>
            <div className="flex-1">
              <div className="w-32 h-2 bg-gray-300 dark:bg-gray-600 rounded-full">
                <div className="w-1/3 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">1:23 / 3:45</div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
              {message.content}
            </span>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Unsupported message type: {message.type}
          </div>
        );
    }
  };

  // 系统消息居中显示
  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-2"
      >
        {renderMessageContent()}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
        {/* 头像 */}
        {showAvatar && !isOwn && (
          <img
            src={message.sender?.avatar_url || '/default-avatar.png'}
            alt={message.sender?.username}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        )}

        {/* 消息气泡 */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* 发送者名称 */}
          {showAvatar && !isOwn && (
            <div className="text-xs text-gray-500 mb-1 px-2">
              {message.sender?.username}
            </div>
          )}

          {/* 消息内容 */}
          <div
            className={`px-3 py-2 rounded-2xl ${
              isOwn
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
            }`}
          >
            {renderMessageContent()}
          </div>

          {/* 消息状态和时间 */}
          <div className={`flex items-center space-x-1 mt-1 px-2 ${
            isOwn ? 'justify-end' : 'justify-start'
          }`}>
            {isOwn && getStatusIcon()}
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* 占位符，保持对齐 */}
        {showAvatar && isOwn && (
          <div className="w-8 h-8" />
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
