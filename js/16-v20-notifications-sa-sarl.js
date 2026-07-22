// v20: notification filtering + SA/SARL status + color theme - extracted from ComptaIA_Pro_original.html lines 10215-10306
// ═══════════════════════════════════════════════════════════════
// GEST Africa v20 — LOGIQUE
// ═══════════════════════════════════════════════════════════════
(function(){
'use strict';

/* ── 1. Notifications : ne conserver que les mouvements réels ──
   Gardés  : facture, reglement (reçus), virement, retard, alerte,
             info (devis, BC, récurrentes, inventaire, FX…)
   Exclus  : modif (forme juridique, renommages, lettrage…) et
             save (sauvegardes, clôtures) — bruit système.        */
var TYPES_EXCLUS={modif:1,save:1};

if(typeof window.ajouterNotif==='function'){
  var _an=window.ajouterNotif;
  window.ajouterNotif=function(type,titre,detail){
    if(TYPES_EXCLUS[type])return;
    return _an(type,titre,detail);
  };
}
function purgerNotifs(){
  try{
    if(!window.NOTIFS||!NOTIFS.length)return;
    var avant=NOTIFS.length;
    for(var i=NOTIFS.length-1;i>=0;i--){
      if(TYPES_EXCLUS[NOTIFS[i].type])NOTIFS.splice(i,1);
    }
    if(avant!==NOTIFS.length&&typeof renderNotifs==='function')renderNotifs();
  }catch(e){}
}

/* ── 2. Statut SA / SARL dans la barre du haut + code couleur ── */
function fjActuelle(){
  try{return window.FORME_JURIDIQUE||localStorage.getItem('comptaia_fj')||'sarl';}
  catch(e){return 'sarl';}
}
function majThemeFJ(fj){
  document.body.classList.toggle('fj-sa',fj==='sa');
  var bs=document.getElementById('fjtb-sarl'),ba=document.getElementById('fjtb-sa');
  if(bs)bs.className='fj-btn'+(fj==='sarl'?' fj-sarl':'');
  if(ba)ba.className='fj-btn'+(fj==='sa'?' fj-sa':'');
}
function construireFJTopbar(){
  var tb=document.querySelector('.topbar');
  if(!tb||document.getElementById('fj-topbar'))return;
  var d=document.createElement('div');
  d.id='fj-topbar';
  d.innerHTML=
    '<button type="button" class="fj-btn" id="fjtb-sarl" onclick="setFormeJuridique(\'sarl\')" '+
      'title="SARL — IS 27% + distribution libre aux associés + gérance désignée + capital libre">SARL</button>'+
    '<button type="button" class="fj-btn" id="fjtb-sa" onclick="setFormeJuridique(\'sa\')" '+
      'title="SA — IS 27% + IRVM 7% sur dividendes + règles actionnaires">SA</button>';
  var droite=tb.querySelector('.topbar-right');
  if(droite)tb.insertBefore(d,droite);else tb.appendChild(d);
}
if(typeof window.setFormeJuridique==='function'){
  var _sfj=window.setFormeJuridique;
  window.setFormeJuridique=function(fj){
    _sfj(fj);
    majThemeFJ(fj);
    /* chaque onglet se remet à jour avec le nouveau statut */
    try{if(typeof renderAll==='function')renderAll();}catch(e){}
  };
}

/* ── 3. Marque v20 ── */
function marqueV20(){
  try{
    document.title=document.title.replace(/v[12][0-9]/,'v20');
    if(document.title.indexOf('v20')===-1)document.title='GEST Africa v20 — OHADA Togo';
    var f=document.getElementById('sidebar-footer');
    if(f)f.textContent=f.textContent.replace(/v[12][0-9]/,'v20');
  }catch(e){}
}

/* ── 4. Initialisation ── */
construireFJTopbar();
majThemeFJ(fjActuelle());
purgerNotifs();
marqueV20();
setInterval(purgerNotifs,4000);

var _oas=window.onAuthSuccess;
window.onAuthSuccess=function(){
  if(typeof _oas==='function')_oas();
  purgerNotifs();
  majThemeFJ(fjActuelle());
  marqueV20();
};
})();
