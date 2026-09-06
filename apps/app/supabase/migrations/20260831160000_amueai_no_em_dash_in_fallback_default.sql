-- The previous default used an em dash, which reads as AI-generated
-- boilerplate rather than something a real support team would write.
alter table public.agents
  alter column fallback_message
  set default 'Thanks for your message! I''m not able to help with that right now. Please reach out to our team directly and we''ll get back to you.';

-- Only rows still on the em-dash default get updated - a row an agent
-- owner already customized is left untouched.
update public.agents
set fallback_message = 'Thanks for your message! I''m not able to help with that right now. Please reach out to our team directly and we''ll get back to you.'
where fallback_message = 'Thanks for your message! I''m not able to help with that right now — please reach out to our team directly and we''ll get back to you.';
