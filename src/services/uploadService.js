import config from '../config';

class UploadService {
    constructor() {
        this.apiBaseUrl = config.apiBaseUrl;
    }

    // 获取认证头信息
    getAuthHeaders(token) {
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    // 上传头像
    async uploadAvatar(file, token) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${this.apiBaseUrl}/api/upload/avatar`, {
                method: 'POST',
                headers: this.getAuthHeaders(token),
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload avatar');
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        }
    }

    // 上传单张图片
    async uploadImage(file, token) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${this.apiBaseUrl}/api/upload/image`, {
                method: 'POST',
                headers: this.getAuthHeaders(token),
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload image');
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    // 上传多张图片
    async uploadMultipleImages(files, token) {
        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                formData.append('images', file);
            });

            const response = await fetch(`${this.apiBaseUrl}/api/upload/images`, {
                method: 'POST',
                headers: this.getAuthHeaders(token),
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload images');
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading images:', error);
            throw error;
        }
    }

    // 上传通用文件
    async uploadFile(file, token) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.apiBaseUrl}/api/upload/file`, {
                method: 'POST',
                headers: this.getAuthHeaders(token),
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload file');
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    // 删除文件
    async deleteFile(fileName, token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/upload/file/${fileName}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders(token)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete file');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    // 获取文件信息
    async getFileInfo(fileName, token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/upload/file/${fileName}/info`, {
                headers: this.getAuthHeaders(token)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get file info');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting file info:', error);
            throw error;
        }
    }

    // 检查文件是否存在
    async fileExists(fileName) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/upload/file/${fileName}/exists`);

            if (!response.ok) {
                return false;
            }

            const result = await response.json();
            return result.exists;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    // 获取OSS状态
    async getOSSStatus(token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/upload/status`, {
                headers: this.getAuthHeaders(token)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get OSS status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting OSS status:', error);
            throw error;
        }
    }

    // 验证文件类型和大小
    validateFile(file, options = {}) {
        const {
            maxSize = 5 * 1024 * 1024, // 默认5MB
            allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        } = options;

        // 检查文件大小
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`);
        }

        // 检查文件类型
        if (!allowedTypes.includes(file.type)) {
            const allowedExtensions = allowedTypes.map(type => type.split('/')[1]).join(', ');
            throw new Error(`File type not supported. Allowed types: ${allowedExtensions}`);
        }

        return true;
    }

    // 预览文件（创建临时URL）
    createFilePreview(file) {
        return URL.createObjectURL(file);
    }

    // 清理预览URL
    revokeFilePreview(url) {
        URL.revokeObjectURL(url);
    }
}

export default new UploadService();
