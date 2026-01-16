/*
  # Add bot_name to OSINT API Config

  1. Changes
    - Add bot_name column to osint_api_config table
    - Set default value to @BreachHunter_Bot
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'osint_api_config' AND column_name = 'bot_name'
  ) THEN
    ALTER TABLE osint_api_config ADD COLUMN bot_name text DEFAULT '@BreachHunter_Bot';
  END IF;
END $$;
