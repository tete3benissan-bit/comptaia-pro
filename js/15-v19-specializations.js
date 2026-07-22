// v19: Admin/Comptable/Fiscalite/RH specialization hub + taskbar navigation - extracted from ComptaIA_Pro_original.html lines 9852-10188
// ═══════════════════════════════════════════════════════════════
// GEST Africa v19 — LOGIQUE SPÉCIALISATIONS + BARRE DES TÂCHES
// ═══════════════════════════════════════════════════════════════
(function(){
'use strict';

/* ── 1. Structure des spécialisations (onglets → panneaux existants) ── */
var ITEMS_TRESO=[
  {id:'solde',ic:ico('wallet'),lb:'Solde'},
  {id:'rapprochement',ic:ico('landmark'),lb:'Rapprochement bancaire'},
  {id:'multidevises',ic:ico('refresh'),lb:'Multi-devises'},
  {id:'emprunts',ic:ico('percent'),lb:'Emprunts'},
  {id:'suivi',ic:ico('trendUp'),lb:'Suivi de trésorerie'}
];
var ITEMS_IA=[
  {fn:'ouvrirIA',ic:ico('chat'),lb:'Chat IA'},
  {id:'ocr',ic:ico('camera'),lb:'OCR'},
  {id:'analyse',ic:ico('search'),lb:'Analyse comptable'},
  {id:'prevision',ic:ico('trendUp'),lb:'Prévisions'},
  {id:'scoring',ic:ico('star'),lb:'Score financier'},
  {id:'fraude',ic:ico('alertOctagon'),lb:"Détection d'anomalies"},
  {id:'benchmarks',ic:ico('dashboard'),lb:'Benchmarks'}
];
var SPECS={
  exploitant:{ic:ico('home'),nom:'Exploitant',desc:'Opérations quotidiennes : ventes, clients, stock, production et entreprise.',
    items:[
      {id:'dashboard',ic:ico('dashboard'),lb:'Tableau de bord'},
      {grp:'ventes',ic:ico('cart'),lb:'Ventes',items:[
        {id:'facture',ic:ico('file'),lb:'Factures'},
        {id:'devis',ic:ico('clipboard'),lb:'Devis'},
        {id:'bc',ic:ico('cart'),lb:'Bons de commande'},
        {id:'bl',ic:ico('truck'),lb:'Bons de livraison'},
        {id:'recurrentes',ic:ico('refresh'),lb:'Factures récurrentes'},
        {id:'caisse',ic:ico('receipt'),lb:'Caisse / PDV'}
      ]},
      {id:'tiers',ic:ico('users'),lb:'Clients / Fournisseurs'},
      {grp:'stock',ic:ico('package'),lb:'Stock',items:[
        {id:'stock',ic:ico('package'),lb:"Vue d'ensemble"},
        {id:'stock-entrees',ic:ico('arrowDown'),lb:'Entrées de stock'},
        {id:'stock-sorties',ic:ico('arrowUp'),lb:'Sorties de stock'},
        {id:'stock-alertes',ic:ico('alertTriangle'),lb:'Alertes stock',badge:'nb-stock-alertes'},
        {id:'stock-rapport',ic:ico('dashboard'),lb:'Rapport de stock'}
      ]},
      {id:'production',ic:ico('factory'),lb:'Production'},
      {id:'profil',ic:ico('building'),lb:'Entreprise'}
    ]},
  compta:{ic:ico('book'),nom:'Comptable',desc:'Journal, grand livre, balance, bilan, résultat et travaux de clôture.',
    items:[
      {id:'journal',ic:ico('book'),lb:'Journal',badge:'nb-journal'},
      {id:'grandlivre',ic:ico('bookOpen'),lb:'Grand livre'},
      {id:'lettrage',ic:ico('link'),lb:'Lettrage'},
      {id:'balance',ic:ico('hash'),lb:'Balance'},
      {id:'bilan',ic:ico('scale'),lb:'Bilan'},
      {id:'resultats',ic:ico('trendUp'),lb:'Compte de résultat'},
      {id:'tft',ic:ico('droplet'),lb:'Flux de trésorerie'},
      {id:'immo',ic:ico('layers'),lb:'Immobilisations'},
      {id:'inventaire',ic:ico('hash'),lb:'Inventaire'},
      {id:'provisions',ic:ico('alertTriangle'),lb:'Provisions'},
      {id:'analytique',ic:ico('dashboard'),lb:'Comptabilité analytique'},
      {id:'annexes',ic:ico('pencil'),lb:'Notes annexes'},
      {id:'audit',ic:ico('search'),lb:"Piste d'audit"}
    ]},
  fisc:{ic:ico('landmark'),nom:'Fiscalité',desc:'TVA, IS, liasse fiscale DGI, simulateur et calendrier fiscal togolais.',
    items:[
      {id:'tva',ic:ico('receipt'),lb:'TVA'},
      {id:'exercice',ic:ico('calendar'),lb:'Exercice fiscal'},
      {id:'exercice',ic:ico('landmark'),lb:'IS',scroll:'is-auto-kpis',cle:'is'},
      {id:'liasse',ic:ico('layers'),lb:'Liasse fiscale'},
      {id:'simulateur',ic:ico('calc'),lb:'Simulateur fiscal'},
      {id:'calendrier',ic:ico('calendar'),lb:'Calendrier fiscal'}
    ]},
  rh:{ic:ico('briefcase'),nom:'Ressources Humaines',desc:'Cycle de vie complet du personnel : dossiers, contrats, présence, congés, paie, carrière, documents.',
    items:[
      {id:'rh-dash',ic:ico('dashboard'),lb:'Tableau de bord RH'},
      {id:'rh-employes',ic:ico('users'),lb:'Employés'},
      {id:'rh-contrats',ic:ico('file'),lb:'Contrats'},
      {id:'rh-presence',ic:ico('clock'),lb:'Présence & pointage'},
      {id:'rh-conges',ic:ico('calendar'),lb:'Congés'},
      {id:'paie',ic:ico('wallet'),lb:'Paie & bulletins'},
      {id:'rh-perf',ic:ico('target'),lb:'Performance'},
      {id:'rh-formation',ic:ico('cap'),lb:'Formation'},
      {id:'rh-recrut',ic:ico('megaphone'),lb:'Recrutement'},
      {id:'rh-sante',ic:ico('health'),lb:'Santé & sécurité'},
      {id:'rh-discipline',ic:ico('scale'),lb:'Discipline'},
      {id:'rh-docs',ic:ico('file'),lb:'Documents RH'}
    ]},
  treso:{ic:ico('wallet'),nom:'Trésorier',desc:'Soldes, banques et suivi.',items:ITEMS_TRESO},
  ia:{ic:ico('bot'),nom:'IA',desc:'Outils intelligents.',items:ITEMS_IA}
};
var ORDRE_HUB=['exploitant','compta','fisc','rh'];
var SPEC_ACTUELLE=null;

/* Panneau → spécialisation propriétaire (priorité aux espaces dédiés). Liste
   complète et non filtrée par rôle — c'est construireHub() qui filtre les
   cartes visibles ; cette table doit rester complète pour que le contrôle
   d'accès (js/22-permissions.js) sache toujours à quel hub appartient un id. */
var PANE2SPEC={};
['compta','fisc','rh','treso','ia','exploitant'].forEach(function(k){
  (SPECS[k].items||[]).forEach(function(it){
    if(it.grp){it.items.forEach(function(s){if(s.id&&!(s.id in PANE2SPEC))PANE2SPEC[s.id]=k;});}
    else if(it.id&&!(it.id in PANE2SPEC))PANE2SPEC[it.id]=k;
  });
});

/* ── 2. Construction du menu latéral d'une spécialisation ── */
function itemHTML(it){
  var badge=it.badge?' <span class="badge" data-mirror="'+it.badge+'" style="display:none">0</span>':'';
  var action=it.fn?it.fn+'()':"v19Nav('"+it.id+"',"+(it.scroll?"'"+it.scroll+"'":'null')+",this)";
  var cle=it.cle||it.id||it.fn;
  return '<div class="nav-item" data-cle="'+cle+'" onclick="'+action+'"><span>'+it.ic+'</span> '+it.lb+badge+'</div>';
}
function construireNav(cle){
  SPEC_ACTUELLE=cle;
  var s=SPECS[cle], nav=document.getElementById('spec-nav');
  if(!nav||!s)return;
  var h='<div class="nav-item nav-retour" onclick="montrerHub()"><span>'+ico('home')+'</span> Accueil — spécialisations</div>';
  h+='<div class="spec-entete"><span class="tb-ic">'+s.ic+'</span> '+s.nom+'</div>';
  var estAdmin=!!(window.CURRENT_USER&&CURRENT_USER.role==='admin');
  s.items.filter(function(it){return !it.adminOnly||estAdmin;}).forEach(function(it){
    if(it.grp){
      h+='<div class="acc-header" onclick="v19Grp(\''+it.grp+'\')"><span>'+it.ic+'</span> '+it.lb+' <span class="acc-arrow" id="arr-v19-'+it.grp+'" style="margin-left:auto">▸</span></div>';
      h+='<div class="acc-body" id="body-v19-'+it.grp+'" style="display:none">'+it.items.map(itemHTML).join('')+'</div>';
    } else h+=itemHTML(it);
  });
  nav.innerHTML=h;
  majBoutonSpec();
  majBadges();
}
window.v19Grp=function(g){
  var b=document.getElementById('body-v19-'+g),a=document.getElementById('arr-v19-'+g);
  if(!b)return;
  var ouvert=b.style.display!=='none';
  b.style.display=ouvert?'none':'block';
  if(a)a.textContent=ouvert?'▸':'▾';
};

/* ── 3. Navigation ── */
function surligner(id,cle){
  var nav=document.getElementById('spec-nav');
  if(!nav)return;
  nav.querySelectorAll('.nav-item.actif-v19').forEach(function(n){n.classList.remove('actif-v19');});
  var cible=nav.querySelector('[data-cle="'+(cle||id)+'"]');
  if(cible){
    cible.classList.add('actif-v19');
    var corps=cible.closest('.acc-body');
    if(corps&&corps.style.display==='none'){corps.style.display='block';var fl=document.getElementById(corps.id.replace('body-','arr-'));if(fl)fl.textContent='▾';}
  }
}
window.v19Nav=function(id,scrollCible,el){
  window.go(id,null);
  if(el)surligner(null,el.getAttribute('data-cle'));
  if(scrollCible)setTimeout(function(){
    var c=document.getElementById(scrollCible);
    if(c){(c.closest('.card')||c).scrollIntoView({behavior:'smooth',block:'start'});}
  },120);
};

/* Enchaîner sur la navigation existante (mobile v18 + versions antérieures) */
var _go=window.go;
window.go=function(id,el){
  cacherHub();
  if(SPEC_ACTUELLE===null||(!(PANE2SPEC[id]===SPEC_ACTUELLE)&&!navContient(id))){
    if(PANE2SPEC[id])construireNav(PANE2SPEC[id]);
    else if(SPEC_ACTUELLE===null)construireNav(window.permPremierHubAutorise?permPremierHubAutorise():'exploitant');
  }
  if(typeof _go==='function')_go(id,el);
  surligner(id);
  fermerMenusTB();
};
function navContient(id){
  var nav=document.getElementById('spec-nav');
  return !!(nav&&nav.querySelector('[data-cle="'+id+'"]'));
}

/* ── 4. Écran d'accueil ── */
function nbModules(s){var n=0;s.items.forEach(function(it){n+=it.grp?it.items.length:1;});return n;}
function construireHub(){
  var hub=document.createElement('div');
  hub.id='hub';
  var cartes=ORDRE_HUB.map(function(k){
    var s=SPECS[k];
    return '<button class="hub-carte" data-hub="'+k+'" onclick="choisirSpec(\''+k+'\')">'+
      '<span class="hub-fleche">'+ico('chevronRight')+'</span>'+
      '<div class="hub-ic">'+s.ic+'</div>'+
      '<div class="hub-nom">'+s.nom.toUpperCase()+'</div>'+
      '<div class="hub-desc">'+s.desc+'</div>'+
      '<div class="hub-nb">'+nbModules(s)+' modules</div>'+
    '</button>';
  }).join('');
  hub.innerHTML='<div class="hub-int">'+
    '<div><div class="hub-logo">GEST<span> Africa</span></div><div class="hub-societe" id="hub-societe">Mon Entreprise SARL — <span id="hub-ex">Ex. 2026</span></div></div>'+
    '<div class="hub-titre">Choisissez votre espace de travail</div>'+
    '<div class="hub-sous">Chaque spécialisation regroupe ses modules dans le menu latéral.</div>'+
    '<div class="hub-cartes">'+cartes+'</div>'+
    '<div class="hub-note">💡 <span><strong>IA</strong> et <strong>Trésorerie</strong> restent accessibles à tout moment dans la barre du bas, ainsi que les alertes 🔔.</span></div>'+
  '</div>';
  document.body.appendChild(hub);
}
window.montrerHub=function(){
  var hub=document.getElementById('hub');
  if(hub){hub.classList.add('visible');majHubInfos();}
  var st=document.getElementById('tb-start');if(st)st.classList.add('tb-actif');
  fermerMenusTB();
  if(typeof window.fermerMenuMobile==='function')window.fermerMenuMobile();
};
function cacherHub(){
  var hub=document.getElementById('hub');
  if(hub)hub.classList.remove('visible');
  var st=document.getElementById('tb-start');if(st)st.classList.remove('tb-actif');
}
window.choisirSpec=function(k){
  construireNav(k);
  var premier=SPECS[k].items[0];
  var id=premier.grp?premier.items[0].id:premier.id;
  window.go(id,null);
};
function majHubInfos(){
  var sub=document.querySelector('.logo-sub'),ex=document.getElementById('ex-badge');
  var hs=document.getElementById('hub-societe'),he=document.getElementById('hub-ex');
  if(hs&&sub)hs.firstChild.textContent=sub.textContent+' — ';
  if(he&&ex)he.textContent=ex.textContent;
}

/* ── 5. Barre des tâches ── */
function construireTaskbar(){
  var tb=document.createElement('div');
  tb.id='taskbar';
  tb.innerHTML=
    '<button class="tb-btn" id="tb-start" onclick="montrerHub()" title="Accueil — spécialisations"><span class="tb-ic">'+ico('home')+'</span><span class="tb-lbl">Accueil</span></button>'+
    '<button class="tb-btn" id="tb-spec" onclick="retourSpec()"></button>'+
    '<div class="tb-sep"></div>'+
    '<button class="tb-btn" id="tb-ia" onclick="basculerMenuTB(event,\'menu-tb-ia\')"><span class="tb-ic">'+ico('bot')+'</span><span class="tb-lbl">IA</span></button>'+
    '<button class="tb-btn" id="tb-treso" onclick="basculerMenuTB(event,\'menu-tb-treso\')"><span class="tb-ic">'+ico('wallet')+'</span><span class="tb-lbl">Trésorerie</span></button>'+
    '<button class="tb-btn" id="tb-chat-ia" onclick="go(\'chat-ia\',this)" title="Chat IA — Copilote intelligent"><span class="tb-ic">'+ico('chat')+'</span><span class="tb-lbl">Chat IA</span></button>'+
    '<button class="tb-btn" id="tb-utilisateurs" onclick="go(\'utilisateurs\',this)" title="Gestion des utilisateurs" style="display:none"><span class="tb-ic">'+ico('shield')+'</span><span class="tb-lbl">Utilisateurs</span></button>'+
    '<div class="tb-spacer"></div>'+
    '<div class="tb-tray">'+
      '<button class="tb-btn" onclick="go(\'notifs\')" title="Alertes"><span class="tb-ic">'+ico('bell')+'</span><span class="tb-badge" data-mirror="nb-notifs" style="display:none">0</span></button>'+
      '<div id="tb-clock">--:--</div>'+
    '</div>';
  document.body.appendChild(tb);
  document.body.appendChild(construireMenuTB('menu-tb-ia',ico('bot')+' Outils IA',ITEMS_IA,'ia'));
  document.body.appendChild(construireMenuTB('menu-tb-treso',ico('wallet')+' Trésorerie',ITEMS_TRESO,'treso'));
  document.addEventListener('click',function(e){
    if(!e.target.closest('.tb-menu')&&!e.target.closest('#tb-ia')&&!e.target.closest('#tb-treso'))fermerMenusTB();
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape')fermerMenusTB();});
  majHorloge();setInterval(majHorloge,20000);
}
function construireMenuTB(id,titre,items,specCle){
  var m=document.createElement('div');
  m.className='tb-menu';m.id=id;
  m.innerHTML='<div class="tb-menu-titre">'+titre+'</div>'+items.map(function(it){
    var action=it.fn?('fermerMenusTB();'+it.fn+'()'):("v19MenuGo('"+it.id+"','"+specCle+"')");
    return '<button class="tb-menu-item" onclick="'+action+'"><span class="tb-ic">'+it.ic+'</span>'+it.lb+'</button>';
  }).join('');
  return m;
}
window.v19MenuGo=function(id,specCle){
  fermerMenusTB();
  if(SPEC_ACTUELLE!==specCle)construireNav(specCle);
  window.go(id,null);
};
window.basculerMenuTB=function(e,id){
  e.stopPropagation();
  var m=document.getElementById(id),etaitOuvert=m.classList.contains('ouvert');
  fermerMenusTB();
  if(etaitOuvert)return;
  m.classList.add('ouvert');
  var btn=e.target.closest('.tb-btn');
  if(window.innerWidth>700&&btn){
    var r=btn.getBoundingClientRect();
    m.style.left=Math.max(8,Math.min(r.left,window.innerWidth-m.offsetWidth-12))+'px';
  } else m.style.left='';
};
window.fermerMenusTB=function(){
  document.querySelectorAll('.tb-menu.ouvert').forEach(function(m){m.classList.remove('ouvert');});
};
window.retourSpec=function(){
  if(SPEC_ACTUELLE){cacherHub();majBoutonSpec();}
};
function majBoutonSpec(){
  var b=document.getElementById('tb-spec');
  if(!b)return;
  if(SPEC_ACTUELLE){
    var s=SPECS[SPEC_ACTUELLE];
    b.innerHTML='<span class="tb-ic">'+s.ic+'</span><span class="tb-lbl">'+s.nom+'</span>';
    b.style.display='flex';b.classList.add('tb-actif');
  } else b.style.display='none';
}
function majHorloge(){
  var c=document.getElementById('tb-clock');
  if(!c)return;
  var d=new Date();
  c.textContent=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
  c.title=d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}

/* ── 6. Synchronisation des compteurs (Journal, Alertes, Stock) ── */
function majBadges(){
  document.querySelectorAll('[data-mirror]').forEach(function(b){
    var src=document.getElementById(b.getAttribute('data-mirror'));
    if(!src)return;
    var v=(src.textContent||'').trim();
    b.textContent=v;
    b.style.display=(!v||v==='0'||src.style.display==='none')?'none':'';
  });
}
setInterval(majBadges,1500);

/* ── 7. Marque v19 (titre + pied de menu) ── */
function marqueV19(){
  try{
    document.title=document.title.replace(/v1[0-9]/,'v19');
    if(document.title.indexOf('v19')===-1)document.title='GEST Africa v19 — OHADA Togo';
    var f=document.getElementById('sidebar-footer');
    if(f)f.textContent=f.textContent.replace(/v1[0-9]/,'v19');
  }catch(e){}
}

/* ── 8. Initialisation ── */
var navOriginal=document.getElementById('sidebar-nav');
if(navOriginal){
  var specNav=document.createElement('div');
  specNav.className='sidebar-nav';specNav.id='spec-nav';
  navOriginal.parentNode.insertBefore(specNav,navOriginal.nextSibling);
}
construireHub();
construireTaskbar();
marqueV19();
window.montrerHub();

/* Après connexion → toujours arriver sur l'écran des spécialisations */
var _oas=window.onAuthSuccess;
window.onAuthSuccess=function(){
  if(typeof _oas==='function')_oas();
  marqueV19();
  SPEC_ACTUELLE=null;
  window.montrerHub();
};

// Exposé pour js/22-permissions.js (contrôle d'accès par rôle)
window.PANE2SPEC=PANE2SPEC;
window.SPECS=SPECS;
})();
