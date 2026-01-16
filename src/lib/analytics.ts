import { supabase } from './supabase';

export interface DossierMetrics {
  targetCount: number;
  dataPoints: number;
  completenessScore: number;
  verificationRate: number;
  lastActivity: string | null;
  topSources: Array<{ source: string; count: number }>;
  dataByType: Record<string, number>;
}

export interface GlobalMetrics {
  totalDossiers: number;
  totalTargets: number;
  totalDataPoints: number;
  averageCompleteness: number;
  recentActivity: number;
  topCategories: Array<{ category: string; count: number }>;
  growthTrend: Array<{ date: string; targets: number }>;
}

export async function calculateDossierMetrics(dossierId: string): Promise<DossierMetrics> {
  const { data: targets } = await supabase
    .from('targets')
    .select('id, created_at')
    .eq('dossier_id', dossierId);

  const targetCount = targets?.length || 0;
  const targetIds = targets?.map(t => t.id) || [];

  let dataPoints = 0;
  const dataByType: Record<string, number> = {};
  const sources: Record<string, number> = {};
  let verifiedItems = 0;
  let totalVerifiableItems = 0;

  if (targetIds.length > 0) {
    const [addresses, phones, credentials, socialMedia, networkData, employment, media, notes] = await Promise.all([
      supabase.from('addresses').select('*').in('target_id', targetIds),
      supabase.from('phone_numbers').select('*').in('target_id', targetIds),
      supabase.from('credentials').select('*').in('target_id', targetIds),
      supabase.from('social_media').select('*').in('target_id', targetIds),
      supabase.from('network_data').select('*').in('target_id', targetIds),
      supabase.from('employment').select('*').in('target_id', targetIds),
      supabase.from('media_files').select('*').in('target_id', targetIds),
      supabase.from('intelligence_notes').select('*').in('target_id', targetIds)
    ]);

    if (addresses.data) {
      dataPoints += addresses.data.length;
      dataByType.addresses = addresses.data.length;
      verifiedItems += addresses.data.filter(a => a.verified).length;
      totalVerifiableItems += addresses.data.length;
    }

    if (phones.data) {
      dataPoints += phones.data.length;
      dataByType.phones = phones.data.length;
      verifiedItems += phones.data.filter(p => p.verified).length;
      totalVerifiableItems += phones.data.length;
      phones.data.forEach(p => {
        if (p.source) sources[p.source] = (sources[p.source] || 0) + 1;
      });
    }

    if (credentials.data) {
      dataPoints += credentials.data.length;
      dataByType.credentials = credentials.data.length;
      credentials.data.forEach(c => {
        if (c.breach_source) sources[c.breach_source] = (sources[c.breach_source] || 0) + 1;
      });
    }

    if (socialMedia.data) {
      dataPoints += socialMedia.data.length;
      dataByType.social_media = socialMedia.data.length;
    }

    if (networkData.data) {
      dataPoints += networkData.data.length;
      dataByType.network = networkData.data.length;
    }

    if (employment.data) {
      dataPoints += employment.data.length;
      dataByType.employment = employment.data.length;
      verifiedItems += employment.data.filter(e => e.verified).length;
      totalVerifiableItems += employment.data.length;
    }

    if (media.data) {
      dataPoints += media.data.length;
      dataByType.media = media.data.length;
      media.data.forEach(m => {
        if (m.source) sources[m.source] = (sources[m.source] || 0) + 1;
      });
    }

    if (notes.data) {
      dataPoints += notes.data.length;
      dataByType.notes = notes.data.length;
      notes.data.forEach(n => {
        if (n.source) sources[n.source] = (sources[n.source] || 0) + 1;
      });
    }
  }

  const topSources = Object.entries(sources)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const verificationRate = totalVerifiableItems > 0
    ? Math.round((verifiedItems / totalVerifiableItems) * 100)
    : 0;

  const completenessScore = calculateCompletenessScore(targetCount, dataByType);

  const lastActivity = targets && targets.length > 0
    ? targets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
    : null;

  await supabase
    .from('investigation_metrics')
    .insert({
      dossier_id: dossierId,
      metric_type: 'dossier_snapshot',
      metric_value: completenessScore,
      metric_data: {
        targetCount,
        dataPoints,
        verificationRate,
        dataByType
      }
    });

  return {
    targetCount,
    dataPoints,
    completenessScore,
    verificationRate,
    lastActivity,
    topSources,
    dataByType
  };
}

function calculateCompletenessScore(targetCount: number, dataByType: Record<string, number>): number {
  if (targetCount === 0) return 0;

  const expectedCategories = ['addresses', 'phones', 'credentials', 'social_media', 'network'];
  const filledCategories = expectedCategories.filter(cat => (dataByType[cat] || 0) > 0).length;

  const categoryScore = (filledCategories / expectedCategories.length) * 50;

  const avgDataPerTarget = Object.values(dataByType).reduce((a, b) => a + b, 0) / targetCount;
  const dataScore = Math.min(50, (avgDataPerTarget / 10) * 50);

  return Math.round(categoryScore + dataScore);
}

export async function calculateGlobalMetrics(): Promise<GlobalMetrics> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      totalDossiers: 0,
      totalTargets: 0,
      totalDataPoints: 0,
      averageCompleteness: 0,
      recentActivity: 0,
      topCategories: [],
      growthTrend: []
    };
  }

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id')
    .eq('user_id', user.id);

  const totalDossiers = dossiers?.length || 0;
  const dossierIds = dossiers?.map(d => d.id) || [];

  const { data: targets } = await supabase
    .from('targets')
    .select('id, created_at')
    .in('dossier_id', dossierIds);

  const totalTargets = targets?.length || 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentActivity = targets?.filter(t =>
    new Date(t.created_at) > thirtyDaysAgo
  ).length || 0;

  const growthTrend = calculateGrowthTrend(targets || []);

  let totalDataPoints = 0;
  const categories: Record<string, number> = {};

  if (targets && targets.length > 0) {
    const targetIds = targets.map(t => t.id);

    const [addresses, phones, credentials, socialMedia, networkData, notes] = await Promise.all([
      supabase.from('addresses').select('id').in('target_id', targetIds),
      supabase.from('phone_numbers').select('id').in('target_id', targetIds),
      supabase.from('credentials').select('id').in('target_id', targetIds),
      supabase.from('social_media').select('id').in('target_id', targetIds),
      supabase.from('network_data').select('id').in('target_id', targetIds),
      supabase.from('intelligence_notes').select('id').in('target_id', targetIds)
    ]);

    if (addresses.data) {
      totalDataPoints += addresses.data.length;
      categories.Addresses = addresses.data.length;
    }
    if (phones.data) {
      totalDataPoints += phones.data.length;
      categories.Phones = phones.data.length;
    }
    if (credentials.data) {
      totalDataPoints += credentials.data.length;
      categories.Credentials = credentials.data.length;
    }
    if (socialMedia.data) {
      totalDataPoints += socialMedia.data.length;
      categories['Social Media'] = socialMedia.data.length;
    }
    if (networkData.data) {
      totalDataPoints += networkData.data.length;
      categories.Network = networkData.data.length;
    }
    if (notes.data) {
      totalDataPoints += notes.data.length;
      categories.Notes = notes.data.length;
    }
  }

  const topCategories = Object.entries(categories)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const averageCompleteness = totalTargets > 0
    ? Math.round((totalDataPoints / totalTargets) * 5)
    : 0;

  await supabase
    .from('investigation_metrics')
    .insert({
      user_id: user.id,
      metric_type: 'global_snapshot',
      metric_value: totalTargets,
      metric_data: {
        totalDossiers,
        totalDataPoints,
        averageCompleteness,
        recentActivity
      }
    });

  return {
    totalDossiers,
    totalTargets,
    totalDataPoints,
    averageCompleteness,
    recentActivity,
    topCategories,
    growthTrend
  };
}

function calculateGrowthTrend(targets: Array<{ created_at: string }>): Array<{ date: string; targets: number }> {
  const last30Days = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const count = targets.filter(t => {
      const targetDate = new Date(t.created_at).toISOString().split('T')[0];
      return targetDate === dateStr;
    }).length;

    last30Days.push({ date: dateStr, targets: count });
  }

  return last30Days;
}

export async function getMetricsHistory(
  dossierId?: string,
  days: number = 30
): Promise<Array<{ date: string; value: number; type: string }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from('investigation_metrics')
    .select('*')
    .gte('calculated_at', startDate.toISOString())
    .order('calculated_at', { ascending: true });

  if (dossierId) {
    query = query.eq('dossier_id', dossierId);
  }

  const { data } = await query;

  if (!data) return [];

  return data.map(m => ({
    date: m.calculated_at.split('T')[0],
    value: m.metric_value,
    type: m.metric_type
  }));
}

export async function getDataQualityScore(dossierId: string): Promise<number> {
  const metrics = await calculateDossierMetrics(dossierId);

  const weights = {
    completeness: 0.4,
    verification: 0.3,
    dataVolume: 0.2,
    sources: 0.1
  };

  const completenessScore = metrics.completenessScore;
  const verificationScore = metrics.verificationRate;
  const volumeScore = Math.min(100, (metrics.dataPoints / metrics.targetCount) * 10);
  const sourceScore = Math.min(100, metrics.topSources.length * 20);

  const qualityScore =
    completenessScore * weights.completeness +
    verificationScore * weights.verification +
    volumeScore * weights.dataVolume +
    sourceScore * weights.sources;

  return Math.round(qualityScore);
}
