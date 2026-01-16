import { supabase } from './supabase';
import { executeOSINTSearch, type OSINTSearchParams } from './osint';

export interface QueuedSearch {
  id: string;
  dossier_id: string | null;
  query: string;
  limit_value: number;
  lang: string;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  scheduled_for: string | null;
  recurring_pattern: string | null;
  last_run_at: string | null;
  next_run_at: string | null;
  search_id: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export async function addToSearchQueue(
  params: OSINTSearchParams & {
    dossierId?: string;
    priority?: number;
    scheduledFor?: string;
    recurringPattern?: string;
  }
): Promise<string | null> {
  const { error, data } = await supabase
    .from('search_queue')
    .insert({
      dossier_id: params.dossierId || null,
      query: params.query,
      limit_value: params.limit || 100,
      lang: params.lang || 'en',
      priority: params.priority || 5,
      scheduled_for: params.scheduledFor || null,
      recurring_pattern: params.recurringPattern || null,
      status: 'pending'
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error adding to queue:', error);
    return null;
  }

  return data.id;
}

export async function processSearchQueue(): Promise<number> {
  const { data: pendingSearches } = await supabase
    .from('search_queue')
    .select('*')
    .eq('status', 'pending')
    .is('scheduled_for', null)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(5);

  if (!pendingSearches || pendingSearches.length === 0) return 0;

  let processed = 0;

  for (const queueItem of pendingSearches) {
    await supabase
      .from('search_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', queueItem.id);

    try {
      const searchId = await executeOSINTSearch(
        {
          query: queueItem.query,
          limit: queueItem.limit_value,
          lang: queueItem.lang
        },
        queueItem.dossier_id
      );

      if (searchId) {
        await supabase
          .from('search_queue')
          .update({
            status: 'completed',
            search_id: searchId,
            last_run_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);

        if (queueItem.recurring_pattern) {
          const nextRun = calculateNextRun(queueItem.recurring_pattern);
          if (nextRun) {
            await supabase
              .from('search_queue')
              .update({ next_run_at: nextRun.toISOString() })
              .eq('id', queueItem.id);
          }
        }

        processed++;
      } else {
        throw new Error('Search execution failed');
      }
    } catch (error: any) {
      const newRetryCount = queueItem.retry_count + 1;
      const shouldRetry = newRetryCount < queueItem.max_retries;

      await supabase
        .from('search_queue')
        .update({
          status: shouldRetry ? 'pending' : 'failed',
          error_message: error.message,
          retry_count: newRetryCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return processed;
}

export async function processScheduledSearches(): Promise<number> {
  const now = new Date().toISOString();

  const { data: scheduledSearches } = await supabase
    .from('search_queue')
    .select('*')
    .eq('status', 'pending')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', now)
    .order('priority', { ascending: false })
    .limit(5);

  if (!scheduledSearches || scheduledSearches.length === 0) return 0;

  let processed = 0;

  for (const queueItem of scheduledSearches) {
    await supabase
      .from('search_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', queueItem.id);

    try {
      const searchId = await executeOSINTSearch(
        {
          query: queueItem.query,
          limit: queueItem.limit_value,
          lang: queueItem.lang
        },
        queueItem.dossier_id
      );

      if (searchId) {
        await supabase
          .from('search_queue')
          .update({
            status: 'completed',
            search_id: searchId,
            last_run_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);

        processed++;
      }
    } catch (error: any) {
      await supabase
        .from('search_queue')
        .update({
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return processed;
}

export async function processRecurringSearches(): Promise<number> {
  const now = new Date().toISOString();

  const { data: recurringSearches } = await supabase
    .from('search_queue')
    .select('*')
    .eq('status', 'completed')
    .not('recurring_pattern', 'is', null)
    .not('next_run_at', 'is', null)
    .lte('next_run_at', now)
    .limit(5);

  if (!recurringSearches || recurringSearches.length === 0) return 0;

  let processed = 0;

  for (const queueItem of recurringSearches) {
    try {
      const searchId = await executeOSINTSearch(
        {
          query: queueItem.query,
          limit: queueItem.limit_value,
          lang: queueItem.lang
        },
        queueItem.dossier_id
      );

      if (searchId) {
        const nextRun = calculateNextRun(queueItem.recurring_pattern);
        await supabase
          .from('search_queue')
          .update({
            search_id: searchId,
            last_run_at: new Date().toISOString(),
            next_run_at: nextRun?.toISOString() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);

        processed++;
      }
    } catch (error: any) {
      console.error('Recurring search failed:', error);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return processed;
}

function calculateNextRun(pattern: string): Date | null {
  const now = new Date();

  switch (pattern) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    default:
      return null;
  }
}

export async function getQueueStatus(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  const { data } = await supabase
    .from('search_queue')
    .select('status');

  if (!data) {
    return { pending: 0, processing: 0, completed: 0, failed: 0 };
  }

  const status = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };

  for (const item of data) {
    if (item.status === 'pending') status.pending++;
    else if (item.status === 'processing') status.processing++;
    else if (item.status === 'completed') status.completed++;
    else if (item.status === 'failed') status.failed++;
  }

  return status;
}

export async function cancelQueuedSearch(queueId: string): Promise<boolean> {
  const { error } = await supabase
    .from('search_queue')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', queueId)
    .in('status', ['pending', 'failed']);

  return !error;
}

export async function deleteQueuedSearch(queueId: string): Promise<boolean> {
  const { error } = await supabase
    .from('search_queue')
    .delete()
    .eq('id', queueId);

  return !error;
}

export async function getQueuedSearches(dossierId?: string): Promise<QueuedSearch[]> {
  let query = supabase
    .from('search_queue')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (dossierId) {
    query = query.eq('dossier_id', dossierId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching queued searches:', error);
    return [];
  }

  return data || [];
}

export async function retryFailedSearch(queueId: string): Promise<boolean> {
  const { error } = await supabase
    .from('search_queue')
    .update({
      status: 'pending',
      retry_count: 0,
      error_message: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', queueId)
    .eq('status', 'failed');

  return !error;
}
