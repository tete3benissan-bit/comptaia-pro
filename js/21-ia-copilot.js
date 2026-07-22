// ═══ CHAT IA — COPILOTE INTELLIGENT (Phase 1) ═══
// Moteur central d'analyse : interroge en temps réel les vraies données de
// l'app (écritures EC/REGL, stock STOCKS, RH) pour construire un contexte
// FACTUEL, puis (si une clé API est configurée) demande à Claude de le
// rédiger en langage naturel. Sans clé, une réponse structurée basée sur
// les mêmes données réelles est affichée à la place — jamais de chiffres
// inventés dans un cas comme dans l'autre.
//
// Couvre en Phase 1 : analyse comptable (§1), détection d'écarts (§2),
// analyse commerciale (§6), quelques ratios financiers (§7), analyse stock
// (§8), diagnostic global (§10). Les simulations prévisionnelles chiffrées
// avec graphiques (§3, §4, §5, §12) et la génération de rapports (§11) ne
// sont pas encore couvertes — c'est un chantier séparé, plus lourd.

var IA_COPILOT_HIST = [];

// Voir js/20-user-management.js pour le pourquoi : esc() n'est pas fiable
// en tant que dépendance cross-fichier, donc redéfinie localement ici aussi.
if(typeof window.esc!=='function'){
  window.esc=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');};
}
var esc=window.esc;

/* ── 1. Moteur d'analyse : lit les vraies données, ne calcule rien qui ne soit pas dans EC/REGL/STOCKS/RH ── */

function iaRole(){ return (window.CURRENT_USER && CURRENT_USER.role) || 'lecture'; }

function iaAnalyserBilan(){
  var actif={}, passif={};
  var aList=['571','521','4111','4452','4453','4454','4455','3111','6011'];
  var pList=['7011','7061','401','4431','110','119','1301','1302','12'];
  (window.EC||[]).concat(window.REGL||[]).forEach(function(e){
    if(aList.indexOf(e.cptD)>-1)actif[e.cptD]=(actif[e.cptD]||0)+e.debit;
    if(aList.indexOf(e.cptC)>-1)actif[e.cptC]=(actif[e.cptC]||0)-e.credit;
    if(pList.indexOf(e.cptC)>-1)passif[e.cptC]=(passif[e.cptC]||0)+e.credit;
    if(pList.indexOf(e.cptD)>-1)passif[e.cptD]=(passif[e.cptD]||0)-e.debit;
  });
  var tA=0,tP=0;
  Object.keys(actif).forEach(function(k){tA+=Math.abs(actif[k]);});
  Object.keys(passif).forEach(function(k){tP+=Math.abs(passif[k]);});
  return {actif:actif,passif:passif,totalActif:tA,totalPassif:tP,ecart:tA-tP,equilibre:Math.abs(tA-tP)<1};
}

function iaAnalyserCompte(numeroCompte){
  var tous=(window.EC||[]).concat(window.REGL||[]);
  var mvts=tous.filter(function(e){return e.cptD===numeroCompte||e.cptC===numeroCompte;});
  var totalDebit=0,totalCredit=0;
  mvts.forEach(function(e){ if(e.cptD===numeroCompte)totalDebit+=e.debit||0; if(e.cptC===numeroCompte)totalCredit+=e.credit||0; });
  return {
    compte:numeroCompte, nom:(window.NOMS&&NOMS[numeroCompte])||'compte non répertorié',
    nbMouvements:mvts.length,
    mouvements:mvts.slice(-15).map(function(e){return {date:e.date,desc:e.desc,cli:e.cli||'',num:e.num,debit:e.cptD===numeroCompte?e.debit:0,credit:e.cptC===numeroCompte?e.credit:0,statut:e.stat};}),
    totalDebit:totalDebit, totalCredit:totalCredit, solde:totalDebit-totalCredit
  };
}

function iaMeilleursClients(){
  var parClient={};
  var aujourdhui=new Date().toISOString().slice(0,10);
  (window.EC||[]).concat(window.REGL||[]).forEach(function(e){
    if(!e.cli||e.isTVA||e.isAvance)return;
    if(!(e.type==='vente'||e.type==='service'))return;
    if(!parClient[e.cli])parClient[e.cli]={ca:0,factures:0,retards:0};
    parClient[e.cli].ca += (e.ttc||e.credit||0);
    parClient[e.cli].factures++;
    if(e.stat==='attente' && e.echeance && e.echeance<aujourdhui) parClient[e.cli].retards++;
  });
  var liste=Object.keys(parClient).map(function(c){return Object.assign({client:c},parClient[c]);});
  liste.sort(function(a,b){return b.ca-a.ca;});
  return liste;
}

function iaAnalyseStock(){
  var STOCKS_=window.STOCKS||{};
  var noms=Object.keys(STOCKS_);
  var aujourdhui=new Date();
  return noms.map(function(nom){
    var s=STOCKS_[nom];
    var mvts=s.mvts||[];
    var totalSorties=mvts.reduce(function(a,m){return a+(m.sortie||0);},0);
    var derniereSortie=null;
    for(var i=mvts.length-1;i>=0;i--){ if(mvts[i].sortie>0){derniereSortie=mvts[i].date;break;} }
    var joursDepuisVente=derniereSortie?Math.round((aujourdhui-new Date(derniereSortie))/86400000):null;
    return {
      nom:nom, qteActuelle:s.qteActuelle||0, seuil:s.seuilAlerte||0, unite:s.unite||'',
      cmup:s.cmup||0, valeurImmobilisee:Math.round((s.qteActuelle||0)*(s.cmup||0)),
      totalVendu:totalSorties, joursDepuisDerniereVente:joursDepuisVente,
      enAlerte:s.seuilAlerte>0 && s.qteActuelle<=s.seuilAlerte
    };
  });
}

function iaResultatCourant(){
  var tPr=0,tCh=0;
  (window.EC||[]).concat(window.REGL||[]).forEach(function(e){
    if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA)tPr+=e.credit||0;
    if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA)tCh+=e.debit||0;
  });
  return {produits:tPr,charges:tCh,resultat:tPr-tCh};
}

function iaEffectifRH(){
  if(!window.RH||!RH.emp)return null;
  var actifs=RH.emp.filter(function(e){return e.statut!=='parti';});
  return {
    effectifTotal:RH.emp.length, effectifActif:actifs.length,
    masseSalariale: iaRole()==='admin' ? actifs.reduce(function(s,e){return s+(e.salaire||0);},0) : null
  };
}

/* ── 2. Construction du contexte factuel envoyé à l'IA (ou affiché tel quel sans clé) ── */

function iaConstruireContexte(question){
  var q=(question||'').toLowerCase();
  var lignes=[];
  var res=iaResultatCourant();
  var bilan=iaAnalyserBilan();
  lignes.push('Exercice : '+(window.EXERCICE?EXERCICE.annee:'—'));
  lignes.push('Produits (classe 7) : '+fmt(res.produits)+' FCFA | Charges (classe 6) : '+fmt(res.charges)+' FCFA | Résultat : '+fmt(res.resultat)+' FCFA ('+(res.resultat>=0?'bénéfice':'déficit')+')');
  lignes.push('Bilan — Total Actif : '+fmt(bilan.totalActif)+' FCFA | Total Passif : '+fmt(bilan.totalPassif)+' FCFA | '+(bilan.equilibre?'Équilibré':'Écart de '+fmt(Math.abs(bilan.ecart))+' FCFA'));
  if(window.SOLDES) lignes.push('Trésorerie — Caisse : '+fmt(SOLDES.caisse)+' FCFA | Banque : '+fmt(SOLDES.banque)+' FCFA');
  if(window._IS_CALCULE) lignes.push('Impôt sur les sociétés (IS) calculé : '+fmt(_IS_CALCULE.isTotal)+' FCFA (27% du bénéfice imposable net de '+fmt(_IS_CALCULE.benImposableNet)+' FCFA)');
  if(window.IMMOS && IMMOS.length){
    var vnc=IMMOS.reduce(function(a,i){return a+(i.vnc||0);},0);
    lignes.push('Immobilisations : '+IMMOS.length+' bien(s), valeur nette comptable totale : '+fmt(vnc)+' FCFA');
  }
  if(window.EC){
    var att=EC.filter(function(e){return e.stat==='attente'&&!e.isTVA&&!e.isAvance;});
    if(att.length) lignes.push('Factures en attente de règlement : '+att.length+' pour un total de '+fmt(att.reduce(function(a,e){return a+(e.ttc||0);},0))+' FCFA');
  }

  var clients=iaMeilleursClients();
  if(clients.length){
    lignes.push('Top clients par CA : '+clients.slice(0,5).map(function(c){return c.client+' ('+fmt(c.ca)+' FCFA, '+c.factures+' facture(s)'+(c.retards?', '+c.retards+' en retard':'')+')';}).join(' — '));
    var enRetard=clients.filter(function(c){return c.retards>0;});
    if(enRetard.length) lignes.push('Clients avec factures en retard : '+enRetard.map(function(c){return c.client+' ('+c.retards+')';}).join(', '));
  } else {
    lignes.push('Aucune donnée de vente client enregistrée pour le moment.');
  }

  var stock=iaAnalyseStock();
  if(stock.length){
    var alertes=stock.filter(function(s){return s.enAlerte;});
    var valeurTotale=stock.reduce(function(a,s){return a+s.valeurImmobilisee;},0);
    lignes.push('Stock — '+stock.length+' produit(s), valeur totale immobilisée : '+fmt(valeurTotale)+' FCFA'+(alertes.length?'. En alerte : '+alertes.map(function(s){return s.nom+' ('+s.qteActuelle+' '+s.unite+')';}).join(', '):''));
    var dormants=stock.filter(function(s){return s.joursDepuisDerniereVente===null||s.joursDepuisDerniereVente>60;});
    if(dormants.length) lignes.push('Produits sans vente depuis 60+ jours (stock dormant) : '+dormants.map(function(s){return s.nom;}).join(', '));
  }

  var rh=iaEffectifRH();
  if(rh){
    lignes.push('RH — Effectif actif : '+rh.effectifActif+' / '+rh.effectifTotal+' employé(s) au total'+(rh.masseSalariale!=null?' | Masse salariale mensuelle : '+fmt(rh.masseSalariale)+' FCFA':' (masse salariale non visible pour ce rôle)'));
  }

  // Détection d'un numéro de compte mentionné dans la question -> analyse ciblée
  var mCompte=q.match(/\b(\d{3,6})\b/);
  if(mCompte){
    var det=iaAnalyserCompte(mCompte[1]);
    if(det.nbMouvements>0){
      lignes.push('--- Analyse détaillée du compte '+det.compte+' ('+det.nom+') ---');
      lignes.push('Total débit : '+fmt(det.totalDebit)+' FCFA | Total crédit : '+fmt(det.totalCredit)+' FCFA | Solde : '+fmt(det.solde)+' FCFA');
      det.mouvements.forEach(function(m){
        lignes.push('  • '+m.date+' — '+(m.desc||'')+(m.cli?' ('+m.cli+')':'')+' — Débit '+fmt(m.debit)+' / Crédit '+fmt(m.credit)+(m.statut?' — '+m.statut:''));
      });
    }
  }

  return lignes.join('\n');
}

/* ── 3. Fournisseur + clé API (localStorage, propre à chaque navigateur) ── */
// Quatre fournisseurs supportés : Groq (palier gratuit, format compatible
// OpenAI), Google Gemini (palier gratuit), GitHub Models (palier gratuit,
// aussi format compatible OpenAI) et Anthropic Claude (payant, format
// Messages API). Le choix et la clé sont propres À CE NAVIGATEUR
// (localStorage) — jamais écrits dans le code, jamais commités sur GitHub,
// et jamais envoyés ailleurs qu'au fournisseur choisi. Chaque personne qui
// teste l'app avec son propre navigateur doit donc entrer SA PROPRE clé une
// fois ; elle n'est pas partagée avec les autres testeurs.

var IA_PROVIDERS={
  groq:{label:'Groq (gratuit)',model:'llama-3.3-70b-versatile',placeholder:'gsk_...',aide:'Créez une clé gratuite sur console.groq.com (inscription par e-mail, aucune carte bancaire).'},
  gemini:{label:'Google Gemini (gratuit)',model:'gemini-3.5-flash',placeholder:'AIza...',aide:'Créez une clé gratuite sur aistudio.google.com/apikey (connexion avec un compte Google, aucune carte bancaire).'},
  github:{label:'GitHub Models (gratuit)',model:'gpt-5',placeholder:'github_pat_...',aide:'Créez un token gratuit sur github.com/settings/personal-access-tokens/new avec la permission "Models: Read-only" (aucune carte bancaire).'},
  anthropic:{label:'Anthropic Claude (payant)',model:'claude-sonnet-4-20250514',placeholder:'sk-ant-...',aide:'Créez une clé sur console.anthropic.com (nécessite un moyen de paiement).'}
};

function iaGetProvider(){ try{return localStorage.getItem('comptaia_ia_provider')||'groq';}catch(e){return 'groq';} }
function iaSetProvider(p){ try{localStorage.setItem('comptaia_ia_provider',p);}catch(e){} }
function iaGetKey(){ try{return localStorage.getItem('comptaia_ia_key')||'';}catch(e){return '';} }
function iaSetKey(k){ try{localStorage.setItem('comptaia_ia_key',k);}catch(e){} }
function iaEffacerKey(){ try{localStorage.removeItem('comptaia_ia_key');}catch(e){} renderChatIA(); }

function iaChoisirProvider(p){ iaSetProvider(p); renderChatIA(); }

async function iaSauvegarderCle(){
  var v=(document.getElementById('ia-key-input').value||'').trim();
  if(!v){alert('Collez une clé API valide.');return;}
  iaSetKey(v);
  renderChatIA();
}

// Bascule le champ clé entre masqué (type="password") et visible (type="text"),
// pour que l'utilisateur puisse vérifier ce qu'il a collé avant d'enregistrer.
function iaBasculerAffichageCle(){
  var input=document.getElementById('ia-key-input');
  var bouton=document.getElementById('ia-key-toggle');
  if(!input)return;
  var masque=input.type==='password';
  input.type=masque?'text':'password';
  if(bouton)bouton.textContent=masque?'🙈':'👁️';
}

/* ── 4. Appel du modèle (si clé dispo) + repli structuré (si pas de clé) ── */

function iaSystemPrompt(contexte){
  return "Tu es le copilote IA de GEST Africa, un expert-comptable et conseiller financier expérimenté qui assiste une PME togolaise (normes SYSCOHADA). "+
    "Réponds UNIQUEMENT à partir des données réelles listées ci-dessous — n'invente JAMAIS un chiffre qui n'y figure pas. "+
    "Si une information demandée n'est pas dans ces données, dis-le clairement plutôt que d'inventer une réponse. "+
    "Rédige comme un conseiller humain expérimenté qui parle à son client : explique le contexte, les calculs, les conséquences, et propose des recommandations concrètes. "+
    "Réponds toujours en français, de façon claire et structurée, jamais par des phrases robotiques ou génériques.\n\n"+
    "DONNÉES RÉELLES DE L'ENTREPRISE (à la date d'aujourd'hui) :\n"+contexte;
}

// Construit une Error qui porte le code HTTP (err.status), pour que
// iaMessageErreur() puisse ensuite traduire ça en message compréhensible
// (clé invalide, quota dépassé, etc.) au lieu d'afficher l'erreur brute.
async function iaErreurHTTP(response){
  var msg='';
  try{ msg=(await response.json()).error.message; }catch(e){}
  var err=new Error(msg || ('Erreur HTTP '+response.status));
  err.status=response.status;
  return err;
}

async function iaAppelerIA(question, contexte){
  var provider=iaGetProvider();
  var apiKey=iaGetKey();
  var systemPrompt=iaSystemPrompt(contexte);
  // Poussé dans l'historique seulement en cas de succès — les 4 API exigent
  // une alternance stricte user/assistant, donc un appel raté ne doit pas
  // laisser un tour "user" sans réponse qui casserait la requête suivante.
  var pending=IA_COPILOT_HIST.concat([{role:'user',content:question}]);
  var texte;

  if(provider==='groq'){
    // Format "compatible OpenAI" : un tableau messages avec role/content.
    var r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body:JSON.stringify({model:IA_PROVIDERS.groq.model,max_tokens:1500,messages:[{role:'system',content:systemPrompt}].concat(pending)})
    });
    if(!r.ok) throw await iaErreurHTTP(r);
    var dG=await r.json();
    texte=(dG.choices && dG.choices[0] && dG.choices[0].message && dG.choices[0].message.content) || 'Réponse vide.';

  } else if(provider==='github'){
    // GitHub Models expose aussi un format "compatible OpenAI", même
    // structure que Groq — seuls l'URL et le modèle changent. Le token est
    // un Personal Access Token GitHub avec la permission "Models: Read-only".
    var rGH=await fetch('https://models.inference.ai.azure.com/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body:JSON.stringify({model:IA_PROVIDERS.github.model,max_tokens:1500,messages:[{role:'system',content:systemPrompt}].concat(pending)})
    });
    if(!rGH.ok) throw await iaErreurHTTP(rGH);
    var dGH=await rGH.json();
    texte=(dGH.choices && dGH.choices[0] && dGH.choices[0].message && dGH.choices[0].message.content) || 'Réponse vide.';

  } else if(provider==='gemini'){
    // Format Gemini : la clé va dans l'URL (?key=...), pas dans un en-tête.
    // Les tours de conversation s'appellent "contents", et le rôle de l'IA
    // s'appelle "model" (pas "assistant" comme chez les autres fournisseurs).
    var contents=pending.map(function(m){
      return {role:(m.role==='assistant'?'model':'user'),parts:[{text:m.content}]};
    });
    var urlGemini='https://generativelanguage.googleapis.com/v1beta/models/'+IA_PROVIDERS.gemini.model+':generateContent?key='+encodeURIComponent(apiKey);
    var r3=await fetch(urlGemini,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:contents,systemInstruction:{parts:[{text:systemPrompt}]},generationConfig:{maxOutputTokens:1500}})
    });
    if(!r3.ok) throw await iaErreurHTTP(r3);
    var d3=await r3.json();
    var cand=d3.candidates && d3.candidates[0];
    texte=(cand && cand.content && cand.content.parts && cand.content.parts[0] && cand.content.parts[0].text) || 'Réponse vide.';

  } else {
    // Anthropic : le "system prompt" est un champ à part, pas un message.
    var r2=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':apiKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({model:IA_PROVIDERS.anthropic.model,max_tokens:1500,system:systemPrompt,messages:pending})
    });
    if(!r2.ok) throw await iaErreurHTTP(r2);
    var dA=await r2.json();
    texte=(dA.content && dA.content[0] && dA.content[0].text) || 'Réponse vide.';
  }

  IA_COPILOT_HIST.push({role:'user',content:question});
  IA_COPILOT_HIST.push({role:'assistant',content:texte});
  return texte;
}

// Traduit une erreur technique (code HTTP, ou aucune réponse du tout) en
// message compréhensible pour quelqu'un qui ne code pas.
function iaMessageErreur(err, provider){
  var def=IA_PROVIDERS[provider]||{label:'le fournisseur IA'};
  if(err && (err.status===401 || err.status===403)){
    if(provider==='github'){
      return '❌ GitHub Models a refusé le token (non autorisé). Vérifiez qu\'il est bien copié en entier, qu\'il n\'a pas expiré, et surtout qu\'il a bien la permission "Models: Read-only" activée lors de sa création.';
    }
    return '❌ Clé API refusée par '+def.label+'. Vérifiez qu\'elle est bien copiée en entier (sans espace avant/après) et qu\'elle est toujours active.';
  }
  if(err && err.status===429){
    return '⏳ Quota dépassé pour '+def.label+'. Attendez quelques minutes, ou vérifiez les limites de votre palier gratuit.';
  }
  if(err && err.status){
    return '⚠ '+def.label+' a renvoyé une erreur (code '+err.status+'). '+(err.message||'');
  }
  // Pas de code HTTP du tout = la requête n'a jamais atteint le serveur.
  return '🌐 Impossible de contacter '+def.label+'. Vérifiez votre connexion internet et réessayez.';
}

function iaReponseSansCle(question, contexte){
  return "Aucune clé API n'est configurée, donc je ne peux pas encore rédiger une explication en langage naturel — voici en revanche les données réelles pertinentes, calculées à l'instant à partir de votre comptabilité :\n\n"+contexte+
    "\n\n(Configurez une clé API — Groq, Gemini, GitHub Models (gratuits) ou Anthropic Claude — dans ce panneau pour obtenir des explications rédigées comme un conseiller, avec recommandations.)";
}

/* ── 5. Interface : rendu du panneau, envoi des messages ── */

var IA_SUGGESTIONS=[
  "Pourquoi le bilan est-il déséquilibré ?",
  "Quelles factures sont en retard de paiement ?",
  "Qui est notre meilleur client ?",
  "Quel produit ne se vend plus ?",
  "Comment va mon entreprise ?",
  "Analyse ma trésorerie et ma santé financière"
];

function renderChatIA(){
  var wrap=document.getElementById('ia-copilot-body');
  if(!wrap)return;
  var cle=iaGetKey();
  var provider=iaGetProvider();
  var def=IA_PROVIDERS[provider];

  // La clé vit uniquement dans le localStorage DE CE NAVIGATEUR — elle
  // n'est ni partagée ni synchronisée entre utilisateurs. Chaque personne
  // (quel que soit son rôle) doit donc pouvoir configurer SA PROPRE clé sur
  // SON PROPRE navigateur ; ça ne dépend pas d'un administrateur.
  if(!cle){
    wrap.innerHTML=
      '<div class="ia-key-card"><h3>💬 Configurer le Chat IA</h3>'+
      '<p>Le copilote a besoin d\'une clé API pour rédiger ses réponses en langage naturel. Choisissez un fournisseur, créez-y une clé, puis collez-la ici. Elle reste stockée uniquement dans ce navigateur (localStorage) et n\'est jamais envoyée ailleurs qu\'au fournisseur choisi — chaque personne doit utiliser sa propre clé, pas celle de quelqu\'un d\'autre.</p>'+
      '<div class="fg"><label>Fournisseur</label><div style="display:flex;gap:8px;margin-top:2px">'+
        Object.keys(IA_PROVIDERS).map(function(p){
          return '<button type="button" class="btn btn-sm'+(p===provider?' btn-primary':'')+'" onclick="iaChoisirProvider(\''+p+'\')">'+IA_PROVIDERS[p].label+'</button>';
        }).join('')+
      '</div></div>'+
      '<p style="font-size:11px">'+def.aide+'</p>'+
      '<div class="fg"><label>Clé API '+def.label+'</label>'+
        '<div style="display:flex;gap:6px">'+
          '<input type="password" id="ia-key-input" placeholder="'+def.placeholder+'" style="flex:1"/>'+
          '<button type="button" class="btn btn-sm" onclick="iaBasculerAffichageCle()" id="ia-key-toggle" title="Afficher/masquer la clé">👁️</button>'+
        '</div>'+
      '</div>'+
      '<button class="btn btn-primary" onclick="iaSauvegarderCle()">Enregistrer la clé</button>'+
      '</div>';
    return;
  }

  wrap.innerHTML=
    '<div class="ia-chat-wrap">'+
      '<div class="ia-chat-head"><div class="ia-chat-head-title"><span class="ia-status-dot"></span> Copilote IA — connecté ('+def.label+')</div>'+
        '<button class="btn btn-sm" onclick="iaEffacerKey()">Retirer ma clé API</button>'+
      '</div>'+
      '<div class="ia-suggestions">'+IA_SUGGESTIONS.map(function(s){return '<span class="ia-chip" onclick="iaPoserSuggestion('+JSON.stringify(s).replace(/"/g,'&quot;')+')">'+s+'</span>';}).join('')+'</div>'+
      '<div class="ia-conv" id="ia-conv"></div>'+
      '<div class="ia-input-row">'+
        '<input type="text" id="ia-copilot-input" placeholder="Posez une question sur votre entreprise..." onkeydown="if(event.key===\'Enter\')iaEnvoyerMessage()"/>'+
        '<button class="btn btn-primary" onclick="iaEnvoyerMessage()">Envoyer</button>'+
      '</div>'+
    '</div>';
  renderIAConv();
}

var IA_MESSAGES=[]; // {role:'user'|'bot', texte, meta}

function renderIAConv(){
  var conv=document.getElementById('ia-conv');
  if(!conv)return;
  if(!IA_MESSAGES.length){
    conv.innerHTML='<div style="text-align:center;color:var(--text-faint);font-style:italic;margin:auto">Posez une question sur vos comptes, vos ventes, votre stock ou la santé générale de l\'entreprise.</div>';
    return;
  }
  conv.innerHTML=IA_MESSAGES.map(function(m){
    return '<div class="ia-msg ia-msg-'+(m.role==='user'?'user':'bot')+'">'+esc(m.texte)+(m.meta?'<div class="ia-msg-meta">'+m.meta+'</div>':'')+'</div>';
  }).join('');
  conv.scrollTop=conv.scrollHeight;
}

function iaPoserSuggestion(q){
  document.getElementById('ia-copilot-input').value=q;
  iaEnvoyerMessage();
}

async function iaEnvoyerMessage(){
  var input=document.getElementById('ia-copilot-input');
  var question=(input.value||'').trim();
  if(!question)return;
  input.value='';
  IA_MESSAGES.push({role:'user',texte:question});
  renderIAConv();
  IA_MESSAGES.push({role:'bot',texte:'Analyse en cours...',loading:true});
  renderIAConv();

  var contexte=iaConstruireContexte(question);
  var cle=iaGetKey();
  try{
    var reponse = cle ? await iaAppelerIA(question, contexte) : iaReponseSansCle(question, contexte);
    IA_MESSAGES[IA_MESSAGES.length-1]={role:'bot',texte:reponse,meta:cle?(IA_PROVIDERS[iaGetProvider()].label+' · basé sur vos données réelles'):'Sans IA · données réelles'};
  }catch(err){
    var messageClair=iaMessageErreur(err,iaGetProvider());
    IA_MESSAGES[IA_MESSAGES.length-1]={role:'bot',texte:messageClair+'\n\nVoici tout de même les données réelles disponibles :\n\n'+contexte,meta:'Erreur API'};
  }
  renderIAConv();
}

/* ── 6. Intégration navigation : bouton taskbar "Chat IA" + pane ── */

(function(){
  var _goIACopilot=window.go;
  window.go=function(id,el){
    if(typeof _goIACopilot==='function')_goIACopilot(id,el);
    if(id==='chat-ia'){
      var pt=document.getElementById('page-title'); if(pt)pt.textContent='Chat IA — Copilote intelligent';
      renderChatIA();
    }
  };
})();
