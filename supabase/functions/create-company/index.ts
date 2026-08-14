// Edge Function: create-company
// The one self-serve path: creating a brand-new company makes you its admin.
// Runs server-side (service_role) so the account can be created already
// confirmed (email_confirm:true) - this sidesteps whatever this project's
// email-confirmation setting is, which would otherwise leave signUp() with
// no active session and make the client-side company/profile inserts fail
// under RLS. No caller JWT is required/checked here (there's no existing
// admin to authorize against yet), unlike invite-user.
//
// Security hardening pass: this is the one endpoint that lets an anonymous
// caller create a real account with service_role privileges behind it - the
// single highest-value target for abuse (signup spam, brute-forcing emails
// to see which exist via error-message timing, oversized payloads). Rate
// limiting is keyed on the caller's IP (no session/email to key on before
// the account exists) via the shared public.edge_rate_limits table, since
// Edge Functions don't keep in-memory state across invocations.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Verrouillé sur l'origine réelle de l'app plutôt que "*" - une protection
// d'appoint (CORS ne bloque que les appels navigateur depuis un autre
// site, pas un script/curl direct), le vrai rempart reste le rate limit
// et la validation ci-dessous.
const ALLOWED_ORIGIN = "https://tete3benissan-bit.github.io";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BODY_BYTES = 10_000; // large marge au-dessus d'un vrai payload (~300 octets typiques)
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Copie serveur de js/00b-pays-secteur.js (Deno ne peut pas importer un
// fichier du front) - garde la même liste de clés valides des deux côtés.
// Un pays/secteur non reconnu retombe silencieusement sur le défaut plutôt
// que de bloquer la création : cette liste est purement indicative pour le
// moment (aucun moteur comptable ne la lit encore, voir Phase 2 du plan),
// donc une valeur inattendue ne doit jamais empêcher un utilisateur réel de
// créer son entreprise.
const PAYS_VALIDES = [
  "tg", "ci", "sn", "bj", "bf", "ml", "ne", "cm",
  "ga", "cf", "cg", "td", "gn", "gw", "gq", "cd", "km",
];
const SECTEURS_VALIDES = [
  "commerce", "service", "btp", "sante", "hotellerie", "restauration",
  "transport", "agriculture", "elevage", "industrie", "import_export",
  "pharmacie", "education", "immobilier", "cabinet_comptable",
  "cabinet_juridique", "ong", "association", "cooperative", "banque",
  "assurance", "telecom", "artisanat", "autre",
];
// Copie serveur de js/00d-forme-juridique.js - même raison/même motif que
// PAYS_VALIDES/SECTEURS_VALIDES ci-dessus.
const FORMES_JURIDIQUES_VALIDES = [
  "entreprise_individuelle", "entrepreneur_individuel", "sarl", "sarlu",
  "sa", "sas", "sasu", "snc", "scs", "gie", "cooperative", "association",
  "ong", "etablissement_public", "societe_civile", "fondation", "filiale",
  "succursale", "autre",
];

function callerIp(req: Request): string {
  // Supabase Edge Functions sit behind a proxy - x-forwarded-for carries
  // the real client IP as the first entry (rest is intermediate proxies).
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || "unknown";
}

async function rateLimited(
  supabaseAdmin: ReturnType<typeof createClient>,
  bucket: string,
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("edge_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("created_at", since);
  if (error) {
    console.error("rate limit check failed, failing open:", error.message);
    return false; // panne infra != faute de l'appelant - on ne bloque pas tout le monde pour ça
  }
  if ((count ?? 0) >= MAX_ATTEMPTS) return true;
  await supabaseAdmin.from("edge_rate_limits").insert({ bucket });
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  // Garde-fou taille AVANT de parser quoi que ce soit - un Content-Length
  // absent (chunked) passe ce test et sera de toute façon rejeté par la
  // limite de longueur de champs plus bas une fois le JSON parsé.
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: "Requête trop volumineuse." }, 413);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip = callerIp(req);
  if (await rateLimited(supabaseAdmin, `create-company:ip:${ip}`)) {
    return json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps de requête invalide (JSON malformé)." }, 400);
  }
  if (!body || typeof body !== "object") {
    return json({ error: "Corps de requête invalide." }, 400);
  }

  const entreprise = String(body.entreprise ?? "").trim();
  const nom = String(body.nom ?? "").trim();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const pays = String(body.pays ?? "");
  const secteur = String(body.secteur ?? "");
  const formeJuridique = String(body.formeJuridique ?? "");

  if (!entreprise || !nom || !email || !password) {
    return json({ error: "Tous les champs sont requis." }, 400);
  }
  if (entreprise.length > 200 || nom.length > 200) {
    return json({ error: "Nom trop long (200 caractères max)." }, 400);
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ error: "Adresse e-mail invalide." }, 400);
  }
  if (password.length < 6) {
    return json({ error: "Mot de passe trop court (min. 6 caractères)." }, 400);
  }
  if (password.length > 128) {
    return json({ error: "Mot de passe trop long (128 caractères max)." }, 400);
  }

  const paysFinal = PAYS_VALIDES.includes(pays) ? pays : "tg";
  const secteurFinal = SECTEURS_VALIDES.includes(secteur) ? secteur : "commerce";
  const formeJuridiqueFinale = FORMES_JURIDIQUES_VALIDES.includes(formeJuridique) ? formeJuridique : "sarl";

  try {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nom },
    });
    if (createErr || !created?.user) {
      return json({ error: createErr?.message || "Échec de la création du compte (email déjà utilisé ?)." }, 400);
    }

    const { data: company, error: companyErr } = await supabaseAdmin
      .from("companies")
      .insert({ name: entreprise, created_by: created.user.id, pays: paysFinal, secteur: secteurFinal, forme_juridique: formeJuridiqueFinale })
      .select()
      .single();
    if (companyErr || !company) {
      return json({ error: "Compte créé mais échec de la création de l'entreprise : " + (companyErr?.message || "") }, 500);
    }

    const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      company_id: company.id,
      nom,
      email,
      role: "admin",
      active: true,
    });
    if (profileErr) {
      return json({ error: "Entreprise créée mais échec de la création du profil : " + profileErr.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("create-company unexpected error:", e);
    return json({ error: "Erreur serveur inattendue." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
