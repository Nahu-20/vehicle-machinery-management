import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins once safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/**
 * Creates a marquee scroll loop using ONLY transform x.
 * Never animates left, margin-left, or width.
 */
export function createMarqueeLoop({
  target,
  duration = 30,
  direction = 'left',
}: {
  target: HTMLElement | string;
  duration?: number;
  direction?: 'left' | 'right';
}) {
  const xPercentStart = direction === 'left' ? 0 : -50;
  const xPercentEnd = direction === 'left' ? -50 : 0;

  return gsap.to(target, {
    xPercent: xPercentEnd,
    repeat: -1,
    duration,
    ease: 'none',
    startAt: { xPercent: xPercentStart },
  });
}
