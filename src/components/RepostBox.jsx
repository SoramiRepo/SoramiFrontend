import React from 'react';
import { useTranslation } from 'react-i18next';

const RepostBox = ({ repost }) => {
    const { t } = useTranslation();

    if (!repost) return null;

    const repostAuthor = repost.author;
    const authorName = typeof repostAuthor === 'object' ? repostAuthor.username : 'Unknown User';
    const content = repost.content || '';

    return (
        <div className="relative mx-auto flex w-full flex-col gap-y-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 dark:text-white">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                🔁 {t('repostedFrom')} @{authorName}
            </p>
            {content ? (
                <div className="whitespace-pre-wrap">{content}</div>
            ) : (
                <div className="text-gray-400 italic">{t('originalPostDeleted')}</div>
            )}
        </div>
    );
};

export default RepostBox;
