import React from 'react';
import { getFlavorIcon, getContrastTextColor } from '../../lib/flavorIcons';

export function FlavorBadge({
  flavor,
  showName = true,
  size = 'md',
  className = '',
}) {
  if (!flavor) return null;

  const color = flavor.color || '#CBD5E1';
  const iconEmoji = getFlavorIcon(flavor.icon);
  const textColor = getContrastTextColor(color);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-2',
    lg: 'text-sm sm:text-base px-3 py-1.5 gap-2.5',
  };

  const circleSizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  if (!showName) {
    return (
      <span
        title={flavor.name}
        style={{ backgroundColor: color }}
        className={`inline-flex items-center justify-center rounded-full shrink-0 shadow-2xs select-none ${circleSizeClasses[size] || circleSizeClasses.md} ${className}`}
      >
        <span>{iconEmoji}</span>
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundColor: color,
        color: textColor,
      }}
      className={`inline-flex items-center rounded-full font-semibold shadow-2xs select-none transition-transform ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span className="shrink-0">{iconEmoji}</span>
      <span className="truncate max-w-[140px] sm:max-w-[200px]">{flavor.name}</span>
    </span>
  );
}
