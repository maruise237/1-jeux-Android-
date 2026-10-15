// Idempotent: safe to run on every cold start of an admin call.
export const SCHEMA = `
create table if not exists events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  device_id text not null check (char_length(device_id) between 8 and 64),
  type text not null check (type in ('session', 'level_start', 'level_end', 'purchase', 'promo_view', 'promo_click')),
  level int check (level between 0 and 100000),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 2048),
  app_version text check (char_length(app_version) <= 20)
);
create index if not exists events_created_idx on events (created_at);
create index if not exists events_type_idx on events (type, created_at);
create index if not exists events_device_idx on events (device_id, created_at);

create table if not exists promos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  active boolean not null default false,
  title text not null check (char_length(title) between 1 and 60),
  body text not null default '' check (char_length(body) <= 240),
  cta_label text not null default 'En savoir plus' check (char_length(cta_label) between 1 and 24),
  url text not null check (url ~ '^https://'),
  image_url text check (image_url is null or image_url ~ '^https://'),
  starts_at timestamptz,
  ends_at timestamptz,
  min_level int not null default 3 check (min_level >= 1),
  every_hours int not null default 24 check (every_hours between 1 and 720),
  priority int not null default 0
);

create or replace function kam_stats(p_days int) returns jsonb language plpgsql stable as $$
declare
  since timestamptz := date_trunc('day', now()) - make_interval(days => greatest(1, least(p_days, 365)) - 1);
  out jsonb;
begin
  with first_seen as (
    select device_id, min(created_at) as t0 from events group by device_id
  ), per_day as (
    select date_trunc('day', created_at) as d, count(distinct device_id) as active,
      count(*) filter (where type = 'level_end') as games
    from events where created_at >= since group by 1
  ), new_day as (
    select date_trunc('day', t0) as d, count(*) as installs from first_seen where t0 >= since group by 1
  ), daily as (
    select g.d, coalesce(p.active, 0) as active, coalesce(n.installs, 0) as installs, coalesce(p.games, 0) as games
    from generate_series(since, date_trunc('day', now()), interval '1 day') as g(d)
    left join per_day p on p.d = g.d left join new_day n on n.d = g.d
  ), lv as (
    select level,
      count(*) filter (where type = 'level_start') as starts,
      count(*) filter (where type = 'level_end' and (data->>'won')::boolean) as wins,
      count(*) filter (where type = 'level_end' and not coalesce((data->>'won')::boolean, false)) as losses,
      round(avg((data->>'secs')::numeric) filter (where type = 'level_end' and (data->>'won')::boolean)) as avg_secs
    from events where created_at >= since and type in ('level_start', 'level_end') and level is not null
    group by level
  ), reach as (
    select max(level) as top from events where level is not null group by device_id
  ), buys as (
    select data->>'item' as item, count(*) as n, sum(coalesce((data->>'price')::int, 0)) as gems
    from events where type = 'purchase' and created_at >= since group by 1
  ), pr as (
    select (data->>'promo')::bigint as promo,
      count(*) filter (where type = 'promo_view') as views,
      count(*) filter (where type = 'promo_click') as clicks
    from events where type in ('promo_view', 'promo_click') and created_at >= since group by 1
  ), cohort as (
    select f.device_id, f.t0 from first_seen f where f.t0 >= since and f.t0 < now() - interval '1 day'
  )
  select jsonb_build_object(
    'since', since,
    'players_total', (select count(*) from first_seen),
    'active_1d', (select count(distinct device_id) from events where created_at >= now() - interval '1 day'),
    'active_7d', (select count(distinct device_id) from events where created_at >= now() - interval '7 days'),
    'active_30d', (select count(distinct device_id) from events where created_at >= now() - interval '30 days'),
    'games', (select count(*) from events where type = 'level_end' and created_at >= since),
    'wins', (select count(*) from events where type = 'level_end' and (data->>'won')::boolean and created_at >= since),
    'sessions', (select count(*) from events where type = 'session' and created_at >= since),
    'retention_d1', (select round(100.0 * count(*) filter (where exists (
        select 1 from events e where e.device_id = c.device_id and e.created_at >= c.t0 + interval '1 day' and e.created_at < c.t0 + interval '2 days'
      )) / nullif(count(*), 0)) from cohort c),
    'retention_d7', (select round(100.0 * count(*) filter (where exists (
        select 1 from events e where e.device_id = c.device_id and e.created_at >= c.t0 + interval '7 days' and e.created_at < c.t0 + interval '8 days'
      )) / nullif(count(*), 0)) from cohort c where c.t0 < now() - interval '7 days'),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', to_char(d, 'YYYY-MM-DD'), 'active', active, 'installs', installs, 'games', games) order by d), '[]') from daily),
    'levels', (select coalesce(jsonb_agg(jsonb_build_object('level', level, 'starts', starts, 'wins', wins, 'losses', losses, 'avg_secs', avg_secs) order by level), '[]') from lv),
    'reach', (select coalesce(jsonb_agg(jsonb_build_object('level', top, 'players', n) order by top), '[]') from (select top, count(*) as n from reach group by top) r),
    'purchases', (select coalesce(jsonb_agg(jsonb_build_object('item', item, 'n', n, 'gems', gems) order by n desc), '[]') from buys),
    'promos', (select coalesce(jsonb_agg(jsonb_build_object('promo', promo, 'views', views, 'clicks', clicks)), '[]') from pr),
    'versions', (select coalesce(jsonb_agg(jsonb_build_object('version', v, 'players', n) order by n desc), '[]') from (
        select coalesce(app_version, '?') as v, count(distinct device_id) as n from events where created_at >= since group by 1) x)
  ) into out;
  return out;
end;
$$;
`;
