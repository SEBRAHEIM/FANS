-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ROLES TYPE
create type user_role as enum ('atco', 'instructor', 'admin');

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role user_role default 'atco' not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COURSES
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LOCATIONS
create table public.locations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SESSIONS
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  instructor_id uuid references public.profiles(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  capacity integer default 20,
  status text default 'scheduled' check (status in ('scheduled', 'in-progress', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENROLLMENTS
create table public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'enrolled' check (status in ('enrolled', 'attended', 'failed', 'cancelled')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, user_id)
);

-- ONLINE MODULES
create table public.online_modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MODULE PARTS
create table public.module_parts (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.online_modules(id) on delete cascade not null,
  title text not null,
  content text,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MODULE QUESTIONS
create table public.module_questions (
  id uuid default uuid_generate_v4() primary key,
  module_part_id uuid references public.module_parts(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null, -- Array of strings
  correct_option_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- QUESTION ATTEMPTS
create table public.question_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id uuid references public.module_questions(id) on delete cascade not null,
  selected_option_index integer not null,
  is_correct boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REMINDER JOBS
create table public.reminder_jobs (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  type text default 'pre_session_10d',
  scheduled_at timestamp with time zone not null,
  status text default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AUDIT LOGS
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES --

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.locations enable row level security;
alter table public.sessions enable row level security;
alter table public.enrollments enable row level security;
alter table public.online_modules enable row level security;
alter table public.module_parts enable row level security;
alter table public.module_questions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.reminder_jobs enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: Users can view their own profile, admins can view all
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Courses: Everyone authenticated can view, only admins can manage
create policy "Everyone authenticated can view courses" on public.courses for select using (auth.role() = 'authenticated');
create policy "Admins can manage courses" on public.courses for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Similarly for other tables... (simplified for brevity)
create policy "Admins can manage locations" on public.locations for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins can manage sessions" on public.sessions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Instructors can view assigned sessions" on public.sessions for select using (
  instructor_id = auth.uid()
);

create policy "ATCOs can view enrolled sessions" on public.sessions for select using (
  exists (select 1 from public.enrollments where session_id = public.sessions.id and user_id = auth.uid())
);

-- Enrollments
create policy "Users can view own enrollments" on public.enrollments for select using (user_id = auth.uid());
create policy "Instructors can view enrollments for their sessions" on public.enrollments for select using (
  exists (select 1 from public.sessions where id = session_id and instructor_id = auth.uid())
);
create policy "Admins can manage enrollments" on public.enrollments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Real-time function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', (coalesce(new.raw_user_meta_data->>'role', 'atco'))::user_role);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
