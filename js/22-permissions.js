// ═══ PERMISSIONS CENTRALISÉES ═══
// Table unique rôle -> hubs autorisés. Pour ajouter un rôle ou l'ouvrir sur
// un nouveau module, il suffit de modifier ROLES ci-dessous — rien d'autre
// dans le code n'a besoin de changer.
//
// Les clés "hubs" correspondent aux clés internes de SPECS (js/15) :
// exploitant, compta, fisc, rh. "*" = accès complet (Administrateur).
var ROLES = {
  admin:            {label:'Administrateur',     hubs:'*',                 badge:'purple'},
  exploitant:       {label:'Exploitant',          hubs:['exploitant'],      badge:'green'},
  comptable:        {label:'Comptable',           hubs:['compta'],          badge:'blue'},
  expert_comptable: {label:'Expert-comptable',    hubs:['compta','fisc'],   badge:'teal'},
  fiscaliste:       {label:'Fiscaliste',          hubs:['fisc'],            badge:'amber'},
  rh:               {label:'Ressources humaines', hubs:['rh'],              badge:'red'}
};

// Outils transverses accessibles à tout utilisateur connecté, quel que soit
// son rôle — ce ne sont pas des "modules métier" au sens des permissions.
var HUBS_LIBRES = ['treso','ia'];

function permRole(){ return (window.CURRENT_USER && CURRENT_USER.role) || null; }
function permEstAdmin(){ return permRole()==='admin'; }
function permLabelRole(r){ return (ROLES[r] && ROLES[r].label) || r || '—'; }
function permBadgeClass(r){ return 'bg-'+((ROLES[r] && ROLES[r].badge) || 'amber'); }
function permListeRoles(){ return Object.keys(ROLES); }
function permOptionsRoles(roleSelectionne){
  // Si le rôle actuel du compte n'existe plus dans ROLES (ex : ancien compte
  // "lecture" d'avant ce système à 6 rôles), NE PAS laisser le navigateur
  // sélectionner silencieusement la première option ("admin") — ça a causé
  // une élévation de privilèges accidentelle (enregistrer sans toucher au
  // menu déroulant promouvait le compte en administrateur). On ajoute plutôt
  // une option factice sélectionnée par défaut qui force un choix explicite.
  var connu = permListeRoles().indexOf(roleSelectionne) > -1;
  var html = connu ? '' : '<option value="" selected disabled>— Rôle inconnu, choisissez-en un —</option>';
  return html + permListeRoles().map(function(r){
    return '<option value="'+r+'"'+(connu && r===roleSelectionne?' selected':'')+'>'+permLabelRole(r)+'</option>';
  }).join('');
}

function permPeutAccederHub(hubKey){
  if(HUBS_LIBRES.indexOf(hubKey)>-1) return true;
  var def=ROLES[permRole()];
  if(!def) return false;
  if(def.hubs==='*') return true;
  return def.hubs.indexOf(hubKey)>-1;
}

function permPremierHubAutorise(){
  if(permEstAdmin()) return 'exploitant';
  var def=ROLES[permRole()];
  if(def && def.hubs!=='*' && def.hubs.length) return def.hubs[0];
  return 'exploitant';
}

// "Gestion des utilisateurs" n'est pas un hub SPECS (déplacé hors de tout
// module métier) : contrôle séparé, admin uniquement.
function permBloquerSiInterdit(id){
  if(id==='utilisateurs') return !permEstAdmin();
  var hub=window.PANE2SPEC && PANE2SPEC[id];
  if(!hub) return false; // pane hors du système de hubs (ex: notifs) -> pas de restriction
  return !permPeutAccederHub(hub);
}

function permAfficherAccesRefuse(){
  document.querySelectorAll('.pane').forEach(function(p){p.classList.remove('active');});
  var p=document.getElementById('pane-acces-refuse');
  if(p)p.classList.add('active');
  var pt=document.getElementById('page-title'); if(pt)pt.textContent='Accès refusé';
}

// Cache/affiche les cartes du hub d'accueil et le bouton "Gestion des
// utilisateurs" de la barre du bas selon le rôle du user connecté.
function majAffichagePermissions(){
  document.querySelectorAll('.hub-carte[data-hub]').forEach(function(carte){
    carte.style.display = permPeutAccederHub(carte.getAttribute('data-hub')) ? '' : 'none';
  });
  var btnUsers=document.getElementById('tb-utilisateurs');
  if(btnUsers) btnUsers.style.display = permEstAdmin() ? '' : 'none';
}

(function(){
  var _goPerm=window.go;
  window.go=function(id,el){
    if(permBloquerSiInterdit(id)){ permAfficherAccesRefuse(); return; }
    if(typeof _goPerm==='function') _goPerm(id,el);
  };
  var _oasPerm=window.onAuthSuccess;
  window.onAuthSuccess=function(){
    if(typeof _oasPerm==='function') _oasPerm();
    majAffichagePermissions();
  };
  var _logoutPerm=window.authLogout;
  window.authLogout=function(){
    if(typeof _logoutPerm==='function') _logoutPerm();
    var btnUsers=document.getElementById('tb-utilisateurs');
    if(btnUsers) btnUsers.style.display='none';
  };
})();
