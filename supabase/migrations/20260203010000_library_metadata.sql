-- LIBRARY EVOLUTION: METADATA EXPANSION
-- Adds advanced metadata to the courses table for better organization and discovery.

DO $$ 
BEGIN
    -- 1. Add estimated_duration (minutes)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'estimated_duration') THEN
        ALTER TABLE public.courses ADD COLUMN estimated_duration integer DEFAULT 15;
    END IF;

    -- 2. Add difficulty_level (Beginner, Intermediate, Advanced)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'difficulty_level') THEN
        ALTER TABLE public.courses ADD COLUMN difficulty_level text DEFAULT 'Intermediate';
    END IF;

    -- 3. Add tags (text array)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'tags') THEN
        ALTER TABLE public.courses ADD COLUMN tags text[] DEFAULT '{}';
    END IF;

    -- 4. Add resource_type (Theory, Practical, Exam, Guide)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'resource_type') THEN
        ALTER TABLE public.courses ADD COLUMN resource_type text DEFAULT 'Theory';
    END IF;

END $$;
