-- Add calendar_token to profiles for secure iCal feeds
alter table public.profiles add column if not exists calendar_token uuid default uuid_generate_v4();

-- Ensure all existing profiles have a token
update public.profiles set calendar_token = uuid_generate_v4() where calendar_token is null;

-- Add missing columns to sessions table for direct assignments and manual entries
alter table public.sessions add column if not exists atco_id uuid references public.profiles(id) on delete cascade;
alter table public.sessions add column if not exists course_manual text;
alter table public.sessions add column if not exists location_manual text;
alter table public.sessions add column if not exists notes text;
alter table public.sessions add column if not exists ojti_id uuid references public.profiles(id) on delete set null;
alter table public.sessions add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- Allow course_id to be null for sessions (when using manual entry)
alter table public.sessions alter column course_id drop not null;

-- Add index
create index if not exists idx_profiles_calendar_token on public.profiles(calendar_token);
