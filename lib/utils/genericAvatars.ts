/**
 * Generic avatar configurations
 *
 * These avatars provide default options for users during onboarding.
 * Each avatar has a unique color scheme and emoji/icon.
 */

export interface GenericAvatar {
  id: string;
  name: string;
  emoji: string;
  gradient: {
    from: string;
    to: string;
  };
  description: string;
}

export const GENERIC_AVATARS: GenericAvatar[] = [
  {
    id: 'avatar-1',
    name: 'Rocket',
    emoji: '🚀',
    gradient: {
      from: '#FF6B6B',
      to: '#FF8E53',
    },
    description: 'Bold and adventurous',
  },
  {
    id: 'avatar-2',
    name: 'Diamond',
    emoji: '💎',
    gradient: {
      from: '#4ECDC4',
      to: '#44A08D',
    },
    description: 'Precious and rare',
  },
  {
    id: 'avatar-3',
    name: 'Crown',
    emoji: '👑',
    gradient: {
      from: '#F7971E',
      to: '#FFD200',
    },
    description: 'Royal and confident',
  },
  {
    id: 'avatar-4',
    name: 'Lightning',
    emoji: '⚡',
    gradient: {
      from: '#8E2DE2',
      to: '#4A00E0',
    },
    description: 'Fast and powerful',
  },
  {
    id: 'avatar-5',
    name: 'Fire',
    emoji: '🔥',
    gradient: {
      from: '#FF416C',
      to: '#FF4B2B',
    },
    description: 'Hot and unstoppable',
  },
  {
    id: 'avatar-6',
    name: 'Star',
    emoji: '⭐',
    gradient: {
      from: '#FFA500',
      to: '#FFD700',
    },
    description: 'Bright and shining',
  },
  {
    id: 'avatar-7',
    name: 'Moon',
    emoji: '🌙',
    gradient: {
      from: '#667EEA',
      to: '#764BA2',
    },
    description: 'Mystical and calm',
  },
  {
    id: 'avatar-8',
    name: 'Gem',
    emoji: '💠',
    gradient: {
      from: '#06BEB6',
      to: '#48B1BF',
    },
    description: 'Cool and elegant',
  },
];

/**
 * Generate an SVG data URL for a generic avatar
 */
export function generateAvatarDataUrl(avatar: GenericAvatar): string {
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${avatar.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${avatar.gradient.from};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${avatar.gradient.to};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad-${avatar.id})"/>
      <text x="256" y="330" font-size="280" text-anchor="middle" fill="white" opacity="0.95">${avatar.emoji}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Get a generic avatar URL for use in the app
 * Returns a data URL for the avatar
 */
export function getGenericAvatarUrl(avatarId: string): string | null {
  const avatar = GENERIC_AVATARS.find(a => a.id === avatarId);
  if (!avatar) return null;

  return generateAvatarDataUrl(avatar);
}
