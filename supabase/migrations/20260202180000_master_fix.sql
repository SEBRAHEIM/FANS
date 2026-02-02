-- MASTER FIX: ROLES, PROFILES, AND STORAGE PERMISSIONS
-- This migration ensures everything is set up correctly for the new platform features.

-- 1. Fix the user_role enum to include all necessary roles
-- We use a DO block to safely add values without failing if they already exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'training_officer') THEN
        ALTER TYPE public.user_role ADD VALUE 'training_officer';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'head_of_training') THEN
        ALTER TYPE public.user_role ADD VALUE 'head_of_training';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ensure missing columns exist in public.profiles
-- The code expects 'username' and 'is_ojti'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username text;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_ojti') THEN
        ALTER TABLE public.profiles ADD COLUMN is_ojti boolean DEFAULT false;
    END IF;
END $$;

-- 3. Ensure the 'course-assets' bucket is correctly configured
-- Public access and 5GB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-assets', 'course-assets', true, 5368709120, '{video/*,image/*,application/pdf}')
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = 5368709120,
    allowed_mime_types = '{video/*,image/*,application/pdf}',
    public = true;

-- 4. Unified Storage Policies for course-assets
-- Clean up old potentially conflicting policies
DROP POLICY IF EXISTS "Public can view course assets" ON storage.objects;
DROP POLICY IF EXISTS "Officers can upload course assets" ON storage.objects;
DROP POLICY IF EXISTS "Officers can update own assets" ON storage.objects;
DROP POLICY IF EXISTS "Officers can delete course assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to course-assets" ON storage.objects;

-- Select: Public access
CREATE POLICY "Public can view course assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

-- Insert/Update/Delete: Admin and Training Officers ONLY
CREATE POLICY "Officers can manage course assets"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'course-assets' 
    AND (
        SELECT (role IN ('training_officer', 'admin', 'head_of_training'))
        FROM public.profiles
        WHERE id = auth.uid()
    )
)
WITH CHECK (
    bucket_id = 'course-assets' 
    AND (
        SELECT (role IN ('training_officer', 'admin', 'head_of_training'))
        FROM public.profiles
        WHERE id = auth.uid()
    )
);

-- 5. Finalize: Set the current user to Training Officer so they can test
-- (Optional but helpful for the user running the script)
UPDATE public.profiles 
SET role = 'training_officer' 
WHERE id = auth.uid() AND role = 'atco';
