import { supabase } from './supabase';

export interface MapPin {
  id: string;
  title: string;
  note: string;
  lat: number;
  lng: number;
  type: string;
  agency?: string;
  category: string;
  created_at?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function ensureMapPinsTables() {
  const migration = `
    CREATE TABLE IF NOT EXISTS map_pins (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL DEFAULT '',
      note text DEFAULT '',
      lat numeric(10, 7) NOT NULL,
      lng numeric(10, 7) NOT NULL,
      type text NOT NULL DEFAULT 'other',
      agency text,
      category text NOT NULL DEFAULT 'Other',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      CONSTRAINT unique_coordinates UNIQUE (lat, lng)
    );

    CREATE TABLE IF NOT EXISTS map_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      color text NOT NULL,
      icon text NOT NULL,
      pin_type text,
      created_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_map_pins_coordinates ON map_pins (lat, lng);
    CREATE INDEX IF NOT EXISTS idx_map_pins_type ON map_pins (type);
    CREATE INDEX IF NOT EXISTS idx_map_pins_category ON map_pins (category);
    CREATE INDEX IF NOT EXISTS idx_map_pins_agency ON map_pins (agency);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migration });
    if (error) {
      console.warn('Migration warning:', error);
    }
  } catch (err) {
    console.warn('Could not run migration, tables may already exist:', err);
  }

  const categories = [
    { name: 'CIA', color: '#dc2626', icon: '🎯', pin_type: 'agency' },
    { name: 'DGSE', color: '#2563eb', icon: '🎯', pin_type: 'agency' },
    { name: 'MI6', color: '#059669', icon: '🎯', pin_type: 'agency' },
    { name: 'FSB', color: '#7c2d12', icon: '🎯', pin_type: 'agency' },
    { name: 'DLI', color: '#9333ea', icon: '🎯', pin_type: 'agency' },
    { name: 'BND', color: '#ea580c', icon: '🎯', pin_type: 'agency' },
    { name: 'NZSIS', color: '#0891b2', icon: '🎯', pin_type: 'agency' },
    { name: 'Locks', color: '#eab308', icon: '🔒', pin_type: 'lock' },
    { name: 'Archaeological Sites', color: '#78350f', icon: '⚰️', pin_type: 'tomb' },
    { name: 'Naval Assets', color: '#0c4a6e', icon: '🚢', pin_type: 'submarine' },
    { name: 'Military Facilities', color: '#991b1b', icon: '🏭', pin_type: 'facility' },
    { name: 'Personnel', color: '#1e40af', icon: '👤', pin_type: 'person' },
    { name: 'Other', color: '#475569', icon: '📍', pin_type: 'other' }
  ];

  for (const cat of categories) {
    await supabase
      .from('map_categories')
      .upsert([cat], { onConflict: 'name', ignoreDuplicates: true });
  }
}

export async function loadMapPinsFromDatabase(
  bounds?: MapBounds,
  categories?: string[],
  searchQuery?: string,
  limit: number = 10000
): Promise<MapPin[]> {
  try {
    let query = supabase
      .from('map_pins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (bounds) {
      query = query
        .gte('lat', bounds.south)
        .lte('lat', bounds.north)
        .gte('lng', bounds.west)
        .lte('lng', bounds.east);
    }

    if (categories && categories.length > 0) {
      query = query.in('category', categories);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,note.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading pins:', error);
      return [];
    }

    return (data || []).map(pin => ({
      id: pin.id,
      title: pin.title,
      note: pin.note,
      lat: parseFloat(pin.lat),
      lng: parseFloat(pin.lng),
      type: pin.type,
      agency: pin.agency,
      category: pin.category,
      created_at: pin.created_at
    }));
  } catch (err) {
    console.error('Failed to load pins:', err);
    return [];
  }
}

export async function getMapPinsCount(categories?: string[]): Promise<number> {
  try {
    let query = supabase
      .from('map_pins')
      .select('id', { count: 'exact', head: true });

    if (categories && categories.length > 0) {
      query = query.in('category', categories);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting pins:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Failed to count pins:', err);
    return 0;
  }
}

export async function getCategoryStats(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('map_pins')
      .select('category');

    if (error) {
      console.error('Error loading category stats:', error);
      return {};
    }

    const stats: Record<string, number> = {};
    for (const pin of data || []) {
      stats[pin.category] = (stats[pin.category] || 0) + 1;
    }

    return Object.fromEntries(
      Object.entries(stats).sort((a, b) => b[1] - a[1])
    );
  } catch (err) {
    console.error('Failed to load stats:', err);
    return {};
  }
}

export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('map_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to load categories:', err);
    return [];
  }
}

export async function deleteAllPins(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('map_pins')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error deleting pins:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to delete pins:', err);
    return false;
  }
}

export function clusterPins(pins: MapPin[], zoom: number): MapPin[] {
  if (zoom >= 12 || pins.length <= 100) {
    return pins;
  }

  const precision = Math.max(1, Math.floor(zoom / 2));
  const clusters = new Map<string, MapPin[]>();

  for (const pin of pins) {
    const key = `${pin.lat.toFixed(precision)},${pin.lng.toFixed(precision)}`;
    const cluster = clusters.get(key) || [];
    cluster.push(pin);
    clusters.set(key, cluster);
  }

  return Array.from(clusters.values()).map(cluster => {
    if (cluster.length === 1) return cluster[0];

    const avgLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
    const avgLng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length;

    return {
      ...cluster[0],
      id: `cluster-${cluster[0].id}`,
      title: `${cluster.length} locations`,
      note: cluster.map(p => p.title).join(', ').substring(0, 200),
      lat: avgLat,
      lng: avgLng
    };
  });
}
