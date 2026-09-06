-- Fixes "new row violates row-level security policy" on every file upload
-- to the "sources" bucket: the Storage policies restored in
-- 20260831170000_amueai_restore_file_sources.sql were copied from the
-- original (pre-fix) phase6 migration and still compared against the flat
-- `auth.jwt()->>'org_id'` claim. That claim is NULL under Clerk's current
-- v2/"compact" session token shape (org id nests under `o.id` instead) -
-- exactly the bug 20260827215000_amueai_fix_org_claim_jwt_shape.sql already
-- fixed for every table's RLS policies via public.clerk_org_id(), but the
-- Storage policies were re-added after that fix and never got it.
drop policy if exists "Org members can read their org's files" on storage.objects;
drop policy if exists "Org members can upload to their org's folder" on storage.objects;
drop policy if exists "Org members can delete their org's files" on storage.objects;

create policy "Org members can read their org's files"
on storage.objects for select to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = public.clerk_org_id() );

create policy "Org members can upload to their org's folder"
on storage.objects for insert to authenticated
with check ( bucket_id = 'sources' and (storage.foldername(name))[1] = public.clerk_org_id() );

create policy "Org members can delete their org's files"
on storage.objects for delete to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = public.clerk_org_id() );
