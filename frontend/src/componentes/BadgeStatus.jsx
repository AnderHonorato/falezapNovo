// frontend/src/components/BadgeStatus.jsx

import React from 'react';
import { BsPinAngleFill } from 'react-icons/bs';
import { FiStar, FiBellOff, FiArchive } from 'react-icons/fi';

const BadgeStatus = ({ conversa }) => {
  const badges = [];

  if (conversa.fixada) {
    badges.push({
      icon: BsPinAngleFill,
      color: 'text-blue-500',
      tooltip: 'Fixada'
    });
  }

  if (conversa.favorita) {
    badges.push({
      icon: FiStar,
      color: 'text-yellow-500 fill-yellow-500',
      tooltip: 'Favorita'
    });
  }

  if (conversa.silenciada) {
    badges.push({
      icon: FiBellOff,
      color: 'text-gray-400',
      tooltip: 'Silenciada'
    });
  }

  if (conversa.arquivada) {
    badges.push({
      icon: FiArchive,
      color: 'text-gray-400',
      tooltip: 'Arquivada'
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div
            key={index}
            className="relative group"
            title={badge.tooltip}
          >
            <Icon size={14} className={badge.color} />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1
                          opacity-0 group-hover:opacity-100 transition-opacity
                          bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap
                          pointer-events-none z-10">
              {badge.tooltip}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BadgeStatus;