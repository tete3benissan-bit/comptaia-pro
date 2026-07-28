// Supabase client init - loaded first, before 01-core.js and everything else.
// Named window.supabaseClient (not "supabase") so it doesn't shadow the
// UMD library's own window.supabase global.
window.supabaseClient = supabase.createClient(
  'https://kjurzdggzhyllmzdllyf.supabase.co',
  'sb_publishable_OMDS6pwHyGQMWoBQ6FHP_Q_E-HYbPMo'
);

// supabase-js only gives a generic "Edge Function returned a non-2xx status
// code" on res.error.message for HTTP-level failures - the actual JSON body
// our functions return (the real {error:"..."} message) sits on
// res.error.context (the raw Response), which has to be read separately.
async function supabaseFnError(res){
  if(res.data&&res.data.error) return res.data.error;
  if(res.error){
    if(res.error.context&&typeof res.error.context.json==='function'){
      try{ var body=await res.error.context.json(); if(body&&body.error) return body.error; }catch(e){}
    }
    return res.error.message||'Erreur inconnue';
  }
  return null;
}
