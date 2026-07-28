-- Phase 2 : synchronisation cloud du blob de données cœur (comptaia_data).
-- module_key est ajouté dès maintenant (coût nul) pour que les futurs
-- modules (RH, devis...) réutilisent exactement le même mécanisme plus tard.

create table public.company_data (
  company_id uuid not null references public.companies(id) on delete cascade,
  module_key text not null default 'core',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  primary key (company_id, module_key)
);

alter table public.company_data enable row level security;

create policy company_data_select on public.company_data
  for select using (company_id = public.my_company_id());

create policy company_data_insert on public.company_data
  for insert to authenticated
  with check (company_id = public.my_company_id());

create policy company_data_update on public.company_data
  for update using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant select, insert, update on public.company_data to authenticated;
