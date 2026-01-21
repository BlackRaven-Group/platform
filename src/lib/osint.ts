import { supabase } from './supabase';

export interface OSINTConfig {
  api_token: string;
  api_url: string;
  default_limit: number;
  default_lang: string;
  bot_name?: string;
}

export interface OSINTSearchParams {
  query: string;
  limit?: number;
  lang?: string;
}

export interface OSINTResult {
  database_name: string;
  info_leak: string;
  data: Record<string, any>[];
}

export interface OSINTSearchResponse {
  id: string;
  query: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'confirmed';
  raw_results?: any;
  parsed_results?: OSINTResult[];
  error_message?: string;
  created_at: string;
}

export async function getOSINTConfig(): Promise<OSINTConfig | null> {
  const { data, error } = await supabase
    .from('osint_api_config')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching OSINT config:', error);
    return null;
  }

  return data;
}

export async function executeOSINTSearch(params: OSINTSearchParams, dossierId?: string): Promise<string | null> {
  const config = await getOSINTConfig();
  
  // Use default values if config doesn't exist
  const defaultLimit = config?.default_limit || 100;
  const defaultLang = config?.default_lang || 'en';
  const apiToken = config?.api_token || '1084286392:zGIJBluG';
  const apiUrl = config?.api_url || 'https://leakosintapi.com/';

  const searchRecord = {
    dossier_id: dossierId || null,
    query: params.query,
    limit_used: params.limit || defaultLimit,
    lang: params.lang || defaultLang,
    status: 'processing'
  };

  const { data: search, error: insertError } = await supabase
    .from('osint_searches')
    .insert(searchRecord)
    .select()
    .single();

  if (insertError || !search) {
    console.error('Error creating search record:', insertError);
    return null;
  }

  try {
    const requestBody: any = {
      token: apiToken,
      request: params.query,
      limit: params.limit || defaultLimit,
      lang: params.lang || defaultLang
    };

    if (config?.bot_name) {
      requestBody.bot_name = config.bot_name;
    }

    // Use Edge Function if available, otherwise call API directly
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/osint-search`;
    
    let response: Response;
    try {
      response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      // If Edge Function returns error, try direct API
      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status}`);
      }
    } catch (edgeError) {
      // If Edge Function fails, call API directly
      console.warn('Edge Function failed, calling API directly:', edgeError);
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
    }

    const result = await response.json();

    if (result.error || result['Error code']) {
      const errorMsg = result.error || result['Error code'];
      await supabase
        .from('osint_searches')
        .update({
          status: 'failed',
          error_message: errorMsg,
          updated_at: new Date().toISOString()
        })
        .eq('id', search.id);

      throw new Error(errorMsg);
    }

    const parsedResults = parseOSINTResults(result);

    await supabase
      .from('osint_searches')
      .update({
        status: 'completed',
        raw_results: result,
        parsed_results: parsedResults,
        updated_at: new Date().toISOString()
      })
      .eq('id', search.id);

    return search.id;
  } catch (error: any) {
    await supabase
      .from('osint_searches')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', search.id);

    throw error;
  }
}

function parseOSINTResults(apiResponse: any): OSINTResult[] {
  const results: OSINTResult[] = [];

  if (!apiResponse.List) {
    return results;
  }

  for (const [databaseName, databaseData] of Object.entries(apiResponse.List)) {
    const typedData: any = databaseData;

    if (databaseName === 'No results found') {
      continue;
    }

    results.push({
      database_name: databaseName,
      info_leak: typedData.InfoLeak || '',
      data: typedData.Data || []
    });
  }

  return results;
}

export async function getSearchResults(searchId: string): Promise<OSINTSearchResponse | null> {
  const { data, error } = await supabase
    .from('osint_searches')
    .select('*')
    .eq('id', searchId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching search results:', error);
    return null;
  }

  return data;
}

export async function getSearchHistory(dossierId?: string): Promise<OSINTSearchResponse[]> {
  let query = supabase
    .from('osint_searches')
    .select('*')
    .order('created_at', { ascending: false });

  if (dossierId) {
    query = query.eq('dossier_id', dossierId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching search history:', error);
    return [];
  }

  return data || [];
}

export async function confirmSearchResults(searchId: string): Promise<boolean> {
  const { error } = await supabase
    .from('osint_searches')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', searchId);

  return !error;
}

export interface ExtractedTarget {
  email?: string;
  phone?: string;
  name?: string;
  username?: string;
  password?: string;
  ip?: string;
  address?: string;
  social_media?: { platform: string; username: string; url?: string }[];
  raw_data: Record<string, any>;
}

export function extractTargetsFromResults(results: OSINTResult[]): ExtractedTarget[] {
  const targets: ExtractedTarget[] = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[\d+\-\(\)\s]{8,}$/;
  const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

  for (const result of results) {
    for (const record of result.data) {
      const target: ExtractedTarget = {
        raw_data: { ...record, source: result.database_name }
      };

      for (const [key, value] of Object.entries(record)) {
        if (!value || typeof value !== 'string') continue;

        const lowerKey = key.toLowerCase();
        const trimmedValue = value.trim();

        if (lowerKey.includes('email') || lowerKey.includes('mail')) {
          if (emailPattern.test(trimmedValue)) {
            target.email = trimmedValue;
          }
        } else if (lowerKey.includes('phone') || lowerKey.includes('tel') || lowerKey.includes('mobile')) {
          if (phonePattern.test(trimmedValue)) {
            target.phone = trimmedValue;
          }
        } else if (lowerKey.includes('name') || lowerKey === 'fullname' || lowerKey === 'full_name') {
          target.name = trimmedValue;
        } else if (lowerKey.includes('username') || lowerKey.includes('login') || lowerKey === 'nick') {
          target.username = trimmedValue;
        } else if (lowerKey.includes('password') || lowerKey.includes('pass')) {
          target.password = trimmedValue;
        } else if (lowerKey.includes('ip') || lowerKey === 'ip_address') {
          if (ipPattern.test(trimmedValue)) {
            target.ip = trimmedValue;
          }
        } else if (lowerKey.includes('address') || lowerKey.includes('location') || lowerKey.includes('city')) {
          target.address = (target.address ? target.address + ', ' : '') + trimmedValue;
        } else if (lowerKey.includes('telegram') || lowerKey.includes('vk') || lowerKey.includes('instagram') ||
                   lowerKey.includes('facebook') || lowerKey.includes('twitter')) {
          if (!target.social_media) {
            target.social_media = [];
          }
          target.social_media.push({
            platform: lowerKey,
            username: trimmedValue
          });
        }
      }

      if (Object.keys(target).length > 1) {
        targets.push(target);
      }
    }
  }

  return targets;
}
