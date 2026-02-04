-- Allow location_id to be null for sessions (when using manual entry)
alter table public.sessions alter column location_id drop not null;
