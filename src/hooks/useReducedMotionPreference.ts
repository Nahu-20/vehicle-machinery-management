import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

export function useReducedMotionPreference(): boolean {
  const shouldReduceMotion = useFramerReducedMotion();
  return Boolean(shouldReduceMotion);
}
