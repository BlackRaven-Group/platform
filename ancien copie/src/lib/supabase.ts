import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Dossier = {
  id: string;
  title: string;
  description: string;
  code_name: string;
  access_code: string;
  failed_attempts: number;
  is_locked: boolean;
  status: string;
  classification: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Target = {
  id: string;
  dossier_id: string;
  code_name: string;
  first_name: string;
  last_name: string;
  aliases: string[];
  date_of_birth: string | null;
  gender: string;
  nationality: string;
  profile_image_url: string | null;
  bio: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Address = {
  id: string;
  target_id: string;
  address_type: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  last_seen: string | null;
  notes: string;
  created_at: string;
};

export type SocialMedia = {
  id: string;
  target_id: string;
  platform: string;
  username: string;
  profile_url: string;
  follower_count: number;
  status: string;
  last_activity: string | null;
  notes: string;
  created_at: string;
};

export type Credential = {
  id: string;
  target_id: string;
  service: string;
  username: string;
  email: string;
  password_encrypted: string;
  password_hash: string;
  breach_source: string;
  breach_date: string | null;
  status: string;
  notes: string;
  created_at: string;
};

export type NetworkData = {
  id: string;
  target_id: string;
  ip_address: string;
  ip_type: string;
  isp: string;
  location: string;
  first_seen: string;
  last_seen: string;
  confidence: string;
  notes: string;
  created_at: string;
};

export type Connection = {
  id: string;
  target_id: string;
  connected_target_id: string | null;
  connection_name: string;
  relationship_type: string;
  relationship_details: string;
  strength: number;
  verified: boolean;
  notes: string;
  created_at: string;
};

export type Employment = {
  id: string;
  target_id: string;
  record_type: string;
  organization: string;
  position: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  current: boolean;
  verified: boolean;
  notes: string;
  created_at: string;
};

export type MediaFile = {
  id: string;
  target_id: string;
  file_type: string;
  file_url: string;
  title: string;
  description: string;
  captured_date: string | null;
  source: string;
  tags: string[];
  created_at: string;
};

export type IntelligenceNote = {
  id: string;
  dossier_id: string;
  target_id: string | null;
  category: string;
  priority: string;
  content: string;
  source: string;
  created_by: string | null;
  created_at: string;
};

export type PhoneNumber = {
  id: string;
  target_id: string;
  phone_number: string;
  number_type: string;
  country_code: string;
  carrier: string;
  verified: boolean;
  status: string;
  strength: number;
  last_seen: string | null;
  source: string;
  notes: string;
  created_at: string;
};
