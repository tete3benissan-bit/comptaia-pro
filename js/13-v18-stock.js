// v18: full stock management (entrees/sorties/alertes/rapport, CMUP/FIFO) - extracted from ComptaIA_Pro_original.html lines 8894-9584
// ═══════════════════════════════════════════════════════════════
// ComptaIA v18 — GESTION DE STOCK COMPLÈTE
// ═══════════════════════════════════════════════════════════════

// ── DONNÉES STOCK ENRICHIES ────────────────────────────────────
// Étend STOCKS existant avec seuil d'alerte et méthode configurable
function getStockSeuil(nom){ return (STOCKS[nom]||{}).seuilAlerte||0; }
function getStockMethode(nom){ return (STOCKS[nom]||{}).methode||'cmup'; }

function saveStockConfig(){
  // Persiste les seuils dans le localStorage existant
  try{ localStorage.setItem('v18_stock_config', JSON.stringify(
    Object.keys(STOCKS).reduce(function(acc,k){
      acc[k]={seuil:STOCKS[k].seuilAlerte||0, methode:STOCKS[k].methode||'cmup'};
      return acc;
    },{})));
  }catch(e){}
}
function loadStockConfig(){
  try{
    var cfg=JSON.parse(localStorage.getItem('v18_stock_config')||'{}');
    Object.keys(cfg).forEach(function(k){
      if(STOCKS[k]){
        STOCKS[k].seuilAlerte=cfg[k].seuil||0;
        if(cfg[k].methode) STOCKS[k].methode=cfg[k].methode;
      }
    });
  }catch(e){}
}

// ── GO() PATCH v18 ──────────────────────────────────────────────
(function(){
  var _old=window.go;
  window.go=function(id,el){
    var stockPages=['stock','stock-entrees','stock-sorties','stock-alertes','stock-rapport'];
    if(stockPages.indexOf(id)>-1){
      document.querySelectorAll('.pane').forEach(function(p){p.classList.remove('active');});
      document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
      // For stock sub-pages, use the main pane-stock or dedicated panes
      var paneId = id==='stock' ? 'pane-stock' : 'pane-'+id;
      var pane=document.getElementById(paneId);
      if(pane) pane.classList.add('active');
      if(el) el.classList.add('active');
      var pt=document.getElementById('page-title');
      var titles={'stock':'📦 Gestion de stock','stock-entrees':'⬇️ Entrées de stock','stock-sorties':'⬆️ Sorties de stock','stock-alertes':'⚠️ Alertes de stock','stock-rapport':'📊 Rapport de stock'};
      if(pt) pt.textContent=titles[id]||'Stock';
      openGrp('stock');
      loadStockConfig();
      if(id==='stock') renderStockDashboard();
      else if(id==='stock-entrees') renderStockEntrees();
      else if(id==='stock-sorties') renderStockSorties();
      else if(id==='stock-alertes') renderStockAlertes();
      else if(id==='stock-rapport') renderStockRapport();
      return;
    }
    _old(id,el);
  };
  // GRP_MAP
  if(window.GRP_MAP){
    ['stock','stock-entrees','stock-sorties','stock-alertes','stock-rapport'].forEach(function(k){window.GRP_MAP[k]='stock';});
  }
})();

// Adopt panes
(function(){
  var content=document.querySelector('.content');
  ['pane-stock-entrees','pane-stock-sorties','pane-stock-alertes','pane-stock-rapport'].forEach(function(id){
    var el=document.getElementById(id);
    if(el&&content&&el.parentElement!==content) content.appendChild(el);
  });
})();

// ── HELPERS STOCK ──────────────────────────────────────────────
function getStockAlertes(){
  return Object.keys(STOCKS).map(function(nom){
    var s=STOCKS[nom];
    var seuil=s.seuilAlerte||0;
    var pct=s.qteInit>0?Math.round(s.qteActuelle/s.qteInit*100):0;
    var niveau = s.qteActuelle===0?'rupture':seuil>0&&s.qteActuelle<=seuil?'critique':pct<=20?'faible':pct<=40?'bas':'ok';
    return {nom:nom, s:s, seuil:seuil, pct:pct, niveau:niveau};
  }).filter(function(a){return a.niveau!=='ok';});
}

function updateStockAlerteBadge(){
  var alertes=getStockAlertes();
  var badge=document.getElementById('nb-stock-alertes');
  if(badge){
    if(alertes.length>0){badge.style.display='inline-flex';badge.textContent=alertes.length;}
    else badge.style.display='none';
  }
}

// ── DASHBOARD PRINCIPAL STOCK ──────────────────────────────────
function renderStockDashboard(){
  // Use the existing pane-stock but upgrade its content
  var pane=document.getElementById('pane-stock'); if(!pane) return;
  loadStockConfig();

  var noms=Object.keys(STOCKS);
  var totalArticles=noms.length;
  var totalValeur=noms.reduce(function(a,k){var s=STOCKS[k];return a+s.qteActuelle*(s.cmup||0);},0);
  var enAlerte=getStockAlertes().length;
  var enRupture=noms.filter(function(k){return STOCKS[k].qteActuelle===0;}).length;

  updateStockAlerteBadge();

  // Rebuild pane content
  var html='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap;gap:8px">'
    +'<div><div style="font-size:15px;font-weight:600">📦 Gestion de stock</div>'
    +'<div style="font-size:11px;color:var(--text-muted)">Vue d\'ensemble — Méthodes CMUP et FIFO — Temps réel</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<button class="btn btn-sm" onclick="go(\'stock-entrees\',document.querySelector(\'[onclick*=stock-entrees]\')||null)">⬇️ Saisir entrée</button>'
      +'<button class="btn btn-sm" onclick="go(\'stock-sorties\',document.querySelector(\'[onclick*=stock-sorties]\')||null)">⬆️ Saisir sortie</button>'
      +'<button class="btn btn-primary btn-sm" onclick="ouvrirAjoutProduit()">+ Nouveau produit</button>'
    +'</div>'
  +'</div>';

  // KPIs
  html+='<div class="stock-kpi-grid">'
    +stockKpi('📦 Articles', totalArticles, 'références', 'blue')
    +stockKpi('💰 Valeur totale', totalValeur.toLocaleString('fr-FR')+' FCFA', 'en stock', 'green')
    +stockKpi('⚠️ En alerte', enAlerte, 'à réapprovisionner', 'amber')
    +stockKpi('🚫 En rupture', enRupture, 'stock épuisé', enRupture>0?'red':'teal')
  +'</div>';

  // Formulaire ajout produit
  html+='<div id="stock-add-form" style="display:none" class="card" style="margin-bottom:12px">'
    +'<div class="card-header"><span class="card-title">Nouveau produit en stock</span></div>'
    +'<div class="card-body"><div class="fgrid fg4">'
      +'<div class="fg sp2"><label>Nom du produit / Référence</label><input type="text" id="s-nom" placeholder="Ex: Tissu wax 6 yards, Ciment Portland 50kg..."/></div>'
      +'<div class="fg"><label>Unité</label><select id="s-unite"><option value="unite">Unité</option><option value="kg">Kg</option><option value="litre">Litre</option><option value="metre">Mètre</option><option value="boite">Boîte</option><option value="carton">Carton</option><option value="sac">Sac</option><option value="rouleau">Rouleau</option></select></div>'
      +'<div class="fg"><label>Méthode valorisation</label>'
        +'<select id="s-methode">'
          +'<option value="cmup">CMUP — Coût Moyen Pondéré</option>'
          +'<option value="fifo">FIFO — Premier entré, premier sorti</option>'
        +'</select>'
      +'</div>'
      +'<div class="fg"><label>Catégorie</label><input type="text" id="s-categorie" placeholder="Ex: Matières premières, Marchandises..."/></div>'
      +'<div class="fg"><label>Stock initial (qté)</label><input type="number" id="s-qte" min="0" placeholder="0" oninput="calcStockVal()"/></div>'
      +'<div class="fg"><label>Prix unitaire initial (FCFA)</label><input type="number" id="s-pu" min="0" placeholder="0" oninput="calcStockVal()"/></div>'
      +'<div class="fg"><label>Valeur initiale (auto)</label><input type="text" id="s-val" readonly style="font-weight:600;color:var(--green-dark)"/></div>'
      +'<div class="fg"><label>Seuil d\'alerte (qté min)</label><input type="number" id="s-seuil" min="0" placeholder="0" title="Notification quand le stock descend sous ce seuil"/></div>'
    +'</div>'
    +'<div style="background:var(--blue-light);border:2px solid var(--blue-border);border-radius:var(--radius);padding:8px 12px;font-size:11px;color:var(--blue);margin-top:8px">'
      +'💡 <strong>CMUP</strong> : Le coût unitaire est recalculé en moyenne à chaque entrée. '
      +'<strong>FIFO</strong> : Les premières unités entrées sont les premières sorties — idéal pour produits périssables ou avec variations de prix.'
    +'</div>'
    +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">'
      +'<button class="btn btn-sm" onclick="document.getElementById(\'stock-add-form\').style.display=\'none\'">Annuler</button>'
      +'<button class="btn btn-primary btn-sm" onclick="ajouterProduit()">✓ Créer le produit</button>'
    +'</div></div></div>';

  // Liste produits
  if(!noms.length){
    html+='<div style="text-align:center;padding:48px;color:var(--text-faint);font-style:italic">Aucun produit en stock. Cliquez sur "+ Nouveau produit" pour commencer.</div>';
  } else {
    // Filtres
    html+='<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">'
      +'<input type="text" id="stock-search" placeholder="Rechercher un produit..." style="max-width:220px;font-size:12px" oninput="filtrerStock()"/>'
      +'<select id="stock-filtre-niveau" onchange="filtrerStock()" style="max-width:160px;font-size:12px">'
        +'<option value="">Tous les niveaux</option>'
        +'<option value="ok">✅ Stock OK</option>'
        +'<option value="bas">🟡 Stock bas</option>'
        +'<option value="critique">🔴 Critique / Rupture</option>'
      +'</select>'
      +'<select id="stock-filtre-methode" onchange="filtrerStock()" style="max-width:130px;font-size:12px">'
        +'<option value="">Toutes méthodes</option>'
        +'<option value="cmup">CMUP</option>'
        +'<option value="fifo">FIFO</option>'
      +'</select>'
      +'<span style="margin-left:auto;font-size:11px;color:var(--text-muted)" id="stock-count">'+totalArticles+' produit(s)</span>'
    +'</div>';
    html+='<div id="stock-list-container">';
    html+=renderStockCards(noms);
    html+='</div>';
  }

  pane.innerHTML=html;
}

function stockKpi(label,val,sub,cls){
  return '<div class="stock-kpi"><div class="stock-kpi-label">'+label+'</div>'
    +'<div class="stock-kpi-val" style="color:var(--'+cls+')">'+val+'</div>'
    +'<div class="stock-kpi-sub">'+sub+'</div></div>';
}

function ouvrirAjoutProduit(){
  var f=document.getElementById('stock-add-form');
  if(f) f.style.display=f.style.display==='none'?'block':'none';
}

function renderStockCards(noms){
  var html='';
  noms.forEach(function(nom){
    var s=STOCKS[nom];
    var pct=s.qteInit>0?Math.round(s.qteActuelle/s.qteInit*100):0;
    var seuil=s.seuilAlerte||0;
    var barColor=s.qteActuelle===0?'var(--red)':seuil>0&&s.qteActuelle<=seuil?'var(--red)':pct<=20?'var(--red)':pct<=40?'var(--amber)':'var(--green)';
    var statusBadge=s.qteActuelle===0?'<span class="badge bg-red">Rupture</span>':seuil>0&&s.qteActuelle<=seuil?'<span class="badge bg-red">⚠ Critique</span>':pct<=40?'<span class="badge bg-amber">Faible</span>':'<span class="badge bg-green">OK</span>';
    var methodeBadge=s.methode==='fifo'?'<span class="badge bg-blue" style="font-size:9px">FIFO</span>':'<span class="badge bg-purple" style="font-size:9px">CMUP</span>';
    var valeurStock=Math.round(s.qteActuelle*(s.cmup||0));

    html+='<div class="card" style="margin-bottom:10px" data-stock-nom="'+nom+'" data-stock-niveau="'+(s.qteActuelle===0||pct<=20?'critique':pct<=40?'bas':'ok')+'" data-stock-methode="'+(s.methode||'cmup')+'">'
      +'<div class="card-header">'
        +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1">'
          +'<span style="font-size:13px;font-weight:600">'+nom+'</span>'
          +methodeBadge+statusBadge
          +(s.categorie?'<span style="font-size:10px;color:var(--text-faint)">'+s.categorie+'</span>':'')
        +'</div>'
        +'<div style="display:flex;gap:6px">'
          +'<button class="btn btn-sm" style="font-size:9px;padding:2px 7px" onclick="ouvrirEntreeRapide(\''+nom+'\')">⬇️ Entrée</button>'
          +'<button class="btn btn-sm" style="font-size:9px;padding:2px 7px" onclick="ouvrirSortieRapide(\''+nom+'\')">⬆️ Sortie</button>'
          +'<button class="btn btn-sm" style="font-size:9px;padding:2px 7px" onclick="configurerSeuil(\''+nom+'\')">⚙️ Seuil</button>'
        +'</div>'
      +'</div>'
      +'<div class="card-body" style="padding:10px 14px">'
        // Métriques principales
        +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px">'
          +metriqueStock('Stock initial', s.qteInit, s.unite, 'text-muted')
          +metriqueStock('Stock actuel', s.qteActuelle, s.unite, s.qteActuelle===0?'red':pct<=20?'red':pct<=40?'amber':'green')
          +metriqueStock('CMUP', (s.cmup||0).toLocaleString('fr-FR')+' FCFA', '', 'blue')
          +metriqueStock('Valeur stock', valeurStock.toLocaleString('fr-FR')+' FCFA', '', 'green-dark')
        +'</div>'
        // Barre de niveau
        +'<div style="margin-bottom:8px">'
          +'<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-bottom:3px">'
            +'<span>Niveau de stock</span>'
            +'<span>'+pct+'% du stock initial'+(seuil>0?' | Seuil alerte : '+seuil+' '+s.unite:'')+'</span>'
          +'</div>'
          +'<div class="stock-bar-wrap"><div class="stock-bar" style="width:'+Math.max(0,Math.min(100,pct))+'%;background:'+barColor+'"></div></div>'
        +'</div>'
        // Lots FIFO si applicable
        +(s.methode==='fifo'&&s.lots&&s.lots.length?
          '<div style="font-size:10.5px;color:var(--text-muted);margin-bottom:8px"><strong>Lots FIFO disponibles :</strong> '
          +s.lots.map(function(l){return l.qte+'×'+l.pu.toLocaleString('fr-FR')+' FCFA ('+fmtD(l.date)+')'}).join(' → ')+'</div>':''
        )
        // Historique mouvements (derniers 5)
        +(s.mvts&&s.mvts.length?
          '<div style="border-top:2px solid var(--border);padding-top:8px">'
            +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:5px">Derniers mouvements</div>'
            +'<table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:var(--bg)">'
              +'<th style="padding:4px 8px;text-align:left;border-bottom:2px solid var(--border)">Date</th>'
              +'<th style="padding:4px 8px;border-bottom:2px solid var(--border)">Op.</th>'
              +'<th style="padding:4px 8px;text-align:left;border-bottom:2px solid var(--border)">Réf.</th>'
              +'<th style="padding:4px 8px;text-align:right;border-bottom:2px solid var(--border)">Avant</th>'
              +'<th style="padding:4px 8px;text-align:right;border-bottom:2px solid var(--border)">Entrée</th>'
              +'<th style="padding:4px 8px;text-align:right;border-bottom:2px solid var(--border)">Sortie</th>'
              +'<th style="padding:4px 8px;text-align:right;border-bottom:2px solid var(--border)">Après</th>'
              +'<th style="padding:4px 8px;text-align:right;border-bottom:2px solid var(--border)">P.U.</th>'
              +'<th style="padding:4px 8px;text-align:right;border-bottom:2px solid var(--border)">Valeur</th>'
            +'</tr></thead><tbody>'
            +s.mvts.slice().reverse().slice(0,8).map(function(m){
              var badge=m.op==='Init'?'<span class="badge bg-blue" style="font-size:8px">Init</span>':m.entree>0?'<span class="badge bg-green" style="font-size:8px">Entrée</span>':'<span class="badge bg-red" style="font-size:8px">Sortie</span>';
              return '<tr style="border-bottom:2px solid var(--border)">'
                +'<td style="padding:4px 8px;font-size:10.5px">'+fmtD(m.date)+'</td>'
                +'<td style="padding:4px 8px">'+badge+'</td>'
                +'<td style="padding:4px 8px;font-size:10px;color:var(--text-muted)">'+( m.ref||'—')+'</td>'
                +'<td style="padding:4px 8px;text-align:right;font-family:\'Archivo\',sans-serif">'+(m.avant||0)+'</td>'
                +'<td class="mvt-entree" style="padding:4px 8px;text-align:right;font-family:\'Archivo\',sans-serif">'+(m.entree?'+'+m.entree:'')+'</td>'
                +'<td class="mvt-sortie" style="padding:4px 8px;text-align:right;font-family:\'Archivo\',sans-serif">'+(m.sortie?'-'+m.sortie:'')+'</td>'
                +'<td style="padding:4px 8px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:600">'+(m.apres||0)+'</td>'
                +'<td style="padding:4px 8px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--text-muted)">'+(m.pu||0).toLocaleString('fr-FR')+'</td>'
                +'<td style="padding:4px 8px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--green-dark)">'+(m.valApres||0).toLocaleString('fr-FR')+'</td>'
                +'</tr>';
            }).join('')
            +(s.mvts.length>8?'<tr><td colspan="9" style="padding:4px 8px;font-size:10px;color:var(--text-faint);font-style:italic">... et '+(s.mvts.length-8)+' autres mouvements</td></tr>':'')
            +'</tbody></table>'
          +'</div>'
          :'<div style="font-size:11px;color:var(--text-faint);font-style:italic">Aucun mouvement enregistré.</div>'
        )
      +'</div>'
    +'</div>';
  });
  return html;
}

function metriqueStock(label,val,unite,cls){
  return '<div style="text-align:center;background:var(--bg);border-radius:var(--radius);padding:8px">'
    +'<div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">'+label+'</div>'
    +'<div style="font-size:15px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--'+cls+')">'+val+(unite?' <span style="font-size:10px;font-weight:400">'+unite+'</span>':'')+'</div>'
    +'</div>';
}

function filtrerStock(){
  var search=(document.getElementById('stock-search').value||'').toLowerCase();
  var niveau=document.getElementById('stock-filtre-niveau').value;
  var methode=document.getElementById('stock-filtre-methode').value;
  var cards=document.querySelectorAll('[data-stock-nom]');
  var visible=0;
  cards.forEach(function(c){
    var nom=c.getAttribute('data-stock-nom').toLowerCase();
    var niv=c.getAttribute('data-stock-niveau');
    var met=c.getAttribute('data-stock-methode');
    var show=(!search||nom.includes(search))
      &&(!niveau||(niveau==='ok'&&niv==='ok')||(niveau==='bas'&&niv==='bas')||(niveau==='critique'&&niv==='critique'))
      &&(!methode||met===methode);
    c.style.display=show?'block':'none';
    if(show)visible++;
  });
  var ct=document.getElementById('stock-count');
  if(ct)ct.textContent=visible+' produit(s)';
}

// ── ENTRÉE RAPIDE ──────────────────────────────────────────────
function ouvrirEntreeRapide(nom){
  go('stock-entrees',document.querySelector('[onclick*="stock-entrees"]')||null);
  setTimeout(function(){
    var el=document.getElementById('se-produit'); if(el){el.value=nom;majInfosEntree();}
  },100);
}
function ouvrirSortieRapide(nom){
  go('stock-sorties',document.querySelector('[onclick*="stock-sorties"]')||null);
  setTimeout(function(){
    var el=document.getElementById('ss-produit'); if(el){el.value=nom;majInfosSortie();}
  },100);
}

// ── SEUIL D'ALERTE CONFIG ──────────────────────────────────────
function configurerSeuil(nom){
  var s=STOCKS[nom]; if(!s) return;
  var seuil=prompt('Seuil d\'alerte pour "'+nom+'" ('+s.unite+')\nStock actuel : '+s.qteActuelle+' '+s.unite+'\nEntrez la quantité minimum avant notification :', s.seuilAlerte||0);
  if(seuil===null) return;
  var val=parseFloat(seuil)||0;
  s.seuilAlerte=val;
  // Also allow changing method
  var methode=confirm('Méthode de valorisation actuelle : '+( s.methode||'cmup').toUpperCase()+'\nCliquez OK pour CMUP, Annuler pour FIFO');
  s.methode=methode?'cmup':'fifo';
  saveStockConfig();
  if(typeof sauvegarderAuto==='function') sauvegarderAuto();
  renderStockDashboard();
  updateStockAlerteBadge();
  if(typeof ajouterNotif==='function') ajouterNotif('info','Seuil configuré — '+nom,'Alerte à '+val+' '+s.unite+' | Méthode : '+s.methode.toUpperCase());
}

// ── PAGE ENTRÉES ──────────────────────────────────────────────
function renderStockEntrees(){
  var pane=document.getElementById('pane-stock-entrees'); if(!pane) return;
  var noms=Object.keys(STOCKS);
  pane.innerHTML='<div style="font-size:15px;font-weight:600;margin-bottom:14px">⬇️ Entrée en stock</div>'
    +'<div class="card" style="margin-bottom:14px">'
      +'<div class="card-header"><span class="card-title">Enregistrer une entrée de stock</span></div>'
      +'<div class="card-body"><div class="fgrid fg3">'
        +'<div class="fg sp2"><label>Produit</label><input type="text" id="se-produit" list="se-produits-list" placeholder="Sélectionner ou taper le nom..." oninput="majInfosEntree()"/>'
          +'<datalist id="se-produits-list">'+noms.map(function(n){return'<option value="'+n+'">';}).join('')+'</datalist>'
        +'</div>'
        +'<div class="fg"><label>Date</label><input type="date" id="se-date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
        +'<div class="fg"><label>Quantité entrante</label><input type="number" id="se-qty" min="0" step="0.01" placeholder="0" oninput="calcEntreeVal()"/></div>'
        +'<div class="fg"><label>Prix unitaire (FCFA)</label><input type="number" id="se-pu" min="0" placeholder="0" oninput="calcEntreeVal()"/></div>'
        +'<div class="fg"><label>Valeur totale (auto)</label><input type="text" id="se-val" readonly style="font-weight:600;color:var(--green-dark)"/></div>'
        +'<div class="fg"><label>Référence / Fournisseur</label><input type="text" id="se-ref" placeholder="Ex: BC2026-012, Ecobank..."/></div>'
        +'<div class="fg sp3" id="se-info-cmup" style="display:none"></div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">'
        +'<button class="btn btn-primary" onclick="enregistrerEntreeStock()">⬇️ Enregistrer l\'entrée</button>'
      +'</div>'
    +'</div></div>'
    +'<div id="se-recent"></div>';
  renderEntreesRecentes();
}

function majInfosEntree(){
  var nom=(document.getElementById('se-produit')||{}).value;
  var info=document.getElementById('se-info-cmup');
  if(!nom||!STOCKS[nom]){if(info)info.style.display='none';return;}
  var s=STOCKS[nom];
  if(info){
    info.style.display='block';
    info.innerHTML='<div style="background:var(--blue-light);border:2px solid var(--blue-border);border-radius:var(--radius);padding:8px 12px;font-size:11.5px;color:var(--blue)">'
      +'📦 <strong>'+nom+'</strong> — Stock actuel : <strong>'+s.qteActuelle+' '+s.unite+'</strong> | CMUP actuel : <strong>'+(s.cmup||0).toLocaleString('fr-FR')+' FCFA</strong> | Méthode : <strong>'+( s.methode||'cmup').toUpperCase()+'</strong>'
      +(s.methode==='fifo'?' | Lots FIFO : '+s.lots.length+' lot(s)':'')
      +'</div>';
  }
  if(document.getElementById('se-pu')&&!(document.getElementById('se-pu').value))
    document.getElementById('se-pu').value=s.cmup||0;
}

function calcEntreeVal(){
  var q=parseFloat((document.getElementById('se-qty')||{}).value)||0;
  var p=parseFloat((document.getElementById('se-pu')||{}).value)||0;
  var el=document.getElementById('se-val');
  if(el) el.value=Math.round(q*p).toLocaleString('fr-FR')+' FCFA';
}

function enregistrerEntreeStock(){
  var nom=(document.getElementById('se-produit').value||'').trim();
  var qty=parseFloat(document.getElementById('se-qty').value)||0;
  var pu=parseFloat(document.getElementById('se-pu').value)||0;
  var date=document.getElementById('se-date').value;
  var ref=document.getElementById('se-ref').value||'ENT-'+Date.now();
  if(!nom||!qty||!pu){alert('Produit, quantité et prix unitaire sont obligatoires.');return;}
  if(!STOCKS[nom]){alert('Produit "'+nom+'" introuvable. Ajoutez-le d\'abord depuis la vue d\'ensemble.');return;}
  mouvementStock(nom,'achat',qty,pu,date,ref);
  checkStockAlerteNotif(nom);
  saveStockConfig();
  if(typeof sauvegarderAuto==='function') sauvegarderAuto();
  document.getElementById('se-qty').value='';
  document.getElementById('se-pu').value='';
  document.getElementById('se-val').value='';
  majInfosEntree();
  renderEntreesRecentes();
  updateStockAlerteBadge();
  if(typeof ajouterNotif==='function') ajouterNotif('info','Entrée stock — '+nom,'+'+qty+' '+STOCKS[nom].unite+' à '+pu.toLocaleString('fr-FR')+' FCFA/u. Nouveau stock : '+STOCKS[nom].qteActuelle);
}

function renderEntreesRecentes(){
  var el=document.getElementById('se-recent');if(!el)return;
  var mvts=[];
  Object.keys(STOCKS).forEach(function(nom){
    (STOCKS[nom].mvts||[]).filter(function(m){return m.entree>0;}).forEach(function(m){mvts.push(Object.assign({},m,{nom:nom,unite:STOCKS[nom].unite}));});
  });
  mvts.sort(function(a,b){return b.date.localeCompare(a.date);});
  if(!mvts.length){el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text-faint);font-style:italic">Aucune entrée de stock enregistrée.</div>';return;}
  el.innerHTML='<div class="card"><div class="card-header"><span class="card-title">Historique des entrées</span></div>'
    +'<div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--bg)">'
    +'<th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Date</th>'
    +'<th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Produit</th>'
    +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Qté entrée</th>'
    +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">P.U.</th>'
    +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Valeur</th>'
    +'<th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Réf.</th>'
    +'</tr></thead><tbody>'
    +mvts.slice(0,30).map(function(m){
      return '<tr style="border-bottom:2px solid var(--border)">'
        +'<td style="padding:7px 10px;font-size:11px">'+fmtD(m.date)+'</td>'
        +'<td style="padding:7px 10px;font-weight:500">'+m.nom+'</td>'
        +'<td class="mvt-entree" style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">+'+m.entree+' '+m.unite+'</td>'
        +'<td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--text-muted)">'+(m.pu||0).toLocaleString('fr-FR')+' FCFA</td>'
        +'<td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--green-dark)">'+(m.valApres||0).toLocaleString('fr-FR')+' FCFA</td>'
        +'<td style="padding:7px 10px;font-size:11px;color:var(--text-muted)">'+( m.ref||'—')+'</td>'
        +'</tr>';
    }).join('')
    +'</tbody></table></div></div>';
}

// ── PAGE SORTIES ──────────────────────────────────────────────
function renderStockSorties(){
  var pane=document.getElementById('pane-stock-sorties'); if(!pane) return;
  var noms=Object.keys(STOCKS);
  pane.innerHTML='<div style="font-size:15px;font-weight:600;margin-bottom:14px">⬆️ Sortie de stock</div>'
    +'<div class="card" style="margin-bottom:14px">'
      +'<div class="card-header"><span class="card-title">Enregistrer une sortie de stock</span></div>'
      +'<div class="card-body"><div class="fgrid fg3">'
        +'<div class="fg sp2"><label>Produit</label><input type="text" id="ss-produit" list="ss-produits-list" placeholder="Sélectionner le produit..." oninput="majInfosSortie()"/>'
          +'<datalist id="ss-produits-list">'+noms.map(function(n){return'<option value="'+n+'">';}).join('')+'</datalist>'
        +'</div>'
        +'<div class="fg"><label>Date</label><input type="date" id="ss-date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
        +'<div class="fg"><label>Quantité sortante</label><input type="number" id="ss-qty" min="0" step="0.01" placeholder="0"/></div>'
        +'<div class="fg"><label>Motif</label><select id="ss-motif"><option value="vente">Vente client</option><option value="conso">Consommation interne</option><option value="perte">Perte / Casse</option><option value="retour">Retour fournisseur</option><option value="autre">Autre</option></select></div>'
        +'<div class="fg"><label>Référence</label><input type="text" id="ss-ref" placeholder="Ex: F2026-042, OF-003..."/></div>'
        +'<div class="fg sp3" id="ss-info" style="display:none"></div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">'
        +'<button class="btn btn-primary" onclick="enregistrerSortieStock()" style="background:var(--red);border-color:var(--red)">⬆️ Enregistrer la sortie</button>'
      +'</div>'
    +'</div></div>'
    +'<div id="ss-recent"></div>';
  renderSortiesRecentes();
}

function majInfosSortie(){
  var nom=(document.getElementById('ss-produit')||{}).value;
  var info=document.getElementById('ss-info');
  if(!nom||!STOCKS[nom]){if(info)info.style.display='none';return;}
  var s=STOCKS[nom];
  if(info){
    info.style.display='block';
    var couleur=s.qteActuelle===0?'red':s.qteActuelle<=(s.seuilAlerte||0)?'red':'blue';
    info.innerHTML='<div style="background:var(--'+couleur+'-light);border:1px solid var(--'+couleur+'-border);border-radius:var(--radius);padding:8px 12px;font-size:11.5px;color:var(--'+couleur+')">'
      +'📦 <strong>'+nom+'</strong> — Stock disponible : <strong>'+s.qteActuelle+' '+s.unite+'</strong> | CMUP : <strong>'+(s.cmup||0).toLocaleString('fr-FR')+' FCFA</strong>'
      +(s.methode==='fifo'?' | FIFO : sortie à '+( s.lots[0]?s.lots[0].pu.toLocaleString('fr-FR'):0)+' FCFA (lot le plus ancien)':'')
      +(s.qteActuelle===0?' ⚠ RUPTURE DE STOCK':'')
      +'</div>';
  }
}

function enregistrerSortieStock(){
  var nom=(document.getElementById('ss-produit').value||'').trim();
  var qty=parseFloat(document.getElementById('ss-qty').value)||0;
  var date=document.getElementById('ss-date').value;
  var motif=document.getElementById('ss-motif').value;
  var ref=document.getElementById('ss-ref').value||'SOR-'+Date.now();
  if(!nom||!qty){alert('Produit et quantité sont obligatoires.');return;}
  if(!STOCKS[nom]){alert('Produit introuvable.');return;}
  if(qty>STOCKS[nom].qteActuelle){if(!confirm('Quantité demandée ('+qty+') supérieure au stock disponible ('+STOCKS[nom].qteActuelle+'). Continuer quand même ?'))return;}
  mouvementStock(nom,'vente',qty,STOCKS[nom].cmup||0,date,ref);
  checkStockAlerteNotif(nom);
  saveStockConfig();
  if(typeof sauvegarderAuto==='function') sauvegarderAuto();
  document.getElementById('ss-qty').value='';
  majInfosSortie();
  renderSortiesRecentes();
  updateStockAlerteBadge();
  if(typeof ajouterNotif==='function') ajouterNotif('warn','Sortie stock — '+nom,'-'+qty+' '+STOCKS[nom].unite+' ('+motif+'). Stock restant : '+STOCKS[nom].qteActuelle);
}

function renderSortiesRecentes(){
  var el=document.getElementById('ss-recent');if(!el)return;
  var mvts=[];
  Object.keys(STOCKS).forEach(function(nom){
    (STOCKS[nom].mvts||[]).filter(function(m){return m.sortie>0;}).forEach(function(m){mvts.push(Object.assign({},m,{nom:nom,unite:STOCKS[nom].unite}));});
  });
  mvts.sort(function(a,b){return b.date.localeCompare(a.date);});
  if(!mvts.length){el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text-faint);font-style:italic">Aucune sortie de stock enregistrée.</div>';return;}
  el.innerHTML='<div class="card"><div class="card-header"><span class="card-title">Historique des sorties</span></div>'
    +'<div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--bg)">'
    +'<th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Date</th>'
    +'<th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Produit</th>'
    +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Qté sortie</th>'
    +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">P.U. (coût)</th>'
    +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Stock restant</th>'
    +'<th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Réf.</th>'
    +'</tr></thead><tbody>'
    +mvts.slice(0,30).map(function(m){
      return '<tr style="border-bottom:2px solid var(--border)">'
        +'<td style="padding:7px 10px;font-size:11px">'+fmtD(m.date)+'</td>'
        +'<td style="padding:7px 10px;font-weight:500">'+m.nom+'</td>'
        +'<td class="mvt-sortie" style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">-'+m.sortie+' '+m.unite+'</td>'
        +'<td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--text-muted)">'+(m.pu||0).toLocaleString('fr-FR')+' FCFA</td>'
        +'<td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+(m.apres||0)+' '+(m.unite||'')+'</td>'
        +'<td style="padding:7px 10px;font-size:11px;color:var(--text-muted)">'+( m.ref||'—')+'</td>'
        +'</tr>';
    }).join('')
    +'</tbody></table></div></div>';
}

// ── PAGE ALERTES ──────────────────────────────────────────────
function renderStockAlertes(){
  var pane=document.getElementById('pane-stock-alertes'); if(!pane) return;
  loadStockConfig();
  var alertes=Object.keys(STOCKS).map(function(nom){
    var s=STOCKS[nom];
    var seuil=s.seuilAlerte||0;
    var pct=s.qteInit>0?Math.round(s.qteActuelle/s.qteInit*100):0;
    var niveau=s.qteActuelle===0?'rupture':seuil>0&&s.qteActuelle<=seuil?'critique':pct<=20?'faible':'ok';
    return {nom:nom,s:s,seuil:seuil,pct:pct,niveau:niveau};
  });
  var enProbleme=alertes.filter(function(a){return a.niveau!=='ok';});
  var ok=alertes.filter(function(a){return a.niveau==='ok';});

  updateStockAlerteBadge();

  var html='<div style="font-size:15px;font-weight:600;margin-bottom:4px">⚠️ Alertes de stock</div>'
    +'<div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">Produits nécessitant une attention immédiate. Configurez les seuils depuis la vue d\'ensemble.</div>';

  if(!enProbleme.length){
    html+='<div style="background:var(--green-light);border:2px solid var(--green-border);border-radius:var(--radius);padding:20px;text-align:center;color:var(--green-dark);font-size:13px;margin-bottom:14px">'
      +'✅ Tous les stocks sont à un niveau satisfaisant. Aucune alerte active.'
      +'</div>';
  } else {
    html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'
      +enProbleme.map(function(a){
        var cls=a.niveau==='rupture'||a.niveau==='critique'?'alerte-critique':'alerte-faible';
        var icon=a.niveau==='rupture'?'🚫':a.niveau==='critique'?'🔴':'🟡';
        var valeurStock=Math.round(a.s.qteActuelle*(a.s.cmup||0));
        return '<div class="card '+cls+'" style="padding:12px 14px;border-radius:var(--radius)">'
          +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">'
            +'<div><div style="font-size:13px;font-weight:600">'+icon+' '+a.nom+'</div>'
            +'<div style="font-size:10px;color:var(--text-muted);margin-top:2px">'+( a.s.categorie||'Stock')+(a.s.methode?(' | '+a.s.methode.toUpperCase()):'')+'</div></div>'
            +'<button class="btn btn-sm" style="font-size:9px;padding:2px 8px;background:var(--green);color:#fff;border-color:var(--green)" onclick="ouvrirEntreeRapide(\''+a.nom+'\')">+ Entrée</button>'
          +'</div>'
          +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">'
            +'<span>Stock actuel : <strong style="font-family:\'Archivo\',sans-serif">'+a.s.qteActuelle+' '+a.s.s.unite+'</strong></span>'
            +'<span>Seuil alerte : <strong>'+( a.seuil||'—')+' '+( a.seuil?a.s.s.unite:'')+'</strong></span>'
            +'<span>% du stock init. : <strong>'+a.pct+'%</strong></span>'
            +'<span>Valeur restante : <strong>'+valeurStock.toLocaleString('fr-FR')+' FCFA</strong></span>'
          +'</div>'
          +'<div class="stock-bar-wrap" style="margin-top:8px"><div class="stock-bar" style="width:'+Math.max(0,Math.min(100,a.pct))+'%;background:'+(a.niveau==='rupture'||a.niveau==='critique'?'var(--red)':'var(--amber)')+'"></div></div>'
          +'</div>';
      }).join('')
    +'</div>';
  }

  if(ok.length){
    html+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">✅ Stocks OK ('+ok.length+')</div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">'
      +ok.map(function(a){return '<div class="alerte-ok" style="padding:8px 12px;border-radius:var(--radius);font-size:11.5px;display:flex;justify-content:space-between"><span><strong>'+a.nom+'</strong></span><span style="font-family:\'Archivo\',sans-serif;color:var(--green-dark)">'+a.s.qteActuelle+' '+a.s.s.unite+'</span></div>';}).join('')
      +'</div>';
  }
  pane.innerHTML=html;
}

// Notification automatique lors d'un mouvement de stock
function checkStockAlerteNotif(nom){
  if(!STOCKS[nom]) return;
  var s=STOCKS[nom];
  var seuil=s.seuilAlerte||0;
  if(s.qteActuelle===0){
    if(typeof ajouterNotif==='function') ajouterNotif('warn','🚫 RUPTURE DE STOCK — '+nom,'Le stock de "'+nom+'" est épuisé. Pensez à passer une commande fournisseur.');
  } else if(seuil>0 && s.qteActuelle<=seuil){
    if(typeof ajouterNotif==='function') ajouterNotif('warn','⚠️ Stock critique — '+nom,'Stock actuel ('+s.qteActuelle+' '+s.unite+') ≤ seuil d\'alerte ('+seuil+' '+s.unite+'). Réapprovisionnement recommandé.');
  }
  updateStockAlerteBadge();
}

// ── PAGE RAPPORT ──────────────────────────────────────────────
function renderStockRapport(){
  var pane=document.getElementById('pane-stock-rapport'); if(!pane) return;
  loadStockConfig();
  var noms=Object.keys(STOCKS);
  var totalValeur=0, totalEntrees=0, totalSorties=0, totalMvts=0;
  noms.forEach(function(nom){
    var s=STOCKS[nom];
    totalValeur+=s.qteActuelle*(s.cmup||0);
    s.mvts.forEach(function(m){totalEntrees+=m.entree||0;totalSorties+=m.sortie||0;totalMvts++;});
  });

  // Rotation : nb sorties / stock moyen
  var html='<div style="font-size:15px;font-weight:600;margin-bottom:14px">📊 Rapport de stock</div>';

  // KPIs
  html+='<div class="stock-kpi-grid">'
    +stockKpi('Valeur totale stock', totalValeur.toLocaleString('fr-FR')+' FCFA', noms.length+' références', 'green')
    +stockKpi('Total entrées', totalEntrees.toLocaleString('fr-FR')+' unités', 'tous articles', 'blue')
    +stockKpi('Total sorties', totalSorties.toLocaleString('fr-FR')+' unités', 'tous articles', 'amber')
    +stockKpi('Mouvements totaux', totalMvts, 'opérations', 'teal')
  +'</div>';

  // Tableau récapitulatif
  if(noms.length){
    html+='<div class="card"><div class="card-header"><span class="card-title">Récapitulatif par produit</span>'
      +'<button class="btn btn-sm" onclick="exporterStockCSV()" style="font-size:10px">📥 Export CSV</button></div>'
      +'<div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:11.5px"><thead>'
      +'<tr style="background:var(--bg)">'
      +'<th style="padding:7px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Produit</th>'
      +'<th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Méthode</th>'
      +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Stock init.</th>'
      +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Entrées</th>'
      +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Sorties</th>'
      +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Stock actuel</th>'
      +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">CMUP</th>'
      +'<th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Valeur stock</th>'
      +'<th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Statut</th>'
      +'</tr></thead><tbody>';
    noms.forEach(function(nom){
      var s=STOCKS[nom];
      var entrees=s.mvts.reduce(function(a,m){return a+(m.entree||0);},0);
      var sorties=s.mvts.reduce(function(a,m){return a+(m.sortie||0);},0);
      var valeur=Math.round(s.qteActuelle*(s.cmup||0));
      var pct=s.qteInit>0?Math.round(s.qteActuelle/s.qteInit*100):0;
      var seuil=s.seuilAlerte||0;
      var statusBadge=s.qteActuelle===0?'<span class="badge bg-red">Rupture</span>':seuil>0&&s.qteActuelle<=seuil?'<span class="badge bg-red">Critique</span>':pct<=40?'<span class="badge bg-amber">Faible</span>':'<span class="badge bg-green">OK</span>';
      html+='<tr style="border-bottom:2px solid var(--border)">'
        +'<td style="padding:7px 10px;font-weight:500">'+nom+'</td>'
        +'<td style="padding:7px 10px"><span class="badge '+(s.methode==='fifo'?'bg-blue':'bg-purple')+'" style="font-size:9px">'+(s.methode||'cmup').toUpperCase()+'</span></td>'
        +'<td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+(s.qteInit||0)+' '+s.unite+'</td>'
        +'<td class="mvt-entree" style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">+'+entrees+'</td>'
        +'<td class="mvt-sortie" style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">-'+sorties+'</td>'
        +'<td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:700">'+s.qteActuelle+' '+s.unite+'</td>'
        +'<td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--blue)">'+(s.cmup||0).toLocaleString('fr-FR')+' FCFA</td>'
        +'<td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--green-dark)">'+valeur.toLocaleString('fr-FR')+' FCFA</td>'
        +'<td style="padding:7px 10px">'+statusBadge+'</td>'
        +'</tr>';
    });
    var totalVal=noms.reduce(function(a,k){return a+Math.round(STOCKS[k].qteActuelle*(STOCKS[k].cmup||0));},0);
    html+='<tr style="background:var(--bg);font-weight:700"><td style="padding:7px 10px">TOTAL</td><td></td><td></td><td></td><td></td><td></td><td></td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:var(--green-dark)">'+totalVal.toLocaleString('fr-FR')+' FCFA</td><td></td></tr>';
    html+='</tbody></table></div></div>';
  }
  pane.innerHTML=html;
}

function exporterStockCSV(){
  var noms=Object.keys(STOCKS);
  var csv='Produit;Unité;Méthode;Stock initial;Entrées totales;Sorties totales;Stock actuel;CMUP (FCFA);Valeur stock (FCFA);Seuil alerte\n';
  noms.forEach(function(nom){
    var s=STOCKS[nom];
    var entrees=s.mvts.reduce(function(a,m){return a+(m.entree||0);},0);
    var sorties=s.mvts.reduce(function(a,m){return a+(m.sortie||0);},0);
    csv+=nom+';'+s.unite+';'+(s.methode||'cmup').toUpperCase()+';'+(s.qteInit||0)+';'+entrees+';'+sorties+';'+s.qteActuelle+';'+(s.cmup||0)+';'+Math.round(s.qteActuelle*(s.cmup||0))+';'+(s.seuilAlerte||0)+'\n';
  });
  var a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download='Stock_ComptaIA_'+new Date().toISOString().split('T')[0]+'.csv';a.click();
}

// ── INIT v18 ────────────────────────────────────────────────
(function(){
  document.title='ComptaIA v18 — OHADA Togo';
  var f=document.getElementById('sidebar-footer');if(f)f.textContent='ComptaIA v18 — OHADA Togo';
  // Update all old footer references
  ['ComptaIA v12 — OHADA Togo','ComptaIA v15 — OHADA Togo','ComptaIA v16 — OHADA Togo','ComptaIA v17 — OHADA Togo'].forEach(function(old){
    var scripts=document.querySelectorAll('script');
    // Footer is already patched by id - just ensure current is set
  });
  // Load stock config and check alerts on startup
  setTimeout(function(){
    loadStockConfig();
    updateStockAlerteBadge();
    // Check stocks on load
    Object.keys(STOCKS||{}).forEach(function(nom){ checkStockAlerteNotif(nom); });
  }, 1500);
})();
