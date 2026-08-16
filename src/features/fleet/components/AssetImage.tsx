import React, { useState } from 'react';
import { Tractor, Truck, Bike, Bus, Droplets, Zap, Wrench, Combine, Package } from 'lucide-react';
import type { FleetAssetType } from '../types/fleet';

/**
 * Photograph of an asset, with a drawn placeholder when there is none.
 *
 * The placeholder is generated rather than fetched: a picture of a machine is
 * useful, a broken-image icon is worse than nothing, and this module must render
 * with no network at all. Each asset type gets its own glyph and tint so a
 * register with no photographs at all still reads at a glance.
 *
 * A supplied URL that fails to load falls back to the same placeholder, because
 * staff will paste links that rot and a register full of broken images teaches
 * people to stop looking at it.
 */

const TYPE_GLYPH: Record<FleetAssetType, React.ComponentType<{ className?: string }>> = {
  tractor: Tractor,
  harvester: Combine,
  implement: Wrench,
  pickup: Truck,
  truck: Truck,
  motorcycle: Bike,
  bus: Bus,
  pump: Droplets,
  generator: Zap,
  other: Package,
};

/**
 * Tints are per family rather than per type, so a glance separates farm
 * machinery from road vehicles from static plant without anyone learning ten
 * colours.
 */
const TYPE_TINT: Record<FleetAssetType, string> = {
  tractor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  harvester: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  implement: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pickup: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  truck: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  motorcycle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  bus: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  pump: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  generator: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  other: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

export interface AssetImageProps {
  assetType: FleetAssetType;
  imageUrl?: string;
  alt?: string;
  /** `thumb` for table rows, `card` for the asset page header. */
  size?: 'thumb' | 'card';
  className?: string;
}

export const AssetImage: React.FC<AssetImageProps> = ({
  assetType,
  imageUrl,
  alt,
  size = 'thumb',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  const box =
    size === 'card'
      ? 'w-32 h-24 rounded-2xl'
      : 'w-12 h-12 rounded-xl';
  const glyphSize = size === 'card' ? 'w-8 h-8' : 'w-5 h-5';

  const Glyph = TYPE_GLYPH[assetType] ?? Package;

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={alt ?? `${assetType} photograph`}
        onError={() => setFailed(true)}
        loading="lazy"
        className={`${box} object-cover border border-slate-200 dark:border-slate-700 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt ?? `${assetType}, no photograph on file`}
      className={`${box} ${TYPE_TINT[assetType] ?? TYPE_TINT.other} border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 ${className}`}
    >
      <Glyph className={glyphSize} />
    </div>
  );
};

export default AssetImage;
