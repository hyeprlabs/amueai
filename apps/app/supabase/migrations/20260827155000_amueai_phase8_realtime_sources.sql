-- Drives the queued/processing/ready/failed status UI live via
-- Supabase Realtime (Postgres Changes). No table was in the
-- supabase_realtime publication yet on this project.
alter publication supabase_realtime add table public.sources;
