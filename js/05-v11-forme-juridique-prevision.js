// v11: SARL/SA forme juridique logic + voice-driven business plan assistant - extracted from ComptaIA_Pro_original.html lines 3519-4276
// ═══════════════════════════════════════════
// 1. FORME JURIDIQUE — SARL vs SA
// ═══════════════════════════════════════════
var FORME_JURIDIQUE = localStorage.getItem('comptaia_fj') || 'sarl';

// Inject forme juridique selector into sidebar logo area
(function(){
  var logoDiv = document.querySelector('.logo');
  if(!logoDiv) return;
  var sel = document.createElement('div');
  sel.id = 'fj-selector-wrap';
  sel.innerHTML = `
    <div class="fj-selector" style="margin-top:8px">
      <button class="fj-btn ${FORME_JURIDIQUE==='sarl'?'fj-sarl':''}" id="fj-sarl-btn" onclick="setFormeJuridique('sarl')">SARL<small>Parts sociales</small></button>
      <button class="fj-btn ${FORME_JURIDIQUE==='sa'?'fj-sa':''}" id="fj-sa-btn" onclick="setFormeJuridique('sa')">SA<small>Actions cotées</small></button>
    </div>
    <div id="fj-banner" class="fj-banner" style="display:none"></div>`;
  logoDiv.appendChild(sel);
  applyFormeJuridique();
})();

function setFormeJuridique(fj) {
  FORME_JURIDIQUE = fj;
  localStorage.setItem('comptaia_fj', fj);
  // Update buttons
  var btnSarl = document.getElementById('fj-sarl-btn');
  var btnSa = document.getElementById('fj-sa-btn');
  if(btnSarl && btnSa) {
    btnSarl.className = 'fj-btn ' + (fj==='sarl' ? 'fj-sarl' : '');
    btnSa.className = 'fj-btn ' + (fj==='sa' ? 'fj-sa' : '');
  }
  applyFormeJuridique();
  // Update logo sub
  var sub = document.querySelector('.logo-sub');
  if(sub) {
    var nom = sub.textContent.replace(/ SARL| SA$/,'');
    sub.textContent = nom + ' ' + fj.toUpperCase();
  }
  // Recalculate IS with new form
  if(typeof calcImpot === 'function') calcImpot();
  ajouterNotif('modif', 'Forme juridique : ' + fj.toUpperCase(), fj === 'sa' ? 'SA — IS 27% + IRVM 7% sur dividendes + règles actionnaires' : 'SARL — IS 27% + règles associés standard');
}

function applyFormeJuridique() {
  var banner = document.getElementById('fj-banner');
  if(!banner) return;
  if(FORME_JURIDIQUE === 'sa') {
    banner.style.display = 'block';
    banner.style.cssText = 'display:block;padding:7px 10px;border-radius:var(--radius);font-size:10.5px;margin-top:7px;line-height:1.6;background:var(--blue-light);border:2px solid var(--blue-border);color:var(--blue)';
    banner.innerHTML = '🏢 <strong>SA</strong> — IS 27% + IRVM 7%/3% sur dividendes + Conseil d\'administration obligatoire + Capital min. 10M FCFA';
  } else {
    banner.style.display = 'block';
    banner.style.cssText = 'display:block;padding:7px 10px;border-radius:var(--radius);font-size:10.5px;margin-top:7px;line-height:1.6;background:var(--green-light);border:2px solid var(--green-border);color:var(--green-dark)';
    banner.innerHTML = '🏬 <strong>SARL</strong> — IS 27% + distribution libre aux associés + Gérance désignée + Capital libre';
  }
  // Update exercice IS section header
  var isHead = document.querySelector('#pane-exercice .card:nth-child(2) .card-header .card-title');
  if(isHead) {
    isHead.textContent = FORME_JURIDIQUE === 'sa'
      ? '🏛️ Calcul IS + IRVM — SA Togolaise (IS 27% + IRVM dividendes 7%/3%)'
      : '🏛️ Calcul IS — SARL Togolaise (27% du bénéfice imposable)';
  }
}

// Override calcImpot to handle SA vs SARL differences
var _calcImpotBase = calcImpot;
calcImpot = function() {
  _calcImpotBase();

  // SA-specific additions
  if(FORME_JURIDIQUE !== 'sa') return;

  var isCalc = window._IS_CALCULE;
  if(!isCalc) return;

  var benNet = isCalc.benImposableNet - isCalc.isTotal;
  if(benNet <= 0) return;

  // IRVM Togo : 7% personnes morales, 3% personnes physiques sur dividendes distribués
  var dividendesInput = document.getElementById('sa-dividendes');
  var dividendes = dividendesInput ? (parseFloat(dividendesInput.value)||0) : 0;
  var irvm_pm = Math.round(dividendes * 0.07);  // personnes morales
  var irvm_pp = Math.round(dividendes * 0.03);  // personnes physiques

  // Inject SA panel if not exists
  var panel = document.getElementById('sa-panel');
  if(!panel) {
    var isResultat = document.getElementById('is-resultat-final');
    if(isResultat) {
      panel = document.createElement('div');
      panel.id = 'sa-panel';
      panel.style.cssText = 'margin-top:14px;padding:14px 16px;background:var(--blue-light);border:2px solid var(--blue-border);border-radius:var(--radius)';
      isResultat.appendChild(panel);
    }
  }
  if(panel) {
    panel.innerHTML = `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--blue);margin-bottom:10px">🏢 RÉGIME SA — Impôts supplémentaires</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="background:var(--surface);border:2px solid var(--blue-border);border-radius:var(--radius);padding:10px">
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;font-weight:600;text-transform:uppercase">Résultat net après IS</div>
          <div style="font-size:18px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--green-dark)">${fmt(benNet)} FCFA</div>
          <div style="font-size:10px;color:var(--text-faint)">Distribuable aux actionnaires</div>
        </div>
        <div style="background:var(--surface);border:2px solid var(--blue-border);border-radius:var(--radius);padding:10px">
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;font-weight:600;text-transform:uppercase">Capital social minimum</div>
          <div style="font-size:18px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--blue)">10 000 000 FCFA</div>
          <div style="font-size:10px;color:var(--text-faint)">Requis par la loi togolaise</div>
        </div>
      </div>
      <div style="background:var(--surface);border:2px solid var(--blue-border);border-radius:var(--radius);padding:12px;margin-bottom:10px">
        <div style="font-size:11px;font-weight:600;color:var(--blue);margin-bottom:8px">IRVM — Impôt sur le Revenu des Valeurs Mobilières (dividendes)</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <label style="font-size:11px;color:var(--text-muted);white-space:nowrap">Dividendes à distribuer :</label>
          <input type="number" id="sa-dividendes" value="${dividendes||0}" min="0" max="${benNet}" 
            oninput="recalcIRVM()" style="max-width:160px;font-size:12px;font-family:'Archivo',sans-serif"/>
          <span style="font-size:11px;color:var(--text-muted)">FCFA (max : ${fmt(benNet)} FCFA)</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px" id="irvm-grid">
          <div style="background:var(--blue-light);border-radius:var(--radius);padding:8px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted)">IRVM Pers. Morales (7%)</div>
            <div style="font-size:14px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--blue)" id="irvm-pm">${fmt(irvm_pm)} FCFA</div>
            <div style="font-size:9px;color:var(--text-faint)">Ex: filiales, holdings</div>
          </div>
          <div style="background:var(--green-light);border-radius:var(--radius);padding:8px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted)">IRVM Pers. Physiques (3%)</div>
            <div style="font-size:14px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--green-dark)" id="irvm-pp">${fmt(irvm_pp)} FCFA</div>
            <div style="font-size:9px;color:var(--text-faint)">Ex: actionnaires individuels</div>
          </div>
          <div style="background:var(--amber-light);border-radius:var(--radius);padding:8px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted)">Dividende net reçu/action</div>
            <div style="font-size:14px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--amber)" id="irvm-net">${fmt(dividendes>0?Math.round(dividendes*0.97):0)} FCFA</div>
            <div style="font-size:9px;color:var(--text-faint)">Après IRVM 3% (pers. phys.)</div>
          </div>
        </div>
      </div>
      <div style="background:var(--surface);border:2px solid var(--blue-border);border-radius:var(--radius);padding:10px;font-size:11px">
        <div style="font-weight:600;color:var(--blue);margin-bottom:6px">Obligations spécifiques SA — Togo</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10.5px;color:var(--text-muted)">
          <div>✓ Assemblée Générale Ordinaire obligatoire (6 mois après clôture)</div>
          <div>✓ Rapport du Commissaire aux Comptes (si CA > 250M FCFA)</div>
          <div>✓ Réserve légale : 5% du bénéfice jusqu'à 20% du capital</div>
          <div>✓ IRVM retenu à la source lors du versement des dividendes</div>
          <div>✓ Déclaration annuelle à la BRVM (si cotée) ou OHADA</div>
          <div>✓ Registre des actionnaires et mouvements de titres</div>
        </div>
      </div>
      <div style="margin-top:10px;font-size:10px;color:var(--text-faint)">
        ⚖️ Source : CGI Togo Art. 88 et suivants — IRVM 7% (pers. morales) / 3% (pers. physiques) sur dividendes. IS 27% identique SARL/SA.
      </div>`;
  }
};

function recalcIRVM() {
  var inp = document.getElementById('sa-dividendes');
  var div = parseFloat((inp && inp.value))||0;
  var pmEl = document.getElementById('irvm-pm');
  var ppEl = document.getElementById('irvm-pp');
  var netEl = document.getElementById('irvm-net');
  if(pmEl) pmEl.textContent = fmt(Math.round(div*0.07)) + ' FCFA';
  if(ppEl) ppEl.textContent = fmt(Math.round(div*0.03)) + ' FCFA';
  if(netEl) netEl.textContent = fmt(Math.round(div*0.97)) + ' FCFA';
}

// ═══════════════════════════════════════════
// 2. ONGLET PRÉVISION IA (Vocal + Texte)
// ═══════════════════════════════════════════

// Nav item already in static HTML (v13)

// Create pane
(function(){
  var content = document.querySelector('.content');
  var pane = document.createElement('div');
  pane.className = 'pane';
  pane.id = 'pane-prevision';
  pane.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
    <div>
      <div style="font-size:15px;font-weight:600">Prévisions & Plan d'affaires IA</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Décrivez vos objectifs par voix ou texte — l'IA génère un plan complet avec fournisseurs, coûts, délais et projections financières.</div>
    </div>
    <button class="btn btn-sm" onclick="effacerPrevision()" style="font-size:10px">✕ Effacer</button>
  </div>
  
  <!-- Zone conversation -->
  <div class="card" style="margin-bottom:12px">
    <div class="card-header" style="background:var(--sidebar-bg)">
      <span class="card-title" style="color:#fff;font-size:12px">🔮 Assistant Prévision IA</span>
      <span style="font-size:10px;color:var(--sidebar-text)">Parlez ou tapez votre projet</span>
    </div>
    <div class="card-body" style="padding:12px">
      <div class="prev-chat" id="prev-chat">
        <div class="prev-msg-ai">
          Bonjour ! Décrivez-moi votre projet d'entreprise ou votre objectif commercial.<br><br>
          <strong>Exemples :</strong><br>
          • "Ouvrir un studio de jeu vidéo avec un budget de 50 millions FCFA d'ici 18 mois"<br>
          • "Produire 5000 pagnes par mois avec un budget de 8 millions FCFA"<br>
          • "Lancer un service de livraison à Lomé avec 3 motos pour décembre 2026"<br><br>
          Vous pouvez me parler en <strong>français</strong> ou en <strong>Ewe</strong>. Utilisez le micro ou écrivez.
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px;border-top:2px solid var(--border);padding-top:10px">
        <button class="prev-mic" id="prev-mic-btn" onclick="toggleMicro()" title="Parler">🎤</button>
        <input type="text" id="prev-input" placeholder="Décrivez votre projet ou objectif..." 
          onkeydown="if(event.key==='Enter')envoyerPrevision()" style="flex:1;font-size:12.5px"/>
        <button class="btn btn-primary" onclick="envoyerPrevision()" style="white-space:nowrap">Analyser →</button>
      </div>
      <div id="prev-mic-status" style="font-size:10px;color:var(--text-faint);text-align:center;margin-top:4px;height:14px"></div>
    </div>
  </div>

  <!-- Plan généré -->
  <div id="prev-plan-wrap" style="display:none">
    <div class="kpi-plan" id="prev-kpis">
      <div class="kpi-plan-item"><div class="kpi-plan-label">Budget total</div><div class="kpi-plan-val" id="pk-budget">—</div></div>
      <div class="kpi-plan-item"><div class="kpi-plan-label">Délai de réalisation</div><div class="kpi-plan-val" id="pk-delai">—</div></div>
      <div class="kpi-plan-item"><div class="kpi-plan-label">ROI estimé</div><div class="kpi-plan-val" id="pk-roi">—</div></div>
      <div class="kpi-plan-item"><div class="kpi-plan-label">Score faisabilité</div><div class="kpi-plan-val" id="pk-score">—</div></div>
    </div>

    <!-- Fournisseurs recommandés -->
    <div class="plan-section" id="prev-fournisseurs">
      <div class="plan-section-header" onclick="toggleSection('prev-fourn-body')">
        <span style="font-size:16px">🏭</span>
        <span style="font-size:13px;font-weight:600">Fournisseurs & prestataires recommandés</span>
        <span style="margin-left:auto;font-size:11px;color:var(--text-faint)">cliquer pour développer</span>
      </div>
      <div id="prev-fourn-body" class="plan-section-body" style="display:none">
        <div id="prev-fourn-table"></div>
      </div>
    </div>

    <!-- Chronogramme -->
    <div class="plan-section">
      <div class="plan-section-header" onclick="toggleSection('prev-chrono-body')">
        <span style="font-size:16px">📅</span>
        <span style="font-size:13px;font-weight:600">Chronogramme de réalisation</span>
        <span style="margin-left:auto;font-size:11px;color:var(--text-faint)">cliquer pour développer</span>
      </div>
      <div id="prev-chrono-body" class="plan-section-body" style="display:none">
        <div id="prev-chrono-table"></div>
      </div>
    </div>

    <!-- Budget détaillé -->
    <div class="plan-section">
      <div class="plan-section-header" onclick="toggleSection('prev-budget-body')">
        <span style="font-size:16px">💰</span>
        <span style="font-size:13px;font-weight:600">Répartition budgétaire détaillée</span>
        <span style="margin-left:auto;font-size:11px;color:var(--text-faint)">cliquer pour développer</span>
      </div>
      <div id="prev-budget-body" class="plan-section-body" style="display:none">
        <div id="prev-budget-table"></div>
        <div style="position:relative;height:200px;margin-top:14px"><canvas id="prev-chart-budget" role="img" aria-label="Répartition budgétaire"></canvas></div>
      </div>
    </div>

    <!-- Risques & opportunités -->
    <div class="plan-section">
      <div class="plan-section-header" onclick="toggleSection('prev-risques-body')">
        <span style="font-size:16px">⚡</span>
        <span style="font-size:13px;font-weight:600">Analyse risques & opportunités</span>
        <span style="margin-left:auto;font-size:11px;color:var(--text-faint)">cliquer pour développer</span>
      </div>
      <div id="prev-risques-body" class="plan-section-body" style="display:none">
        <div id="prev-risques-content"></div>
      </div>
    </div>

    <!-- Projections financières -->
    <div class="plan-section">
      <div class="plan-section-header" onclick="toggleSection('prev-proj-body')">
        <span style="font-size:16px">📈</span>
        <span style="font-size:13px;font-weight:600">Projections financières sur 3 ans</span>
        <span style="margin-left:auto;font-size:11px;color:var(--text-faint)">cliquer pour développer</span>
      </div>
      <div id="prev-proj-body" class="plan-section-body" style="display:none">
        <div id="prev-proj-table"></div>
        <div style="position:relative;height:200px;margin-top:14px"><canvas id="prev-chart-proj" role="img" aria-label="Projections financières"></canvas></div>
      </div>
    </div>

    <!-- Export -->
    <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end">
      <button class="btn btn-sm" onclick="exporterPlanPDF()">📄 Exporter en PDF</button>
      <button class="btn btn-sm btn-primary" onclick="integrerDansBudget()">📥 Intégrer dans le budget ComptaIA</button>
    </div>
  </div>`;
  content.appendChild(pane);
})();

// Microphone
var mediaRecorder = null;
var audioChunks = [];
var isRecording = false;

function toggleMicro() {
  if(isRecording) {
    stopMicro();
  } else {
    startMicro();
  }
}

function startMicro() {
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Microphone non disponible sur ce navigateur. Utilisez Chrome ou Edge.');
    return;
  }
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream) {
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = function(e) { audioChunks.push(e.data); };
    mediaRecorder.onstop = function() {
      var blob = new Blob(audioChunks, {type:'audio/webm'});
      transcribeAudio(blob);
      stream.getTracks().forEach(function(t){t.stop();});
    };
    mediaRecorder.start();
    isRecording = true;
    var btn = document.getElementById('prev-mic-btn');
    if(btn) { btn.className = 'prev-mic recording'; btn.textContent = '⏹️'; }
    document.getElementById('prev-mic-status').textContent = '🔴 Enregistrement en cours... Cliquez pour arrêter.';
  }).catch(function(err) {
    document.getElementById('prev-mic-status').textContent = 'Erreur micro : ' + err.message;
  });
}

function stopMicro() {
  if(mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    var btn = document.getElementById('prev-mic-btn');
    if(btn) { btn.className = 'prev-mic'; btn.textContent = '🎤'; }
    document.getElementById('prev-mic-status').textContent = '⏳ Transcription en cours...';
  }
}

async function transcribeAudio(blob) {
  // Convert to base64 and send to Claude for transcription
  var reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = async function() {
    var base64 = reader.result.split(',')[1];
    try {
      // Use Claude to "understand" via a text prompt since we can't do audio directly
      // Instead, activate speech recognition API
      document.getElementById('prev-mic-status').textContent = '✓ Audio capturé — utilisez la transcription navigateur.';
      // Fallback: use browser SpeechRecognition
    } catch(e) {
      document.getElementById('prev-mic-status').textContent = 'Tapez votre message ci-dessous.';
    }
  };
}

// Try browser SpeechRecognition as primary
function startSpeechRecognition() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) {
    document.getElementById('prev-mic-status').textContent = '⚠ Reconnaissance vocale non supportée. Tapez votre texte.';
    return false;
  }
  var rec = new SR();
  rec.lang = 'fr-FR';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onstart = function() {
    isRecording = true;
    var btn = document.getElementById('prev-mic-btn');
    if(btn) { btn.className = 'prev-mic recording'; btn.textContent = '⏹️'; }
    document.getElementById('prev-mic-status').textContent = '🔴 Parlez maintenant...';
  };
  rec.onresult = function(e) {
    var text = e.results[0][0].transcript;
    document.getElementById('prev-input').value = text;
    document.getElementById('prev-mic-status').textContent = '✓ "' + text + '"';
    isRecording = false;
    var btn = document.getElementById('prev-mic-btn');
    if(btn) { btn.className = 'prev-mic'; btn.textContent = '🎤'; }
    envoyerPrevision();
  };
  rec.onerror = function(e) {
    document.getElementById('prev-mic-status').textContent = 'Erreur : ' + e.error + '. Tapez votre texte.';
    isRecording = false;
    var btn = document.getElementById('prev-mic-btn');
    if(btn) { btn.className = 'prev-mic'; btn.textContent = '🎤'; }
  };
  rec.onend = function() {
    if(isRecording) { isRecording = false; var b=document.getElementById('prev-mic-btn');if(b){b.className='prev-mic';b.textContent='🎤';} }
  };
  rec.start();
  return true;
}

// Override toggleMicro to prefer SpeechRecognition
toggleMicro = function() {
  if(isRecording) {
    isRecording = false;
    var btn = document.getElementById('prev-mic-btn');
    if(btn) { btn.className = 'prev-mic'; btn.textContent = '🎤'; }
    return;
  }
  startSpeechRecognition();
};

var prevBudgetChart = null;
var prevProjChart = null;
var PREV_PLAN_DATA = null;

async function envoyerPrevision() {
  var input = document.getElementById('prev-input');
  var msg = input.value.trim();
  if(!msg) return;
  input.value = '';
  document.getElementById('prev-mic-status').textContent = '';

  // Add user message
  var chat = document.getElementById('prev-chat');
  var uDiv = document.createElement('div');
  uDiv.className = 'prev-msg-user';
  uDiv.textContent = msg;
  chat.appendChild(uDiv);

  // Add thinking indicator
  var thinking = document.createElement('div');
  thinking.className = 'prev-msg-ai';
  thinking.innerHTML = '<span style="display:flex;gap:5px;align-items:center"><span style="width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse .8s ease-in-out infinite"></span><span style="width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse .8s ease-in-out infinite;animation-delay:.16s"></span><span style="width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse .8s ease-in-out infinite;animation-delay:.32s"></span><span style="margin-left:6px;font-size:11px;color:var(--text-muted)">Génération du plan en cours...</span></span>';
  chat.appendChild(thinking);
  chat.scrollTop = chat.scrollHeight;

  // Contexte financier de l'entreprise
  var tPr=0,tCh=0;
  if(typeof EC!=='undefined') EC.concat(REGL||[]).forEach(function(e){if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA)tPr+=e.credit;if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA)tCh+=e.debit;});
  var fj = typeof FORME_JURIDIQUE!=='undefined' ? FORME_JURIDIQUE.toUpperCase() : 'SARL';
  var exercice = typeof EXERCICE!=='undefined' ? EXERCICE.annee : 2026;
  var nomEnt = (document.querySelector('.logo-sub')||{}).textContent || 'Mon Entreprise';

  var systemPrompt = `Tu es un expert en stratégie d'entreprise, financement et planification pour les PME africaines (Togo/UEMOA). Tu connais parfaitement le marché togolais, les prix locaux en FCFA, les fournisseurs régionaux et les réalités économiques d'Afrique de l'Ouest.

Entreprise : ${nomEnt} (${fj}) | Exercice : ${exercice} | CA actuel : ${Math.round(tPr).toLocaleString('fr-FR')} FCFA | Charges : ${Math.round(tCh).toLocaleString('fr-FR')} FCFA

L'utilisateur va décrire un projet ou objectif. Tu dois générer un plan d'affaires COMPLET et ACTIONNABLE en JSON strict.

Format de réponse — JSON UNIQUEMENT, aucun autre texte :
{
  "resume": "2-3 phrases résumant le projet",
  "kpis": {
    "budget_total": "montant FCFA",
    "delai": "ex: 12 mois",
    "roi_estime": "ex: 35%",
    "score_faisabilite": "ex: 78/100"
  },
  "fournisseurs": [
    {
      "categorie": "ex: Équipement principal",
      "nom": "Nom fournisseur réel ou plausible",
      "localisation": "Ville, Pays",
      "description": "Ce qu'il fournit exactement",
      "prix_estime": "montant FCFA",
      "justification": "Pourquoi ce choix (prix, qualité, délai, proximité)",
      "contact_type": "Site web / marché local / importateur",
      "image_search_query": "requête pour trouver image de ce produit/service"
    }
  ],
  "chronogramme": [
    {"phase": "Phase 1 — Nom", "duree": "ex: Mois 1-2", "actions": "Description des actions", "cout": "montant FCFA", "livrable": "Ce qui est produit"}
  ],
  "budget_repartition": [
    {"poste": "Nom du poste", "montant": 0, "pourcentage": 0, "details": "Justification"}
  ],
  "projections": [
    {"periode": "Année 1", "ca": 0, "charges": 0, "resultat": 0, "effectif": 0}
  ],
  "risques": [
    {"type": "Risque", "niveau": "Élevé/Moyen/Faible", "mitigation": "Comment l'éviter"}
  ],
  "opportunites": [
    {"titre": "Opportunité", "impact": "Description de l'impact positif"}
  ],
  "conseil_expert": "Conseil stratégique de 3-4 phrases personnalisé pour ce projet au Togo"
}

Sois TRÈS précis sur les prix en FCFA. Cite des fournisseurs réels ou très plausibles pour le marché togolais/ouest-africain. Tout doit être concret et actionnable.`;

  try {
    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{role: 'user', content: msg}]
      })
    });
    var data = await resp.json();
    var text = ((data.content && data.content[0]) ? data.content[0].text : '') || '{}';
    var clean = text.replace(/```json|```/g,'').trim();
    var plan = JSON.parse(clean);
    PREV_PLAN_DATA = plan;

    // Update thinking with summary
    thinking.innerHTML = `<strong>✓ Plan généré !</strong> ${plan.resume || ''}<br><span style="font-size:10px;color:var(--text-faint);margin-top:4px;display:block">Consultez les sections ci-dessous pour le plan complet.</span>`;

    // Render plan
    renderPrevisionPlan(plan);
    document.getElementById('prev-plan-wrap').style.display = 'block';

  } catch(err) {
    thinking.innerHTML = '⚠ Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
    thinking.style.cssText = 'background:var(--red-light);border:2px solid var(--red-border);border-radius:var(--radius);padding:11px 14px;font-size:12px;color:var(--red)';
  }
  chat.scrollTop = chat.scrollHeight;
}

function renderPrevisionPlan(plan) {
  // KPIs
  var k = plan.kpis || {};
  document.getElementById('pk-budget').textContent = k.budget_total || '—';
  document.getElementById('pk-delai').textContent = k.delai || '—';
  document.getElementById('pk-roi').textContent = k.roi_estime || '—';
  document.getElementById('pk-score').textContent = k.score_faisabilite || '—';

  // Fournisseurs
  var fourn = plan.fournisseurs || [];
  document.getElementById('prev-fourn-table').innerHTML = fourn.length ? `
    <table class="plan-table">
      <thead><tr><th>Catégorie</th><th>Fournisseur</th><th>Localisation</th><th>Ce qu'il fournit</th><th>Prix estimé</th><th>Pourquoi ce choix</th></tr></thead>
      <tbody>${fourn.map(function(f){return `<tr>
        <td><span class="badge bg-blue" style="font-size:9px">${f.categorie||'—'}</span></td>
        <td style="font-weight:600">${f.nom||'—'}</td>
        <td style="font-size:10.5px;color:var(--text-muted)">📍 ${f.localisation||'—'}</td>
        <td style="font-size:10.5px">${f.description||'—'}</td>
        <td style="font-family:'Archivo',sans-serif;font-weight:600;color:var(--amber);white-space:nowrap">${f.prix_estime||'—'}</td>
        <td style="font-size:10.5px;color:var(--text-muted)">${f.justification||'—'}</td>
      </tr>`;}).join('')}</tbody>
    </table>` : '<div style="color:var(--text-faint);font-style:italic;font-size:12px">Aucun fournisseur identifié.</div>';
  document.getElementById('prev-fourn-body').style.display = 'block';

  // Chronogramme
  var chrono = plan.chronogramme || [];
  document.getElementById('prev-chrono-table').innerHTML = chrono.length ? `
    <table class="plan-table">
      <thead><tr><th>Phase</th><th>Durée</th><th>Actions à mener</th><th>Coût</th><th>Livrable</th></tr></thead>
      <tbody>${chrono.map(function(c,i){return`<tr style="${i%2===0?'background:var(--bg)':''}">
        <td><strong style="color:var(--green-dark)">${c.phase||'—'}</strong></td>
        <td><span class="badge bg-teal" style="font-size:9px;white-space:nowrap">${c.duree||'—'}</span></td>
        <td style="font-size:10.5px">${c.actions||'—'}</td>
        <td style="font-family:'Archivo',sans-serif;font-weight:600;color:var(--amber);white-space:nowrap">${c.cout||'—'}</td>
        <td style="font-size:10.5px;color:var(--green-dark)">${c.livrable||'—'}</td>
      </tr>`;}).join('')}</tbody>
    </table>` : '';
  document.getElementById('prev-chrono-body').style.display = 'block';

  // Budget répartition
  var budg = plan.budget_repartition || [];
  var totalBudg = budg.reduce(function(a,b){return a+(b.montant||0);},0);
  document.getElementById('prev-budget-table').innerHTML = budg.length ? `
    <table class="plan-table">
      <thead><tr><th>Poste de dépense</th><th style="text-align:right">Montant (FCFA)</th><th style="text-align:right">%</th><th>Justification</th></tr></thead>
      <tbody>${budg.map(function(b){
        var pct = totalBudg>0?Math.round((b.montant||0)/totalBudg*100):(b.pourcentage||0);
        return`<tr><td style="font-weight:500">${b.poste||'—'}</td>
          <td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:600">${(b.montant||0).toLocaleString('fr-FR')}</td>
          <td style="text-align:right">
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
              <div style="width:50px;height:6px;background:var(--bg);border-radius:var(--radius);overflow:hidden;border:2px solid var(--border)"><div style="height:100%;width:${pct}%;background:var(--green);border-radius:var(--radius)"></div></div>
              <span style="font-size:10.5px">${pct}%</span>
            </div>
          </td>
          <td style="font-size:10.5px;color:var(--text-muted)">${b.details||'—'}</td></tr>`;
      }).join('')}
      <tr class="tot-row"><td>TOTAL</td><td style="text-align:right">${totalBudg.toLocaleString('fr-FR')}</td><td style="text-align:right">100%</td><td></td></tr>
      </tbody>
    </table>` : '';
  document.getElementById('prev-budget-body').style.display = 'block';

  // Graphique budget
  if(prevBudgetChart) prevBudgetChart.destroy();
  var ctxB = document.getElementById('prev-chart-budget');
  if(ctxB && budg.length) {
    prevBudgetChart = new Chart(ctxB, {
      type: 'doughnut',
      data: {
        labels: budg.map(function(b){return b.poste||''}),
        datasets: [{data: budg.map(function(b){return b.montant||0;}), backgroundColor:['var(--accent)','#33506d','#BA7517','#E24B4A','#6D28D9','#0891B2','#D85A30','#059669'], borderWidth:0}]
      },
      options: {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{boxWidth:10,font:{size:10}}}}}
    });
  }

  // Projections
  var proj = plan.projections || [];
  document.getElementById('prev-proj-table').innerHTML = proj.length ? `
    <table class="plan-table">
      <thead><tr><th>Période</th><th style="text-align:right">CA estimé</th><th style="text-align:right">Charges</th><th style="text-align:right">Résultat</th><th style="text-align:right">Effectif</th></tr></thead>
      <tbody>${proj.map(function(p){
        var res=p.resultat||(p.ca||0)-(p.charges||0);
        return`<tr><td style="font-weight:600">${p.periode||'—'}</td>
          <td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--green)">${(p.ca||0).toLocaleString('fr-FR')}</td>
          <td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--red)">${(p.charges||0).toLocaleString('fr-FR')}</td>
          <td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:600;color:${res>=0?'var(--green)':'var(--red)'}">${res.toLocaleString('fr-FR')}</td>
          <td style="text-align:right">${p.effectif||'—'}</td></tr>`;
      }).join('')}</tbody>
    </table>` : '';
  document.getElementById('prev-proj-body').style.display = 'block';

  // Graphique projections
  if(prevProjChart) prevProjChart.destroy();
  var ctxP = document.getElementById('prev-chart-proj');
  if(ctxP && proj.length) {
    prevProjChart = new Chart(ctxP, {
      type: 'bar',
      data: {
        labels: proj.map(function(p){return p.periode||''}),
        datasets: [
          {label:'CA', data:proj.map(function(p){return p.ca||0;}), backgroundColor:'rgba(var(--accent-rgb),.7)', borderRadius:4},
          {label:'Charges', data:proj.map(function(p){return p.charges||0;}), backgroundColor:'rgba(226,75,74,.6)', borderRadius:4},
          {label:'Résultat', data:proj.map(function(p){return p.resultat||(p.ca||0)-(p.charges||0);}), type:'line', borderColor:'#BA7517', backgroundColor:'rgba(186,117,23,.1)', borderWidth:2, pointRadius:4, fill:true}
        ]
      },
      options: {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:10,font:{size:10}}}},scales:{y:{ticks:{callback:function(v){return (v/1000).toFixed(0)+'K';}}}}}
    });
  }

  // Risques & opportunités
  var risques = plan.risques || [];
  var opps = plan.opportunites || [];
  var rc = '';
  if(risques.length) {
    rc += '<div style="font-size:11px;font-weight:600;margin-bottom:8px;color:var(--red)">⚠ Risques identifiés</div>';
    rc += risques.map(function(r){
      var cl = r.niveau==='Élevé'?'anomalie-haute':r.niveau==='Moyen'?'anomalie-moyenne':'anomalie-faible';
      return`<div class="anomalie-row ${cl}" style="margin-bottom:6px">
        <div style="flex:1"><div style="font-size:12px;font-weight:600">${r.type||'—'}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">Mitigation : ${r.mitigation||'—'}</div></div>
        <span style="font-size:9px;font-weight:600;padding:2px 6px;border-radius:var(--radius);background:${r.niveau==='Élevé'?'var(--red)':r.niveau==='Moyen'?'var(--amber)':'var(--blue)'};color:#fff;white-space:nowrap">${r.niveau||'—'}</span>
      </div>`;
    }).join('');
  }
  if(opps.length) {
    rc += '<div style="font-size:11px;font-weight:600;margin:12px 0 8px;color:var(--green-dark)">✓ Opportunités à saisir</div>';
    rc += opps.map(function(o){
      return`<div style="background:var(--green-light);border:2px solid var(--green-border);border-radius:var(--radius);padding:8px 12px;margin-bottom:6px;display:flex;gap:8px"><span style="font-size:14px">🚀</span><div><div style="font-size:12px;font-weight:600;color:var(--green-dark)">${o.titre||'—'}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">${o.impact||'—'}</div></div></div>`;
    }).join('');
  }
  if(plan.conseil_expert) {
    rc += `<div style="margin-top:12px;background:var(--sidebar-bg);border-radius:var(--radius);padding:14px 16px;color:#fff"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--green-border);margin-bottom:6px">✦ Conseil de l'expert</div><div style="font-size:12px;line-height:1.7;color:rgba(255,255,255,.85)">${plan.conseil_expert}</div></div>`;
  }
  document.getElementById('prev-risques-content').innerHTML = rc;
  document.getElementById('prev-risques-body').style.display = 'block';
}

function toggleSection(id) {
  var el = document.getElementById(id);
  if(!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function effacerPrevision() {
  document.getElementById('prev-chat').innerHTML = '<div class="prev-msg-ai">Bonjour ! Décrivez votre projet pour obtenir un plan complet.</div>';
  document.getElementById('prev-plan-wrap').style.display = 'none';
  PREV_PLAN_DATA = null;
  if(prevBudgetChart){prevBudgetChart.destroy();prevBudgetChart=null;}
  if(prevProjChart){prevProjChart.destroy();prevProjChart=null;}
}

function integrerDansBudget() {
  if(!PREV_PLAN_DATA || !PREV_PLAN_DATA.budget_repartition) { alert('Aucun plan à intégrer.'); return; }
  var cnt = 0;
  PREV_PLAN_DATA.budget_repartition.forEach(function(b) {
    if(b.poste && b.montant > 0) {
      if(typeof BUDGETS !== 'undefined') {
        BUDGETS.push({cpt: '6999', nom: '[Prév] ' + b.poste, budget: b.montant});
        cnt++;
      }
    }
  });
  if(typeof renderBudget === 'function') renderBudget();
  if(typeof sauvegarderAuto === 'function') sauvegarderAuto();
  alert('✓ ' + cnt + ' postes budgétaires intégrés dans le module Budget de ComptaIA.');
}

function exporterPlanPDF() {
  if(!PREV_PLAN_DATA) { alert('Aucun plan à exporter.'); return; }
  if(typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') { alert('PDF non disponible hors ligne.'); return; }
  var jsPDF_ = window.jspdf ? window.jspdf.jsPDF : jsPDF;
  var doc = new jsPDF_({orientation:'portrait',unit:'mm',format:'a4'});
  var W=210, M=14, y=20, LH=6;
  function chkY(h){if(y+h>280){doc.addPage();y=20;}}

  // Header
  doc.setFillColor(13,31,26);doc.rect(0,0,W,28,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');
  doc.text('ComptaIA — Plan d\'affaires IA',M,12);
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  doc.text(((document.querySelector('.logo-sub')||{}).textContent||'Mon Entreprise') + ' | ' + ((PREV_PLAN_DATA && PREV_PLAN_DATA.kpis ? PREV_PLAN_DATA.kpis.budget_total : 'Budget N/A')), M, 20);
  doc.text('Généré le ' + new Date().toLocaleDateString('fr-FR'), W-M, 25, {align:'right'});
  doc.setTextColor(0,0,0); y=36;

  // Résumé
  doc.setFontSize(11);doc.setFont('helvetica','bold');doc.text('Résumé du projet',M,y);y+=6;
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  var resumeLines = doc.splitTextToSize(PREV_PLAN_DATA.resume||'',W-2*M);
  doc.text(resumeLines,M,y);y+=resumeLines.length*4+6;

  // KPIs
  var k=PREV_PLAN_DATA.kpis||{};
  chkY(20);
  doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('Indicateurs clés',M,y);y+=5;
  doc.setFontSize(8.5);doc.setFont('helvetica','normal');
  [['Budget total',k.budget_total],['Délai',k.delai],['ROI estimé',k.roi_estime],['Faisabilité',k.score_faisabilite]].forEach(function(kv){
    doc.text(kv[0]+' : '+kv[1],M+3,y);y+=5;
  });y+=3;

  // Fournisseurs
  var fourn=PREV_PLAN_DATA.fournisseurs||[];
  if(fourn.length){
    chkY(20);doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('Fournisseurs recommandés',M,y);y+=6;
    fourn.forEach(function(f){
      chkY(LH*3);
      doc.setFontSize(8.5);doc.setFont('helvetica','bold');doc.text('['+f.categorie+'] '+f.nom,M+2,y+3);
      doc.setFont('helvetica','normal');doc.text(f.localisation+' — '+f.prix_estime,M+2,y+8);
      doc.setTextColor(80,80,80);doc.text(doc.splitTextToSize(f.justification||'',W-2*M-6),M+6,y+13);
      doc.setTextColor(0,0,0);doc.setDrawColor(220,220,220);doc.line(M,y+LH*3,W-M,y+LH*3);y+=LH*3;
    });
  }

  // Budget
  var budg=PREV_PLAN_DATA.budget_repartition||[];
  if(budg.length){
    chkY(20);doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('Répartition budgétaire',M,y);y+=6;
    budg.forEach(function(b){
      chkY(LH);doc.setFontSize(8.5);doc.setFont('helvetica','normal');
      doc.text(b.poste||'—',M+2,y+3);doc.text((b.montant||0).toLocaleString('fr-FR')+' FCFA',W-M,y+3,{align:'right'});
      y+=LH;
    });
  }

  // Conseil
  if(PREV_PLAN_DATA.conseil_expert){
    chkY(20);doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('Conseil expert',M,y);y+=6;
    doc.setFontSize(8.5);doc.setFont('helvetica','italic');
    doc.text(doc.splitTextToSize(PREV_PLAN_DATA.conseil_expert,W-2*M),M,y);
  }

  doc.save('Plan_Affaires_ComptaIA_' + new Date().toISOString().split('T')[0] + '.pdf');
}

// Patch go() for new panes
// _go11 neutralized — unified go() v12 handles all navigation

// Final version badge
document.title = 'ComptaIA v12 — OHADA Togo';
document.querySelector('.sidebar-footer').textContent = 'ComptaIA v12 — OHADA Togo';
applyFormeJuridique();
