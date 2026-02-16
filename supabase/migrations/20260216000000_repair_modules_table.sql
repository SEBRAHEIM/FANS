-- REPAIR MODULES TABLE
-- Add missing columns to 'modules' table to support full platform functionality
-- Standardizing on 'modules' as the primary table name

DO $$ 
BEGIN
    -- 1. Add missing columns to public.modules
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'module_type') THEN
        ALTER TABLE public.modules ADD COLUMN module_type text DEFAULT 'video';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'video_url') THEN
        ALTER TABLE public.modules ADD COLUMN video_url text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'video_source') THEN
        ALTER TABLE public.modules ADD COLUMN video_source text DEFAULT 'youtube';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'is_unskippable') THEN
        ALTER TABLE public.modules ADD COLUMN is_unskippable boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'videos') THEN
        ALTER TABLE public.modules ADD COLUMN videos jsonb DEFAULT '[]';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'description') THEN
        ALTER TABLE public.modules ADD COLUMN description text;
    END IF;

    -- 2. Update existing foreign keys if necessary
    -- (Assuming 'modules' was created correctly in master_rebuild_schema)

    -- 3. Ensure quiz_questions and module_checkpoints also reference 'modules' if they were referencing 'course_modules'
    -- (Checking these specifically just in case)
    
    -- Note: If we need to migrate data from course_modules to modules, 
    -- it should be done carefully. For now, we ensure the structure exists.

END $$;

-- 4. Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Public select modules" ON public.modules;
CREATE POLICY "Public select modules" ON public.modules FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Officers manage modules" ON public.modules;
CREATE POLICY "Officers manage modules" ON public.modules FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin', 'head_of_training')));
