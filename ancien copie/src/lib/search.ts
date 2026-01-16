import { supabase } from './supabase';

export interface SearchResult {
  type: 'dossier' | 'target' | 'credential' | 'address' | 'social_media' | 'note' | 'phone';
  id: string;
  title: string;
  subtitle: string;
  preview: string;
  metadata: Record<string, any>;
  relevance: number;
}

export interface SearchFilters {
  types?: string[];
  dossierId?: string;
  dateFrom?: string;
  dateTo?: string;
  verified?: boolean;
  status?: string;
}

export async function globalSearch(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: userDossiers } = await supabase
    .from('dossiers')
    .select('id')
    .eq('user_id', user.id);

  if (!userDossiers) return [];
  const dossierIds = userDossiers.map(d => d.id);

  if (!filters?.types || filters.types.includes('dossier')) {
    let dossierQuery = supabase
      .from('dossiers')
      .select('*')
      .eq('user_id', user.id);

    if (filters?.dossierId) {
      dossierQuery = dossierQuery.eq('id', filters.dossierId);
    }

    const { data: dossiers } = await dossierQuery;

    if (dossiers) {
      for (const dossier of dossiers) {
        const titleMatch = dossier.title.toLowerCase().includes(lowerQuery);
        const descMatch = dossier.description?.toLowerCase().includes(lowerQuery);
        const codeMatch = dossier.code_name.toLowerCase().includes(lowerQuery);

        if (titleMatch || descMatch || codeMatch) {
          results.push({
            type: 'dossier',
            id: dossier.id,
            title: dossier.title,
            subtitle: dossier.code_name,
            preview: dossier.description,
            metadata: { classification: dossier.classification, status: dossier.status },
            relevance: titleMatch ? 100 : (codeMatch ? 80 : 60)
          });
        }
      }
    }
  }

  if (!filters?.types || filters.types.includes('target')) {
    let targetQuery = supabase
      .from('targets')
      .select('*, dossiers!inner(title)')
      .in('dossier_id', dossierIds);

    if (filters?.dossierId) {
      targetQuery = targetQuery.eq('dossier_id', filters.dossierId);
    }

    const { data: targets } = await targetQuery;

    if (targets) {
      for (const target of targets) {
        const firstNameMatch = target.first_name.toLowerCase().includes(lowerQuery);
        const lastNameMatch = target.last_name.toLowerCase().includes(lowerQuery);
        const codeMatch = target.code_name.toLowerCase().includes(lowerQuery);
        const aliasMatch = target.aliases?.some((a: string) => a.toLowerCase().includes(lowerQuery));

        if (firstNameMatch || lastNameMatch || codeMatch || aliasMatch) {
          const displayName = target.first_name !== 'ND' && target.last_name !== 'ND'
            ? `${target.first_name} ${target.last_name}`
            : target.code_name;

          results.push({
            type: 'target',
            id: target.id,
            title: displayName,
            subtitle: target.code_name,
            preview: target.bio || 'No bio available',
            metadata: { dossier: target.dossiers.title, status: target.status },
            relevance: (firstNameMatch || lastNameMatch) ? 95 : (codeMatch ? 85 : 70)
          });
        }
      }
    }
  }

  if (!filters?.types || filters.types.includes('credential')) {
    const { data: credentials } = await supabase
      .from('credentials')
      .select('*, targets!inner(id, first_name, last_name, code_name, dossier_id)')
      .in('targets.dossier_id', dossierIds);

    if (credentials) {
      for (const cred of credentials) {
        const emailMatch = cred.email?.toLowerCase().includes(lowerQuery);
        const usernameMatch = cred.username?.toLowerCase().includes(lowerQuery);
        const serviceMatch = cred.service?.toLowerCase().includes(lowerQuery);

        if (emailMatch || usernameMatch || serviceMatch) {
          results.push({
            type: 'credential',
            id: cred.id,
            title: cred.email || cred.username,
            subtitle: `${cred.service} - ${cred.targets.code_name}`,
            preview: cred.breach_source || 'No breach data',
            metadata: { status: cred.status, targetId: cred.target_id },
            relevance: emailMatch ? 90 : 75
          });
        }
      }
    }
  }

  if (!filters?.types || filters.types.includes('phone')) {
    const { data: phones } = await supabase
      .from('phone_numbers')
      .select('*, targets!inner(id, first_name, last_name, code_name, dossier_id)')
      .in('targets.dossier_id', dossierIds);

    if (phones) {
      for (const phone of phones) {
        const phoneMatch = phone.phone_number?.includes(query);

        if (phoneMatch) {
          results.push({
            type: 'phone',
            id: phone.id,
            title: phone.phone_number,
            subtitle: `${phone.number_type} - ${phone.targets.code_name}`,
            preview: `Carrier: ${phone.carrier || 'Unknown'}`,
            metadata: { verified: phone.verified, targetId: phone.target_id },
            relevance: 85
          });
        }
      }
    }
  }

  if (!filters?.types || filters.types.includes('social_media')) {
    const { data: socialMedia } = await supabase
      .from('social_media')
      .select('*, targets!inner(id, first_name, last_name, code_name, dossier_id)')
      .in('targets.dossier_id', dossierIds);

    if (socialMedia) {
      for (const social of socialMedia) {
        const usernameMatch = social.username?.toLowerCase().includes(lowerQuery);
        const platformMatch = social.platform?.toLowerCase().includes(lowerQuery);

        if (usernameMatch || platformMatch) {
          results.push({
            type: 'social_media',
            id: social.id,
            title: `@${social.username}`,
            subtitle: `${social.platform} - ${social.targets.code_name}`,
            preview: social.profile_url || '',
            metadata: { status: social.status, targetId: social.target_id },
            relevance: usernameMatch ? 88 : 70
          });
        }
      }
    }
  }

  if (!filters?.types || filters.types.includes('address')) {
    const { data: addresses } = await supabase
      .from('addresses')
      .select('*, targets!inner(id, first_name, last_name, code_name, dossier_id)')
      .in('targets.dossier_id', dossierIds);

    if (addresses) {
      for (const addr of addresses) {
        const streetMatch = addr.street_address?.toLowerCase().includes(lowerQuery);
        const cityMatch = addr.city?.toLowerCase().includes(lowerQuery);
        const countryMatch = addr.country?.toLowerCase().includes(lowerQuery);

        if (streetMatch || cityMatch || countryMatch) {
          results.push({
            type: 'address',
            id: addr.id,
            title: addr.street_address,
            subtitle: `${addr.city}, ${addr.country} - ${addr.targets.code_name}`,
            preview: addr.notes || '',
            metadata: { verified: addr.verified, targetId: addr.target_id },
            relevance: streetMatch ? 85 : 70
          });
        }
      }
    }
  }

  if (!filters?.types || filters.types.includes('note')) {
    const { data: notes } = await supabase
      .from('intelligence_notes')
      .select('*, dossiers!inner(title), targets(id, first_name, last_name, code_name)')
      .in('dossier_id', dossierIds);

    if (notes) {
      for (const note of notes) {
        const contentMatch = note.content?.toLowerCase().includes(lowerQuery);
        const sourceMatch = note.source?.toLowerCase().includes(lowerQuery);

        if (contentMatch || sourceMatch) {
          const targetName = note.targets
            ? (note.targets.first_name !== 'ND' ? `${note.targets.first_name} ${note.targets.last_name}` : note.targets.code_name)
            : 'General';

          results.push({
            type: 'note',
            id: note.id,
            title: `${note.category} note`,
            subtitle: `${targetName} - ${note.dossiers.title}`,
            preview: note.content.substring(0, 100),
            metadata: { priority: note.priority, targetId: note.target_id },
            relevance: 75
          });
        }
      }
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance);
}

export async function saveSearch(query: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('investigation_metrics')
    .insert({
      user_id: user.id,
      metric_type: 'search_query',
      metric_value: 1,
      metric_data: { query }
    });

  return !error;
}

export async function getRecentSearches(limit: number = 10): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('investigation_metrics')
    .select('metric_data')
    .eq('user_id', user.id)
    .eq('metric_type', 'search_query')
    .order('calculated_at', { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map(d => d.metric_data?.query).filter(Boolean);
}
