import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import passkeyService from '../services/passkeyService';
import { showToast } from '../utils/toast';

function PasskeyManager() {
    const [passkeys, setPasskeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const { t } = useTranslation();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user.token;

    useEffect(() => {
        if (token) {
            loadPasskeys();
        }
    }, [token]);

    const loadPasskeys = async () => {
        try {
            setLoading(true);
            const result = await passkeyService.getUserPasskeys(token);
            setPasskeys(result.passkeys || []);
        } catch (error) {
            console.error('Error loading passkeys:', error);
            showToast(t('error_loading_passkeys') || 'Error loading passkeys', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPasskey = async () => {
        try {
            setRegistering(true);
            const result = await passkeyService.registerPasskey(token);
            
            if (result.verified) {
                showToast(t('passkey_registered_successfully') || 'Passkey registered successfully!', 'success');
                await loadPasskeys(); // 重新加载列表
            } else {
                showToast(t('passkey_registration_failed') || 'Passkey registration failed', 'error');
            }
        } catch (error) {
            console.error('Error registering passkey:', error);
            showToast(error.message || t('passkey_registration_error') || 'Error registering passkey', 'error');
        } finally {
            setRegistering(false);
        }
    };

    const handleDeletePasskey = async (passkeyId) => {
        if (!confirm(t('confirm_delete_passkey') || 'Are you sure you want to delete this passkey?')) {
            return;
        }

        try {
            setDeleting(passkeyId);
            await passkeyService.deletePasskey(passkeyId, token);
            showToast(t('passkey_deleted_successfully') || 'Passkey deleted successfully!', 'success');
            await loadPasskeys(); // 重新加载列表
        } catch (error) {
            console.error('Error deleting passkey:', error);
            showToast(error.message || t('passkey_deletion_error') || 'Error deleting passkey', 'error');
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getTransportIcon = (transports) => {
        if (!transports || transports.length === 0) return '🔐';
        
        const icons = {
            'usb': '🔌',
            'nfc': '📱',
            'ble': '📶',
            'internal': '💻'
        };
        
        return transports.map(t => icons[t] || '🔐').join(' ');
    };

    if (!token) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                    {t('please_login_to_manage_passkeys') || 'Please login to manage passkeys'}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('passkey_management') || 'Passkey Management'}
                    </h2>
                    <motion.button
                        onClick={handleRegisterPasskey}
                        disabled={registering}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {registering ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {t('registering') || 'Registering...'}
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {t('add_passkey') || 'Add Passkey'}
                            </>
                        )}
                    </motion.button>
                </div>

                <div className="mb-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('passkey_description') || 'Passkeys provide secure, passwordless authentication using your device\'s biometric sensors or security keys.'}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : passkeys.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-6xl mb-4">🔐</div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {t('no_passkeys_found') || 'No passkeys found'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            {t('add_first_passkey_description') || 'Add your first passkey to enable passwordless login'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {passkeys.map((passkey) => (
                            <motion.div
                                key={passkey.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">
                                            {getTransportIcon(passkey.transports)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {t('passkey_device') || 'Passkey Device'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {t('created_on') || 'Created'}: {formatDate(passkey.createdAt)}
                                            </p>
                                            {passkey.lastUsed && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {t('last_used') || 'Last used'}: {formatDate(passkey.lastUsed)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <motion.button
                                        onClick={() => handleDeletePasskey(passkey.id)}
                                        disabled={deleting === passkey.id}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        {deleting === passkey.id ? (
                                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        {t('passkey_security_info') || 'Security Information'}
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• {t('passkey_security_1') || 'Passkeys are stored securely on your device'}</li>
                        <li>• {t('passkey_security_2') || 'They cannot be stolen or phished like passwords'}</li>
                        <li>• {t('passkey_security_3') || 'Each passkey is unique to this website'}</li>
                        <li>• {t('passkey_security_4') || 'You can remove them at any time'}</li>
                    </ul>
                </div>
            </motion.div>
        </div>
    );
}

export default PasskeyManager;
