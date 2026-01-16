import { supabase } from './supabase';

export interface TargetCorrelation {
  id: string;
  target_a_id: string;
  target_b_id: string;
  correlation_type: string;
  matching_fields: string[];
  confidence_score: number;
  shared_data: Record<string, any>;
  verified: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CorrelationResult {
  targetId: string;
  correlationType: string;
  matchingFields: string[];
  confidenceScore: number;
  sharedData: Record<string, any>;
}

export async function findTargetCorrelations(targetId: string): Promise<CorrelationResult[]> {
  const { data: target } = await supabase
    .from('targets')
    .select('*, credentials(*), social_media(*), network_data(*), addresses(*), phone_numbers(*)')
    .eq('id', targetId)
    .maybeSingle();

  if (!target) return [];

  const { data: dossier } = await supabase
    .from('dossiers')
    .select('user_id')
    .eq('id', target.dossier_id)
    .maybeSingle();

  if (!dossier) return [];

  const { data: allTargets } = await supabase
    .from('targets')
    .select('*, credentials(*), social_media(*), network_data(*), addresses(*), phone_numbers(*)')
    .neq('id', targetId);

  if (!allTargets) return [];

  const userTargets = [];
  for (const t of allTargets) {
    const { data: d } = await supabase
      .from('dossiers')
      .select('user_id')
      .eq('id', t.dossier_id)
      .maybeSingle();

    if (d?.user_id === dossier.user_id) {
      userTargets.push(t);
    }
  }

  const correlations: CorrelationResult[] = [];

  for (const otherTarget of userTargets) {
    const result = compareTargets(target, otherTarget);
    if (result.confidenceScore > 0) {
      correlations.push({
        targetId: otherTarget.id,
        correlationType: result.correlationType,
        matchingFields: result.matchingFields,
        confidenceScore: result.confidenceScore,
        sharedData: result.sharedData
      });
    }
  }

  return correlations;
}

function compareTargets(target1: any, target2: any): CorrelationResult {
  const matchingFields: string[] = [];
  const sharedData: Record<string, any> = {};
  let confidenceScore = 0;
  let correlationType = 'unknown';

  const emails1 = target1.credentials?.map((c: any) => c.email?.toLowerCase()).filter(Boolean) || [];
  const emails2 = target2.credentials?.map((c: any) => c.email?.toLowerCase()).filter(Boolean) || [];
  const emailMatches = emails1.filter((e: string) => emails2.includes(e));

  if (emailMatches.length > 0) {
    matchingFields.push('email');
    sharedData.emails = emailMatches;
    confidenceScore += 30 * emailMatches.length;
    correlationType = 'email';
  }

  const phones1 = target1.phone_numbers?.map((p: any) => p.phone_number?.replace(/\D/g, '')).filter(Boolean) || [];
  const phones2 = target2.phone_numbers?.map((p: any) => p.phone_number?.replace(/\D/g, '')).filter(Boolean) || [];
  const phoneMatches = phones1.filter((p: string) => phones2.includes(p));

  if (phoneMatches.length > 0) {
    matchingFields.push('phone');
    sharedData.phones = phoneMatches;
    confidenceScore += 25 * phoneMatches.length;
    if (correlationType === 'unknown') correlationType = 'phone';
  }

  const usernames1 = target1.social_media?.map((s: any) => s.username?.toLowerCase()).filter(Boolean) || [];
  const usernames2 = target2.social_media?.map((s: any) => s.username?.toLowerCase()).filter(Boolean) || [];
  const usernameMatches = usernames1.filter((u: string) => usernames2.includes(u));

  if (usernameMatches.length > 0) {
    matchingFields.push('username');
    sharedData.usernames = usernameMatches;
    confidenceScore += 20 * usernameMatches.length;
    if (correlationType === 'unknown') correlationType = 'username';
  }

  const ips1 = target1.network_data?.map((n: any) => n.ip_address).filter(Boolean) || [];
  const ips2 = target2.network_data?.map((n: any) => n.ip_address).filter(Boolean) || [];
  const ipMatches = ips1.filter((ip: string) => ips2.includes(ip));

  if (ipMatches.length > 0) {
    matchingFields.push('ip');
    sharedData.ips = ipMatches;
    confidenceScore += 15 * ipMatches.length;
    if (correlationType === 'unknown') correlationType = 'ip';
  }

  const addresses1 = target1.addresses?.map((a: any) =>
    `${a.street_address} ${a.city}`.toLowerCase().trim()
  ).filter(Boolean) || [];
  const addresses2 = target2.addresses?.map((a: any) =>
    `${a.street_address} ${a.city}`.toLowerCase().trim()
  ).filter(Boolean) || [];
  const addressMatches = addresses1.filter((a: string) => addresses2.includes(a));

  if (addressMatches.length > 0) {
    matchingFields.push('address');
    sharedData.addresses = addressMatches;
    confidenceScore += 20 * addressMatches.length;
    if (correlationType === 'unknown') correlationType = 'address';
  }

  if (matchingFields.length > 1) {
    correlationType = 'network';
    confidenceScore = Math.min(100, confidenceScore);
  }

  return {
    targetId: target2.id,
    correlationType,
    matchingFields,
    confidenceScore: Math.min(100, confidenceScore),
    sharedData
  };
}

export async function saveCorrelation(
  targetAId: string,
  targetBId: string,
  result: CorrelationResult
): Promise<boolean> {
  const existingCheck = await supabase
    .from('target_correlations')
    .select('id')
    .or(`and(target_a_id.eq.${targetAId},target_b_id.eq.${targetBId}),and(target_a_id.eq.${targetBId},target_b_id.eq.${targetAId})`)
    .maybeSingle();

  if (existingCheck.data) {
    const { error } = await supabase
      .from('target_correlations')
      .update({
        correlation_type: result.correlationType,
        matching_fields: result.matchingFields,
        confidence_score: result.confidenceScore,
        shared_data: result.sharedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingCheck.data.id);

    return !error;
  }

  const { error } = await supabase
    .from('target_correlations')
    .insert({
      target_a_id: targetAId,
      target_b_id: targetBId,
      correlation_type: result.correlationType,
      matching_fields: result.matchingFields,
      confidence_score: result.confidenceScore,
      shared_data: result.sharedData
    });

  return !error;
}

export async function runCorrelationAnalysis(targetId: string): Promise<number> {
  const correlations = await findTargetCorrelations(targetId);

  let savedCount = 0;
  for (const correlation of correlations) {
    const success = await saveCorrelation(targetId, correlation.targetId, correlation);
    if (success) savedCount++;
  }

  return savedCount;
}

export async function getTargetCorrelations(targetId: string): Promise<TargetCorrelation[]> {
  const { data, error } = await supabase
    .from('target_correlations')
    .select('*')
    .or(`target_a_id.eq.${targetId},target_b_id.eq.${targetId}`)
    .order('confidence_score', { ascending: false });

  if (error) {
    console.error('Error fetching correlations:', error);
    return [];
  }

  return data || [];
}

export async function deleteCorrelation(correlationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('target_correlations')
    .delete()
    .eq('id', correlationId);

  return !error;
}

export async function verifyCorrelation(correlationId: string, verified: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('target_correlations')
    .update({
      verified,
      updated_at: new Date().toISOString()
    })
    .eq('id', correlationId);

  return !error;
}
