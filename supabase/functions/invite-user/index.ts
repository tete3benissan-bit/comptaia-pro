// Edge Function: invite-user
// Called by an admin from "Gestion des utilisateurs" to create a teammate's
// account. Must run server-side because only the service_role key can call
// the Admin API (auth.admin.inviteUserByEmail) - that key must never reach
// client code, so this is the one place account creation happens outside RLS.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) {
      return json({ error: "Non authentifié." }, 401);
    }

    const { email, nom, role } = await req.json();
    if (!email || !nom || !role) {
      return json({ error: "email, nom et role sont requis." }, 400);
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
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
