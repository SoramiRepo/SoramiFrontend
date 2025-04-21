import React from 'react';

const UserBadges = ({ badges = [] }) => {
    return (
        <div className="flex gap-1 ml-2">
            {badges.includes('verified') && (
                <img
                    src="/resource/icons/verified.svg"
                    alt="Verified Badge"
                    className="w-5 h-5"
                    title="Verified"
                />
            )}
            {badges.includes('soramidev') && (
                <img
                    src="/resource/icons/dev.svg"
                    alt="Sorami Dev Badge"
                    className="w-5 h-5"
                    title="SoramiDev"
                />
            )}
        </div>
    );
};

export default UserBadges;
