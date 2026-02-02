-- ACADEMY FOLDER-BASED ORGANIZATION MIGRATION
-- Supports hierarchical directory structure for library resources.

-- 1. Create 'library_folders' table
CREATE TABLE IF NOT EXISTS public.library_folders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    parent_id uuid REFERENCES public.library_folders(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES public.profiles(id)
);

-- 2. Add 'folder_id' to 'courses' table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'folder_id') THEN
        ALTER TABLE public.courses ADD COLUMN folder_id uuid REFERENCES public.library_folders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.library_folders ENABLE ROW LEVEL SECURITY;

-- 4. Policies for library_folders
CREATE POLICY "Everyone authenticated can view folders" ON public.library_folders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Officers can manage folders" ON public.library_folders
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('instructor', 'admin')
    ));

-- 5. Permissions
GRANT ALL ON public.library_folders TO authenticated;
GRANT ALL ON public.library_folders TO service_role;
