// Phase 2: cloud sync of the "core" localStorage blob (comptaia_data) via
// company_data. Loaded last on purpose: sauvegarderAuto() has exactly one
// definition, in js/01-core.js, called synchronously at ~37 call sites
// across 8 files right after each mutation - monkey-patching it here means
// none of those call sites need to change. The original call stays fully
// synchronous as before; a debounced cloud push is scheduled on top of it.
// (registerModuleSync/localOwnerOk/bumpLocalOwner/DEBOUNCE_MS/MAX_WAIT_MS
// used to live in this file too, but were moved to js/00-supabase-client.js
// - loaded first of all app scripts - so that a module wired up earlier in
// the load order, like js/18-v22-rh.js, can never call registerModuleSync()
// before it exists. That race really happened in practice.)
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
    if(!window.CURRENT_USER || !CURRENT_USER.company_id){ console.warn('[sync:core] push skipped: no CURRENT_USER.company_id',window.CURRENT_USER); return; }
    if(!navigator.onLine){ console.warn('[sync:core] push skipped: offline'); return; }
    inFlight = true; dirty = false;
    try{
      var payload = JSON.parse(localStorage.getItem('comptaia_data')||'{}');
      var res = await supabaseClient.from('company_data').upsert({
        company_id: CURRENT_USER.company_id, module_key:'core',
        data: payload, updated_at: new Date().toISOString(), updated_by: CURRENT_USER.id
      }, {onConflict:'company_id,module_key'});
      if(res.error){ dirty = true; console.error('[sync:core] push failed',res.error); }
      else console.log('[sync:core] push ok',CURRENT_USER.company_id);
    }catch(e){ dirty = true; console.error('[sync:core] push threw',e); }
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
      if(res.error){ console.error('[sync:core] load failed',res.error); chargerLocalStorage(); return; }
      if(!res.data){ chargerLocalStorage(); return; }
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
