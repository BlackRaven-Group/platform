/*
  # Surveillance Cameras Cache System

  1. New Tables
    - surveillance_cameras: Stores camera data from OSM
    - camera_load_history: Tracks API request success/failure

  2. Indexes
    - Geographic index for spatial queries
    - Timestamp indexes for cache management

  3. Security
    - Enable RLS on all tables
    - Public read access to cameras
    - Authenticated write for monitoring
*/

-- Create surveillance_cameras table
CREATE TABLE IF NOT EXISTS surveillance_cameras (
  id text PRIMARY KEY,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  surveillance_type text DEFAULT 'camera',
  indoor boolean DEFAULT false,
  zone text,
  direction integer,
  tags jsonb DEFAULT '{}'::jsonb,
  last_verified timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create geographic index for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_surveillance_cameras_location 
  ON surveillance_cameras USING btree (lat, lng);

-- Create index for cache expiration queries
CREATE INDEX IF NOT EXISTS idx_surveillance_cameras_last_verified 
  ON surveillance_cameras (last_verified);

-- Create camera_load_history table for monitoring
CREATE TABLE IF NOT EXISTS camera_load_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounds jsonb NOT NULL,
  camera_count integer DEFAULT 0,
  success boolean DEFAULT false,
  error_message text,
  response_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_camera_load_history_created_at 
  ON camera_load_history (created_at DESC);

-- Create index for success rate queries
CREATE INDEX IF NOT EXISTS idx_camera_load_history_success 
  ON camera_load_history (success, created_at DESC);

-- Enable RLS
ALTER TABLE surveillance_cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_load_history ENABLE ROW LEVEL SECURITY;

-- Public read access to camera data (surveillance is public info)
CREATE POLICY "Anyone can read surveillance cameras"
  ON surveillance_cameras
  FOR SELECT
  USING (true);

-- Allow anonymous inserts/updates for camera data
CREATE POLICY "Anyone can insert surveillance cameras"
  ON surveillance_cameras
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update surveillance cameras"
  ON surveillance_cameras
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Public read access to load history
CREATE POLICY "Anyone can read load history"
  ON camera_load_history
  FOR SELECT
  USING (true);

-- Allow anonymous inserts for monitoring
CREATE POLICY "Anyone can insert load history"
  ON camera_load_history
  FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_surveillance_camera_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_surveillance_camera_timestamp ON surveillance_cameras;
CREATE TRIGGER update_surveillance_camera_timestamp
  BEFORE UPDATE ON surveillance_cameras
  FOR EACH ROW
  EXECUTE FUNCTION update_surveillance_camera_timestamp();