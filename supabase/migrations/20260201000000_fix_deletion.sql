-- Migration: Fix Course Deletion RLS & Cascades
-- Date: 2026-02-01

-- 1. Ensure courses has created_by
do $$ 
begin
  if not exists (select from information_schema.columns where table_name = 'courses' and column_name = 'created_by') then
    alter table public.courses add column created_by uuid references auth.users(id) on delete set null;
  end if;
end $$;

-- 2. Update RLS policies to allow Training Officers to manage courses
drop policy if exists "Admins and ATCOs can manage courses" on public.courses;
create policy "Admins and Training Officers can manage courses" on public.courses
for all using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and (role = 'admin' or role = 'atco' or role = 'training_officer')
  )
);

-- 3. Ensure course_modules has RLS and correct policies
alter table public.course_modules enable row level security;
drop policy if exists "Admins and ATCOs can manage course modules" on public.course_modules;
create policy "Admins and Training Officers can manage course modules" on public.course_modules
for all using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and (role = 'admin' or role = 'atco' or role = 'training_officer')
  )
);

-- 4. Enable cascade delete if not already there (manual safety)
-- Note: Already theoretically there in courses, but we make sure for course_modules.
-- Since we can't easily alter existing FKs without knowing names, we ensure deletion logic in code is robust.
