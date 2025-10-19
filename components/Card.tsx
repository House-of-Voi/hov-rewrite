import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glass?: boolean;
  glow?: boolean;
}

export default function Card({ children, className = '', hover = false, glass = false, glow = false, ...props }: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-200';

  let cardStyles = '';
  if (glow) {
    cardStyles = 'casino-card-glow';
  } else if (glass) {
    cardStyles = 'glass-casino';
  } else {
    cardStyles = 'casino-card';
  }

  const hoverStyles = hover ? 'hover:shadow-2xl hover:-translate-y-0.5' : '';

  return (
    <div className={`${baseStyles} ${cardStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 border-b border-gold-900/20 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 border-t border-gold-900/20 ${className}`}>{children}</div>;
}
