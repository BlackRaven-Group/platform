export interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  type: string;
  title: string;
  note: string;
  category: string;
  color: string;
}

export function parseCSVLocations(csvContent: string): MapLocation[] {
  const lines = csvContent.split('\n').slice(1);
  const locations: MapLocation[] = [];
  let idCounter = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Use the same simple regex that worked in the old version
    const match = line.match(/,([^,]*?),"https:\/\/www\.google\.com\/maps\/[^"]*?([0-9.-]+),([0-9.-]+)/);
    if (!match) continue;

    const note = match[1]?.trim() || '';
    const lat = parseFloat(match[2]);
    const lng = parseFloat(match[3]);

    if (isNaN(lat) || isNaN(lng)) {
      skippedCount++;
      console.warn('Invalid coordinates in line:', line.substring(0, 100));
      continue;
    }

    const category = detectCategory(note);
    const color = getCategoryColor(category);

    locations.push({
      id: `loc-${idCounter++}`,
      lat,
      lng,
      type: 'marker',
      title: note.split('\n')[0] || 'Unknown',
      note,
      category,
      color
    });
    matchedCount++;
  }

  console.log(`Parsed ${matchedCount} locations, skipped ${skippedCount} lines`);
  return locations;
}

function detectCategory(note: string): string {
  const noteLower = note.toLowerCase();

  if (noteLower.includes('cia')) return 'CIA';
  if (noteLower.includes('dgse')) return 'DGSE';
  if (noteLower.includes('mi6')) return 'MI6';
  if (noteLower.includes('fsb')) return 'FSB';
  if (noteLower.includes('mossad')) return 'Mossad';
  if (noteLower.includes('bnd')) return 'BND';
  if (noteLower.includes('dli')) return 'DLI';
  if (noteLower.includes('asis')) return 'ASIS';
  if (noteLower.includes('vevak')) return 'VEVAK';
  if (noteLower.includes('tomb')) return 'Archaeological';
  if (noteLower.includes('submarine') || noteLower.includes('snle')) return 'Military Naval';
  if (noteLower.includes('military') || noteLower.includes('army') || noteLower.includes('barracks')) return 'Military';
  if (noteLower.includes('war robots') || noteLower.includes('drones factory')) return 'War Tech';
  if (noteLower.includes('co') || noteLower.includes('signals')) return 'Operations';
  if (noteLower.includes('depot') || noteLower.includes('munitions') || noteLower.includes('ammo')) return 'Arsenal';
  if (noteLower.includes('lock')) return 'Secure Access';
  if (noteLower.includes('boss')) return 'Leadership';
  if (noteLower.includes('spy') || noteLower.includes('agent') || noteLower.includes('double agent')) return 'Intelligence';

  return 'Other';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'CIA': '#ef4444',
    'DGSE': '#3b82f6',
    'MI6': '#10b981',
    'FSB': '#f59e0b',
    'Mossad': '#8b5cf6',
    'BND': '#ec4899',
    'DLI': '#06b6d4',
    'ASIS': '#14b8a6',
    'VEVAK': '#d946ef',
    'Archaeological': '#78716c',
    'Military Naval': '#1e40af',
    'Military': '#991b1b',
    'War Tech': '#7c3aed',
    'Operations': '#ea580c',
    'Arsenal': '#dc2626',
    'Secure Access': '#facc15',
    'Leadership': '#fbbf24',
    'Intelligence': '#f97316',
    'Other': '#6b7280'
  };

  return colors[category] || colors['Other'];
}

export function getCategoryStats(locations: MapLocation[]): Record<string, number> {
  const stats: Record<string, number> = {};

  for (const loc of locations) {
    stats[loc.category] = (stats[loc.category] || 0) + 1;
  }

  return stats;
}

export function filterLocationsByCategory(
  locations: MapLocation[],
  categories: string[]
): MapLocation[] {
  if (categories.length === 0) return locations;
  return locations.filter(loc => categories.includes(loc.category));
}

export function searchLocations(locations: MapLocation[], query: string): MapLocation[] {
  if (!query) return locations;

  const lowerQuery = query.toLowerCase();
  return locations.filter(loc =>
    loc.title.toLowerCase().includes(lowerQuery) ||
    loc.note.toLowerCase().includes(lowerQuery) ||
    loc.category.toLowerCase().includes(lowerQuery)
  );
}

export async function loadMapLocations(): Promise<MapLocation[]> {
  try {
    console.log('Fetching CSV files from /data/...');
    const csvFiles = [
      '/data/Google map - Google map-1 -by MaxAI.csv',
      '/data/Google map - Google map-2 -by MaxAI.csv',
      '/data/Google map - Google map-3 -by MaxAI.csv',
      '/data/Google map - Google map-7 -by MaxAI.csv'
    ];

    const responses = await Promise.all(
      csvFiles.map(url => {
        // Encode the URL properly to handle spaces and special characters
        const encodedUrl = encodeURI(url);
        console.log(`Fetching: ${url} (encoded: ${encodedUrl})`);
        return fetch(encodedUrl).catch(err => {
          console.error(`Failed to fetch ${url}:`, err);
          return null;
        });
      })
    );

    console.log('CSV responses:', responses.map((r, i) => ({
      file: csvFiles[i],
      status: r?.status,
      ok: r?.ok,
      statusText: r?.statusText
    })));

    const failed = responses.filter(r => !r || !r.ok);
    if (failed.length > 0) {
      console.error('Some CSV files failed to load:', failed.length);
    }

    const csvContents = await Promise.all(
      responses.map(async (r, i) => {
        if (!r || !r.ok) {
          console.warn(`Skipping ${csvFiles[i]} due to fetch error`);
          return '';
        }
        try {
          return await r.text();
        } catch (err) {
          console.error(`Error reading text from ${csvFiles[i]}:`, err);
          return '';
        }
      })
    );

    console.log('CSV content lengths:', csvContents.map((c, i) => ({
      file: csvFiles[i],
      length: c.length
    })));

    const allLocations: MapLocation[] = [];
    csvContents.forEach((csv, i) => {
      if (csv) {
        const locations = parseCSVLocations(csv);
        console.log(`Parsed ${locations.length} locations from ${csvFiles[i]}`);
        allLocations.push(...locations);
      }
    });

    console.log('Total locations loaded:', allLocations.length);
    if (allLocations.length > 0) {
      console.log('Sample location:', allLocations[0]);
    }
    return allLocations;
  } catch (error) {
    console.error('Error loading map data:', error);
    return [];
  }
}
