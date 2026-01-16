import { supabase } from './supabase';

export interface PatternMatch {
  id: string;
  pattern_type: string;
  pattern_value: string;
  matching_targets: string[];
  match_count: number;
  confidence_score: number;
  metadata: Record<string, any>;
  first_seen: string;
  last_seen: string;
  is_anomaly: boolean;
  notes: string;
}

export async function detectUsernamePatterns(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id')
    .eq('user_id', user.id);

  if (!dossiers) return 0;

  const dossierIds = dossiers.map(d => d.id);

  const { data: socialMedia } = await supabase
    .from('social_media')
    .select('username, target_id, targets!inner(dossier_id)')
    .in('targets.dossier_id', dossierIds);

  if (!socialMedia) return 0;

  const usernameMap = new Map<string, string[]>();

  for (const social of socialMedia) {
    const username = social.username?.toLowerCase();
    if (!username) continue;

    if (!usernameMap.has(username)) {
      usernameMap.set(username, []);
    }
    if (!usernameMap.get(username)!.includes(social.target_id)) {
      usernameMap.get(username)!.push(social.target_id);
    }
  }

  let patternsCreated = 0;

  for (const [username, targets] of usernameMap.entries()) {
    if (targets.length > 1) {
      await savePattern({
        pattern_type: 'username_reuse',
        pattern_value: username,
        matching_targets: targets,
        match_count: targets.length,
        confidence_score: Math.min(100, 40 + (targets.length * 10)),
        metadata: {
          platforms: socialMedia
            .filter(s => s.username?.toLowerCase() === username)
            .map(s => s)
        },
        is_anomaly: targets.length > 3
      });
      patternsCreated++;
    }
  }

  return patternsCreated;
}

export async function detectEmailPatterns(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id')
    .eq('user_id', user.id);

  if (!dossiers) return 0;

  const dossierIds = dossiers.map(d => d.id);

  const { data: credentials } = await supabase
    .from('credentials')
    .select('email, target_id, targets!inner(dossier_id)')
    .in('targets.dossier_id', dossierIds);

  if (!credentials) return 0;

  const emailMap = new Map<string, string[]>();
  const domainMap = new Map<string, string[]>();

  for (const cred of credentials) {
    const email = cred.email?.toLowerCase();
    if (!email) continue;

    if (!emailMap.has(email)) {
      emailMap.set(email, []);
    }
    if (!emailMap.get(email)!.includes(cred.target_id)) {
      emailMap.get(email)!.push(cred.target_id);
    }

    const domain = email.split('@')[1];
    if (domain) {
      if (!domainMap.has(domain)) {
        domainMap.set(domain, []);
      }
      if (!domainMap.get(domain)!.includes(cred.target_id)) {
        domainMap.get(domain)!.push(cred.target_id);
      }
    }
  }

  let patternsCreated = 0;

  for (const [email, targets] of emailMap.entries()) {
    if (targets.length > 1) {
      await savePattern({
        pattern_type: 'email_pattern',
        pattern_value: email,
        matching_targets: targets,
        match_count: targets.length,
        confidence_score: Math.min(100, 50 + (targets.length * 10)),
        metadata: { type: 'exact_match' },
        is_anomaly: targets.length > 2
      });
      patternsCreated++;
    }
  }

  for (const [domain, targets] of domainMap.entries()) {
    if (targets.length > 3) {
      await savePattern({
        pattern_type: 'email_pattern',
        pattern_value: `@${domain}`,
        matching_targets: targets,
        match_count: targets.length,
        confidence_score: Math.min(100, 30 + (targets.length * 5)),
        metadata: { type: 'domain_match' },
        is_anomaly: false
      });
      patternsCreated++;
    }
  }

  return patternsCreated;
}

export async function detectPasswordPatterns(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id')
    .eq('user_id', user.id);

  if (!dossiers) return 0;

  const dossierIds = dossiers.map(d => d.id);

  const { data: credentials } = await supabase
    .from('credentials')
    .select('password_hash, target_id, targets!inner(dossier_id)')
    .in('targets.dossier_id', dossierIds);

  if (!credentials) return 0;

  const hashMap = new Map<string, string[]>();

  for (const cred of credentials) {
    const hash = cred.password_hash;
    if (!hash) continue;

    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    if (!hashMap.get(hash)!.includes(cred.target_id)) {
      hashMap.get(hash)!.push(cred.target_id);
    }
  }

  let patternsCreated = 0;

  for (const [hash, targets] of hashMap.entries()) {
    if (targets.length > 1) {
      await savePattern({
        pattern_type: 'password_pattern',
        pattern_value: hash.substring(0, 16) + '...',
        matching_targets: targets,
        match_count: targets.length,
        confidence_score: Math.min(100, 60 + (targets.length * 10)),
        metadata: { type: 'password_reuse', full_hash: hash },
        is_anomaly: targets.length > 2
      });
      patternsCreated++;
    }
  }

  return patternsCreated;
}

export async function detectIPRangePatterns(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id')
    .eq('user_id', user.id);

  if (!dossiers) return 0;

  const dossierIds = dossiers.map(d => d.id);

  const { data: networkData } = await supabase
    .from('network_data')
    .select('ip_address, target_id, targets!inner(dossier_id)')
    .in('targets.dossier_id', dossierIds);

  if (!networkData) return 0;

  const subnetMap = new Map<string, string[]>();

  for (const net of networkData) {
    const ip = net.ip_address;
    if (!ip) continue;

    const parts = ip.split('.');
    if (parts.length === 4) {
      const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
      if (!subnetMap.has(subnet)) {
        subnetMap.set(subnet, []);
      }
      if (!subnetMap.get(subnet)!.includes(net.target_id)) {
        subnetMap.get(subnet)!.push(net.target_id);
      }
    }
  }

  let patternsCreated = 0;

  for (const [subnet, targets] of subnetMap.entries()) {
    if (targets.length > 2) {
      await savePattern({
        pattern_type: 'ip_range',
        pattern_value: subnet,
        matching_targets: targets,
        match_count: targets.length,
        confidence_score: Math.min(100, 40 + (targets.length * 8)),
        metadata: { type: 'subnet_match' },
        is_anomaly: targets.length > 5
      });
      patternsCreated++;
    }
  }

  return patternsCreated;
}

async function savePattern(pattern: Omit<PatternMatch, 'id' | 'first_seen' | 'last_seen' | 'notes'>): Promise<boolean> {
  const existing = await supabase
    .from('pattern_matches')
    .select('id, matching_targets')
    .eq('pattern_type', pattern.pattern_type)
    .eq('pattern_value', pattern.pattern_value)
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase
      .from('pattern_matches')
      .update({
        matching_targets: pattern.matching_targets,
        match_count: pattern.match_count,
        confidence_score: pattern.confidence_score,
        metadata: pattern.metadata,
        is_anomaly: pattern.is_anomaly,
        last_seen: new Date().toISOString()
      })
      .eq('id', existing.data.id);

    return !error;
  }

  const { error } = await supabase
    .from('pattern_matches')
    .insert({
      ...pattern,
      notes: ''
    });

  return !error;
}

export async function runAllPatternDetection(): Promise<{
  usernames: number;
  emails: number;
  passwords: number;
  ipRanges: number;
  total: number;
}> {
  const usernames = await detectUsernamePatterns();
  const emails = await detectEmailPatterns();
  const passwords = await detectPasswordPatterns();
  const ipRanges = await detectIPRangePatterns();

  return {
    usernames,
    emails,
    passwords,
    ipRanges,
    total: usernames + emails + passwords + ipRanges
  };
}

export async function getPatternMatches(patternType?: string): Promise<PatternMatch[]> {
  let query = supabase
    .from('pattern_matches')
    .select('*')
    .order('confidence_score', { ascending: false });

  if (patternType) {
    query = query.eq('pattern_type', patternType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching patterns:', error);
    return [];
  }

  return data || [];
}

export async function getAnomalies(): Promise<PatternMatch[]> {
  const { data, error } = await supabase
    .from('pattern_matches')
    .select('*')
    .eq('is_anomaly', true)
    .order('confidence_score', { ascending: false });

  if (error) {
    console.error('Error fetching anomalies:', error);
    return [];
  }

  return data || [];
}

export async function deletePattern(patternId: string): Promise<boolean> {
  const { error } = await supabase
    .from('pattern_matches')
    .delete()
    .eq('id', patternId);

  return !error;
}
