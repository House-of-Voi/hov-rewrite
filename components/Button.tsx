import { ButtonHTMLAttributes, Ref } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export default function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  loading,
  children,
  disabled,
  ref,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md focus-visible:ring-primary-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900',
    secondary: 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm hover:shadow-md focus-visible:ring-accent-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900',
    ghost: 'bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:ring-neutral-500',
    outline: 'border-2 border-primary-500 bg-transparent text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950 focus-visible:ring-primary-500',
  };

  const sizes = {
    sm: 'text-xs px-4 py-2 rounded-lg',
    md: 'text-sm px-6 py-3 rounded-xl',
    lg: 'text-base px-8 py-4 rounded-xl',
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
