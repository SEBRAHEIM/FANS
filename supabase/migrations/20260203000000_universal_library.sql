-- UNIVERSAL LIBRARY & SLIDE CREATOR MIGRATION
-- Supports course categorisation and PowerPoint-style module content.

DO $$ 
BEGIN
    -- 1. Update 'courses' table for Library features
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_library_item') THEN
        ALTER TABLE public.courses ADD COLUMN is_library_item boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'category') THEN
        ALTER TABLE public.courses ADD COLUMN category text DEFAULT 'General';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'library_order') THEN
        ALTER TABLE public.courses ADD COLUMN library_order integer DEFAULT 0;
    END IF;

    -- 2. Create 'module_slides' table for PPT-style content
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'module_slides') THEN
        CREATE TABLE public.module_slides (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
            title text,
            content_json jsonb DEFAULT '{"elements": []}'::jsonb,
            background_url text,
            order_index integer DEFAULT 0,
            created_at timestamp with time zone DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.module_slides ENABLE ROW LEVEL SECURITY;

        -- Policies
        CREATE POLICY "Authenticated users can select slides" ON public.module_slides 
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Officers can manage slides" ON public.module_slides 
            FOR ALL USING (EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND role IN ('training_officer', 'admin', 'head_of_training')
            ));
    END IF;

    -- 3. Update 'course_modules' to support 'slides' as a type
    -- (We already have module_type text, but we ensure it supports 'slides')
    -- No action needed if column exists, application logic will handle the type.

END $$;

-- 4. Grant Permissions
GRANT ALL ON public.module_slides TO authenticated;
GRANT ALL ON public.module_slides TO service_role;
