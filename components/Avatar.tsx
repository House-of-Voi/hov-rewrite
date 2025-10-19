interface AvatarProps {
  src?: string | null;
  alt?: string;
  displayName?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  editable?: boolean;
  onEditClick?: () => void;
}

/**
 * Avatar component with fallback to initials
 *
 * Displays user avatar image or falls back to initials from display name.
 * Supports multiple sizes and custom styling.
 * Can show edit icon on hover when editable=true.
 */
export default function Avatar({
  src,
  alt = 'User avatar',
  displayName,
  size = 'md',
  className = '',
  editable = false,
  onEditClick,
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-32 h-32 text-2xl',
  };

  // Generate initials from display name
  const getInitials = (name?: string | null): string => {
    if (!name) return '?';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(displayName);

  const avatarContent = (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        overflow-hidden
        flex
        items-center
        justify-center
        bg-gradient-to-br
        from-gold-500/20
        to-royal-500/20
        border-2
        border-gold-500/30
        font-bold
        text-gold-400
        ${className}
      `}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image on error and show initials instead
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  if (!editable || !onEditClick) {
    return avatarContent;
  }

  return (
    <div className="relative group inline-block">
      {avatarContent}
      <button
        onClick={onEditClick}
        className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        title="Edit avatar"
      >
        <svg
          className="w-1/2 h-1/2 text-gold-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </button>
    </div>
  );
}
