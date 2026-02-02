-- DIAGNOSTIC: CHECK BUCKET SETTINGS AND YOUR ROLE
-- Run this in your Supabase SQL Editor to see why uploads are failing.

-- 1. Check if the bucket has the correct 5GB limit
SELECT id, name, public, (file_size_limit / 1024 / 1024) as limit_mb 
FROM storage.buckets 
WHERE id = 'course-assets';

-- 2. Check your current role (important for storage permissions)
SELECT id, email, role 
FROM public.profiles 
WHERE id = auth.uid();

-- 3. If you see 'atco' or limit_mb is small, run the Master Fix again
-- OR run these specific lines:
UPDATE storage.buckets 
SET file_size_limit = 5368709120 
WHERE id = 'course-assets';

UPDATE public.profiles 
SET role = 'training_officer' 
WHERE id = auth.uid();
