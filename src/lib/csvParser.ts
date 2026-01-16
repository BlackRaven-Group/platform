export interface MapPin {
  id: string;
  title: string;
  note: string;
  lat: number;
  lng: number;
  type: 'agency' | 'lock' | 'tomb' | 'submarine' | 'facility' | 'person' | 'other';
  agency?: string;
}

export function extractCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
  const searchMatch = url.match(/maps\/search\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (searchMatch) {
    return {
      lat: parseFloat(searchMatch[1]),
      lng: parseFloat(searchMatch[2])
    };
  }

  const placeMatch = url.match(/place\/[^/]+\/data=.*?1s0x([0-9a-f]+):0x([0-9a-f]+)/);
  if (placeMatch) {
    return null;
  }

  return null;
}

export function detectPinType(title: string, note: string): { type: MapPin['type']; agency?: string } {
  const text = `${title} ${note}`.toLowerCase();

  if (text.includes('lock')) return { type: 'lock' };
  if (text.includes('tomb') || text.includes('tombe')) return { type: 'tomb' };
  if (text.includes('submarine') || text.includes('snle')) return { type: 'submarine' };
  if (text.includes('factory') || text.includes('base') || text.includes('barracks')) return { type: 'facility' };

  const agencies = ['cia', 'dgse', 'mi6', 'fsb', 'dli', 'bnd', 'nzsis'];
  for (const agency of agencies) {
    if (text.includes(agency)) {
      return { type: 'agency', agency: agency.toUpperCase() };
    }
  }

  if (text.match(/\d+yo/) || text.includes('man') || text.includes('woman')) {
    return { type: 'person' };
  }

  return { type: 'other' };
}

export async function parseCsvFile(filePath: string): Promise<MapPin[]> {
  try {
    const response = await fetch(filePath);
    const text = await response.text();
    const lines = text.split('\n');

    const pins: MapPin[] = [];
    let currentTitle = '';
    let currentNote = '';
    let currentUrl = '';
    let lineBuffer = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      lineBuffer += line;

      const parts = lineBuffer.split('","');
      if (parts.length >= 3) {
        currentTitle = parts[0].replace(/^"/, '');
        currentNote = parts[1];
        currentUrl = parts[2].replace(/"$/, '').split(',')[0];

        const coords = extractCoordinatesFromUrl(currentUrl);
        if (coords) {
          const { type, agency } = detectPinType(currentTitle, currentNote);

          pins.push({
            id: `pin-${i}-${coords.lat}-${coords.lng}`,
            title: currentTitle,
            note: currentNote,
            lat: coords.lat,
            lng: coords.lng,
            type,
            agency
          });
        }

        lineBuffer = '';
      }
    }

    return pins;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

export function getPinColor(pin: MapPin): string {
  switch (pin.type) {
    case 'agency':
      switch (pin.agency) {
        case 'CIA': return '#dc2626';
        case 'DGSE': return '#2563eb';
        case 'MI6': return '#059669';
        case 'FSB': return '#7c2d12';
        case 'DLI': return '#9333ea';
        case 'BND': return '#ea580c';
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

export function getPinIcon(pin: MapPin): string {
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
