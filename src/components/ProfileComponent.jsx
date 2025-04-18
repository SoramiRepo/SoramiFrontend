import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function ProfileComponent() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // 嘗試從 localStorage 取得使用者資料
    let currentUser = null;
    try {
        const storedUser = localStorage.getItem('user');
        currentUser = storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
        console.error('Error parsing user:', err);
    }

    useEffect(() => {
        if (currentUser) {
            // 用戶已登入，自動重定向到 /:username
            navigate(`/${currentUser.username}`);
        } else {
            setLoading(false);
            setError('Please log in to view your profile');
        }
    }, [currentUser, navigate]);

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading...</div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-500">{error}</div>;
    }

    return null; // 若無用戶資料，返回空頁面
}

export default ProfileComponent;
