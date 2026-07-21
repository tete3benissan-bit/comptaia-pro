// v10: injects Dashboard/Scoring/OCR/Fraude/MultiEntreprise/Benchmarks panes into DOM - extracted from ComptaIA_Pro_original.html lines 2880-3063
// Inject pane HTML dynamically
(function(){
  var content=document.querySelector('.content');

  // ─── DASHBOARD IA ───
  var pDash=document.createElement('div');
  pDash.className='pane';pDash.id='pane-dashboard';
  pDash.innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <div>
      <div style="font-size:15px;font-weight:600;color:var(--text)">Tableau de bord IA</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Analyse intelligente de votre entreprise — mis à jour en temps réel</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="refreshDashboard()">⟳ Actualiser l'analyse IA</button>
  </div>
  <div class="ai-reco" id="dash-reco">
    <div class="ai-reco-title">✦ Recommandations prioritaires de l'IA</div>
    <div style="color:rgba(168,164,159,.6);font-style:italic;font-size:12px">Cliquez sur "Actualiser l'analyse IA" pour obtenir des recommandations personnalisées.</div>
  </div>
  <div class="dash-grid" id="dash-kpis"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
    <div class="card"><div class="card-header"><span class="card-title">📈 Évolution CA mensuel</span></div><div class="card-body" style="padding:10px"><div style="position:relative;height:160px"><canvas id="dash-chart-ca" role="img" aria-label="CA mensuel"></canvas></div></div></div>
    <div class="card"><div class="card-header"><span class="card-title">📊 Répartition des charges</span></div><div class="card-body" style="padding:10px"><div style="position:relative;height:160px"><canvas id="dash-chart-charges" role="img" aria-label="Répartition charges"></canvas></div></div></div>
  </div>
  <div class="card" id="dash-alertes"><div class="card-header"><span class="card-title">🔔 Points d'attention</span></div><div class="card-body" id="dash-alertes-body"><div style="color:var(--text-faint);font-style:italic;font-size:12px">Aucune alerte — vos comptes semblent en ordre.</div></div></div>`;
  content.appendChild(pDash);

  // ─── SCORE FINANCIER ───
  var pScore=document.createElement('div');
  pScore.className='pane';pScore.id='pane-scoring';
  pScore.innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <div><div style="font-size:15px;font-weight:600">Score de santé financière</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">Évaluation automatique basée sur vos données comptables — comme un rapport d'agence de notation</div></div>
    <button class="btn btn-primary btn-sm" onclick="calculerScore()">⟳ Calculer le score</button>
  </div>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:20px;margin-bottom:16px">
    <div class="card" style="text-align:center;padding:20px">
      <canvas id="score-donut" width="160" height="160" role="img" aria-label="Score financier global"></canvas>
      <div id="score-global-val" style="font-size:36px;font-weight:700;font-family:'Archivo',sans-serif;margin:-90px 0 0">—</div>
      <div style="margin-top:80px;font-size:12px;font-weight:600" id="score-global-label">Calculez votre score</div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:4px">/100 points</div>
    </div>
    <div>
      <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--text-muted)">Détail par critère</div>
      <div id="score-details"></div>
    </div>
  </div>
  <div class="card"><div class="card-header"><span class="card-title">📋 Rapport détaillé</span></div><div class="card-body" id="score-rapport"><div style="color:var(--text-faint);font-style:italic;font-size:12px">Calculez votre score pour voir le rapport complet.</div></div></div>`;
  content.appendChild(pScore);

  // ─── OCR PHOTO ───
  var pOCR=document.createElement('div');
  pOCR.className='pane';pOCR.id='pane-ocr';
  pOCR.innerHTML=`
  <div style="margin-bottom:14px">
    <div style="font-size:15px;font-weight:600">Saisie par photo de facture</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Prenez une photo ou importez une image de facture — l'IA extrait automatiquement toutes les informations.</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div>
      <div class="ocr-drop" id="ocr-drop" onclick="document.getElementById('ocr-file').click()" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="ocr_drop(event)">
        <div style="font-size:32px;margin-bottom:8px">📷</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-muted)">Cliquez ou glissez-déposez une image</div>
        <div style="font-size:11px;color:var(--text-faint);margin-top:4px">PNG, JPG, JPEG, WebP · Max 5MB</div>
        <div style="margin-top:10px;font-size:11px;color:var(--green-dark);background:var(--green-light);padding:4px 10px;border-radius:var(--radius);display:inline-block">Prise en charge : factures, reçus, relevés</div>
      </div>
      <input type="file" id="ocr-file" accept="image/*" style="display:none" onchange="ocr_upload(event)"/>
      <img id="ocr-preview" class="ocr-preview"/>
      <div id="ocr-status" style="margin-top:10px;font-size:11.5px;color:var(--text-muted);text-align:center"></div>
    </div>
    <div>
      <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--text-muted)">Données extraites par l'IA</div>
      <div id="ocr-result" style="background:var(--bg);border:2px solid var(--border);border-radius:var(--radius);padding:14px;min-height:200px">
        <div style="color:var(--text-faint);font-style:italic;font-size:12px;text-align:center;padding-top:60px">Importez une image pour voir les données extraites ici.</div>
      </div>
      <div id="ocr-actions" style="display:none;margin-top:10px">
        <button class="btn btn-primary" onclick="ocr_appliquer()" style="width:100%">✓ Remplir le formulaire de facture avec ces données</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:14px">
    <div class="card-header"><span class="card-title">💡 Comment ça marche</span></div>
    <div class="card-body" style="font-size:12px;color:var(--text-muted);line-height:1.8">
      1. Prenez une photo claire de la facture (bien éclairée, lisible) ou scannez-la.<br>
      2. Importez l'image ci-dessus — l'IA Claude analyse automatiquement le document.<br>
      3. L'IA extrait : N° facture, date, fournisseur/client, montant HT, TVA, montant TTC.<br>
      4. Cliquez sur "Remplir le formulaire" pour pré-remplir la saisie en un clic.<br>
      5. Vérifiez et validez — <strong>gain de temps estimé : 80% par rapport à la saisie manuelle.</strong>
    </div>
  </div>`;
  content.appendChild(pOCR);

  // ─── DÉTECTION ANOMALIES / FRAUDE ───
  var pFraude=document.createElement('div');
  pFraude.className='pane';pFraude.id='pane-fraude';
  pFraude.innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <div><div style="font-size:15px;font-weight:600">Détection d'anomalies comptables</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">Analyse automatique pour détecter les erreurs, doublons et patterns inhabituels.</div></div>
    <button class="btn btn-primary btn-sm" onclick="lancerDetection()">🛡️ Lancer l'analyse</button>
  </div>
  <div class="kpi-grid kpi-grid-4" id="fraude-kpis" style="margin-bottom:14px">
    <div class="kpi" style="border-top:3px solid var(--red)"><div class="kpi-label">Anomalies critiques</div><div class="kpi-value kpi-neg" id="fr-crit">—</div><div class="kpi-sub">à corriger</div></div>
    <div class="kpi" style="border-top:3px solid var(--amber)"><div class="kpi-label">Alertes modérées</div><div class="kpi-value" id="fr-med" style="color:var(--amber)">—</div><div class="kpi-sub">à surveiller</div></div>
    <div class="kpi" style="border-top:3px solid var(--blue)"><div class="kpi-label">Points info</div><div class="kpi-value" id="fr-info" style="color:var(--blue)">—</div><div class="kpi-sub">informatifs</div></div>
    <div class="kpi" style="border-top:3px solid var(--green)"><div class="kpi-label">Score intégrité</div><div class="kpi-value kpi-pos" id="fr-score">—</div><div class="kpi-sub">/100</div></div>
  </div>
  <div id="fraude-results"><div style="text-align:center;color:var(--text-faint);padding:32px;font-style:italic">Cliquez sur "Lancer l'analyse" pour détecter les anomalies dans vos écritures.</div></div>`;
  content.appendChild(pFraude);

  // ─── MULTI-ENTREPRISES ───
  var pMulti=document.createElement('div');
  pMulti.className='pane';pMulti.id='pane-multiEntreprise';
  pMulti.innerHTML=`
  <div style="margin-bottom:14px">
    <div style="font-size:15px;font-weight:600">Gestion multi-entreprises</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Gérez plusieurs dossiers comptables dans la même application — chaque entreprise conserve ses propres données.</div>
  </div>
  <div style="display:grid;grid-template-columns:280px 1fr;gap:16px">
    <div>
      <div class="card">
        <div class="card-header"><span class="card-title">Mes entreprises</span><button class="btn btn-sm btn-primary" onclick="creerEntreprise()">+ Créer</button></div>
        <div id="entreprises-liste" style="padding:0"></div>
      </div>
      <div class="card" style="margin-top:10px">
        <div class="card-header"><span class="card-title">Import/Export dossier</span></div>
        <div class="card-body">
          <button class="btn btn-sm" onclick="exporterEntreprise()" style="width:100%;margin-bottom:6px">💾 Exporter le dossier actuel</button>
          <button class="btn btn-sm btn-primary" onclick="document.getElementById('import-co').click()" style="width:100%">📂 Importer un dossier</button>
          <input type="file" id="import-co" accept=".json" style="display:none" onchange="importerEntreprise(event)"/>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Comparaison consolidée</span></div>
      <div class="card-body" id="multi-compare">
        <div style="color:var(--text-faint);font-style:italic;font-size:12px">Ajoutez plusieurs entreprises pour voir la comparaison consolidée.</div>
      </div>
    </div>
  </div>`;
  content.appendChild(pMulti);

  // ─── BENCHMARKS SECTEUR ───
  var pBench=document.createElement('div');
  pBench.className='pane';pBench.id='pane-benchmarks';
  pBench.innerHTML=`
  <div style="margin-bottom:14px">
    <div style="font-size:15px;font-weight:600">Benchmarks sectoriels — OHADA Togo</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Comparez vos ratios avec les moyennes du secteur au Togo. Données issues des statistiques de la BCEAO et de l'UEMOA.</div>
  </div>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:14px;margin-bottom:14px">
    <div class="card">
      <div class="card-header"><span class="card-title">Votre secteur</span></div>
      <div class="card-body">
        <div class="fg" style="margin-bottom:8px"><label>Secteur d'activité</label>
          <select id="bench-secteur" onchange="renderBenchmarks()">
            <option value="commerce">Commerce de détail</option>
            <option value="negoce">Commerce de gros / négoce</option>
            <option value="services">Prestations de services</option>
            <option value="industrie">Industrie manufacturière</option>
            <option value="btp">BTP / Construction</option>
            <option value="agri">Agriculture / Agroalimentaire</option>
            <option value="transport">Transport & Logistique</option>
          </select>
        </div>
        <div class="fg"><label>Taille entreprise</label>
          <select id="bench-taille" onchange="renderBenchmarks()">
            <option value="tpe">TPE (CA < 50M FCFA)</option>
            <option value="pme">PME (50M - 500M FCFA)</option>
            <option value="eti">ETI (> 500M FCFA)</option>
          </select>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Vos ratios vs secteur</span></div>
      <div id="bench-ratios" class="card-body">Sélectionnez votre secteur et cliquez sur Calculer.</div>
    </div>
  </div>
  <div class="card"><div class="card-header"><span class="card-title">📊 Visualisation comparative</span></div><div class="card-body" style="padding:10px"><div style="position:relative;height:240px"><canvas id="bench-chart" role="img" aria-label="Benchmarks comparatifs"></canvas></div></div></div>`;
  content.appendChild(pBench);

})();
