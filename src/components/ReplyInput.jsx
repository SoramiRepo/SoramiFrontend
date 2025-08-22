import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, AtSign, Hash, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function ReplyInput({ replyContent, setReplyContent, handleReplySubmit, isSubmitting, handleReplySuccess, onClose }) {
    const { t } = useTranslation();
    const [focused, setFocused] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const textareaRef = useRef(null);
    
    const maxLength = 280;
    const remainingChars = maxLength - replyContent.length;
    const isOverLimit = remainingChars < 0;
    const isNearLimit = remainingChars <= 20 && remainingChars > 0;

    // Emoji data organized by categories - optimized for performance
    const emojiCategories = {
        recent: {
            name: t('Recently Used'),
            emojis: ['😀', '😂', '❤️', '👍', '🎉', '😊', '👏', '🔥']
        },
        smileys: {
            name: t('Smileys & People'),
            emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲']
        },
        animals: {
            name: t('Animals & Nature'),
            emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦏', '🦛', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔']
        },
        food: {
            name: t('Food & Drink'),
            emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾']
        },
        activities: {
            name: t('Activities'),
            emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹‍♀️', '🤹', '🤹‍♂️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🥁', '🪘', '🎹', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩']
        },
        objects: {
            name: t('Objects'),
            emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🪚', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪃', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓']
        },
        symbols: {
            name: t('Symbols'),
            emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁️‍🗨️', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧']
        }
    };

    // Get recently used emojis from localStorage
    const getRecentEmojis = () => {
        try {
            const recent = localStorage.getItem('recentEmojis');
            return recent ? JSON.parse(recent) : emojiCategories.recent.emojis;
        } catch {
            return emojiCategories.recent.emojis;
        }
    };

    // Save emoji to recent list
    const addToRecentEmojis = (emoji) => {
        try {
            let recent = getRecentEmojis();
            recent = recent.filter(e => e !== emoji);
            recent.unshift(emoji);
            recent = recent.slice(0, 8); // Keep only 8 recent emojis
            localStorage.setItem('recentEmojis', JSON.stringify(recent));
        } catch (error) {
            console.error('Failed to save recent emoji:', error);
        }
    };

    // Debounced search query to prevent excessive filtering
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(emojiSearchQuery);
        }, 150);

        return () => clearTimeout(timer);
    }, [emojiSearchQuery]);

    // Memoized filtered emojis to prevent unnecessary recalculations
    const filteredEmojis = React.useMemo(() => {
        if (!debouncedSearchQuery) return emojiCategories;
        
        const filtered = {};
        Object.entries(emojiCategories).forEach(([key, category]) => {
            const emojis = key === 'recent' ? getRecentEmojis() : category.emojis;
            const filteredList = emojis.filter(emoji => {
                // Simple emoji name matching (you could expand this with a proper emoji database)
                const emojiNames = {
                    '😀': 'grinning face happy smile',
                    '😂': 'tears of joy laugh funny',
                    '❤️': 'red heart love',
                    '👍': 'thumbs up good like',
                    '🎉': 'party celebration confetti',
                    '😊': 'smiling face happy',
                    '👏': 'clapping hands applause',
                    '🔥': 'fire hot flame'
                    // Add more emoji names as needed
                };
                const name = emojiNames[emoji] || '';
                return name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
            });
            
            if (filteredList.length > 0) {
                filtered[key] = { ...category, emojis: filteredList };
            }
        });
        
        return filtered;
    }, [debouncedSearchQuery]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [replyContent]);

    const submitReply = async () => {
        if (!replyContent.trim()) {
            setError(t('Reply cannot be empty'));
            return;
        }
        
        if (isOverLimit) {
            setError(t('Reply is too long'));
            return;
        }

        setError('');
        
        try {
            const result = await handleReplySubmit();
            if (result) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onClose?.();
                }, 1500);
                handleReplySuccess?.(result);
            }
        } catch (err) {
            setError(t('Failed to post reply'));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submitReply();
        }
        if (e.key === 'Escape') {
            if (showEmojiPicker) {
                setShowEmojiPicker(false);
            } else {
                onClose?.();
            }
        }
    };

    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = replyContent.substring(0, start) + emoji + replyContent.substring(end);
            
            setReplyContent(newContent);
            addToRecentEmojis(emoji);
            
            // Restore cursor position after emoji insertion
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
            }, 0);
        }
        
        setShowEmojiPicker(false);
    };

    // Toggle emoji picker
    const toggleEmojiPicker = (e) => {
        e.stopPropagation();
        setShowEmojiPicker(!showEmojiPicker);
        setEmojiSearchQuery('');
        setDebouncedSearchQuery('');
    };

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
                setShowEmojiPicker(false);
                setEmojiSearchQuery('');
                setDebouncedSearchQuery('');
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showEmojiPicker]);

    return (
        <motion.div
            className="mt-4 ml-0 sm:ml-10"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border transition-all duration-200 ${
                focused ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-gray-200/50 dark:border-gray-700/50'
            } ${error ? 'border-red-500/50 shadow-lg shadow-red-500/10' : ''}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{t('Replying to this post')}</span>
                    </div>
                    <motion.button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <X size={16} className="text-gray-500 dark:text-gray-400" />
                    </motion.button>
                </div>

                {/* Textarea */}
                <div className="px-4 pb-2">
                    <textarea
                        ref={textareaRef}
                placeholder={t('writeReply')}
                        className="w-full min-h-[80px] max-h-[200px] resize-none bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm leading-relaxed"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isSubmitting}
                        maxLength={maxLength + 50} // Allow slight over-typing for better UX
                    />
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="px-4 pb-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                                {error}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success Message */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            className="px-4 pb-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
                                <Check size={16} />
                                {t('reply_post_success')}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                    {/* Toolbar */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <motion.button
                                className={`p-2 rounded-lg transition-colors duration-200 ${
                                    showEmojiPicker 
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                        : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleEmojiPicker}
                                title="Add emoji"
                            >
                                <Smile size={16} />
                            </motion.button>

                            {/* Emoji Picker */}
                            <AnimatePresence>
                                {showEmojiPicker && (
                                    <motion.div
                                        className="emoji-picker-container absolute bottom-full left-0 mb-2 w-80 max-h-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden z-50"
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Emoji Search */}
                                        <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
                                            <input
                                                type="text"
                                                placeholder={t('Search emojis...')}
                                                value={emojiSearchQuery}
                                                onChange={(e) => setEmojiSearchQuery(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-gray-100/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>

                                        {/* Emoji Categories */}
                                        <div className="max-h-80 overflow-y-auto">
                                            {Object.entries(filteredEmojis).map(([categoryKey, category]) => (
                                                <div key={categoryKey} className="p-3">
                                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                                        {category.name}
                                                    </div>
                                                    <div className="grid grid-cols-8 gap-1">
                                                        {category.emojis.slice(0, 32).map((emoji, index) => (
                                                            <button
                                                                key={`${categoryKey}-${emoji}-${index}`}
                                                                onClick={() => handleEmojiSelect(emoji)}
                                                                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* No results message */}
                                            {emojiSearchQuery && Object.keys(filteredEmojis).length === 0 && (
                                                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                                    <div className="text-2xl mb-2">🔍</div>
                                                    <div className="text-sm">{t('No emojis found')}</div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <motion.button
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            title="Mention someone"
                        >
                            <AtSign size={16} />
                        </motion.button>
                        <motion.button
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            title="Add hashtag"
                        >
                            <Hash size={16} />
                        </motion.button>
                    </div>

                    {/* Character Count & Submit */}
                    <div className="flex items-center gap-3">
                        <div className={`text-xs font-medium ${
                            isOverLimit ? 'text-red-500' : 
                            isNearLimit ? 'text-orange-500' : 
                            'text-gray-500 dark:text-gray-400'
                        }`}>
                            {remainingChars}
                        </div>
                        
                        <motion.button
                            onClick={(e) => {
                                e.stopPropagation();
                                submitReply();
                            }}
                            disabled={isSubmitting || !replyContent.trim() || isOverLimit}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                                isSubmitting || !replyContent.trim() || isOverLimit
                                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                            }`}
                            whileHover={!isSubmitting && replyContent.trim() && !isOverLimit ? { scale: 1.05 } : {}}
                            whileTap={!isSubmitting && replyContent.trim() && !isOverLimit ? { scale: 0.95 } : {}}
                        >
                            {isSubmitting ? (
                                <>
                                    <motion.div
                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                    <span className="text-sm">{t('replying')}</span>
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    <span className="text-sm">{t('reply')}</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* Keyboard Shortcut Hint */}
                {focused && (
                    <motion.div
                        className="absolute -bottom-8 right-0 text-xs text-gray-500 dark:text-gray-400"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                    >
                        {t('Press Ctrl+Enter to reply')}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

export default ReplyInput;
