import React from 'react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

/**
 * Note 05: "a contour line that draws itself, a stem that grows as someone
 * arrives". A small wheat stem that draws itself in beside a section
 * heading — one quiet movement, reused, rather than a theatrical one.
 *
 * Respects prefers-reduced-motion: the stem is simply already drawn.
 */
interface GrowingStemProps {
  className?: string;
  /** Light stroke for use on the forest and soil bands. */
  onDark?: boolean;
}

export const GrowingStem: React.FC<GrowingStemProps> = ({ className = '', onDark = false }) => {
  const isReducedMotion = useReducedMotionPreference();
  const stroke = onDark ? '#A3E635' : '#087A4B';
  const animate = isReducedMotion ? '' : 'draw-in';

  return (
    <svg
      viewBox="0 0 24 64"
      width="24"
      height="64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* the stalk */}
      <path
        d="M12 64 V14"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        className={animate}
      />
      {/* grains, alternating up the stalk */}
      <path
        d="M12 20 C 4 18 3 11 3 8 C 8 9 12 14 12 20 Z"
        fill={stroke}
        className={isReducedMotion ? '' : 'grow-in'}
        style={isReducedMotion ? undefined : { animationDelay: '0.35s' }}
      />
      <path
        d="M12 20 C 20 18 21 11 21 8 C 16 9 12 14 12 20 Z"
        fill={stroke}
        className={isReducedMotion ? '' : 'grow-in'}
        style={isReducedMotion ? undefined : { animationDelay: '0.45s' }}
      />
      <path
        d="M12 34 C 5 32 4 26 4 23 C 9 24 12 29 12 34 Z"
        fill={stroke}
        opacity="0.75"
        className={isReducedMotion ? '' : 'grow-in'}
        style={isReducedMotion ? undefined : { animationDelay: '0.55s' }}
      />
      <path
        d="M12 34 C 19 32 20 26 20 23 C 15 24 12 29 12 34 Z"
        fill={stroke}
        opacity="0.75"
        className={isReducedMotion ? '' : 'grow-in'}
        style={isReducedMotion ? undefined : { animationDelay: '0.65s' }}
      />
    </svg>
  );
};
