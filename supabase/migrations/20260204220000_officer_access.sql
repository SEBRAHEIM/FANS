-- Grant Training Officers full access to sessions
drop policy if exists "Admins can manage sessions" on public.sessions;
create policy "Admins and Officers can manage sessions" on public.sessions for all using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('admin', 'training_officer', 'head_of_training')
  )
);

-- Ensure instructors can still view sessions they are teaching
drop policy if exists "Instructors can view assigned sessions" on public.sessions;
create policy "Instructors can view assigned sessions" on public.sessions for select using (
  instructor_id = auth.uid() or
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('admin', 'training_officer', 'head_of_training')
  )
);

-- Grant full access to enrollments for officers as well
drop policy if exists "Admins can manage enrollments" on public.enrollments;
create policy "Admins and Officers can manage enrollments" on public.enrollments for all using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('admin', 'training_officer', 'head_of_training')
  )
);
