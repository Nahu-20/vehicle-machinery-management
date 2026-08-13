import React from 'react';
import { motion } from 'motion/react';

interface ImageRevealProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  aspectRatio?: string;
}

export const ImageReveal: React.FC<ImageRevealProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  aspectRatio = 'aspect-16/9',
}) => {
  return (
    <motion.div
      className={`relative overflow-hidden ${aspectRatio} ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* Sliding reveal mask */}
      <motion.div
        className="absolute inset-0 z-10 bg-[#063D2A] dark:bg-emerald-950 pointer-events-none"
        variants={{
          hidden: { x: '0%' },
          visible: {
            x: '100%',
            transition: { duration: 0.75, ease: [0.77, 0, 0.175, 1] },
          },
        }}
      />

      {/* Image scaling & opacity */}
      <motion.img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${imgClassName}`}
        loading="lazy"
        variants={{
          hidden: { scale: 1.1, opacity: 0.3 },
          visible: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.85, ease: [0.21, 0.47, 0.32, 0.98], delay: 0.1 },
          },
        }}
      />
    </motion.div>
  );
};
