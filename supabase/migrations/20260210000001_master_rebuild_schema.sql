-- MASTER REBUILD SCHEMA: System-First Hardening
-- ADHERING TO MASTER INSTRUCTION SECTION 3 & 4 (Converted to Lowercase Standard)

-- 1. ENUMS (Standardized to Lowercase)
do $$ begin
  create type public.user_role as enum ('training_officer','atco','ojti','admin','instructor','head_of_training');
exception
  when duplicate_object then 
    begin
        alter type public.user_role add value if not exists 'training_officer';
        alter type public.user_role add value if not exists 'atco';
        alter type public.user_role add value if not exists 'ojti';
        alter type public.user_role add value if not exists 'admin';
        alter type public.user_role add value if not exists 'instructor';
        alter type public.user_role add value if not exists 'head_of_training';
    exception when others then null; end;
end $$;

do $$ begin
  create type public.course_status as enum ('draft','published','archived');
exception
  when duplicate_object then 
    begin
        alter type public.course_status add value if not exists 'draft';
        alter type public.course_status add value if not exists 'published';
        alter type public.course_status add value if not exists 'archived';
    exception when others then null; end;
end $$;

do $$ begin
  create type public.assessment_status as enum ('draft','published','closed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.grading_mode as enum ('auto','manual');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.assignment_status as enum ('assigned','in_progress','completed','expired');
exception
  when duplicate_object then null;
end $$;

-- 2. TABLES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'atco',
  full_name text,
  email text,
  initials text,
  is_ojti boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.course_status not null default 'draft',
  version int not null default 1,
  owner_id uuid not null references public.profiles(id),
  builder_state jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  version_label text,
  builder_state jsonb not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  order_index int not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  status public.assessment_status not null default 'draft',
  grading public.grading_mode not null default 'auto',
  pass_mark int not null default 70,
  time_limit_minutes int,
  attempts_allowed int not null default 1,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  type text not null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb,
  points int not null default 1,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  atco_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  status public.assignment_status not null default 'assigned',
  due_date date,
  mandatory boolean not null default true,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, atco_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  atco_id uuid not null references public.profiles(id) on delete cascade,
  attempt int not null default 1,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  needs_manual boolean not null default false,
  graded boolean not null default false,
  graded_by uuid references public.profiles(id),
  graded_at timestamptz
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  atco_id uuid not null references public.profiles(id),
  course_id uuid references public.courses(id),
  assessment_id uuid not null references public.assessments(id),
  score int not null,
  pass boolean not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 3. TRIGGERS
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists modules_set_updated_at on public.modules;
create trigger modules_set_updated_at before update on public.modules
for each row execute function public.set_updated_at();

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at before update on public.assessments
for each row execute function public.set_updated_at();

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at before update on public.questions
for each row execute function public.set_updated_at();

drop trigger if exists assignments_set_updated_at on public.assignments;
create trigger assignments_set_updated_at before update on public.assignments
for each row execute function public.set_updated_at();

-- 4. RLS POLICIES
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_versions enable row level security;
alter table public.modules enable row level security;
alter table public.assessments enable row level security;
alter table public.questions enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.results enable row level security;
alter table public.audit_logs enable row level security;

-- Profile Policies
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (id = auth.uid());
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (id = auth.uid());

-- Helpers
create or replace function public.is_officer()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('training_officer','admin','head_of_training')
  );
$$;

create or replace function public.is_atco()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('atco','ojti','instructor')
  );
$$;

-- Global Officer Access
drop policy if exists officer_all_courses on public.courses;
create policy officer_all_courses on public.courses for all using (public.is_officer()) with check (public.is_officer());
drop policy if exists officer_all_modules on public.modules;
create policy officer_all_modules on public.modules for all using (public.is_officer()) with check (public.is_officer());
drop policy if exists officer_all_assessments on public.assessments;
create policy officer_all_assessments on public.assessments for all using (public.is_officer()) with check (public.is_officer());
drop policy if exists officer_all_questions on public.questions;
create policy officer_all_questions on public.questions for all using (public.is_officer()) with check (public.is_officer());
drop policy if exists officer_all_assignments on public.assignments;
create policy officer_all_assignments on public.assignments for all using (public.is_officer()) with check (public.is_officer());
drop policy if exists officer_all_submissions on public.submissions;
create policy officer_all_submissions on public.submissions for all using (public.is_officer()) with check (public.is_officer());
drop policy if exists officer_all_results on public.results;
create policy officer_all_results on public.results for all using (public.is_officer()) with check (public.is_officer());
drop policy if exists officer_all_audit on public.audit_logs;
create policy officer_all_audit on public.audit_logs for all using (public.is_officer()) with check (public.is_officer());

-- ATCO Access
drop policy if exists atco_read_assignments on public.assignments;
create policy atco_read_assignments on public.assignments for select using (public.is_atco() and atco_id = auth.uid());
drop policy if exists atco_read_published_courses on public.courses;
create policy atco_read_published_courses on public.courses for select using (public.is_atco() and status = 'published' and exists (select 1 from public.assignments a where a.course_id = courses.id and a.atco_id = auth.uid()));
drop policy if exists atco_read_modules_for_assigned_courses on public.modules;
create policy atco_read_modules_for_assigned_courses on public.modules for select using (public.is_atco() and exists (select 1 from public.assignments a join public.courses c on c.id = a.course_id where a.course_id = modules.course_id and a.atco_id = auth.uid() and c.status = 'published'));
drop policy if exists atco_read_assessments_for_assigned_courses on public.assessments;
create policy atco_read_assessments_for_assigned_courses on public.assessments for select using (public.is_atco() and status = 'published' and (course_id is null or exists (select 1 from public.assignments a where a.course_id = assessments.course_id and a.atco_id = auth.uid())));
drop policy if exists atco_insert_own_submissions on public.submissions;
create policy atco_insert_own_submissions on public.submissions for insert with check (public.is_atco() and atco_id = auth.uid());
drop policy if exists atco_read_own_submissions on public.submissions;
create policy atco_read_own_submissions on public.submissions for select using (public.is_atco() and atco_id = auth.uid());
drop policy if exists atco_read_own_results on public.results;
create policy atco_read_own_results on public.results for select using (public.is_atco() and atco_id = auth.uid());
