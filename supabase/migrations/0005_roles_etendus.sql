-- Phase 4 (ERP multi-pays/multi-secteur) : élargit la liste des rôles
-- autorisés. Doit rester synchronisé avec ROLES dans js/22-permissions.js
-- et allowedRoles dans supabase/functions/invite-user/index.ts.

alter table public.profiles drop constraint profiles_role_check;

alter table public.profiles add constraint profiles_role_check
  check (role in (
    'admin','directeur','exploitant','comptable','expert_comptable',
    'fiscaliste','rh','caissier','gestionnaire_stock','commercial','auditeur'
  ));
