import { useState, useCallback } from 'react';
import { CanonicalZoneId, isCanonicalZoneId } from '../constants/canonicalZones';

export function useSelectedZone(initialZoneId: CanonicalZoneId | null = null) {
  const [selectedZoneId, setSelectedZoneId] = useState<CanonicalZoneId | null>(initialZoneId);

  const selectZone = useCallback((zoneId: string | null) => {
    if (zoneId === null) {
      setSelectedZoneId(null);
      return;
    }

    if (isCanonicalZoneId(zoneId)) {
      setSelectedZoneId(zoneId);
    } else {
      console.warn(`[M4 Selection Warning] Ignored invalid zone_id: '${zoneId}'`);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedZoneId(null);
  }, []);

  return {
    selectedZoneId,
    selectZone,
    clearSelection,
  };
}
