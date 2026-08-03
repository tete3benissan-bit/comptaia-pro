-- Étape A2 (évolution ERP multi-pays/secteur) : ajoute forme_juridique à
-- companies. Valeur par défaut 'sarl' pour rester rétrocompatible avec les
-- entreprises déjà créées avant cette migration.

alter table public.companies
  add column forme_juridique text not null default 'sarl';
