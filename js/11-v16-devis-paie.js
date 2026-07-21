// v16: devis multi-lignes rewrite + full payroll (paie) module with Togo IR/CNSS - extracted from ComptaIA_Pro_original.html lines 7245-8144
// ═══════════════════════════════════════════════════════════
// ComptaIA v16 — DEVIS MULTI-LIGNES + PAIE RH COMPLET
// ═══════════════════════════════════════════════════════════

// ── DATA STORES v16 ────────────────────────────────────────
var EMPLOYES_RH = JSON.parse(localStorage.getItem('v16_employes')||'[]');
var BULLETINS   = JSON.parse(localStorage.getItem('v16_bulletins')||'[]');
var DV_LIGNES   = []; // lignes en cours d'édition
var DV_EDIT_IDX = null;

function saveV16(){
  try{
    localStorage.setItem('v16_employes', JSON.stringify(EMPLOYES_RH));
    localStorage.setItem('v16_bulletins', JSON.stringify(BULLETINS));
  }catch(e){}
}

// ── GO() PATCH v16 ─────────────────────────────────────────
(function(){
  var _old = window.go;
  window.go = function(id, el){
    if(id === 'paie'){
      document.querySelectorAll('.pane').forEach(function(p){p.classList.remove('active');});
      document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
      var pane = document.getElementById('pane-paie');
      if(pane) pane.classList.add('active');
      if(el) el.classList.add('active');
      var pt = document.getElementById('page-title');
      if(pt) pt.textContent = '👷 Gestion de la paie';
      renderPaieStats();
      renderListeEmployes();
      return;
    }
    _old(id, el);
  };
  // Add paie to GRP_MAP
  if(window.GRP_MAP) window.GRP_MAP['paie'] = 'rh';
})();

// Adopt pane-paie into content
(function(){
  var content = document.querySelector('.content');
  var pane = document.getElementById('pane-paie');
  if(content && pane && pane.parentElement !== content) content.appendChild(pane);
})();

// ══════════════════════════════════════════════════════
// DEVIS MULTI-LIGNES — REMPLACEMENT COMPLET
// ══════════════════════════════════════════════════════

// Override existing devis functions
window.ouvrirFormulaireDevis = function(editIdx){
  DV_EDIT_IDX = (editIdx !== undefined) ? editIdx : null;
  var form = document.getElementById('devis-form');
  if(!form) return;
  form.style.display = 'block';

  var today = new Date().toISOString().split('T')[0];
  var valid = new Date(); valid.setDate(valid.getDate()+30);

  if(DV_EDIT_IDX !== null){
    // Mode édition
    var dv = DEVIS_LIST[DV_EDIT_IDX];
    document.getElementById('dv-num').value = dv.num||'';
    document.getElementById('dv-client').value = dv.client||'';
    document.getElementById('dv-date').value = dv.date||today;
    document.getElementById('dv-validite').value = dv.validite||valid.toISOString().split('T')[0];
    document.getElementById('dv-objet').value = dv.objet||'';
    document.getElementById('dv-notes').value = dv.notes||'';
    document.getElementById('dv-acompte').value = dv.acompte||0;
    document.getElementById('dv-cond-pay').value = dv.condPay||'comptant';
    document.getElementById('dv-delai').value = dv.delai||'';
    DV_LIGNES = (dv.lignes||[]).map(function(l){ return Object.assign({},l); });
    document.getElementById('devis-form-title').textContent = 'Modifier devis '+dv.num;
  } else {
    // Mode création
    var nextN = 'DV'+(new Date().getFullYear())+'-'+String(DEVIS_LIST.length+1).padStart(3,'0');
    document.getElementById('dv-num').value = nextN;
    document.getElementById('dv-client').value = '';
    document.getElementById('dv-date').value = today;
    document.getElementById('dv-validite').value = valid.toISOString().split('T')[0];
    document.getElementById('dv-objet').value = '';
    document.getElementById('dv-notes').value = '';
    document.getElementById('dv-acompte').value = 0;
    document.getElementById('dv-cond-pay').value = 'comptant';
    document.getElementById('dv-delai').value = '';
    DV_LIGNES = [{id:'dv-l-1',desc:'',qty:1,unite:'unité',pu:0,remise:0,tva:18},{id:'dv-l-2',desc:'',qty:1,unite:'unité',pu:0,remise:0,tva:18}];
    document.getElementById('devis-form-title').textContent = 'Nouveau devis';
  }

  // Populate client datalist
  var dl = document.getElementById('dv-clients-list');
  if(dl && typeof TIERS !== 'undefined'){
    dl.innerHTML = '';
    TIERS.forEach(function(t){ if(t.type==='client'||t.type==='les-deux'){ var o=document.createElement('option');o.value=t.nom;dl.appendChild(o); } });
  }

  renderLignesDV();
  document.getElementById('devis-list-wrap').style.marginTop = '10px';
  form.scrollIntoView({behavior:'smooth'});
};

window.fermerFormulaireDevis = function(){
  var f = document.getElementById('devis-form'); if(f) f.style.display='none';
  DV_LIGNES = []; DV_EDIT_IDX = null;
};

function ajouterLigneDV(){
  DV_LIGNES.push({id:'dv-l-'+Date.now(),desc:'',qty:1,unite:'unité',pu:0,remise:0,tva:18});
  renderLignesDV();
}

function supprimerLigneDV(id){
  DV_LIGNES = DV_LIGNES.filter(function(l){return l.id!==id;});
  renderLignesDV();
}

function majLigneDV(id, champ, val){
  var l = DV_LIGNES.find(function(x){return x.id===id;});
  if(!l) return;
  l[champ] = val;
  // Auto-remplir depuis le stock
  if(champ==='desc' && typeof STOCKS!=='undefined' && STOCKS[val]){
    l.pu = STOCKS[val].pu||STOCKS[val].cmup||0;
  }
  calcTotauxDV();
  // Update the HT cell inline
  var htCell = document.getElementById('dvht-'+id);
  if(htCell){
    var ht = Math.round((l.qty||0)*(l.pu||0)*(1-(l.remise||0)/100));
    htCell.textContent = ht.toLocaleString('fr-FR');
  }
}

function renderLignesDV(){
  var tbody = document.getElementById('dv-lignes-tbody'); if(!tbody) return;
  var stocks = typeof STOCKS !== 'undefined' ? Object.keys(STOCKS) : [];
  tbody.innerHTML = DV_LIGNES.map(function(l,i){
    var ht = Math.round((l.qty||0)*(l.pu||0)*(1-(l.remise||0)/100));
    return '<tr style="border-bottom:2px solid var(--border)">'
      +'<td style="padding:4px 6px;min-width:180px">'
        +'<input type="text" value="'+(l.desc||'')+'" list="dvstock-'+i+'" placeholder="Désignation..." '
        +'onchange="majLigneDV(\''+l.id+'\',\'desc\',this.value)" '
        +'style="width:100%;font-size:11.5px;padding:3px 5px;border:2px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text)"/>'
        +'<datalist id="dvstock-'+i+'">'+stocks.map(function(s){return'<option value="'+s+'">';}).join('')+'</datalist>'
      +'</td>'
      +'<td style="padding:4px 6px;width:65px"><input type="number" value="'+(l.qty||1)+'" min="0" step="0.01" onchange="majLigneDV(\''+l.id+'\',\'qty\',parseFloat(this.value)||0)" style="width:100%;text-align:right;font-size:11.5px;padding:3px 5px;border:2px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text)"/></td>'
      +'<td style="padding:4px 6px;width:75px"><select onchange="majLigneDV(\''+l.id+'\',\'unite\',this.value)" style="width:100%;font-size:11px;padding:3px;border:2px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text)">'
        +['unité','kg','litre','mètre','m²','heure','jour','lot','forfait','boîte','carton'].map(function(u){return'<option'+(l.unite===u?' selected':'')+'>'+u+'</option>';}).join('')
      +'</select></td>'
      +'<td style="padding:4px 6px;width:120px"><input type="number" value="'+(l.pu||0)+'" min="0" onchange="majLigneDV(\''+l.id+'\',\'pu\',parseFloat(this.value)||0)" style="width:100%;text-align:right;font-size:11.5px;padding:3px 5px;border:2px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text)"/></td>'
      +'<td style="padding:4px 6px;width:60px"><input type="number" value="'+(l.remise||0)+'" min="0" max="100" step="0.5" onchange="majLigneDV(\''+l.id+'\',\'remise\',parseFloat(this.value)||0)" style="width:100%;text-align:right;font-size:11.5px;padding:3px 5px;border:2px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text)"/></td>'
      +'<td style="padding:4px 6px;width:65px"><input type="number" value="'+(l.tva||0)+'" min="0" max="100" step="0.5" onchange="majLigneDV(\''+l.id+'\',\'tva\',parseFloat(this.value)||0)" style="width:100%;text-align:right;font-size:11.5px;padding:3px 5px;border:2px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text)"/></td>'
      +'<td style="padding:4px 6px;text-align:right;font-family:\'Archivo\',sans-serif;font-size:11.5px;color:var(--green-dark)" id="dvht-'+l.id+'">'+ht.toLocaleString('fr-FR')+'</td>'
      +'<td style="padding:4px 6px;text-align:center"><button onclick="supprimerLigneDV(\''+l.id+'\')" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:15px;line-height:1">×</button></td>'
      +'</tr>';
  }).join('');
  calcTotauxDV();
}

function calcTotauxDV(){
  var totHT=0, totRem=0, totTVA=0;
  DV_LIGNES.forEach(function(l){
    var htBrut = Math.round((l.qty||0)*(l.pu||0));
    var remVal = Math.round(htBrut*(l.remise||0)/100);
    var htNet  = htBrut - remVal;
    var tva    = Math.round(htNet*(l.tva||0)/100);
    totHT  += htBrut;
    totRem += remVal;
    totTVA += tva;
  });
  var htNet = totHT - totRem;
  var ttc   = htNet + totTVA;
  var set = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v.toLocaleString('fr-FR'); };
  set('dv-tot-ht',    totHT);
  set('dv-tot-rem',   totRem);
  set('dv-tot-htnet', htNet);
  set('dv-tot-tva',   totTVA);
  set('dv-tot-ttc',   ttc);
  calcDvAcompte();
}

function calcDvAcompte(){
  var ttcEl = document.getElementById('dv-tot-ttc');
  var acompteEl = document.getElementById('dv-acompte');
  var pctEl = document.getElementById('dv-acompte-pct');
  if(!ttcEl || !acompteEl || !pctEl) return;
  var ttc = parseInt((ttcEl.textContent||'0').replace(/\s/g,'').replace(/\u202f/g,'')) || 0;
  var acompte = parseFloat(acompteEl.value)||0;
  if(ttc>0 && acompte>0) pctEl.textContent = '= '+(acompte/ttc*100).toFixed(1)+'% du TTC';
  else pctEl.textContent = '';
}

window.sauverDevis = function(){
  var client = (document.getElementById('dv-client').value||'').trim();
  var objet  = (document.getElementById('dv-objet').value||'').trim();
  if(!client){ alert('Le nom du client est obligatoire.'); return; }

  // Recalc totals
  var totHT=0, totRem=0, totTVA=0;
  DV_LIGNES.forEach(function(l){
    var htB=Math.round((l.qty||0)*(l.pu||0));
    var rem=Math.round(htB*(l.remise||0)/100);
    var htN=htB-rem;
    totHT+=htB; totRem+=rem; totTVA+=Math.round(htN*(l.tva||0)/100);
  });
  var htNet = totHT-totRem;
  var ttc   = htNet+totTVA;

  var dv = {
    id: Date.now(),
    num: document.getElementById('dv-num').value,
    client: client,
    date: document.getElementById('dv-date').value,
    validite: document.getElementById('dv-validite').value,
    objet: objet||'Voir détail ci-dessous',
    notes: document.getElementById('dv-notes').value,
    acompte: parseFloat(document.getElementById('dv-acompte').value)||0,
    condPay: document.getElementById('dv-cond-pay').value,
    delai: document.getElementById('dv-delai').value,
    lignes: DV_LIGNES.map(function(l){return Object.assign({},l);}),
    totHT: totHT, totRem: totRem, totTVA: totTVA,
    ht: htNet, tva: totTVA, ttc: ttc,
    statut: 'brouillon'
  };

  if(DV_EDIT_IDX !== null){ DEVIS_LIST[DV_EDIT_IDX] = dv; }
  else { DEVIS_LIST.push(dv); }
  saveV13(); saveV16();
  fermerFormulaireDevis();
  renderDevis();
  if(typeof ajouterNotif==='function') ajouterNotif('info','Devis '+dv.num+' enregistré',client+' — '+ttc.toLocaleString('fr-FR')+' FCFA TTC');
};

window.renderDevis = function(){
  var w = document.getElementById('devis-list-wrap'); if(!w) return;
  if(!DEVIS_LIST.length){
    w.innerHTML='<div style="text-align:center;padding:48px;color:var(--text-faint);font-style:italic">Aucun devis. Cliquez sur "+ Nouveau devis" pour commencer.</div>';
    return;
  }
  var sc = {brouillon:'bg-blue',envoye:'bg-amber',accepte:'bg-green',refuse:'bg-red',expire:'bg-teal'};
  var html = '<div class="card"><div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr style="background:var(--bg)">'
    +'<th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">N° Devis</th>'
    +'<th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Client</th>'
    +'<th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Objet</th>'
    +'<th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Lignes</th>'
    +'<th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">TTC</th>'
    +'<th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Validité</th>'
    +'<th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Statut</th>'
    +'<th style="padding:8px 10px;border-bottom:2px solid var(--border)">Actions</th>'
    +'</tr></thead><tbody>';

  DEVIS_LIST.slice().reverse().forEach(function(dv,ri){
    var idx = DEVIS_LIST.length-1-ri;
    var nbLignes = (dv.lignes||[]).filter(function(l){return l.desc||l.pu;}).length;
    html += '<tr style="border-bottom:2px solid var(--border)">'
      +'<td style="padding:8px 10px;font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--green)">'+dv.num+'</td>'
      +'<td style="padding:8px 10px;font-weight:500">'+dv.client+'</td>'
      +'<td style="padding:8px 10px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--text-muted)" title="'+dv.objet+'">'+dv.objet+'</td>'
      +'<td style="padding:8px 10px;text-align:center"><span class="badge bg-blue" style="font-size:9px">'+nbLignes+' art.</span></td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:700">'+(dv.ttc||0).toLocaleString('fr-FR')+'</td>'
      +'<td style="padding:8px 10px;font-size:11px;color:var(--text-muted)">'+fmtD(dv.validite)+'</td>'
      +'<td style="padding:8px 10px">'+badge(dv.statut,(sc[dv.statut]||'bg-blue'))+'</td>'
      +'<td style="padding:8px 10px"><div style="display:flex;gap:3px;flex-wrap:wrap">'
        +'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px" onclick="changerStatutDevis('+idx+')" title="Changer statut">✏</button>'
        +'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px" onclick="ouvrirFormulaireDevis('+idx+')" title="Modifier">📝</button>'
        +'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px;background:var(--blue);color:#fff;border-color:var(--blue)" onclick="imprimerDevis('+idx+')" title="PDF">🖨</button>'
        +(dv.statut==='accepte'
          ? '<button class="btn btn-sm" style="font-size:9px;padding:2px 6px;background:var(--green);color:#fff;border-color:var(--green)" onclick="convertirDevisEnFacture('+idx+')" title="→ Facture">→ Fact.</button>'
            +'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px;background:var(--amber);color:#fff;border-color:var(--amber)" onclick="convertirDevisEnBC('+idx+')" title="→ BC">→ BC</button>'
          : '')
        +'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px;color:var(--red);border-color:var(--red-border)" onclick="supprimerDevis('+idx+')">✕</button>'
      +'</div></td>'
    +'</tr>';
  });
  html += '</tbody></table></div></div>';
  w.innerHTML = html;
};

// Convertir devis → facture directement (NOUVEAU)
window.convertirDevisEnFacture = function(i){
  var dv = DEVIS_LIST[i]; if(!dv) return;
  dv.statut = 'accepte';

  // Préparer les données pour la facture
  var today = new Date().toISOString().split('T')[0];
  var lignes = (dv.lignes||[]).filter(function(l){return (l.desc||'').trim()||(l.pu||0)>0;});

  // Remplir le formulaire de facture avec les données du devis
  var fClient = document.getElementById('f-client');
  var fDesc   = document.getElementById('f-desc');
  var fDate   = document.getElementById('f-date');
  var fType   = document.getElementById('f-type');

  if(fClient) fClient.value = dv.client;
  if(fDate)   fDate.value   = today;
  if(fDesc)   fDesc.value   = dv.objet;
  if(fType)   fType.value   = 'vente';

  // Si multi-lignes disponible, charger les lignes
  if(typeof ML_LIGNES !== 'undefined' && typeof renderMLTable === 'function'){
    ML_LIGNES = lignes.map(function(l){
      return {id:'ml-'+Date.now()+'-'+Math.random().toString(36).slice(2,5), desc:l.desc, qty:l.qty||1, unite:l.unite||'unité', pu:l.pu||0, tva:l.tva||18, ht:Math.round((l.qty||1)*(l.pu||0)*(1-(l.remise||0)/100))};
    });
    if(ML_LIGNES.length===0) ML_LIGNES.push({id:'ml-1',desc:'',qty:1,unite:'unité',pu:dv.ht||0,tva:18,ht:dv.ht||0});
    renderMLTable();
  }

  // HT global dans le champ principal
  var fHT = document.getElementById('f-ht');
  if(fHT) { fHT.value = dv.ht||0; if(typeof calcM==='function') calcM(); }

  saveV13();
  renderDevis();

  // Naviguer vers la facture
  go('facture', document.querySelector('[onclick*="\'facture\'"]'));
  if(typeof ajouterNotif==='function') ajouterNotif('info','Devis '+dv.num+' → Facture','Formulaire pré-rempli avec les '+lignes.length+' article(s) du devis');
  setTimeout(function(){ alert('✓ Les données du devis '+dv.num+' ont été chargées dans le formulaire de facture.\n\nVérifiez les montants, choisissez le mode de paiement puis validez.'); },200);
};

// PDF devis amélioré
window.imprimerDevis = function(i){
  var dv = DEVIS_LIST[i]; if(!dv) return;
  var p = typeof PROFIL_DATA !== 'undefined' ? PROFIL_DATA : {};
  var jsPDF_ = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if(!jsPDF_){ alert('Module PDF non disponible.'); return; }
  var doc = new jsPDF_({unit:'mm',format:'a4'});
  var W=210, M=14, y=20;

  // Couleur
  var rgb = ((p.couleur||'var(--accent)')).match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  var r=29,g=158,b=117;
  if(rgb){r=parseInt(rgb[1],16);g=parseInt(rgb[2],16);b=parseInt(rgb[3],16);}

  // Header
  doc.setFillColor(r,g,b); doc.rect(0,0,W,32,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text(p.nom||'Mon Entreprise', M, 12);
  doc.setFontSize(7.5); doc.setFont('helvetica','normal');
  if(p.ifu) doc.text('IFU: '+p.ifu, M, 18);
  if(p.rccm) doc.text('RCCM: '+p.rccm, M+50, 18);
  if(p.adresse) doc.text(p.adresse, M, 23);
  if(p.tel) doc.text('Tél: '+p.tel, M, 28);
  doc.setFontSize(22); doc.setFont('helvetica','bold');
  doc.text('DEVIS', W-M, 15, {align:'right'});
  doc.setFontSize(11); doc.setFont('helvetica','normal');
  doc.text(dv.num, W-M, 22, {align:'right'});
  doc.setFontSize(8); doc.text('Valable jusqu\'au '+fmtD(dv.validite), W-M, 28, {align:'right'});

  doc.setTextColor(0,0,0); y=42;

  // Adresse client + infos
  doc.setFillColor(245,247,250); doc.rect(M, y, 85, 22, 'F');
  doc.setFillColor(245,247,250); doc.rect(W-M-85, y, 85, 22, 'F');
  doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text('DESTINATAIRE :', M+3, y+5);
  doc.setFont('helvetica','normal');
  doc.text(dv.client, M+3, y+11);
  doc.text('DATE : '+fmtD(dv.date), W-M-82, y+5);
  doc.text('DÉLAI : '+(dv.delai||'À convenir'), W-M-82, y+11);
  doc.text('PAIEMENT : '+(dv.condPay||'Comptant'), W-M-82, y+17);
  y += 28;

  // Objet
  doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text('Objet : ', M, y); doc.setFont('helvetica','normal');
  doc.text(dv.objet||'—', M+16, y); y+=8;

  // Tableau lignes
  doc.setFillColor(r,g,b);
  doc.rect(M, y, W-2*M, 7, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text('Désignation', M+2, y+5);
  doc.text('Qté', M+100, y+5, {align:'right'});
  doc.text('Unité', M+115, y+5, {align:'center'});
  doc.text('P.U. HT', M+138, y+5, {align:'right'});
  doc.text('Rem.', M+152, y+5, {align:'right'});
  doc.text('Total HT', W-M-2, y+5, {align:'right'});
  y+=7; doc.setTextColor(0,0,0); doc.setFont('helvetica','normal');

  var lignes = (dv.lignes||[]).filter(function(l){return (l.desc||'').trim()||(l.pu||0)>0;});
  lignes.forEach(function(l,li){
    if(y > 260){ doc.addPage(); y=20; }
    if(li%2===1){ doc.setFillColor(249,250,251); doc.rect(M,y,W-2*M,7,'F'); }
    doc.setDrawColor(235,235,235); doc.line(M,y,W-M,y);
    doc.setFontSize(8);
    doc.text((l.desc||'—').slice(0,48), M+2, y+5);
    doc.text(String(l.qty||1), M+100, y+5, {align:'right'});
    doc.text(l.unite||'unité', M+115, y+5, {align:'center'});
    doc.text((l.pu||0).toLocaleString('fr-FR'), M+138, y+5, {align:'right'});
    if(l.remise) doc.text(l.remise+'%', M+152, y+5, {align:'right'});
    var ht = Math.round((l.qty||1)*(l.pu||0)*(1-(l.remise||0)/100));
    doc.setFont('helvetica','bold');
    doc.text(ht.toLocaleString('fr-FR'), W-M-2, y+5, {align:'right'});
    doc.setFont('helvetica','normal');
    y+=7;
  });
  doc.line(M,y,W-M,y); y+=4;

  // Totaux
  var totals=[
    ['Total HT brut',(dv.totHT||dv.ht||0).toLocaleString('fr-FR')+' FCFA'],
    ['Remises',(dv.totRem||0)>0?'- '+(dv.totRem||0).toLocaleString('fr-FR')+' FCFA':'—'],
    ['Total HT net',(dv.ht||0).toLocaleString('fr-FR')+' FCFA'],
    ['TVA',(dv.tva||0).toLocaleString('fr-FR')+' FCFA']
  ];
  totals.forEach(function(t){
    doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text(t[0], W-M-80, y+4); doc.text(t[1], W-M, y+4, {align:'right'}); y+=6;
  });
  // TTC
  doc.setFillColor(r,g,b); doc.rect(W-M-82, y, 82, 8, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont('helvetica','bold');
  doc.text('TOTAL TTC', W-M-80, y+5.5);
  doc.text((dv.ttc||0).toLocaleString('fr-FR')+' FCFA', W-M-2, y+5.5, {align:'right'});
  doc.setTextColor(0,0,0); y+=14;

  if(dv.acompte>0){
    doc.setFontSize(8.5); doc.setFont('helvetica','bold');
    doc.text('Acompte demandé : '+(dv.acompte||0).toLocaleString('fr-FR')+' FCFA', M, y);
    y+=6;
  }

  // Notes
  if(dv.notes){
    doc.setFontSize(8); doc.setFont('helvetica','italic');
    doc.text('Notes : '+dv.notes, M, y);
    y+=6;
  }

  // Signatures
  y = Math.max(y+8, 230);
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.rect(M, y, 80, 22); doc.rect(W-M-80, y, 80, 22);
  doc.text('Bon pour accord — Date & Signature client', M+5, y+6);
  doc.text('Établi par — Signature & Cachet', W-M-75, y+6);

  // Pied de page
  if(p.banque||p.mentions){
    var py=280; doc.setFontSize(7); doc.setTextColor(120,120,120);
    if(p.banque) doc.text('Banque : '+p.banque+(p.iban?' — '+p.iban:''), M, py);
    if(p.mentions){ var ml=doc.splitTextToSize(p.mentions,W-2*M); doc.text(ml, M, py+4); }
  }

  doc.save('Devis_'+dv.num+'_'+dv.client.replace(/\s/g,'_')+'.pdf');
};

// ══════════════════════════════════════════════════════
// GESTION DE LA PAIE — COMPLET
// ══════════════════════════════════════════════════════

// Barème IR Togo 2026 (progressif)
var BAREME_IR_TOGO = [
  {min:0,      max:900000,   taux:0,    abatt:0},
  {min:900001, max:1800000,  taux:0.05, abatt:45000},
  {min:1800001, max:3000000, taux:0.1,  abatt:135000},
  {min:3000001, max:6000000, taux:0.15, abatt:285000},
  {min:6000001, max:9999999999, taux:0.20, abatt:585000}
];

// Abattements Togo : 10% frais pro, plafond 500 000 FCFA/an
// CNSS salarié : 4% du salaire brut
// CNSS patronal : 17,5% du salaire brut
// Parts fiscales : célibataire=1, marié=2, par enfant=0.5 (plafonné à 5 parts)

function calcBulletinPaie(emp, mois, annee, primes){
  primes = primes || 0;
  var salBase   = emp.salaire || 0;
  var sursalaire= emp.sursalaire || 0;
  var indemnTrans = emp.transport || 0;
  var indemnLog   = emp.logement  || 0;
  var nbEnfants   = emp.enfants   || 0;

  // Salaire brut imposable (sans indemnités non imposables)
  var brutImposable = salBase + sursalaire + primes;
  var brutTotal     = brutImposable + indemnTrans + indemnLog;

  // CNSS salarié 4%
  var cnss_sal = Math.round(brutImposable * 0.04);
  // CNSS patronal 17.5%
  var cnss_pat = Math.round(brutImposable * 0.175);

  // Abattement frais pro 10% (plafonné à 500 000 / 12 = 41 667 FCFA/mois)
  var abattFrais = Math.min(Math.round(brutImposable * 0.10), 41667);

  // Base IR mensuelle
  var baseIR = Math.max(0, brutImposable - cnss_sal - abattFrais);

  // Calcul IR annualisé puis divisé
  var baseIRan = baseIR * 12;
  var irAnnuel = 0;
  for(var i=0; i<BAREME_IR_TOGO.length; i++){
    var tranche = BAREME_IR_TOGO[i];
    if(baseIRan >= tranche.min){
      if(baseIRan <= tranche.max){
        irAnnuel = Math.round(baseIRan * tranche.taux - tranche.abatt);
        break;
      }
    }
  }
  // Abattement parts fiscales (450 000 FCFA par part excédant 1)
  var parts = 1 + Math.min(nbEnfants * 0.5, 2); // max 3 parts
  var abattParts = Math.round((parts - 1) * 450000);
  irAnnuel = Math.max(0, irAnnuel - abattParts);
  var irMensuel = Math.round(irAnnuel / 12);

  // Net à payer
  var netPayer = brutTotal - cnss_sal - irMensuel;

  return {
    mois: mois, annee: annee,
    salBase: salBase, sursalaire: sursalaire, primes: primes,
    indemnTrans: indemnTrans, indemnLog: indemnLog,
    brutImposable: brutImposable, brutTotal: brutTotal,
    cnss_sal: cnss_sal, cnss_pat: cnss_pat,
    abattFrais: abattFrais, baseIR: baseIR,
    irMensuel: irMensuel,
    netPayer: netPayer,
    chargeEmployeur: brutTotal + cnss_pat,
    // Comptes OHADA
    cpt_salaires: '6411',
    cpt_cnss_sal: '4311',
    cpt_cnss_pat: '6413',
    cpt_ir: '4421',
    cpt_net: '422'
  };
}

function formatMoisAn(mois, an){
  var moisNoms=['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return moisNoms[mois]+(an?' '+an:'');
}

function previewBulletin(){
  var salaire = parseFloat((document.getElementById('emp-salaire')||{}).value)||0;
  if(!salaire){ document.getElementById('paie-preview').style.display='none'; return; }
  var emp = {
    salaire: salaire,
    sursalaire: parseFloat((document.getElementById('emp-sursalaire')||{}).value)||0,
    transport: parseFloat((document.getElementById('emp-transport')||{}).value)||0,
    logement: parseFloat((document.getElementById('emp-logement')||{}).value)||0,
    enfants: parseInt((document.getElementById('emp-enfants')||{}).value)||0
  };
  var b = calcBulletinPaie(emp, new Date().getMonth()+1, new Date().getFullYear(), 0);
  document.getElementById('paie-preview').style.display='block';
  document.getElementById('paie-preview-content').innerHTML = renderBulletinPreview(b);
}

function renderBulletinPreview(b){
  return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:11px">'
    +kpiPaie('Brut imposable', b.brutImposable, 'blue')
    +kpiPaie('CNSS salarié (4%)', b.cnss_sal, 'red')
    +kpiPaie('IR mensuel', b.irMensuel, 'amber')
    +kpiPaie('Net à payer', b.netPayer, 'green')
    +kpiPaie('CNSS patronal (17,5%)', b.cnss_pat, 'red')
    +kpiPaie('Charge totale employeur', b.chargeEmployeur, 'teal')
    +'</div>';
}

function kpiPaie(label, val, cls){
  return '<div style="background:var(--bg);border:2px solid var(--border);border-radius:var(--radius);padding:7px 10px;text-align:center">'
    +'<div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">'+label+'</div>'
    +'<div style="font-size:14px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--'+cls+')">'+(val||0).toLocaleString('fr-FR')+'</div>'
    +'<div style="font-size:9px;color:var(--text-faint)">FCFA</div>'
    +'</div>';
}

function ouvrirFormulaireEmploye(editIdx){
  var form = document.getElementById('paie-employe-form'); if(!form) return;
  form.style.display='block';
  form._editIdx = (editIdx!==undefined)?editIdx:null;
  if(editIdx!==undefined){
    var e = EMPLOYES_RH[editIdx];
    ['nom','matricule','poste','dept','embauche','contrat','salaire','sursalaire','transport','logement','enfants','cnss'].forEach(function(k){
      var el=document.getElementById('emp-'+k); if(el) el.value=e[k]||0;
    });
    document.getElementById('paie-form-title').textContent='Modifier — '+e.nom;
  } else {
    ['nom','matricule','poste','dept','cnss'].forEach(function(k){var el=document.getElementById('emp-'+k);if(el)el.value='';});
    document.getElementById('emp-embauche').value=new Date().toISOString().split('T')[0];
    document.getElementById('emp-contrat').value='cdi';
    ['salaire','sursalaire','transport','logement'].forEach(function(k){var el=document.getElementById('emp-'+k);if(el)el.value=0;});
    document.getElementById('emp-enfants').value=0;
    document.getElementById('paie-form-title').textContent='Nouveau dossier employé';
    document.getElementById('paie-preview').style.display='none';
  }
}

function fermerFormulaireEmploye(){
  var f=document.getElementById('paie-employe-form'); if(f)f.style.display='none';
}

function sauverEmploye(){
  var nom=(document.getElementById('emp-nom').value||'').trim();
  if(!nom){alert('Le nom est obligatoire.');return;}
  var emp={
    id:Date.now(),
    nom:nom,
    matricule:document.getElementById('emp-matricule').value||('EMP-'+String(EMPLOYES_RH.length+1).padStart(3,'0')),
    poste:document.getElementById('emp-poste').value||'',
    dept:document.getElementById('emp-dept').value||'',
    embauche:document.getElementById('emp-embauche').value||'',
    contrat:document.getElementById('emp-contrat').value||'cdi',
    salaire:parseFloat(document.getElementById('emp-salaire').value)||0,
    sursalaire:parseFloat(document.getElementById('emp-sursalaire').value)||0,
    transport:parseFloat(document.getElementById('emp-transport').value)||0,
    logement:parseFloat(document.getElementById('emp-logement').value)||0,
    enfants:parseInt(document.getElementById('emp-enfants').value)||0,
    cnss:document.getElementById('emp-cnss').value||''
  };
  var form=document.getElementById('paie-employe-form');
  if(form._editIdx!==null&&form._editIdx!==undefined) EMPLOYES_RH[form._editIdx]=emp;
  else EMPLOYES_RH.push(emp);
  saveV16();
  fermerFormulaireEmploye();
  renderPaieStats();
  renderListeEmployes();
  if(typeof ajouterNotif==='function') ajouterNotif('info','Dossier employé enregistré',nom+' — '+emp.salaire.toLocaleString('fr-FR')+' FCFA brut');
}

function renderPaieStats(){
  var el=document.getElementById('paie-stats'); if(!el) return;
  var totalBrut=0, totalNet=0, totalCNSSPat=0, totalIR=0;
  EMPLOYES_RH.forEach(function(e){
    var b=calcBulletinPaie(e, new Date().getMonth()+1, new Date().getFullYear(), 0);
    totalBrut+=b.brutTotal; totalNet+=b.netPayer; totalCNSSPat+=b.cnss_pat; totalIR+=b.irMensuel;
  });
  el.innerHTML=[
    ['👷 Effectif',EMPLOYES_RH.length+' employé(s)','blue'],
    ['💰 Masse salariale brute',totalBrut.toLocaleString('fr-FR')+' FCFA/mois','amber'],
    ['✅ Net à payer total',totalNet.toLocaleString('fr-FR')+' FCFA/mois','green'],
    ['🏛️ Charges sociales totales',(totalCNSSPat+totalIR).toLocaleString('fr-FR')+' FCFA/mois','red']
  ].map(function(k){
    return '<div style="background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center">'
      +'<div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">'+k[0]+'</div>'
      +'<div style="font-size:16px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--'+k[2]+')">'+k[1]+'</div>'
      +'</div>';
  }).join('');
}

var _bulletinCourant = null;
var _empCourantIdx = null;

function renderListeEmployes(){
  var w=document.getElementById('paie-liste-wrap'); if(!w) return;
  if(!EMPLOYES_RH.length){
    w.innerHTML='<div style="text-align:center;padding:48px;color:var(--text-faint);font-style:italic">Aucun employé. Cliquez sur "+ Nouvel employé" pour commencer.</div>';
    return;
  }
  var mois=new Date().getMonth()+1, an=new Date().getFullYear();
  var html='<div class="card"><div class="card-header"><span class="card-title">Dossiers employés — '+formatMoisAn(mois,an)+'</span></div>'
    +'<div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr style="background:var(--bg)">'
    +'<th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Employé</th>'
    +'<th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Poste</th>'
    +'<th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Brut</th>'
    +'<th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">CNSS sal.</th>'
    +'<th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">IR</th>'
    +'<th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Net</th>'
    +'<th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Charge emp.</th>'
    +'<th style="padding:8px 10px;border-bottom:2px solid var(--border)">Actions</th>'
    +'</tr></thead><tbody>';

  EMPLOYES_RH.forEach(function(e,i){
    var b=calcBulletinPaie(e, mois, an, 0);
    var contratBadge={cdi:'bg-green',cdd:'bg-amber',stage:'bg-blue',temporaire:'bg-teal'};
    html+='<tr style="border-bottom:2px solid var(--border)">'
      +'<td style="padding:8px 10px"><div style="font-weight:600">'+e.nom+'</div><div style="font-size:10px;color:var(--text-muted)">'+e.matricule+' '+badge(e.contrat.toUpperCase(),contratBadge[e.contrat]||'bg-blue')+'</div></td>'
      +'<td style="padding:8px 10px;font-size:11px;color:var(--text-muted)">'+e.poste+(e.dept?'<br><span style="font-size:10px">'+e.dept+'</span>':'')+'</td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+b.brutTotal.toLocaleString('fr-FR')+'</td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--red)">'+b.cnss_sal.toLocaleString('fr-FR')+'</td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--amber)">'+b.irMensuel.toLocaleString('fr-FR')+'</td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--green-dark)">'+b.netPayer.toLocaleString('fr-FR')+'</td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--text-muted)">'+b.chargeEmployeur.toLocaleString('fr-FR')+'</td>'
      +'<td style="padding:8px 10px"><div style="display:flex;gap:3px;flex-wrap:wrap">'
        +'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px;background:var(--blue);color:#fff;border-color:var(--blue)" onclick="voirBulletin('+i+')">📄 Bulletin</button>'
        +'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px" onclick="ouvrirFormulaireEmploye('+i+')">✏</button>'
        +'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px;color:var(--red);border-color:var(--red-border)" onclick="supprimerEmploye('+i+')">✕</button>'
      +'</div></td>'
    +'</tr>';
  });
  html+='</tbody></table></div></div>';
  w.innerHTML=html;
}

function supprimerEmploye(i){if(confirm('Supprimer ce dossier ?')){EMPLOYES_RH.splice(i,1);saveV16();renderPaieStats();renderListeEmployes();}}

function voirBulletin(i, primesExtra){
  primesExtra = primesExtra||0;
  var e=EMPLOYES_RH[i];
  var mois=new Date().getMonth()+1, an=new Date().getFullYear();
  var b=calcBulletinPaie(e, mois, an, primesExtra);
  _bulletinCourant=b; _empCourantIdx=i;

  document.getElementById('bulletin-titre').textContent='Bulletin de paie — '+e.nom+' — '+formatMoisAn(mois,an);
  document.getElementById('paie-bulletin-detail').style.display='block';

  var p=typeof PROFIL_DATA!=='undefined'?PROFIL_DATA:{};
  var html='<div style="font-family:\'Archivo\',sans-serif">'
    // Header société + employé
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">'
      +'<div style="background:var(--bg);border-radius:var(--radius);padding:10px 12px">'
        +'<div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:5px">Employeur</div>'
        +'<div style="font-size:13px;font-weight:600">'+(p.nom||'Mon Entreprise')+'</div>'
        +(p.adresse?'<div style="font-size:11px;color:var(--text-muted)">'+p.adresse+'</div>':'')
        +(p.ifu?'<div style="font-size:10.5px;color:var(--text-muted)">IFU : '+p.ifu+'</div>':'')
      +'</div>'
      +'<div style="background:var(--bg);border-radius:var(--radius);padding:10px 12px">'
        +'<div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:5px">Employé</div>'
        +'<div style="font-size:13px;font-weight:600">'+e.nom+'</div>'
        +'<div style="font-size:11px;color:var(--text-muted)">'+e.matricule+' — '+e.poste+'</div>'
        +'<div style="font-size:10.5px;color:var(--text-muted)">Contrat : '+e.contrat.toUpperCase()+' | Embauché le : '+fmtD(e.embauche)+'</div>'
        +(e.cnss?'<div style="font-size:10.5px;color:var(--text-muted)">N° CNSS : '+e.cnss+'</div>':'')
      +'</div>'
    +'</div>'
    // Tableau bulletin
    +'<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:10px">'
      +'<thead><tr style="background:var(--bg)">'
        +'<th style="padding:7px 10px;text-align:left;border-bottom:2px solid var(--border-strong);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Libellé</th>'
        +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border-strong);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Base</th>'
        +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border-strong);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Taux</th>'
        +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border-strong);font-size:10px;text-transform:uppercase;color:var(--text-muted);color:var(--green)">Gains</th>'
        +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border-strong);font-size:10px;text-transform:uppercase;color:var(--red)">Retenues</th>'
      +'</tr></thead>'
      +'<tbody>'
        +ligBulletin('Salaire de base', b.salBase, '', b.salBase, 0)
        +(b.sursalaire?ligBulletin('Sursalaire / Prime fixe', b.salBase, '', b.sursalaire, 0):'')
        +(b.primes?ligBulletin('Primes variables', '', '', b.primes, 0):'')
        +(b.indemnTrans?ligBulletin('Indemnité transport', '', 'exonérée', b.indemnTrans, 0):'')
        +(b.indemnLog?ligBulletin('Indemnité logement', '', 'exonérée', b.indemnLog, 0):'')
        +'<tr style="background:var(--amber-light);border-top:2px solid var(--amber-border)"><td colspan="3" style="padding:6px 10px;font-weight:700;font-size:11.5px">Salaire brut total</td><td style="padding:6px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--amber)">'+b.brutTotal.toLocaleString('fr-FR')+'</td><td></td></tr>'
        +'<tr style="background:var(--bg)"><td colspan="5" style="padding:4px 10px;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase">Cotisations & retenues</td></tr>'
        +ligBulletin('CNSS salarié', b.brutImposable, '4%', 0, b.cnss_sal)
        +ligBulletin('Abattement frais professionnels', b.brutImposable, '-10%', b.abattFrais, 0)
        +ligBulletin('Impôt sur le Revenu (IR Togo)', b.baseIR, 'Barème progressif', 0, b.irMensuel)
      +'</tbody>'
    +'</table>'
    // Récap net
    +'<div style="background:var(--sidebar-bg);border-radius:var(--radius);padding:14px 18px;color:#fff;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center;margin-bottom:10px">'
      +'<div><div style="font-size:10px;color:var(--sidebar-text);text-transform:uppercase;margin-bottom:3px">Brut imposable</div><div style="font-size:18px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--amber)">'+b.brutImposable.toLocaleString('fr-FR')+' FCFA</div></div>'
      +'<div><div style="font-size:10px;color:var(--sidebar-text);text-transform:uppercase;margin-bottom:3px">Total retenues</div><div style="font-size:18px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--red)">'+(b.cnss_sal+b.irMensuel).toLocaleString('fr-FR')+' FCFA</div></div>'
      +'<div><div style="font-size:10px;color:var(--sidebar-text);text-transform:uppercase;margin-bottom:3px">NET À PAYER</div><div style="font-size:22px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--green-border)">'+b.netPayer.toLocaleString('fr-FR')+' FCFA</div></div>'
    +'</div>'
    // Charges employeur
    +'<div style="background:var(--bg);border:2px solid var(--border);border-radius:var(--radius);padding:10px 14px;font-size:11px">'
      +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">Charges employeur (non perçues par l\'employé)</div>'
      +'<div style="display:flex;gap:16px;flex-wrap:wrap">'
        +'<span>CNSS patronal (17,5%) : <strong style="color:var(--red);font-family:\'Archivo\',sans-serif">'+b.cnss_pat.toLocaleString('fr-FR')+' FCFA</strong></span>'
        +'<span>Charge totale employeur : <strong style="color:var(--text);font-family:\'Archivo\',sans-serif">'+b.chargeEmployeur.toLocaleString('fr-FR')+' FCFA</strong></span>'
      +'</div>'
    +'</div>'
    // Écritures comptables
    +'<div style="margin-top:10px;background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);padding:10px 14px;font-size:11px">'
      +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">Écritures comptables générées</div>'
      +'<div style="font-family:\'Archivo\',sans-serif;font-size:10.5px;line-height:2">'
        +'D.6411 / C.422 : '+b.brutTotal.toLocaleString('fr-FR')+' FCFA — Rémunération brute<br>'
        +'D.6411 / C.4311 : '+b.cnss_sal.toLocaleString('fr-FR')+' FCFA — Retenue CNSS salarié<br>'
        +'D.6413 / C.4311 : '+b.cnss_pat.toLocaleString('fr-FR')+' FCFA — CNSS patronal<br>'
        +'D.6411 / C.4421 : '+b.irMensuel.toLocaleString('fr-FR')+' FCFA — Retenue IR<br>'
        +'D.422 / C.521 : '+b.netPayer.toLocaleString('fr-FR')+' FCFA — Versement net salaire'
      +'</div>'
    +'</div>'
  +'</div>';
  document.getElementById('bulletin-body').innerHTML=html;
}

function ligBulletin(lib, base, taux, gain, retenue){
  return '<tr style="border-bottom:2px solid var(--border)">'
    +'<td style="padding:6px 10px">'+lib+'</td>'
    +'<td style="padding:6px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-size:11px;color:var(--text-muted)">'+(base?Number(base).toLocaleString('fr-FR'):'')+'</td>'
    +'<td style="padding:6px 10px;text-align:right;font-size:11px;color:var(--text-muted)">'+taux+'</td>'
    +'<td style="padding:6px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--green-dark)">'+(gain?'+'+Number(gain).toLocaleString('fr-FR'):'')+'</td>'
    +'<td style="padding:6px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--red)">'+(retenue?'- '+Number(retenue).toLocaleString('fr-FR'):'')+'</td>'
    +'</tr>';
}

function comptabiliserBulletin(){
  if(!_bulletinCourant||_empCourantIdx===null){alert('Aucun bulletin actif.');return;}
  var b=_bulletinCourant;
  var e=EMPLOYES_RH[_empCourantIdx];
  var date=new Date().toISOString().split('T')[0];
  var num='PAY-'+date.replace(/-/g,'')+'-'+e.matricule;
  if(typeof EC==='undefined'){alert('Module journal non disponible.');return;}
  var ecritures=[
    {desc:'[Paie] Rémunération brute — '+e.nom,cptD:'6411',cptC:'422',mt:b.brutTotal},
    {desc:'[Paie] CNSS salarié 4% — '+e.nom,cptD:'422',cptC:'4311',mt:b.cnss_sal},
    {desc:'[Paie] CNSS patronal 17,5% — '+e.nom,cptD:'6413',cptC:'4311',mt:b.cnss_pat},
    {desc:'[Paie] IR retenu à la source — '+e.nom,cptD:'422',cptC:'4421',mt:b.irMensuel},
    {desc:'[Paie] Versement net salaire — '+e.nom,cptD:'422',cptC:'521',mt:b.netPayer}
  ];
  ecritures.forEach(function(ec,i){
    EC.push({date:date,num:num+'-'+(i+1),cli:e.nom,type:'achat',desc:ec.desc,
      ht:ec.mt,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'payee',
      qty:1,unite:'',produit:'',cp:0,tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',
      cptD:ec.cptD,cptC:ec.cptC,debit:ec.mt,credit:ec.mt,isTVA:false});
  });
  // Stocker dans BULLETINS
  BULLETINS.push({num:num,date:date,empId:e.id,empNom:e.nom,bulletin:b});
  saveV16();
  if(typeof sauvegarderAuto==='function')sauvegarderAuto();
  if(typeof renderJournal==='function')renderJournal();
  if(typeof calcImpot==='function')calcImpot();
  if(typeof ajouterNotif==='function')ajouterNotif('info','Bulletin comptabilisé — '+e.nom,'Net '+b.netPayer.toLocaleString('fr-FR')+' FCFA | CNSS '+b.cnss_pat.toLocaleString('fr-FR')+' FCFA | IR '+b.irMensuel.toLocaleString('fr-FR')+' FCFA → journal + IS recalculé');
  alert('✓ Bulletin de paie comptabilisé !\n5 écritures créées dans le journal :\n• Rémunération brute (D.6411)\n• CNSS salarié 4% (C.4311)\n• CNSS patronal 17,5% (D.6413)\n• IR retenu (C.4421)\n• Net versé (D.422/C.521)\n\nL\'IS a été recalculé automatiquement.');
}

function genererTouteBulletins(){
  if(!EMPLOYES_RH.length){alert('Aucun employé enregistré.');return;}
  if(!confirm('Comptabiliser les bulletins de '+EMPLOYES_RH.length+' employé(s) pour '+formatMoisAn(new Date().getMonth()+1, new Date().getFullYear())+' ?'))return;
  EMPLOYES_RH.forEach(function(e,i){
    _empCourantIdx=i;
    _bulletinCourant=calcBulletinPaie(e,new Date().getMonth()+1,new Date().getFullYear(),0);
    comptabiliserBulletin();
  });
  _bulletinCourant=null;_empCourantIdx=null;
  renderPaieStats();renderListeEmployes();
  alert('✓ Bulletins de paie de tous les employés générés et comptabilisés !');
}

function imprimerBulletin(){
  if(!_bulletinCourant||_empCourantIdx===null){alert('Aucun bulletin actif.');return;}
  var b=_bulletinCourant;
  var e=EMPLOYES_RH[_empCourantIdx];
  var p=typeof PROFIL_DATA!=='undefined'?PROFIL_DATA:{};
  var jsPDF_=window.jspdf?window.jspdf.jsPDF:window.jsPDF;
  if(!jsPDF_){alert('PDF non disponible.');return;}
  var doc=new jsPDF_({unit:'mm',format:'a4'});
  var W=210,M=14,y=20;
  var rgb=((p.couleur||'var(--accent)')).match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  var r=29,g=158,b2=117;if(rgb){r=parseInt(rgb[1],16);g=parseInt(rgb[2],16);b2=parseInt(rgb[3],16);}
  doc.setFillColor(r,g,b2);doc.rect(0,0,W,26,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont('helvetica','bold');
  doc.text(p.nom||'Mon Entreprise',M,11);
  doc.setFontSize(8);doc.setFont('helvetica','normal');
  if(p.adresse)doc.text(p.adresse,M,17);if(p.ifu)doc.text('IFU: '+p.ifu,M,22);
  doc.setFontSize(14);doc.setFont('helvetica','bold');
  doc.text('BULLETIN DE PAIE',W-M,12,{align:'right'});
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  doc.text(formatMoisAn(b.mois,b.annee),W-M,19,{align:'right'});
  doc.setTextColor(0,0,0);y=34;
  // Infos employé
  doc.setFillColor(245,247,250);doc.rect(M,y,W-2*M,16,'F');
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text(e.nom,M+3,y+6);
  doc.setFont('helvetica','normal');doc.text(e.matricule+' — '+e.poste,M+3,y+12);
  doc.text('N° CNSS : '+(e.cnss||'—'),W-M-60,y+6);
  doc.text('Contrat : '+e.contrat.toUpperCase(),W-M-60,y+12);
  y+=22;
  // Tableau
  doc.setFillColor(r,g,b2);doc.rect(M,y,W-2*M,7,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(8);doc.setFont('helvetica','bold');
  doc.text('Libellé',M+2,y+5);doc.text('Base',M+100,y+5,{align:'right'});doc.text('Taux',M+120,y+5,{align:'right'});doc.text('Gains',M+150,y+5,{align:'right'});doc.text('Retenues',W-M,y+5,{align:'right'});
  y+=7;doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');
  var rows=[
    ['Salaire de base',b.salBase,'',b.salBase,0],
    b.sursalaire?['Sursalaire',b.salBase,'',b.sursalaire,0]:null,
    b.primes?['Primes',b.salBase,'',b.primes,0]:null,
    b.indemnTrans?['Indemnité transport','','exon.',b.indemnTrans,0]:null,
    b.indemnLog?['Indemnité logement','','exon.',b.indemnLog,0]:null,
    null,// separator
    ['CNSS salarié',b.brutImposable,'4%',0,b.cnss_sal],
    ['Abattement frais pro.',b.brutImposable,'10%',b.abattFrais,0],
    ['Impôt sur le Revenu (IR)',b.baseIR,'Barème',0,b.irMensuel],
  ];
  rows.forEach(function(row){
    if(!row){doc.setDrawColor(200,200,200);doc.line(M,y,W-M,y);y+=2;return;}
    doc.setFontSize(8);
    doc.text(row[0],M+2,y+4);
    if(row[1])doc.text(Number(row[1]).toLocaleString('fr-FR'),M+100,y+4,{align:'right'});
    if(row[2])doc.text(row[2],M+120,y+4,{align:'right'});
    if(row[3])doc.text('+'+Number(row[3]).toLocaleString('fr-FR'),M+150,y+4,{align:'right'});
    if(row[4])doc.text('-'+Number(row[4]).toLocaleString('fr-FR'),W-M,y+4,{align:'right'});
    y+=6;
  });
  y+=4;
  // Net
  doc.setFillColor(r,g,b2);doc.rect(M,y,W-2*M,10,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(11);doc.setFont('helvetica','bold');
  doc.text('NET À PAYER',M+4,y+7);
  doc.text(b.netPayer.toLocaleString('fr-FR')+' FCFA',W-M-4,y+7,{align:'right'});
  y+=16;doc.setTextColor(0,0,0);doc.setFontSize(8.5);doc.setFont('helvetica','normal');
  doc.text('Charge totale employeur : '+b.chargeEmployeur.toLocaleString('fr-FR')+' FCFA (dont CNSS patronal '+b.cnss_pat.toLocaleString('fr-FR')+' FCFA)',M,y);
  y+=12;
  doc.rect(M,y,80,18);doc.rect(W-M-80,y,80,18);
  doc.setFontSize(8);doc.text('Signature employeur',M+20,y+6);doc.text('Signature employé',W-M-60,y+6);
  doc.text('(Lu et approuvé)',M+22,y+14);doc.text('(Lu et approuvé)',W-M-58,y+14);
  doc.save('Bulletin_'+e.matricule+'_'+formatMoisAn(b.mois,b.annee).replace(' ','_')+'.pdf');
}

// ── INIT v16 ───────────────────────────────────────────────
(function(){
  document.title='ComptaIA v16 — OHADA Togo';
  var footer=document.getElementById('sidebar-footer');
  if(footer)footer.textContent='ComptaIA v16 — OHADA Togo';
  // Sync EMPLOYES global for dashboard IA count
  if(typeof window !== 'undefined') window.EMPLOYES = EMPLOYES_RH;
})();
