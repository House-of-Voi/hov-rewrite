'use client';

import { useState } from 'react';
import { GENERIC_AVATARS } from '@/lib/utils/genericAvatars';

interface GenericAvatarSelectorProps {
  selectedAvatarId?: string | null;
  onSelect: (avatarId: string) => void;
}

/**
 * Generic avatar selector component
 *
 * Displays a grid of pre-designed generic avatars for users to choose from.
 * Used in the onboarding flow as an alternative to uploading a custom avatar.
 */
export default function GenericAvatarSelector({
  selectedAvatarId,
  onSelect,
}: GenericAvatarSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {GENERIC_AVATARS.map((avatar) => {
          const isSelected = selectedAvatarId === avatar.id;
          const isHovered = hoveredId === avatar.id;

          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              onMouseEnter={() => setHoveredId(avatar.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                relative
                aspect-square
                rounded-xl
                overflow-hidden
                transition-all
                duration-200
                ${
                  isSelected
                    ? 'ring-4 ring-gold-500 scale-105 shadow-lg shadow-gold-500/50'
                    : 'ring-2 ring-gold-500/30 hover:ring-gold-500/50 hover:scale-105'
                }
              `}
              title={avatar.description}
            >
              <div
                className="w-full h-full flex items-center justify-center text-5xl"
                style={{
                  background: `linear-gradient(135deg, ${avatar.gradient.from} 0%, ${avatar.gradient.to} 100%)`,
                }}
              >
                {avatar.emoji}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1 bg-gold-500 rounded-full p-1">
                  <svg
                    className="w-4 h-4 text-neutral-950"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Hover overlay with name */}
              {isHovered && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">{avatar.name}</p>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected avatar info */}
      {selectedAvatarId && (
        <div className="text-center p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
          <p className="text-gold-400 font-semibold">
            {GENERIC_AVATARS.find(a => a.id === selectedAvatarId)?.name} selected
          </p>
        </div>
      )}
    </div>
  );
}
