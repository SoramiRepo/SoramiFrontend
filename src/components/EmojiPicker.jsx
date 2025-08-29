import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('recent');

  // 表情分类
  const categories = [
    { id: 'recent', name: 'Recently Used', icon: '🕐' },
    { id: 'smileys', name: 'Smileys & People', icon: '😀' },
    { id: 'animals', name: 'Animals & Nature', icon: '🐶' },
    { id: 'food', name: 'Food & Drink', icon: '🍎' },
    { id: 'activities', name: 'Activities', icon: '⚽' },
    { id: 'objects', name: 'Objects', icon: '💡' },
    { id: 'symbols', name: 'Symbols', icon: '❤️' },
  ];

  // 表情数据
  const emojis = {
    recent: ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨'],
    smileys: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
      '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧',
      '😮', '😲', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮',
      '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀', '☠️',
      '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀',
      '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦', '👩',
      '🧑', '👨', '👵', '🧓', '👴', '👮', '👷', '💂', '🕵️', '👳',
      '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🧙',
      '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '🧌', '👸', '🤴', '👳',
      '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🧙',
    ],
    animals: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣',
      '🐺', '🦊', '🦝', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫',
      '🦙', '🦒', '🐘', '🦏', '🦛', '🐃', '🐂', '🐄', '🐎', '🐖',
      '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛',
      '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🐪', '🐫',
      '🦙', '🦒', '🐘', '🦏', '🦛', '🐃', '🐂', '🐄', '🐎', '🐖',
      '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛',
      '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🐪', '🐫',
      '🦙', '🦒', '🐘', '🦏', '🦛', '🐃', '🐂', '🐄', '🐎', '🐖',
    ],
    food: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
      '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖',
      '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗',
      '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮',
      '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱',
      '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢',
      '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭',
      '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼',
      '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍷', '🥂', '🥃',
    ],
    activities: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁',
      '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷️', '⛸️', '🥌',
      '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾',
      '🏊', '🏊‍♂️', '🏊‍♀️', '🚣', '🚣‍♂️', '🚣‍♀️', '🏄', '🏄‍♂️', '🏄‍♀️', '🚴',
      '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🏇', '🧘', '🧘‍♂️', '🧘‍♀️', '🏃',
      '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️',
      '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️',
      '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️',
      '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️', '🏃‍♂️', '🏃‍♀️',
    ],
    objects: [
      '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶',
      '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧',
      '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🪤', '🧲', '⛓️', '🪝',
      '🧱', '🪞', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟',
      '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟',
      '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟',
      '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟',
      '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟',
      '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟',
      '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟',
      '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟', '🪟',
    ],
    symbols: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
      '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
      '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
      '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
      '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❌', '⭕', '🛑',
    ],
  };

  // 过滤表情
  const filteredEmojis = searchQuery
    ? Object.values(emojis)
        .flat()
        .filter(emoji => emoji.includes(searchQuery))
    : emojis[activeCategory] || [];

  // 处理表情选择
  const handleEmojiSelect = (emoji) => {
    onEmojiSelect(emoji);
    // 添加到最近使用
    if (!emojis.recent.includes(emoji)) {
      emojis.recent = [emoji, ...emojis.recent.slice(0, 7)];
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
    >
      {/* 头部 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Emoji
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="mt-2 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
          />
        </div>
      </div>

      {/* 分类标签 */}
      {!searchQuery && (
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-1 p-2 text-center text-sm transition-colors ${
                activeCategory === category.id
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-lg">{category.icon}</span>
            </button>
          ))}
        </div>
      )}

      {/* 表情网格 */}
      <div className="p-3 max-h-64 overflow-y-auto">
        {filteredEmojis.length > 0 ? (
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${activeCategory}-${index}`}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No emojis found
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EmojiPicker;
