import React from 'react';
import { motion } from 'motion/react';

interface SectionHeaderRevealProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  showLine?: boolean;
  className?: string;
}

export const SectionHeaderReveal: React.FC<SectionHeaderRevealProps> = ({
  eyebrow,
  title,
  description,
  align = 'left',
  showLine = true,
  className = '',
}) => {
  const alignmentClass =
    align === 'center' ? 'text-center items-center' : align === 'right' ? 'text-right items-end' : 'text-left items-start';

  const lineAlignmentClass =
    align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : '';

  return (
    <motion.div
      className={`flex flex-col ${alignmentClass} ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ staggerChildren: 0.09 }}
    >
      {eyebrow && (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
          }}
          className="mb-1.5"
        >
          {eyebrow}
        </motion.div>
      )}

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] } },
        }}
      >
        {title}
      </motion.div>

      {showLine && (
        <motion.div
          variants={{
            hidden: { width: 0, opacity: 0 },
            visible: { width: '60px', opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
          }}
          className={`h-1 bg-gradient-to-r from-[#D7A928] to-emerald-600 rounded-full my-3 ${lineAlignmentClass}`}
        />
      )}

      {description && (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
          }}
          className="mt-1"
        >
          {description}
        </motion.div>
      )}
    </motion.div>
  );
};
