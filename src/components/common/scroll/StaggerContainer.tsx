import React from 'react';
import { motion, Variants } from 'motion/react';

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

const containerVariants = (staggerDelay: number): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.05,
    },
  },
});

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.08,
  threshold = 0.12,
  className = '',
  once = true,
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      variants={containerVariants(staggerDelay)}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<StaggerItemProps> = ({ children, className = '' }) => {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
};
