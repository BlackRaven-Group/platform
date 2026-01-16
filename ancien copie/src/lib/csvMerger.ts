import { MapPin, parseCsvFile } from './csvParser';

export interface EnrichedMapPin extends MapPin {
  category: string;
  color: string;
  icon: string;
}

const CSV_FILES = [
  '/src/data/Google map - Google map-1 -by MaxAI.csv',
  '/src/data/Google map - Google map-2 -by MaxAI.csv',
  '/src/data/Google map - Google map-3 -by MaxAI.csv',
  '/src/data/Google map - Google map-4 -by MaxAI.csv',
  '/src/data/Google map - Google map-6 -by MaxAI.csv',
  '/src/data/Google map - Google map-6 -by MaxAI copy.csv',
  '/src/data/Google map - Google map-7 -by MaxAI.csv',
  '/src/data/Google map - Google map-7 -by MaxAI copy.csv',
  '/src/data/Google map - Google map-7 -by MaxAI copy copy.csv',
  '/src/data/Google map - Google map-8 -by MaxAI.csv',
  '/src/data/Google map - Google map-8 -by MaxAI copy.csv',
  '/src/data/Google map - Google map-9 -by MaxAI.csv',
  '/src/data/Google map - Google map-9 -by MaxAI copy.csv',
  '/src/data/Google map - Google map-10 -by MaxAI.csv',
  '/src/data/Google map - Google map-10 -by MaxAI copy.csv',
  '/src/data/Google map - Google map-39 -by MaxAI.csv',
  '/src/data/Google map - Google map-40 -by MaxAI.csv',
  '/src/data/Google map - Google map-41 -by MaxAI.csv',
  '/src/data/Google map - Google map-42 -by MaxAI.csv',
  '/src/data/Google map - Google map-43 -by MaxAI.csv'
];

function getCoordinateKey(lat: number, lng: number, precision: number = 4): string {
  return `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
}

function getCategoryFromType(pin: MapPin): string {
  if (pin.agency) return pin.agency;

  switch (pin.type) {
    case 'lock': return 'Locks';
    case 'tomb': return 'Archaeological Sites';
    case 'submarine': return 'Naval Assets';
    case 'facility': return 'Military Facilities';
    case 'person': return 'Personnel';
    default: return 'Other';
  }
}

function getColorFromType(pin: MapPin): string {
  switch (pin.type) {
    case 'agency':
      switch (pin.agency) {
        case 'CIA': return '#dc2626';
        case 'DGSE': return '#2563eb';
        case 'MI6': return '#059669';
        case 'FSB': return '#7c2d12';
        case 'DLI': return '#9333ea';
        case 'BND': return '#ea580c';
        case 'NZSIS': return '#0891b2';
        default: return '#64748b';
      }
    case 'lock': return '#eab308';
    case 'tomb': return '#78350f';
    case 'submarine': return '#0c4a6e';
    case 'facility': return '#991b1b';
    case 'person': return '#1e40af';
    default: return '#475569';
  }
}

function getIconFromType(pin: MapPin): string {
  switch (pin.type) {
    case 'agency': return '🎯';
    case 'lock': return '🔒';
    case 'tomb': return '⚰️';
    case 'submarine': return '🚢';
    case 'facility': return '🏭';
    case 'person': return '👤';
    default: return '📍';
  }
}

function mergePins(pin1: MapPin, pin2: MapPin): MapPin {
  return {
    ...pin1,
    note: pin1.note.length > pin2.note.length ? pin1.note : pin2.note
  };
}

export async function loadAllPinsWithDeduplication(): Promise<EnrichedMapPin[]> {
  const allPins: MapPin[] = [];
  const pinsByLocation = new Map<string, MapPin>();

  for (const file of CSV_FILES) {
    try {
      const pins = await parseCsvFile(file);
      allPins.push(...pins);
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error);
    }
  }

  for (const pin of allPins) {
    const key = getCoordinateKey(pin.lat, pin.lng);

    const existing = pinsByLocation.get(key);
    if (existing) {
      pinsByLocation.set(key, mergePins(existing, pin));
    } else {
      pinsByLocation.set(key, pin);
    }
  }

  const uniquePins: EnrichedMapPin[] = Array.from(pinsByLocation.values()).map(pin => ({
    ...pin,
    category: getCategoryFromType(pin),
    color: getColorFromType(pin),
    icon: getIconFromType(pin)
  }));

  console.log(`Loaded ${allPins.length} pins, deduplicated to ${uniquePins.length} unique locations`);

  return uniquePins;
}

export function getCategoryStats(pins: EnrichedMapPin[]): Record<string, number> {
  const stats: Record<string, number> = {};

  for (const pin of pins) {
    stats[pin.category] = (stats[pin.category] || 0) + 1;
  }

  return Object.fromEntries(
    Object.entries(stats).sort((a, b) => b[1] - a[1])
  );
}

export function filterPinsByCategory(pins: EnrichedMapPin[], categories: string[]): EnrichedMapPin[] {
  if (categories.length === 0) return pins;
  return pins.filter(pin => categories.includes(pin.category));
}

export function searchPins(pins: EnrichedMapPin[], query: string): EnrichedMapPin[] {
  if (!query) return pins;

  const lowerQuery = query.toLowerCase();
  return pins.filter(pin =>
    pin.title.toLowerCase().includes(lowerQuery) ||
    pin.note.toLowerCase().includes(lowerQuery) ||
    pin.category.toLowerCase().includes(lowerQuery)
  );
}
