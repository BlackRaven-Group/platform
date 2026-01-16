import { supabase } from './supabase';

export interface EnrichmentJob {
  id: string;
  job_type: string;
  target_id: string | null;
  input_data: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_data: Record<string, any>;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  priority: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export async function queueEnrichmentJob(
  jobType: string,
  inputData: Record<string, any>,
  targetId?: string,
  priority: number = 5
): Promise<string | null> {
  const { data, error } = await supabase
    .from('data_enrichment_jobs')
    .insert({
      job_type: jobType,
      target_id: targetId || null,
      input_data: inputData,
      priority,
      status: 'pending'
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error queuing enrichment job:', error);
    return null;
  }

  return data.id;
}

export async function processEnrichmentJobs(): Promise<number> {
  const { data: pendingJobs } = await supabase
    .from('data_enrichment_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(5);

  if (!pendingJobs || pendingJobs.length === 0) return 0;

  let processed = 0;

  for (const job of pendingJobs) {
    await supabase
      .from('data_enrichment_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', job.id);

    try {
      let result: Record<string, any> = {};

      switch (job.job_type) {
        case 'phone_lookup':
          result = await enrichPhoneNumber(job.input_data.phone);
          break;
        case 'email_validation':
          result = await enrichEmail(job.input_data.email);
          break;
        case 'ip_whois':
          result = await enrichIP(job.input_data.ip);
          break;
        case 'breach_check':
          result = await checkBreach(job.input_data.email);
          break;
        case 'social_media_discovery':
          result = await discoverSocialMedia(job.input_data.username);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      await supabase
        .from('data_enrichment_jobs')
        .update({
          status: 'completed',
          result_data: result,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (job.target_id) {
        await applyEnrichmentResults(job.target_id, job.job_type, result);
      }

      processed++;
    } catch (error: any) {
      const newRetryCount = job.retry_count + 1;
      const shouldRetry = newRetryCount < job.max_retries;

      await supabase
        .from('data_enrichment_jobs')
        .update({
          status: shouldRetry ? 'pending' : 'failed',
          error_message: error.message,
          retry_count: newRetryCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
    }
  }

  return processed;
}

async function enrichPhoneNumber(phone: string): Promise<Record<string, any>> {
  const cleaned = phone.replace(/\D/g, '');

  let countryCode = '';
  let carrier = 'Unknown';
  let numberType = 'unknown';

  if (cleaned.startsWith('1') && cleaned.length === 11) {
    countryCode = '+1';
    numberType = 'mobile';
  } else if (cleaned.startsWith('7') && cleaned.length === 11) {
    countryCode = '+7';
    numberType = 'mobile';
  } else if (cleaned.startsWith('44')) {
    countryCode = '+44';
    numberType = 'mobile';
  } else if (cleaned.length === 10) {
    countryCode = '+1';
    numberType = 'mobile';
  }

  return {
    phone_number: phone,
    country_code: countryCode,
    carrier,
    number_type: numberType,
    verified: false,
    enriched_at: new Date().toISOString()
  };
}

async function enrichEmail(email: string): Promise<Record<string, any>> {
  const domain = email.split('@')[1];
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const commonProviders: Record<string, string> = {
    'gmail.com': 'Google',
    'yahoo.com': 'Yahoo',
    'outlook.com': 'Microsoft',
    'hotmail.com': 'Microsoft',
    'protonmail.com': 'ProtonMail',
    'icloud.com': 'Apple'
  };

  const provider = commonProviders[domain] || 'Unknown';

  return {
    email,
    domain,
    provider,
    is_valid: isValid,
    is_disposable: false,
    enriched_at: new Date().toISOString()
  };
}

async function enrichIP(ip: string): Promise<Record<string, any>> {
  const octets = ip.split('.').map(Number);

  let ipType = 'public';
  let location = 'Unknown';

  if (octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)) {
    ipType = 'private';
  } else if (octets[0] === 127) {
    ipType = 'loopback';
  }

  return {
    ip_address: ip,
    ip_type: ipType,
    location,
    isp: 'Unknown',
    asn: '',
    enriched_at: new Date().toISOString()
  };
}

async function checkBreach(email: string): Promise<Record<string, any>> {
  return {
    email,
    breaches_found: 0,
    breach_sources: [],
    last_checked: new Date().toISOString()
  };
}

async function discoverSocialMedia(username: string): Promise<Record<string, any>> {
  const platforms = [
    'twitter', 'instagram', 'facebook', 'linkedin',
    'github', 'reddit', 'tiktok', 'youtube'
  ];

  const discovered: Array<{ platform: string; url: string; likely_exists: boolean }> = [];

  for (const platform of platforms) {
    discovered.push({
      platform,
      url: `https://${platform}.com/${username}`,
      likely_exists: Math.random() > 0.7
    });
  }

  return {
    username,
    platforms_checked: platforms.length,
    discovered,
    checked_at: new Date().toISOString()
  };
}

async function applyEnrichmentResults(
  targetId: string,
  jobType: string,
  results: Record<string, any>
): Promise<void> {
  switch (jobType) {
    case 'phone_lookup':
      if (results.phone_number) {
        const existing = await supabase
          .from('phone_numbers')
          .select('id')
          .eq('target_id', targetId)
          .eq('phone_number', results.phone_number)
          .maybeSingle();

        if (existing.data) {
          await supabase
            .from('phone_numbers')
            .update({
              country_code: results.country_code,
              carrier: results.carrier,
              number_type: results.number_type
            })
            .eq('id', existing.data.id);
        }
      }
      break;

    case 'email_validation':
      if (results.email) {
        await supabase
          .from('credentials')
          .update({
            notes: `Provider: ${results.provider}, Valid: ${results.is_valid}`
          })
          .eq('target_id', targetId)
          .eq('email', results.email);
      }
      break;

    case 'ip_whois':
      if (results.ip_address) {
        const existing = await supabase
          .from('network_data')
          .select('id')
          .eq('target_id', targetId)
          .eq('ip_address', results.ip_address)
          .maybeSingle();

        if (existing.data) {
          await supabase
            .from('network_data')
            .update({
              ip_type: results.ip_type,
              location: results.location,
              isp: results.isp
            })
            .eq('id', existing.data.id);
        }
      }
      break;

    case 'social_media_discovery':
      if (results.discovered) {
        for (const platform of results.discovered) {
          if (platform.likely_exists) {
            const existing = await supabase
              .from('social_media')
              .select('id')
              .eq('target_id', targetId)
              .eq('platform', platform.platform)
              .eq('username', results.username)
              .maybeSingle();

            if (!existing.data) {
              await supabase
                .from('social_media')
                .insert({
                  target_id: targetId,
                  platform: platform.platform,
                  username: results.username,
                  profile_url: platform.url,
                  status: 'unverified'
                });
            }
          }
        }
      }
      break;
  }
}

export async function getEnrichmentJobs(targetId?: string): Promise<EnrichmentJob[]> {
  let query = supabase
    .from('data_enrichment_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (targetId) {
    query = query.eq('target_id', targetId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching enrichment jobs:', error);
    return [];
  }

  return data || [];
}

export async function retryEnrichmentJob(jobId: string): Promise<boolean> {
  const { error } = await supabase
    .from('data_enrichment_jobs')
    .update({
      status: 'pending',
      retry_count: 0,
      error_message: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .eq('status', 'failed');

  return !error;
}

export async function autoEnrichTarget(targetId: string): Promise<number> {
  let jobsQueued = 0;

  const { data: phones } = await supabase
    .from('phone_numbers')
    .select('phone_number')
    .eq('target_id', targetId)
    .is('carrier', null);

  if (phones) {
    for (const phone of phones) {
      await queueEnrichmentJob('phone_lookup', { phone: phone.phone_number }, targetId, 7);
      jobsQueued++;
    }
  }

  const { data: credentials } = await supabase
    .from('credentials')
    .select('email')
    .eq('target_id', targetId)
    .not('email', 'is', null);

  if (credentials) {
    for (const cred of credentials) {
      await queueEnrichmentJob('email_validation', { email: cred.email }, targetId, 6);
      await queueEnrichmentJob('breach_check', { email: cred.email }, targetId, 8);
      jobsQueued += 2;
    }
  }

  const { data: networkData } = await supabase
    .from('network_data')
    .select('ip_address')
    .eq('target_id', targetId)
    .is('isp', null);

  if (networkData) {
    for (const net of networkData) {
      await queueEnrichmentJob('ip_whois', { ip: net.ip_address }, targetId, 5);
      jobsQueued++;
    }
  }

  const { data: socialMedia } = await supabase
    .from('social_media')
    .select('username')
    .eq('target_id', targetId)
    .limit(1);

  if (socialMedia && socialMedia.length > 0) {
    await queueEnrichmentJob('social_media_discovery', { username: socialMedia[0].username }, targetId, 4);
    jobsQueued++;
  }

  return jobsQueued;
}
