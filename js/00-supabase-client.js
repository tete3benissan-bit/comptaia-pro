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

// Cloud sync building blocks (Phase 2), defined here - loaded first of all
// app scripts - rather than in js/23-supabase-sync.js (loaded last) so that
// a module wired up earlier in the load order (e.g. js/18-v22-rh.js) can
// never call registerModuleSync() before it exists. That race really
// happened: the first save right after login could silently no-op because
// this function wasn't defined yet, only self-healing on a later save.
var DEBOUNCE_MS = 2000, MAX_WAIT_MS = 10000;

// All the per-module "last local edit" timestamps used below are only
// meaningful for whichever company they were recorded under - on a
// browser that's ever been used for more than one company (switching
// accounts, or just this app's own multi-company testing), a leftover
// timestamp from company A must never be trusted to judge freshness for
// company B's data, or a genuinely older cloud copy for B could look
// "not newer than what I already have" purely because A's marker happens
// to be a later date. localOwnerOk() gates every comparison on the
// currently logged-in company actually matching who last wrote that
// timestamp; bumpLocalOwner() stamps it every time a marker is set.
function localOwnerOk(){
  try{ return localStorage.getItem('comptaia_local_owner')===((window.CURRENT_USER||{}).company_id||null); }catch(e){ return false; }
}
function bumpLocalOwner(){
  try{ if(window.CURRENT_USER&&CURRENT_USER.company_id) localStorage.setItem('comptaia_local_owner', CURRENT_USER.company_id); }catch(e){}
}

// Generic sync mechanism for any module that keeps its own independent
// localStorage key (RH, and later devis/emprunts/etc.) - each call gets its
// own debounce/flush state and pushes to the same company_data table under
// its own module_key. getData()/setData() bridge to whatever in-memory
// object the calling module actually uses (e.g. RH in js/18-v22-rh.js).
// The "core" accounting blob (comptaia_data) uses its own hand-wired copy
// of this same mechanism in js/23-supabase-sync.js, since it patches
// sauvegarderAuto() specifically rather than going through this generic path.
window.registerModuleSync = function(moduleKey, getData, setData){
  var pushTimer=null, maxTimer=null, dirty=false, inFlight=false;
  var localTsKey = 'comptaia_local_updated_at_'+moduleKey;

  function schedule(){
    dirty = true;
    try{ localStorage.setItem(localTsKey, new Date().toISOString()); }catch(e){}
    bumpLocalOwner();
    if(pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(flush, DEBOUNCE_MS);
    if(!maxTimer) maxTimer = setTimeout(flush, MAX_WAIT_MS);
  }
  async function flush(){
    clearTimeout(pushTimer); clearTimeout(maxTimer); pushTimer=maxTimer=null;
    if(!dirty || inFlight) return;
    if(!window.CURRENT_USER || !CURRENT_USER.company_id){ console.warn('[sync:'+moduleKey+'] push skipped: no CURRENT_USER.company_id',window.CURRENT_USER); return; }
    if(!navigator.onLine){ console.warn('[sync:'+moduleKey+'] push skipped: offline'); return; }
    inFlight = true; dirty = false;
    try{
      var res = await supabaseClient.from('company_data').upsert({
        company_id: CURRENT_USER.company_id, module_key: moduleKey,
        data: getData(), updated_at: new Date().toISOString(), updated_by: CURRENT_USER.id
      }, {onConflict:'company_id,module_key'});
      if(res.error){ dirty = true; console.error('[sync:'+moduleKey+'] push failed',res.error); }
      else console.log('[sync:'+moduleKey+'] push ok',CURRENT_USER.company_id);
    }catch(e){ dirty = true; console.error('[sync:'+moduleKey+'] push threw',e); }
    inFlight = false;
    if(dirty) schedule();
  }
  window.addEventListener('beforeunload', function(){ if(dirty) flush(); });
  document.addEventListener('visibilitychange', function(){ if(document.hidden && dirty) flush(); });
  window.addEventListener('online', function(){ if(dirty) flush(); });

  async function load(){
    try{
      if(!window.CURRENT_USER || !CURRENT_USER.company_id){ console.warn('[sync:'+moduleKey+'] load skipped: no CURRENT_USER.company_id'); return; }
      if(!navigator.onLine){ console.warn('[sync:'+moduleKey+'] load skipped: offline'); return; }
      var res = await supabaseClient.from('company_data')
        .select('data,updated_at').eq('company_id',CURRENT_USER.company_id).eq('module_key',moduleKey).maybeSingle();
      if(res.error){ console.error('[sync:'+moduleKey+'] load failed',res.error); return; }
      if(!res.data){ console.warn('[sync:'+moduleKey+'] load: no cloud row yet for',CURRENT_USER.company_id); return; }
      var localTs = localOwnerOk() ? localStorage.getItem(localTsKey) : null;
      if(!localTs || new Date(res.data.updated_at) > new Date(localTs)){
        setData(res.data.data);
        localStorage.setItem(localTsKey, res.data.updated_at);
        bumpLocalOwner();
        console.log('[sync:'+moduleKey+'] load applied cloud data',CURRENT_USER.company_id,res.data.updated_at);
      }else if(localTs && new Date(localTs) > new Date(res.data.updated_at)){
        console.log('[sync:'+moduleKey+'] load: local is newer, keeping local and rescheduling push');
        schedule(); // push queued offline edits
      }
    }catch(e){ console.error('[sync:'+moduleKey+'] load threw',e); }
  }
  return {schedule:schedule, load:load};
};
