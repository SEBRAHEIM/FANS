-- Course Assignments System
-- Allows Training Officers to assign courses to ATCOs with deadlines and time limits

-- Course Assignments table
create table if not exists public.course_assignments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  assigned_to uuid references public.profiles(id) on delete cascade not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  deadline timestamp with time zone,
  time_limit_minutes integer, -- Time limit once started (e.g., 60 minutes)
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue', 'expired')),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  time_remaining_seconds integer, -- Track remaining time for paused sessions
  max_quiz_retries integer default 3, -- Maximum quiz attempts allowed
  quiz_attempts integer default 0, -- Current quiz attempt count
  quiz_passed boolean default false, -- Whether quiz has been passed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries
create index if not exists idx_course_assignments_assigned_to on public.course_assignments(assigned_to);
create index if not exists idx_course_assignments_course_id on public.course_assignments(course_id);
create index if not exists idx_course_assignments_status on public.course_assignments(status);

-- Enable RLS
alter table public.course_assignments enable row level security;

-- RLS Policies
create policy "ATCOs can view own assignments" 
  on public.course_assignments
  for select 
  using (assigned_to = auth.uid());

create policy "Training officers can view all assignments" 
  on public.course_assignments
  for select 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('training_officer', 'admin', 'head_of_training')
    )
  );

create policy "Training officers can create assignments" 
  on public.course_assignments
  for insert 
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('training_officer', 'admin', 'head_of_training')
    )
  );

create policy "Training officers can update assignments" 
  on public.course_assignments
  for update 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('training_officer', 'admin', 'head_of_training')
    )
  );

create policy "ATCOs can update own assignment status" 
  on public.course_assignments
  for update 
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

create policy "Training officers can delete assignments" 
  on public.course_assignments
  for delete 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('training_officer', 'admin', 'head_of_training')
    )
  );

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger set_updated_at
  before update on public.course_assignments
  for each row
  execute procedure public.handle_updated_at();
