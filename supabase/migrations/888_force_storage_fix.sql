-- FORCE OVERRIDE STORAGE LIMITS
-- Run this if you are getting "Object exceeded maximum allowed size"

-- 1. First, check what the current limit is (look at the 'Results' tab after running)
SELECT name, file_size_limit, (file_size_limit / 1024 / 1024) as limit_mb
FROM storage.buckets
WHERE id = 'course-assets';

-- 2. Force the limit to 5GB (Note: Free Plan might cap this at 50MB automatically)
UPDATE storage.buckets 
SET file_size_limit = 5368709120 
WHERE id = 'course-assets';

-- 3. If the above doesn't work (due to Supabase plan), try a safer 250MB limit
-- UPDATE storage.buckets 
-- SET file_size_limit = 262144000 
-- WHERE id = 'course-assets';

-- 4. Ensure RLS is fully open for the Training Officer
-- This ensures that even if you aren't the primary owner, you can still upload
DROP POLICY IF EXISTS "Anyone can upload to course-assets" ON storage.objects;
CREATE POLICY "Anyone can upload to course-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-assets');

DROP POLICY IF EXISTS "Anyone can update course-assets" ON storage.objects;
CREATE POLICY "Anyone can update course-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-assets');
