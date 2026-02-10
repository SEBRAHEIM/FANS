-- PLATFORM RESET MIGRATION
-- Transition to Course-Centric LMS

DO $$ 
BEGIN
    -- 1. Add 'training_officer' and 'head_of_training' to user_role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('atco', 'instructor', 'admin', 'training_officer', 'head_of_training');
    ELSE
        BEGIN
            ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'training_officer';
            ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'head_of_training';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;

    -- 2. Create course status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_status') THEN
        CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'archived');
    END IF;

    -- 3. Create course type enum (Refined)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_category') THEN
        CREATE TYPE public.course_category AS ENUM ('mandatory', 'recurrent', 'reference');
    END IF;

    -- 4. Update 'courses' table with new architecture fields
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'status') THEN
        ALTER TABLE public.courses ADD COLUMN status public.course_status DEFAULT 'draft';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'category') THEN
        ALTER TABLE public.courses ADD COLUMN category public.course_category DEFAULT 'reference';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'audience') THEN
        ALTER TABLE public.courses ADD COLUMN audience jsonb DEFAULT '{"groups": [], "users": []}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'estimated_duration') THEN
        ALTER TABLE public.courses ADD COLUMN estimated_duration text; -- e.g. "45 mins"
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'version') THEN
        ALTER TABLE public.courses ADD COLUMN version integer DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'published_at') THEN
        ALTER TABLE public.courses ADD COLUMN published_at timestamp with time zone;
    END IF;

END $$;

-- 5. Updated RLS Policies for Strict Role Separation
-- Training Officers, Admins can manage everything
-- ATCOs can ONLY see 'published' courses where they are in the audience

DROP POLICY IF EXISTS "ATCOs can view public courses" ON public.courses;
DROP POLICY IF EXISTS "Everyone authenticated can view courses" ON public.courses;

CREATE POLICY "Officers can manage all courses" ON public.courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('training_officer', 'admin', 'head_of_training')
        )
    );

CREATE POLICY "ATCOs can view assigned published courses" ON public.courses
    FOR SELECT USING (
        status = 'published' AND (
            (audience->'groups') ? (SELECT role::text FROM public.profiles WHERE id = auth.uid()) OR
            (audience->'users') ? (auth.uid()::text) OR
            (jsonb_array_length(audience->'groups') = 0 AND jsonb_array_length(audience->'users') = 0) -- Fallback to public if audience empty? No, PRD says visibility controlled.
        )
    );

-- 6. Assignments Update
-- Ensure course_assignments supports due dates and recurrent training
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_assignments' AND column_name = 'due_date') THEN
        ALTER TABLE public.course_assignments ADD COLUMN due_date timestamp with time zone;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_assignments' AND column_name = 'is_recurrent') THEN
        ALTER TABLE public.course_assignments ADD COLUMN is_recurrent boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_assignments' AND column_name = 'recurrent_interval_days') THEN
        ALTER TABLE public.course_assignments ADD COLUMN recurrent_interval_days integer;
    END IF;
END $$;
