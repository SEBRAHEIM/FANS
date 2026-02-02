-- INCREASE STORAGE LIMITS FOR VIDEOS
-- Sets the limit to 5GB (5368709120 bytes)

-- 1. Ensure the bucket exists and has correct limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-assets', 'course-assets', true, 5368709120, '{video/*,image/*,application/pdf}')
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = 5368709120,
    allowed_mime_types = '{video/*,image/*,application/pdf}';

-- 2. Add Storage Policies for course-assets
-- Enable RLS on objects (usually enabled by default on storage.objects)

-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Officers can upload course assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view course assets" ON storage.objects;
DROP POLICY IF EXISTS "Officers can delete course assets" ON storage.objects;

-- Create comprehensive policies
CREATE POLICY "Public can view course assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

CREATE POLICY "Officers can upload course assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'course-assets' 
    AND (
        SELECT (role IN ('training_officer', 'admin'))
        FROM public.profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Officers can update own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'course-assets' 
    AND (
        SELECT (role IN ('training_officer', 'admin'))
        FROM public.profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Officers can delete course assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'course-assets' 
    AND (
        SELECT (role IN ('training_officer', 'admin'))
        FROM public.profiles
        WHERE id = auth.uid()
    )
);
