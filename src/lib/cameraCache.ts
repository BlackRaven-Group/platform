import { supabase } from './supabase';

const CACHE_CLEANUP_KEY = 'camera_cache_last_cleanup';
const CLEANUP_INTERVAL_HOURS = 24;
const MAX_CACHE_AGE_DAYS = 30;

export async function cleanupOldCache(): Promise<void> {
  const lastCleanup = localStorage.getItem(CACHE_CLEANUP_KEY);
  const now = Date.now();

  if (lastCleanup) {
    const hoursSinceCleanup = (now - parseInt(lastCleanup)) / (1000 * 60 * 60);
    if (hoursSinceCleanup < CLEANUP_INTERVAL_HOURS) {
      return;
    }
  }

  console.log('Cleaning up old camera cache...');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_CACHE_AGE_DAYS);

  try {
    const { error: cameraError } = await supabase
      .from('surveillance_cameras')
      .delete()
      .lt('last_verified', cutoffDate.toISOString());

    if (cameraError) {
      console.warn('Error cleaning cameras:', cameraError);
    }

    const { error: historyError } = await supabase
      .from('camera_load_history')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (historyError) {
      console.warn('Error cleaning history:', historyError);
    }

    localStorage.setItem(CACHE_CLEANUP_KEY, now.toString());
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

export async function getCacheSize(): Promise<{
  cameraCount: number;
  historyCount: number;
  oldestCamera: string | null;
  newestCamera: string | null;
}> {
  const [camerasResult, historyResult, oldest, newest] = await Promise.all([
    supabase.from('surveillance_cameras').select('id', { count: 'exact', head: true }),
    supabase.from('camera_load_history').select('id', { count: 'exact', head: true }),
    supabase
      .from('surveillance_cameras')
      .select('last_verified')
      .order('last_verified', { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from('surveillance_cameras')
      .select('last_verified')
      .order('last_verified', { ascending: false })
      .limit(1)
      .single()
  ]);

  return {
    cameraCount: camerasResult.count || 0,
    historyCount: historyResult.count || 0,
    oldestCamera: oldest.data?.last_verified || null,
    newestCamera: newest.data?.last_verified || null
  };
}

export async function clearAllCache(): Promise<void> {
  try {
    await Promise.all([
      supabase.from('surveillance_cameras').delete().neq('id', ''),
      supabase.from('camera_load_history').delete().neq('id', '')
    ]);
    console.log('All cache cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

export function startAutomaticCleanup(): void {
  cleanupOldCache();

  setInterval(() => {
    cleanupOldCache();
  }, CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000);
}
