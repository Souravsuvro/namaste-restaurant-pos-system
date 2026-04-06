import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'saffron';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-gold/20 text-gold border-gold/30',
  danger: 'bg-tandoori/20 text-tandoori border-tandoori/30',
  info: 'bg-indigo/20 text-blue-300 border-indigo/30',
  default: 'bg-white/10 text-cream/70 border-white/10',
  saffron: 'bg-saffron/20 text-saffron border-saffron/30',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-gold',
  danger: 'bg-tandoori',
  info: 'bg-blue-400',
  default: 'bg-cream/50',
  saffron: 'bg-saffron',
};

export function Badge({ variant = 'default', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5
        text-xs font-medium
        rounded-full border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
