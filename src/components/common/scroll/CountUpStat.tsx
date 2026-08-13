import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface CountUpStatProps {
  value: string;
  className?: string;
  duration?: number;
}

export const CountUpStat: React.FC<CountUpStatProps> = ({
  value,
  className = '',
  duration = 1.2,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [displayText, setDisplayText] = useState<string>(value);

  useEffect(() => {
    if (!isInView) return;

    // Extract prefix, number, decimals, suffix
    // Matches formats like "1.2M+", "85%", "120,000 ha", "350+"
    const match = value.match(/^([^0-9.]*)([0-9,.]+)(.*)$/);
    if (!match) {
      setDisplayText(value);
      return;
    }

    const prefix = match[1] || '';
    const rawNumStr = match[2].replace(/,/g, '');
    const suffix = match[3] || '';
    const num = parseFloat(rawNumStr);

    if (isNaN(num)) {
      setDisplayText(value);
      return;
    }

    const hasComma = match[2].includes(',');
    const decimals = (rawNumStr.split('.')[1] || '').length;

    let startTime: number | null = null;
    let animationFrameId: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentNum = num * easeProgress;

      let formattedNum = currentNum.toFixed(decimals);
      if (hasComma) {
        const parts = formattedNum.split('.');
        parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
        formattedNum = parts.join('.');
      }

      setDisplayText(`${prefix}${formattedNum}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      } else {
        // Guarantee exact final raw value string at completion
        setDisplayText(value);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, value, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {displayText}
    </motion.span>
  );
};
