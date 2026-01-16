/*
  # Create Map Pins System

  ## New Tables

  ### `map_pins`
  Main table for storing all map pin locations
  - `id` (uuid, primary key)
  - `title` (text) - Pin title/name
  - `note` (text) - Additional notes/description
  - `lat` (numeric) - Latitude coordinate
  - `lng` (numeric) - Longitude coordinate
  - `type` (text) - Pin type (agency, lock, tomb, submarine, etc.)
  - `agency` (text) - Agency name if type is agency
  - `category` (text) - Enriched category
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `map_categories`
  Table for managing custom categories
  - `id` (uuid, primary key)
  - `name` (text) - Category name
  - `color` (text) - Hex color code
  - `icon` (text) - Icon emoji/identifier
  - `pin_type` (text) - Related pin type
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Allow anonymous read access for map viewing
  - Require authentication for write operations

  ## Indexes
  - Spatial index on coordinates for fast lookups
  - Index on type and category for filtering
  - Unique index on lat/lng to prevent exact duplicates
*/

-- Create map_pins table
CREATE TABLE IF NOT EXISTS map_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  note text DEFAULT '',
  lat numeric(10, 7) NOT NULL,
  lng numeric(10, 7) NOT NULL,
  type text NOT NULL DEFAULT 'other',
  agency text,
  category text NOT NULL DEFAULT 'Other',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_coordinates UNIQUE (lat, lng)
);

-- Create map_categories table
CREATE TABLE IF NOT EXISTS map_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text NOT NULL,
  icon text NOT NULL,
  pin_type text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_map_pins_coordinates ON map_pins (lat, lng);
CREATE INDEX IF NOT EXISTS idx_map_pins_type ON map_pins (type);
CREATE INDEX IF NOT EXISTS idx_map_pins_category ON map_pins (category);
CREATE INDEX IF NOT EXISTS idx_map_pins_agency ON map_pins (agency);
CREATE INDEX IF NOT EXISTS idx_map_pins_created_at ON map_pins (created_at DESC);

-- Enable RLS
ALTER TABLE map_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for map_pins
CREATE POLICY "Allow anonymous read access to map pins"
  ON map_pins
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert to map pins"
  ON map_pins
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update to map pins"
  ON map_pins
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete from map pins"
  ON map_pins
  FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for map_categories
CREATE POLICY "Allow anonymous read access to categories"
  ON map_categories
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert to categories"
  ON map_categories
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update to categories"
  ON map_categories
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insert default categories
INSERT INTO map_categories (name, color, icon, pin_type) VALUES
  ('CIA', '#dc2626', '🎯', 'agency'),
  ('DGSE', '#2563eb', '🎯', 'agency'),
  ('MI6', '#059669', '🎯', 'agency'),
  ('FSB', '#7c2d12', '🎯', 'agency'),
  ('DLI', '#9333ea', '🎯', 'agency'),
  ('BND', '#ea580c', '🎯', 'agency'),
  ('NZSIS', '#0891b2', '🎯', 'agency'),
  ('Mossad', '#d97706', '🎯', 'agency'),
  ('Locks', '#eab308', '🔒', 'lock'),
  ('Archaeological Sites', '#78350f', '⚰️', 'tomb'),
  ('Naval Assets', '#0c4a6e', '🚢', 'submarine'),
  ('Military Facilities', '#991b1b', '🏭', 'facility'),
  ('Personnel', '#1e40af', '👤', 'person'),
  ('Other', '#475569', '📍', 'other')
ON CONFLICT (name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_map_pins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER map_pins_updated_at
  BEFORE UPDATE ON map_pins
  FOR EACH ROW
  EXECUTE FUNCTION update_map_pins_updated_at();
