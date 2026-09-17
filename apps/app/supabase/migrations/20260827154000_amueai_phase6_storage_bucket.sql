-- Private bucket for uploaded file sources, path convention
-- org_id/chatbot_id/filename (matches the RLS check on the org_id
-- folder segment). Never made public - Phase 11's audit confirms
-- objects aren't listable/guessable outside their own org.
insert into storage.buckets (id, name, public)
values ('sources', 'sources', false)
on conflict (id) do nothing;

create policy "Org members can read their org's files"
on storage.objects for select to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = (select auth.jwt()->>'org_id') );

create policy "Org members can upload to their org's folder"
on storage.objects for insert to authenticated
with check ( bucket_id = 'sources' and (storage.foldername(name))[1] = (select auth.jwt()->>'org_id') );

create policy "Org members can delete their org's files"
on storage.objects for delete to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = (select auth.jwt()->>'org_id') );
