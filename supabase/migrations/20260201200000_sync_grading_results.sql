-- 0. Schema Fixups (Ensuring tables exist and have expected columns)
DO $$ 
BEGIN 
    -- 1. Ensure student_progress exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_progress') THEN
        CREATE TABLE public.student_progress (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
            module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
            is_completed boolean DEFAULT false,
            completed_at timestamp with time zone,
            score_percentage integer,
            last_position_seconds integer DEFAULT 0,
            completed_checkpoints text[] DEFAULT '{}',
            UNIQUE(user_id, module_id)
        );
    ELSE
        -- Ensure id column exists if table exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_progress' AND column_name = 'id') THEN
            ALTER TABLE public.student_progress ADD COLUMN id uuid DEFAULT uuid_generate_v4();
            ALTER TABLE public.student_progress DROP CONSTRAINT IF EXISTS student_progress_pkey;
            ALTER TABLE public.student_progress ADD PRIMARY KEY (id);
        END IF;

        -- Ensure score_percentage exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_progress' AND column_name = 'score_percentage') THEN
            ALTER TABLE public.student_progress ADD COLUMN score_percentage integer;
        END IF;
    END IF;

    -- 2. Ensure student_responses exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_responses') THEN
        CREATE TABLE public.student_responses (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
            question_id uuid NOT NULL, -- References quiz_questions
            answer_text text,
            is_correct boolean,
            created_at timestamp with time zone DEFAULT now()
        );
    ELSE
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_responses' AND column_name = 'id') THEN
            ALTER TABLE public.student_responses ADD COLUMN id uuid DEFAULT uuid_generate_v4() PRIMARY KEY;
        END IF;
    END IF;
END $$;

-- 1. Create the definitive exam_results view
DROP VIEW IF EXISTS public.exam_results;

CREATE OR REPLACE VIEW public.exam_results AS
SELECT 
    sp.id,
    p.full_name as student_name,
    c.title as course_title,
    sp.completed_at,
    sp.score_percentage,
    sp.module_id,
    c.id as course_id,
    p.id as user_id,
    (
        SELECT count(*) 
        FROM public.student_responses sr
        WHERE sr.user_id = sp.user_id 
        AND sr.is_correct IS NULL
        AND sr.question_id IN (
            SELECT q.id 
            FROM public.quiz_questions q
            WHERE q.module_id = sp.module_id
        )
    ) as pending_count
FROM public.student_progress sp
JOIN public.profiles p ON sp.user_id = p.id
JOIN public.course_modules m ON sp.module_id = m.id
JOIN public.courses c ON m.course_id = c.id
WHERE sp.is_completed = true;

-- 2. Grant permissions
GRANT SELECT ON public.exam_results TO authenticated;
GRANT SELECT ON public.student_responses TO authenticated;
GRANT SELECT ON public.quiz_questions TO authenticated;

-- 3. Verify RLS (Training Officers should see all, ATCOs see only theirs)
ALTER TABLE public.student_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Officers can view all responses" ON public.student_responses;
CREATE POLICY "Officers can view all responses" 
ON public.student_responses FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin')));

DROP POLICY IF EXISTS "ATCOs can view their own responses" ON public.student_responses;
CREATE POLICY "ATCOs can view their own responses" 
ON public.student_responses FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());
