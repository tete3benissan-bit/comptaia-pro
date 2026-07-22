// v21: global search (tabs/accounts/entries/dates), account autocomplete, PDF/photo invoice import+OCR - extracted from ComptaIA_Pro_original.html lines 10377-10940
// ═══════════════════════════════════════════════════════════════
// GEST Africa v21 — LOGIQUE
// ═══════════════════════════════════════════════════════════════
(function(){
'use strict';
function $id(x){return document.getElementById(x);}

/* ─────────────────────────────────────────────
   A. COMPTES : référentiel + autocomplétion
   ───────────────────────────────────────────── */
var COMPTES_BASE={
  '411':'Clients (collectif)','401':'Fournisseurs (collectif)',
  '4011':'Fournisseurs — achats','4111':'Clients — ventes',
  '445':'État, TVA récupérable','443':'État, TVA facturée',
  '521':'Banque','571':'Caisse','601':'Achats de matières',
  '6011':'Achats de marchandises','701':'Ventes de produits',
  '7011':'Ventes de marchandises','7061':'Prestations de services',
  '66':'Charges de personnel','6611':'Salaires',
  '2411':'Matériel et outillage','2441':'Matériel de bureau',
  '281':'Amortissements','16':'Emprunts et dettes'
};
function tousLesComptes(){
  var m={};
  Object.keys(COMPTES_BASE).forEach(function(k){m[k]=COMPTES_BASE[k];});
  try{if(window.NOMS)Object.keys(NOMS).forEach(function(k){m[k]=NOMS[k];});}catch(e){}
  try{
    if(window.GL_EXTRA)Object.keys(GL_EXTRA).forEach(function(k){
      var g=GL_EXTRA[k];m[k]=(g&&(g.nom||g.intitule))||m[k]||('Compte '+k);
    });
  }catch(e){}
  try{
    if(window.EC)EC.forEach(function(e){
      ['cptD','cptC','tvaCpt'].forEach(function(f){
        var n=e[f];if(n&&!m[n])m[n]='Compte '+n;
      });
    });
  }catch(e){}
  return m;
}
function majDatalistComptes(){
  var dl=$id('dl-comptes');
  if(!dl){dl=document.createElement('datalist');dl.id='dl-comptes';document.body.appendChild(dl);}
  var m=tousLesComptes();
  dl.innerHTML=Object.keys(m).sort().map(function(k){
    return '<option value="'+k+'">'+k+' — '+m[k].replace(/"/g,'&quot;')+'</option>';
  }).join('');
}
/* Compte TVA → taux (inverse de TVA_P) */
function tauxDepuisCompteTVA(cpt){
  try{
    var best=null;
    Object.keys(TVA_P).forEach(function(k){
      if(k!=='custom'&&TVA_P[k].c===cpt)best={type:k,t:TVA_P[k].t};
    });
    return best;
  }catch(e){return null;}
}
function brancherChampCompte(inp){
  if(inp.getAttribute('data-v21'))return;
  inp.setAttribute('data-v21','1');
  inp.setAttribute('list','dl-comptes');
  inp.setAttribute('autocomplete','off');
  inp.addEventListener('change',function(){
    var v=(inp.value||'').trim();
    var m=tousLesComptes();
    /* saisie par libellé complet « 4111 — Clients » → ne garder que le n° */
    var mt=v.match(/^(\d{2,6})\s*—/);if(mt){inp.value=mt[1];v=mt[1];}
    if(inp.id==='gl-num'&&m[v]){var n=$id('gl-nom');if(n&&!n.value)n.value=m[v];}
    if(inp.id==='f-tva-cpt'){
      var tv=tauxDepuisCompteTVA(v);
      if(tv){
        var sel=$id('f-tva-type'),tx=$id('f-tva-taux');
        if(sel)sel.value=tv.type;if(tx)tx.value=tv.t;
        var lb=$id('f-tva-label');if(lb)lb.textContent='TVA '+tv.t+'% (auto)';
        try{if(typeof calcM==='function')calcM();}catch(e){}
      }
    }
    /* suivi du dernier champ compte utilisé (pour insertion via recherche) */
    dernierChampCompte=inp;
  });
  inp.addEventListener('focus',function(){dernierChampCompte=inp;});
}
var dernierChampCompte=null;
function equiperChampsComptes(){
  majDatalistComptes();
  var sel='input[id*="cpt"],input[id*="compte"],#gl-num';
  document.querySelectorAll(sel).forEach(function(inp){
    if(inp.type==='text'||inp.type==='search'||!inp.type)brancherChampCompte(inp);
  });
}

/* ─────────────────────────────────────────────
   B. RECHERCHE GLOBALE
   ───────────────────────────────────────────── */
function sansAccents(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
var MOIS_FR={janvier:1,janv:1,fevrier:2,fev:2,mars:3,avril:4,avr:4,mai:5,juin:6,juillet:7,juil:7,aout:8,septembre:9,sept:9,sep:9,octobre:10,oct:10,novembre:11,nov:11,decembre:12,dec:12};
function pad2(n){return('0'+n).slice(-2);}
function anneeDefaut(){
  try{if(window.EXERCICE&&EXERCICE.annee)return parseInt(EXERCICE.annee);}catch(e){}
  return new Date().getFullYear();
}
function parseDateFR(txt){
  var t=sansAccents(txt);
  /* aaaa-mm-jj */
  var m=t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m)return construireDate(+m[3],+m[2],+m[1],txt.replace(m[0],''));
  /* jj/mm[/aaaa] */
  m=t.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if(m){var a=m[3]?(+m[3]<100?2000+ +m[3]:+m[3]):anneeDefaut();return construireDate(+m[1],+m[2],a,txt.replace(m[0],''));}
  /* « 28 janvier [2026] » ou « 1er mars » */
  m=t.match(/(\d{1,2})(?:er)?\s+(janvier|janv|fevrier|fev|mars|avril|avr|mai|juin|juillet|juil|aout|septembre|sept|sep|octobre|oct|novembre|nov|decembre|dec)\.?\s*(\d{4})?/);
  if(m){return construireDate(+m[1],MOIS_FR[m[2]],m[3]?+m[3]:anneeDefaut(),t.replace(m[0],''));}
  return null;
}
function construireDate(j,mo,a,reste){
  if(!j||!mo||j>31||mo>12)return null;
  return {iso:a+'-'+pad2(mo)+'-'+pad2(j),fr:pad2(j)+'/'+pad2(mo)+'/'+a,
          reste:(reste||'').replace(/\b(du|le|au|a|à|de|d)\b/g,' ').trim()};
}
/* Index des onglets + synonymes */
var GS_MODULES=[
  {id:'dashboard',ic:'📊',lb:'Tableau de bord',mots:['dashboard','accueil admin','tableau','bord','pilotage']},
  {id:'facture',ic:'📄',lb:'Factures',mots:['facture','factures','facturation','vente','achat','avoir','doit']},
  {id:'devis',ic:'📋',lb:'Devis',mots:['devis','proforma']},
  {id:'bc',ic:'🛒',lb:'Bons de commande',mots:['bon de commande','commande','bc']},
  {id:'bl',ic:'🚚',lb:'Bons de livraison',mots:['bon de livraison','livraison','bl']},
  {id:'recurrentes',ic:'🔄',lb:'Factures récurrentes',mots:['recurrente','abonnement','recurrentes']},
  {id:'caisse',ic:'🧾',lb:'Caisse / PDV',mots:['caisse','pdv','point de vente','ticket','especes','espèces']},
  {id:'tiers',ic:'👥',lb:'Clients / Fournisseurs',mots:['client','clients','fournisseur','fournisseurs','tiers','annuaire']},
  {id:'stock',ic:'📦',lb:'Stock — vue d\'ensemble',mots:['stock','stocks','inventaire stock','magasin','produits']},
  {id:'stock-entrees',ic:'⬇️',lb:'Entrées de stock',mots:['entree','entrees','entree stock','entrées']},
  {id:'stock-sorties',ic:'⬆️',lb:'Sorties de stock',mots:['sortie','sorties','sortie stock']},
  {id:'stock-rapport',ic:'📊',lb:'Rapport de stock',mots:['rapport stock','valorisation']},
  {id:'production',ic:'🏭',lb:'Production',mots:['production','fabrication']},
  {id:'paie',ic:'💰',lb:'Paie & bulletins',mots:['paie','salaire','salaires','bulletin','bulletins','cnss']},
  {id:'profil',ic:'🏢',lb:'Entreprise',mots:['entreprise','societe','société','profil','parametres','paramètres']},
  {id:'journal',ic:'📒',lb:'Journal comptable',mots:['journal','ecriture','ecritures','écriture','saisie']},
  {id:'grandlivre',ic:'📚',lb:'Grand livre',mots:['grand livre','grandlivre','gl','livre','comptes']},
  {id:'lettrage',ic:'🔗',lb:'Lettrage',mots:['lettrage','lettrer','rapprocher factures']},
  {id:'balance',ic:'🔢',lb:'Balance',mots:['balance','balance generale']},
  {id:'bilan',ic:'⚖️',lb:'Bilan',mots:['bilan','actif','passif']},
  {id:'resultats',ic:'📈',lb:'Compte de résultat',mots:['resultat','compte de resultat','résultat','pertes','profits']},
  {id:'tft',ic:'💧',lb:'Flux de trésorerie',mots:['flux','tft','cash flow','tableau des flux']},
  {id:'immo',ic:'🏗️',lb:'Immobilisations',mots:['immobilisation','immobilisations','immo','amortissement','amortissements']},
  {id:'inventaire',ic:'🔢',lb:'Inventaire physique',mots:['inventaire','comptage']},
  {id:'provisions',ic:'⚠️',lb:'Provisions',mots:['provision','provisions','depreciation']},
  {id:'analytique',ic:'📊',lb:'Comptabilité analytique',mots:['analytique','centres de cout','couts']},
  {id:'annexes',ic:'📝',lb:'Notes annexes',mots:['annexe','annexes','notes']},
  {id:'audit',ic:'🔍',lb:'Piste d\'audit',mots:['audit','piste','historique','traçabilite']},
  {id:'tva',ic:'🧾',lb:'TVA',mots:['tva','taxe','declaration tva']},
  {id:'exercice',ic:'📅',lb:'Exercice fiscal',mots:['exercice','cloture','clôture','ouverture']},
  {id:'exercice',ic:'🏛️',lb:'Impôt sur les Sociétés (IS)',mots:['is','impot','impôt','impot societes'],scroll:'is-auto-kpis'},
  {id:'liasse',ic:'📑',lb:'Liasse fiscale',mots:['liasse','dgi','liasse fiscale']},
  {id:'simulateur',ic:'🧮',lb:'Simulateur fiscal',mots:['simulateur','simulation']},
  {id:'calendrier',ic:'🗓️',lb:'Calendrier fiscal',mots:['calendrier','echeances','échéances fiscales']},
  {id:'solde',ic:'💰',lb:'Solde Caisse / Banque',mots:['solde','soldes','tresorerie','trésorerie']},
  {id:'rapprochement',ic:'🏦',lb:'Rapprochement bancaire',mots:['banque','rapprochement','releve','relevé','bancaire']},
  {id:'multidevises',ic:'💱',lb:'Multi-devises',mots:['devise','devises','change','euro','dollar']},
  {id:'emprunts',ic:'🏛️',lb:'Emprunts',mots:['emprunt','emprunts','pret','prêt','credit bancaire']},
  {id:'suivi',ic:'📈',lb:'Suivi de trésorerie',mots:['suivi','previsionnel tresorerie']},
  {fn:'ouvrirIA',ic:'💬',lb:'Assistant IA',mots:['assistant','ia','chat','aide']},
  {id:'ocr',ic:'📷',lb:'OCR — scan de facture',mots:['ocr','scan','scanner','photo facture']},
  {id:'analyse',ic:'🔎',lb:'Analyse comptable IA',mots:['analyse','diagnostic']},
  {id:'prevision',ic:'📈',lb:'Prévisions IA',mots:['prevision','previsions','prévision','forecast']},
  {id:'scoring',ic:'⭐',lb:'Score financier',mots:['score','scoring','note financiere']},
  {id:'fraude',ic:'🚨',lb:'Détection d\'anomalies',mots:['anomalie','anomalies','fraude','erreurs']},
  {id:'benchmarks',ic:'📊',lb:'Benchmarks secteur',mots:['benchmark','benchmarks','secteur','comparaison']},
  {id:'rh-dash',ic:'📊',lb:'Tableau de bord RH',mots:['rh','ressources humaines','tableau rh','masse salariale']},
  {id:'rh-employes',ic:'👥',lb:'Employés (RH)',mots:['employe','employes','employé','employés','personnel','salarie','salariés','effectif']},
  {id:'rh-contrats',ic:'📃',lb:'Contrats (RH)',mots:['contrat','contrats','cdi','cdd','stage','prestataire']},
  {id:'rh-presence',ic:'🕒',lb:'Présence & pointage',mots:['pointage','presence','présence','retard','retards','heures supplementaires']},
  {id:'rh-conges',ic:'🌴',lb:'Congés',mots:['conge','conges','congé','congés','absence','absences','vacances']},
  {id:'rh-perf',ic:'🎯',lb:'Performance (RH)',mots:['evaluation','évaluation','objectifs','promotion','performance']},
  {id:'rh-formation',ic:'🎓',lb:'Formation (RH)',mots:['formation','formations','certification','certifications']},
  {id:'rh-recrut',ic:'📢',lb:'Recrutement',mots:['recrutement','offre emploi','candidat','candidature','candidatures','entretien','embauche']},
  {id:'rh-sante',ic:'🏥',lb:'Santé & sécurité',mots:['sante','santé','securite','sécurité','accident','visite medicale','epi']},
  {id:'rh-discipline',ic:'⚖️',lb:'Discipline (RH)',mots:['discipline','avertissement','sanction','sanctions']},
  {id:'rh-docs',ic:'📄',lb:'Documents RH',mots:['attestation','certificat de travail','document rh','lettre','signature']},
  {id:'notifs',ic:'🔔',lb:'Alertes',mots:['alerte','alertes','notification','notifications']}
];
function chercherModules(q){
  if(!q)return [];
  var res=[];
  GS_MODULES.forEach(function(mo){
    var lb=sansAccents(mo.lb),score=0;
    if(lb.indexOf(q)===0)score=3;else if(lb.indexOf(q)>-1)score=2;
    mo.mots.forEach(function(w){
      w=sansAccents(w);
      if(w===q)score=Math.max(score,4);
      else if(w.indexOf(q)===0)score=Math.max(score,2.5);
      else if(q.length>2&&w.indexOf(q)>-1)score=Math.max(score,1.5);
    });
    if(score>0)res.push({m:mo,s:score});
  });
  res.sort(function(a,b){return b.s-a.s;});
  return res.slice(0,5).map(function(r){return r.m;});
}
function chercherComptes(q){
  if(!q||q.length<2)return [];
  var m=tousLesComptes(),res=[];
  var estNum=/^\d+$/.test(q);
  Object.keys(m).forEach(function(num){
    if(estNum){if(num.indexOf(q)===0)res.push({num:num,nom:m[num],s:num.length===q.length?3:2});}
    else if(sansAccents(m[num]).indexOf(q)>-1)res.push({num:num,nom:m[num],s:1});
  });
  res.sort(function(a,b){return b.s-a.s||a.num.localeCompare(b.num);});
  return res.slice(0,6);
}
function chercherEcritures(q,date){
  var out=[];
  try{
    if(!window.EC)return out;
    for(var i=EC.length-1;i>=0&&out.length<6;i--){
      var e=EC[i];if(e.isTVA)continue;
      if(date&&e.date!==date.iso)continue;
      if(q){
        var blob=sansAccents((e.num||'')+' '+(e.cli||'')+' '+(e.desc||''));
        if(blob.indexOf(q)===-1)continue;
      }
      if(date||q)out.push(e);
    }
  }catch(e){}
  return out;
}
function chercherStocks(q){
  var out=[];
  try{
    if(!window.STOCKS||!q||q.length<2)return out;
    Object.keys(STOCKS).forEach(function(n){
      if(out.length<4&&sansAccents(n).indexOf(q)>-1)out.push(n);
    });
  }catch(e){}
  return out;
}

/* — Interface — */
function construireRecherche(){
  var tb=document.querySelector('.topbar');
  if(!tb||$id('gs-wrap'))return;
  var w=document.createElement('div');
  w.id='gs-wrap';
  w.innerHTML='<input type="text" id="gs-input" placeholder="Rechercher un onglet, un compte, une date… (Ctrl+K)" autocomplete="off"/><div id="gs-drop"></div>';
  var fj=$id('fj-topbar');
  if(fj)tb.insertBefore(w,fj);
  else{var dr=tb.querySelector('.topbar-right');if(dr)tb.insertBefore(w,dr);else tb.appendChild(w);}
  var inp=$id('gs-input'),drop=$id('gs-drop'),tim=null;
  inp.addEventListener('input',function(){clearTimeout(tim);tim=setTimeout(gsLancer,140);});
  inp.addEventListener('focus',function(){if(inp.value)gsLancer();});
  inp.addEventListener('keydown',function(e){
    if(e.key==='Escape'){gsFermer();inp.blur();}
    if(e.key==='Enter'){var p=drop.querySelector('.gs-item');if(p)p.dispatchEvent(new Event('mousedown'));}
  });
  document.addEventListener('click',function(e){if(!e.target.closest('#gs-wrap'))gsFermer();});
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();inp.focus();inp.select();}
  });
}
function gsFermer(){var d=$id('gs-drop');if(d)d.classList.remove('ouvert');}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function gsLancer(){
  var inp=$id('gs-input'),drop=$id('gs-drop');
  var brut=(inp.value||'').trim();
  if(!brut){gsFermer();return;}
  var date=parseDateFR(brut);
  var q=sansAccents(date?date.reste:brut).replace(/\b(du|le|au|a|de|d)\b/g,' ').replace(/\s+/g,' ').trim();
  var mods=chercherModules(q);
  var cpts=chercherComptes(q);
  var ecr=chercherEcritures(q,date);
  var stk=chercherStocks(q);
  var h='';
  if(date&&!q){
    h+='<div class="gs-sect">📅 Date détectée — '+date.fr+'</div>';
    h+='<div class="gs-item" data-act="journal-date"><span class="gs-ic">📒</span>Journal du '+date.fr+'<span class="gs-sub">'+ecr.length+' écriture(s)</span></div>';
  }
  if(mods.length){
    h+='<div class="gs-sect">📁 Onglets</div>';
    mods.forEach(function(m,i){
      var sub=date?('au '+date.fr):'';
      h+='<div class="gs-item" data-act="module" data-i="'+i+'"><span class="gs-ic">'+m.ic+'</span>'+esc(m.lb)+(sub?'<span class="gs-sub">'+sub+'</span>':'')+'</div>';
    });
  }
  if(cpts.length){
    h+='<div class="gs-sect">🔢 Comptes comptables</div>';
    cpts.forEach(function(c,i){
      h+='<div class="gs-item" data-act="compte" data-i="'+i+'"><span class="gs-ic"><span class="gs-num">'+c.num+'</span></span>'+esc(c.nom)+'<span class="gs-sub">'+(dernierChampCompte?'insérer ↵':'grand livre')+'</span></div>';
    });
  }
  if(ecr.length&&(q||date)){
    h+='<div class="gs-sect">🧾 Écritures'+(date?' du '+date.fr:'')+'</div>';
    ecr.forEach(function(e,i){
      h+='<div class="gs-item" data-act="ecriture" data-i="'+i+'"><span class="gs-ic">📄</span>'+esc(e.num||'—')+' · '+esc(e.cli||'')+'<span class="gs-sub">'+esc(e.dateF||'')+' · '+Math.round(e.ttc||e.debit||0).toLocaleString('fr-FR')+' F</span></div>';
    });
  }
  if(stk.length){
    h+='<div class="gs-sect">📦 Articles en stock</div>';
    stk.forEach(function(n,i){
      h+='<div class="gs-item" data-act="stock" data-i="'+i+'"><span class="gs-ic">📦</span>'+esc(n)+'</div>';
    });
  }
  if(!h)h='<div class="gs-vide">Aucun résultat pour « '+esc(brut)+' »</div>';
  drop.innerHTML=h;
  drop.classList.add('ouvert');
  /* actions (mousedown : avant la perte de focus) */
  drop.querySelectorAll('.gs-item').forEach(function(it){
    it.addEventListener('mousedown',function(ev){
      ev.preventDefault();
      gsExecuter(it.getAttribute('data-act'),+it.getAttribute('data-i'),{mods:mods,cpts:cpts,ecr:ecr,stk:stk,date:date});
    });
  });
}
function filtrerJournalDate(date){
  var f=$id('j-filter-from'),t=$id('j-filter-to');
  if(f)f.value=date.iso;if(t)t.value=date.iso;
  try{if(typeof renderJournal==='function')renderJournal();}catch(e){}
}
var lignesSurlignees=[];
function nettoyerSurlignage(){
  lignesSurlignees.forEach(function(tr){tr.classList.remove('gs-ligne-surl');});
  lignesSurlignees=[];
}
function surlignerDate(paneId,dateFr){
  setTimeout(function(){
    nettoyerSurlignage();
    var pane=$id('pane-'+paneId);if(!pane)return;
    var trs=pane.querySelectorAll('tbody tr');var premier=null;
    trs.forEach(function(tr){
      if(tr.textContent.indexOf(dateFr)>-1){
        tr.classList.add('gs-ligne-surl');lignesSurlignees.push(tr);
        if(!premier)premier=tr;
      }
    });
    if(premier)premier.scrollIntoView({behavior:'smooth',block:'center'});
  },260);
}
function gsExecuter(act,i,ctx){
  gsFermer();
  var inp=$id('gs-input');
  if(act==='journal-date'){
    window.go('journal',null);filtrerJournalDate(ctx.date);
  }
  else if(act==='module'){
    var m=ctx.mods[i];
    if(m.fn){try{window[m.fn]();}catch(e){}}
    else{
      window.go(m.id,null);
      if(m.scroll)setTimeout(function(){var c=$id(m.scroll);if(c)(c.closest('.card')||c).scrollIntoView({behavior:'smooth',block:'start'});},150);
      if(ctx.date){
        if(m.id==='journal')filtrerJournalDate(ctx.date);
        else surlignerDate(m.id,ctx.date.fr);
      }
    }
  }
  else if(act==='compte'){
    var c=ctx.cpts[i];
    if(dernierChampCompte&&document.body.contains(dernierChampCompte)){
      dernierChampCompte.value=c.num;
      dernierChampCompte.dispatchEvent(new Event('change'));
      dernierChampCompte.focus();
    }else{
      window.go('grandlivre',null);
      setTimeout(function(){
        nettoyerSurlignage();
        var pane=$id('pane-grandlivre');if(!pane)return;
        var el=null;
        pane.querySelectorAll('td,th,.card-title,div').forEach(function(n){
          if(!el&&n.children.length===0&&n.textContent.indexOf(c.num)>-1)el=n;
        });
        if(el){var tr=el.closest('tr');if(tr){tr.classList.add('gs-ligne-surl');lignesSurlignees.push(tr);}el.scrollIntoView({behavior:'smooth',block:'center'});}
      },300);
    }
  }
  else if(act==='ecriture'){
    var e=ctx.ecr[i];
    window.go('journal',null);
    var s=$id('j-search');if(s){s.value=e.num||e.cli||'';}
    try{if(typeof renderJournal==='function')renderJournal();}catch(er){}
  }
  else if(act==='stock'){
    window.go('stock',null);
    surlignerDate('stock',ctx.stk[i]);
  }
  if(inp)inp.value='';
}

/* ─────────────────────────────────────────────
   C. IMPORT DE FACTURE — PDF / PHOTO / CAMÉRA
   ───────────────────────────────────────────── */
var FIMP_DATA=null;
function construireImportFacture(){
  var pane=$id('pane-facture');
  if(!pane||$id('fimp-card'))return;
  var c=document.createElement('div');
  c.className='card';c.id='fimp-card';c.style.marginBottom='14px';
  c.innerHTML='<div class="card-body">'+
    '<div class="fimp-titre">🧾 Nouvelle facture — choisissez votre méthode</div>'+
    '<div class="fimp-sous">Saisie manuelle, ou import automatique : l\'IA lit le document, remplit le formulaire et prépare les écritures. Vous vérifiez, puis validez.</div>'+
    '<div class="fimp-btns">'+
      '<button type="button" class="fimp-btn" onclick="fimpManuel()"><span class="fimp-ic">✍️</span>Saisie manuelle<small>formulaire ci-dessous</small></button>'+
      '<button type="button" class="fimp-btn" onclick="$fimp(\'fimp-pdf\')"><span class="fimp-ic">📄</span>Import PDF<small>facture numérique</small></button>'+
      '<button type="button" class="fimp-btn" onclick="$fimp(\'fimp-photo\')"><span class="fimp-ic">🖼️</span>Import photo<small>depuis la galerie</small></button>'+
      '<button type="button" class="fimp-btn" onclick="$fimp(\'fimp-cam\')"><span class="fimp-ic">📷</span>Prendre une photo<small>appareil photo</small></button>'+
    '</div>'+
    '<input type="file" id="fimp-pdf" accept="application/pdf" style="display:none" onchange="fimpFichier(event)"/>'+
    '<input type="file" id="fimp-photo" accept="image/*" style="display:none" onchange="fimpFichier(event)"/>'+
    '<input type="file" id="fimp-cam" accept="image/*" capture="environment" style="display:none" onchange="fimpFichier(event)"/>'+
    '<div id="fimp-status"></div>'+
    '<div id="fimp-resume"></div>'+
  '</div>';
  pane.insertBefore(c,pane.firstChild);
}
window.$fimp=function(id){var f=$id(id);if(f){f.value='';f.click();}};
window.fimpManuel=function(){
  var f=$id('f-num')||$id('f-client');
  if(f){f.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){f.focus();},350);}
};
window.fimpFichier=function(ev){
  var f=ev.target.files&&ev.target.files[0];
  if(!f)return;
  if(f.size>9*1024*1024){fimpStatus('⚠ Fichier trop lourd (max 9 Mo). Réduisez la taille ou prenez une photo moins grande.','var(--red)');return;}
  fimpStatus('⏳ Lecture du document…','var(--amber)');
  var r=new FileReader();
  r.onload=function(e){fimpAnalyser(e.target.result,f.type);};
  r.onerror=function(){fimpStatus('⚠ Impossible de lire le fichier.','var(--red)');};
  r.readAsDataURL(f);
};
function fimpStatus(msg,coul){
  var s=$id('fimp-status');
  if(s){s.style.display='block';s.innerHTML='<span style="color:'+(coul||'var(--text)')+';font-weight:600">'+msg+'</span>';}
}
async function fimpAnalyser(dataUrl,mime){
  fimpStatus('🤖 Analyse IA du document — extraction des données comptables…','var(--amber)');
  var b64=dataUrl.split(',')[1];
  var estPDF=(mime||'').indexOf('pdf')>-1;
  var bloc=estPDF
    ?{type:'document',source:{type:'base64',media_type:'application/pdf',data:b64}}
    :{type:'image',source:{type:'base64',media_type:mime||'image/jpeg',data:b64}};
  var prompt='Tu es un expert-comptable OHADA (Togo). Analyse cette facture (ou reçu) et réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaire :\n'+
'{"type_document":"facture_achat|facture_vente|recu","numero_facture":"...","date":"YYYY-MM-DD","tiers":"nom du fournisseur ou client","description":"résumé court",'+
'"lignes":[{"designation":"...","quantite":0,"prix_unitaire":0,"taux_tva":18}],'+
'"montant_ht":0,"taux_tva":18,"montant_tva":0,"montant_ttc":0,'+
'"mode_paiement":"banque|espece|credit","echeance":"YYYY-MM-DD ou null","confiance":"haute|moyenne|basse"}\n'+
'Règles : montants en FCFA sans séparateurs ; si le document est une facture reçue d\'un fournisseur → type_document="facture_achat" ; si émise vers un client → "facture_vente" ; mode_paiement="credit" si paiement à échéance ou non précisé.';
  try{
    var r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1500,
        messages:[{role:'user',content:[bloc,{type:'text',text:prompt}]}]})
    });
    var d=await r.json();
    var texte=(d.content||[]).filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('\n');
    var parsed=JSON.parse(texte.replace(/```json|```/g,'').trim());
    FIMP_DATA=parsed;
    fimpRemplir(parsed);
  }catch(err){
    fimpStatus('⚠ Analyse impossible — vérifiez la connexion internet ou la netteté du document, puis réessayez.','var(--red)');
  }
}
function fimpRemplir(d){
  function set(id,v){var e=$id(id);if(e&&v!=null&&v!=='')e.value=v;}
  set('f-num',d.numero_facture);
  set('f-date',d.date);
  set('f-client',d.tiers);
  set('f-desc',d.description);
  if(d.echeance&&d.echeance!=='null')set('f-echeance',d.echeance);
  var type=d.type_document==='facture_achat'?'achat':'vente';
  set('f-type',type);
  if(d.mode_paiement){var p=$id('f-pay');if(p&&[].some.call(p.options,function(o){return o.value===d.mode_paiement;}))p.value=d.mode_paiement;}
  /* TVA : sélectionne le préréglage OHADA → compte appliqué automatiquement */
  var taux=parseFloat(d.taux_tva)||0;
  var cle=taux===18?(type==='achat'?'18a':'18v'):taux===8?'8t':taux===5?'5i':taux===10?'10s':taux===0?'0':'custom';
  var selT=$id('f-tva-type');
  if(selT){selT.value=cle;try{if(typeof onTvaChange==='function')onTvaChange();}catch(e){}}
  if(cle==='custom'){set('f-tva-taux',taux);set('f-tva-cpt',type==='achat'?'4452':'4431');}
  /* Lignes produits → tableau multi-lignes (HT recalculé automatiquement) */
  var ok=false;
  try{
    if(Array.isArray(d.lignes)&&d.lignes.length&&window.ML_LIGNES&&typeof renderMLTable==='function'){
      ML_LIGNES.length=0;
      d.lignes.forEach(function(l,i){
        ML_LIGNES.push({id:'imp'+Date.now()+'_'+i,desc:l.designation||'',qty:parseFloat(l.quantite)||1,
          unite:'unité',pu:parseFloat(l.prix_unitaire)||0,tva:parseFloat(l.taux_tva)||taux,
          ht:Math.round((parseFloat(l.quantite)||1)*(parseFloat(l.prix_unitaire)||0))});
      });
      renderMLTable();ok=true;
    }
  }catch(e){}
  if(!ok&&d.montant_ht)set('f-ht',Math.round(d.montant_ht));
  var q=(d.lignes||[]).reduce(function(s,l){return s+(parseFloat(l.quantite)||0);},0);
  if(q)set('f-qty',q);
  try{if(typeof calcM==='function')calcM();}catch(e){}
  /* Résumé + consigne de vérification */
  var conf=d.confiance||'—';
  var cc=conf==='haute'?'var(--green)':conf==='moyenne'?'var(--amber)':'var(--red)';
  var res=$id('fimp-resume');
  if(res){
    res.style.display='block';
    res.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
      '<strong>✓ Document analysé : '+esc(d.tiers||'—')+' · '+esc(d.numero_facture||'—')+'</strong>'+
      '<span style="font-size:10px;padding:2px 8px;border-radius:var(--radius);background:var(--bg);color:'+cc+';font-weight:700">Confiance : '+conf+'</span></div>'+
      '<div style="color:var(--text-muted)">HT '+fmtSafe(d.montant_ht)+' · TVA '+fmtSafe(d.montant_tva)+' ('+(d.taux_tva||0)+'%) · TTC <strong>'+fmtSafe(d.montant_ttc)+'</strong> FCFA'+
      ((d.lignes||[]).length?' · '+d.lignes.length+' ligne(s) produit':'')+'</div>'+
      '<div style="margin-top:6px;color:var(--green-dark);font-weight:600">👇 Vérifiez le formulaire ci-dessous, corrigez si besoin, puis cliquez sur <u>Valider</u> : les écritures (journal, grand livre, TVA, stock, comptes) seront générées automatiquement.</div>';
  }
  fimpStatus('✓ Extraction terminée — vérification avant validation.','var(--green)');
  var f=$id('f-num');if(f)f.scrollIntoView({behavior:'smooth',block:'center'});
}
function fmtSafe(n){return Math.round(parseFloat(n)||0).toLocaleString('fr-FR');}

/* ─────────────────────────────────────────────
   D. DIVERS : bouton IA topbar, marque, init
   ───────────────────────────────────────────── */
function retirerBoutonIATopbar(){
  document.querySelectorAll('.topbar-right button').forEach(function(b){
    if(/ouvrirIA/.test(b.getAttribute('onclick')||''))b.remove();
  });
}
function marqueV21(){
  try{
    document.title=document.title.replace(/v[12][0-9]/,'v21');
    if(document.title.indexOf('v21')===-1)document.title='GEST Africa v21 — OHADA Togo';
    var f=$id('sidebar-footer');
    if(f)f.textContent=f.textContent.replace(/v[12][0-9]/,'v21');
  }catch(e){}
}

/* — Initialisation — */
try{construireRecherche();}catch(e){}
try{construireImportFacture();}catch(e){}
try{retirerBoutonIATopbar();}catch(e){}
try{equiperChampsComptes();}catch(e){}
marqueV21();

/* Nettoyer le surlignage à chaque navigation */
try{
  var _go21=window.go;
  window.go=function(id,el){
    nettoyerSurlignage();
    if(typeof _go21==='function')_go21(id,el);
  };
}catch(e){}

/* Ré-équiper les champs quand les panneaux se régénèrent */
try{
  var t21=null;
  new MutationObserver(function(){
    if(t21)return;
    t21=setTimeout(function(){t21=null;
      try{equiperChampsComptes();construireImportFacture();retirerBoutonIATopbar();}catch(e){}
    },400);
  }).observe(document.querySelector('.content')||document.body,{childList:true,subtree:true});
}catch(e){}

var _oas21=window.onAuthSuccess;
window.onAuthSuccess=function(){
  if(typeof _oas21==='function')_oas21();
  try{equiperChampsComptes();}catch(e){}
  marqueV21();
};

/* Exposé pour tests */
window.__v21={parseDateFR:parseDateFR,chercherModules:chercherModules,chercherComptes:chercherComptes,sansAccents:sansAccents};
})();
