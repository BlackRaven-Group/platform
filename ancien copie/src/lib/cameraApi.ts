import { supabase } from './supabase';

export interface Camera {
  id: string;
  lat: number;
  lng: number;
  surveillanceType?: string;
  indoor?: boolean;
  zone?: string;
  direction?: number;
  tags: Record<string, string>;
}

export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  responseTime?: number;
}

const CACHE_DURATION_HOURS = 24;
const REQUEST_TIMEOUT_MS = 25000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter'
];

let currentEndpointIndex = 0;
const activeRequests = new Map<string, Promise<ApiResult<Camera[]>>>();

function getBoundsKey(bounds: Bounds): string {
  return `${bounds.south.toFixed(4)},${bounds.west.toFixed(4)},${bounds.north.toFixed(4)},${bounds.east.toFixed(4)}`;
}

function buildOverpassQuery(bounds: Bounds): string {
  const { south, west, north, east } = bounds;
  return `[out:json][timeout:25];
(
  node["man_made"="surveillance"](${south},${west},${north},${east});
  node["surveillance"](${south},${west},${north},${east});
);
out body;`;
}

async function fetchFromCache(bounds: Bounds): Promise<Camera[]> {
  const cacheAge = new Date();
  cacheAge.setHours(cacheAge.getHours() - CACHE_DURATION_HOURS);

  const { data, error } = await supabase
    .from('surveillance_cameras')
    .select('*')
    .gte('lat', bounds.south)
    .lte('lat', bounds.north)
    .gte('lng', bounds.west)
    .lte('lng', bounds.east)
    .gte('last_verified', cacheAge.toISOString());

  if (error) {
    console.warn('Cache fetch error:', error);
    return [];
  }

  return (data || []).map(cam => ({
    id: cam.id,
    lat: cam.lat,
    lng: cam.lng,
    surveillanceType: cam.surveillance_type,
    indoor: cam.indoor,
    zone: cam.zone,
    direction: cam.direction,
    tags: cam.tags as Record<string, string>
  }));
}

async function saveToCache(cameras: Camera[]): Promise<void> {
  if (cameras.length === 0) return;

  const cameraRecords = cameras.map(cam => ({
    id: cam.id,
    lat: cam.lat,
    lng: cam.lng,
    surveillance_type: cam.surveillanceType || 'camera',
    indoor: cam.indoor || false,
    zone: cam.zone,
    direction: cam.direction,
    tags: cam.tags,
    last_verified: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('surveillance_cameras')
    .upsert(cameraRecords, {
      onConflict: 'id',
      ignoreDuplicates: false
    });

  if (error) {
    console.warn('Cache save error:', error);
  }
}

async function logRequest(
  bounds: Bounds,
  success: boolean,
  cameraCount: number,
  responseTime: number,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('camera_load_history').insert({
      bounds: bounds as any,
      camera_count: cameraCount,
      success,
      error_message: errorMessage,
      response_time_ms: responseTime
    });
  } catch (err) {
    console.warn('Failed to log request:', err);
  }
}

async function fetchFromOverpass(
  bounds: Bounds,
  retryCount = 0
): Promise<ApiResult<Camera[]>> {
  const startTime = Date.now();
  const query = buildOverpassQuery(bounds);
  const endpoint = OVERPASS_ENDPOINTS[currentEndpointIndex];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 429 || response.status === 504) {
        if (retryCount < MAX_RETRIES) {
          currentEndpointIndex = (currentEndpointIndex + 1) % OVERPASS_ENDPOINTS.length;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
          return fetchFromOverpass(bounds, retryCount + 1);
        }
        const error = response.status === 429
          ? 'API rate limited. Please zoom in or try again later.'
          : 'API timeout. Area too large, please zoom in.';

        await logRequest(bounds, false, 0, responseTime, error);
        return { success: false, error, responseTime };
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.elements) {
      throw new Error('Invalid API response format');
    }

    const cameras: Camera[] = data.elements
      .filter((el: any) => el.lat && el.lon)
      .map((el: any) => ({
        id: el.id.toString(),
        lat: el.lat,
        lng: el.lon,
        surveillanceType: el.tags?.['surveillance:type'] || el.tags?.['camera:type'] || 'camera',
        indoor: el.tags?.['indoor'] === 'yes',
        zone: el.tags?.['surveillance:zone'],
        direction: el.tags?.['camera:direction'] ? parseInt(el.tags['camera:direction']) : undefined,
        tags: el.tags || {}
      }));

    await saveToCache(cameras);
    await logRequest(bounds, true, cameras.length, responseTime);

    return {
      success: true,
      data: cameras,
      responseTime
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    if (error.name === 'AbortError') {
      if (retryCount < MAX_RETRIES) {
        currentEndpointIndex = (currentEndpointIndex + 1) % OVERPASS_ENDPOINTS.length;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return fetchFromOverpass(bounds, retryCount + 1);
      }
      const errorMsg = 'Request timeout. Please zoom in to a smaller area.';
      await logRequest(bounds, false, 0, responseTime, errorMsg);
      return { success: false, error: errorMsg, responseTime };
    }

    if (retryCount < MAX_RETRIES && !error.message.includes('NetworkError')) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return fetchFromOverpass(bounds, retryCount + 1);
    }

    const errorMsg = error.message || 'Failed to load camera data';
    await logRequest(bounds, false, 0, responseTime, errorMsg);

    return {
      success: false,
      error: errorMsg,
      responseTime
    };
  }
}

export async function loadCameras(bounds: Bounds): Promise<ApiResult<Camera[]>> {
  const boundsKey = getBoundsKey(bounds);

  if (activeRequests.has(boundsKey)) {
    return activeRequests.get(boundsKey)!;
  }

  const requestPromise = (async () => {
    try {
      const cachedCameras = await fetchFromCache(bounds);

      if (cachedCameras.length > 0) {
        console.log(`Found ${cachedCameras.length} cameras in cache`);
        return {
          success: true,
          data: cachedCameras,
          cached: true
        };
      }

      console.log('No cache data, fetching from Overpass API...');
      const result = await fetchFromOverpass(bounds);

      return result;

    } catch (error: any) {
      console.error('Camera loading error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    } finally {
      activeRequests.delete(boundsKey);
    }
  })();

  activeRequests.set(boundsKey, requestPromise);
  return requestPromise;
}

export async function getCameraStats(): Promise<{
  totalCameras: number;
  lastUpdate: string | null;
  successRate: number;
}> {
  const [camerasResult, historyResult] = await Promise.all([
    supabase.from('surveillance_cameras').select('id', { count: 'exact', head: true }),
    supabase
      .from('camera_load_history')
      .select('success')
      .order('created_at', { ascending: false })
      .limit(100)
  ]);

  const totalCameras = camerasResult.count || 0;

  const successCount = (historyResult.data || []).filter(h => h.success).length;
  const totalRequests = (historyResult.data || []).length;
  const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;

  const { data: latestCamera } = await supabase
    .from('surveillance_cameras')
    .select('last_verified')
    .order('last_verified', { ascending: false })
    .limit(1)
    .single();

  return {
    totalCameras,
    lastUpdate: latestCamera?.last_verified || null,
    successRate: Math.round(successRate)
  };
}
