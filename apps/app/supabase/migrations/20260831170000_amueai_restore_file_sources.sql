-- Re-adds the "file" source type, per request: uploaded documents (PDF,
-- Word, Excel, PowerPoint, CSV, EPUB, RTF, OpenDocument) are parsed by
-- Firecrawl's /v2/parse endpoint (see lib/ingestion.ts's extractFileText),
-- the same way URL sources are parsed by /scrape. Ingestion for both types
-- now runs via the Trigger.dev "ingest-source" task instead of inline on
-- the request path.
alter table public.sources drop constraint sources_type_check;
alter table public.sources add constraint sources_type_check check (type in ('url', 'file'));

-- Restores the "sources" Storage bucket's RLS policies dropped in
-- 20260828011656_amueai_url_only_sources.sql now that file uploads are
-- back. Path convention org_id/agent_id/filename, matching the org_id
-- folder-segment check.
create policy "Org members can read their org's files"
on storage.objects for select to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = (select auth.jwt()->>'org_id') );

create policy "Org members can upload to their org's folder"
on storage.objects for insert to authenticated
with check ( bucket_id = 'sources' and (storage.foldername(name))[1] = (select auth.jwt()->>'org_id') );

create policy "Org members can delete their org's files"
on storage.objects for delete to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = (select auth.jwt()->>'org_id') );

-- Widens the bucket's allowed MIME types to match everything Firecrawl's
-- document parser supports (previously only plain text, PDF, and .docx,
-- from before Firecrawl parsing existed in this app). Size limit stays at
-- 20MB - Firecrawl (not this app's server) does the heavy parsing, but the
-- upload itself still passes through our own Storage quota.
update storage.buckets
set allowed_mime_types = array[
  'text/plain',
  'text/csv',
  'application/rtf',
  'application/epub+zip',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation'
]
where id = 'sources';
