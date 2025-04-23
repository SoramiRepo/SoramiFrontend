import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { useTranslation } from 'react-i18next';

function ProfileComponent() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { t } = useTranslation();

    let currentUser = null;
    try {
        const storedUser = localStorage.getItem('user');
        currentUser = storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
        console.error('Error parsing user:', err);
    }

    useEffect(() => {
        if (currentUser) {
            navigate(`/${currentUser.username}`);
        } else {
            navigate(`/login`);
        }
    }, [currentUser, navigate]);

    if (loading) {
        return <div className="p-10 text-center text-gray-500">{t('loading')}</div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-500">{error}</div>;
    }

    return null;
}

export default ProfileComponent;
