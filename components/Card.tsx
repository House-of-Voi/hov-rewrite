import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glass?: boolean;
  elevated?: boolean;
  glow?: boolean;
}

export default function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  elevated = false,
  glow = false,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-200';

  let cardStyles = '';
  if (glow) {
    cardStyles = 'card-glow';
  } else if (glass) {
    cardStyles = 'glass-card';
  } else if (elevated) {
    cardStyles = 'card-elevated';
  } else {
    cardStyles = 'card';
  }

  const hoverStyles = hover ? 'hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-600 cursor-pointer' : '';

  return (
    <div className={`${baseStyles} ${cardStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 border-b border-neutral-200 dark:border-neutral-700 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 border-t border-neutral-200 dark:border-neutral-700 ${className}`}>{children}</div>;
}
