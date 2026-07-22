// Core state + facture/journal/GL/lettrage/bilan/resultats/balance/solde/analyse/IS/exercice/stock/demo - extracted from ComptaIA_Pro_original.html lines 1148-2484
// ═══════════════════════════════════════════════════════
// ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════
var EC=[],REGL=[],NOTIFS=[],VIREMENTS=[],TIERS=[];
var STOCKS={},GL_EXTRA={};
var SOLDES={caisse:0,banque:0,caisseDefini:false,banqueDefini:false};
var EXERCICE={annee:2026,debut:'2026-01-01',fin:'2026-12-31'};
var EXERCICES_ARCHIVES=[];
var LETTRAGE={}; // { 'A': [idx1,idx2,...], ... }
var currentPage='facture';
var FACTURE_MODE='doit';
var GL_MODE='tab';
var modalReglIdx=-1,editIdx=-1,editSrc='EC';
var pendingFacture=null;

var NOMS={
  '7011':'Ventes de marchandises','7061':'Prestations de services',
  '4111':'Clients','401':'Fournisseurs','571':'Caisse','521':'Banque',
  '6011':'Achats de marchandises','3111':'Stock matières',
  '4431':'TVA facturée sur vente','4452':'TVA récupérable achat',
  '4454':'TVA récupérable transport','4453':'TVA à l\'importation',
  '4455':'TVA services ext.','419':'Avances clients','4091':'Avances fourn.',
  '110':'Report à nouveau créditeur','119':'Report à nouveau débiteur',
  '12':'Résultat net de l\'exercice','1301':'Résultat — bénéfice','1302':'Résultat — perte'
};
var TVA_P={'18v':{t:18,c:'4431'},'18a':{t:18,c:'4452'},'8t':{t:8,c:'4454'},'5i':{t:5,c:'4453'},'10s':{t:10,c:'4455'},'0':{t:0,c:''},'custom':{t:18,c:'4431'}};

function fmt(n){return Math.round(n||0).toLocaleString('fr-FR')}
function fmtD(d){if(!d)return'';var p=d.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d}
function nowStr(){var d=new Date();return d.toLocaleDateString('fr-FR')+' à '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
function nb(id){return document.getElementById(id)}

// ═══ INIT DATE ═══
window.onload=function(){
  nb('f-date').value=new Date().toISOString().split('T')[0];
  nb('vir-date').value=new Date().toISOString().split('T')[0];
  updateNumAuto();
  chargerLocalStorage();
  verifierRetards();
};

// ═══ SAUVEGARDE LOCALE AUTO ═══
function sauvegarderAuto(){
  try{localStorage.setItem('comptaia_data',JSON.stringify({EC,REGL,NOTIFS,VIREMENTS,TIERS,STOCKS,GL_EXTRA,SOLDES,EXERCICE,EXERCICES_ARCHIVES,LETTRAGE,SALAIRES,DED_EXTRAS,FACTURE_MODE,NOMS,IMMOS,BUDGETS}));}catch(e){}
}
function chargerLocalStorage(){
  try{
    var d=localStorage.getItem('comptaia_data');
    if(!d)return;
    var obj=JSON.parse(d);
    if(obj.EC)EC=obj.EC;
    if(obj.REGL)REGL=obj.REGL;
    if(obj.NOTIFS)NOTIFS=obj.NOTIFS;
    if(obj.VIREMENTS)VIREMENTS=obj.VIREMENTS;
    if(obj.TIERS)TIERS=obj.TIERS;
    if(obj.STOCKS)STOCKS=obj.STOCKS;
    if(obj.GL_EXTRA)GL_EXTRA=obj.GL_EXTRA;
    if(obj.SOLDES)SOLDES=obj.SOLDES;
    if(obj.EXERCICE)EXERCICE=obj.EXERCICE;
    if(obj.EXERCICES_ARCHIVES)EXERCICES_ARCHIVES=obj.EXERCICES_ARCHIVES;
    if(obj.LETTRAGE)LETTRAGE=obj.LETTRAGE;
    if(obj.SALAIRES)SALAIRES=obj.SALAIRES;
    if(obj.DED_EXTRAS)DED_EXTRAS=obj.DED_EXTRAS;
    if(obj.NOMS)Object.assign(NOMS,obj.NOMS);
    if(obj.IMMOS)IMMOS=obj.IMMOS;
    if(obj.BUDGETS)BUDGETS=obj.BUDGETS;
    nb('nb-journal').textContent=EC.length;
    if(EC.length){renderAll();}
    syncTiersList();syncProduitSelect();
    try{renderSalaires();renderDedExtras();}catch(e){}
    if(obj.EXERCICE)nb('ex-badge').textContent='Ex. '+obj.EXERCICE.annee;
  }catch(e){}
}

function exporterJSON(){
  var blob=new Blob([JSON.stringify({EC,REGL,NOTIFS,VIREMENTS,TIERS,STOCKS,GL_EXTRA,SOLDES,EXERCICE,EXERCICES_ARCHIVES,LETTRAGE,NOMS},null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='GestAfrica_'+EXERCICE.annee+'_'+new Date().toISOString().split('T')[0]+'.json';a.click();
  ajouterNotif('save','Sauvegarde exportée','Fichier JSON téléchargé : '+a.download);
}
function importerJSON(){nb('import-file').click();}
function lireJSON(ev){
  var file=ev.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var obj=JSON.parse(e.target.result);
      if(obj.EC)EC=obj.EC;if(obj.REGL)REGL=obj.REGL;
      if(obj.NOTIFS)NOTIFS=obj.NOTIFS;if(obj.VIREMENTS)VIREMENTS=obj.VIREMENTS;
      if(obj.TIERS)TIERS=obj.TIERS;if(obj.STOCKS)STOCKS=obj.STOCKS;
      if(obj.GL_EXTRA)GL_EXTRA=obj.GL_EXTRA;if(obj.SOLDES)SOLDES=obj.SOLDES;
      if(obj.EXERCICE)EXERCICE=obj.EXERCICE;
      if(obj.EXERCICES_ARCHIVES)EXERCICES_ARCHIVES=obj.EXERCICES_ARCHIVES;
      if(obj.LETTRAGE)LETTRAGE=obj.LETTRAGE;
      if(obj.NOMS)Object.assign(NOMS,obj.NOMS);
    if(obj.IMMOS)IMMOS=obj.IMMOS;
    if(obj.BUDGETS)BUDGETS=obj.BUDGETS;
      nb('nb-journal').textContent=EC.length;
      if(obj.EXERCICE)nb('ex-badge').textContent='Ex. '+obj.EXERCICE.annee;
      syncTiersList();syncProduitSelect();renderAll();
      alert('Données chargées avec succès — '+EC.length+' écritures, '+REGL.length+' règlements.');
    }catch(err){alert('Erreur de lecture du fichier JSON : '+err.message);}
  };
  reader.readAsText(file);
  ev.target.value='';
}

function exporterPDF(){
  window.print();
}

// ═══ NAVIGATION ═══
function go(id,el){
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  nb('pane-'+id).classList.add('active');
  if(el)el.classList.add('active');
  var T={facture:'Facture',tiers:'Clients / Fournisseurs',journal:'Journal',grandlivre:'Grand livre',lettrage:'Lettrage',bilan:'Bilan',resultats:'Compte de résultats',balance:'Balance',solde:'Solde Caisse/Banque',analyse:'Analyse comptable',stock:'Stock',suivi:'Suivi',exercice:'Exercice fiscal',notifs:'Notifications & Alertes'};
  nb('page-title').textContent=T[id]||id;
  currentPage=id;
  if(id==='solde')renderSolde();
  if(id==='analyse')renderAnalyse();
  if(id==='lettrage')renderLettrage();
  if(id==='exercice'){renderExercice();renderSalaires();renderDedExtras();calcImpot();}
}

// ═══ MODE DOIT/AVOIR ═══
function setMode(mode){
  FACTURE_MODE=mode;
  var btnD=nb('ftt-doit'),btnA=nb('ftt-avoir');
  if(mode==='doit'){btnD.className='ftt-btn ftt-doit';btnA.className='ftt-btn';nb('facture-card-title').textContent='Nouvelle facture — DOIT';}
  else{btnA.className='ftt-btn ftt-avoir';btnD.className='ftt-btn';nb('facture-card-title').textContent='Nouvelle facture — AVOIR (Retour marchandises)';}
  updateNumAuto();
}

// ═══ NUMÉRO AUTO ═══
function updateNumAuto(){
  var pref=FACTURE_MODE==='avoir'?'AV':'F';
  var annee=EXERCICE.annee;
  var nb_fact=EC.filter(e=>!e.isAvance).length+1;
  var num=pref+annee+'-'+String(nb_fact).padStart(3,'0');
  nb('num-auto-preview').textContent=num;
  if(!nb('f-num').value)nb('f-num').value=num;
}

// ═══ TVA ═══
function onTvaChange(){
  var sel=nb('f-tva-type').value;
  if(sel==='custom')return;
  var p=TVA_P[sel];if(!p)return;
  nb('f-tva-taux').value=p.t;
  nb('f-tva-cpt').value=p.c;
  nb('f-tva-label').textContent='TVA '+p.t+'% (auto)';
  calcM();
}

// ═══ CALCUL MONTANTS ═══
function calcM(){
  var ht=parseFloat(nb('f-ht').value)||0;
  var escp=parseFloat(nb('f-escompte').value)||0;
  var tr=parseFloat(nb('f-tr').value)||0;
  var port=parseFloat(nb('f-port').value)||0;
  var rrr=parseFloat(nb('f-rrr').value)||0;
  var avance=parseFloat(nb('f-avance').value)||0;
  var tvaTaux=parseFloat(nb('f-tva-taux').value)||0;
  var escVal=Math.round(ht*escp/100);
  var htNet=ht-escVal-rrr;
  var tva=Math.round(htNet*tvaTaux/100);
  var ttc=htNet+tva+tr+port;
  var resteDu=Math.max(0,ttc-avance);
  nb('f-escompte-val').value=escVal?'- '+fmt(escVal)+' FCFA':'';
  nb('f-ht-net').value=htNet?fmt(htNet)+' FCFA':'';
  nb('f-tva-val').value=tva?fmt(tva)+' FCFA':'0 FCFA';
  nb('f-ttc').value=ttc?fmt(ttc)+' FCFA':'';
  nb('f-reste-du').textContent=ttc?fmt(resteDu)+' FCFA':'—';
  nb('f-reste-du').style.color=resteDu===0&&ttc>0?'var(--green)':'var(--text)';
}
function calcStockVal(){
  var q=parseFloat(nb('s-qte').value)||0,pu=parseFloat(nb('s-pu').value)||0;
  nb('s-val').value=(q*pu)?fmt(q*pu)+' FCFA':'';
}

// ═══ COMPTES ═══
function getComptes(type,pay,avoir){
  var enc=pay==='banque'?'521':pay==='espece'?'571':'4111';
  var encp=pay==='banque'?'521':pay==='espece'?'571':'401';
  if(avoir){
    if(type==='vente')return{d:'7011',c:enc};
    if(type==='service')return{d:'7061',c:enc};
    if(type==='achat')return{d:encp,c:'6011'};
    return{d:'7011',c:'4111'};
  }
  if(type==='vente')return{d:enc,c:'7011'};
  if(type==='service')return{d:enc,c:'7061'};
  if(type==='achat')return{d:'6011',c:encp};
  return{d:'4111',c:'7011'};
}

// ═══ VALIDER FACTURE ═══
function valider(){
  var date=nb('f-date').value;
  var num=nb('f-num').value.trim();
  var cli=nb('f-client').value.trim();
  var type=nb('f-type').value;
  var desc=nb('f-desc').value.trim();
  var ht=parseFloat(nb('f-ht').value)||0;
  var pay=nb('f-pay').value;
  var qty=parseFloat(nb('f-qty').value)||0;
  var cp=parseFloat(nb('f-cout-pre').value)||0;
  var stat=nb('f-statut').value;
  var escp=parseFloat(nb('f-escompte').value)||0;
  var rrr=parseFloat(nb('f-rrr').value)||0;
  var avance=parseFloat(nb('f-avance').value)||0;
  var port=parseFloat(nb('f-port').value)||0;
  var tvaTaux=parseFloat(nb('f-tva-taux').value)||0;
  var tvaCpt=nb('f-tva-cpt').value.trim();
  var tvaType=nb('f-tva-type').value;
  var echeance=nb('f-echeance').value;
  var avoir=FACTURE_MODE==='avoir';

  var err=[];
  if(!num)err.push('N° de facture');
  if(!cli)err.push('Client / Fournisseur');
  if(!type)err.push('Type de transaction');
  if(!desc)err.push('Désignation');
  if(!ht)err.push('Montant HT');
  if(!pay)err.push('Mode de paiement');

  nb('ia-tip').style.display='none';
  if(err.length){nb('ia-err').style.display='block';nb('ia-ok').style.display='none';nb('ia-err').innerHTML='<strong>⚠ Champs manquants :</strong> '+err.join(' · ');return;}
  nb('ia-err').style.display='none';

  var escVal=Math.round(ht*escp/100);
  var htNet=ht-escVal-rrr;
  var tva=Math.round(htNet*tvaTaux/100);
  var tr=parseFloat(nb('f-tr').value)||0;
  var ttc=htNet+tva+tr+port;
  var resteDu=Math.max(0,ttc-avance);
  var cpts=getComptes(type,pay,avoir);
  var dateF=fmtD(date);

  // ── Écriture principale TTC ──
  var e={
    date,dateF,num,desc:desc+' — '+cli,cli,
    cptD:cpts.d,cptC:cpts.c,
    debit:ttc,credit:ttc,pay,stat,
    ht,htNet,escVal,escPct:escp,rrr,tva,tvaTaux,tvaCpt,tvaType,
    tr,port,ttc,avance,resteDu,echeance,
    type,qty,cp,coutReel:htNet,
    avoir,modeLabel:avoir?'AVOIR':'DOIT',lettre:'',_modifie:false
  };
  EC.push(e);

  // ── Écriture TVA séparée (si TVA > 0) ──
  // CORRECTION DÉFAUT 1 : écriture TVA en 3e ligne
  if(tva>0 && tvaCpt){
    var cptTvaD, cptTvaC;
    if(type==='vente'&&!avoir){cptTvaD=cpts.d;cptTvaC=tvaCpt;} // D client / C TVA collectée
    else if(type==='achat'&&!avoir){cptTvaD=tvaCpt;cptTvaC=cpts.c;} // D TVA récupérable / C fourn.
    else if(avoir){cptTvaD=tvaCpt;cptTvaC=cpts.c;}
    else{cptTvaD=cpts.d;cptTvaC=tvaCpt;}
    EC.push({
      date,dateF,num:'TVA-'+num,
      desc:'TVA '+tvaTaux+'% — '+num,cli,
      cptD:cptTvaD||tvaCpt,cptC:cptTvaC||tvaCpt,
      debit:tva,credit:tva,pay,stat:'payee',
      ht:0,htNet:0,escVal:0,escPct:0,rrr:0,tva,tvaTaux,tvaCpt,tvaType,
      tr:0,port:0,ttc:tva,avance:0,resteDu:0,echeance:'',
      type:'tva',qty:0,cp:0,coutReel:0,
      avoir,modeLabel:avoir?'AVOIR':'DOIT',lettre:'',_modifie:false,isTVA:true
    });
  }

  // ── Écriture avance ──
  if(avance>0){
    var cptAv=type==='achat'?'4091':'419';
    var cptEnc=pay==='banque'?'521':pay==='espece'?'571':(type==='achat'?'401':'4111');
    EC.push({
      date,dateF,num:'AVA-'+num,desc:'Avance — '+cli,cli,
      cptD:type==='achat'?cptAv:cptEnc,cptC:type==='achat'?cptEnc:cptAv,
      debit:avance,credit:avance,pay,stat:'payee',
      ht:0,htNet:0,escVal:0,escPct:0,rrr:0,tva:0,tvaTaux:0,tvaCpt:'',tvaType:'',
      tr:0,port:0,ttc:avance,avance:0,resteDu:0,echeance:'',
      type:'avance',qty:0,cp:0,coutReel:0,
      avoir:false,modeLabel:'DOIT',lettre:'',_modifie:false,isAvance:true
    });
  }

  // ── Auto-ajout du tiers ──
  if(cli&&!TIERS.find(t=>t.nom===cli)){
    TIERS.push({nom:cli,type:type==='achat'?'fournisseur':'client',tel:'',email:'',adresse:''});
    syncTiersList();
  }

  // ── Mise à jour soldes ──
  if(stat==='payee'&&(pay==='espece'||pay==='banque')){
    var isEnc=(type==='vente'||type==='service')&&!avoir;
    if(pay==='espece')SOLDES.caisse+=isEnc?ttc:-ttc;
    else SOLDES.banque+=isEnc?ttc:-ttc;
    VIREMENTS.push({date:dateF,desc:desc+' — '+cli,ref:num,compte:pay==='espece'?'caisse':'banque',sens:isEnc?'in':'out',montant:ttc,type:(avoir?'AVOIR ':'')+type});
  }

  // ── Stock ──
  var nomProduit=nb('f-produit-stock').value;
  var unite=nb('f-unite').value;
  if(nomProduit&&qty>0&&STOCKS[nomProduit]){
    if(type==='service'){
      pendingFacture={e,htNet,nomProduit,qty,unite,dateF,num,cpts,pm:pay,extras:[],extStr:'',ttc,desc,cli,type,avoir};
      nb('sc-ctx').innerHTML='Facture de type <strong>Service</strong> mais produit stocké sélectionné. Sens du mouvement ?';
      nb('sc-prod').textContent=nomProduit;nb('sc-qty').textContent=qty+' '+unite;nb('sc-act').textContent=fmt(STOCKS[nomProduit].qteActuelle)+' '+STOCKS[nomProduit].unite;
      nb('modal-stock').style.display='flex';return;
    }
    var puStock=type==='achat'?Math.round(htNet/qty):STOCKS[nomProduit].cmup;
    mouvementStock(nomProduit,avoir?'vente':type,qty,puStock,dateF,num);
  }
  finaliserFacture(e,ttc,pay,cpts,num,desc,cli,type,avoir);
}

function finaliserFacture(e,ttc,pm,cpts,num,desc,cli,type,avoir){
  nb('ia-ok').style.display='block';
  var pmL=pm==='espece'?'Espèce':pm==='banque'?'Banque':'À crédit';
  nb('ia-ok').innerHTML=(avoir?'<span class="badge bg-purple">AVOIR</span> ':'')+`✓ Facture <strong>${num}</strong> validée — TTC : <strong>${fmt(ttc)} FCFA</strong> (${pmL})<br>Écriture : D <strong>${cpts.d}</strong> / C <strong>${cpts.c}</strong> — Tous onglets mis à jour.`;
  nb('nb-journal').textContent=EC.length;
  ajouterNotif('facture',(avoir?'[AVOIR] ':'')+'Facture '+num+' enregistrée',desc+' — '+cli+' | '+fmt(ttc)+' FCFA | '+pmL);
  updateNumAuto();
  renderAll();
  sauvegarderAuto();
  verifierRetards();
}

// ═══ RENDER ALL ═══
function renderAll(){renderJournal();renderGL();renderBilan();renderResultats();renderBalance();renderSuivi();renderAnalyse();renderSolde();renderLettrage();if(currentPage==='exercice')renderExercice();}

// ═══ VÉRIFIER RETARDS ═══
function verifierRetards(){
  var retard=EC.filter(e=>{
    if(e.stat!=='attente')return false;
    var echeance=e.echeance||e.date;
    var d=new Date(echeance||e.date);
    var diff=(new Date()-d)/(1000*60*60*24);
    return diff>30;
  });
  var b=nb('retard-banner');
  if(retard.length>0){
    b.style.display='block';
    b.innerHTML='⚠️ <strong>'+retard.length+' facture(s) en retard de +30 jours</strong> : '+retard.map(e=>e.num).join(', ')+'  — <a href="#" onclick="go(\'journal\',document.querySelectorAll(\'.nav-item\')[2])" style="color:var(--red);font-weight:700">Voir le journal →</a>';
    ajouterNotif('retard','Factures en retard de paiement',retard.map(e=>e.num+' ('+e.cli+')').join(' · '));
  } else b.style.display='none';
}

// ═══ NOTIFICATIONS ═══
function ajouterNotif(type,titre,detail){
  // Éviter les doublons retard
  if(type==='retard'&&NOTIFS.find(n=>n.titre===titre))return;
  NOTIFS.unshift({type,titre,detail,heure:nowStr(),lu:false});
  renderNotifs();
}
function renderNotifs(){
  var unread=NOTIFS.filter(n=>!n.lu).length;
  var b=nb('nb-notifs');
  if(unread>0){b.textContent=unread;b.style.display='inline-block';}else b.style.display='none';
  var list=nb('notifs-list');
  if(!NOTIFS.length){list.innerHTML='<div style="text-align:center;color:var(--text-faint);padding:32px;font-style:italic">Aucune notification</div>';return;}
  var h='';
  NOTIFS.forEach((n,i)=>{
    var icon=n.type==='modif'?'✏️':n.type==='facture'?'📄':n.type==='reglement'?'✅':n.type==='virement'?'🔄':n.type==='retard'?'⚠️':n.type==='save'?'💾':'🔔';
    var bL=n.lu?'3px solid var(--border)':n.type==='retard'?'3px solid var(--red)':n.type==='modif'?'3px solid var(--amber)':n.type==='virement'?'3px solid var(--blue)':'3px solid var(--green)';
    h+=`<div style="background:${n.lu?'var(--bg)':'var(--surface)'};border:2px solid var(--border);border-left:${bL};border-radius:var(--radius);padding:10px 14px;margin-bottom:8px;cursor:pointer" onclick="marquerLu(${i})">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
        <div style="display:flex;align-items:center;gap:7px">
          <span style="font-size:15px">${icon}</span>
          <div>
            <div style="font-size:12.5px;font-weight:${n.lu?400:600}">${n.titre}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:1px;line-height:1.5">${n.detail}</div>
          </div>
        </div>
        <div style="font-size:9px;color:var(--text-faint);white-space:nowrap;flex-shrink:0">${n.heure}${n.lu?'':' ●'}</div>
      </div>
    </div>`;
  });
  list.innerHTML=h;
}
function marquerLu(i){NOTIFS[i].lu=true;renderNotifs();}
function toutLu(){NOTIFS.forEach(n=>n.lu=true);renderNotifs();}

// ═══ TIERS ═══
function ajouterTiers(){
  var nom=nb('t-nom').value.trim();
  if(!nom){alert('Veuillez saisir le nom.');return;}
  if(TIERS.find(t=>t.nom===nom)){alert('Ce tiers existe déjà.');return;}
  TIERS.push({nom,type:nb('t-type').value,tel:nb('t-tel').value.trim(),email:nb('t-email').value.trim(),adresse:nb('t-adresse').value.trim()});
  ['t-nom','t-tel','t-email','t-adresse'].forEach(id=>nb(id).value='');
  syncTiersList();renderTiers();sauvegarderAuto();
}
function syncTiersList(){
  var dl=nb('tiers-list');dl.innerHTML='';
  TIERS.forEach(t=>{var opt=document.createElement('option');opt.value=t.nom;dl.appendChild(opt);});
}
function renderTiers(){
  if(!TIERS.length){nb('tiers-body').innerHTML='<tr class="empty-row"><td colspan="7">Aucun tiers</td></tr>';return;}
  nb('tiers-body').innerHTML=TIERS.map((t,i)=>{
    // Calcul solde dû
    var solde=EC.filter(e=>e.cli===t.nom&&e.stat==='attente'&&!e.isTVA&&!e.isAvance).reduce((a,e)=>a+e.ttc,0);
    var tb=t.type==='client'?'<span class="badge bg-green">Client</span>':t.type==='fournisseur'?'<span class="badge bg-amber">Fourn.</span>':'<span class="badge bg-blue">Les deux</span>';
    var soldeCl=solde>0?`<span style="color:var(--amber);font-weight:600;font-family:'Archivo',sans-serif">${fmt(solde)} FCFA</span>`:'<span style="color:var(--text-faint)">—</span>';
    return`<tr><td><strong>${t.nom}</strong></td><td>${tb}</td><td>${t.tel||'—'}</td><td>${t.email||'—'}</td><td>${t.adresse||'—'}</td><td>${soldeCl}</td><td><button onclick="supprimerTiers(${i})" style="font-size:10px;padding:2px 7px;border-radius:var(--radius);cursor:pointer;border:2px solid var(--red-border);background:var(--red-light);color:var(--red)">✕</button></td></tr>`;
  }).join('');
}
function supprimerTiers(i){if(confirm('Supprimer ce tiers ?')){TIERS.splice(i,1);syncTiersList();renderTiers();sauvegarderAuto();}}

// ═══ JOURNAL ═══
function clearFilters(){['j-search','j-filter-from','j-filter-to'].forEach(id=>nb(id).value='');nb('j-filter-type').value='';nb('j-filter-stat').value='';renderJournal();}
function renderJournal(){
  var search=(nb('j-search').value||'').toLowerCase();
  var ftype=nb('j-filter-type').value;
  var ffrom=nb('j-filter-from').value;
  var fto=nb('j-filter-to').value;
  var fstat=nb('j-filter-stat').value;

  var all=EC.concat(REGL);
  var filtered=all.filter(e=>{
    if(search&&!(e.desc+e.num+e.cli+'').toLowerCase().includes(search))return false;
    var eType=e.avoir?'avoir':e.type;
    if(ftype&&eType!==ftype)return false;
    if(ffrom&&e.date<ffrom)return false;
    if(fto&&e.date>fto)return false;
    if(fstat&&e.stat!==fstat)return false;
    return true;
  });

  nb('j-count').textContent='('+filtered.length+'/'+all.length+')';
  if(!filtered.length){nb('j-body').innerHTML='<tr class="empty-row"><td colspan="11">Aucune écriture correspondant aux filtres</td></tr>';nb('j-tfoot').style.display='none';nb('j-equilibre').textContent='—';return;}

  var h='',tD=0,tC=0,attente=filtered.filter(e=>e.stat==='attente'&&!REGL.includes(e)).length;
  filtered.forEach((e,i)=>{
    var origIdx=EC.indexOf(e);
    tD+=e.debit;tC+=e.credit;
    var pm=e.pay==='espece'?'Espèce':e.pay==='banque'?'Banque':'À crédit';
    var isAtt=e.stat==='attente'&&!REGL.includes(e);
    var sb=isAtt?`<span class="badge bg-amber" style="cursor:pointer" onclick="ouvrirRegl(${origIdx})">⏳</span>`:'<span class="badge bg-green">✓</span>';
    var btnR=isAtt?`<button onclick="ouvrirRegl(${origIdx})" style="font-size:10px;padding:2px 8px;border-radius:var(--radius);cursor:pointer;border:1px solid var(--green);background:var(--green-light);color:var(--green-dark);font-weight:600">Régler</button>`:'';
    var bg=isAtt?'background:#f5efe2;':e.avoir?'background:#FAF5FF;':e.isTVA?'background:#E0F7FA08;':'';
    var bl=isAtt?'border-left:3px solid var(--amber);':e.avoir?'border-left:3px solid var(--purple);':e.isTVA?'border-left:3px solid var(--teal);':'border-left:3px solid transparent;';
    var tags='';
    if(e._modifie)tags+=' <span style="font-size:9px;padding:1px 4px;background:var(--amber-light);color:var(--amber);border-radius:var(--radius)">modifié</span>';
    if(e.avoir)tags+=' <span style="font-size:9px;padding:1px 4px;background:var(--purple-light);color:var(--purple);border-radius:var(--radius)">AVOIR</span>';
    if(e.isTVA)tags+=' <span style="font-size:9px;padding:1px 4px;background:var(--teal-light);color:var(--teal);border-radius:var(--radius)">TVA</span>';
    var tvaBadge=e.tvaTaux>0?`<span class="badge bg-teal">${e.tvaTaux}%</span>`:'—';
    var echTag=e.echeance?`<span style="font-size:10px;color:${new Date(e.echeance)<new Date()&&e.stat==='attente'?'var(--red)':'var(--text-muted)'}">${fmtD(e.echeance)}</span>`:'—';
    var isRegl=REGL.includes(e);
    var btnEdit=origIdx>=0?`<button onclick="ouvrirEdit(${origIdx},'EC')" style="font-size:10px;padding:2px 6px;border-radius:var(--radius);cursor:pointer;border:2px solid var(--border-strong);background:transparent;color:var(--text-muted)">✏️</button>`:'';
    h+=`<tr style="${bg}${bl}">
      <td style="white-space:nowrap">${e.dateF||e.date||''}</td>
      <td><strong>${e.num}</strong>${tags}</td>
      <td style="max-width:160px;white-space:normal;font-size:10.5px">${e.desc}</td>
      <td><span class="acc">${e.cptD}</span></td>
      <td><span class="acc">${e.cptC}</span></td>
      <td style="font-family:'Archivo',sans-serif;text-align:right">${fmt(e.debit)}</td>
      <td style="font-family:'Archivo',sans-serif;text-align:right">${fmt(e.credit)}</td>
      <td>${tvaBadge}</td>
      <td>${echTag}</td>
      <td>${sb}</td>
      <td style="display:flex;gap:3px;white-space:nowrap">${btnR}${btnEdit}</td>
    </tr>`;
  });

  nb('j-body').innerHTML=h;
  nb('j-tfoot').style.display='';
  nb('j-totd').textContent=fmt(tD)+' FCFA';nb('j-totc').textContent=fmt(tC)+' FCFA';
  var eq=nb('j-equilibre');
  if(attente>0){eq.innerHTML=`<span style="color:var(--amber)">⏳ ${attente} en attente</span>`;}
  else if(Math.abs(tD-tC)<1){eq.textContent='✓ Équilibré';eq.style.color='var(--green)';}
  else{eq.textContent='⚠ Déséquilibré';eq.style.color='var(--red)';}
}

// ═══ GRAND LIVRE ═══
function setGLMode(mode){
  GL_MODE=mode;
  var btnT=nb('gl-btn-t'),btnTa=nb('gl-btn-tab');
  if(mode==='t'){btnT.style.cssText='padding:5px 14px;font-size:11.5px;font-weight:600;border:none;cursor:pointer;background:var(--green);color:#fff;font-family:\'Archivo\',sans-serif';btnTa.style.cssText='padding:5px 14px;font-size:11.5px;font-weight:500;border:none;cursor:pointer;background:var(--surface);color:var(--text-muted);font-family:\'Archivo\',sans-serif';}
  else{btnTa.style.cssText='padding:5px 14px;font-size:11.5px;font-weight:600;border:none;cursor:pointer;background:var(--green);color:#fff;font-family:\'Archivo\',sans-serif';btnT.style.cssText='padding:5px 14px;font-size:11.5px;font-weight:500;border:none;cursor:pointer;background:var(--surface);color:var(--text-muted);font-family:\'Archivo\',sans-serif';}
  renderGL();
}

function buildComptes(){
  var c={};
  Object.keys(GL_EXTRA).forEach(cpt=>{
    var ex=GL_EXTRA[cpt];
    c[cpt]={deb:[],cred:[]};
    if(!NOMS[cpt])NOMS[cpt]=ex.nom;
    if(ex.debit>0)c[cpt].deb.push({date:'Ouverture',lib:'Solde initial',mt:ex.debit});
    if(ex.credit>0)c[cpt].cred.push({date:'Ouverture',lib:'Solde initial',mt:ex.credit});
  });
  EC.concat(REGL).forEach(e=>{
    if(!c[e.cptD])c[e.cptD]={deb:[],cred:[]};
    if(!c[e.cptC])c[e.cptC]={deb:[],cred:[]};
    c[e.cptD].deb.push({date:e.dateF||e.date,lib:e.desc,mt:e.debit});
    c[e.cptC].cred.push({date:e.dateF||e.date,lib:e.desc,mt:e.credit});
  });
  return c;
}

function renderGL(){
  var c=buildComptes();
  if(GL_MODE==='t')renderGL_T(c);else renderGL_Tab(c);
}

function renderGL_Tab(c){
  if(!Object.keys(c).length){nb('gl-body').innerHTML='<div style="text-align:center;color:var(--text-faint);padding:32px;font-style:italic">Aucune donnée</div>';return;}
  var h='';
  Object.keys(c).sort().forEach(cpt=>{
    var d=c[cpt];
    var tD=d.deb.reduce((a,r)=>a+r.mt,0),tC=d.cred.reduce((a,r)=>a+r.mt,0);
    var solde=tD-tC;
    h+=`<div class="card" style="margin-bottom:10px">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:8px"><span class="acc" style="font-size:12px;padding:2px 8px">${cpt}</span><span class="card-title">${NOMS[cpt]||'Compte '+cpt}</span></div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11.5px;font-weight:600;color:${solde>=0?'var(--green)':'var(--red)'}">Solde : ${fmt(Math.abs(solde))} FCFA ${solde>=0?'D':'C'}</span>
          <button onclick="renommerCpt('${cpt}')" style="font-size:10px;padding:2px 7px;border-radius:var(--radius);cursor:pointer;border:2px solid var(--border-strong);background:transparent;color:var(--text-muted)">✏️</button>
        </div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Libellé</th><th style="text-align:right">Débit</th><th style="text-align:right">Crédit</th><th style="text-align:right">Solde cumulé</th></tr></thead><tbody>`;
    var cum=0,mx=Math.max(d.deb.length,d.cred.length);
    for(var i=0;i<mx;i++){
      var dd=d.deb[i]||{},cc=d.cred[i]||{};
      cum+=(dd.mt||0)-(cc.mt||0);
      h+=`<tr><td>${dd.date||cc.date||''}</td><td style="font-size:10.5px;white-space:normal">${dd.lib||cc.lib||''}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${dd.mt?fmt(dd.mt):''}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${cc.mt?fmt(cc.mt):''}</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:${cum>=0?'var(--green)':'var(--red)'}">${fmt(cum)}</td></tr>`;
    }
    h+=`</tbody><tfoot><tr class="tot-row"><td colspan="2">Total</td><td style="text-align:right">${fmt(tD)}</td><td style="text-align:right">${fmt(tC)}</td><td style="text-align:right">${fmt(Math.abs(solde))} ${solde>=0?'D':'C'}</td></tr></tfoot></table></div></div>`;
  });
  nb('gl-body').innerHTML=h;
}

function renderGL_T(c){
  if(!Object.keys(c).length){nb('gl-body').innerHTML='<div style="text-align:center;color:var(--text-faint);padding:32px;font-style:italic">Aucune donnée</div>';return;}
  var h='<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px">';
  Object.keys(c).sort().forEach(cpt=>{
    var d=c[cpt];
    var tD=d.deb.reduce((a,r)=>a+r.mt,0),tC=d.cred.reduce((a,r)=>a+r.mt,0);
    var s=tD-tC,sc=s>=0?'var(--accent)':'#E24B4A',sd=s>=0?'Débiteur':'Créditeur';
    var dl=d.deb.map(r=>`<div class="t-line"><span class="t-lib" title="${r.lib}">${r.date} — ${r.lib}</span><span class="t-mt">${fmt(r.mt)}</span></div>`).join('');
    var cl=d.cred.map(r=>`<div class="t-line"><span class="t-lib" title="${r.lib}">${r.date} — ${r.lib}</span><span class="t-mt">${fmt(r.mt)}</span></div>`).join('');
    var mx=Math.max(d.deb.length,d.cred.length);
    for(var i=d.deb.length;i<mx;i++)dl+='<div class="t-line" style="opacity:0">—</div>';
    for(var i=d.cred.length;i<mx;i++)cl+='<div class="t-line" style="opacity:0">—</div>';
    var sL=`<div class="t-line" style="background:var(--bg);font-weight:700"><span class="t-lib" style="font-weight:700">Solde</span><span class="t-mt" style="color:${sc}">${fmt(Math.abs(s))}</span></div>`;
    if(s>0)cl+=sL;else if(s<0)dl+=sL;
    h+=`<div class="t-compte">
      <div class="t-header">
        <span style="background:rgba(255,255,255,.2);padding:1px 7px;border-radius:var(--radius);font-family:'Archivo',sans-serif;font-size:11px">${cpt}</span>
        <span class="t-nom">${NOMS[cpt]||'Compte '+cpt}</span>
        <span style="font-size:11px;font-weight:600;color:${sc}">${fmt(Math.abs(s))} ${sd}</span>
      </div>
      <div class="t-body">
        <div class="t-side t-side-d"><div class="t-side-label">Débit</div>${dl}<div class="t-tot"><span>Total D</span><span>${fmt(tD)}</span></div></div>
        <div class="t-side t-side-c"><div class="t-side-label">Crédit</div>${cl}<div class="t-tot"><span>Total C</span><span>${fmt(tC)}</span></div></div>
      </div>
    </div>`;
  });
  h+='</div>';nb('gl-body').innerHTML=h;
}

function renommerCpt(cpt){var n=prompt('Renommer le compte '+cpt+' :',NOMS[cpt]||'Compte '+cpt);if(n&&n.trim()){NOMS[cpt]=n.trim();ajouterNotif('modif','Compte '+cpt+' renommé','→ "'+n.trim()+'"');renderGL();sauvegarderAuto();}}
function ouvrirAjoutGL(){nb('gl-num').value='';nb('gl-nom').value='';nb('gl-deb').value='';nb('gl-cred').value='';nb('gl-note').value='';nb('modal-gl').style.display='flex';}
function fermerGL(){nb('modal-gl').style.display='none';}
function confirmerGL(){
  var num=nb('gl-num').value.trim(),nom=nb('gl-nom').value.trim();
  if(!num||!nom){alert('Numéro et intitulé requis.');return;}
  GL_EXTRA[num]={nom,debit:parseFloat(nb('gl-deb').value)||0,credit:parseFloat(nb('gl-cred').value)||0,note:nb('gl-note').value.trim()};
  NOMS[num]=nom;
  ajouterNotif('modif','Compte '+num+' ajouté au GL',nom);
  fermerGL();renderGL();sauvegarderAuto();
}

// ═══ LETTRAGE ═══
var LETTRES='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var lettreCursor=0;

function prochainLettre(){return LETTRES[lettreCursor%26]+(lettreCursor>=26?Math.floor(lettreCursor/26):'');}

function renderLettrage(){
  var entries=EC.filter(e=>!e.isTVA&&!e.isAvance);
  if(!entries.length){nb('lettrage-body').innerHTML='<tr class="empty-row"><td colspan="8">Aucune écriture</td></tr>';return;}
  var h='';
  entries.forEach((e,i)=>{
    var origIdx=EC.indexOf(e);
    var lBadge=e.lettre?`<span class="lettre-badge lettre-ok">${e.lettre}</span>`:`<span class="lettre-badge lettre-non">—</span>`;
    var tb=e.avoir?'<span class="badge bg-purple">AVOIR</span>':e.type==='vente'?'<span class="badge bg-green">Vente</span>':e.type==='service'?'<span class="badge bg-blue">Service</span>':'<span class="badge bg-red">Achat</span>';
    var btnL=e.lettre?`<button onclick="delettrer(${origIdx})" style="font-size:10px;padding:2px 7px;border-radius:var(--radius);cursor:pointer;border:2px solid var(--amber-border);background:var(--amber-light);color:var(--amber)">Délettrer</button>`:`<button onclick="lettrer(${origIdx})" style="font-size:10px;padding:2px 7px;border-radius:var(--radius);cursor:pointer;border:2px solid var(--green-border);background:var(--green-light);color:var(--green-dark)">Lettrer</button>`;
    h+=`<tr><td>${lBadge}</td><td>${e.dateF||e.date}</td><td><strong>${e.num}</strong></td><td>${e.cli}</td><td><span class="acc">${e.cptD}</span>/<span class="acc">${e.cptC}</span></td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:600">${fmt(e.ttc)}</td><td>${tb}</td><td>${btnL}</td></tr>`;
  });
  nb('lettrage-body').innerHTML=h;
}

function lettrer(idx){
  var e=EC[idx];if(!e)return;
  // Trouver une contrepartie non lettrée
  var cli=e.cli,montant=e.ttc;
  var contrepartie=EC.find((c,i)=>i!==idx&&c.cli===cli&&!c.lettre&&!c.isTVA&&!c.isAvance&&Math.abs(c.ttc-montant)<1);
  var lettre=prochainLettre();
  lettreCursor++;
  e.lettre=lettre;
  if(contrepartie)contrepartie.lettre=lettre;
  ajouterNotif('modif','Lettrage '+lettre+' — '+e.cli,e.num+(contrepartie?' / '+contrepartie.num:''));
  renderLettrage();sauvegarderAuto();
}

function delettrer(idx){
  var e=EC[idx];if(!e||!e.lettre)return;
  var l=e.lettre;
  EC.forEach(ec=>{if(ec.lettre===l)ec.lettre='';});
  ajouterNotif('modif','Délettrage '+l,'Toutes les écritures lettrées '+l+' ont été délettrées.');
  renderLettrage();sauvegarderAuto();
}

// ═══ BILAN ═══
function renderBilan(){
  var actif={},passif={};
  var aList=['571','521','4111','4452','4453','4454','4455','3111','6011'];
  var pList=['7011','7061','401','4431','110','119','1301','1302','12'];
  EC.concat(REGL).forEach(e=>{
    if(aList.includes(e.cptD))actif[e.cptD]=(actif[e.cptD]||0)+e.debit;
    if(aList.includes(e.cptC))actif[e.cptC]=(actif[e.cptC]||0)-e.credit;
    if(pList.includes(e.cptC))passif[e.cptC]=(passif[e.cptC]||0)+e.credit;
    if(pList.includes(e.cptD))passif[e.cptD]=(passif[e.cptD]||0)-e.debit;
  });
  // Ajouter soldes définis manuellement
  if(SOLDES.caisseDefini){actif['571']=(actif['571']||0);}
  if(SOLDES.banqueDefini){actif['521']=(actif['521']||0);}

  function buildRows(obj,id){var r='',t=0;Object.keys(obj).forEach(k=>{var v=Math.abs(obj[k]);if(v<1)return;t+=v;r+=`<tr><td><span class="acc">${k}</span></td><td>${NOMS[k]||k}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(v)}</td></tr>`;});nb(id).innerHTML=r||'<tr class="empty-row"><td colspan="3">—</td></tr>';return t;}
  var tA=buildRows(actif,'b-actif'),tP=buildRows(passif,'b-passif');
  nb('b-ta').textContent=fmt(tA)+' FCFA';nb('b-tp').textContent=fmt(tP)+' FCFA';
  var eq=nb('b-eq');eq.style.display='block';
  if(Math.abs(tA-tP)<1){eq.style.cssText='display:block;margin-top:10px;padding:9px 14px;border-radius:var(--radius);font-size:12px;font-weight:600;text-align:center;background:var(--green-light);color:var(--green-dark);border:2px solid var(--green-border)';eq.textContent='✓ Bilan équilibré — '+fmt(tA)+' FCFA';}
  else{eq.style.cssText='display:block;margin-top:10px;padding:9px 14px;border-radius:var(--radius);font-size:12px;font-weight:600;text-align:center;background:var(--amber-light);color:var(--amber);border:2px solid var(--amber-border)';eq.textContent='⚠ Écart — Actif : '+fmt(tA)+' / Passif : '+fmt(tP)+' FCFA';}
}

// ═══ COMPTE DE RÉSULTATS ═══
function renderResultats(){
  var rub={ch60:[],ch61:[],ch63:[],ch66:[],pr70:[],pr71:[],pr74:[],pr76:[]};
  EC.concat(REGL).forEach(e=>{
    function addC(cpt,mt,lib,date){if(!mt||mt<0)return;var n=parseInt(cpt);if(n>=6000&&n<=6099)rub.ch60.push({cpt,lib,date,mt});else if(n>=6100&&n<=6299)rub.ch61.push({cpt,lib,date,mt});else if(n>=6300&&n<=6599)rub.ch63.push({cpt,lib,date,mt});else if(n>=6600&&n<=6999)rub.ch66.push({cpt,lib,date,mt});}
    function addP(cpt,mt,lib,date){if(!mt||mt<0)return;var n=parseInt(cpt);if(n>=7000&&n<=7099)rub.pr70.push({cpt,lib,date,mt});else if(n>=7100&&n<=7399)rub.pr71.push({cpt,lib,date,mt});else if(n>=7400&&n<=7599)rub.pr74.push({cpt,lib,date,mt});else if(n>=7600&&n<=7999)rub.pr76.push({cpt,lib,date,mt});}
    if(e.cptD&&e.cptD.startsWith('6'))addC(e.cptD,e.debit,e.desc,e.date);
    if(e.cptC&&e.cptC.startsWith('6'))addC(e.cptC,-e.credit,e.desc,e.date);
    if(e.cptC&&e.cptC.startsWith('7'))addP(e.cptC,e.credit,e.desc,e.date);
    if(e.cptD&&e.cptD.startsWith('7'))addP(e.cptD,-e.debit,e.desc,e.date);
  });
  function sumR(arr){return arr.reduce((a,r)=>a+r.mt,0);}
  function buildR(arr,bodyId,sumId){
    var t=sumR(arr);
    var by={};arr.forEach(r=>{if(!by[r.cpt])by[r.cpt]={lib:r.lib,mt:0};by[r.cpt].mt+=r.mt;});
    nb(bodyId).innerHTML=Object.keys(by).map(cpt=>`<tr><td style="padding:4px 10px"><span class="acc">${cpt}</span></td><td style="padding:4px 10px;font-size:10.5px">${NOMS[cpt]||by[cpt].lib}</td><td style="padding:4px 10px;text-align:right;font-family:'Archivo',sans-serif">${fmt(by[cpt].mt)}</td></tr>`).join('')||'<tr><td colspan="3" style="padding:6px 10px;font-size:10px;color:var(--text-faint)">—</td></tr>';
    nb(sumId).textContent=fmt(t)+' FCFA';return t;
  }
  var ch60=buildR(rub.ch60,'cr-60-body','cr-60'),ch61=buildR(rub.ch61,'cr-61-body','cr-61');
  var ch63=buildR(rub.ch63,'cr-63-body','cr-63'),ch66=buildR(rub.ch66,'cr-66-body','cr-66');
  var pr70=buildR(rub.pr70,'cr-70-body','cr-70'),pr71=buildR(rub.pr71,'cr-71-body','cr-71');
  var pr74=buildR(rub.pr74,'cr-74-body','cr-74'),pr76=buildR(rub.pr76,'cr-76-body','cr-76');
  var tCh=ch60+ch61+ch63+ch66,tPr=pr70+pr71+pr74+pr76,res=tPr-tCh;
  nb('cr-charges').textContent=fmt(tCh);nb('cr-produits').textContent=fmt(tPr);
  nb('cr-tot-ch').textContent=fmt(tCh)+' FCFA';nb('cr-tot-pr').textContent=fmt(tPr)+' FCFA';
  var m=nb('cr-marge');m.textContent=fmt(pr70-ch60)+' FCFA';m.style.color=(pr70-ch60)>=0?'var(--green)':'var(--red)';
  var rx=nb('cr-rex');var rex=(pr70+pr71+pr74)-(ch60+ch61+ch63);rx.textContent=fmt(rex)+' FCFA';rx.style.color=rex>=0?'var(--green)':'var(--red)';
  var bn=nb('cr-banner');
  if(tCh===0&&tPr===0){bn.style.display='none';}
  else if(res>=0){bn.style.cssText='display:block;margin-bottom:12px;padding:11px 16px;border-radius:var(--radius);font-size:13.5px;font-weight:700;text-align:center;background:var(--green-light);color:var(--green-dark);border:2px solid var(--green-border)';bn.innerHTML=`BÉNÉFICE NET : ${fmt(res)} FCFA &nbsp;|&nbsp; Produits ${fmt(tPr)} − Charges ${fmt(tCh)}`;}
  else{bn.style.cssText='display:block;margin-bottom:12px;padding:11px 16px;border-radius:var(--radius);font-size:13.5px;font-weight:700;text-align:center;background:var(--red-light);color:var(--red);border:2px solid var(--red-border)';bn.innerHTML=`PERTE NETTE : ${fmt(Math.abs(res))} FCFA &nbsp;|&nbsp; Produits ${fmt(tPr)} − Charges ${fmt(tCh)}`;}
}

// ═══ BALANCE ═══
function renderBalance(){
  var c={};
  EC.concat(REGL).forEach(e=>{
    if(!c[e.cptD])c[e.cptD]={d:0,cr:0};if(!c[e.cptC])c[e.cptC]={d:0,cr:0};
    c[e.cptD].d+=e.debit;c[e.cptC].cr+=e.credit;
  });
  var h='',tD=0,tC=0,tSD=0,tSC=0;
  Object.keys(c).sort().forEach(cpt=>{
    var v=c[cpt],sd=Math.max(0,v.d-v.cr),sc=Math.max(0,v.cr-v.d);
    tD+=v.d;tC+=v.cr;tSD+=sd;tSC+=sc;
    var nat=cpt.startsWith('1')||cpt.startsWith('4')?'Bilan':cpt.startsWith('6')||cpt.startsWith('7')?'Gestion':'Divers';
    var nb2=nat==='Bilan'?'bg-blue':nat==='Gestion'?'bg-green':'bg-amber';
    h+=`<tr><td><span class="acc">${cpt}</span></td><td>${NOMS[cpt]||'Cpt '+cpt}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(v.d)}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(v.cr)}</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--blue)">${sd?fmt(sd):''}</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--green)">${sc?fmt(sc):''}</td><td><span class="badge ${nb2}">${nat}</span></td></tr>`;
  });
  nb('bal-body').innerHTML=h||'<tr class="empty-row"><td colspan="7">—</td></tr>';
  nb('bal-tfoot').style.display='';
  nb('bal-td').textContent=fmt(tD)+' FCFA';nb('bal-tc').textContent=fmt(tC)+' FCFA';nb('bal-tsd').textContent=fmt(tSD)+' FCFA';nb('bal-tsc').textContent=fmt(tSC)+' FCFA';
  var eq=nb('bal-eq');
  if(Math.abs(tSD-tSC)<1){eq.textContent='✓ Balance équilibrée';eq.style.color='var(--green)';}
  else{eq.textContent='⚠ Déséquilibre : '+fmt(Math.abs(tSD-tSC))+' FCFA';eq.style.color='var(--amber)';}
}

// ═══ SOLDE ═══
// CORRECTION DÉFAUT 2 : recalcul automatique depuis les écritures
function getSoldeCalcule(){
  var c=0,b=0;
  EC.concat(REGL).forEach(e=>{
    if(e.cptD==='571')c+=e.debit;if(e.cptC==='571')c-=e.credit;
    if(e.cptD==='521')b+=e.debit;if(e.cptC==='521')b-=e.credit;
  });
  VIREMENTS.forEach(v=>{
    if(v.compte==='caisse'){if(v.sens==='in')c+=v.montant;else if(v.sens==='out')c-=v.montant;}
    if(v.compte==='banque'){if(v.sens==='in')b+=v.montant;else if(v.sens==='out')b-=v.montant;}
  });
  return{caisse:SOLDES.caisse+c,banque:SOLDES.banque+b};
}
function setSolde(compte){
  var val=parseFloat(nb('solde-'+compte+'-input').value)||0;
  SOLDES[compte]=val;SOLDES[compte+'Defini']=true;
  ajouterNotif('virement','Solde '+compte+' défini à '+fmt(val)+' FCFA','Solde initial saisi manuellement');
  renderSolde();sauvegarderAuto();
}
function renderSolde(){
  var s=getSoldeCalcule();
  var enc=0,dec=0;
  EC.forEach(e=>{if(e.stat==='payee'&&!e.isAvance&&!e.isTVA){if((e.type==='vente'||e.type==='service')&&!e.avoir)enc+=e.ttc;if(e.type==='achat'&&!e.avoir)dec+=e.ttc;}});
  nb('solde-caisse-mt').textContent=fmt(s.caisse)+' FCFA';
  nb('solde-banque-mt').textContent=fmt(s.banque)+' FCFA';
  nb('solde-total').textContent=fmt(s.caisse+s.banque)+' FCFA';
  nb('solde-caisse-sub').textContent=SOLDES.caisseDefini?'Base : '+fmt(SOLDES.caisse)+' FCFA + mouvements':'Base non définie — cliquez Définir';
  nb('solde-banque-sub').textContent=SOLDES.banqueDefini?'Base : '+fmt(SOLDES.banque)+' FCFA + mouvements':'Base non définie';
  nb('enc-auto').textContent=fmt(enc)+' FCFA';nb('dec-auto').textContent=fmt(dec)+' FCFA';
  // Mouvements
  var mvts=[];
  EC.filter(e=>e.stat==='payee'&&!e.isTVA&&!e.isAvance&&(e.pay==='espece'||e.pay==='banque')).forEach(e=>{
    var enc=(e.type==='vente'||e.type==='service')&&!e.avoir;
    mvts.push({date:e.dateF||e.date,desc:e.desc,ref:e.num,compte:e.pay==='espece'?'caisse':'banque',sens:enc?'in':'out',montant:e.ttc,type:e.modeLabel});
  });
  REGL.forEach(r=>mvts.push({date:r.date,desc:r.desc,ref:r.num,compte:r.pay==='banque'?'banque':'caisse',sens:'in',montant:r.debit,type:'Règlement'}));
  VIREMENTS.forEach(v=>mvts.push(v));
  mvts.sort((a,b)=>a.date>b.date?-1:1);
  nb('nb-mvt').textContent=mvts.length+' mouvement(s)';
  if(!mvts.length){nb('mvt-list').innerHTML='<div style="text-align:center;color:var(--text-faint);padding:22px;font-style:italic">Aucun mouvement</div>';return;}
  nb('mvt-list').innerHTML=mvts.map(v=>{
    var isIn=v.sens==='in';var isInit=v.sens==='init';
    var icon=isInit?'🔧':isIn?'📥':'📤';
    var col=isInit?'var(--text-muted)':isIn?'var(--green)':'var(--red)';
    var cb=v.compte==='caisse'?'<span class="badge bg-amber">Caisse</span>':'<span class="badge bg-blue">Banque</span>';
    var bl=isIn?'border-left:3px solid var(--green);':isInit?'border-left:3px solid var(--border);':'border-left:3px solid var(--red);';
    return`<div style="${bl}display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:2px solid var(--border)">
      <span style="font-size:16px">${icon}</span>
      <div style="flex:1"><div style="font-size:11.5px;font-weight:600">${v.desc}</div><div style="font-size:10px;color:var(--text-muted);margin-top:1px">${v.date} | ${v.ref} | ${v.type||''}</div></div>
      ${cb}
      <div style="font-size:13px;font-weight:700;font-family:'Archivo',sans-serif;color:${col}">${isIn?'+':isInit?'':'−'}${fmt(v.montant)} FCFA</div>
    </div>`;
  }).join('');
}

function ouvrirVirement(){nb('vir-date').value=new Date().toISOString().split('T')[0];nb('vir-mt').value='';nb('modal-vir').style.display='flex';}
function fermerVir(){nb('modal-vir').style.display='none';}
function confirmerVir(){
  var de=nb('vir-de').value,vers=nb('vir-vers').value;
  var mt=parseFloat(nb('vir-mt').value)||0,date=nb('vir-date').value;
  var motif=nb('vir-motif').value.trim()||'Virement interne';
  if(!mt){alert('Montant requis.');return;}
  if(de===vers){alert('Source et destination identiques.');return;}
  var dateF=fmtD(date);
  SOLDES[de]-=mt;SOLDES[vers]+=mt;
  VIREMENTS.push({date:dateF,desc:motif+' ('+de+'→'+vers+')',ref:'VIR-'+dateF,compte:de,sens:'out',montant:mt,type:'Virement'});
  VIREMENTS.push({date:dateF,desc:motif+' ('+de+'→'+vers+')',ref:'VIR-'+dateF,compte:vers,sens:'in',montant:mt,type:'Virement'});
  var cDe=de==='caisse'?'571':'521',cVers=vers==='caisse'?'571':'521';
  REGL.push({date:dateF,dateRaw:date,num:'VIR-'+dateF,desc:motif,cptD:cVers,cptC:cDe,debit:mt,credit:mt,pay:de,stat:'payee',tvaTaux:0,tvaCpt:''});
  ajouterNotif('virement','Virement '+fmt(mt)+' FCFA — '+de+' → '+vers,motif+' | '+dateF);
  fermerVir();renderSolde();renderJournal();renderGL();sauvegarderAuto();
}

// ═══ ANALYSE COMPTABLE ═══
function updateAnMoisFilter(){
  var sel=nb('an-filter-mois');var current=sel.value;
  var mois=new Set();
  EC.concat(REGL).forEach(e=>{if(e.date)mois.add(e.date.substring(0,7));});
  sel.innerHTML='<option value="">Tous les mois</option>';
  Array.from(mois).sort().forEach(m=>{
    var opt=document.createElement('option');opt.value=m;
    var parts=m.split('-');opt.textContent=parts[1]+'/'+parts[0];
    sel.appendChild(opt);
  });
  if(current)sel.value=current;
}
function clearAnalyseFilters(){nb('an-filter-mois').value='';nb('an-filter-type').value='';renderAnalyse();}
function renderAnalyse(){
  updateAnMoisFilter();
  var fmois=nb('an-filter-mois').value;
  var ftype=nb('an-filter-type').value;
  var all=EC.concat(REGL).filter(e=>{
    if(fmois&&!(e.date||'').startsWith(fmois))return false;
    var t=e.avoir?'avoir':e.type;
    if(ftype&&t!==ftype)return false;
    return true;
  });
  if(!all.length){
    nb('an-body').innerHTML='<tr class="empty-row"><td colspan="10">Aucune activité</td></tr>';
    nb('an-tfoot').style.display='none';
    nb('an-synth').innerHTML='<tr class="empty-row"><td colspan="6">—</td></tr>';
    nb('an-prod').textContent='0';nb('an-chg').textContent='0';nb('an-res').textContent='0';nb('an-nb').textContent='0';
    return;
  }
  var h='',tD=0,tC=0,ref=1;
  all.forEach(e=>{
    tD+=e.debit;tC+=e.credit;
    var tl=e.avoir?'<span class="badge bg-purple">AVOIR</span>':e.isTVA?'<span class="badge bg-teal">TVA</span>':e.type==='vente'?'<span class="badge bg-green">Vente</span>':e.type==='service'?'<span class="badge bg-blue">Service</span>':e.isAvance?'<span class="badge bg-amber">Avance</span>':'<span class="badge bg-red">Achat</span>';
    h+=`<tr>
      <td style="font-family:'Archivo',sans-serif;font-weight:600;color:var(--text-faint)">${String(ref++).padStart(4,'0')}</td>
      <td style="white-space:nowrap">${e.dateF||e.date||''}</td>
      <td><strong>${e.num||'—'}</strong></td>
      <td style="font-size:10.5px;max-width:160px;white-space:normal">${e.desc||''}</td>
      <td>${tl}</td>
      <td><span class="acc">${e.cptD||'—'}</span></td>
      <td><span class="acc">${e.cptC||'—'}</span></td>
      <td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--blue)">${fmt(e.debit)}</td>
      <td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--green)">${fmt(e.credit)}</td>
      <td style="text-align:right;font-size:10px;color:var(--text-muted)">${e.tvaTaux>0?e.tvaTaux+'%':'—'}</td>
    </tr>`;
  });
  nb('an-body').innerHTML=h;nb('an-tfoot').style.display='';
  nb('an-td').textContent=fmt(tD)+' FCFA';nb('an-tc').textContent=fmt(tC)+' FCFA';
  // Synthèse
  var cs={};all.forEach(e=>{if(!cs[e.cptD])cs[e.cptD]={d:0,c:0};if(!cs[e.cptC])cs[e.cptC]={d:0,c:0};cs[e.cptD].d+=e.debit;cs[e.cptC].c+=e.credit;});
  var hs='',totP=0,totC=0;
  Object.keys(cs).sort().forEach(cpt=>{
    var v=cs[cpt],s=v.d-v.c;
    var nat=cpt.startsWith('7')?'Produit':cpt.startsWith('6')?'Charge':cpt.startsWith('5')?'Trésorerie':cpt.startsWith('4')?'Tiers':'Autre';
    var nc=nat==='Produit'?'bg-green':nat==='Charge'?'bg-red':nat==='Trésorerie'?'bg-amber':'bg-blue';
    if(nat==='Produit')totP+=v.c;if(nat==='Charge')totC+=v.d;
    hs+=`<tr><td><span class="acc">${cpt}</span></td><td>${NOMS[cpt]||'Cpt '+cpt}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(v.d)}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(v.c)}</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:600;color:${s>=0?'var(--blue)':'var(--green)'}">${fmt(Math.abs(s))} ${s>=0?'D':'C'}</td><td><span class="badge ${nc}">${nat}</span></td></tr>`;
  });
  nb('an-synth').innerHTML=hs||'<tr class="empty-row"><td colspan="6">—</td></tr>';
  var res=totP-totC;
  nb('an-prod').textContent=fmt(totP);nb('an-chg').textContent=fmt(totC);
  var rEl=nb('an-res');rEl.textContent=fmt(Math.abs(res));rEl.className='kpi-value '+(res>=0?'kpi-pos':'kpi-neg');
  nb('an-nb').textContent=all.length;
}

// ═══ IMPÔT SUR LES SOCIÉTÉS — TOGO ═══
var SALAIRES = []; // [{poste, nb, mtMensuel, mtAnnuel}]
var DED_EXTRAS = []; // [{lib, mt}]
var BUDGETS = [];
var PREV_PLAN_DATA = null;
var prevBudgetChart = null;
var prevProjChart = null;
var ALERT_CONFIG = (function(){try{return JSON.parse(localStorage.getItem('comptaia_alerts')||'{"retard":30,"treso_min":500000,"ca_drop":20}');}catch(e){return {retard:30,treso_min:500000,ca_drop:20};}})();

function previewSalaire(){
  var nb_=parseInt(nb('sal-nb').value)||1;
  var mt=parseFloat(nb('sal-mt').value)||0;
  var ann=nb_*mt*12;
  // Show preview inline
}

function ajouterSalaire(){
  var poste=nb('sal-poste').value.trim()||'Employé(s)';
  var nbEmp=parseInt(nb('sal-nb').value)||1;
  var mtM=parseFloat(nb('sal-mt').value)||0;
  if(!mtM){alert('Veuillez saisir le salaire mensuel.');return;}
  SALAIRES.push({poste,nb:nbEmp,mtMensuel:mtM,mtAnnuel:nbEmp*mtM*12});
  nb('sal-poste').value='';nb('sal-nb').value='1';nb('sal-mt').value='';
  renderSalaires();calcImpot();sauvegarderAuto();
}

function supprimerSalaire(i){SALAIRES.splice(i,1);renderSalaires();calcImpot();sauvegarderAuto();}

function renderSalaires(){
  var total=SALAIRES.reduce((a,s)=>a+s.mtAnnuel,0);
  var h='';
  if(!SALAIRES.length){
    nb('salaires-liste').innerHTML='<div style="grid-column:span 3;text-align:center;color:var(--text-faint);font-style:italic;padding:8px 0;font-size:11px">Aucun salarié saisi</div>';
  } else {
    SALAIRES.forEach((s,i)=>{
      h+=`<div style="background:var(--purple-light);border:2px solid var(--purple-border);border-radius:var(--radius);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div>
          <div style="font-size:11.5px;font-weight:600;color:var(--purple)">${s.poste}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${s.nb} employé(s) × ${fmt(s.mtMensuel)} FCFA/mois × 12</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--purple)">${fmt(s.mtAnnuel)} FCFA/an</div>
          <button onclick="supprimerSalaire(${i})" style="font-size:10px;padding:1px 6px;border-radius:var(--radius);cursor:pointer;border:2px solid var(--purple-border);background:transparent;color:var(--purple);margin-top:3px">✕</button>
        </div>
      </div>`;
    });
    nb('salaires-liste').innerHTML=h;
  }
  nb('is-salaires-total').textContent=fmt(total)+' FCFA';
}

function ajouterDedExtra(){
  var lib=nb('ded-extra-lib').value.trim();
  var mt=parseFloat(nb('ded-extra-mt').value)||0;
  if(!lib||!mt){alert('Libellé et montant requis.');return;}
  DED_EXTRAS.push({lib,mt});
  nb('ded-extra-lib').value='';nb('ded-extra-mt').value='';
  renderDedExtras();calcImpot();sauvegarderAuto();
}
function supprimerDedExtra(i){DED_EXTRAS.splice(i,1);renderDedExtras();calcImpot();sauvegarderAuto();}
function renderDedExtras(){
  if(!DED_EXTRAS.length){nb('ded-extras-liste').innerHTML='';return;}
  nb('ded-extras-liste').innerHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">'+
    DED_EXTRAS.map((d,i)=>`<div style="background:var(--teal-light);border:1px solid #B2EBF2;border-radius:var(--radius);padding:8px 10px;display:flex;align-items:center;justify-content:space-between">
      <div><div style="font-size:11px;font-weight:600;color:var(--teal)">${d.lib}</div><div style="font-size:12px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--teal)">${fmt(d.mt)} FCFA</div></div>
      <button onclick="supprimerDedExtra(${i})" style="font-size:10px;padding:1px 6px;border-radius:var(--radius);cursor:pointer;border:1px solid #B2EBF2;background:transparent;color:var(--teal)">✕</button>
    </div>`).join('')+
  '</div>';
}

function calcImpot(){
  // 1. Extraire CA et charges depuis la comptabilité
  var ca=0, chCompta=0;
  EC.concat(REGL).forEach(e=>{
    if(!e.isTVA&&!e.isAvance&&!e.avoir){
      if(e.type==='vente'||e.type==='service') ca+=e.htNet||e.ht||0;
    }
    if(e.cptD&&e.cptD.startsWith('6')&&!e.isTVA) chCompta+=e.debit;
  });
  // Avoirs réduisent le CA
  EC.filter(e=>e.avoir).forEach(e=>{ca-=e.htNet||e.ht||0;});
  ca=Math.max(0,ca);

  nb('is-ca').textContent=fmt(ca);
  nb('is-ch').textContent=fmt(chCompta);
  var resBrut=ca-chCompta;
  var resEl=nb('is-res-brut');
  resEl.textContent=fmt(Math.abs(resBrut));
  resEl.className='kpi-value '+(resBrut>=0?'kpi-pos':'kpi-neg');

  // 2. Total salaires
  var totalSal=SALAIRES.reduce((a,s)=>a+s.mtAnnuel,0);

  // 3. Déductions supplémentaires
  var getV=id=>{return parseFloat(nb(id).value)||0;};
  var dedStandard=getV('ded-loyer')+getV('ded-assurance')+getV('ded-amort')+getV('ded-formation')+getV('ded-bancaire')+getV('ded-deplacement')+getV('ded-pub')+getV('ded-dons')+getV('ded-cotis');
  var dedExtras=DED_EXTRAS.reduce((a,d)=>a+d.mt,0);
  var totalDed=dedStandard+dedExtras;
  nb('is-ded-total').textContent=fmt(totalDed)+' FCFA';

  // 4. Calcul bénéfice imposable
  var benImposable=ca-chCompta-totalSal-totalDed;
  // Minimum fiscal : l'IS ne peut être inférieur à 0
  var benImposableNet=Math.max(0,benImposable);

  // 5. IS = 27% du bénéfice imposable net
  var tauxIS=0.27;
  var isTotal=Math.round(benImposableNet*tauxIS);

  // Acomptes : 3 versements de 33.33% chacun + solde
  var acompte=Math.round(isTotal/3);
  var solde=isTotal-acompte*3; // ajustement arrondi

  // Affichage
  nb('is-resultat-final').style.display='block';

  // Tableau de calcul
  var dedDetails=[];
  if(getV('ded-loyer')>0)dedDetails.push({lib:'Loyer annuel',mt:getV('ded-loyer')});
  if(getV('ded-assurance')>0)dedDetails.push({lib:'Assurances',mt:getV('ded-assurance')});
  if(getV('ded-amort')>0)dedDetails.push({lib:'Amortissements',mt:getV('ded-amort')});
  if(getV('ded-formation')>0)dedDetails.push({lib:'Frais de formation',mt:getV('ded-formation')});
  if(getV('ded-bancaire')>0)dedDetails.push({lib:'Frais bancaires & intérêts',mt:getV('ded-bancaire')});
  if(getV('ded-deplacement')>0)dedDetails.push({lib:'Frais de déplacement',mt:getV('ded-deplacement')});
  if(getV('ded-pub')>0)dedDetails.push({lib:'Publicité & Marketing',mt:getV('ded-pub')});
  if(getV('ded-dons')>0)dedDetails.push({lib:'Dons & mécénat',mt:getV('ded-dons')});
  if(getV('ded-cotis')>0)dedDetails.push({lib:'Cotisations professionnelles',mt:getV('ded-cotis')});
  DED_EXTRAS.forEach(d=>dedDetails.push({lib:d.lib+' (extra)',mt:d.mt}));

  var rows='';
  rows+=`<tr style="background:#eaf1ec"><td style="font-weight:600">Chiffre d'affaires net (HT, avoirs déduits)</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:700;color:var(--green)">${fmt(ca)} FCFA</td><td style="text-align:center"><span class="badge bg-green">Base</span></td></tr>`;
  rows+=`<tr><td style="padding-left:24px;color:var(--text-muted)">− Charges comptables enregistrées (Classe 6)</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--red)">− ${fmt(chCompta)} FCFA</td><td style="text-align:center"><span class="badge bg-red">Déductible</span></td></tr>`;
  if(totalSal>0){
    rows+=`<tr style="background:var(--purple-light)"><td style="padding-left:24px;color:var(--purple);font-weight:600">− Charges salariales (${SALAIRES.length} catégorie(s) — ${SALAIRES.reduce((a,s)=>a+s.nb,0)} employé(s))</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--purple);font-weight:700">− ${fmt(totalSal)} FCFA</td><td style="text-align:center"><span class="badge bg-purple">Déductible</span></td></tr>`;
    SALAIRES.forEach(s=>{rows+=`<tr><td style="padding-left:40px;font-size:10.5px;color:var(--text-muted)">&nbsp;&nbsp;→ ${s.poste} (${s.nb} × ${fmt(s.mtMensuel)}/mois)</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-size:10.5px;color:var(--text-muted)">− ${fmt(s.mtAnnuel)} FCFA</td><td></td></tr>`;});
  }
  dedDetails.forEach(d=>{
    rows+=`<tr><td style="padding-left:24px;color:var(--teal)">− ${d.lib}</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--teal)">− ${fmt(d.mt)} FCFA</td><td style="text-align:center"><span class="badge bg-teal">Déductible</span></td></tr>`;
  });
  rows+=`<tr style="background:var(--bg);border-top:2px solid var(--border-strong)"><td style="font-weight:700">= Bénéfice imposable net</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:700;font-size:13px;color:${benImposable>=0?'var(--blue)':'var(--text-muted)'}">${benImposable<0?'0 FCFA (déficit fiscal — IS = 0)':fmt(benImposableNet)+' FCFA'}</td><td style="text-align:center"><span class="badge bg-blue">Base IS</span></td></tr>`;
  rows+=`<tr style="background:#FFF9E6;border-top:2px solid var(--amber-border)"><td style="font-weight:700;color:var(--amber)">× Taux IS Togo = 27%</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:700;font-size:15px;color:var(--amber)">${fmt(isTotal)} FCFA</td><td style="text-align:center"><span class="badge bg-amber">IS DÛ</span></td></tr>`;
  nb('is-detail-table').innerHTML=rows;

  // Verdict final
  var verdict=nb('is-verdict');
  if(isTotal===0){
    verdict.style.cssText='border-radius:var(--radius);padding:20px 24px;text-align:center;background:var(--green-light);border:2px solid var(--green-border)';
    verdict.innerHTML=`<div style="font-size:28px;margin-bottom:6px">🎉</div><div style="font-size:14px;font-weight:600;color:var(--green-dark)">Pas d'impôt à payer</div><div style="font-size:12px;color:var(--text-muted);margin-top:4px">${benImposable<0?'Déficit fiscal de '+fmt(Math.abs(benImposable))+' FCFA — Aucun IS exigible.':'Bénéfice imposable nul.'}</div>`;
  } else {
    verdict.style.cssText='border-radius:var(--radius);padding:20px 24px;text-align:center;background:var(--sidebar-bg);border:2px solid var(--green-border)';
    verdict.innerHTML=`
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--sidebar-text);margin-bottom:6px">IMPÔT SUR LES SOCIÉTÉS À PAYER — EXERCICE ${EXERCICE.annee}</div>
      <div style="font-size:38px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--amber);letter-spacing:-1px">${fmt(isTotal)} FCFA</div>
      <div style="font-size:12px;color:var(--sidebar-text);margin-top:6px">Bénéfice imposable : <strong style="color:#fff">${fmt(benImposableNet)} FCFA</strong> × 27% = <strong style="color:var(--amber)">${fmt(isTotal)} FCFA</strong></div>
      <div style="margin-top:12px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <div style="background:rgba(255,255,255,.08);border-radius:var(--radius);padding:8px 14px"><div style="font-size:10px;color:var(--sidebar-text)">Taux effectif</div><div style="font-size:14px;font-weight:700;color:#fff">${ca>0?(isTotal/ca*100).toFixed(2)+'%':'—'}</div></div>
        <div style="background:rgba(255,255,255,.08);border-radius:var(--radius);padding:8px 14px"><div style="font-size:10px;color:var(--sidebar-text)">Économie déductions</div><div style="font-size:14px;font-weight:700;color:var(--green)">${fmt(Math.round((totalSal+totalDed+chCompta)*tauxIS))} FCFA</div></div>
        <div style="background:rgba(255,255,255,.08);border-radius:var(--radius);padding:8px 14px"><div style="font-size:10px;color:var(--sidebar-text)">Résultat net après IS</div><div style="font-size:14px;font-weight:700;color:var(--green-border)">${fmt(Math.max(0,benImposableNet-isTotal))} FCFA</div></div>
      </div>`;
  }

  // Échéancier acomptes
  var ann=EXERCICE.annee;
  nb('is-echeances').innerHTML=isTotal>0?`
    <div style="background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);padding:14px 16px;grid-column:span 2">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:10px">📅 Échéancier de paiement IS ${ann}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <div style="background:var(--amber-light);border:2px solid var(--amber-border);border-radius:var(--radius);padding:10px;text-align:center">
          <div style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase">1er acompte</div>
          <div style="font-size:11px;color:var(--text-muted);margin:3px 0">Avril ${ann}</div>
          <div style="font-size:15px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--amber)">${fmt(acompte)} FCFA</div>
          <div style="font-size:10px;color:var(--text-faint);margin-top:2px">33,33%</div>
        </div>
        <div style="background:var(--amber-light);border:2px solid var(--amber-border);border-radius:var(--radius);padding:10px;text-align:center">
          <div style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase">2e acompte</div>
          <div style="font-size:11px;color:var(--text-muted);margin:3px 0">Juillet ${ann}</div>
          <div style="font-size:15px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--amber)">${fmt(acompte)} FCFA</div>
          <div style="font-size:10px;color:var(--text-faint);margin-top:2px">33,33%</div>
        </div>
        <div style="background:var(--amber-light);border:2px solid var(--amber-border);border-radius:var(--radius);padding:10px;text-align:center">
          <div style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase">3e acompte</div>
          <div style="font-size:11px;color:var(--text-muted);margin:3px 0">Octobre ${ann}</div>
          <div style="font-size:15px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--amber)">${fmt(acompte)} FCFA</div>
          <div style="font-size:10px;color:var(--text-faint);margin-top:2px">33,33%</div>
        </div>
        <div style="background:var(--red-light);border:2px solid var(--red-border);border-radius:var(--radius);padding:10px;text-align:center">
          <div style="font-size:10px;font-weight:700;color:var(--red);text-transform:uppercase">Solde IS</div>
          <div style="font-size:11px;color:var(--text-muted);margin:3px 0">Mars ${ann+1}</div>
          <div style="font-size:15px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--red)">${fmt(acompte+solde)} FCFA</div>
          <div style="font-size:10px;color:var(--text-faint);margin-top:2px">Solde après acomptes</div>
        </div>
      </div>
    </div>`:'';

  // Stocker IS calculé pour la clôture
  window._IS_CALCULE = {isTotal, benImposableNet, totalSal, totalDed, ca, chCompta};
}

// ═══ EXERCICE FISCAL ═══
function definirExercice(){
  EXERCICE.annee=parseInt(nb('ex-annee').value)||2026;
  EXERCICE.debut=nb('ex-debut').value;
  EXERCICE.fin=nb('ex-fin').value;
  nb('ex-badge').textContent='Ex. '+EXERCICE.annee;
  nb('ex-status').style.display='block';
  nb('ex-status').innerHTML='<div class="alert alert-ok" style="display:block">✓ Exercice '+EXERCICE.annee+' défini — du '+fmtD(EXERCICE.debut)+' au '+fmtD(EXERCICE.fin)+'</div>';
  ajouterNotif('save','Exercice '+EXERCICE.annee+' défini','Du '+fmtD(EXERCICE.debut)+' au '+fmtD(EXERCICE.fin));
  sauvegarderAuto();renderExercice();
}

function renderExercice(){
  var tCh=0,tPr=0;
  EC.concat(REGL).forEach(e=>{
    if(e.cptD&&e.cptD.startsWith('6')&&!e.isTVA)tCh+=e.debit;
    if(e.cptC&&e.cptC.startsWith('7'))tPr+=e.credit;
  });
  var res=tPr-tCh;
  var is=window._IS_CALCULE;
  var isTotal=is?is.isTotal:0;
  var resApresIS=Math.max(0,res-isTotal);
  nb('ex-resultats-recap').innerHTML=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px">
    <div class="kpi" style="border-top:3px solid var(--green)"><div class="kpi-label">Total produits</div><div class="kpi-value kpi-pos" style="font-size:15px">${fmt(tPr)}</div><div class="kpi-sub">FCFA</div></div>
    <div class="kpi" style="border-top:3px solid var(--red)"><div class="kpi-label">Total charges</div><div class="kpi-value kpi-neg" style="font-size:15px">${fmt(tCh)}</div><div class="kpi-sub">FCFA</div></div>
    <div class="kpi" style="border-top:3px solid var(--amber)"><div class="kpi-label">IS dû (27%)</div><div class="kpi-value" style="font-size:15px;color:var(--amber)">${fmt(isTotal)}</div><div class="kpi-sub">FCFA${isTotal===0?' (calculez l\'IS d\'abord)':''}</div></div>
    <div class="kpi" style="border-top:3px solid ${res>=0?'var(--blue)':'var(--red)'}"><div class="kpi-label">Résultat net après IS</div><div class="kpi-value ${res>=0?'kpi-pos':'kpi-neg'}" style="font-size:15px">${fmt(resApresIS)}</div><div class="kpi-sub">FCFA</div></div>
  </div>
  ${isTotal===0?'<div class="alert alert-warn" style="display:block">⚠️ Calculez d\'abord l\'IS dans la section ci-dessus avant de clôturer, pour que l\'impôt soit correctement comptabilisé.</div>':''}`;
  if(!EXERCICES_ARCHIVES.length){nb('ex-historique').innerHTML='<div style="text-align:center;color:var(--text-faint);padding:22px;font-style:italic">Aucun exercice clôturé</div>';return;}
  nb('ex-historique').innerHTML=EXERCICES_ARCHIVES.map(a=>`
    <div style="padding:12px 16px;border-bottom:2px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div><strong>Exercice ${a.annee}</strong> <span style="font-size:11px;color:var(--text-muted)">du ${a.debut} au ${a.fin} · ${a.nbEcritures} écritures</span></div>
        <div style="display:flex;gap:12px;font-size:11.5px;flex-wrap:wrap">
          <span>CA : <strong>${fmt(a.ca||a.tPr)}</strong></span>
          <span>Charges : <strong>${fmt(a.tCh)}</strong></span>
          <span style="color:var(--amber);font-weight:700">IS : ${fmt(a.is||0)} FCFA</span>
          <span style="font-weight:700;color:${a.res>=0?'var(--green)':'var(--red)'}">${a.res>=0?'Bénéfice':'Déficit'} : ${fmt(Math.abs(a.res))} FCFA</span>
        </div>
      </div>
    </div>`).join('');
}

function cloturerExercice(){
  var isData=window._IS_CALCULE;
  var isTotal=isData?isData.isTotal:0;
  if(!confirm('Clôturer l\'exercice '+EXERCICE.annee+' ?\n\nRésumé :\n- IS calculé : '+fmt(isTotal)+' FCFA\n- Une écriture IS sera générée (D 8951 / C 4471)\n- Les données seront archivées\n- L\'exercice '+( EXERCICE.annee+1)+' sera ouvert\n\nAssurez-vous d\'avoir calculé l\'IS ci-dessus avant de continuer.'))return;

  var tCh=0,tPr=0;
  EC.concat(REGL).forEach(e=>{
    if(e.cptD&&e.cptD.startsWith('6')&&!e.isTVA)tCh+=e.debit;
    if(e.cptC&&e.cptC.startsWith('7'))tPr+=e.credit;
  });
  var res=tPr-tCh;
  var dateF='31/12/'+EXERCICE.annee;
  var date=EXERCICE.fin||EXERCICE.annee+'-12-31';
  var ca=isData?isData.ca:tPr;

  if(isTotal>0){
    EC.push({date,dateF,num:'IS-'+EXERCICE.annee,
      desc:'Impôt sur les Sociétés — Exercice '+EXERCICE.annee+' (27% × '+fmt(isData.benImposableNet)+' FCFA)',
      cli:'DGI Togo',cptD:'8951',cptC:'4471',
      debit:isTotal,credit:isTotal,pay:'credit',stat:'attente',
      ht:0,htNet:0,escVal:0,escPct:0,rrr:0,tva:0,tvaTaux:0,tvaCpt:'',tvaType:'',
      tr:0,port:0,ttc:isTotal,avance:0,resteDu:isTotal,
      echeance:EXERCICE.annee+'-04-30',
      type:'is',qty:0,cp:0,coutReel:0,
      avoir:false,modeLabel:'DOIT',lettre:'',_modifie:false,isISEntry:true
    });
    NOMS['8951']='IS — Impôt sur les bénéfices';
    NOMS['4471']='État — IS à payer';
  }

  var resApresIS=res-isTotal;
  if(resApresIS>0){
    EC.push({date,dateF,num:'CLOT-'+EXERCICE.annee,desc:'Clôture exercice '+EXERCICE.annee+' — Bénéfice net après IS',cli:'Clôture',cptD:'12',cptC:'1301',debit:resApresIS,credit:resApresIS,pay:'credit',stat:'payee',ht:0,htNet:0,escVal:0,escPct:0,rrr:0,tva:0,tvaTaux:0,tvaCpt:'',tvaType:'',tr:0,port:0,ttc:resApresIS,avance:0,resteDu:0,echeance:'',type:'clot',qty:0,cp:0,coutReel:0,avoir:false,modeLabel:'DOIT',lettre:'',_modifie:false});
  } else if(resApresIS<0){
    EC.push({date,dateF,num:'CLOT-'+EXERCICE.annee,desc:'Clôture exercice '+EXERCICE.annee+' — Perte nette',cli:'Clôture',cptD:'1302',cptC:'12',debit:Math.abs(resApresIS),credit:Math.abs(resApresIS),pay:'credit',stat:'payee',ht:0,htNet:0,escVal:0,escPct:0,rrr:0,tva:0,tvaTaux:0,tvaCpt:'',tvaType:'',tr:0,port:0,ttc:Math.abs(resApresIS),avance:0,resteDu:0,echeance:'',type:'clot',qty:0,cp:0,coutReel:0,avoir:false,modeLabel:'DOIT',lettre:'',_modifie:false});
  }

  EXERCICES_ARCHIVES.push({
    annee:EXERCICE.annee,debut:fmtD(EXERCICE.debut),fin:fmtD(EXERCICE.fin),
    tPr,tCh,res,ca,is:isTotal,
    benImposable:isData?isData.benImposableNet:0,
    totalSal:isData?isData.totalSal:0,
    totalDed:isData?isData.totalDed:0,
    nbEcritures:EC.length
  });

  exporterJSON();

  var nouvelAn=EXERCICE.annee+1;
  var s=getSoldeCalcule();
  SOLDES.caisse=s.caisse;SOLDES.banque=s.banque;
  EC=[];REGL=[];VIREMENTS=[];LETTRAGE={};lettreCursor=0;
  SALAIRES=[];DED_EXTRAS=[];
  ['ded-loyer','ded-assurance','ded-amort','ded-formation','ded-bancaire','ded-deplacement','ded-pub','ded-dons','ded-cotis'].forEach(id=>{try{nb(id).value='';}catch(e){}});
  window._IS_CALCULE=null;
  try{nb('is-resultat-final').style.display='none';renderSalaires();renderDedExtras();}catch(e){}
  EXERCICE={annee:nouvelAn,debut:nouvelAn+'-01-01',fin:nouvelAn+'-12-31'};
  nb('ex-annee').value=nouvelAn;nb('ex-debut').value=EXERCICE.debut;nb('ex-fin').value=EXERCICE.fin;
  nb('ex-badge').textContent='Ex. '+nouvelAn;

  ajouterNotif('save','Exercice '+EXERCICES_ARCHIVES[EXERCICES_ARCHIVES.length-1].annee+' clôturé','IS : '+fmt(isTotal)+' FCFA · Résultat : '+fmt(Math.abs(res))+' FCFA · Exercice '+nouvelAn+' ouvert.');
  sauvegarderAuto();renderAll();renderExercice();
  alert('✓ Exercice '+EXERCICES_ARCHIVES[EXERCICES_ARCHIVES.length-1].annee+' clôturé !\n\nRésultat brut : '+fmt(res)+' FCFA\nIS (27%) : '+fmt(isTotal)+' FCFA\nRésultat net après IS : '+fmt(Math.max(0,resApresIS))+' FCFA\n\nÉcriture IS : D 8951 / C 4471\nExercice '+nouvelAn+' ouvert.');
}

// ═══ ÉDITION ÉCRITURE ═══
function ouvrirEdit(idx,src){
  var e=src==='REGL'?REGL[idx]:EC[idx];if(!e)return;
  editIdx=idx;editSrc=src;
  nb('edit-desc').value=e.desc||'';nb('edit-cptD').value=e.cptD||'';nb('edit-cptC').value=e.cptC||'';
  nb('edit-debit').value=e.debit||0;nb('edit-credit').value=e.credit||0;
  nb('edit-date').value=e.dateRaw||(e.dateRaw||(e.date?e.date.split('/').reverse().join('-'):''))||'';
  nb('edit-stat').value=e.stat||'payee';nb('edit-motif').value='';
  nb('modal-edit').style.display='flex';
}
function fermerEdit(){nb('modal-edit').style.display='none';editIdx=-1;}
function confirmerEdit(){
  var e=editSrc==='REGL'?REGL[editIdx]:EC[editIdx];if(!e)return;
  var motif=nb('edit-motif').value.trim()||'Aucun motif';
  var avant={desc:e.desc,cptD:e.cptD,cptC:e.cptC,debit:e.debit,credit:e.credit,stat:e.stat};
  var newDate=nb('edit-date').value;
  e.desc=nb('edit-desc').value.trim()||e.desc;
  e.cptD=nb('edit-cptD').value.trim().toUpperCase()||e.cptD;
  e.cptC=nb('edit-cptC').value.trim().toUpperCase()||e.cptC;
  e.debit=parseFloat(nb('edit-debit').value)||e.debit;
  e.credit=parseFloat(nb('edit-credit').value)||e.credit;
  e.stat=nb('edit-stat').value;
  if(newDate){e.date=fmtD(newDate);e.dateRaw=newDate;}
  var diff=[];
  if(avant.desc!==e.desc)diff.push('Libellé');
  if(avant.cptD!==e.cptD)diff.push('Cpt D');
  if(avant.cptC!==e.cptC)diff.push('Cpt C');
  if(avant.debit!==e.debit)diff.push('Débit');
  if(avant.credit!==e.credit)diff.push('Crédit');
  if(diff.length){e._modifie=true;ajouterNotif('modif','Modification — '+e.num,'Motif : '+motif+' | Champs : '+diff.join(', '));}
  fermerEdit();renderAll();sauvegarderAuto();
}

// ═══ RÈGLEMENT ═══
function ouvrirRegl(idx){
  var e=EC[idx];if(!e||e.stat!=='attente')return;
  modalReglIdx=idx;
  var today=new Date().toISOString().split('T')[0];
  nb('regl-date').value=today;nb('regl-mt').value=fmt(e.ttc)+' FCFA';
  nb('regl-info').innerHTML=`Facture <strong>${e.num}</strong> — ${e.cli}<br>Montant : <strong>${fmt(e.ttc)} FCFA</strong>`;
  updateReglEcr();
  nb('regl-pay').onchange=updateReglEcr;
  nb('modal-regl').style.display='flex';
}
function updateReglEcr(){var pay=nb('regl-pay').value;var e=EC[modalReglIdx];if(!e)return;var cE=pay==='banque'?'521':'571';var cC=e.type==='achat'?'401':'4111';nb('regl-ecr').textContent=`D ${cE} / C ${cC} — ${fmt(e.ttc)} FCFA`;}
function fermerRegl(){nb('modal-regl').style.display='none';modalReglIdx=-1;}
function confirmerRegl(){
  var e=EC[modalReglIdx];if(!e)return;
  var date=nb('regl-date').value;var pay=nb('regl-pay').value;
  if(!date){alert('Date requise.');return;}
  EC[modalReglIdx].stat='payee';
  var cE=pay==='banque'?'521':'571',cC=e.type==='achat'?'401':'4111';
  REGL.push({date:fmtD(date),dateRaw:date,num:'RGL-'+e.num,desc:'Règlement '+e.num+' — '+e.cli,cptD:cE,cptC:cC,debit:e.ttc,credit:e.ttc,pay,stat:'payee',tvaTaux:0,tvaCpt:''});
  if(pay==='espece')SOLDES.caisse+=(e.type==='vente'||e.type==='service')?e.ttc:-e.ttc;
  else SOLDES.banque+=(e.type==='vente'||e.type==='service')?e.ttc:-e.ttc;
  fermerRegl();
  ajouterNotif('reglement','Règlement '+e.num+' enregistré',fmt(e.ttc)+' FCFA — D '+cE+' / C '+cC);
  renderAll();sauvegarderAuto();verifierRetards();
}

// ═══ STOCK ═══
function ajouterProduit(){
  var nom=nb('s-nom').value.trim();var unite=nb('s-unite').value;var methode=nb('s-methode').value;
  var qte=parseFloat(nb('s-qte').value)||0;var pu=parseFloat(nb('s-pu').value)||0;
  if(!nom){alert('Nom requis.');return;}if(!qte||!pu){alert('Quantité et prix requis.');return;}
  if(STOCKS[nom]){alert('Ce produit existe déjà.');return;}
  STOCKS[nom]={nom,unite,methode,qteInit:qte,puInit:pu,qteActuelle:qte,cmup:pu,lots:[{qte,pu,date:new Date().toLocaleDateString('fr-FR')}],mvts:[{date:new Date().toLocaleDateString('fr-FR'),op:'Init',ref:'—',avant:0,entree:qte,sortie:0,apres:qte,pu,valApres:qte*pu}]};
  ['s-nom','s-qte','s-pu'].forEach(id=>nb(id).value='');nb('s-val').value='';
  syncProduitSelect();renderAllStocks();sauvegarderAuto();
}
function syncProduitSelect(){
  var sel=nb('f-produit-stock');var cur=sel.value;
  sel.innerHTML='<option value="">-- Aucun --</option>';
  Object.keys(STOCKS).forEach(nom=>{var s=STOCKS[nom];var opt=document.createElement('option');opt.value=nom;opt.textContent=nom+' ('+s.qteActuelle+' '+s.unite+' — '+s.methode.toUpperCase()+')';sel.appendChild(opt);});
  if(STOCKS[cur])sel.value=cur;
}
function onDescInput(){var d=nb('f-desc').value.toLowerCase();var sel=nb('f-produit-stock');Object.keys(STOCKS).forEach(nom=>{if(d.includes(nom.toLowerCase())&&!sel.value){sel.value=nom;onProduitChange();}});}
function onProduitChange(){var nom=nb('f-produit-stock').value;var h=nb('f-stock-hint');if(!nom||!STOCKS[nom]){h.style.display='none';return;}var s=STOCKS[nom];h.style.display='block';h.innerHTML=`Stock : <strong>${fmt(s.qteActuelle)} ${s.unite}</strong> | Méthode : <strong>${s.methode.toUpperCase()}</strong> | CMUP : <strong>${fmt(s.cmup)} FCFA</strong>`;}
function mouvementStock(nom,type,qty,pu,dateF,ref){
  if(!STOCKS[nom]||!qty)return;
  var s=STOCKS[nom];var avant=s.qteActuelle;
  if(type==='achat'){s.lots.push({qte:qty,pu,date:dateF});s.qteActuelle+=qty;var tv=s.lots.reduce((a,l)=>a+l.qte*l.pu,0);s.cmup=Math.round(tv/s.qteActuelle);s.mvts.push({date:dateF,op:'Entrée',ref,avant,entree:qty,sortie:0,apres:s.qteActuelle,pu,valApres:s.qteActuelle*s.cmup});}
  else if(type==='vente'||type==='service'){var sortie=Math.min(qty,s.qteActuelle);var cout=0;if(s.methode==='fifo'){var r=sortie;while(r>0&&s.lots.length>0){var l=s.lots[0];if(l.qte<=r){cout+=l.qte*l.pu;r-=l.qte;s.lots.shift();}else{cout+=r*l.pu;l.qte-=r;r=0;}}}else{cout=sortie*s.cmup;var r2=sortie;while(r2>0&&s.lots.length>0){if(s.lots[0].qte<=r2){r2-=s.lots[0].qte;s.lots.shift();}else{s.lots[0].qte-=r2;r2=0;}}}s.qteActuelle-=sortie;var vA=s.methode==='cmup'?s.qteActuelle*s.cmup:s.lots.reduce((a,l)=>a+l.qte*l.pu,0);s.mvts.push({date:dateF,op:'Sortie',ref,avant,entree:0,sortie,apres:s.qteActuelle,pu:Math.round(cout/sortie||0),coutTotal:Math.round(cout),valApres:Math.round(vA)});}
  syncProduitSelect();renderAllStocks();
}
function confirmerStock(sens){
  nb('modal-stock').style.display='none';
  if(!pendingFacture)return;
  var p=pendingFacture;pendingFacture=null;
  if(sens!=='aucun'){var ts=sens==='entree'?'achat':'vente';var pu=ts==='achat'?Math.round(p.htNet/p.qty):STOCKS[p.nomProduit].cmup;mouvementStock(p.nomProduit,ts,p.qty,pu,p.dateF,p.num);}
  finaliserFacture(p.e,p.ttc,p.pm,p.cpts,p.num,p.desc,p.cli,p.type,p.avoir);
}
function renderAllStocks(){
  var wrap=nb('s-wrap');
  if(!Object.keys(STOCKS).length){wrap.innerHTML='<div style="text-align:center;color:var(--text-faint);padding:26px;font-style:italic">Aucun produit</div>';return;}
  wrap.innerHTML=Object.keys(STOCKS).map(nom=>{
    var s=STOCKS[nom];var pct=s.qteInit>0?Math.round((s.qteActuelle/s.qteInit)*100):0;
    var bc=pct>40?'var(--green)':pct>20?'var(--amber)':'var(--red)';
    var stat=pct>40?'<span class="badge bg-green">OK</span>':pct>20?'<span class="badge bg-amber">Faible</span>':s.qteActuelle===0?'<span class="badge bg-red">Rupture</span>':'<span class="badge bg-red">Critique</span>';
    var mb=s.methode==='fifo'?'<span class="badge bg-blue">FIFO</span>':'<span class="badge bg-purple">CMUP</span>';
    return`<div class="card" style="margin-bottom:10px">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:13px;font-weight:600">${nom}</span>${mb}<span style="font-size:10px;color:var(--text-muted)">${s.unite}</span>${stat}</div>
        <div style="display:flex;gap:14px;font-size:11.5px"><span>Stock : <strong>${fmt(s.qteActuelle)} ${s.unite}</strong></span><span>CMUP : <strong>${fmt(s.cmup)} FCFA</strong></span><span>Valeur : <strong>${fmt(s.qteActuelle*s.cmup)} FCFA</strong></span></div>
      </div>
      <div class="card-body" style="padding:8px 14px">
        <div style="height:5px;background:var(--bg);border-radius:var(--radius);margin-bottom:5px;overflow:hidden"><div style="height:100%;width:${Math.max(0,pct)}%;background:${bc};border-radius:var(--radius);transition:width .4s"></div></div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">${pct}% du stock initial</div>
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Op.</th><th>Réf.</th><th style="text-align:right">Avant</th><th style="text-align:right">Entrée</th><th style="text-align:right">Sortie</th><th style="text-align:right">Après</th><th style="text-align:right">P.U.</th><th style="text-align:right">Valeur stock</th></tr></thead>
        <tbody>${s.mvts.map(m=>{var ob=m.op==='Init'?'<span class="badge bg-blue">Init</span>':m.entree>0?'<span class="badge bg-green">Entrée</span>':'<span class="badge bg-red">Sortie</span>';return`<tr><td>${m.date}</td><td>${ob}</td><td>${m.ref}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(m.avant)}</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--green)">${m.entree?fmt(m.entree):''}</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--red)">${m.sortie?fmt(m.sortie):''}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(m.apres)}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(m.pu)}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(m.valApres)}</td></tr>`;}).join('')}</tbody></table></div>
      </div>
    </div>`;
  }).join('');
}
function renderStock(){syncProduitSelect();renderAllStocks();}

// ═══ SUIVI ═══
function renderSuivi(){
  var ca=0,ch=0,nbV=0,nbA=0;
  EC.filter(e=>!e.isTVA&&!e.isAvance).forEach(e=>{if(e.type==='vente'||e.type==='service'){ca+=e.ht;nbV++;}if(e.type==='achat'){ch+=e.ht;nbA++;}});
  var res=ca-ch;
  nb('sv-ca').textContent=fmt(ca);nb('sv-ca-sub').textContent='FCFA — '+nbV+' vente(s)';
  nb('sv-ch').textContent=fmt(ch);nb('sv-ch-sub').textContent='FCFA — '+nbA+' achat(s)';
  var rEl=nb('sv-res');rEl.textContent=fmt(res);rEl.className='kpi-value '+(res>=0?'kpi-pos':'kpi-neg');
  nb('sv-nb').textContent=EC.filter(e=>!e.isTVA&&!e.isAvance).length;
  nb('sv-nb-sub').textContent=nbV+' ventes / '+nbA+' achats';
  var couts=EC.filter(e=>e.cp>0).map(e=>{var ec=e.coutReel-e.cp;var b=ec<=0?'<span class="badge bg-green">Favorable</span>':'<span class="badge bg-red">Défavorable</span>';return`<tr><td><strong>${e.num}</strong></td><td style="font-size:10.5px;white-space:normal">${e.desc}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(e.cp)}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(e.coutReel)}</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:600;color:${ec<=0?'var(--green)':'var(--red)'}">${ec>=0?'+':''}${fmt(ec)}</td><td>${b}</td></tr>`;}).join('');
  nb('sv-couts').innerHTML=couts||'<tr class="empty-row"><td colspan="6">Aucun coût préétabli</td></tr>';
  var hist=EC.filter(e=>!e.isTVA&&!e.isAvance).map(e=>{var tb=e.type==='vente'?'<span class="badge bg-green">Vente</span>':e.type==='service'?'<span class="badge bg-blue">Service</span>':'<span class="badge bg-red">Achat</span>';var sb=e.stat==='payee'?'<span class="badge bg-green">Payée</span>':'<span class="badge bg-amber">Attente</span>';return`<tr><td>${e.dateF||e.date}</td><td><strong>${e.num}</strong></td><td style="font-size:10.5px;white-space:normal">${e.desc}</td><td>${tb}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${fmt(e.ht)}</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:600">${fmt(e.ttc)}</td><td>${sb}</td></tr>`;}).join('');
  nb('sv-hist').innerHTML=hist||'<tr class="empty-row"><td colspan="7">Aucune opération</td></tr>';
}

// ═══ REINIT ═══
function reinit(){
  ['f-num','f-client','f-desc','f-ht','f-escompte','f-escompte-val','f-ht-net','f-tr','f-port','f-rrr','f-tva-val','f-ttc','f-qty','f-cout-pre','f-avance','f-echeance'].forEach(id=>nb(id).value='');
  nb('f-reste-du').textContent='—';nb('f-reste-du').style.color='var(--text)';
  nb('f-type').value='';nb('f-pay').value='';nb('f-statut').value='payee';
  nb('f-produit-stock').value='';nb('f-unite').value='unite';
  nb('f-tva-type').value='18v';nb('f-tva-taux').value='18';nb('f-tva-cpt').value='4431';
  nb('f-tva-label').textContent='TVA 18% (auto)';
  nb('f-stock-hint').style.display='none';
  nb('ia-err').style.display='none';nb('ia-ok').style.display='none';nb('ia-tip').style.display='block';
  nb('f-date').value=new Date().toISOString().split('T')[0];
  setMode('doit');updateNumAuto();
}

function toutEffacer(){
  if(!confirm('Effacer toutes les données de l\'exercice en cours ?'))return;
  EC=[];REGL=[];NOTIFS=[];VIREMENTS=[];STOCKS={};GL_EXTRA={};LETTRAGE={};lettreCursor=0;
  SALAIRES=[];DED_EXTRAS=[];window._IS_CALCULE=null;
  SOLDES={caisse:0,banque:0,caisseDefini:false,banqueDefini:false};
  nb('nb-journal').textContent='0';
  nb('f-produit-stock').innerHTML='<option value="">-- Aucun --</option>';
  try{nb('is-resultat-final').style.display='none';renderSalaires();renderDedExtras();}catch(e){}
  renderAll();renderNotifs();renderAllStocks();reinit();
  try{localStorage.removeItem('comptaia_data');}catch(e){}
}

// ═══ DÉMO ═══
function chargerDemo(){
  toutEffacer();
  SOLDES.caisse=500000;SOLDES.banque=2500000;SOLDES.caisseDefini=true;SOLDES.banqueDefini=true;
  TIERS=[{nom:'SOGECI SA',type:'client',tel:'+228 90 00 00 01',email:'sogeci@mail.tg',adresse:'Lomé, Togo'},{nom:'Dupont Frères',type:'fournisseur',tel:'+228 90 00 00 02',email:'dupont@mail.tg',adresse:'Cotonou, Bénin'},{nom:'Kamara & Fils',type:'client',tel:'',email:'',adresse:''},{nom:'Fournisseur Accra',type:'fournisseur',tel:'',email:'',adresse:'Accra, Ghana'}];
  syncTiersList();renderTiers();
  var produits=[{nom:'Tissu wax',unite:'metre',methode:'fifo',qte:500,pu:2000},{nom:'Chemise blanche',unite:'unite',methode:'cmup',qte:200,pu:8500}];
  produits.forEach(p=>{STOCKS[p.nom]={nom:p.nom,unite:p.unite,methode:p.methode,qteInit:p.qte,puInit:p.pu,qteActuelle:p.qte,cmup:p.pu,lots:[{qte:p.qte,pu:p.pu,date:'01/01/2026'}],mvts:[{date:'01/01/2026',op:'Init',ref:'—',avant:0,entree:p.qte,sortie:0,apres:p.qte,pu:p.pu,valApres:p.qte*p.pu}]};});
  syncProduitSelect();
  GL_EXTRA['4431']={nom:'TVA facturée sur vente',debit:0,credit:0,note:''};
  GL_EXTRA['4452']={nom:'TVA récupérable sur achat',debit:0,credit:0,note:''};
  NOMS['4431']='TVA facturée sur vente';NOMS['4452']='TVA récupérable sur achat';
  var factures=[
    {date:'2026-03-15',num:'F2026-001',cli:'SOGECI SA',type:'vente',desc:'Vente vêtements prêt-à-porter',ht:350000,escp:2,rrr:10000,tr:15000,port:0,avance:0,pay:'banque',stat:'payee',qty:30,unite:'metre',produit:'Tissu wax',cp:280000,tvaType:'18v',tvaTaux:18,tvaCpt:'4431',avoir:false,echeance:''},
    {date:'2026-03-22',num:'F2026-002',cli:'Dupont Frères',type:'achat',desc:'Achat tissus et matières premières',ht:180000,escp:0,rrr:0,tr:8000,port:3500,avance:50000,pay:'banque',stat:'payee',qty:120,unite:'metre',produit:'Tissu wax',cp:0,tvaType:'18a',tvaTaux:18,tvaCpt:'4452',avoir:false,echeance:''},
    {date:'2026-04-01',num:'F2026-003',cli:'Kamara & Fils',type:'vente',desc:'Vente chemises blanches uniformes',ht:220000,escp:0,rrr:5000,tr:0,port:2000,avance:0,pay:'espece',stat:'payee',qty:20,unite:'unite',produit:'Chemise blanche',cp:170000,tvaType:'18v',tvaTaux:18,tvaCpt:'4431',avoir:false,echeance:''},
    {date:'2026-04-03',num:'F2026-004',cli:'Agence Tempo',type:'service',desc:'Prestation couture événementielle',ht:95000,escp:3,rrr:0,tr:0,port:0,avance:20000,pay:'credit',stat:'attente',qty:0,unite:'unite',produit:'',cp:75000,tvaType:'10s',tvaTaux:10,tvaCpt:'4455',avoir:false,echeance:'2026-05-03'},
    {date:'2026-04-04',num:'AV2026-001',cli:'SOGECI SA',type:'vente',desc:'Retour 5 mètres tissu défectueux',ht:35000,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'payee',qty:5,unite:'metre',produit:'',cp:0,tvaType:'18v',tvaTaux:18,tvaCpt:'4431',avoir:true,echeance:''},
    {date:'2026-04-05',num:'F2026-005',cli:'Fournisseur Accra',type:'achat',desc:'Achat fil à coudre et accessoires',ht:45000,escp:0,rrr:0,tr:5000,port:1500,avance:0,pay:'banque',stat:'payee',qty:30,unite:'unite',produit:'',cp:0,tvaType:'8t',tvaTaux:8,tvaCpt:'4454',avoir:false,echeance:''},
    {date:'2026-04-06',num:'F2026-006',cli:'SOGECI SA',type:'vente',desc:'Vente linge de maison (commande spéciale)',ht:480000,escp:5,rrr:15000,tr:20000,port:4000,avance:100000,pay:'banque',stat:'attente',qty:40,unite:'unite',produit:'',cp:380000,tvaType:'18v',tvaTaux:18,tvaCpt:'4431',avoir:false,echeance:'2026-05-06'},
  ];
  factures.forEach(f=>{
    nb('f-date').value=f.date;nb('f-num').value=f.num;nb('f-client').value=f.cli;nb('f-type').value=f.type;
    nb('f-desc').value=f.desc;nb('f-ht').value=f.ht;nb('f-escompte').value=f.escp;nb('f-rrr').value=f.rrr;
    nb('f-tr').value=f.tr;nb('f-port').value=f.port;nb('f-avance').value=f.avance;
    nb('f-pay').value=f.pay;nb('f-statut').value=f.stat;nb('f-qty').value=f.qty;nb('f-unite').value=f.unite;
    nb('f-produit-stock').value=f.produit;nb('f-cout-pre').value=f.cp;nb('f-echeance').value=f.echeance;
    nb('f-tva-type').value=f.tvaType;nb('f-tva-taux').value=f.tvaTaux;nb('f-tva-cpt').value=f.tvaCpt;
    FACTURE_MODE=f.avoir?'avoir':'doit';
    calcM();valider();
  });
  FACTURE_MODE='doit';reinit();
  sauvegarderAuto();
  alert('✅ Démo chargée — 7 factures (dont 1 AVOIR), TVA variées, tiers, stock, soldes définis.\nToutes les données sont sauvegardées automatiquement dans votre navigateur.');
}
