-- Allow end_date to be null for sessions
alter table public.sessions alter column end_date drop not null;
