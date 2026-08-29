-- Brand profile captured from the agent's source website during onboarding.
--
-- Stored as jsonb rather than broken into columns: the shape comes straight
-- from Firecrawl's `branding` scrape format (BrandingProfile - brandName,
-- logo, colors, fonts, typography), which is a nested, provider-owned
-- structure that gains fields over time. Flattening it would mean a
-- migration every time Firecrawl adds one, and nothing here is queried
-- relationally - it's read whole to theme the widget.
alter table public.agents
  add column if not exists brand jsonb;

comment on column public.agents.brand is
  'Firecrawl BrandingProfile for the agent''s source site (brandName, logo, colors, fonts). Null until a website source is scraped.';
