// Edge Function: create-company
// The one self-serve path: creating a brand-new company makes you its admin.
// Runs server-side (service_role) so the account can be created already
// confirmed (email_confirm:true) - this sidesteps whatever this project's
// email-confirmation setting is, which would otherwise leave signUp() with
// no active session and make the client-side company/profile inserts fail
// under RLS. No caller JWT is required/checked here (there's no existing
// admin to authorize against yet), unlike invite-user.

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
    const { entreprise, nom, email, password } = await req.json();
    if (!entreprise || !nom || !email || !password) {
      return json({ error: "Tous les champs sont requis." }, 400);
    }
    if (String(password).length < 6) {
      return json({ error: "Mot de passe trop court (min. 6 caractères)." }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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
      .insert({ name: entreprise, created_by: created.user.id })
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
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
