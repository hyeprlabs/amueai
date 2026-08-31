-- The pre-existing default shipped a literal, unresolved "{contact}"
-- placeholder to every new agent - there's no template-substitution
-- mechanism anywhere in the app, so any agent that never customized this
-- field would show that broken-looking text to real visitors. Replace it
-- with a ready-to-use default; agent owners can still personalize it
-- (mention an email, a link) via the new Fallback message field in
-- Settings.
alter table public.agents
  alter column fallback_message
  set default 'Thanks for your message! I''m not able to help with that right now — please reach out to our team directly and we''ll get back to you.';

-- Only rows still on the old broken default get updated - a row an agent
-- owner already customized is left untouched.
update public.agents
set fallback_message = 'Thanks for your message! I''m not able to help with that right now — please reach out to our team directly and we''ll get back to you.'
where fallback_message = 'Thanks for your message — I can''t answer right now. Please reach us at {contact}.';
