// v14: emprunts, mobile money, compta analytique, piste audit, simulateur fiscal, multi-lignes facture, production, caisse/PDV - extracted from ComptaIA_Pro_original.html lines 6392-7063
// ══════════════════════════════════════════════════════════
// GEST Africa v14 — JAVASCRIPT COMPLET
// ══════════════════════════════════════════════════════════

// ── DATA STORES v14 ────────────────────────────────────────
var EMPRUNTS = JSON.parse(localStorage.getItem('v14_emprunts')||'[]');
var AXES_ANALYTIQUES = JSON.parse(localStorage.getItem('v14_axes')||'[]');
var AFFECTATIONS = JSON.parse(localStorage.getItem('v14_affectations')||'{}');
var AUDIT_LOG = JSON.parse(localStorage.getItem('v14_audit')||'[]');
var NOMENCLATURES = JSON.parse(localStorage.getItem('v14_nomenclatures')||'[]');
var OF_HISTORY = JSON.parse(localStorage.getItem('v14_of')||'[]');
var PANIER = [];
var VENTES_CAISSE = JSON.parse(localStorage.getItem('v14_caisse_'+new Date().toDateString())||'[]');
var SECTEUR_ACTIF = 'commerce';
var ML_LIGNES = [];

function saveV14(){
  try{
    localStorage.setItem('v14_emprunts',JSON.stringify(EMPRUNTS));
    localStorage.setItem('v14_axes',JSON.stringify(AXES_ANALYTIQUES));
    localStorage.setItem('v14_affectations',JSON.stringify(AFFECTATIONS));
    localStorage.setItem('v14_audit',JSON.stringify(AUDIT_LOG));
    localStorage.setItem('v14_nomenclatures',JSON.stringify(NOMENCLATURES));
    localStorage.setItem('v14_of',JSON.stringify(OF_HISTORY));
    localStorage.setItem('v14_caisse_'+new Date().toDateString(),JSON.stringify(VENTES_CAISSE));
  }catch(e){}
}

// ── PISTE D'AUDIT ──────────────────────────────────────────
function logAudit(type, ecritureNum, avant, apres, desc){
  var user = typeof CURRENT_USER!=='undefined' && CURRENT_USER ? (CURRENT_USER.name||CURRENT_USER.email||'Système') : 'Système';
  AUDIT_LOG.unshift({ts:new Date().toISOString(), type:type, num:ecritureNum||'—', avant:avant||'—', apres:apres||'—', desc:desc||'', user:user});
  if(AUDIT_LOG.length>500) AUDIT_LOG.splice(500);
  saveV14();
}
function renderAudit(){
  var tbody=document.getElementById('audit-tbody'); if(!tbody)return;
  var filtre=((document.getElementById('audit-filtre')||{}).value||'').toLowerCase();
  var typeF=(document.getElementById('audit-type-filtre')||{}).value||'';
  var rows=AUDIT_LOG.filter(function(r){
    if(typeF&&r.type!==typeF)return false;
    if(filtre&&!(r.num.toLowerCase().includes(filtre)||r.desc.toLowerCase().includes(filtre)||r.avant.toLowerCase().includes(filtre)||r.apres.toLowerCase().includes(filtre)))return false;
    return true;
  });
  if(!rows.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-faint);font-style:italic">Aucune entrée dans le journal d\'audit.</td></tr>';return;}
  var typeColors={creation:'bg-green',modification:'bg-amber',suppression:'bg-red',validation:'bg-blue'};
  tbody.innerHTML=rows.slice(0,200).map(function(r){
    var d=new Date(r.ts);
    var dateStr=d.toLocaleDateString('fr-FR')+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    return'<tr class="audit-row-'+r.type+'" style="border-bottom:2px solid var(--border)">'
      +'<td style="padding:7px 10px;font-size:10.5px;white-space:nowrap">'+dateStr+'</td>'
      +'<td style="padding:7px 10px"><span class="badge '+( typeColors[r.type]||'bg-blue')+'" style="font-size:9px">'+r.type+'</span></td>'
      +'<td style="padding:7px 10px;font-family:\'Archivo\',sans-serif;font-size:11px">'+r.num+'<div style="font-size:10px;color:var(--text-muted)">'+r.desc+'</div></td>'
      +'<td style="padding:7px 10px;font-size:10.5px;color:var(--text-muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+r.avant+'</td>'
      +'<td style="padding:7px 10px;font-size:10.5px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+r.apres+'</td>'
      +'<td style="padding:7px 10px;font-size:10.5px">'+r.user+'</td>'
      +'</tr>';
  }).join('');
}
function filtrerAudit(){renderAudit();}
function exporterAuditCSV(){
  var csv='Date/Heure;Type;N° Écriture;Description;Avant;Après;Utilisateur\n';
  AUDIT_LOG.forEach(function(r){csv+='"'+r.ts+'";"'+r.type+'";"'+r.num+'";"'+r.desc+'";"'+r.avant+'";"'+r.apres+'";"'+r.user+'"\n';});
  var a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='Audit_GestAfrica_'+new Date().toISOString().split('T')[0]+'.csv';a.click();
}

// Intercept EC modifications for audit
var _origPush = Array.prototype.push;
if(typeof EC!=='undefined' && !EC._auditPatched){
  var origValidation = window.valider;
  window.valider = function(){
    origValidation && origValidation.apply(this, arguments);
    var last = EC[EC.length-1];
    if(last) logAudit('creation', last.num||'—', '—', last.ttc?last.ttc.toLocaleString('fr-FR')+' FCFA TTC':'—', last.desc||last.cli||'');
  };
  EC._auditPatched = true;
}

// ── EMPRUNTS BANCAIRES ──────────────────────────────────────
function calcEmprunt(){
  var C=parseFloat((document.getElementById('empr-capital')||{}).value)||0;
  var r=(parseFloat((document.getElementById('empr-taux')||{}).value)||0)/100/12;
  var n=parseInt((document.getElementById('empr-duree')||{}).value)||0;
  if(!C||!n){if(document.getElementById('empr-mensualite'))document.getElementById('empr-mensualite').value='—';return;}
  var M=r>0?Math.round(C*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1)):Math.round(C/n);
  if(document.getElementById('empr-mensualite'))document.getElementById('empr-mensualite').value=M.toLocaleString('fr-FR')+' FCFA';
}
function ajouterEmprunt(){
  var lib=(document.getElementById('empr-lib')||{}).value.trim();
  var banque=(document.getElementById('empr-banque')||{}).value.trim();
  var C=parseFloat((document.getElementById('empr-capital')||{}).value)||0;
  var taux=parseFloat((document.getElementById('empr-taux')||{}).value)||0;
  var n=parseInt((document.getElementById('empr-duree')||{}).value)||0;
  var debut=(document.getElementById('empr-debut')||{}).value;
  var cpt=(document.getElementById('empr-cpt')||{}).value||'161';
  if(!lib||!C||!n||!debut){alert('Libellé, capital, durée et date obligatoires.');return;}
  var r=taux/100/12;
  var M=r>0?Math.round(C*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1)):Math.round(C/n);
  var tableau=[];
  var solde=C;
  var dDebut=new Date(debut);
  for(var i=0;i<n;i++){
    var interests=Math.round(solde*r);
    var capital=M-interests;
    if(i===n-1)capital=Math.round(solde);
    var dateMens=new Date(dDebut.getFullYear(),dDebut.getMonth()+i+1,dDebut.getDate());
    tableau.push({mois:i+1,date:dateMens.toISOString().split('T')[0],mensualite:Math.min(M,solde+interests),capital:Math.min(capital,solde),interests:interests,solde:Math.max(0,solde-Math.min(capital,solde))});
    solde=Math.max(0,solde-Math.min(capital,solde));
  }
  var empr={id:Date.now(),lib:lib,banque:banque,capital:C,taux:taux,n:n,debut:debut,cpt:cpt,mensualite:M,tableau:tableau,comptabilise:0};
  EMPRUNTS.push(empr);
  // Écriture d'entrée de fonds
  if(typeof EC!=='undefined'){
    EC.push({date:debut,num:'EMP-'+Date.now(),cli:banque||'Emprunt',type:'achat',desc:'[Emprunt] '+lib+' — '+C.toLocaleString('fr-FR')+' FCFA',ht:C,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'payee',qty:1,unite:'',produit:'',cp:0,tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',cptD:'521',cptC:cpt,debit:C,credit:C,isTVA:false});
    logAudit('creation','EMP-'+Date.now(),'—','Emprunt '+C.toLocaleString('fr-FR')+' FCFA',lib+' — '+banque);
  }
  saveV14();
  if(typeof sauvegarderAuto==='function')sauvegarderAuto();
  renderEmprunts();
  afficherTableauAmortissement(empr);
  if(typeof ajouterNotif==='function')ajouterNotif('info','Emprunt enregistré — '+lib,C.toLocaleString('fr-FR')+' FCFA sur '+n+' mois à '+taux+'%');
}
function renderEmprunts(){
  var w=document.getElementById('empr-list-wrap'); if(!w)return;
  if(!EMPRUNTS.length){w.innerHTML='<div style="text-align:center;padding:24px;color:var(--text-faint);font-style:italic">Aucun emprunt enregistré.</div>';return;}
  var html='<div class="card"><div class="card-header"><span class="card-title">Emprunts en cours</span></div><div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--bg)"><th style="padding:7px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Prêt</th><th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Banque</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Capital</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Mensualité</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Restant dû</th><th style="padding:7px 10px;border-bottom:2px solid var(--border)">Actions</th></tr></thead><tbody>';
  EMPRUNTS.forEach(function(e,i){
    var comptabilise=e.comptabilise||0;
    var restant=e.tableau.slice(comptabilise).reduce(function(a,m){return a+m.capital;},0);
    html+='<tr style="border-bottom:2px solid var(--border)"><td style="padding:7px 10px;font-weight:600">'+e.lib+'</td><td style="padding:7px 10px;font-size:11px;color:var(--text-muted)">'+( e.banque||'—')+'</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+e.capital.toLocaleString('fr-FR')+' FCFA</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--amber)">'+e.mensualite.toLocaleString('fr-FR')+' FCFA</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--red)">'+Math.max(0,restant).toLocaleString('fr-FR')+' FCFA</td><td style="padding:7px 10px"><div style="display:flex;gap:4px"><button class="btn btn-sm" style="font-size:9px;padding:2px 6px" onclick="afficherTableauAmortissement(EMPRUNTS['+i+'])">'+ico('calendar')+' Tableau</button><button class="btn btn-sm" style="font-size:9px;padding:2px 6px;background:var(--amber);color:#fff;border-color:var(--amber)" onclick="comptabiliserMensualite('+i+')">'+ico('bolt')+' Prochaine mensualité</button></div></td></tr>';
  });
  html+='</tbody></table></div></div>';
  w.innerHTML=html;
}
function afficherTableauAmortissement(empr){
  var w=document.getElementById('empr-tableau-wrap'); if(!w)return;
  var html='<div class="card"><div class="card-header"><span class="card-title">'+ico('calendar')+' Tableau d\'amortissement — '+empr.lib+'</span></div><div class="card-body" style="padding:0;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:var(--bg)"><th style="padding:6px 8px;border-bottom:2px solid var(--border);color:var(--text-muted);font-size:9px;text-transform:uppercase">Mois</th><th style="padding:6px 8px;border-bottom:2px solid var(--border);color:var(--text-muted);font-size:9px;text-transform:uppercase">Date</th><th style="padding:6px 8px;text-align:right;border-bottom:2px solid var(--border);color:var(--text-muted);font-size:9px;text-transform:uppercase">Mensualité</th><th style="padding:6px 8px;text-align:right;border-bottom:2px solid var(--border);color:var(--text-muted);font-size:9px;text-transform:uppercase">Capital</th><th style="padding:6px 8px;text-align:right;border-bottom:2px solid var(--border);color:var(--text-muted);font-size:9px;text-transform:uppercase">Intérêts</th><th style="padding:6px 8px;text-align:right;border-bottom:2px solid var(--border);color:var(--text-muted);font-size:9px;text-transform:uppercase">Capital restant</th><th style="padding:6px 8px;border-bottom:2px solid var(--border);font-size:9px">Statut</th></tr></thead><tbody>';
  empr.tableau.forEach(function(m,i){
    var done=i<(empr.comptabilise||0);
    html+='<tr style="border-bottom:2px solid var(--border);'+(done?'opacity:.5;background:var(--bg)':'')+'"><td style="padding:5px 8px;font-family:\'Archivo\',sans-serif">'+m.mois+'</td><td style="padding:5px 8px;font-size:10.5px">'+m.date.split('-').reverse().join('/')+'</td><td style="padding:5px 8px;text-align:right;font-family:\'Archivo\',sans-serif">'+m.mensualite.toLocaleString('fr-FR')+'</td><td style="padding:5px 8px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--blue)">'+m.capital.toLocaleString('fr-FR')+'</td><td style="padding:5px 8px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--red)">'+m.interests.toLocaleString('fr-FR')+'</td><td style="padding:5px 8px;text-align:right;font-family:\'Archivo\',sans-serif">'+m.solde.toLocaleString('fr-FR')+'</td><td style="padding:5px 8px">'+( done?'<span class="badge bg-green" style="font-size:9px">'+ico('check')+' Comptabilisé</span>':'<span class="badge bg-teal" style="font-size:9px">En attente</span>')+'</td></tr>';
  });
  html+='</tbody></table></div></div>';
  w.innerHTML=html;
}
function comptabiliserMensualite(i){
  var empr=EMPRUNTS[i];
  var idx=empr.comptabilise||0;
  if(idx>=empr.tableau.length){alert('Toutes les mensualités ont été comptabilisées.');return;}
  var m=empr.tableau[idx];
  var dateAuj=new Date().toISOString().split('T')[0];
  if(typeof EC!=='undefined'){
    // Capital : D.16x / C.521
    EC.push({date:m.date||dateAuj,num:'EMP-CAP-'+Date.now(),cli:empr.banque||'Emprunt',type:'achat',desc:'[Emprunt] '+empr.lib+' — Mensualité '+m.mois+'/'+empr.n+' (Capital)',ht:m.capital,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'payee',qty:1,unite:'',produit:'',cp:0,tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',cptD:empr.cpt,cptC:'521',debit:m.capital,credit:m.capital,isTVA:false});
    // Intérêts : D.671 / C.521
    if(m.interests>0)EC.push({date:m.date||dateAuj,num:'EMP-INT-'+Date.now(),cli:empr.banque||'Emprunt',type:'achat',desc:'[Emprunt] '+empr.lib+' — Mensualité '+m.mois+'/'+empr.n+' (Intérêts)',ht:m.interests,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'payee',qty:1,unite:'',produit:'',cp:0,tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',cptD:'671',cptC:'521',debit:m.interests,credit:m.interests,isTVA:false});
    logAudit('creation','EMP-CAP-'+m.mois,'—',m.mensualite.toLocaleString('fr-FR')+' FCFA',empr.lib+' mensualité '+m.mois);
  }
  empr.comptabilise=(idx+1);
  saveV14();
  if(typeof sauvegarderAuto==='function')sauvegarderAuto();
  if(typeof renderJournal==='function')renderJournal();
  afficherTableauAmortissement(empr);
  renderEmprunts();
  if(typeof ajouterNotif==='function')ajouterNotif('info','Mensualité comptabilisée — '+empr.lib,'Mois '+m.mois+' : Capital '+m.capital.toLocaleString('fr-FR')+' FCFA + Intérêts '+m.interests.toLocaleString('fr-FR')+' FCFA (D.'+empr.cpt+'+D.671/C.521)');
}

// ── MOBILE MONEY (prise en compte dans les comptes) ────────
// On patch la fonction genererEcriture pour gérer Flooz/T-Money
(function(){
  var _origValider=window.valider;
  if(!_origValider)return;
  // The actual account mapping is done via pay field
  // We patch calcSoldes to handle 5215 and 5216
  var _orig=window.calcSoldes;
  if(typeof _orig==='function'){
    window.calcSoldes=function(){
      var r=_orig.apply(this,arguments);
      return r;
    };
  }
  // Update the releve to show flooz/tmoney
  var origRenderSolde=window.renderSolde;
  if(typeof origRenderSolde==='function'){
    window.renderSolde=function(){
      origRenderSolde.apply(this,arguments);
      // Inject MM soldes
      var sc=calcSoldes?calcSoldes():{caisse:0,banque:0};
      var flooz=0,tmoney=0;
      if(typeof EC!=='undefined') EC.concat(REGL||[]).forEach(function(e){
        if(e.pay==='flooz'){flooz+=e.credit||0; flooz-=e.debit||0;}
        if(e.pay==='tmoney'){tmoney+=e.credit||0; tmoney-=e.debit||0;}
      });
    };
  }
})();

// ── COMPTABILITÉ ANALYTIQUE ────────────────────────────────
function ouvrirFormulaireAxe(){document.getElementById('axe-form').style.display='block';}
function sauverAxe(){
  var code=document.getElementById('axe-code').value.trim();
  var lib=document.getElementById('axe-lib').value.trim();
  if(!code||!lib){alert('Code et libellé obligatoires.');return;}
  AXES_ANALYTIQUES.push({id:Date.now(),code:code,lib:lib,type:document.getElementById('axe-type').value,couleur:document.getElementById('axe-couleur').value});
  saveV14();
  document.getElementById('axe-form').style.display='none';
  renderAxes();calculerAnalytique();
}
function renderAxes(){
  var el=document.getElementById('axes-list');if(!el)return;
  if(!AXES_ANALYTIQUES.length){el.innerHTML='<div style="color:var(--text-faint);font-style:italic;font-size:12px">Aucun axe. Créez votre premier axe analytique.</div>';return;}
  var sel=document.getElementById('affect-axe-sel');if(sel){sel.innerHTML='<option value="">— Choisir un axe —</option>';AXES_ANALYTIQUES.forEach(function(a){var o=document.createElement('option');o.value=a.id;o.textContent='['+a.code+'] '+a.lib;sel.appendChild(o);});}
  el.innerHTML=AXES_ANALYTIQUES.map(function(a,i){
    return'<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:2px solid var(--border)"><div style="width:12px;height:12px;border-radius:50%;background:'+a.couleur+';flex-shrink:0"></div><div style="flex:1"><div style="font-size:12px;font-weight:600">['+a.code+'] '+a.lib+'</div><div style="font-size:10px;color:var(--text-muted)">'+a.type+'</div></div><button class="btn btn-sm" style="font-size:9px;padding:1px 5px;color:var(--red);border-color:var(--red-border)" onclick="supprimerAxe('+i+')">'+ico('close')+'</button></div>';
  }).join('');
}
function supprimerAxe(i){if(confirm('Supprimer cet axe ?')){AXES_ANALYTIQUES.splice(i,1);saveV14();renderAxes();calculerAnalytique();}}
function calculerAnalytique(){
  var el=document.getElementById('analytique-result');if(!el)return;
  if(!AXES_ANALYTIQUES.length){el.innerHTML='<div style="color:var(--text-faint);font-style:italic;font-size:12px">Créez des axes analytiques pour voir les résultats.</div>';return;}
  var resultats={};
  AXES_ANALYTIQUES.forEach(function(a){resultats[a.id]={lib:a.lib,code:a.code,couleur:a.couleur,produits:0,charges:0};});
  // Agréger les écritures affectées
  if(typeof EC!=='undefined') EC.concat(REGL||[]).forEach(function(e){
    var axeId=AFFECTATIONS[e.num||e.id];
    if(!axeId||!resultats[axeId])return;
    if(e.cptC&&e.cptC.startsWith('7'))resultats[axeId].produits+=(e.credit||e.htNet||0);
    if(e.cptD&&e.cptD.startsWith('6'))resultats[axeId].charges+=(e.debit||e.htNet||0);
  });
  var html=Object.values(resultats).map(function(r){
    var res=r.produits-r.charges;
    return'<div style="padding:8px 0;border-bottom:2px solid var(--border)"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><div style="width:10px;height:10px;border-radius:50%;background:'+r.couleur+'"></div><strong style="font-size:11.5px">['+r.code+'] '+r.lib+'</strong></div><div style="display:flex;gap:12px;font-size:11px"><span>Produits : <span style="color:var(--green);font-family:\'Archivo\',sans-serif">+'+r.produits.toLocaleString('fr-FR')+'</span></span><span>Charges : <span style="color:var(--red);font-family:\'Archivo\',sans-serif">-'+r.charges.toLocaleString('fr-FR')+'</span></span><span style="font-weight:700;color:'+(res>=0?'var(--green)':'var(--red)')+'">= '+(res>=0?'+':'')+res.toLocaleString('fr-FR')+' FCFA</span></div></div>';
  }).join('');
  el.innerHTML=html||'<div style="color:var(--text-faint);font-style:italic;font-size:12px">Aucune écriture affectée aux axes.</div>';
}
function filtrerEcrituresAnalytique(){
  var el=document.getElementById('affect-ec-list');if(!el)return;
  var filtre=((document.getElementById('affect-filtre')||{}).value||'').toLowerCase();
  var toutes=typeof EC!=='undefined'?EC:[];
  var filtrees=filtre?toutes.filter(function(e){return(e.desc||'').toLowerCase().includes(filtre)||(e.cli||'').toLowerCase().includes(filtre);}):toutes.slice(0,30);
  if(!filtrees.length){el.innerHTML='<div style="color:var(--text-faint);font-style:italic;font-size:11px;padding:8px">Aucune écriture trouvée.</div>';return;}
  el.innerHTML=filtrees.map(function(e){
    var axeId=AFFECTATIONS[e.num||e.id];
    var axe=AXES_ANALYTIQUES.find(function(a){return a.id==axeId;});
    return'<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:2px solid var(--border);font-size:11.5px"><div style="flex:1"><div style="font-weight:500">'+(e.num||'—')+'</div><div style="font-size:10.5px;color:var(--text-muted)">'+(e.desc||e.cli||'—')+' — '+(e.ttc||0).toLocaleString('fr-FR')+' FCFA</div></div>'+(axe?'<span class="badge bg-green" style="font-size:9px">['+axe.code+'] '+axe.lib+'</span>':'<select style="font-size:10px;padding:2px 5px" onchange="affecterEcriture(\''+( e.num||e.id)+'\',this.value)"><option value="">— Affecter —</option>'+AXES_ANALYTIQUES.map(function(a){return'<option value="'+a.id+'">['+a.code+'] '+a.lib+'</option>';}).join('')+'</select>')+'</div>';
  }).join('');
}
function affecterEcriture(numEc,axeId){
  if(!axeId)return;
  AFFECTATIONS[numEc]=axeId;saveV14();calculerAnalytique();filtrerEcrituresAnalytique();
}

// ── SIMULATEUR FISCAL "ET SI ?" ────────────────────────────
function adapterFormSimulateur(){
  var type=(document.getElementById('sim-type')||{}).value;
  var f=document.getElementById('sim-fields');if(!f)return;
  var templates={
    embauche:`<div class="fgrid fg2"><div class="fg"><label>Salaire brut mensuel (FCFA)</label><input type="number" id="sim-val1" placeholder="250000" oninput="previewSimulateur()"/></div><div class="fg"><label>Nombre d'employés</label><input type="number" id="sim-val2" value="1" min="1" oninput="previewSimulateur()"/></div></div>`,
    investissement:`<div class="fgrid fg2"><div class="fg"><label>Coût de l'équipement (FCFA)</label><input type="number" id="sim-val1" placeholder="0" oninput="previewSimulateur()"/></div><div class="fg"><label>Durée amortissement (ans)</label><input type="number" id="sim-val2" value="5" min="1" max="20" oninput="previewSimulateur()"/></div></div>`,
    dividendes:`<div class="fgrid fg2"><div class="fg"><label>Montant à distribuer (FCFA)</label><input type="number" id="sim-val1" placeholder="0" oninput="previewSimulateur()"/></div><div class="fg"><label>Type actionnaire</label><select id="sim-val3"><option value="physique">Personne physique (IRVM 3%)</option><option value="morale">Personne morale (IRVM 7%)</option></select></div></div>`,
    credit:`<div class="fgrid fg2"><div class="fg"><label>Capital emprunté (FCFA)</label><input type="number" id="sim-val1" placeholder="0" oninput="previewSimulateur()"/></div><div class="fg"><label>Taux annuel (%)</label><input type="number" id="sim-val2" value="12" step="0.1" oninput="previewSimulateur()"/></div></div>`,
    loyer:`<div class="fgrid fg2"><div class="fg"><label>Loyer mensuel (FCFA)</label><input type="number" id="sim-val1" placeholder="0" oninput="previewSimulateur()"/></div><div class="fg"><label>Durée du bail (mois)</label><input type="number" id="sim-val2" value="12" min="1" oninput="previewSimulateur()"/></div></div>`
  };
  f.innerHTML=templates[type]||'';
}
function previewSimulateur(){simulerImpactFiscal(true);}
async function simulerImpactFiscal(preview){
  var type=(document.getElementById('sim-type')||{}).value;
  var v1=parseFloat((document.getElementById('sim-val1')||{}).value)||0;
  var v2=parseFloat((document.getElementById('sim-val2')||{}).value)||0;
  var v3=(document.getElementById('sim-val3')||{}).value||'physique';
  if(!v1){return;}
  // Contexte fiscal actuel
  var isCalc=window._IS_CALCULE||{};
  var isActuel=isCalc.isTotal||0;
  var benActuel=isCalc.benImposableNet||0;
  var res={};
  if(type==='embauche'){
    var chargesAnnuelles=v1*v2*12*(1+0.175); // patronal 17,5%
    var reduction=Math.round(chargesAnnuelles*0.27);
    var nouvelIS=Math.max(0,Math.round((benActuel-chargesAnnuelles)*0.27));
    res={label:'Embauche '+v2+' employé(s) à '+v1.toLocaleString('fr-FR')+' FCFA/mois',cout:Math.round(chargesAnnuelles),reductionIS:isActuel-nouvelIS,nouvelIS:nouvelIS,net:chargesAnnuelles-( isActuel-nouvelIS)};
    document.getElementById('sim-result').innerHTML=`<div style="text-align:left"><div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Impact annuel estimé</div>${simKpi('Charge salariale annuelle',Math.round(chargesAnnuelles).toLocaleString('fr-FR')+' FCFA','red')}${simKpi('Économie IS (déductibilité)',( isActuel-nouvelIS).toLocaleString('fr-FR')+' FCFA','green')}${simKpi('Coût réel net pour l\'entreprise',Math.max(0,chargesAnnuelles-(isActuel-nouvelIS)).toLocaleString('fr-FR')+' FCFA','amber')}${simKpi('Nouvel IS estimé',nouvelIS.toLocaleString('fr-FR')+' FCFA','blue')}</div>`;
  } else if(type==='investissement'){
    var dotation=Math.round(v1/v2);
    var reductionIS=Math.round(dotation*0.27);
    res={label:'Achat équipement '+v1.toLocaleString('fr-FR')+' FCFA amorti sur '+v2+' ans',dotation:dotation,reductionIS:reductionIS};
    document.getElementById('sim-result').innerHTML=`<div style="text-align:left">${simKpi('Dotation aux amortissements/an',dotation.toLocaleString('fr-FR')+' FCFA','blue')}${simKpi('Économie IS par an',reductionIS.toLocaleString('fr-FR')+' FCFA','green')}${simKpi('Économie IS totale sur '+v2+' ans',(reductionIS*v2).toLocaleString('fr-FR')+' FCFA','green')}${simKpi('Coût net après économies fiscales',Math.max(0,v1-reductionIS*v2).toLocaleString('fr-FR')+' FCFA','amber')}</div>`;
  } else if(type==='dividendes'){
    var irvm=v3==='physique'?Math.round(v1*0.03):Math.round(v1*0.07);
    var net=v1-irvm;
    res={label:'Distribution '+v1.toLocaleString('fr-FR')+' FCFA ('+v3+')',irvm:irvm,net:net};
    document.getElementById('sim-result').innerHTML=`<div style="text-align:left">${simKpi('Dividendes bruts',v1.toLocaleString('fr-FR')+' FCFA','blue')}${simKpi('IRVM '+(v3==='physique'?'3% (pers. phys.)':'7% (pers. morale)'),irvm.toLocaleString('fr-FR')+' FCFA','red')}${simKpi('Dividendes nets reçus',net.toLocaleString('fr-FR')+' FCFA','green')}</div>`;
  } else if(type==='credit'){
    var r=v2/100/12;var intTotaux=v1*v2/100*v2/12;
    var dedIS=Math.round(intTotaux*0.27);
    res={label:'Emprunt '+v1.toLocaleString('fr-FR')+' FCFA à '+v2+'%',intTotaux:Math.round(intTotaux),dedIS:dedIS};
    document.getElementById('sim-result').innerHTML=`<div style="text-align:left">${simKpi('Intérêts totaux estimés',Math.round(intTotaux).toLocaleString('fr-FR')+' FCFA','red')}${simKpi('Économie IS (intérêts déductibles)',dedIS.toLocaleString('fr-FR')+' FCFA','green')}${simKpi('Coût financier net réel',(Math.round(intTotaux)-dedIS).toLocaleString('fr-FR')+' FCFA','amber')}</div>`;
  } else if(type==='loyer'){
    var loyerAn=v1*v2;
    var redIS=Math.round(loyerAn*0.27);
    document.getElementById('sim-result').innerHTML=`<div style="text-align:left">${simKpi('Loyer annuel total',loyerAn.toLocaleString('fr-FR')+' FCFA','blue')}${simKpi('Économie IS (loyer déductible)',redIS.toLocaleString('fr-FR')+' FCFA','green')}${simKpi('Coût net réel du loyer',(loyerAn-redIS).toLocaleString('fr-FR')+' FCFA','amber')}</div>`;
  }
  // Conseil IA (pas en preview)
  if(!preview && res.label){
    document.getElementById('sim-ia-conseil').style.display='block';
    document.getElementById('sim-ia-body').innerHTML='<div style="color:var(--text-muted);font-size:12px">'+ico('clock')+' Analyse IA en cours...</div>';
    try{
      var isCalcT=window._IS_CALCULE||{};
      var prompt='Tu es un expert fiscaliste OHADA spécialisé au Togo. Analyse l\'impact de cette décision et donne 3 conseils concrets en 4-5 phrases maximum.\n\nEntreprise : '+((document.querySelector('.logo-sub')||{}).textContent||'Mon Entreprise')+'\nIS actuel : '+(isCalcT.isTotal||0).toLocaleString('fr-FR')+' FCFA\nBénéfice imposable : '+(isCalcT.benImposableNet||0).toLocaleString('fr-FR')+' FCFA\n\nDécision simulée : '+res.label+'\nRésultat calculé : '+JSON.stringify(res,null,2)+'\n\nContexte fiscal Togo : IS 27%, IRVM 3%/7%, CNSS 17,5% patronal, barème IR progressif.';
      var resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,messages:[{role:'user',content:prompt}]})});
      var data=await resp.json();
      var txt=((data.content && data.content[0]) ? data.content[0].text : '')||'Analyse non disponible.';
      document.getElementById('sim-ia-body').innerHTML='<div style="font-size:12.5px;line-height:1.8;color:var(--text)">'+txt.replace(/\n/g,'<br>')+'</div>';
    }catch(e){document.getElementById('sim-ia-body').innerHTML='<div style="color:var(--red)">Erreur de connexion IA.</div>';}
  }
}
function simKpi(label,val,cls){
  return'<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:2px solid var(--border)"><span style="font-size:11.5px;color:var(--text-muted)">'+label+'</span><strong style="font-family:\'Archivo\',sans-serif;font-size:12px;color:var(--'+cls+')">'+val+'</strong></div>';
}

// ── MULTI-LIGNES FACTURE ────────────────────────────────────
var SECTEUR_ACTIF='commerce';
ML_LIGNES=[];
function setSecteur(s){
  SECTEUR_ACTIF=s;
  document.querySelectorAll('.sect-btn').forEach(function(b){b.classList.remove('active-sect');});
  var btn=document.getElementById('sect-'+s);if(btn)btn.classList.add('active-sect');
  // Show/hide secteur-specific fields
  ['hotel','service','industrie','event'].forEach(function(x){
    var el=document.getElementById('sect-'+x+'-fields');
    if(el)el.style.display=(s===x)?'block':'none';
  });
  // Update title
  var titles={commerce:'Articles — Facture multi-lignes',service:'Lignes de prestation',hotel:'Séjour & services hôteliers',industrie:'Produits finis / Production',event:'Prestations événementielles'};
  var t=document.getElementById('ml-card-title');if(t)t.textContent=titles[s]||titles.commerce;
  // Init lignes vides si vide
  if(!ML_LIGNES.length)ajouterLigneML();
}
function ajouterLigneML(data){
  var id='ml-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);
  var ligne=data||{id:id,desc:'',qty:1,unite:'unité',pu:0,tva:18,ht:0};
  if(!data)ligne.id=id;
  ML_LIGNES.push(ligne);
  renderMLTable();
}
function renderMLTable(){
  var tbody=document.getElementById('ml-tbody');if(!tbody)return;
  var stocks=typeof STOCKS!=='undefined'?Object.keys(STOCKS):[];
  tbody.innerHTML=ML_LIGNES.map(function(l,i){
    return'<tr class="ml-row" id="mlr-'+l.id+'">'
      +'<td style="padding:5px 6px;min-width:160px"><input type="text" value="'+( l.desc||'')+'" list="ml-stock-list-'+i+'" placeholder="Désignation..." onchange="majLigneML(\''+l.id+'\',\'desc\',this.value)" style="width:100%"/><datalist id="ml-stock-list-'+i+'">'+stocks.map(function(s){return'<option value="'+s+'">';}).join('')+'</datalist></td>'
      +'<td style="padding:5px 6px;width:70px"><input type="number" value="'+(l.qty||1)+'" min="0" step="0.01" onchange="majLigneML(\''+l.id+'\',\'qty\',parseFloat(this.value)||0)" style="width:100%;text-align:right"/></td>'
      +'<td style="padding:5px 6px;width:80px"><select onchange="majLigneML(\''+l.id+'\',\'unite\',this.value)" style="width:100%"><option '+(l.unite==='unité'?'selected':'')+'>unité</option><option '+(l.unite==='kg'?'selected':'')+'>kg</option><option '+(l.unite==='litre'?'selected':'')+'>litre</option><option '+(l.unite==='mètre'?'selected':'')+'>mètre</option><option '+(l.unite==='boîte'?'selected':'')+'>boîte</option><option '+(l.unite==='lot'?'selected':'')+'>lot</option><option '+(l.unite==='heure'?'selected':'')+'>heure</option><option '+(l.unite==='nuit'?'selected':'')+'>nuit</option><option '+(l.unite==='couvert'?'selected':'')+'>couvert</option></select></td>'
      +'<td style="padding:5px 6px;width:110px"><input type="number" value="'+(l.pu||0)+'" min="0" onchange="majLigneML(\''+l.id+'\',\'pu\',parseFloat(this.value)||0)" style="width:100%;text-align:right"/></td>'
      +'<td style="padding:5px 6px;width:65px"><input type="number" value="'+(l.tva||0)+'" min="0" max="100" step="0.5" onchange="majLigneML(\''+l.id+'\',\'tva\',parseFloat(this.value)||0)" style="width:100%;text-align:right"/></td>'
      +'<td style="padding:5px 6px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--green-dark);font-size:11.5px" id="mlht-'+l.id+'">'+(Math.round((l.qty||0)*(l.pu||0))).toLocaleString('fr-FR')+'</td>'
      +'<td style="padding:5px 6px;text-align:center"><button onclick="supprimerLigneML(\''+l.id+'\')" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:14px;padding:0 4px" title="Supprimer">×</button></td>'
      +'</tr>';
  }).join('');
  calcTotauxML();
}
function majLigneML(id,champ,val){
  var l=ML_LIGNES.find(function(x){return x.id===id;});
  if(!l)return;
  l[champ]=val;
  l.ht=Math.round((l.qty||0)*(l.pu||0));
  var htEl=document.getElementById('mlht-'+id);
  if(htEl)htEl.textContent=l.ht.toLocaleString('fr-FR');
  // Auto-fill from stock
  if(champ==='desc'&&typeof STOCKS!=='undefined'&&STOCKS[val]){
    l.pu=STOCKS[val].pu||STOCKS[val].cmup||0;
    renderMLTable();return;
  }
  calcTotauxML();
}
function supprimerLigneML(id){
  ML_LIGNES=ML_LIGNES.filter(function(l){return l.id!==id;});
  renderMLTable();
}
function calcTotauxML(){
  var totalHT=0,totalTVA=0;
  ML_LIGNES.forEach(function(l){
    var ht=Math.round((l.qty||0)*(l.pu||0));
    var tva=Math.round(ht*(l.tva||0)/100);
    totalHT+=ht;totalTVA+=tva;
  });
  var elHT=document.getElementById('ml-total-ht');var elTVA=document.getElementById('ml-total-tva');var elTTC=document.getElementById('ml-total-ttc');
  if(elHT)elHT.textContent=totalHT.toLocaleString('fr-FR');
  if(elTVA)elTVA.textContent=totalTVA.toLocaleString('fr-FR');
  if(elTTC)elTTC.textContent=(totalHT+totalTVA).toLocaleString('fr-FR');
  // Sync to main form
  var fHT=document.getElementById('f-ht');if(fHT&&ML_LIGNES.length)fHT.value=totalHT;
  if(typeof calcM==='function')calcM();
}
// Hotel fields
function calcNuits(){
  var a=(document.getElementById('h-arrivee')||{}).value;
  var d=(document.getElementById('h-depart')||{}).value;
  if(!a||!d)return;
  var diff=Math.round((new Date(d)-new Date(a))/(1000*60*60*24));
  var el=document.getElementById('h-nuits');if(el)el.value=diff>0?diff+' nuit(s)':'—';
  if(diff>0&&ML_LIGNES.length){ML_LIGNES[0].qty=diff;ML_LIGNES[0].unite='nuit';renderMLTable();}
}
function calcPrestation(){
  var taux=parseFloat((document.getElementById('s-tauxh')||{}).value)||0;
  var heures=parseFloat((document.getElementById('s-heures')||{}).value)||0;
  var total=Math.round(taux*heures);
  var el=document.getElementById('s-total-display');if(el)el.textContent=total>0?'Total prestation : '+total.toLocaleString('fr-FR')+' FCFA HT':'';
  if(total>0&&ML_LIGNES.length){ML_LIGNES[0].pu=taux;ML_LIGNES[0].qty=heures;ML_LIGNES[0].unite='heure';renderMLTable();}
}
function calcEvent(){
  var cov=parseFloat((document.getElementById('ev-couverts')||{}).value)||0;
  var prix=parseFloat((document.getElementById('ev-prix-couvert')||{}).value)||0;
  var total=Math.round(cov*prix);
  var el=document.getElementById('ev-total-display');if(el)el.textContent=total>0?cov+' couverts × '+prix.toLocaleString('fr-FR')+' FCFA = '+total.toLocaleString('fr-FR')+' FCFA HT':'';
  if(total>0){
    var type=(document.getElementById('ev-type')||{}).value||'Événement';
    if(ML_LIGNES.length){ML_LIGNES[0].desc=type+' ('+cov+' couverts)';ML_LIGNES[0].pu=prix;ML_LIGNES[0].qty=cov;ML_LIGNES[0].unite='couvert';renderMLTable();}
  }
}
function calcMargeProd(){
  var cout=parseFloat((document.getElementById('ind-cout')||{}).value)||0;
  if(!cout)return;
  var totalVente=ML_LIGNES.reduce(function(a,l){return a+Math.round((l.qty||0)*(l.pu||0));},0);
  var totalCout=ML_LIGNES.reduce(function(a,l){return a+Math.round((l.qty||0)*cout);},0);
  var marge=totalVente-totalCout;
  var el=document.getElementById('ind-marge-display');
  if(el)el.textContent=totalVente>0?'Marge brute estimée : '+marge.toLocaleString('fr-FR')+' FCFA ('+(totalVente>0?Math.round(marge/totalVente*100):0)+'%)':'';
}

// ── MODULE PRODUCTION ──────────────────────────────────────
function ouvrirFormNomenclature(){document.getElementById('nom-form').style.display='block';}
var ingredientsTmp=[];
function ajouterIngredient(){
  var list=document.getElementById('nom-ingredients-list');if(!list)return;
  var stocks=typeof STOCKS!=='undefined'?Object.keys(STOCKS):[];
  var idx=ingredientsTmp.length;
  ingredientsTmp.push({ref:'',qty:0});
  var div=document.createElement('div');div.className='fgrid fg3';div.style.marginBottom='6px';
  div.innerHTML='<div class="fg sp2"><label>Matière première</label><select onchange="ingredientsTmp['+idx+'].ref=this.value" style="font-size:12px"><option value="">— Choisir —</option>'+stocks.map(function(s){return'<option value="'+s+'">'+s+'</option>';}).join('')+'</select></div><div class="fg"><label>Quantité consommée</label><input type="number" min="0" step="0.01" placeholder="0" onchange="ingredientsTmp['+idx+'].qty=parseFloat(this.value)||0" style="font-size:12px"/></div>';
  list.appendChild(div);
}
function sauverNomenclature(){
  var produit=(document.getElementById('nom-produit')||{}).value.trim();
  var unite=(document.getElementById('nom-unite')||{}).value.trim()||'unité';
  var qty=parseFloat((document.getElementById('nom-qty')||{}).value)||1;
  var mo=parseFloat((document.getElementById('nom-mo')||{}).value)||0;
  if(!produit){alert('Nom du produit obligatoire.');return;}
  NOMENCLATURES.push({id:Date.now(),produit:produit,unite:unite,qty:qty,mo:mo,ingredients:ingredientsTmp.filter(function(i){return i.ref&&i.qty>0;})});
  ingredientsTmp=[];
  saveV14();
  document.getElementById('nom-form').style.display='none';
  document.getElementById('nom-ingredients-list').innerHTML='';
  renderNomenclatures();
  // Update OF select
  var sel=document.getElementById('of-produit');if(sel){sel.innerHTML='<option value="">— Choisir —</option>';NOMENCLATURES.forEach(function(n,i){var o=document.createElement('option');o.value=i;o.textContent=n.produit+' (lot: '+n.qty+' '+n.unite+')';sel.appendChild(o);});}
}
function renderNomenclatures(){
  var el=document.getElementById('nom-list');if(!el)return;
  if(!NOMENCLATURES.length){el.innerHTML='<div style="color:var(--text-faint);font-style:italic;font-size:12px">Aucune nomenclature. Créez une fiche de fabrication.</div>';return;}
  el.innerHTML=NOMENCLATURES.map(function(n,i){
    var coutMP=n.ingredients.reduce(function(a,ing){
      var s=typeof STOCKS!=='undefined'&&STOCKS[ing.ref]?STOCKS[ing.ref]:{};
      return a+(s.cmup||s.pu||0)*ing.qty;
    },0);
    return'<div style="padding:7px 0;border-bottom:2px solid var(--border)"><div style="font-size:12px;font-weight:600">'+n.produit+'<span style="font-weight:400;color:var(--text-muted);font-size:10px;margin-left:6px">Lot: '+n.qty+' '+n.unite+'</span></div><div style="font-size:10.5px;color:var(--text-muted);margin-top:2px">MP: '+n.ingredients.map(function(x){return x.qty+' '+x.ref;}).join(', ')+(n.mo>0?' | MO: '+n.mo.toLocaleString('fr-FR')+' FCFA':'')+'</div><div style="font-size:10.5px;color:var(--amber);margin-top:1px">Coût de revient estimé : '+(coutMP+n.mo).toLocaleString('fr-FR')+' FCFA / lot</div></div>';
  }).join('');
}
function afficherCoutOF(){
  var idx=parseInt((document.getElementById('of-produit')||{}).value);
  var qty=parseFloat((document.getElementById('of-qty')||{}).value)||1;
  if(isNaN(idx)||!NOMENCLATURES[idx]){document.getElementById('of-preview').style.display='none';return;}
  var n=NOMENCLATURES[idx];
  var coutMP=n.ingredients.reduce(function(a,ing){
    var s=typeof STOCKS!=='undefined'&&STOCKS[ing.ref]?STOCKS[ing.ref]:{};
    return a+(s.cmup||s.pu||0)*ing.qty*qty;
  },0);
  var coutTotal=coutMP+(n.mo*qty);
  var el=document.getElementById('of-preview');
  el.style.display='block';
  el.innerHTML='<strong>'+qty+' lot(s) de '+n.produit+'</strong> — Matières consommées : '+n.ingredients.map(function(i){return(i.qty*qty)+' '+i.ref;}).join(', ')+'<br>Coût total estimé : <strong>'+Math.round(coutTotal).toLocaleString('fr-FR')+' FCFA</strong> (MP: '+Math.round(coutMP).toLocaleString('fr-FR')+' + MO: '+Math.round(n.mo*qty).toLocaleString('fr-FR')+')';
}
function lancerOrdreFabrication(){
  var idx=parseInt((document.getElementById('of-produit')||{}).value);
  var qty=parseFloat((document.getElementById('of-qty')||{}).value)||1;
  var date=(document.getElementById('of-date')||{}).value||new Date().toISOString().split('T')[0];
  if(isNaN(idx)||!NOMENCLATURES[idx]){alert('Choisissez un produit à fabriquer.');return;}
  var n=NOMENCLATURES[idx];
  var coutMP=0;
  // Déduire les MP du stock et calculer coût
  n.ingredients.forEach(function(ing){
    var s=typeof STOCKS!=='undefined'&&STOCKS[ing.ref]?STOCKS[ing.ref]:null;
    if(s){
      var pu=s.cmup||s.pu||0;
      var qConsomme=ing.qty*qty;
      coutMP+=pu*qConsomme;
      if(typeof mouvementStock==='function')mouvementStock(ing.ref,'achat',qConsomme,pu,date,'OF-'+Date.now());
      else if(s.qte!==undefined)s.qte=Math.max(0,(s.qte||0)-qConsomme);
    }
  });
  var coutTotal=coutMP+(n.mo*qty);
  var qtteProduite=n.qty*qty;
  // Ajouter produit fini au stock
  if(typeof STOCKS!=='undefined'){
    if(!STOCKS[n.produit])STOCKS[n.produit]={qte:0,cmup:0,pu:0,desc:n.produit};
    STOCKS[n.produit].qte=(STOCKS[n.produit].qte||0)+qtteProduite;
    STOCKS[n.produit].cmup=Math.round(coutTotal/qtteProduite);
  }
  // Écriture : D.35x / C.33x (transfert production)
  var ofNum='OF-'+date.replace(/-/g,'')+'-'+Date.now().toString().slice(-4);
  if(typeof EC!=='undefined'){
    EC.push({date:date,num:ofNum,cli:'Production',type:'achat',desc:'[OF] '+n.produit+' — '+qtteProduite+' '+n.unite+' produit(es)',ht:Math.round(coutTotal),escp:0,rrr:0,tr:0,port:0,avance:0,pay:'credit',stat:'payee',qty:qtteProduite,unite:n.unite,produit:n.produit,cp:Math.round(coutTotal),tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',cptD:'351',cptC:'331',debit:Math.round(coutTotal),credit:Math.round(coutTotal),isTVA:false});
  }
  OF_HISTORY.push({num:ofNum,date:date,produit:n.produit,qty:qtteProduite,unite:n.unite,cout:Math.round(coutTotal),cmup:Math.round(coutTotal/qtteProduite)});
  saveV14();
  if(typeof sauvegarderAuto==='function')sauvegarderAuto();
  renderOFHistory();renderNomenclatures();
  if(typeof ajouterNotif==='function')ajouterNotif('info','OF lancé — '+n.produit,qtteProduite+' '+n.unite+' produits pour '+Math.round(coutTotal).toLocaleString('fr-FR')+' FCFA. Coût unitaire : '+Math.round(coutTotal/qtteProduite).toLocaleString('fr-FR')+' FCFA.');
  alert('Production lancée ! '+qtteProduite+' '+n.unite+' de "'+n.produit+'" ajoutés au stock produits finis (35x). Coût total : '+Math.round(coutTotal).toLocaleString('fr-FR')+' FCFA.');
}
function renderOFHistory(){
  var el=document.getElementById('of-history');if(!el)return;
  if(!OF_HISTORY.length)return;
  el.innerHTML='<div class="card"><div class="card-header"><span class="card-title">Historique des ordres de fabrication</span></div><div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:11.5px"><thead><tr style="background:var(--bg)"><th style="padding:6px 8px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">N° OF</th><th style="padding:6px 8px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Date</th><th style="padding:6px 8px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Produit</th><th style="padding:6px 8px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Qtté</th><th style="padding:6px 8px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Coût total</th><th style="padding:6px 8px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Coût unitaire</th></tr></thead><tbody>'+OF_HISTORY.slice().reverse().map(function(o){return'<tr style="border-bottom:2px solid var(--border)"><td style="padding:6px 8px;font-family:\'Archivo\',sans-serif;font-size:10.5px">'+o.num+'</td><td style="padding:6px 8px;font-size:11px">'+o.date.split('-').reverse().join('/')+'</td><td style="padding:6px 8px;font-weight:500">'+o.produit+'</td><td style="padding:6px 8px;text-align:right">'+o.qty+' '+o.unite+'</td><td style="padding:6px 8px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--amber)">'+o.cout.toLocaleString('fr-FR')+' FCFA</td><td style="padding:6px 8px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--blue)">'+o.cmup.toLocaleString('fr-FR')+' FCFA</td></tr>';}).join('')+'</tbody></table></div></div>';
}

// ── MODULE CAISSE / PDV ────────────────────────────────────
(function(){
  var dateLabel=document.getElementById('caisse-date-label');
  if(dateLabel)dateLabel.textContent=new Date().toLocaleDateString('fr-FR');
  // Populate products
  var dl=document.getElementById('caisse-produits-list');
  if(dl&&typeof STOCKS!=='undefined'){dl.innerHTML='';Object.keys(STOCKS).forEach(function(s){var o=document.createElement('option');o.value=s;dl.appendChild(o);});}
})();
function filterCaisseProd(){} // handled by datalist
function ajouterAuPanier(){
  var art=(document.getElementById('caisse-search')||{}).value.trim();
  var qty=parseFloat((document.getElementById('caisse-qty')||{}).value)||1;
  if(!art)return;
  var pu=0;
  if(typeof STOCKS!=='undefined'&&STOCKS[art])pu=STOCKS[art].pu||STOCKS[art].cmup||0;
  var exist=PANIER.find(function(p){return p.art===art;});
  if(exist){exist.qty+=qty;exist.total=Math.round(exist.qty*exist.pu);}
  else PANIER.push({art:art,qty:qty,pu:pu,tva:18,total:Math.round(qty*pu)});
  document.getElementById('caisse-search').value='';
  document.getElementById('caisse-qty').value='1';
  renderPanier();
}
function renderPanier(){
  var el=document.getElementById('panier-table');if(!el)return;
  if(!PANIER.length){el.innerHTML='<div style="text-align:center;color:var(--text-faint);padding:20px;font-style:italic">Panier vide</div>';document.getElementById('panier-total').textContent='0 FCFA';return;}
  var total=PANIER.reduce(function(a,p){return a+(p.total||0);},0);
  el.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:11.5px"><thead><tr style="background:var(--bg)"><th style="padding:5px 8px;border-bottom:2px solid var(--border);text-align:left;font-size:10px;color:var(--text-muted)">Article</th><th style="padding:5px 8px;border-bottom:2px solid var(--border);text-align:right;font-size:10px;color:var(--text-muted)">Qté</th><th style="padding:5px 8px;border-bottom:2px solid var(--border);text-align:right;font-size:10px;color:var(--text-muted)">P.U.</th><th style="padding:5px 8px;border-bottom:2px solid var(--border);text-align:right;font-size:10px;color:var(--text-muted)">Total</th><th style="padding:5px 8px;border-bottom:2px solid var(--border);width:24px"></th></tr></thead><tbody>'+PANIER.map(function(p,i){return'<tr style="border-bottom:2px solid var(--border)"><td style="padding:5px 8px">'+p.art+'</td><td style="padding:5px 8px;text-align:right"><input type="number" value="'+p.qty+'" min="0.01" step="0.01" style="width:55px;text-align:right;font-size:11px" onchange="PANIER['+i+'].qty=parseFloat(this.value)||1;PANIER['+i+'].total=Math.round(PANIER['+i+'].qty*PANIER['+i+'].pu);renderPanier()"/></td><td style="padding:5px 8px;text-align:right;font-family:\'Archivo\',sans-serif">'+( p.pu||0).toLocaleString('fr-FR')+'</td><td style="padding:5px 8px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:600">'+( p.total||0).toLocaleString('fr-FR')+'</td><td style="padding:5px 8px;text-align:center"><button onclick="PANIER.splice('+i+',1);renderPanier()" style="background:none;border:none;cursor:pointer;color:var(--red)">×</button></td></tr>';}).join('')+'</tbody></table>';
  document.getElementById('panier-total').textContent=(total*(1.18)).toLocaleString('fr-FR')+' FCFA TTC';
}
function viderPanier(){PANIER=[];renderPanier();}
function encaisserPanier(mode){
  if(!PANIER.length){alert('Panier vide.');return;}
  var total=PANIER.reduce(function(a,p){return a+(p.total||0);},0);
  var ttc=Math.round(total*1.18);
  var modeLabels={espece:'Espèces',flooz:'Flooz',tmoney:'T-Money',banque:'Banque/Carte'};
  var vente={heure:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),articles:PANIER.slice(),total:total,ttc:ttc,mode:mode};
  VENTES_CAISSE.push(vente);
  PANIER.forEach(function(p){if(typeof mouvementStock==='function')mouvementStock(p.art,'vente',p.qty,p.pu||0,new Date().toISOString().split('T')[0],'CAISSE-'+Date.now());});
  viderPanier();
  renderZCaisse();
  saveV14();
  if(typeof ajouterNotif==='function')ajouterNotif('info','Vente caisse — '+modeLabels[mode],ttc.toLocaleString('fr-FR')+' FCFA TTC encaissés');
}
function renderZCaisse(){
  var el=document.getElementById('z-caisse-body');if(!el)return;
  if(!VENTES_CAISSE.length){el.innerHTML='<div style="text-align:center;color:var(--text-faint);padding:20px;font-style:italic">Aucune vente enregistrée aujourd\'hui.</div>';return;}
  var totals={espece:0,flooz:0,tmoney:0,banque:0};
  var grandTotal=0;
  VENTES_CAISSE.forEach(function(v){totals[v.mode]=(totals[v.mode]||0)+v.ttc;grandTotal+=v.ttc;});
  var html='<div style="font-size:11.5px;margin-bottom:8px"><div style="font-weight:600;color:var(--text-muted);font-size:10px;text-transform:uppercase;margin-bottom:6px">Ventilation par mode</div>';
  var modeLabels={espece:ico('coin')+' Espèces',flooz:'Flooz',tmoney:'T-Money',banque:ico('card')+' Banque'};
  Object.keys(totals).forEach(function(m){if(totals[m]>0)html+='<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:2px solid var(--border)"><span>'+modeLabels[m]+'</span><span style="font-family:\'Archivo\',sans-serif;font-weight:600">'+totals[m].toLocaleString('fr-FR')+' FCFA</span></div>';});
  html+='<div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:13px"><span>TOTAL Z</span><span style="font-family:\'Archivo\',sans-serif;color:var(--green-dark)">'+grandTotal.toLocaleString('fr-FR')+' FCFA</span></div>';
  html+='<div style="font-size:10.5px;color:var(--text-muted)">'+VENTES_CAISSE.length+' vente(s) enregistrée(s)</div></div>';
  el.innerHTML=html;
}
function clotureZCaisse(){
  if(!VENTES_CAISSE.length){alert('Aucune vente à clôturer.');return;}
  var date=new Date().toISOString().split('T')[0];
  var totals={espece:0,flooz:0,tmoney:0,banque:0};
  var grandTotal=0;
  VENTES_CAISSE.forEach(function(v){totals[v.mode]=(totals[v.mode]||0)+v.ttc;grandTotal+=v.ttc;});
  var cptPay={espece:'571',flooz:'5215',tmoney:'5216',banque:'521'};
  if(typeof EC!=='undefined'){
    Object.keys(totals).forEach(function(m){
      if(totals[m]<=0)return;
      EC.push({date:date,num:'Z-'+date.replace(/-/g,'')+'-'+m,cli:'Z de caisse',type:'vente',desc:'[Z Caisse] Ventes du '+new Date().toLocaleDateString('fr-FR')+' — '+m,ht:Math.round(totals[m]/1.18),escp:0,rrr:0,tr:0,port:0,avance:0,pay:m,stat:'payee',qty:1,unite:'',produit:'',cp:0,tvaType:'18v',tvaTaux:18,tvaCpt:'4431',avoir:false,echeance:'',cptD:cptPay[m]||'571',cptC:'701',debit:totals[m],credit:totals[m],isTVA:false});
    });
    logAudit('creation','Z-'+date,'—',grandTotal.toLocaleString('fr-FR')+' FCFA TTC','Z de caisse du '+new Date().toLocaleDateString('fr-FR'));
  }
  VENTES_CAISSE=[];
  saveV14();
  if(typeof sauvegarderAuto==='function')sauvegarderAuto();
  if(typeof renderJournal==='function')renderJournal();
  renderZCaisse();
  if(typeof ajouterNotif==='function')ajouterNotif('info','Z de caisse clôturé',grandTotal.toLocaleString('fr-FR')+' FCFA comptabilisés en journée du '+new Date().toLocaleDateString('fr-FR'));
  alert('Z de caisse clôturé. '+grandTotal.toLocaleString('fr-FR')+' FCFA comptabilisés dans le journal.');
}

// ── GO() PATCH v14 ─────────────────────────────────────────
(function(){
  var _old=window.go;
  window.go=function(id,el){
    var v14=['emprunts','analytique','audit','simulateur','production','caisse'];
    if(v14.indexOf(id)>-1){
      document.querySelectorAll('.pane').forEach(function(p){p.classList.remove('active');});
      document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
      var pane=document.getElementById('pane-'+id);if(pane)pane.classList.add('active');
      if(el)el.classList.add('active');
      var titles={emprunts:'Emprunts bancaires',analytique:'Comptabilité analytique',audit:'Piste d\'audit',simulateur:'Simulateur fiscal',production:'Module Production',caisse:'Caisse / Point de Vente'};
      var pt=document.getElementById('page-title');if(pt)pt.textContent=titles[id]||id;
      if(id==='emprunts'){renderEmprunts();}
      if(id==='analytique'){renderAxes();calculerAnalytique();}
      if(id==='audit'){renderAudit();}
      if(id==='simulateur'){adapterFormSimulateur();}
      if(id==='production'){renderNomenclatures();renderOFHistory();}
      if(id==='caisse'){renderZCaisse();}
      return;
    }
    _old(id,el);
  };
});

// ── NAV ITEMS v14 — désactivé (remplacé par accordéon v15) ──

// ── INIT v14 ───────────────────────────────────────────────
(function(){
  var footer=document.getElementById('sidebar-footer');
  if(footer)footer.textContent='GEST Africa v14 — OHADA Togo';
  document.title='GEST Africa v14 — OHADA Togo';
  // Init multi-lignes
  if(typeof setSecteur==='function')setSecteur('commerce');
  else{ajouterLigneML();ajouterLigneML();}
  // Ajouter 2 lignes par défaut
  if(ML_LIGNES.length===0){ajouterLigneML();ajouterLigneML();}
  // Update sidebar compte pour flooz/tmoney
  var T=window._go14_titles||{};
  T.emprunts='Emprunts bancaires';T.analytique='Comptabilité analytique';T.audit='Piste d\'audit';T.simulateur='Simulateur fiscal';T.production='Module Production';T.caisse='Caisse / Point de Vente';
  // Patch valider() pour log audit
  var origVal=window.valider;
  if(origVal&&!origVal._v14patched){
    window.valider=function(){
      origVal.apply(this,arguments);
      var last=typeof EC!=='undefined'?EC[EC.length-1]:null;
      if(last)logAudit('creation',last.num||'—','—',(last.ttc||0).toLocaleString('fr-FR')+' FCFA TTC',last.desc||last.cli||'');
    };
    window.valider._v14patched=true;
  }
  // Patch solde for MM
  var scEl=document.getElementById('sc-banque');
  if(!scEl){
    setTimeout(function(){
      var cont=document.getElementById('pane-solde');
      if(cont&&!document.getElementById('sc-flooz')){
        var mmDiv=document.createElement('div');mmDiv.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px';
        mmDiv.innerHTML='<div style="background:var(--blue-light);border:2px solid var(--blue-border);border-radius:var(--radius);padding:12px;text-align:center"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Flooz (5215)</div><div style="font-size:20px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--blue)" id="sc-flooz">0 FCFA</div></div><div style="background:var(--purple-light,#f3f0fe);border:2px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">T-Money (5216)</div><div style="font-size:20px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--purple)" id="sc-tmoney">0 FCFA</div></div>';
        var firstCard=cont.querySelector('.card');if(firstCard)firstCard.after(mmDiv);
        // Patch renderSolde
        var origRS=window.renderSolde;
        if(origRS){window.renderSolde=function(){origRS.apply(this,arguments);var f=0,t=0;if(typeof EC!=='undefined')EC.concat(REGL||[]).forEach(function(e){if(e.pay==='flooz'){f+=(e.credit||0)-(e.debit||0);}if(e.pay==='tmoney'){t+=(e.credit||0)-(e.debit||0);}});var sf=document.getElementById('sc-flooz');var st=document.getElementById('sc-tmoney');if(sf)sf.textContent=(typeof fmt==='function'?fmt(f):f.toLocaleString('fr-FR'))+' FCFA';if(st)st.textContent=(typeof fmt==='function'?fmt(t):t.toLocaleString('fr-FR'))+' FCFA';};} 
      }
    },1200);
  }
})();
