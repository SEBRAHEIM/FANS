-- ADVANCED COURSE METADATA MIGRATION
-- Adds fields for rich descriptions, learning objectives, and instructor information.

DO $$ 
BEGIN
    -- 1. Detailed Description (HTML/Markdown support)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'detailed_content') THEN
        ALTER TABLE public.courses ADD COLUMN detailed_content text DEFAULT '';
    END IF;

    -- 2. Learning Objectives (Array of strings)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'objectives') THEN
        ALTER TABLE public.courses ADD COLUMN objectives text[] DEFAULT '{}';
    END IF;

    -- 3. Instructors / Delivered By (Array of objects)
    -- Format: { "name": "...", "role": "...", "avatar_url": "..." }
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'instructors') THEN
        ALTER TABLE public.courses ADD COLUMN instructors jsonb[] DEFAULT '{}';
    END IF;

    -- 4. Target Audience
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'target_audience') THEN
        ALTER TABLE public.courses ADD COLUMN target_audience text;
    END IF;

END $$;
