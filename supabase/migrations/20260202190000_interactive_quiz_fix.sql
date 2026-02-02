-- MIGRATION: INTERACTIVE QUIZ RLS FIX
-- Purpose: Ensure quiz_questions and module_checkpoints have correct RLS policies for Training Officers.

-- 1. Ensure Table Structure for quiz_questions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_questions') THEN
        CREATE TABLE public.quiz_questions (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
            question_text text NOT NULL,
            question_type text NOT NULL, -- multiple_choice, multiple_selection, fill_blanks, written
            options text[], -- Array of options for MC/MS
            correct_answer text, -- Single answer or pipe-separated for multi
            order_index integer DEFAULT 0,
            needs_manual_grading boolean DEFAULT false,
            timing text DEFAULT 'final', -- 'final' or 'interactive'
            target_video_id uuid, -- For interactive questions
            timestamp_seconds integer, -- For interactive questions
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;
END $$;

-- 2. Ensure Table Structure for module_checkpoints
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'module_checkpoints') THEN
        CREATE TABLE public.module_checkpoints (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
            video_id uuid NOT NULL,
            timestamp_seconds integer NOT NULL,
            question_id uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
            is_blocking boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_checkpoints ENABLE ROW LEVEL SECURITY;

-- 4. Set Permissions
GRANT ALL ON public.quiz_questions TO authenticated;
GRANT ALL ON public.module_checkpoints TO authenticated;

-- 5. RLS Policies for quiz_questions
DROP POLICY IF EXISTS "Officers can manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Officers can manage quiz questions" ON public.quiz_questions
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin', 'head_of_training')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin', 'head_of_training')));

DROP POLICY IF EXISTS "Authenticated users can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Authenticated users can view quiz questions" ON public.quiz_questions
FOR SELECT TO authenticated
USING (true);

-- 6. RLS Policies for module_checkpoints
DROP POLICY IF EXISTS "Officers can manage module checkpoints" ON public.module_checkpoints;
CREATE POLICY "Officers can manage module checkpoints" ON public.module_checkpoints
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin', 'head_of_training')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin', 'head_of_training')));

DROP POLICY IF EXISTS "Authenticated users can view module checkpoints" ON public.module_checkpoints;
CREATE POLICY "Authenticated users can view module checkpoints" ON public.module_checkpoints
FOR SELECT TO authenticated
USING (true);
