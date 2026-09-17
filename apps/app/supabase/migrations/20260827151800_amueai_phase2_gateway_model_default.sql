-- The skill mandates AI Gateway "provider/model" strings only (never a
-- bare model name that would imply calling a provider SDK directly).
alter table public.chatbots alter column model set default 'openai/gpt-4o-mini';
