import React, { useState } from 'react';
import { ImageOff, Sprout } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-emerald-900/10 to-emerald-800/20 ${containerClassName}`}>
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-emerald-100 to-gray-200 animate-pulse z-10" />
      )}

      {/* Image Element */}
      {!hasError ? (
        <img
          src={src}
          alt={alt || 'Oromia Agricultural Bureau visual asset'}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...props}
        />
      ) : (
        /* Fallback Placeholder */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#063D2A] to-[#087A4B] text-white p-4 text-center">
          <Sprout className="h-8 w-8 text-[#D7A928] mb-1 animate-pulse" />
          <span className="text-xs font-bold text-emerald-100">Oromia Agriculture</span>
        </div>
      )}
    </div>
  );
};
