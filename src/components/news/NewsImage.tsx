import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import { NewsManagedFeaturedImage } from '../../types/news';

export type NewsImageAspect = 'card' | 'featured' | 'hero' | 'related' | 'preview';
export type NewsImagePosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface NewsImageProps {
  src?: string;
  managedImage?: NewsManagedFeaturedImage | null;
  alt?: string;
  aspect?: NewsImageAspect;
  objectPosition?: NewsImagePosition;
  fallback?: string;
  loading?: 'eager' | 'lazy';
  caption?: string;
  className?: string;
  imageClassName?: string;
}

const ASPECT_CLASSES: Record<NewsImageAspect, string> = {
  card: 'aspect-[16/10]',
  featured: 'aspect-[16/9]',
  hero: 'aspect-[16/9] md:aspect-[21/9] max-h-[480px]',
  related: 'aspect-[16/10]',
  preview: 'aspect-[16/9] md:aspect-[21/9] max-h-[480px]',
};

const POSITION_CLASSES: Record<NewsImagePosition, string> = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
};

export const NewsImage: React.FC<NewsImageProps> = ({
  src,
  managedImage,
  alt = 'Oromia Agricultural Bureau news image',
  aspect = 'card',
  objectPosition = 'center',
  fallback,
  loading = 'lazy',
  caption,
  className = '',
  imageClassName = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClass = ASPECT_CLASSES[aspect] || ASPECT_CLASSES.card;
  const positionClass = POSITION_CLASSES[objectPosition] || POSITION_CLASSES.center;

  let effectiveSrc = src;
  if (managedImage && managedImage.urls) {
    if (aspect === 'card' || aspect === 'related') {
      effectiveSrc = managedImage.urls.card || managedImage.urls.hero;
    } else if (aspect === 'hero' || aspect === 'featured' || aspect === 'preview') {
      effectiveSrc = managedImage.urls.hero;
    } else {
      effectiveSrc = managedImage.urls.thumbnail || managedImage.urls.card;
    }
  }

  const showFallback = !effectiveSrc || hasError;

  return (
    <figure className={`w-full ${className}`}>
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 ${aspectClass}`}
      >
        {!showFallback ? (
          <>
            {!isLoaded && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-slate-200 via-emerald-100 to-slate-200 dark:from-slate-800 dark:via-emerald-950/60 dark:to-slate-800 animate-pulse z-10"
                aria-hidden="true"
              />
            )}
            <img
              src={effectiveSrc}
              alt={alt}
              loading={loading}
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className={`w-full h-full object-cover transition-all duration-300 ${positionClass} ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              } ${imageClassName}`}
            />
          </>
        ) : fallback ? (
          <img
            src={fallback}
            alt={alt}
            loading={loading}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover ${positionClass} ${imageClassName}`}
          />
        ) : (
          /* Agricultural gradient fallback asset */
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#063D2A] via-[#087A4B] to-[#04281A] text-white flex flex-col items-center justify-center p-4 text-center select-none"
            aria-hidden="true"
          >
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 mb-2 shadow-sm">
              <Sprout className="w-8 h-8 text-[#D5A62E]" aria-hidden="true" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-emerald-100 drop-shadow-xs">
              Oromia Bureau of Agriculture
            </span>
          </div>
        )}
      </div>

      {caption && (
        <figcaption className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2 text-center font-medium italic leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
