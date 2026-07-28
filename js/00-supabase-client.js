// Supabase client init - loaded first, before 01-core.js and everything else.
// Named window.supabaseClient (not "supabase") so it doesn't shadow the
// UMD library's own window.supabase global.
window.supabaseClient = supabase.createClient(
  'https://kjurzdggzhyllmzdllyf.supabase.co',
  'sb_publishable_OMDS6pwHyGQMWoBQ6FHP_Q_E-HYbPMo'
);
