import React from 'react';

function FollowBackIndicator({ currentUserId, followerList }) {
    if (!currentUserId || !Array.isArray(followerList)) return null;

    const followedMe = followerList.some(follower => String(follower._id) === String(currentUserId));

    if (!followedMe) return null;

    return (
        <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">
            Followed you
        </span>
    );
}

export default FollowBackIndicator;
