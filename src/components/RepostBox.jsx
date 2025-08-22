import React from 'react';
import { useTranslation } from 'react-i18next';
import { Repeat2 } from 'lucide-react';

const RepostBox = ({ repost, repostAuthor }) => {
    const { t } = useTranslation();

    if (!repost) return null;

    const originalAuthor = repost.author;
    const authorName = typeof originalAuthor === 'object' ? 
        (originalAuthor.avatarname || originalAuthor.username) : 'Unknown User';
    const repostAuthorName = typeof repostAuthor === 'object' ? 
        (repostAuthor.avatarname || repostAuthor.username) : 'Unknown User';

    return (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Repeat2 size={14} className="text-gray-400" />
            <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{repostAuthorName}</span>
                {' '}{t('repostedBy')}{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{authorName}</span>
            </span>
        </div>
    );
};

export default RepostBox;
