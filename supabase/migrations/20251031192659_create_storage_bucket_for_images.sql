/*
  # Create Storage Bucket for Target Images

  1. New Storage Bucket
    - `target-images` bucket for storing profile photos
    - Public access for reading images
    - Restricted upload to authenticated users only
  
  2. Security
    - RLS policies for storage access control
*/

-- Create the storage bucket for target images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'target-images',
  'target-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload target images'
  ) THEN
    CREATE POLICY "Authenticated users can upload target images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'target-images');
  END IF;
END $$;

-- Policy: Allow public read access to target images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access to target images'
  ) THEN
    CREATE POLICY "Public read access to target images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'target-images');
  END IF;
END $$;

-- Policy: Allow authenticated users to update their uploaded images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update target images'
  ) THEN
    CREATE POLICY "Authenticated users can update target images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'target-images')
    WITH CHECK (bucket_id = 'target-images');
  END IF;
END $$;

-- Policy: Allow authenticated users to delete their uploaded images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete target images'
  ) THEN
    CREATE POLICY "Authenticated users can delete target images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'target-images');
  END IF;
END $$;
