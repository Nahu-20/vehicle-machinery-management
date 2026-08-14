import React from 'react';

interface AgriPillBadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'dark' | 'outline' | 'forest';
  className?: string;
  icon?: React.ReactNode;
}

export const AgriPillBadge: React.FC<AgriPillBadgeProps> = ({
  children,
  variant = 'lime',
  className = '',
  icon,
}) => {
  const variantStyles = {
    lime: 'bg-[#A3E635] text-[#0A1912] font-semibold',
    dark: 'bg-[#0A1912] text-[#A3E635] border border-[#A3E635]/30',
    outline: 'border border-[#063D2A]/30 dark:border-[#A3E635]/30 text-[#063D2A] dark:text-[#A3E635] bg-white/60 dark:bg-black/30 backdrop-blur-sm',
    forest: 'bg-[#063D2A] text-white font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs tracking-wide font-medium transition-all duration-200 ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="w-2.5 h-2.5 flex items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
};
