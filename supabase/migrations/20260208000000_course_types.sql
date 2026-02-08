-- COURSE VISIBILITY & COVER PAGES MIGRATION
-- Supports Professional vs Archive courses and styling.

DO $$ 
BEGIN
    -- 1. Create visibility enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_visibility') THEN
        CREATE TYPE public.course_visibility AS ENUM ('public', 'internal', 'archive');
    END IF;

    -- 2. Update 'courses' table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'visibility_type') THEN
        ALTER TABLE public.courses ADD COLUMN visibility_type public.course_visibility DEFAULT 'public';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'cover_page_url') THEN
        ALTER TABLE public.courses ADD COLUMN cover_page_url text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'custom_settings') THEN
        ALTER TABLE public.courses ADD COLUMN custom_settings jsonb DEFAULT '{"fontFamily": "Inter", "theme": "dark"}'::jsonb;
    END IF;

END $$;

-- 3. Update RLS Policies for Visibility
-- Training Officers, Admins can see EVERYTHING.
-- ATCOs (public) can only see 'public' courses.

DROP POLICY IF EXISTS "Everyone authenticated can view courses" ON public.courses;
CREATE POLICY "ATCOs can view public courses" ON public.courses FOR SELECT 
USING (
    (visibility_type = 'public' AND auth.role() = 'authenticated') OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('training_officer', 'admin', 'head_of_training')
    )
);

-- Ensure all permissions are granted
GRANT ALL ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
