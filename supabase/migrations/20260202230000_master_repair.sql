-- MASTER REPAIR MIGRATION
-- This script reconciles the database schema with the latest application code.
-- Apply this in the Supabase SQL Editor to restore full platform functionality.

DO $$ 
BEGIN
    -- 1. Table Rename (Legacy support)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'online_modules') AND 
       NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'course_modules') THEN
        ALTER TABLE public.online_modules RENAME TO course_modules;
    END IF;

    -- 2. Repair 'course_modules'
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'course_modules') THEN
        CREATE TABLE public.course_modules (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
            title text NOT NULL,
            description text,
            module_type text DEFAULT 'video',
            video_url text,
            video_source text DEFAULT 'youtube',
            is_unskippable boolean DEFAULT false,
            videos jsonb DEFAULT '[]',
            order_index integer DEFAULT 0,
            created_at timestamp with time zone DEFAULT now()
        );
    ELSE
        -- Add missing columns to course_modules
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_modules' AND column_name = 'description') THEN
            ALTER TABLE public.course_modules ADD COLUMN description text;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_modules' AND column_name = 'module_type') THEN
            ALTER TABLE public.course_modules ADD COLUMN module_type text DEFAULT 'video';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_modules' AND column_name = 'video_url') THEN
            ALTER TABLE public.course_modules ADD COLUMN video_url text;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_modules' AND column_name = 'video_source') THEN
            ALTER TABLE public.course_modules ADD COLUMN video_source text DEFAULT 'youtube';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_modules' AND column_name = 'is_unskippable') THEN
            ALTER TABLE public.course_modules ADD COLUMN is_unskippable boolean DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_modules' AND column_name = 'videos') THEN
            ALTER TABLE public.course_modules ADD COLUMN videos jsonb DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_modules' AND column_name = 'order_index') THEN
            ALTER TABLE public.course_modules ADD COLUMN order_index integer DEFAULT 0;
        END IF;
    END IF;

    -- 3. Repair 'course_assignments'
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'course_assignments') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_assignments' AND column_name = 'max_quiz_retries') THEN
            ALTER TABLE public.course_assignments ADD COLUMN max_quiz_retries integer DEFAULT 3;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_assignments' AND column_name = 'quiz_attempts') THEN
            ALTER TABLE public.course_assignments ADD COLUMN quiz_attempts integer DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_assignments' AND column_name = 'quiz_passed') THEN
            ALTER TABLE public.course_assignments ADD COLUMN quiz_passed boolean DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'course_assignments' AND column_name = 'time_limit_minutes') THEN
            ALTER TABLE public.course_assignments ADD COLUMN time_limit_minutes integer;
        END IF;
    END IF;

    -- 4. Repair 'quiz_questions'
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quiz_questions') THEN
        CREATE TABLE public.quiz_questions (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
            question_text text NOT NULL,
            question_type text NOT NULL,
            options jsonb,
            correct_answer text,
            order_index integer DEFAULT 0,
            needs_manual_grading boolean DEFAULT false,
            timing text DEFAULT 'final',
            target_video_id uuid,
            timestamp_seconds integer,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;

    -- 5. Repair 'module_checkpoints'
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'module_checkpoints') THEN
        CREATE TABLE public.module_checkpoints (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
            video_id uuid,
            timestamp_seconds integer NOT NULL,
            question_id uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
            is_blocking boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;

    -- 6. Grant Permissions
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

END $$;

-- Enable RLS and add basic manage policies if they don't exist
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_checkpoints ENABLE ROW LEVEL SECURITY;

-- Safety Policy: All Authenticated users can select
DROP POLICY IF EXISTS "Public select modules" ON public.course_modules;
CREATE POLICY "Public select modules" ON public.course_modules FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public select questions" ON public.quiz_questions;
CREATE POLICY "Public select questions" ON public.quiz_questions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public select checkpoints" ON public.module_checkpoints;
CREATE POLICY "Public select checkpoints" ON public.module_checkpoints FOR SELECT USING (auth.role() = 'authenticated');

-- Manage Policy: Officers can manage
DROP POLICY IF EXISTS "Officers manage modules" ON public.course_modules;
CREATE POLICY "Officers manage modules" ON public.course_modules FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin', 'head_of_training')));

DROP POLICY IF EXISTS "Officers manage questions" ON public.quiz_questions;
CREATE POLICY "Officers manage questions" ON public.quiz_questions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin', 'head_of_training')));

DROP POLICY IF EXISTS "Officers manage checkpoints" ON public.module_checkpoints;
CREATE POLICY "Officers manage checkpoints" ON public.module_checkpoints FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin', 'head_of_training')));
