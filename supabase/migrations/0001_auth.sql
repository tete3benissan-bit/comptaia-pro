-- Phase 1 : entreprises, profils utilisateurs, RLS multi-tenant.

create table public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- profiles.email est une copie dénormalisée de auth.users.email :
-- auth.users vit dans un schéma protégé qu'un client authentifié ordinaire
-- ne peut pas lire directement (seule l'Admin API / service_role le peut),
-- donc "Gestion des utilisateurs" n'a pas d'autre moyen d'afficher l'email
-- de chacun sans cette copie.
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  nom        text not null,
  email      text not null,
  role       text not null default 'comptable'
             check (role in ('admin','exploitant','comptable','expert_comptable','fiscaliste','rh')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.profiles  enable row level security;

-- Fonctions security definer : évitent qu'une policy sur profiles se
-- reréférence elle-même à l'infini (récursion RLS classique).
create or replace function public.my_company_id()
returns uuid language sql security definer stable set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and active = true)
$$;

-- companies : un membre voit sa propre entreprise
create policy companies_select on public.companies
  for select using (id = public.my_company_id());

-- companies : auto-création possible uniquement si l'utilisateur n'a
-- encore AUCUN profil (le cas "je crée mon entreprise")
create policy companies_insert_self on public.companies
  for insert to authenticated
  with check (not exists (select 1 from public.profiles where id = auth.uid()));

-- profiles : voit tous les profils de sa propre entreprise
create policy profiles_select on public.profiles
  for select using (company_id = public.my_company_id());

-- profiles : auto-insertion en tant qu'admin d'une entreprise toute neuve
-- (uniquement si personne n'a encore de profil dans cette entreprise)
create policy profiles_insert_bootstrap on public.profiles
  for insert to authenticated
  with check (
    id = auth.uid() and role = 'admin'
    and not exists (select 1 from public.profiles p2 where p2.company_id = profiles.company_id)
  );

-- profiles : un admin peut modifier role/active/nom de sa propre entreprise
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin() and company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant usage on schema public to authenticated;
grant select, insert on public.companies to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant execute on function public.my_company_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
