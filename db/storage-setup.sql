-- SUPABASE STORAGE SETUP FOR AVATARS
-- Execute this in your Supabase SQL Editor to create the avatars bucket

-- Create the avatars storage bucket (public access for reading)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all files in the avatars bucket
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
CREATE POLICY "Public Access to Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow service role to manage all avatar files (backend only)
-- This is used by your API routes which use the service role key
DROP POLICY IF EXISTS "Service role can manage avatars" ON storage.objects;
CREATE POLICY "Service role can manage avatars"
ON storage.objects
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Note: All upload/delete operations will be performed server-side using the service role key
-- Users interact with /api/profile/avatar endpoints, not directly with Supabase Storage
