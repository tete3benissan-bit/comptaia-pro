-- Phase 1 (ERP multi-pays/multi-secteur) : ajoute pays/secteur à companies.
-- Valeurs par défaut = comportement actuel (Togo, commerce) pour que les
-- entreprises déjà créées avant cette migration restent inchangées.
-- Aucun moteur comptable ne lit encore ces colonnes (voir Phase 2 du plan,
-- non conçue) - ce sont pour l'instant des métadonnées pures.

alter table public.companies
  add column pays text not null default 'tg',
  add column secteur text not null default 'commerce';
