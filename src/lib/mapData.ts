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
  let matchedCount = 0;
  let skippedCount = 0;

  console.log('Parsing CSV with', lines.length, 'lines');

  for (const line of lines) {
    if (!line.trim()) {
      skippedCount++;
      continue;
    }

    // Format: Repère placé,Note,"https://www.google.com/maps/search/lat,lng",
    // Example: Repère placé,Tomb,"https://www.google.com/maps/search/-8.9040006,39.5060725",
    // We need to match: Note (2nd column) and coordinates in URL (3rd column)
    let match = line.match(/^[^,]*?,([^,]*?),"https:\/\/www\.google\.com\/maps\/search\/([0-9.-]+),([0-9.-]+)/);
    
    // Alternative format if quotes are different
    if (!match) {
      match = line.match(/^[^,]*?,([^,]*?),"https:\/\/www\.google\.com\/maps\/search\/([0-9.-]+),([0-9.-]+)"/);
    }
    
    // More flexible: any Google Maps URL with coordinates
    if (!match) {
      match = line.match(/^[^,]*?,([^,]*?),"https:\/\/www\.google\.com\/maps\/[^"]*?([0-9.-]+),([0-9.-]+)/);
    }
    
    if (!match) {
      skippedCount++;
      continue;
    }

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
    
    // List of all CSV files to load
    const csvFiles = [
      'Google map - Google map-1 -by MaxAI.csv',
      'Google map - Google map-2 -by MaxAI.csv',
      'Google map - Google map-3 -by MaxAI.csv',
      'Google map - Google map-4 -by MaxAI.csv',
      'Google map - Google map-6 -by MaxAI.csv',
      'Google map - Google map-7 -by MaxAI.csv',
      'Google map - Google map-8 -by MaxAI.csv',
      'Google map - Google map-9 -by MaxAI.csv',
      'Google map - Google map-10 -by MaxAI.csv',
      'Google map - Google map-39 -by MaxAI.csv',
      'Google map - Google map-40 -by MaxAI.csv',
      'Google map - Google map-41 -by MaxAI.csv',
      'Google map - Google map-42 -by MaxAI.csv',
      'Google map - Google map-43 -by MaxAI.csv'
    ];

    // Fetch all CSV files in parallel
    const responses = await Promise.all(
      csvFiles.map(file => fetch(`/data/${file}`))
    );

    // Check for errors
    const errors: string[] = [];
    responses.forEach((response, index) => {
      if (!response.ok) {
        errors.push(`${csvFiles[index]}: ${response.statusText}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Some CSV files failed to load:', errors);
    }

    // Get text content from all responses
    const csvContents = await Promise.all(
      responses.map(response => response.text())
    );

    console.log(`Loaded ${csvContents.length} CSV files`);

    // Parse all CSV files
    const allLocations: MapLocation[] = [];
    csvContents.forEach((csv, index) => {
      const locations = parseCSVLocations(csv);
      console.log(`${csvFiles[index]}: ${locations.length} locations`);
      allLocations.push(...locations);
    });

    console.log(`Total locations loaded: ${allLocations.length}`);
    return allLocations;
  } catch (error) {
    console.error('Error loading map data:', error);
    return [];
  }
}
