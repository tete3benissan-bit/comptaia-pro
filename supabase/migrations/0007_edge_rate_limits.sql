-- Rate limiting store for the 2 public Edge Functions (create-company,
-- invite-user). Edge Functions are stateless between invocations, so an
-- in-memory counter can't be trusted - this table is the persistent
-- counter instead. Only ever touched by the service_role client inside
-- the Edge Functions themselves: RLS is enabled with NO policies, which
-- means the default-deny applies to every other role (anon/authenticated)
-- - no client-side code can read or write this table, by design.

create table public.edge_rate_limits (
  id         bigint generated always as identity primary key,
  bucket     text not null,
  created_at timestamptz not null default now()
);

create index edge_rate_limits_bucket_idx on public.edge_rate_limits(bucket, created_at);

alter table public.edge_rate_limits enable row level security;

-- Old rows are pure noise past the longest window any caller uses (15 min)
-- - cheap opportunistic cleanup, run inline by whichever request happens to
-- trigger it, so this table never grows unbounded without needing a cron.
create or replace function public.edge_rate_limits_gc()
returns void language sql security definer set search_path = public as $$
  delete from public.edge_rate_limits where created_at < now() - interval '1 day'
$$;
