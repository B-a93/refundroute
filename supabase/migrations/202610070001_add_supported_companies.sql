insert into public.companies (slug, name, official_website, support_url, active, last_verified_at)
values
  ('netflix', 'Netflix', 'https://www.netflix.com/', 'https://help.netflix.com/', true, now()),
  ('spotify', 'Spotify', 'https://www.spotify.com/', 'https://support.spotify.com/', true, now()),
  ('amazon-prime', 'Amazon Prime', 'https://www.amazon.com/amazonprime', 'https://www.amazon.com/hz/contact-us', true, now()),
  ('youtube-premium', 'YouTube Premium', 'https://www.youtube.com/premium', 'https://support.google.com/youtube/', true, now()),
  ('dropbox', 'Dropbox', 'https://www.dropbox.com/', 'https://www.dropbox.com/support', true, now()),
  ('linkedin-premium', 'LinkedIn Premium', 'https://www.linkedin.com/premium/', 'https://www.linkedin.com/help/linkedin/', true, now()),
  ('nordvpn', 'NordVPN', 'https://nordvpn.com/', 'https://support.nordvpn.com/', true, now()),
  ('chatgpt', 'ChatGPT', 'https://chatgpt.com/', 'https://help.openai.com/', true, now())
on conflict (slug) do update
set
  name = excluded.name,
  official_website = excluded.official_website,
  support_url = excluded.support_url,
  active = excluded.active,
  last_verified_at = excluded.last_verified_at;

insert into public.billing_descriptors (company_id, descriptor, route)
select id, 'NETFLIX.COM', 'direct'::public.purchase_route from public.companies where slug = 'netflix'
union all select id, 'SPOTIFY', 'direct'::public.purchase_route from public.companies where slug = 'spotify'
union all select id, 'AMAZON PRIME', 'direct'::public.purchase_route from public.companies where slug = 'amazon-prime'
union all select id, 'GOOGLE*YOUTUBE', 'google_play'::public.purchase_route from public.companies where slug = 'youtube-premium'
union all select id, 'DROPBOX', 'direct'::public.purchase_route from public.companies where slug = 'dropbox'
union all select id, 'LINKEDIN', 'direct'::public.purchase_route from public.companies where slug = 'linkedin-premium'
union all select id, 'NORDVPN', 'direct'::public.purchase_route from public.companies where slug = 'nordvpn'
union all select id, 'OPENAI*CHATGPT', 'direct'::public.purchase_route from public.companies where slug = 'chatgpt'
on conflict (company_id, descriptor, route) do nothing;
