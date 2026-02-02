-- Migration: Perfecting Platform Flows
-- Date: 2026-02-02

-- 1. Ensure live_attendance table exists for Live Modules
CREATE TABLE IF NOT EXISTS public.live_attendance (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    attended_at timestamp with time zone DEFAULT now(),
    UNIQUE(module_id, user_id)
);

-- 2. Add feedback and graded_by to student_responses if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_responses' AND column_name = 'feedback') THEN
        ALTER TABLE public.student_responses ADD COLUMN feedback text;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_responses' AND column_name = 'graded_by') THEN
        ALTER TABLE public.student_responses ADD COLUMN graded_by uuid REFERENCES public.profiles(id);
    END IF;
END $$;

-- 3. Update exam_results view to show grading status more clearly
DROP VIEW IF EXISTS public.exam_results;
CREATE VIEW public.exam_results AS
SELECT 
    sp.id,
    p.full_name as student_name,
    c.title as course_title,
    m.title as module_title,
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
    ) as pending_count,
    CASE 
        WHEN (
            SELECT count(*) 
            FROM public.student_responses sr
            WHERE sr.user_id = sp.user_id 
            AND sr.is_correct IS NULL
            AND sr.question_id IN (
                SELECT q.id 
                FROM public.quiz_questions q
                WHERE q.module_id = sp.module_id
            )
        ) > 0 THEN 'pending_grading'
        WHEN sp.is_completed THEN 'completed'
        ELSE 'in_progress'
    END as status
FROM public.student_progress sp
JOIN public.profiles p ON sp.user_id = p.id
JOIN public.course_modules m ON sp.module_id = m.id
JOIN public.courses c ON m.course_id = c.id;

-- 4. Ensure RLS for live_attendance
ALTER TABLE public.live_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attendance" ON public.live_attendance;
CREATE POLICY "Users can view own attendance" ON public.live_attendance
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Officers can view all attendance" ON public.live_attendance;
CREATE POLICY "Officers can view all attendance" ON public.live_attendance
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('training_officer', 'admin')));
