export function buildNestedReplies(posts, parentId) {
    const nested = [];
    for (const post of posts) {
        if (String(post.parent) === String(parentId)) {
            const children = buildNestedReplies(posts, post._id);
            nested.push({ ...post, replies: children });
        }
    }
    return nested;
}