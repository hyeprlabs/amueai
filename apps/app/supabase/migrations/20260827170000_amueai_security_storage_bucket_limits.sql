-- Security hardening found in a follow-up review: the sources bucket had
-- no size or MIME-type limit, so any authenticated org member could
-- upload arbitrarily large files that extractFileText then loads
-- entirely into memory (pdf-parse/mammoth), a DoS vector.
update storage.buckets
set file_size_limit = 20971520, -- 20MB
    allowed_mime_types = array[
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'sources';
