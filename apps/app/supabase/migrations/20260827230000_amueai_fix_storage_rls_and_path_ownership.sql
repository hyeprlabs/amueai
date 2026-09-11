-- The "sources" storage bucket's policies were never migrated onto
-- public.clerk_org_id() when the table RLS policies were (see
-- 20260827215000) - they still read auth.jwt()->>'org_id' directly, which
-- is NULL for this account's JWT shape. That means uploads have been
-- silently rejected by the INSERT policy this whole time. Rebuilding all
-- three from the same canonical function fixes uploads and keeps read/
-- delete consistent with it.
drop policy if exists "Org members can upload to their org's folder" on storage.objects;
drop policy if exists "Org members can read their org's files" on storage.objects;
drop policy if exists "Org members can delete their org's files" on storage.objects;

create policy "Org members can upload to their org's folder"
on storage.objects for insert to authenticated
with check ( bucket_id = 'sources' and (storage.foldername(name))[1] = public.clerk_org_id() );

create policy "Org members can read their org's files"
on storage.objects for select to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = public.clerk_org_id() );

create policy "Org members can delete their org's files"
on storage.objects for delete to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = public.clerk_org_id() );
