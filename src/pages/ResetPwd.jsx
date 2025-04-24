import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import config from '../config';

function ResetPwd() {
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!username || !newPassword) {
            setMessage(t('username_and_newPassword_required'));
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${config.apiBaseUrl}/api/user/temporary-reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage(data.message || t('network_error'));
            } else {
                setMessage(t('password_reset_success'));
                setTimeout(() => {
                    navigate('/login'); // 重置成功后跳转到登录页面
                }, 2000);
            }
        } catch (err) {
            console.error(err);
            setMessage(t('network_error'));
        }

        setLoading(false);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="bg-white dark:bg-gray-900 dark:text-white p-8 rounded-xl shadow-md w-full max-w-md border-0 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-center mb-6">
                    {t('reset_password')}
                </h1>

                {message && (
                    <div className="mb-4 text-sm text-red-500 text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <input
                        type="text"
                        placeholder={t('username_required')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <input
                        type="password"
                        placeholder={t('new_password_required')}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        {loading ? t('resetting_password') : t('reset_password')}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => navigate('/login')} // 返回登录页
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {t('back_to_login')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ResetPwd;
