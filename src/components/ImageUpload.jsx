import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import config from '../config';

// 文件名转义函数，处理 Markdown 中的特殊字符
const escapeFilename = (filename) => {
    if (!filename || typeof filename !== 'string') return '';
    
    return filename
        // 移除 Markdown 语法字符
        .replace(/[\[\](){}]/g, '') // 方括号、圆括号、花括号
        .replace(/[<>]/g, '')       // 尖括号
        .replace(/[|]/g, '')        // 竖线
        .replace(/[`]/g, '')        // 反引号
        .replace(/[~]/g, '')        // 波浪号
        .replace(/[!]/g, '')        // 感叹号
        .replace(/[#]/g, '')        // 井号
        .replace(/[+]/g, '')        // 加号
        .replace(/[-]/g, '')        // 连字符
        .replace(/[=]/g, '')        // 等号
        .replace(/[_]/g, '')        // 下划线
        .replace(/[\\]/g, '')       // 反斜杠
        .replace(/[\/]/g, '')       // 正斜杠
        .replace(/[;]/g, '')        // 分号
        .replace(/[:]/g, '')        // 冒号
        .replace(/["]/g, '')        // 双引号
        .replace(/[']/g, '')        // 单引号
        .replace(/[&]/g, '')        // &符号
        .replace(/[%]/g, '')        // 百分号
        .replace(/[@]/g, '')        // @符号
        .replace(/[?]/g, '')        // 问号
        .replace(/[^a-zA-Z0-9\s.-]/g, '') // 移除其他特殊字符，保留字母、数字、空格、点、连字符
        .replace(/\s+/g, ' ')       // 多个空格替换为单个空格
        .trim();                    // 移除首尾空格
};

function ImageUpload({ onMarkdownInsert, className = '', maxImages = 9 }) {
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const fileInputRef = useRef(null);
    const { t } = useTranslation();

    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        
        if (images.length + files.length > maxImages) {
            alert(t('maxImagesExceeded', { max: maxImages }));
            return;
        }

        setUploading(true);
        
        try {
            const newImages = [];
            
            for (const file of files) {
                // 验证文件类型
                if (!file.type.startsWith('image/')) {
                    continue;
                }
                
                // 验证文件大小 (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    continue;
                }

                // 创建预览URL
                const previewUrl = URL.createObjectURL(file);
                
                // 上传到后端
                const formData = new FormData();
                formData.append('image', file);
                
                const token = JSON.parse(localStorage.getItem('user'))?.token;
                if (!token) {
                    throw new Error('No token found');
                }

                const response = await fetch(`${config.apiBaseUrl}/api/upload/image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const result = await response.json();
                
                // 验证返回数据的完整性
                if (!result.file || !result.file.url || !result.file.originalName) {
                    console.error('Invalid response structure:', result);
                    throw new Error('Invalid response from server');
                }
                
                // 创建图片对象
                const newImage = {
                    url: result.file.url,
                    filename: result.file.originalName, // 使用 originalName
                    size: file.size,
                    mimeType: file.type,
                    previewUrl: previewUrl
                };
                
                // 调试日志
                console.log('Upload result:', result);
                console.log('New image object:', newImage);
                
                newImages.push(newImage);
                
                // 自动插入 Markdown 到编辑器，确保文件名正确转义
                const escapedFilename = escapeFilename(newImage.filename);
                const markdown = `![${escapedFilename}](${newImage.url})\n`;
                console.log('Inserting markdown:', markdown);
                onMarkdownInsert(markdown);
            }
            
            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            
        } catch (error) {
            console.error('Upload error:', error);
            alert(t('uploadFailed'));
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
    };

    const copyMarkdown = (image, index) => {
        const escapedFilename = escapeFilename(image.filename);
        const markdown = `![${escapedFilename}](${image.url})`;
        navigator.clipboard.writeText(markdown).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    const insertMarkdown = (image) => {
        const escapedFilename = escapeFilename(image.filename);
        const markdown = `![${escapedFilename}](${image.url})`;
        onMarkdownInsert(markdown);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        if (files.length > 0) {
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            if (imageFiles.length > 0) {
                const fakeEvent = { target: { files: imageFiles } };
                handleFileSelect(fakeEvent);
            }
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* 图片预览区域 */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <AnimatePresence>
                        {images.map((image, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                            >
                                <img
                                    src={image.previewUrl}
                                    alt={`Image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* 操作按钮覆盖层 */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    <div className="flex space-x-2">
                                        {/* 重新插入Markdown按钮 */}
                                        <motion.button
                                            onClick={() => insertMarkdown(image)}
                                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            title={t('reinsertMarkdown')}
                                        >
                                            <ImageIcon size={16} />
                                        </motion.button>
                                        
                                        {/* 复制Markdown按钮 */}
                                        <motion.button
                                            onClick={() => copyMarkdown(image, index)}
                                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            title={t('copyMarkdown')}
                                        >
                                            {copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                                        </motion.button>
                                        
                                        {/* 删除按钮 */}
                                        <motion.button
                                            onClick={() => removeImage(index)}
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            title={t('deleteImage')}
                                        >
                                            <X size={16} />
                                        </motion.button>
                                    </div>
                                </div>
                                
                                {/* 图片信息 */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                                    <div className="truncate">{image.filename}</div>
                                    <div>{(image.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* 上传区域 */}
            {images.length < maxImages && (
                <motion.div
                    className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center transition-colors duration-200 hover:border-blue-400 dark:hover:border-blue-500 ${
                        uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    whileHover={!uploading ? { scale: 1.02 } : {}}
                    whileTap={!uploading ? { scale: 0.98 } : {}}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />
                    
                    <div className="space-y-2">
                        {uploading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {t('uploading')}...
                                </span>
                            </div>
                        ) : (
                            <>
                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                        {t('clickToUpload')}
                                    </span>{' '}
                                    {t('orDragAndDrop')}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {t('imageFormats')} • {t('maxFileSize')} 5MB • {t('maxImages')} {maxImages}
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>
            )}

            {/* 图片数量提示 */}
            {images.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {t('imagesCount', { count: images.length, max: maxImages })}
                </div>
            )}

            {/* 使用说明 */}
            {images.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="font-medium mb-1">💡 {t('usageInstructions')}：</div>
                    <div>• ✅ {t('autoInserted')} - {t('markdownAutoInserted')}</div>
                    <div>• {t('clickImageButton')} <ImageIcon size={12} className="inline" /> {t('reinsertMarkdown')}</div>
                    <div>• {t('clickCopyButton')} <Copy size={12} className="inline" /> {t('copyMarkdownLink')}</div>
                    <div>• {t('clickDeleteButton')} <X size={12} className="inline" /> {t('deleteImage')}</div>
                </div>
            )}
        </div>
    );
}

export default ImageUpload;
