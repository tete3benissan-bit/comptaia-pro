// Filet de sécurité générique contre la perte de saisie en cours (F5
// accidentel, fermeture d'onglet, batterie...) : sauvegarde en continu un
// "brouillon" des champs de l'écran actif, et le restaure si l'app
// redémarre avant que l'utilisateur ait cliqué "Valider"/"Enregistrer".
//
// Volontairement générique (aucune liste de champs par écran à
// maintenir) : repère l'écran actif via ".pane.active" et lit tous ses
// input/select/textarea par id - ça couvre facture, tiers, stock,
// employés RH, etc. sans code spécifique par module. Chargé en dernier
// (après js/23-supabase-sync.js) pour pouvoir patcher sauvegarderAuto()
// par-dessus la version déjà patchée pour le cloud.
(function(){
  var saveTimer=null;
  var DRAFT_DEBOUNCE_MS=800;
  var DRAFT_MAX_AGE_MS=24*3600*1000; // au-delà, un brouillon est jugé trop ancien pour être pertinent

  function activePane(){ return document.querySelector('.pane.active'); }

  // Les champs de recherche/filtre (j-search, stock-filtre-niveau,
  // an-filter-mois, um-search, audit-filtre...) suivent tous cette même
  // convention de nommage dans toute l'app - ce sont des réglages
  // d'affichage, jamais une saisie à récupérer après un rafraîchissement.
  // Sans cette exclusion, taper un simple terme de recherche faisait
  // réapparaître le message "brouillon" indéfiniment, même une fois la
  // vraie saisie enregistrée. hasContent() applique aussi ce filtre pour
  // qu'un brouillon enregistré AVANT ce correctif (qui ne contient donc
  // plus qu'un vieux terme de recherche) se purge tout seul au lieu de
  // continuer à réapparaître indéfiniment.
  function isDraftableId(id){ return !/search|filtre|filter/i.test(id); }

  function collectFields(pane){
    var data={};
    pane.querySelectorAll('input,select,textarea').forEach(function(el){
      // Jamais un mot de passe dans un brouillon localStorage, même
      // temporairement - et readonly/disabled/file n'ont rien à restaurer.
      if(!el.id||el.type==='password'||el.type==='file'||el.readOnly||el.disabled) return;
      if(!isDraftableId(el.id)) return;
      data[el.id]=(el.type==='checkbox'||el.type==='radio')?el.checked:el.value;
    });
    return data;
  }
  function hasContent(data){
    return Object.keys(data).some(function(k){var v=data[k];return isDraftableId(k)&&v!==''&&v!==false&&v!=null;});
  }
  function draftKey(pane){ return 'comptaia_draft_'+pane.id; }

  function saveDraft(){
    var pane=activePane(); if(!pane||!pane.id) return;
    var data=collectFields(pane);
    try{
      if(hasContent(data)) localStorage.setItem(draftKey(pane), JSON.stringify({data:data,ts:Date.now()}));
      else localStorage.removeItem(draftKey(pane));
    }catch(e){}
  }

  // Exposé pour que sauvegarderAuto()/rhSave() (une fois la vraie donnée
  // enregistrée) effacent le brouillon devenu inutile de l'écran courant.
  window.clearDraftCurrentPane=function(){
    var pane=activePane(); if(!pane||!pane.id) return;
    try{ localStorage.removeItem(draftKey(pane)); }catch(e){}
  };

  function restoreDraft(pane){
    if(!pane||!pane.id) return;
    var raw; try{ raw=localStorage.getItem(draftKey(pane)); }catch(e){ return; }
    if(!raw) return;
    var parsed; try{ parsed=JSON.parse(raw); }catch(e){ return; }
    if(!parsed||!parsed.data||!hasContent(parsed.data)||!parsed.ts||(Date.now()-parsed.ts)>DRAFT_MAX_AGE_MS){
      try{localStorage.removeItem(draftKey(pane));}catch(e){}
      return;
    }
    var restored=0;
    Object.keys(parsed.data).forEach(function(id){
      if(!isDraftableId(id)) return; // purge un vieux brouillon enregistré avant l'exclusion des filtres
      var el=document.getElementById(id); if(!el) return;
      var v=parsed.data[id];
      if(el.type==='checkbox'||el.type==='radio'){ if(v){el.checked=true;restored++;} }
      else if(v!==''&&v!=null){ el.value=v; restored++; }
    });
    if(restored && typeof showToast==='function'){
      showToast('📝 Brouillon restauré ('+restored+' champ(s) — pensez à valider pour l\'enregistrer réellement)','ok');
    }
  }

  document.addEventListener('input', function(){ clearTimeout(saveTimer); saveTimer=setTimeout(saveDraft,DRAFT_DEBOUNCE_MS); });
  document.addEventListener('change', function(){ clearTimeout(saveTimer); saveTimer=setTimeout(saveDraft,DRAFT_DEBOUNCE_MS); });

  // Restaure à chaque changement d'écran (patch go(), même schéma que
  // tous les autres modules de cette app).
  var _oldGo=window.go;
  window.go=function(id,el){
    if(typeof _oldGo==='function') _oldGo(id,el);
    setTimeout(function(){ restoreDraft(activePane()); },50);
  };

  // Au chargement/login, l'écran par défaut affiché (Facture) n'est pas
  // forcément celui où un brouillon existe (l'utilisateur a pu être coupé
  // en plein milieu de Stock, RH...). Chercher dans TOUS les brouillons
  // plutôt que de ne regarder que l'écran actif, sinon le brouillon reste
  // invisible tant qu'on ne retombe pas par hasard sur le bon module.
  function findPendingDraftPaneId(){
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if(!k||k.indexOf('comptaia_draft_')!==0) continue;
        var parsed; try{ parsed=JSON.parse(localStorage.getItem(k)); }catch(e){ continue; }
        // Purge au passage tout brouillon expiré ou qui ne contient plus
        // que des champs de recherche/filtre (cf. isDraftableId) - sinon un
        // brouillon enregistré avant ce correctif continuait à réapparaître
        // à chaque rafraîchissement même sans rien de réel à récupérer.
        if(!parsed||!parsed.data||!hasContent(parsed.data)||!parsed.ts||(Date.now()-parsed.ts)>DRAFT_MAX_AGE_MS){
          try{ localStorage.removeItem(k); }catch(e){}
          continue;
        }
        return k.slice('comptaia_draft_'.length);
      }
    }catch(e){}
    return null;
  }

  window.reprendreBrouillon=function(paneId){
    var navId=paneId.replace(/^pane-/,'');
    if(typeof go==='function') go(navId);
    setTimeout(function(){ restoreDraft(document.getElementById(paneId)); },80);
  };

  window.addEventListener('load', function(){
    setTimeout(function(){
      var paneId=findPendingDraftPaneId();
      if(paneId && paneId!==(activePane()||{}).id && typeof showToast==='function'){
        showToast('📝 Une saisie non enregistrée vous attend — <span style="text-decoration:underline;cursor:pointer;font-weight:700" onclick="reprendreBrouillon(\''+paneId+'\')">cliquez ici pour la reprendre</span>','ok');
      } else {
        restoreDraft(activePane());
      }
    },1500);
  });

  // Un vrai enregistrement rend le brouillon de l'écran courant obsolète.
  var _origSaveForDraft=window.sauvegarderAuto;
  window.sauvegarderAuto=function(){ _origSaveForDraft(); window.clearDraftCurrentPane(); };
})();
