// v17: official TFT (SYSCOHADA), liasse fiscale DGI, notes annexes - extracted from ComptaIA_Pro_original.html lines 8262-8867
// ═══════════════════════════════════════════════════════════════
// ComptaIA v17 — TFT OFFICIEL + LIASSE FISCALE + ANNEXES
// ═══════════════════════════════════════════════════════════════

// ── DONNÉES PERSISTANTES ANNEXES ───────────────────────────────
var ENGAGEMENTS = JSON.parse(localStorage.getItem('v17_engagements')||'[]');
var EVENEMENTS_POST = JSON.parse(localStorage.getItem('v17_evenements')||'[]');
function saveV17(){ try{ localStorage.setItem('v17_engagements',JSON.stringify(ENGAGEMENTS)); localStorage.setItem('v17_evenements',JSON.stringify(EVENEMENTS_POST)); }catch(e){} }

// ── GO() PATCH v17 ──────────────────────────────────────────────
(function(){
  var _old = window.go;
  window.go = function(id, el){
    var v17 = ['liasse','annexes'];
    if(v17.indexOf(id) > -1){
      document.querySelectorAll('.pane').forEach(function(p){p.classList.remove('active');});
      document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
      var pane = document.getElementById('pane-'+id);
      if(pane) pane.classList.add('active');
      if(el) el.classList.add('active');
      var pt = document.getElementById('page-title');
      if(pt) pt.textContent = id==='liasse'?'📑 Liasse fiscale DGI':'📝 Notes annexes SYSCOHADA';
      if(id==='liasse') genererLiasse();
      if(id==='annexes'){ genererAnnexes(); renderEngagements(); renderEvenements(); }
      return;
    }
    _old(id, el);
  };
  if(window.GRP_MAP){ window.GRP_MAP['liasse']='fiscal'; window.GRP_MAP['annexes']='compta'; }
})();

// Adopt panes
(function(){
  var content = document.querySelector('.content');
  ['pane-liasse','pane-annexes'].forEach(function(id){
    var el = document.getElementById(id);
    if(el && content && el.parentElement !== content) content.appendChild(el);
  });
})();

// ═══════════════════════════════════════════════════════════════
// TFT OFFICIEL — REMPLACEMENT COMPLET
// ═══════════════════════════════════════════════════════════════
window.calculerTFT = function(){
  var el = document.getElementById('tft-content'); if(!el) return;
  if(typeof EC === 'undefined'){ el.innerHTML='<div style="color:var(--text-faint);padding:24px;text-align:center">Aucune donnée comptable.</div>'; return; }

  var an = typeof EXERCICE !== 'undefined' ? EXERCICE.annee : new Date().getFullYear();
  var label = document.getElementById('tft-exercice-label');
  if(label) label.textContent = 'Exercice ' + an;

  var ecAll = EC.concat(typeof REGL !== 'undefined' ? REGL : []);

  // ── Calcul du résultat net ──
  var produits = 0, charges = 0;
  ecAll.forEach(function(e){
    if(e.cptC && e.cptC.charAt(0)==='7' && !e.isTVA) produits += (e.credit||0);
    if(e.cptD && e.cptD.charAt(0)==='6' && !e.isTVA) charges  += (e.debit||0);
  });
  var resultatNet = produits - charges;

  // ── Retraitements exploitation (méthode indirecte) ──
  var dotAmort = 0, varCreances = 0, varStocks = 0, varDettes = 0, varAutres = 0;
  ecAll.forEach(function(e){
    var d = e.cptD||'', c = e.cptC||'', mt = e.debit||0;
    // Dotations amortissements (non-cash) : D.68x / C.28x
    if(d.slice(0,2)==='68' && c.slice(0,2)==='28') dotAmort += mt;
    // Dotations provisions : D.69x / C.49x
    if(d.charAt(0)==='6' && d.slice(0,2)==='69') dotAmort += mt;
    // Variation créances clients : cpte 41x
    if(c.slice(0,2)==='41') varCreances -= mt; // augmentation créances = emploi
    if(d.slice(0,2)==='41') varCreances += mt; // diminution créances = ressource
    // Variation stocks : cpte 3x
    if(d.charAt(0)==='3') varStocks -= mt;
    if(c.charAt(0)==='3') varStocks += mt;
    // Variation dettes fournisseurs : 40x
    if(c.slice(0,2)==='40') varDettes += mt;
    if(d.slice(0,2)==='40') varDettes -= mt;
  });

  var fluxExploit = resultatNet + dotAmort + varCreances + varStocks + varDettes;

  // ── Flux investissement ──
  var acqImmo = 0, cessImmo = 0;
  ecAll.forEach(function(e){
    var d = e.cptD||'', c = e.cptC||'', mt = e.debit||0;
    if(d.charAt(0)==='2' && d.slice(0,2)!=='28') acqImmo  += mt; // Acquisition immobilisation
    if(c.charAt(0)==='2' && c.slice(0,2)!=='28') cessImmo += mt; // Cession immobilisation
  });
  var fluxInvest = cessImmo - acqImmo;

  // ── Flux financement ──
  var empruntsEncaisses = 0, remboursements = 0, apportsCapital = 0, dividendes = 0;
  ecAll.forEach(function(e){
    var d = e.cptD||'', c = e.cptC||'', mt = e.debit||0;
    if(c.slice(0,2)==='16') empruntsEncaisses += mt;  // Nouveaux emprunts
    if(d.slice(0,2)==='16') remboursements    += mt;  // Remboursements emprunts
    if(c.slice(0,2)==='10') apportsCapital    += mt;  // Apports en capital
    if(d.slice(0,2)==='11' || d.slice(0,2)==='46') dividendes += mt; // Dividendes versés
  });
  var fluxFinanc = empruntsEncaisses - remboursements + apportsCapital - dividendes;

  // ── Trésorerie ouverture / clôture ──
  var soldes = typeof getSoldeCalcule === 'function' ? getSoldeCalcule() : {caisse:0, banque:0};
  var tresoOuv = (typeof SOLDES !== 'undefined' ? (SOLDES['521']||0)+(SOLDES['571']||0) : 0);
  var varTreso = fluxExploit + fluxInvest + fluxFinanc;
  var tresoCloture = soldes.caisse + soldes.banque;

  // ── Rendu HTML officiel ──
  function tftRow(label, val, indent, bold, style){
    var indStr = indent ? 'padding-left:'+(indent*16+12)+'px' : 'padding-left:12px';
    var fStyle = bold ? 'font-weight:700' : '';
    var cls = style || '';
    var color = val === null ? '' : (val >= 0 ? 'color:var(--green-dark)' : 'color:var(--red)');
    return '<div class="liasse-row '+cls+'">'
      +'<span style="'+indStr+';'+fStyle+'">'+label+'</span>'
      +'<span class="liasse-val" style="'+color+'">'+(val===null ? '' : (val>=0?'+':'')+Math.round(val).toLocaleString('fr-FR')+' FCFA')+'</span>'
      +'</div>';
  }

  var html = '<div class="card">'
    // ── Section A : Exploitation ──
    +'<div class="liasse-section-header">A — Flux de trésorerie liés aux activités opérationnelles (Exploitation)</div>'
    +tftRow('Résultat net de l\'exercice', resultatNet, 0, true)
    +'<div style="padding:4px 12px;font-size:10px;color:var(--text-faint);font-style:italic">Retraitements pour éléments sans impact trésorerie :</div>'
    +tftRow('+ Dotations aux amortissements et provisions', dotAmort, 1, false)
    +tftRow('Variation des créances clients et comptes rattachés', varCreances, 1, false)
    +tftRow('Variation des stocks', varStocks, 1, false)
    +tftRow('Variation des dettes fournisseurs et comptes rattachés', varDettes, 1, false)
    +(varAutres ? tftRow('Autres variations du besoin en fonds de roulement', varAutres, 1) : '')
    +tftRow('FLUX NET DE TRÉSORERIE — EXPLOITATION (A)', fluxExploit, 0, true, 'liasse-row-subtotal')

    // ── Section B : Investissement ──
    +'<div class="liasse-section-header" style="margin-top:2px">B — Flux de trésorerie liés aux activités d\'investissement</div>'
    +tftRow('Acquisitions d\'immobilisations corporelles et incorporelles', -acqImmo, 1)
    +tftRow('Produits de cessions d\'immobilisations', cessImmo, 1)
    +tftRow('FLUX NET DE TRÉSORERIE — INVESTISSEMENT (B)', fluxInvest, 0, true, 'liasse-row-subtotal')

    // ── Section C : Financement ──
    +'<div class="liasse-section-header" style="margin-top:2px">C — Flux de trésorerie liés aux activités de financement</div>'
    +tftRow('Augmentations de capital en numéraire', apportsCapital, 1)
    +tftRow('Nouveaux emprunts contractés', empruntsEncaisses, 1)
    +tftRow('Remboursements d\'emprunts', -remboursements, 1)
    +tftRow('Dividendes versés', -dividendes, 1)
    +tftRow('FLUX NET DE TRÉSORERIE — FINANCEMENT (C)', fluxFinanc, 0, true, 'liasse-row-subtotal')

    // ── Récap ──
    +'<div class="liasse-section-header" style="margin-top:2px">D — Variation nette de trésorerie</div>'
    +tftRow('Variation de trésorerie nette (A + B + C)', varTreso, 0, true, 'liasse-row-total')
    +'<div class="liasse-section-header" style="margin-top:2px">E — Trésorerie</div>'
    +tftRow('Trésorerie à l\'ouverture de l\'exercice', tresoOuv, 0, false)
    +tftRow('Trésorerie à la clôture de l\'exercice', tresoCloture, 0, false)
    +tftRow('VARIATION CONSTATÉE (doit égaler D)', tresoCloture - tresoOuv, 0, true, 'liasse-row-total')
    +'</div>';

  // Vérification équilibre
  var diff = Math.abs(varTreso - (tresoCloture - tresoOuv));
  var equil = diff < 100;
  html += '<div style="margin-top:10px;padding:10px 14px;border-radius:var(--radius);font-size:11.5px;'
    +(equil ? 'background:var(--green-light);border:2px solid var(--green-border);color:var(--green-dark)' : 'background:var(--amber-light);border:2px solid var(--amber-border);color:var(--amber)')+';">'
    +(equil ? '✓ TFT équilibré — La variation calculée correspond à la variation réelle de trésorerie.'
            : '⚠ Écart de '+Math.round(diff).toLocaleString('fr-FR')+' FCFA — Vérifiez l\'exhaustivité des écritures (soldes d\'ouverture à paramétrer dans Trésorerie).')
    +'<span style="float:right;font-size:10px;color:var(--text-faint)">SYSCOHADA révisé 2017 — Art. 29 — Méthode indirecte — Exercice '+an+'</span>'
    +'</div>';

  el.innerHTML = html;

  // Stocker pour export
  window._TFT_DATA = { an:an, resultatNet:resultatNet, dotAmort:dotAmort, varCreances:varCreances, varStocks:varStocks, varDettes:varDettes, fluxExploit:fluxExploit, acqImmo:acqImmo, cessImmo:cessImmo, fluxInvest:fluxInvest, empruntsEncaisses:empruntsEncaisses, remboursements:remboursements, apportsCapital:apportsCapital, dividendes:dividendes, fluxFinanc:fluxFinanc, varTreso:varTreso, tresoOuv:tresoOuv, tresoCloture:tresoCloture };
};

window.exporterTFTPDF = function(){
  calculerTFT();
  var d = window._TFT_DATA; if(!d) return;
  var jsPDF_ = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if(!jsPDF_){ alert('PDF non disponible.'); return; }
  var p = typeof PROFIL_DATA !== 'undefined' ? PROFIL_DATA : {};
  var doc = new jsPDF_({unit:'mm', format:'a4'});
  var W=210, M=14, y=20;

  doc.setFillColor(13,31,26); doc.rect(0,0,W,28,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont('helvetica','bold');
  doc.text('TABLEAU DES FLUX DE TRÉSORERIE',M,11);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text((p.nom||'Mon Entreprise')+(p.ifu?' — IFU: '+p.ifu:''),M,18);
  doc.text('Exercice clos le 31/12/'+d.an,M,24);
  doc.text('SYSCOHADA révisé 2017 — Méthode indirecte',W-M,24,{align:'right'});
  doc.setTextColor(0,0,0); y=36;

  function row(label,val,bg,bold){
    if(y>272){doc.addPage();y=20;}
    if(bg){doc.setFillColor(bg[0],bg[1],bg[2]);doc.rect(M,y,W-2*M,7,'F');}
    doc.setFontSize(8.5); doc.setFont('helvetica', bold?'bold':'normal');
    doc.text(label,M+3,y+5);
    if(val!==null){
      var vs=(val>=0?'+':'')+Math.round(val).toLocaleString('fr-FR')+' FCFA';
      doc.text(vs,W-M-3,y+5,{align:'right'});
    }
    y+=7;
  }
  function header(txt){
    doc.setFillColor(29,158,117);doc.rect(M,y,W-2*M,7,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(8.5);doc.setFont('helvetica','bold');
    doc.text(txt,M+3,y+5);doc.setTextColor(0,0,0);y+=7;
  }

  header('A — Flux de trésorerie — Activités opérationnelles');
  row('Résultat net de l\'exercice',d.resultatNet,null,true);
  row('+ Dotations amortissements et provisions',d.dotAmort);
  row('Variation créances clients',d.varCreances);
  row('Variation stocks',d.varStocks);
  row('Variation dettes fournisseurs',d.varDettes);
  row('FLUX NET — EXPLOITATION (A)',d.fluxExploit,[240,249,244],true);
  y+=3;
  header('B — Flux de trésorerie — Activités d\'investissement');
  row('Acquisitions d\'immobilisations',-d.acqImmo);
  row('Cessions d\'immobilisations',d.cessImmo);
  row('FLUX NET — INVESTISSEMENT (B)',d.fluxInvest,[240,249,244],true);
  y+=3;
  header('C — Flux de trésorerie — Activités de financement');
  row('Augmentations de capital',d.apportsCapital);
  row('Nouveaux emprunts',d.empruntsEncaisses);
  row('Remboursements d\'emprunts',-d.remboursements);
  row('Dividendes versés',-d.dividendes);
  row('FLUX NET — FINANCEMENT (C)',d.fluxFinanc,[240,249,244],true);
  y+=5;
  doc.setFillColor(13,31,26);doc.rect(M,y,W-2*M,8,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');
  doc.text('VARIATION NETTE DE TRÉSORERIE (A+B+C)',M+3,y+5.5);
  doc.text((d.varTreso>=0?'+':'')+Math.round(d.varTreso).toLocaleString('fr-FR')+' FCFA',W-M-3,y+5.5,{align:'right'});
  doc.setTextColor(0,0,0);y+=14;
  row('Trésorerie à l\'ouverture',d.tresoOuv);
  row('Trésorerie à la clôture',d.tresoCloture);

  doc.save('TFT_SYSCOHADA_'+d.an+'.pdf');
};

window.exporterTFTCSV = function(){
  calculerTFT();
  var d = window._TFT_DATA; if(!d) return;
  var rows = [
    ['Section','Libellé','Montant FCFA'],
    ['A','Résultat net',d.resultatNet],
    ['A','Dotations amortissements',d.dotAmort],
    ['A','Variation créances',d.varCreances],
    ['A','Variation stocks',d.varStocks],
    ['A','Variation dettes fournisseurs',d.varDettes],
    ['A','FLUX NET EXPLOITATION',d.fluxExploit],
    ['B','Acquisitions immobilisations',-d.acqImmo],
    ['B','Cessions immobilisations',d.cessImmo],
    ['B','FLUX NET INVESTISSEMENT',d.fluxInvest],
    ['C','Apports en capital',d.apportsCapital],
    ['C','Nouveaux emprunts',d.empruntsEncaisses],
    ['C','Remboursements emprunts',-d.remboursements],
    ['C','Dividendes versés',-d.dividendes],
    ['C','FLUX NET FINANCEMENT',d.fluxFinanc],
    ['D','VARIATION NETTE',d.varTreso],
    ['E','Trésorerie ouverture',d.tresoOuv],
    ['E','Trésorerie clôture',d.tresoCloture],
  ];
  var csv = rows.map(function(r){return r.join(';');}).join('\n');
  var a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='TFT_'+d.an+'.csv';a.click();
};

// ═══════════════════════════════════════════════════════════════
// LIASSE FISCALE DGI TOGO
// ═══════════════════════════════════════════════════════════════
function showLiasseTab(tab){
  document.querySelectorAll('.liasse-section').forEach(function(s){s.style.display='none';});
  document.querySelectorAll('.liasse-tab').forEach(function(t){t.classList.remove('active-tab');});
  var el=document.getElementById('liasse-'+tab); if(el) el.style.display='block';
  var btn=document.getElementById('ltab-'+tab.replace('liasse-','').replace('-liasse','')); 
  // Map tab to button id
  var btnMap={'bic':'ltab-bic','tva-liasse':'ltab-tva','salaires':'ltab-salaires','immo-liasse':'ltab-immo','recapitulatif':'ltab-recapitulatif'};
  var btnEl=document.getElementById(btnMap[tab]); if(btnEl) btnEl.classList.add('active-tab');
}

function genererLiasse(){
  if(typeof EC==='undefined'){alert('Aucune donnée comptable disponible.');return;}
  var an = typeof EXERCICE!=='undefined' ? EXERCICE.annee : new Date().getFullYear();
  var p = typeof PROFIL_DATA!=='undefined' ? PROFIL_DATA : {};
  var ecAll = EC.concat(typeof REGL!=='undefined' ? REGL : []);

  // ── Calculs de base ──
  var comptes = {};
  ecAll.forEach(function(e){
    if(!comptes[e.cptD]) comptes[e.cptD]={d:0,c:0};
    if(!comptes[e.cptC]) comptes[e.cptC]={d:0,c:0};
    comptes[e.cptD].d += (e.debit||0);
    comptes[e.cptC].c += (e.credit||0);
  });
  function solde(cpt){ var v=comptes[cpt]||{d:0,c:0}; return v.d-v.c; }
  function soldeRange(from,to){ var t=0; Object.keys(comptes).forEach(function(k){ if(k>=from&&k<=to){var v=comptes[k];t+=v.d-v.c;} }); return t; }

  var CA = Math.abs(soldeRange('701','707'));
  var autresProd = Math.abs(soldeRange('71','75'));
  var totalProd = CA + autresProd;
  var chargesExploit = Math.abs(soldeRange('60','65'));
  var chargesFin = Math.abs(soldeRange('67','68'));
  var totalCharges = chargesExploit + chargesFin;
  var resultatAvantIS = totalProd - totalCharges;
  var isCalc = window._IS_CALCULE||{};
  var isTotal = isCalc.isTotal || Math.max(0, Math.round(resultatAvantIS * 0.27));
  var resultatNet = resultatAvantIS - isTotal;

  // TVA annuelle
  var tvaCollectee=0, tvaDeduc=0;
  ecAll.forEach(function(e){ if(e.isTVA){ if(e.cptC&&e.cptC.slice(0,3)==='443') tvaCollectee+=(e.credit||0); if(e.cptD&&e.cptD.slice(0,3)==='445') tvaDeduc+=(e.debit||0); } });
  var tvaNette = tvaCollectee - tvaDeduc;

  // Salaires annuels
  var masseSalariale=0, cnssTotal=0, irTotal=0;
  ecAll.forEach(function(e){
    if(e.cptD==='6411') masseSalariale+=(e.debit||0);
    if(e.cptD==='6413') cnssTotal+=(e.debit||0);
    if(e.cptC==='4421') irTotal+=(e.credit||0);
  });

  document.getElementById('liasse-statut').innerHTML = '<span style="background:var(--green-light);border:2px solid var(--green-border);border-radius:var(--radius);padding:2px 8px;font-size:10px;color:var(--green-dark)">✓ Liasse générée — Exercice '+an+'</span>';

  // ── Tableau BIC ──
  function lRow(label,val,cls,indent){
    var st=indent?'padding-left:'+(12+indent*16)+'px':'padding-left:12px';
    return '<div class="liasse-row '+(cls||'')+'"><span style="'+st+'">'+label+'</span><span class="liasse-val">'+(val!==null?(Math.round(val)||0).toLocaleString('fr-FR')+' FCFA':'')+'</span></div>';
  }

  document.getElementById('liasse-bic').innerHTML = '<div class="card">'
    +'<div class="liasse-section-header">DÉCLARATION BIC — Résultat fiscal — Exercice '+an+'</div>'
    +'<div style="padding:8px 12px;background:var(--bg);font-size:11px;color:var(--text-muted);display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'
      +'<span>Entreprise : <strong>'+(p.nom||'—')+'</strong></span>'
      +'<span>IFU : <strong>'+(p.ifu||'—')+'</strong></span>'
      +'<span>RCCM : <strong>'+(p.rccm||'—')+'</strong></span>'
    +'</div>'
    +'<div class="liasse-section-header" style="background:rgba(var(--accent-rgb),.15);color:var(--green-dark)">I — PRODUITS</div>'
    +lRow("Chiffre d'affaires (cptes 70x)",CA)
    +lRow("Autres produits d'exploitation (71x-75x)",autresProd,null,1)
    +lRow("TOTAL PRODUITS",totalProd,'liasse-row-subtotal')
    +'<div class="liasse-section-header" style="background:rgba(226,75,74,.08);color:var(--red)">II — CHARGES</div>'
    +lRow("Charges d'exploitation (60x-65x)",chargesExploit)
    +lRow("Charges financières (67x-68x)",chargesFin,null,1)
    +lRow("TOTAL CHARGES",totalCharges,'liasse-row-subtotal')
    +'<div class="liasse-section-header">III — RÉSULTAT ET IMPÔT</div>'
    +lRow("Résultat avant IS",resultatAvantIS,null,0)
    +lRow("Impôt sur les Sociétés (IS) 27%",isTotal,null,1)
    +lRow("RÉSULTAT NET DE L'EXERCICE",resultatNet,'liasse-row-total')
    +'<div style="padding:8px 12px;font-size:10.5px;color:var(--text-faint)">Chiffres calculés depuis les écritures OHADA. Vérifier avec un expert-comptable avant dépôt DGI.</div>'
    +'</div>';

  // ── TVA annuelle ──
  document.getElementById('liasse-tva-liasse').innerHTML = '<div class="card">'
    +'<div class="liasse-section-header">RÉCAPITULATIF TVA ANNUEL — Exercice '+an+'</div>'
    +lRow("TVA collectée (cpte 4431)",tvaCollectee)
    +lRow("TVA déductible sur achats (cpte 4451)",tvaDeduc,null,1)
    +lRow("TVA NETTE À REVERSER À LA DGI",tvaNette,'liasse-row-total')
    +'<div style="padding:10px 12px;font-size:11px;background:var(--blue-light);border-top:2px solid var(--blue-border)">'
      +'<strong>Rappel :</strong> La TVA doit être déclarée mensuellement (avant le 15 du mois suivant). Ce récapitulatif annuel est fourni à titre indicatif et pour la vérification de cohérence.'
    +'</div></div>';

  // ── Salaires ──
  var nbEmp = typeof EMPLOYES_RH !== 'undefined' ? EMPLOYES_RH.length : 0;
  document.getElementById('liasse-salaires').innerHTML = '<div class="card">'
    +'<div class="liasse-section-header">DÉCLARATION SALAIRES — CNSS & ITS — Exercice '+an+'</div>'
    +lRow("Masse salariale brute versée (cpte 6411)",masseSalariale)
    +lRow("CNSS patronal versé (cpte 6413)",cnssTotal,null,1)
    +lRow("IR (ITS) retenu à la source (cpte 4421)",irTotal,null,1)
    +lRow("TOTAL CHARGES DE PERSONNEL",masseSalariale+cnssTotal,'liasse-row-subtotal')
    +'<div style="padding:8px 12px;background:var(--bg);display:flex;gap:24px;font-size:11.5px">'
      +'<span>Effectif déclaré : <strong>'+nbEmp+' employé(s)</strong></span>'
      +'<span>Taux CNSS patronal : <strong>17,5%</strong></span>'
      +'<span>Déclaration CNSS : <strong>trimestrielle</strong></span>'
    +'</div></div>';

  // ── Immobilisations ──
  var immos = typeof IMMOS !== 'undefined' ? IMMOS : [];
  var totalBrut=0, totalAmort=0;
  immos.forEach(function(i){ totalBrut+=(i.valeur||0); totalAmort+=(i.amortCumul||0); });
  var totalVNC = totalBrut - totalAmort;
  var immoHTML = '<div class="card"><div class="liasse-section-header">ÉTAT DES IMMOBILISATIONS — Exercice '+an+'</div>';
  if(immos.length){
    immoHTML += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11.5px">'
      +'<thead><tr style="background:var(--bg)"><th style="padding:7px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Désignation</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Valeur brute</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Amort. cumulé</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">VNC</th><th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Durée</th></tr></thead><tbody>';
    immos.forEach(function(i){
      var vnc=(i.valeur||0)-(i.amortCumul||0);
      immoHTML+='<tr style="border-bottom:2px solid var(--border)"><td style="padding:7px 10px">'+i.nom+'</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+(i.valeur||0).toLocaleString('fr-FR')+'</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--amber)">'+(i.amortCumul||0).toLocaleString('fr-FR')+'</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--green-dark)">'+vnc.toLocaleString('fr-FR')+'</td><td style="padding:7px 10px;font-size:11px;color:var(--text-muted)">'+(i.duree||'—')+' ans</td></tr>';
    });
    immoHTML+='<tr class="liasse-row-total"><td style="padding:7px 10px;font-weight:700">TOTAL</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:700">'+totalBrut.toLocaleString('fr-FR')+'</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--amber)">'+totalAmort.toLocaleString('fr-FR')+'</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--green-dark)">'+totalVNC.toLocaleString('fr-FR')+'</td><td></td></tr>';
    immoHTML+='</tbody></table></div>';
  } else {
    immoHTML+='<div style="padding:24px;text-align:center;color:var(--text-faint);font-style:italic">Aucune immobilisation enregistrée. Alimentez le module Immobilisations.</div>';
  }
  immoHTML+='</div>';
  document.getElementById('liasse-immo-liasse').innerHTML = immoHTML;

  // ── Récapitulatif fiscal ──
  document.getElementById('liasse-recapitulatif').innerHTML = '<div class="card">'
    +'<div class="liasse-section-header">RÉCAPITULATIF FISCAL — Obligations DGI Togo — Exercice '+an+'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:14px">'
      +fiscKpi('IS à payer',isTotal,'amber')
      +fiscKpi('TVA nette',tvaNette,'blue')
      +fiscKpi('ITS (IR salariés)',irTotal,'purple')
      +fiscKpi('CNSS patronal',cnssTotal,'red')
      +fiscKpi('Résultat net',resultatNet,resultatNet>=0?'green':'red')
      +fiscKpi('CA déclaré',CA,'teal')
    +'</div>'
    +'<div style="padding:0 14px 14px">'
      +'<div style="font-size:11px;font-weight:700;margin-bottom:8px;color:var(--text-muted);text-transform:uppercase">Checklist dépôt DGI</div>'
      +checkItem('Bilan SYSCOHADA signé par l\'expert-comptable',true)
      +checkItem('Compte de résultat détaillé',true)
      +checkItem('Tableau des flux de trésorerie (TFT)',true)
      +checkItem('État des immobilisations',immos.length>0)
      +checkItem('Déclaration BIC / IS','auto')
      +checkItem('Liasse TVA annuelle réconciliée','auto')
      +checkItem('Déclaration salaires & CNSS',masseSalariale>0)
      +checkItem('Notes annexes SYSCOHADA','auto')
    +'</div></div>';
}

function fiscKpi(label,val,cls){
  return '<div style="background:var(--bg);border:2px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center">'
    +'<div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">'+label+'</div>'
    +'<div style="font-size:15px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--'+cls+')">'+(Math.round(val)||0).toLocaleString('fr-FR')+'</div>'
    +'<div style="font-size:9px;color:var(--text-faint)">FCFA</div>'
    +'</div>';
}
function checkItem(label,done){
  var icon = done===true?'✅':done==='auto'?'🔄':'⬜';
  var color = done===true?'var(--green-dark)':done==='auto'?'var(--blue)':'var(--text-muted)';
  return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:2px solid var(--border);font-size:11.5px;color:'+color+'">'+icon+' '+label+'</div>';
}

function exporterLiassePDF(){
  genererLiasse();
  alert('Le PDF de liasse fiscale complète est disponible document par document via le bouton Export PDF de chaque onglet.\n\nUtilisez aussi Export TFT PDF depuis l\'onglet Flux de trésorerie pour l\'état complet SYSCOHADA.');
}
function exporterLiasseCSV(){
  genererLiasse();
  var d=window._TFT_DATA||{};
  var an=typeof EXERCICE!=='undefined'?EXERCICE.annee:new Date().getFullYear();
  var p=typeof PROFIL_DATA!=='undefined'?PROFIL_DATA:{};
  var ecAll=EC.concat(typeof REGL!=='undefined'?REGL:[]);
  var CA=0,charges=0,isT=0;
  ecAll.forEach(function(e){if(e.cptC&&e.cptC.charAt(0)==='7'&&!e.isTVA)CA+=(e.credit||0);if(e.cptD&&e.cptD.charAt(0)==='6'&&!e.isTVA)charges+=(e.debit||0);});
  isT=(window._IS_CALCULE||{}).isTotal||Math.max(0,Math.round((CA-charges)*0.27));
  var csv='LIASSE FISCALE DGI TOGO\nEntreprise;'+(p.nom||'—')+'\nIFU;'+(p.ifu||'—')+'\nExercice;'+an+'\n\n'
    +'RUBRIQUE;MONTANT FCFA\n'
    +"Chiffre d'affaires;"+Math.round(CA)+'\n'
    +"Total charges;"+Math.round(charges)+'\n'
    +"Résultat avant IS;"+Math.round(CA-charges)+'\n'
    +"IS 27%;"+Math.round(isT)+'\n'
    +"Résultat net;"+Math.round(CA-charges-isT)+'\n';
  var a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download='Liasse_DGI_'+an+'.csv';a.click();
}

// ═══════════════════════════════════════════════════════════════
// NOTES ANNEXES SYSCOHADA
// ═══════════════════════════════════════════════════════════════
function showAnnexeTab(tab){
  document.querySelectorAll('#pane-annexes .liasse-section').forEach(function(s){s.style.display='none';});
  document.querySelectorAll('#pane-annexes .liasse-tab').forEach(function(t){t.classList.remove('active-tab');});
  var el=document.getElementById('annexe-'+tab); if(el) el.style.display='block';
  var btn=document.getElementById('atab-'+tab); if(btn) btn.classList.add('active-tab');
}

function genererAnnexes(){
  var an=typeof EXERCICE!=='undefined'?EXERCICE.annee:new Date().getFullYear();
  var p=typeof PROFIL_DATA!=='undefined'?PROFIL_DATA:{};
  var fj=typeof FORME_JURIDIQUE!=='undefined'?FORME_JURIDIQUE.toUpperCase():'SARL';

  // ── Note 1 : Méthodes comptables ──
  document.getElementById('annexe-methodes').innerHTML = '<div class="card">'
    +'<div class="liasse-section-header">Note 1 — Règles et méthodes comptables</div>'
    +'<div style="padding:14px;font-size:12px;line-height:1.9;color:var(--text)">'
      +'<p><strong>Référentiel comptable :</strong> Les comptes annuels de '+(p.nom||'la société')+' sont établis conformément au Système Comptable OHADA (SYSCOHADA révisé 2017), adopté par l\'Acte Uniforme relatif au Droit Comptable et à l\'Information Financière du 26 janvier 2017.</p>'
      +'<p><strong>Forme juridique :</strong> '+fj+' — Capital social : '+(p.capital?Number(p.capital).toLocaleString('fr-FR')+' FCFA':'non renseigné')+'.</p>'
      +'<p><strong>Méthode d\'évaluation des immobilisations :</strong> Les immobilisations corporelles et incorporelles sont comptabilisées à leur coût d\'acquisition. L\'amortissement est calculé selon la méthode linéaire sur la durée d\'utilité économique estimée.</p>'
      +'<p><strong>Méthode d\'évaluation des stocks :</strong> Les stocks sont évalués au coût moyen unitaire pondéré (CMUP). Les dépréciations éventuelles sont constatées par voie de provisions.</p>'
      +'<p><strong>Créances et dettes :</strong> Les créances et dettes sont comptabilisées à leur valeur nominale. Une dépréciation est constituée lorsque la valeur probable de recouvrement est inférieure à la valeur comptable.</p>'
      +'<p><strong>Impôt sur les sociétés :</strong> L\'IS est calculé au taux de 27% du résultat fiscal imposable, conformément au Code Général des Impôts du Togo.'+(fj==='SA'?' L\'IRVM sur dividendes est prélevé à 7% pour les personnes morales et 3% pour les personnes physiques.':'')+'</p>'
      +'<p><strong>TVA :</strong> La TVA est constatée selon la méthode des débits. Le taux normal applicable est de 18%.</p>'
      +'<p><strong>Devise de présentation :</strong> Franc CFA (XOF / FCFA). L\'euro est converti au taux fixe UEMOA de 655,957 FCFA pour 1 EUR.</p>'
    +'</div></div>';

  // ── Note 2 : Immobilisations ──
  var immos=typeof IMMOS!=='undefined'?IMMOS:[];
  var noteImmo='<div class="card"><div class="liasse-section-header">Note 2 — Détail des immobilisations et amortissements</div>';
  if(immos.length){
    var groupes={};
    immos.forEach(function(i){var g=i.classe||'Autres';if(!groupes[g])groupes[g]=[];groupes[g].push(i);});
    Object.keys(groupes).forEach(function(g){
      noteImmo+='<div style="padding:6px 12px;background:var(--bg);font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted)">'+g+'</div>';
      groupes[g].forEach(function(i){
        noteImmo+='<div class="liasse-row">'
          +'<span>'+i.nom+'<span style="font-size:10px;color:var(--text-faint);margin-left:8px">Acquis le '+fmtD(i.date)+'</span></span>'
          +'<span class="liasse-val">'+(i.valeur||0).toLocaleString('fr-FR')+' FCFA | VNC : '+Math.max(0,(i.valeur||0)-(i.amortCumul||0)).toLocaleString('fr-FR')+'</span>'
          +'</div>';
      });
    });
  } else { noteImmo+='<div style="padding:24px;text-align:center;color:var(--text-faint);font-style:italic">Aucune immobilisation.</div>'; }
  document.getElementById('annexe-immo-ann').innerHTML=noteImmo+'</div>';

  // ── Note 3 : Créances & dettes ──
  var creances=0, dettes=0;
  if(typeof EC!=='undefined'){
    var ecAll=EC.concat(typeof REGL!=='undefined'?REGL:[]);
    ecAll.forEach(function(e){
      if(e.cptD&&e.cptD.slice(0,2)==='41')creances+=(e.debit||0);
      if(e.cptC&&e.cptC.slice(0,2)==='41')creances-=(e.credit||0);
      if(e.cptC&&e.cptC.slice(0,2)==='40')dettes+=(e.credit||0);
      if(e.cptD&&e.cptD.slice(0,2)==='40')dettes-=(e.debit||0);
    });
  }
  document.getElementById('annexe-creances').innerHTML='<div class="card">'
    +'<div class="liasse-section-header">Note 3 — Créances et dettes</div>'
    +'<div class="liasse-section-header" style="background:rgba(var(--accent-rgb),.1);color:var(--green-dark)">Créances clients (cpte 41x)</div>'
    +'<div class="liasse-row"><span>Créances clients brutes</span><span class="liasse-val">'+Math.max(0,Math.round(creances)).toLocaleString('fr-FR')+' FCFA</span></div>'
    +(typeof PROVISIONS_LIST!=='undefined'&&PROVISIONS_LIST.filter(function(p){return p.type==='creance';}).length?'<div class="liasse-row"><span>Provisions pour créances douteuses (D.6911/C.491)</span><span class="liasse-val" style="color:var(--red)">-'+PROVISIONS_LIST.filter(function(p){return p.type==='creance';}).reduce(function(a,p){return a+p.mt;},0).toLocaleString('fr-FR')+' FCFA</span></div>':'')
    +'<div class="liasse-section-header" style="background:rgba(226,75,74,.08);color:var(--red)">Dettes fournisseurs (cpte 40x)</div>'
    +'<div class="liasse-row"><span>Dettes fournisseurs</span><span class="liasse-val">'+Math.max(0,Math.round(dettes)).toLocaleString('fr-FR')+' FCFA</span></div>'
    +'</div>';

  // ── Note 4 : Capitaux propres ──
  var capital=parseFloat((p.capital||'').toString().replace(/\s/g,''))||0;
  document.getElementById('annexe-capitaux').innerHTML='<div class="card">'
    +'<div class="liasse-section-header">Note 4 — Variation des capitaux propres</div>'
    +'<div class="liasse-row"><span>Capital social</span><span class="liasse-val">'+capital.toLocaleString('fr-FR')+' FCFA</span></div>'
    +'<div class="liasse-row"><span>Résultat net de l\'exercice '+an+'</span><span class="liasse-val">'+(((window._IS_CALCULE||{}).benImposableNet||0)-(window._IS_CALCULE||{}).isTotal||0).toLocaleString('fr-FR')+' FCFA</span></div>'
    +'<div style="padding:10px 12px;font-size:11px;color:var(--text-muted);font-style:italic">Les autres mouvements de capitaux (apports, prélèvements) sont à renseigner manuellement dans les engagements hors bilan.</div>'
    +'</div>';

  renderEngagements();
  renderEvenements();
}

// Engagements hors bilan
function ajouterEngagement(){ document.getElementById('engagements-form').style.display='block'; }
function sauverEngagement(){
  var lib=(document.getElementById('eng-lib').value||'').trim();
  var mt=parseFloat(document.getElementById('eng-mt').value)||0;
  if(!lib){alert('Libellé obligatoire.');return;}
  ENGAGEMENTS.push({id:Date.now(),lib:lib,type:document.getElementById('eng-type').value,mt:mt,ech:document.getElementById('eng-ech').value,desc:document.getElementById('eng-desc').value});
  saveV17(); document.getElementById('engagements-form').style.display='none'; renderEngagements();
}
function renderEngagements(){
  var el=document.getElementById('engagements-list'); if(!el)return;
  if(!ENGAGEMENTS.length){el.innerHTML='<div style="color:var(--text-faint);font-style:italic;font-size:12px;padding:12px">Aucun engagement hors bilan. Exemples : loyers restants, cautions, garanties données, crédits-bails.</div>';return;}
  var typeLabels={loyer:'Bail/Loyer',garantie:'Garantie',commande:'Commande ferme','credit-bail':'Crédit-bail',autre:'Autre'};
  el.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:11.5px">'
    +'<thead><tr style="background:var(--bg)"><th style="padding:7px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Nature</th><th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Type</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Montant</th><th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Échéance</th><th style="padding:7px 10px;border-bottom:2px solid var(--border);width:30px"></th></tr></thead><tbody>'
    +ENGAGEMENTS.map(function(e,i){return'<tr style="border-bottom:2px solid var(--border)"><td style="padding:7px 10px">'+e.lib+'<div style="font-size:10px;color:var(--text-muted)">'+( e.desc||'')+'</div></td><td style="padding:7px 10px"><span class="badge bg-blue" style="font-size:9px">'+(typeLabels[e.type]||e.type)+'</span></td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+(e.mt||0).toLocaleString('fr-FR')+' FCFA</td><td style="padding:7px 10px;font-size:11px;color:var(--text-muted)">'+(e.ech?fmtD(e.ech):'—')+'</td><td style="padding:7px 10px"><button onclick="ENGAGEMENTS.splice('+i+',1);saveV17();renderEngagements()" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:13px">×</button></td></tr>';}).join('')
    +'</tbody></table>';
}

// Événements postérieurs
function ajouterEvenement(){ document.getElementById('evenements-form').style.display='block'; }
function sauverEvenement(){
  var lib=(document.getElementById('ev-ann-lib').value||'').trim();
  if(!lib){alert('Description obligatoire.');return;}
  EVENEMENTS_POST.push({id:Date.now(),lib:lib,mt:parseFloat(document.getElementById('ev-ann-mt').value)||0,desc:document.getElementById('ev-ann-desc').value});
  saveV17(); document.getElementById('evenements-form').style.display='none'; renderEvenements();
}
function renderEvenements(){
  var el=document.getElementById('evenements-list'); if(!el)return;
  if(!EVENEMENTS_POST.length){el.innerHTML='<div style="color:var(--text-faint);font-style:italic;font-size:12px;padding:12px">Aucun événement postérieur à mentionner. Exemples : jugement rendu après clôture, sinistre survenu, filiale cédée.</div>';return;}
  el.innerHTML=EVENEMENTS_POST.map(function(e,i){return'<div style="padding:10px 12px;border-bottom:2px solid var(--border)"><div style="font-size:12px;font-weight:600">'+e.lib+'</div>'+(e.mt?'<div style="font-size:11px;color:var(--amber);font-family:\'Archivo\',sans-serif;margin-top:2px">Impact estimé : '+e.mt.toLocaleString('fr-FR')+' FCFA</div>':'')+(e.desc?'<div style="font-size:11px;color:var(--text-muted);margin-top:2px">'+e.desc+'</div>':'')+'<button onclick="EVENEMENTS_POST.splice('+i+',1);saveV17();renderEvenements()" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:10px;margin-top:3px">Supprimer</button></div>';}).join('');
}

function exporterAnnexesPDF(){
  genererAnnexes();
  var jsPDF_=window.jspdf?window.jspdf.jsPDF:window.jsPDF; if(!jsPDF_){alert('PDF non disponible.');return;}
  var p=typeof PROFIL_DATA!=='undefined'?PROFIL_DATA:{};
  var an=typeof EXERCICE!=='undefined'?EXERCICE.annee:new Date().getFullYear();
  var doc=new jsPDF_({unit:'mm',format:'a4'});
  var W=210,M=14,y=20;
  doc.setFillColor(13,31,26);doc.rect(0,0,W,28,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(13);doc.setFont('helvetica','bold');
  doc.text('NOTES ANNEXES AUX ÉTATS FINANCIERS',M,12);
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  doc.text((p.nom||'Mon Entreprise')+(p.ifu?' — IFU: '+p.ifu:''),M,19);
  doc.text('Exercice clos le 31/12/'+an+' — SYSCOHADA révisé 2017',M,25);
  doc.setTextColor(0,0,0);y=36;
  var sections=[
    ['NOTE 1 — MÉTHODES COMPTABLES','Les comptes sont établis conformément au SYSCOHADA révisé 2017. Immobilisations au coût historique, amortissement linéaire. Stocks au CMUP. IS au taux de 27%.'],
    ['NOTE 2 — IMMOBILISATIONS','Voir tableau des immobilisations dans la liasse fiscale. Méthode : amortissement linéaire.'],
    ['NOTE 3 — CRÉANCES ET DETTES','Les créances et dettes sont à leur valeur nominale. Dépréciation constituée si risque de non-recouvrement identifié.'],
    ['NOTE 4 — CAPITAUX PROPRES','Capital social : '+(p.capital?Number(p.capital).toLocaleString('fr-FR')+' FCFA':'non renseigné')+'.'],
    ['NOTE 5 — ENGAGEMENTS HORS BILAN',ENGAGEMENTS.length?ENGAGEMENTS.map(function(e){return e.lib+' : '+(e.mt||0).toLocaleString('fr-FR')+' FCFA';}).join(' / '):'Néant.'],
    ['NOTE 6 — ÉVÉNEMENTS POSTÉRIEURS',EVENEMENTS_POST.length?EVENEMENTS_POST.map(function(e){return e.lib;}).join(' / '):'Néant.'],
  ];
  sections.forEach(function(s){
    if(y>260){doc.addPage();y=20;}
    doc.setFillColor(13,31,26);doc.rect(M,y,W-2*M,7,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');
    doc.text(s[0],M+3,y+5);doc.setTextColor(0,0,0);y+=10;
    doc.setFontSize(8.5);doc.setFont('helvetica','normal');
    var lines=doc.splitTextToSize(s[1],W-2*M);doc.text(lines,M,y);y+=lines.length*5+6;
  });
  doc.save('Annexes_SYSCOHADA_'+an+'.pdf');
}

// ── INIT v17 ────────────────────────────────────────────────
(function(){
  document.title='ComptaIA v17 — OHADA Togo';
  var f=document.getElementById('sidebar-footer');if(f)f.textContent='ComptaIA v17 — OHADA Togo';
})();
