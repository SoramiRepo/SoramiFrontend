import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    const formVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        },
        exit: { 
            opacity: 0, 
            x: 50,
            transition: {
                duration: 0.3,
                ease: "easeIn"
            }
        }
    };

    const buttonVariants = {
        idle: { scale: 1 },
        hover: { scale: 1.02 },
        tap: { scale: 0.98 },
        loading: { 
            scale: [1, 1.05, 1],
            transition: {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    const inputVariants = {
        idle: { scale: 1 },
        focus: { scale: 1.02 }
    };

    return (
        <motion.div 
            className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 dark:from-gray-900 dark:to-gray-800 p-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div 
                className="bg-white dark:bg-gray-900 dark:text-white p-8 rounded-xl shadow-lg w-full max-w-md border-0 dark:border-gray-700 backdrop-blur-sm"
                variants={itemVariants}
                whileHover={{ 
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    transition: { duration: 0.3 }
                }}
            >
                <motion.h1 
                    className="text-2xl font-bold text-center mb-6"
                    variants={itemVariants}
                >
                    {isLogin ? t('login_to_sorami') : t('register_for_sorami')}
                </motion.h1>

                <AnimatePresence mode="wait">
                    {message && (
                        <motion.div 
                            className="mb-4 text-sm text-red-500 text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                        >
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    <motion.form 
                        key={isLogin ? 'login' : 'register'}
                        onSubmit={handleSubmit} 
                        className="space-y-4"
                        variants={formVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <AnimatePresence>
                            {!isLogin && (
                                <motion.input
                                    type="text"
                                    placeholder={t('avatarname_required')}
                                    value={avatarname}
                                    onChange={(e) => setAvatarname(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                                    variants={inputVariants}
                                    initial="idle"
                                    whileFocus="focus"
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                        </AnimatePresence>

                        <motion.input
                            type="text"
                            placeholder={t('username_required')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            variants={inputVariants}
                            initial="idle"
                            whileFocus="focus"
                        />

                        <motion.input
                            type="password"
                            placeholder={t('password_required')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            variants={inputVariants}
                            initial="idle"
                            whileFocus="focus"
                        />

                        <motion.button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                            variants={buttonVariants}
                            initial="idle"
                            whileHover={loading ? "loading" : "hover"}
                            whileTap="tap"
                            animate={loading ? "loading" : "idle"}
                        >
                            {loading ? (
                                <motion.div 
                                    className="flex items-center justify-center gap-2"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    {t('submit')}
                                </motion.div>
                            ) : (
                                isLogin ? t('login') : t('register')
                            )}
                        </motion.button>
                    </motion.form>
                </AnimatePresence>

                <motion.div 
                    className="text-center mt-6"
                    variants={itemVariants}
                >
                    <motion.button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage('');
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 underline decoration-2 underline-offset-4"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isLogin ? t('no_account') : t('have_account')}
                    </motion.button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

export default LoginPage;
