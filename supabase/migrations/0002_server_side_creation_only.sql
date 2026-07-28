-- Plus aucune création de compte/entreprise ne se fait depuis le navigateur
-- (create-company et invite-user, tous deux via service_role, font ce
-- travail). On retire donc les policies/grants d'insertion client-side qui
-- n'ont plus lieu d'être.
drop policy if exists companies_insert_self on public.companies;
drop policy if exists profiles_insert_bootstrap on public.profiles;
revoke insert on public.companies from authenticated;
revoke insert on public.profiles from authenticated;
