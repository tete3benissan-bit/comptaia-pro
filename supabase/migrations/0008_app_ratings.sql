-- Retours utilisateurs (Paramètres > Votre avis) : note 1-5 + commentaire
-- facultatif. Écriture depuis l'app, lecture pensée pour l'éditeur (via
-- le dashboard/l'API Supabase directement) plutôt que via une vue
-- multi-entreprises dans l'app elle-même - un utilisateur ordinaire ne
-- doit voir ni modifier les avis des autres entreprises.

create table public.app_ratings (
  id          bigint generated always as identity primary key,
  company_id  uuid references public.companies(id) on delete set null,
  user_id     uuid references auth.users(id) on delete set null,
  note        smallint not null check (note between 1 and 5),
  commentaire text,
  created_at  timestamptz not null default now()
);

alter table public.app_ratings enable row level security;

create policy app_ratings_insert on public.app_ratings
  for insert to authenticated
  with check (company_id = public.my_company_id() and user_id = auth.uid());

-- Nécessaire pour que PostgREST puisse relire la ligne après l'insertion
-- (comportement par défaut de supabase-js) - ne donne accès qu'à ses
-- propres avis, jamais à ceux des autres utilisateurs/entreprises.
create policy app_ratings_select_own on public.app_ratings
  for select using (user_id = auth.uid());

grant select, insert on public.app_ratings to authenticated;
