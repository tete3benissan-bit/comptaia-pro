// GEST Africa — Paramètres : apparence (luminosité, accent, police,
// intensité des ombres), compte, et retour utilisateur (notation).
// Priorité 1 du chantier "section Paramètres" demandé par l'utilisateur -
// la langue (i18n) et le reste viendront dans un 2e temps séparé.
//
// Choix de conception : préréglages fermés plutôt qu'un color-picker/
// police libres, pour garantir que chaque combinaison reste lisible et
// cohérente avec l'identité brutaliste de l'app (accent+highlight vont
// toujours ensemble, chaque préréglage a sa propre variante clair/sombre
// - une couleur qui contraste bien sur fond blanc ne contraste pas
// forcément sur fond noir, donc pas de calcul automatique depuis une
// seule valeur choisie).
//
// Application technique : les préréglages sont posés en tant que
// variables CSS INLINE sur <html> (document.documentElement.style.
// setProperty), qui l'emportent en spécificité sur les blocs
// :root/:root[data-theme="dark"] de css/01-core.css sans avoir à les
// dupliquer. Recalculés à chaque changement de thème (voir le hook sur
// applyTheme() dans js/01-core.js) puisque accent/ombres dépendent du
// thème actif.
(function(){
'use strict';

var LS_ACCENT='comptaia_param_accent', LS_FONT='comptaia_param_font',
    LS_SHADOW='comptaia_param_shadow', LS_BRIGHT='comptaia_param_brightness';

var ACCENTS={
  bleu:{nom:'Bleu marine',
    light:{accent:'#1f3a7a',accentDark:'#152a5c',accentLight:'#dde6f5',accentRgb:'31,58,122',grad:'linear-gradient(135deg,#3b5bb8 0%,#152a5c 100%)'},
    dark:{accent:'#6c93e0',accentDark:'#4a72c4',accentLight:'rgba(108,147,224,.18)',accentRgb:'108,147,224',grad:'linear-gradient(135deg,#8fb0ee 0%,#4a72c4 100%)'}},
  vert:{nom:'Vert émeraude',
    light:{accent:'#1a6b4a',accentDark:'#124d35',accentLight:'#dcf3ea',accentRgb:'26,107,74',grad:'linear-gradient(135deg,#2f9d70 0%,#124d35 100%)'},
    dark:{accent:'#3fcf92',accentDark:'#1f8f5e',accentLight:'rgba(63,207,146,.18)',accentRgb:'63,207,146',grad:'linear-gradient(135deg,#63e0ac 0%,#1f8f5e 100%)'}},
  violet:{nom:'Violet aubergine',
    light:{accent:'#5b2a86',accentDark:'#421f63',accentLight:'#eee3f7',accentRgb:'91,42,134',grad:'linear-gradient(135deg,#7d47b3 0%,#421f63 100%)'},
    dark:{accent:'#b48ee0',accentDark:'#8f5fc4',accentLight:'rgba(180,142,224,.18)',accentRgb:'180,142,224',grad:'linear-gradient(135deg,#cbabf0 0%,#8f5fc4 100%)'}},
  terracotta:{nom:'Terracotta',
    light:{accent:'#a13f22',accentDark:'#7a2f19',accentLight:'#f8e3db',accentRgb:'161,63,34',grad:'linear-gradient(135deg,#c85a37 0%,#7a2f19 100%)'},
    dark:{accent:'#e08a5f',accentDark:'#c1673a',accentLight:'rgba(224,138,95,.18)',accentRgb:'224,138,95',grad:'linear-gradient(135deg,#eeab85 0%,#c1673a 100%)'}},
  cyan:{nom:'Cyan turquoise',
    light:{accent:'#0e6e78',accentDark:'#0a4f56',accentLight:'#dcf3f4',accentRgb:'14,110,120',grad:'linear-gradient(135deg,#1a9aa8 0%,#0a4f56 100%)'},
    dark:{accent:'#4fd0dd',accentDark:'#2ba8b5',accentLight:'rgba(79,208,221,.18)',accentRgb:'79,208,221',grad:'linear-gradient(135deg,#7fe3ec 0%,#2ba8b5 100%)'}}
};

var FONTS={
  archivo:{nom:'Archivo (défaut)',css:"'Archivo',sans-serif"},
  inter:{nom:'Inter',css:"'Inter',sans-serif"},
  systeme:{nom:'Système (natif)',css:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"},
  georgia:{nom:'Georgia (serif)',css:"Georgia,'Times New Roman',serif"},
  mono:{nom:'Monospace',css:"'Courier New',Consolas,monospace"}
};

// offsets/opacités pour shadow-sm/md/lg/inset/crisp/crisp-hover/
// sidebar-sm/sidebar-inset, par thème. "fort"=identité brutaliste pleine
// puissance, "normal"=intermédiaire, "leger"=discret. Les valeurs par
// défaut du thème clair correspondent à "fort" (l'identité d'origine) et
// celles du thème sombre à "normal" (déjà adouci suite au retour "ça
// fait mal aux yeux") - la sélection par défaut dans Paramètres reflète
// donc l'état déjà en place, aucun changement visuel tant que l'
// utilisateur ne touche pas ce réglage.
var SHADOWS={
  light:{
    fort:{sm:'4px 4px 0 #000',md:'6px 6px 0 #000',lg:'10px 10px 0 #000',inset:'inset 3px 3px 0 rgba(0,0,0,.2)',crisp:'8px 8px 0 #000',crispHover:'11px 11px 0 #000',sideSm:'3px 3px 0 #000',sideInset:'inset 2px 2px 0 rgba(0,0,0,.35)'},
    normal:{sm:'2px 2px 0 #000',md:'3px 3px 0 #000',lg:'5px 5px 0 #000',inset:'inset 2px 2px 0 rgba(0,0,0,.15)',crisp:'4px 4px 0 #000',crispHover:'6px 6px 0 #000',sideSm:'2px 2px 0 #000',sideInset:'inset 1px 1px 0 rgba(0,0,0,.2)'},
    leger:{sm:'1px 1px 0 rgba(0,0,0,.5)',md:'2px 2px 0 rgba(0,0,0,.4)',lg:'3px 3px 0 rgba(0,0,0,.35)',inset:'inset 1px 1px 0 rgba(0,0,0,.1)',crisp:'2px 2px 0 rgba(0,0,0,.4)',crispHover:'3px 3px 0 rgba(0,0,0,.4)',sideSm:'1px 1px 0 rgba(0,0,0,.35)',sideInset:'inset 1px 1px 0 rgba(0,0,0,.12)'}
  },
  dark:{
    fort:{sm:'4px 4px 0 rgba(255,255,255,.5)',md:'6px 6px 0 rgba(255,255,255,.4)',lg:'10px 10px 0 rgba(255,255,255,.35)',inset:'inset 3px 3px 0 rgba(255,255,255,.2)',crisp:'8px 8px 0 rgba(255,255,255,.45)',crispHover:'11px 11px 0 rgba(255,255,255,.45)',sideSm:'3px 3px 0 rgba(255,255,255,.4)',sideInset:'inset 2px 2px 0 rgba(255,255,255,.2)'},
    normal:{sm:'2px 2px 0 rgba(255,255,255,.4)',md:'3px 3px 0 rgba(255,255,255,.35)',lg:'5px 5px 0 rgba(255,255,255,.3)',inset:'inset 2px 2px 0 rgba(255,255,255,.12)',crisp:'4px 4px 0 rgba(255,255,255,.4)',crispHover:'6px 6px 0 rgba(255,255,255,.4)',sideSm:'2px 2px 0 rgba(255,255,255,.35)',sideInset:'inset 1px 1px 0 rgba(255,255,255,.15)'},
    leger:{sm:'1px 1px 0 rgba(255,255,255,.25)',md:'2px 2px 0 rgba(255,255,255,.2)',lg:'3px 3px 0 rgba(255,255,255,.18)',inset:'inset 1px 1px 0 rgba(255,255,255,.08)',crisp:'2px 2px 0 rgba(255,255,255,.22)',crispHover:'3px 3px 0 rgba(255,255,255,.22)',sideSm:'1px 1px 0 rgba(255,255,255,.2)',sideInset:'inset 1px 1px 0 rgba(255,255,255,.1)'}
  }
};

function paramGet(key,defVal){try{return localStorage.getItem(key)||defVal;}catch(e){return defVal;}}
function paramSet(key,val){try{localStorage.setItem(key,val);}catch(e){}}

function themeActuel(){return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';}

// Réapplique les 3 préréglages (accent/police/ombres) + la luminosité en
// variables CSS inline sur <html> - appelée au chargement et à chaque
// changement de thème (l'accent/les ombres ont une valeur différente par
// thème) ou de préréglage.
window.appliquerParametresApparence=function(){
  var root=document.documentElement.style;
  var theme=themeActuel();

  var accentKey=paramGet(LS_ACCENT,'bleu');
  var a=(ACCENTS[accentKey]||ACCENTS.bleu)[theme];
  root.setProperty('--accent',a.accent);
  root.setProperty('--accent-dark',a.accentDark);
  root.setProperty('--accent-light',a.accentLight);
  root.setProperty('--accent-rgb',a.accentRgb);
  root.setProperty('--accent-grad',a.grad);
  root.setProperty('--highlight',a.accent);
  root.setProperty('--highlight-rgb',a.accentRgb);

  var fontKey=paramGet(LS_FONT,'archivo');
  root.setProperty('--font-family',(FONTS[fontKey]||FONTS.archivo).css);

  var shadowKey=paramGet(LS_SHADOW,theme==='dark'?'normal':'fort');
  var s=(SHADOWS[theme]||SHADOWS.light)[shadowKey]||SHADOWS[theme].fort;
  root.setProperty('--shadow-sm',s.sm);
  root.setProperty('--shadow-md',s.md);
  root.setProperty('--shadow-lg',s.lg);
  root.setProperty('--shadow-inset',s.inset);
  root.setProperty('--shadow-crisp',s.crisp);
  root.setProperty('--shadow-crisp-hover',s.crispHover);
  root.setProperty('--sidebar-shadow-sm',s.sideSm);
  root.setProperty('--sidebar-shadow-inset',s.sideInset);

  var bright=paramGet(LS_BRIGHT,'100');
  document.documentElement.style.filter=(bright==='100')?'':('brightness('+(bright/100)+')');
};

window.paramChoisirAccent=function(key){paramSet(LS_ACCENT,key);appliquerParametresApparence();renderParametresPane();};
window.paramChoisirFont=function(key){paramSet(LS_FONT,key);appliquerParametresApparence();renderParametresPane();};
window.paramChoisirShadow=function(key){paramSet(LS_SHADOW,key);appliquerParametresApparence();renderParametresPane();};
window.paramChangerLuminosite=function(val){paramSet(LS_BRIGHT,val);appliquerParametresApparence();var lbl=document.getElementById('param-bright-val');if(lbl)lbl.textContent=val+'%';};
window.paramReinitialiser=function(){
  try{localStorage.removeItem(LS_ACCENT);localStorage.removeItem(LS_FONT);localStorage.removeItem(LS_SHADOW);localStorage.removeItem(LS_BRIGHT);}catch(e){}
  appliquerParametresApparence();renderParametresPane();
  if(typeof showToast==='function')showToast('Apparence réinitialisée.');
};

// Se raccroche à applyTheme() (js/01-core.js) pour recalculer accent/
// ombres à chaque changement clair/sombre - sinon le préréglage choisi
// resterait figé sur les valeurs de l'ancien thème après bascule.
if(typeof window.applyTheme==='function'){
  var _appTheme=window.applyTheme;
  window.applyTheme=function(theme){
    _appTheme(theme);
    if(typeof window.appliquerParametresApparence==='function')window.appliquerParametresApparence();
  };
}

// ── Compte : nom + mot de passe ──────────────────────────────
async function paramEnregistrerNom(){
  var val=(document.getElementById('param-nom')||{}).value;
  if(!val||!val.trim()){showToast('Le nom ne peut pas être vide.','err');return;}
  val=val.trim();
  try{
    var res=await supabaseClient.from('profiles').update({nom:val}).eq('id',CURRENT_USER.id);
    if(res.error){showToast('Échec : '+res.error.message,'err');return;}
    CURRENT_USER.nom=val;
    // Même construction que dans onAuthSuccess() (js/06-v12-core-module.js)
    // pour rafraîchir le badge nom/rôle de la barre du haut sans recharger
    // toute la session.
    var tu=document.getElementById('topbar-user');
    if(tu){
      var roleLbl=(window.permLabelRole?permLabelRole(CURRENT_USER.role):CURRENT_USER.role);
      var roleCls=(window.permBadgeClass?permBadgeClass(CURRENT_USER.role):'bg-amber');
      tu.innerHTML=ico('users')+' <strong>'+esc(val)+'</strong> <span class="badge '+roleCls+'">'+roleLbl+'</span>';
    }
    showToast('Nom mis à jour.');
  }catch(e){showToast('Erreur inattendue.','err');}
}

// ── Notation de l'app (étoiles + commentaire) ────────────────
var RATING_CHOISIE=0;
window.paramChoisirEtoile=function(n){
  RATING_CHOISIE=n;
  document.querySelectorAll('.param-etoile').forEach(function(el,i){
    el.textContent=(i<n)?'★':'☆';
    el.classList.toggle('param-etoile-pleine',i<n);
  });
};
async function paramEnvoyerNotation(){
  if(!RATING_CHOISIE){showToast('Choisissez une note (1 à 5 étoiles).','err');return;}
  var commentaire=(document.getElementById('param-avis-texte')||{}).value||'';
  try{
    var res=await supabaseClient.from('app_ratings').insert({
      company_id:CURRENT_USER.company_id,user_id:CURRENT_USER.id,
      note:RATING_CHOISIE,commentaire:commentaire.trim()||null
    });
    if(res.error){showToast('Échec de l\'envoi : '+res.error.message,'err');return;}
    showToast('Merci pour votre retour !');
    document.getElementById('param-avis-texte').value='';
  }catch(e){showToast('Erreur inattendue.','err');}
}

// ── Rendu du panneau ──────────────────────────────────────────
function chip(actif){return 'param-chip'+(actif?' param-chip-actif':'');}

window.renderParametresPane=function(){
  var box=document.getElementById('param-contenu');
  if(!box)return;
  var accentKey=paramGet(LS_ACCENT,'bleu');
  var fontKey=paramGet(LS_FONT,'archivo');
  var theme=themeActuel();
  var shadowKey=paramGet(LS_SHADOW,theme==='dark'?'normal':'fort');
  var bright=paramGet(LS_BRIGHT,'100');

  var accentChips=Object.keys(ACCENTS).map(function(k){
    var c=ACCENTS[k][theme];
    return '<button type="button" class="'+chip(k===accentKey)+'" onclick="paramChoisirAccent(\''+k+'\')">'+
      '<span class="param-swatch" style="background:'+c.grad+'"></span>'+ACCENTS[k].nom+'</button>';
  }).join('');

  var fontChips=Object.keys(FONTS).map(function(k){
    return '<button type="button" class="'+chip(k===fontKey)+'" style="font-family:'+FONTS[k].css+'" onclick="paramChoisirFont(\''+k+'\')">'+FONTS[k].nom+'</button>';
  }).join('');

  var shadowLabels={fort:'Fort',normal:'Normal',leger:'Léger'};
  var shadowChips=Object.keys(shadowLabels).map(function(k){
    return '<button type="button" class="'+chip(k===shadowKey)+'" onclick="paramChoisirShadow(\''+k+'\')">'+shadowLabels[k]+'</button>';
  }).join('');

  box.innerHTML=
    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-header"><span class="card-title">Apparence</span><button class="btn btn-sm" onclick="paramReinitialiser()">Réinitialiser</button></div>'+
      '<div class="card-body">'+
        '<div class="fg" style="margin-bottom:16px"><label>Luminosité — '+'<span id="param-bright-val">'+bright+'%</span></label>'+
          '<input type="range" min="60" max="130" step="5" value="'+bright+'" oninput="paramChangerLuminosite(this.value)"/></div>'+
        '<label style="display:block;margin-bottom:6px">Couleur d\'accent</label>'+
        '<div class="param-chips" style="margin-bottom:16px">'+accentChips+'</div>'+
        '<label style="display:block;margin-bottom:6px">Police</label>'+
        '<div class="param-chips" style="margin-bottom:16px">'+fontChips+'</div>'+
        '<label style="display:block;margin-bottom:6px">Intensité des ombres</label>'+
        '<div class="param-chips">'+shadowChips+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:14px">'+
      '<div class="card-header"><span class="card-title">Compte</span></div>'+
      '<div class="card-body">'+
        '<div class="fgrid fg2">'+
          '<div class="fg"><label>Nom complet</label><input type="text" id="param-nom" value="'+(typeof esc==='function'?esc(CURRENT_USER.nom||''):(CURRENT_USER.nom||''))+'"/></div>'+
          '<div class="fg"><label>E-mail</label><input type="email" value="'+(typeof esc==='function'?esc(CURRENT_USER.email||''):(CURRENT_USER.email||''))+'" readonly/></div>'+
        '</div>'+
        '<div style="display:flex;gap:8px;margin-top:14px">'+
          '<button class="btn btn-primary btn-sm" onclick="paramEnregistrerNom()">Enregistrer le nom</button>'+
          '<button class="btn btn-sm" onclick="changerMonMotDePasse()">Changer le mot de passe</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="card">'+
      '<div class="card-header"><span class="card-title">Votre avis</span></div>'+
      '<div class="card-body">'+
        '<div style="font-size:20px;letter-spacing:4px;margin-bottom:10px">'+
          [1,2,3,4,5].map(function(n){return '<span class="param-etoile" style="cursor:pointer" onclick="paramChoisirEtoile('+n+')">☆</span>';}).join('')+
        '</div>'+
        '<div class="fg"><label>Commentaire (facultatif)</label><textarea id="param-avis-texte" rows="3" placeholder="Ce qui vous plaît, ce qui manque..."></textarea></div>'+
        '<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="paramEnvoyerNotation()">Envoyer mon avis</button>'+
      '</div>'+
    '</div>';
};

document.addEventListener('DOMContentLoaded',function(){appliquerParametresApparence();});
appliquerParametresApparence();
window.paramEnregistrerNom=paramEnregistrerNom;
window.paramEnvoyerNotation=paramEnvoyerNotation;

// Rafraîchit le panneau à chaque navigation vers ce pane, même motif que
// les autres modules (voir js/25-declaration-cnss.js).
var _oldGoParam=window.go;
window.go=function(id,el){
  if(typeof _oldGoParam==='function')_oldGoParam(id,el);
  if(id==='parametres'){
    renderParametresPane();
    var pt=document.getElementById('page-title');if(pt)pt.textContent='Paramètres';
  }
};

})();
