-- Sources are URL-only for now - text/file/Q&A ingestion (and the
-- Trigger.dev task they depended on) have been removed from the app
-- entirely. No non-url rows exist to migrate (verified before writing
-- this), so this is a straight constraint tightening.
alter table public.sources drop constraint sources_type_check;
alter table public.sources add constraint sources_type_check check (type = 'url');

-- The "sources" Storage bucket only ever existed for the "file" source
-- type's uploads and has zero objects in it. Its RLS policies are dead
-- code now that nothing uploads to it - dropped here. The empty bucket
-- itself is left in place: `storage.buckets` rejects direct SQL DELETEs
-- ("Direct deletion from storage tables is not allowed. Use the Storage
-- API instead.") and has to be removed via the Supabase dashboard or the
-- Storage API/CLI instead.
drop policy if exists "Org members can read their org's files" on storage.objects;
drop policy if exists "Org members can upload to their org's folder" on storage.objects;
drop policy if exists "Org members can delete their org's files" on storage.objects;
