// Edge Function: invite-user
// Called by an admin from "Gestion des utilisateurs" to create a teammate's
// account. Must run server-side because only the service_role key can call
// the Admin API (auth.admin.inviteUserByEmail) - that key must never reach
// client code, so this is the one place account creation happens outside RLS.
//
// Security hardening pass: rate limiting keyed on the CALLER's user id
// (already authenticated by this point) rather than IP, since a legitimate
// admin invites at most a handful of teammates in any 15-minute window -
// this also protects against a compromised admin session being used to
// mass-spam invitations.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const ALLOWED_ORIGIN = "https://tete3benissan-bit.github.io";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BODY_BYTES = 10_000;
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    return false;
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

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: "Requête trop volumineuse." }, 413);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) {
      return json({ error: "Non authentifié." }, 401);
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

    const email = String(body.email ?? "").trim();
    const nom = String(body.nom ?? "").trim();
    const role = String(body.role ?? "");

    if (!email || !nom || !role) {
      return json({ error: "email, nom et role sont requis." }, 400);
    }
    if (nom.length > 200) {
      return json({ error: "Nom trop long (200 caractères max)." }, 400);
    }
    if (email.length > 254 || !EMAIL_RE.test(email)) {
      return json({ error: "Adresse e-mail invalide." }, 400);
    }
    const allowedRoles = [
      "admin", "directeur", "exploitant", "comptable", "expert_comptable",
      "fiscaliste", "rh", "caissier", "gestionnaire_stock", "commercial", "auditeur",
    ];
    if (!allowedRoles.includes(role)) {
      return json({ error: "Rôle invalide." }, 400);
    }

    // service_role client - only ever used server-side, injected by the platform.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identify the caller from their JWT, then confirm they're an active
    // admin - the company_id they belong to is what the new user joins
    // (never trust a company_id passed in the request body).
    const { data: callerAuth, error: callerErr } = await supabaseAdmin.auth.getUser(jwt);
    if (callerErr || !callerAuth?.user) {
      return json({ error: "Session invalide." }, 401);
    }

    if (await rateLimited(supabaseAdmin, `invite-user:caller:${callerAuth.user.id}`)) {
      return json({ error: "Trop d'invitations envoyées. Réessayez dans quelques minutes." }, 429);
    }

    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("company_id, role, active")
      .eq("id", callerAuth.user.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.role !== "admin" || !callerProfile.active) {
      return json({ error: "Seul un administrateur actif peut inviter un utilisateur." }, 403);
    }

    const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { data: { nom, role } },
    );
    if (inviteErr || !invited?.user) {
      return json({ error: inviteErr?.message || "Échec de l'invitation (email déjà utilisé ?)." }, 400);
    }

    const { error: insertErr } = await supabaseAdmin.from("profiles").insert({
      id: invited.user.id,
      company_id: callerProfile.company_id,
      nom,
      email,
      role,
      active: true,
    });
    if (insertErr) {
      return json({ error: "Compte créé mais échec de l'enregistrement du profil : " + insertErr.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("invite-user unexpected error:", e);
    return json({ error: "Erreur serveur inattendue." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
