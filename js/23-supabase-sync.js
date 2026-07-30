// Phase 2: cloud sync of the "core" localStorage blob (comptaia_data) via
// company_data. Loaded last on purpose: sauvegarderAuto() has exactly one
// definition, in js/01-core.js, called synchronously at ~37 call sites
// across 8 files right after each mutation - monkey-patching it here means
// none of those call sites need to change. The original call stays fully
// synchronous as before; a debounced cloud push is scheduled on top of it.
var DEBOUNCE_MS = 2000, MAX_WAIT_MS = 10000;

// All the per-module "last local edit" timestamps below are only
// meaningful for whichever company they were recorded under - on a
// browser that's ever been used for more than one company (switching
// accounts, or just this app's own multi-company testing), a leftover
// timestamp from company A must never be trusted to judge freshness for
// company B's data, or a genuinely older cloud copy for B could look
// "not newer than what I already have" purely because A's marker happens
// to be a later date. localOwnerOk() gates every comparison below on the
// currently logged-in company actually matching who last wrote that
// timestamp; bumpLocalOwner() stamps it every time a marker is set.
function localOwnerOk(){
  try{ return localStorage.getItem('comptaia_local_owner')===((window.CURRENT_USER||{}).company_id||null); }catch(e){ return false; }
}
function bumpLocalOwner(){
  try{ if(window.CURRENT_USER&&CURRENT_USER.company_id) localStorage.setItem('comptaia_local_owner', CURRENT_USER.company_id); }catch(e){}
}

// Generic version of the same mechanism for the ~20 OTHER modules that each
// keep their own independent localStorage key (RH, devis, emprunts...) -
// each call gets its own debounce/flush state and pushes to the same
// company_data table under its own module_key, so wiring up one more module
// later is just one more call to this, not a new copy of the machinery.
// getData()/setData() bridge to whatever in-memory object the calling
// module actually uses (e.g. RH in js/18-v22-rh.js).
window.registerModuleSync = function(moduleKey, getData, setData){
  var pushTimer=null, maxTimer=null, dirty=false, inFlight=false;
  var localTsKey = 'comptaia_local_updated_at_'+moduleKey;

  // Bumped synchronously on every local edit (not just after a successful
  // cloud push) - this is what load() below compares against the cloud's
  // updated_at, so a fresh local edit always wins the race even if its push
  // hasn't gone out yet (e.g. a refresh lands inside the debounce window).
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
      if(!navigator.onLine) return;
      var res = await supabaseClient.from('company_data')
        .select('data,updated_at').eq('company_id',CURRENT_USER.company_id).eq('module_key',moduleKey).maybeSingle();
      if(res.error){ console.error('[sync:'+moduleKey+'] load failed',res.error); return; }
      if(!res.data) return;
      var localTs = localOwnerOk() ? localStorage.getItem(localTsKey) : null;
      if(!localTs || new Date(res.data.updated_at) > new Date(localTs)){
        setData(res.data.data);
        localStorage.setItem(localTsKey, res.data.updated_at);
        bumpLocalOwner();
      }else if(localTs && new Date(localTs) > new Date(res.data.updated_at)){
        schedule(); // push queued offline edits
      }
    }catch(e){}
  }
  return {schedule:schedule, load:load};
};

(function(){
  var _origSauvegarder = window.sauvegarderAuto;
  var pushTimer=null, maxTimer=null, dirty=false, inFlight=false;

  // Bumped synchronously on every local edit (not just after a successful
  // cloud push) - this is what syncAwareLoad() below compares against the
  // cloud's updated_at, so a fresh local edit always wins the race even if
  // its push hasn't gone out yet (e.g. a refresh lands inside the debounce
  // window - this was the actual bug behind "data disappears on refresh":
  // the marker used to only move after a successful push, so a refresh
  // taken before that push completed made a same-age-or-older cloud copy
  // look authoritative and overwrite the newer local edit).
  function schedule(){
    dirty = true;
    try{ localStorage.setItem('comptaia_local_updated_at', new Date().toISOString()); }catch(e){}
    bumpLocalOwner();
    if(pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(flush, DEBOUNCE_MS);
    if(!maxTimer) maxTimer = setTimeout(flush, MAX_WAIT_MS);
  }

  async function flush(){
    clearTimeout(pushTimer); clearTimeout(maxTimer); pushTimer=maxTimer=null;
    if(!dirty || inFlight) return;
    if(!window.CURRENT_USER || !CURRENT_USER.company_id) return;
    if(!navigator.onLine) return; // retried on the 'online' event below
    inFlight = true; dirty = false;
    try{
      var payload = JSON.parse(localStorage.getItem('comptaia_data')||'{}');
      var res = await supabaseClient.from('company_data').upsert({
        company_id: CURRENT_USER.company_id, module_key:'core',
        data: payload, updated_at: new Date().toISOString(), updated_by: CURRENT_USER.id
      }, {onConflict:'company_id,module_key'});
      if(res.error) dirty = true;
    }catch(e){ dirty = true; }
    inFlight = false;
    if(dirty) schedule();
  }

  window.sauvegarderAuto = function(){ _origSauvegarder(); schedule(); };
  window.addEventListener('beforeunload', function(){ if(dirty) flush(); });
  document.addEventListener('visibilitychange', function(){ if(document.hidden && dirty) flush(); });
  window.addEventListener('online', function(){ if(dirty) flush(); });

  // Decides which JSON sits under the comptaia_data key before delegating
  // to chargerLocalStorage() (left completely untouched - single read path).
  // "Last write wins" via updated_at vs. a local marker set on every local
  // edit (schedule(), not flush() - see the comment above schedule()).
  window.syncAwareLoad = async function(){
    try{
      if(!navigator.onLine) return chargerLocalStorage();
      var res = await supabaseClient.from('company_data')
        .select('data,updated_at').eq('company_id',CURRENT_USER.company_id).eq('module_key','core').maybeSingle();
      if(res.error || !res.data){ chargerLocalStorage(); return; }
      var localTs = localOwnerOk() ? localStorage.getItem('comptaia_local_updated_at') : null;
      if(!localTs || new Date(res.data.updated_at) > new Date(localTs)){
        localStorage.setItem('comptaia_data', JSON.stringify(res.data.data));
        localStorage.setItem('comptaia_local_updated_at', res.data.updated_at);
        bumpLocalOwner();
      }
      chargerLocalStorage();
      if(localTs && new Date(localTs) > new Date(res.data.updated_at)) schedule(); // push queued offline edits
    }catch(e){ chargerLocalStorage(); }
  };
})();
