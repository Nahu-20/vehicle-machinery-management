import { AlertGeographicTarget, AlertSubjectTarget } from '../../../types/agriculturalAlert';

export function formatGeographicTarget(
  geo?: AlertGeographicTarget | null,
  lang: 'om' | 'am' | 'en' = 'om'
): string {
  if (!geo) {
    if (lang === 'om') return 'Murtaa’aa Miti';
    if (lang === 'am') return 'ያልተገለጸ';
    return 'Unspecified';
  }

  if (geo.regionWide) {
    if (lang === 'om') return 'Oromiyaa Guutuu';
    if (lang === 'am') return 'መላው ኦሮሚያ';
    return 'All Oromia';
  }

  const zoneCount = geo.zones ? geo.zones.length : 0;
  const woredaCount = geo.woredas ? geo.woredas.length : 0;

  if (zoneCount === 0 && woredaCount === 0) {
    if (lang === 'om') return 'Godina Miti';
    if (lang === 'am') return 'ዞን አልተገለጸም';
    return 'No zones specified';
  }

  const primaryZone = geo.zones && geo.zones.length > 0 ? geo.zones[0] : '';
  const remainingZones = zoneCount > 1 ? zoneCount - 1 : 0;

  if (zoneCount > 0 && woredaCount > 0) {
    if (lang === 'om') {
      return `${primaryZone}${remainingZones > 0 ? ` + godinaalee ${remainingZones}` : ''} (${woredaCount} aanaa)`;
    }
    if (lang === 'am') {
      return `${primaryZone}${remainingZones > 0 ? ` + ${remainingZones} ዞኖች` : ''} (${woredaCount} ወረዳዎች)`;
    }
    return `${primaryZone}${remainingZones > 0 ? ` + ${remainingZones} zones` : ''} (${woredaCount} woredas)`;
  }

  if (zoneCount > 0) {
    if (remainingZones > 0) {
      if (lang === 'om') return `${primaryZone} + godinaalee ${remainingZones}`;
      if (lang === 'am') return `${primaryZone} + ${remainingZones} ዞኖች`;
      return `${primaryZone} + ${remainingZones} zones`;
    }
    return primaryZone;
  }

  if (woredaCount > 0) {
    if (lang === 'om') return `Aanaalee ${woredaCount}`;
    if (lang === 'am') return `${woredaCount} ወረዳዎች`;
    return `${woredaCount} Woredas`;
  }

  return 'Targeted';
}

export function formatSubjectTarget(
  subj?: AlertSubjectTarget | null,
  lang: 'om' | 'am' | 'en' = 'om'
): string {
  if (!subj) {
    if (lang === 'om') return 'Oomishaalee Guutuu';
    if (lang === 'am') return 'ሁሉም ሰብሎች';
    return 'All Agricultural Subjects';
  }

  const crops = subj.crops || [];
  const livestock = subj.livestock || [];

  if (crops.length === 0 && livestock.length === 0) {
    if (lang === 'om') return 'Oomishaalee Guutuu';
    if (lang === 'am') return 'ሁሉም ሰብሎችና እንስሳት';
    return 'All Crops & Livestock';
  }

  if (crops.length > 0 && livestock.length === 0) {
    if (crops.length <= 2) {
      return crops.join(', ');
    }
    if (lang === 'om') return `Midhaan ${crops.length}`;
    if (lang === 'am') return `${crops.length} ሰብሎች`;
    return `${crops.length} Crop Types`;
  }

  if (livestock.length > 0 && crops.length === 0) {
    if (livestock.length <= 2) {
      return livestock.join(', ');
    }
    if (lang === 'om') return `Beeylada ${livestock.length}`;
    if (lang === 'am') return `${livestock.length} እንስሳት`;
    return `${livestock.length} Livestock Types`;
  }

  if (lang === 'om') return `Midhaan ${crops.length} + Beeylada ${livestock.length}`;
  if (lang === 'am') return `${crops.length} ሰብሎች + ${livestock.length} እንስሳት`;
  return `${crops.length} crops + ${livestock.length} livestock`;
}
