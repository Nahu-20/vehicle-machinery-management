import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] pointer-events-none bg-emerald-950/20">
      <motion.div
        className="h-full bg-gradient-to-r from-[#063D2A] via-[#D7A928] to-emerald-500 origin-left"
        style={{ scaleX }}
      />
    </div>
  );
};
