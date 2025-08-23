import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';
import PasskeyManager from './PasskeyManager';

function EditProfile() {
    const [avatarname, setAvatarname] = useState('');
    const [avatarimg, setAvatarimg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) {
                showToast(t('notLoggedIn'), 'error');
                return;
            }

            const data = {};
            if (avatarname.trim()) data.avatarname = avatarname;
            if (avatarimg.trim()) data.avatarimg = avatarimg;

            if (Object.keys(data).length === 0) {
                showToast(t('fillAtLeastOneField'), 'error');
                return;
            }

            const res = await fetch(`${config.apiBaseUrl}/api/user/edit-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const result = await res.json();
            if (res.ok) {
                const userData = JSON.parse(localStorage.getItem('user'));
                if (avatarname.trim()) userData.avatarname = avatarname;
                if (avatarimg.trim()) userData.avatarimg = avatarimg;

                localStorage.setItem('user', JSON.stringify(userData));

                showToast(t('profileUpdated'), 'success');
                navigate(`/profile`);
            } else {
                showToast(result.message || t('failedToUpdateProfile'), 'error');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            showToast(t('serverError'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 编辑资料表单 */}
                <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">
                    <h2 className="text-2xl font-semibold text-center mb-6 text-gray-900 dark:text-white">{t('editProfile')}</h2>
                    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('temporaryPageWarning')}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="avatarname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('avatarName')}</label>
                            <input
                                type="text"
                                id="avatarname"
                                value={avatarname}
                                onChange={(e) => setAvatarname(e.target.value)}
                                placeholder={t('enterAvatarName')}
                                className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md"
                            />
                        </div>

                        <div>
                            <label htmlFor="avatarimg" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('avatarImageUrl')}</label>
                            <input
                                type="url"
                                id="avatarimg"
                                value={avatarimg}
                                onChange={(e) => setAvatarimg(e.target.value)}
                                placeholder={t('enterAvatarImageUrl')}
                                className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-600 dark:bg-gray-800 dark:text-white rounded-md"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-2 bg-blue-500 text-white rounded-md mt-4 ${isSubmitting && 'opacity-50 cursor-not-allowed'}`}
                        >
                            {isSubmitting ? t('updating') : t('updateProfile')}
                        </button>
                    </form>
                </div>

                {/* Passkey管理 */}
                <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">
                    <PasskeyManager />
                </div>
            </div>
        </div>
    );
}

export default EditProfile;
