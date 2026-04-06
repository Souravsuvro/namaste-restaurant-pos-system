import React from 'react';

type CardVariant = 'default' | 'elevated';

interface CardProps {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-[#162a4a] border border-[#1e3a5f]',
  elevated: 'bg-[#1a3052] border border-[#2a4a72] shadow-lg shadow-black/20',
};

const paddingClasses: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  onClick,
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer hover:border-saffron/40 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
