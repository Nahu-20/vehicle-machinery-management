import { Variants } from 'framer-motion';

/**
 * Standard Framer Motion variants using ONLY transform and opacity.
 * Never animate layout properties (width, height, top, left, margin, padding).
 */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

export const staggerContainer = (staggerDelay = 0.08, delayChildren = 0.04): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

/**
 * Button Micro-Interactions
 */
export const buttonHoverTap = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.2, ease: [0, 0, 0.58, 1] as const },
};

/**
 * Card Hover Micro-Interactions
 */
export const cardHover = {
  whileHover: { y: -3 },
  transition: { duration: 0.25, ease: [0, 0, 0.58, 1] as const },
};

/**
 * Image Micro-Interactions
 */
export const imageHover = {
  whileHover: { scale: 1.025 },
  transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] as const },
};

/**
 * Arrow Micro-Interactions
 */
export const arrowHover = {
  initial: { x: 0 },
  whileHover: { x: 3 },
  transition: { duration: 0.2 },
};
