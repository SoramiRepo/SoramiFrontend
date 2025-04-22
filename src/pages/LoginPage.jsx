import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [avatarname, setAvatarname] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!username || !password || (!isLogin && !avatarname)) {
            setMessage('Please enter username, avatar name (for registration), and password');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setMessage('Password must be at least 6 characters');
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
                setMessage(data.message || 'Error');
            } else {
                if (isLogin) {
                    localStorage.setItem('user', JSON.stringify({ ...data.user, token: data.token }));
                    navigate('/');
                } else {
                    setMessage('Registration successful, please log in');
                    setIsLogin(true);
                }
            }
        } catch (err) {
            setMessage('Network Error');
            console.error(err);
        }

        setLoading(false);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="bg-white dark:bg-gray-900 dark:text-white p-8 rounded-xl shadow-md w-full max-w-md border dark:border-gray-700">
                <h1 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Login to Sorami' : 'Register for Sorami'}</h1>

                {message && (
                    <div className="mb-4 text-sm text-red-500 text-center">{message}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Avatar Name (for Registration)"
                            value={avatarname}
                            onChange={(e) => setAvatarname(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    )}

                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : isLogin ? 'Login' : 'Register'}
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
                        {isLogin ? 'No account? Click here to register' : 'Already have an account? Click here to login'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
