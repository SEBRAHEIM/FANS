-- INCREASE STORAGE LIMITS FOR VIDEOS
-- Sets the limit to 5GB (5368709120 bytes)

-- Ensure the bucket exists (it should, but safety first)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-assets', 'course-assets', true, 5368709120, '{video/*,image/*,application/pdf}')
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = 5368709120,
    allowed_mime_types = '{video/*,image/*,application/pdf}';

-- Ensure RLS is enabled and policies are correct (if needed, but usually already set)
-- We expect the user has already configured storage policies via the dashboard or previous migrations.
