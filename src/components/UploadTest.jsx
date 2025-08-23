import React, { useState } from 'react';
import uploadService from '../services/uploadService';
import { useToast } from './ToastContext';

const UploadTest = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const { showToast } = useToast();

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) {
                showToast('Please login first', 'error');
                return;
            }

            // 验证文件
            uploadService.validateFile(file);

            // 上传文件
            const result = await uploadService.uploadImage(file, token);
            
            showToast('File uploaded successfully!', 'success');
            setUploadedFiles(prev => [...prev, result.file]);
            
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Upload Test</h2>
            
            <div className="space-y-6">
                {/* 文件上传区域 */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mt-4">
                            <label className="cursor-pointer">
                                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                </div>

                {/* 上传的文件列表 */}
                {uploadedFiles.length > 0 && (
                    <div>
                        <h3 className="text-lg font-medium mb-3">Uploaded Files</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <img
                                        src={file.url}
                                        alt={file.originalName}
                                        className="w-16 h-16 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">{file.originalName}</p>
                                        <p className="text-sm text-gray-500">{file.contentType} • {Math.round(file.size / 1024)}KB</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 truncate">{file.url}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadTest;
