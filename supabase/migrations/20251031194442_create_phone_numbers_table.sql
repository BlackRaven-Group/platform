/*
  # Create Phone Numbers Table

  1. New Table
    - `phone_numbers`
      - `id` (uuid, primary key)
      - `target_id` (uuid, foreign key to targets)
      - `phone_number` (text) - The phone number
      - `number_type` (text) - mobile, landline, voip, unknown
      - `country_code` (text) - Country code
      - `carrier` (text) - Phone carrier/provider
      - `verified` (boolean) - Whether the number is verified
      - `status` (text) - active, inactive, disconnected, unknown
      - `strength` (integer) - Confidence strength 1-10
      - `last_seen` (timestamptz) - When this number was last confirmed active
      - `source` (text) - Where this number was obtained
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `phone_numbers` table
    - Add policy for authenticated users to access all phone numbers
*/

CREATE TABLE IF NOT EXISTS phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  number_type text DEFAULT 'unknown',
  country_code text DEFAULT '',
  carrier text DEFAULT '',
  verified boolean DEFAULT false,
  status text DEFAULT 'unknown',
  strength integer DEFAULT 5,
  last_seen timestamptz,
  source text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_target_id ON phone_numbers(target_id);

ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phone_numbers_all" ON phone_numbers FOR ALL TO authenticated USING (true) WITH CHECK (true);