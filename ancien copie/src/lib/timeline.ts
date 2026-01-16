import { supabase } from './supabase';

export interface TimelineEvent {
  id: string;
  target_id: string;
  event_type: string;
  event_date: string;
  event_title: string;
  event_description: string;
  source_table: string;
  source_id: string | null;
  metadata: Record<string, any>;
  importance: 'low' | 'normal' | 'high' | 'critical';
  created_at: string;
}

export async function generateTimelineForTarget(targetId: string): Promise<number> {
  let eventCount = 0;

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('target_id', targetId);

  if (addresses) {
    for (const addr of addresses) {
      if (addr.last_seen) {
        await createTimelineEvent({
          target_id: targetId,
          event_type: 'address',
          event_date: addr.last_seen,
          event_title: `Location: ${addr.city || 'Unknown'}`,
          event_description: `Last seen at ${addr.street_address}, ${addr.city}`,
          source_table: 'addresses',
          source_id: addr.id,
          metadata: {
            address_type: addr.address_type,
            verified: addr.verified,
            country: addr.country
          },
          importance: addr.verified ? 'high' : 'normal'
        });
        eventCount++;
      }
    }
  }

  const { data: socialMedia } = await supabase
    .from('social_media')
    .select('*')
    .eq('target_id', targetId);

  if (socialMedia) {
    for (const social of socialMedia) {
      if (social.last_activity) {
        await createTimelineEvent({
          target_id: targetId,
          event_type: 'social_media',
          event_date: social.last_activity,
          event_title: `${social.platform} Activity`,
          event_description: `Active on ${social.platform} (@${social.username})`,
          source_table: 'social_media',
          source_id: social.id,
          metadata: {
            platform: social.platform,
            username: social.username,
            status: social.status
          },
          importance: 'normal'
        });
        eventCount++;
      }
    }
  }

  const { data: employment } = await supabase
    .from('employment')
    .select('*')
    .eq('target_id', targetId);

  if (employment) {
    for (const emp of employment) {
      if (emp.start_date) {
        await createTimelineEvent({
          target_id: targetId,
          event_type: 'employment',
          event_date: emp.start_date,
          event_title: `Started at ${emp.organization}`,
          event_description: `${emp.position} at ${emp.organization}`,
          source_table: 'employment',
          source_id: emp.id,
          metadata: {
            record_type: emp.record_type,
            position: emp.position,
            current: emp.current
          },
          importance: emp.verified ? 'high' : 'normal'
        });
        eventCount++;
      }

      if (emp.end_date && !emp.current) {
        await createTimelineEvent({
          target_id: targetId,
          event_type: 'employment',
          event_date: emp.end_date,
          event_title: `Left ${emp.organization}`,
          event_description: `Ended ${emp.position} position`,
          source_table: 'employment',
          source_id: emp.id,
          metadata: {
            record_type: emp.record_type,
            position: emp.position
          },
          importance: 'normal'
        });
        eventCount++;
      }
    }
  }

  const { data: credentials } = await supabase
    .from('credentials')
    .select('*')
    .eq('target_id', targetId);

  if (credentials) {
    for (const cred of credentials) {
      if (cred.breach_date) {
        await createTimelineEvent({
          target_id: targetId,
          event_type: 'credential',
          event_date: cred.breach_date,
          event_title: `Data Breach: ${cred.service}`,
          event_description: `Credentials exposed in ${cred.breach_source}`,
          source_table: 'credentials',
          source_id: cred.id,
          metadata: {
            service: cred.service,
            breach_source: cred.breach_source,
            email: cred.email
          },
          importance: 'critical'
        });
        eventCount++;
      }
    }
  }

  const { data: media } = await supabase
    .from('media_files')
    .select('*')
    .eq('target_id', targetId);

  if (media) {
    for (const m of media) {
      if (m.captured_date) {
        await createTimelineEvent({
          target_id: targetId,
          event_type: 'media',
          event_date: m.captured_date,
          event_title: `Media: ${m.title}`,
          event_description: m.description || `${m.file_type} captured`,
          source_table: 'media_files',
          source_id: m.id,
          metadata: {
            file_type: m.file_type,
            source: m.source,
            tags: m.tags
          },
          importance: 'normal'
        });
        eventCount++;
      }
    }
  }

  const { data: networkData } = await supabase
    .from('network_data')
    .select('*')
    .eq('target_id', targetId);

  if (networkData) {
    for (const net of networkData) {
      if (net.first_seen) {
        await createTimelineEvent({
          target_id: targetId,
          event_type: 'network',
          event_date: net.first_seen,
          event_title: `Network: ${net.ip_address}`,
          event_description: `First seen on IP ${net.ip_address}`,
          source_table: 'network_data',
          source_id: net.id,
          metadata: {
            ip_address: net.ip_address,
            ip_type: net.ip_type,
            isp: net.isp,
            location: net.location
          },
          importance: 'normal'
        });
        eventCount++;
      }
    }
  }

  const { data: phoneNumbers } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('target_id', targetId);

  if (phoneNumbers) {
    for (const phone of phoneNumbers) {
      if (phone.last_seen) {
        await createTimelineEvent({
          target_id: targetId,
          event_type: 'phone',
          event_date: phone.last_seen,
          event_title: `Phone: ${phone.phone_number}`,
          event_description: `Last active on ${phone.phone_number}`,
          source_table: 'phone_numbers',
          source_id: phone.id,
          metadata: {
            number_type: phone.number_type,
            carrier: phone.carrier,
            verified: phone.verified
          },
          importance: phone.verified ? 'high' : 'normal'
        });
        eventCount++;
      }
    }
  }

  return eventCount;
}

async function createTimelineEvent(event: Omit<TimelineEvent, 'id' | 'created_at'>): Promise<boolean> {
  const existing = await supabase
    .from('timeline_events')
    .select('id')
    .eq('target_id', event.target_id)
    .eq('source_table', event.source_table)
    .eq('source_id', event.source_id || '')
    .eq('event_date', event.event_date)
    .maybeSingle();

  if (existing.data) {
    return true;
  }

  const { error } = await supabase
    .from('timeline_events')
    .insert(event);

  return !error;
}

export async function getTargetTimeline(targetId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('target_id', targetId)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Error fetching timeline:', error);
    return [];
  }

  return data || [];
}

export async function deleteTimelineEvent(eventId: string): Promise<boolean> {
  const { error } = await supabase
    .from('timeline_events')
    .delete()
    .eq('id', eventId);

  return !error;
}

export async function regenerateTimeline(targetId: string): Promise<number> {
  await supabase
    .from('timeline_events')
    .delete()
    .eq('target_id', targetId);

  return generateTimelineForTarget(targetId);
}

export interface TimelineStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByImportance: Record<string, number>;
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
}

export async function getTimelineStats(targetId: string): Promise<TimelineStats> {
  const events = await getTargetTimeline(targetId);

  const stats: TimelineStats = {
    totalEvents: events.length,
    eventsByType: {},
    eventsByImportance: {},
    dateRange: {
      earliest: null,
      latest: null
    }
  };

  for (const event of events) {
    stats.eventsByType[event.event_type] = (stats.eventsByType[event.event_type] || 0) + 1;
    stats.eventsByImportance[event.importance] = (stats.eventsByImportance[event.importance] || 0) + 1;

    if (!stats.dateRange.earliest || event.event_date < stats.dateRange.earliest) {
      stats.dateRange.earliest = event.event_date;
    }
    if (!stats.dateRange.latest || event.event_date > stats.dateRange.latest) {
      stats.dateRange.latest = event.event_date;
    }
  }

  return stats;
}
