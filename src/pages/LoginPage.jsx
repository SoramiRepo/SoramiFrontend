import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { useTranslation } from 'react-i18next';

function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [avatarname, setAvatarname] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!username || !password || (!isLogin && !avatarname)) {
            setMessage(
              !username
                ? t('username_required')
                : !password
                  ? t('password_required')
                  : t('avatarname_required')
            );
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setMessage(t('password_min_length'));
            setLoading(false);
            return;
        }

        try {
            const url = isLogin
                ? `${config.apiBaseUrl}/api/user/login`
                : `${config.apiBaseUrl}/api/user/register`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    avatarname: isLogin ? undefined : avatarname,
                    password,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage(data.message || t('network_error'));
            } else {
                if (isLogin) {
                    localStorage.setItem(
                      'user',
                      JSON.stringify({ ...data.user, token: data.token })
                    );
                    navigate('/');
                } else {
                    setMessage(t('register_for_sorami'));
                    setIsLogin(true);
                }
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
                    {isLogin ? t('login_to_sorami') : t('register_for_sorami')}
                </h1>

                {message && (
                    <div className="mb-4 text-sm text-red-500 text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder={t('avatarname_required')}
                            value={avatarname}
                            onChange={(e) => setAvatarname(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    )}

                    <input
                        type="text"
                        placeholder={t('username_required')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <input
                        type="password"
                        placeholder={t('password_required')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        {loading
                            ? t('submit')
                            : isLogin
                            ? t('login')
                            : t('register')}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage('');
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {isLogin ? t('no_account') : t('have_account')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
