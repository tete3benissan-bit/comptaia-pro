// v10: Dashboard/Score/OCR/Fraude-detection/Multi-entreprise/Benchmarks logic - extracted from ComptaIA_Pro_original.html lines 3065-3483
// ═══════════════════════════════════
// V10 — NOUVELLES FONCTIONNALITÉS
// ═══════════════════════════════════

// Patch go() pour les nouveaux onglets
// _go10 neutralized — unified go() v12 handles all navigation

// ─────────────────────────────────────
// 1. TABLEAU DE BORD IA
// ─────────────────────────────────────
var dashChartCA=null,dashChartCharges=null;

function renderDashboard(){
  // KPIs intelligents
  var tPr=0,tCh=0;
  EC.concat(REGL).forEach(function(e){
    if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA)tPr+=e.credit;
    if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA)tCh+=e.debit;
  });
  var res=tPr-tCh;
  var att=EC.filter(function(e){return e.stat==='attente'&&!e.isTVA&&!e.isAvance});
  var attMt=att.reduce(function(a,e){return a+e.ttc;},0);
  var sc=typeof getSoldeCalcule==='function'?getSoldeCalcule():{caisse:0,banque:0};
  var treso=sc.caisse+sc.banque;
  var margeP=tPr>0?Math.round((tPr-tCh)/tPr*100):0;
  var is=window._IS_CALCULE;var isTotal=is?is.isTotal:0;
  var resNet=res-isTotal;
  var today=new Date().toISOString().split('T')[0];
  var retard=att.filter(function(e){return e.echeance&&e.echeance<today}).length;

  var kpis=[
    {label:'Chiffre d\'affaires',val:fmt(tPr)+' FCFA',sub:EC.filter(function(e){return!e.isTVA&&!e.isAvance&&(e.type==='vente'||e.type==='service')}).length+' factures',cls:'green'},
    {label:'Résultat net',val:fmt(Math.abs(resNet))+' FCFA',sub:resNet>=0?'Bénéfice':'Déficit ⚠',cls:resNet>=0?'green':'red'},
    {label:'Marge nette',val:margeP+'%',sub:margeP>10?'Bonne marge ✓':margeP>0?'Marge à améliorer':'En perte',cls:margeP>10?'green':margeP>0?'amber':'red'},
    {label:'Trésorerie totale',val:fmt(treso)+' FCFA',sub:'Caisse + Banque',cls:treso>0?'blue':'red'},
    {label:'Créances clients',val:fmt(attMt)+' FCFA',sub:att.length+' facture(s) impayée(s)',cls:att.length===0?'green':'amber'},
    {label:'IS estimé',val:fmt(isTotal)+' FCFA',sub:'27% bénéfice imposable',cls:isTotal>0?'amber':'green'},
    {label:'Factures en retard',val:''+retard,sub:retard>0?'Retard de paiement ⚠':'Aucun retard ✓',cls:retard>0?'red':'green'},
    {label:'Immobilisations',val:IMMOS.length+' bien(s)',sub:'VNC : '+fmt(IMMOS.reduce(function(a,i){return a+(i.vnc||i.valeur-i.amortCumul||i.valeur);},0))+' FCFA',cls:'blue'},
  ];

  document.getElementById('dash-kpis').innerHTML=kpis.map(function(k){
    return`<div class="dash-insight ${k.cls}">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">${k.label}</div>
      <div style="font-size:18px;font-weight:700;font-family:'Archivo',sans-serif;color:var(--text)">${k.val}</div>
      <div style="font-size:10px;color:var(--text-faint);margin-top:3px">${k.sub}</div>
    </div>`;
  }).join('');

  // Graphique CA mensuel
  var caByMonth={};
  EC.filter(function(e){return(e.type==='vente'||e.type==='service')&&!e.avoir&&!e.isTVA&&e.date}).forEach(function(e){
    var m=e.date.substring(0,7);caByMonth[m]=(caByMonth[m]||0)+e.ht;
  });
  var months=Object.keys(caByMonth).sort();
  if(dashChartCA)dashChartCA.destroy();
  var ctx1=document.getElementById('dash-chart-ca');
  if(ctx1&&months.length>0){
    dashChartCA=new Chart(ctx1,{type:'bar',data:{labels:months.map(function(m){var p=m.split('-');return p[1]+'/'+p[0];}),datasets:[{label:'CA HT',data:months.map(function(m){return caByMonth[m]||0;}),backgroundColor:'rgba(var(--accent-rgb),.7)',borderColor:'var(--accent)',borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:function(v){return v.toLocaleString('fr-FR')}}}}}});
  }

  // Graphique répartition charges
  var byType={};
  EC.filter(function(e){return e.cptD&&e.cptD[0]==='6'&&!e.isTVA}).forEach(function(e){
    var cpt=e.cptD.substring(0,2)+'xx';byType[cpt]=(byType[cpt]||0)+e.debit;
  });
  if(dashChartCharges)dashChartCharges.destroy();
  var ctx2=document.getElementById('dash-chart-charges');
  if(ctx2&&Object.keys(byType).length>0){
    var labels=Object.keys(byType),vals=labels.map(function(k){return byType[k];});
    var colors=['var(--accent)','#BA7517','#E24B4A','#33506d','#6D28D9','#0891B2','#D85A30'];
    dashChartCharges=new Chart(ctx2,{type:'doughnut',data:{labels,datasets:[{data:vals,backgroundColor:colors.slice(0,labels.length),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{boxWidth:10,font:{size:10}}}}}});
  }

  // Alertes intelligentes
  var alertes=[];
  if(retard>0)alertes.push({type:'danger',icon:'⏰',msg:'<strong>'+retard+' facture(s) en retard</strong> — Relancez vos clients pour améliorer votre trésorerie.'});
  if(treso<0)alertes.push({type:'danger',icon:'🔴',msg:'<strong>Trésorerie négative</strong> — Situation critique : '+fmt(treso)+' FCFA. Cherchez un financement d\'urgence ou recouvrez les créances.'});
  if(treso>0&&treso<attMt)alertes.push({type:'warn',icon:'⚠️',msg:'Vos créances ('+fmt(attMt)+' FCFA) dépassent votre trésorerie ('+fmt(treso)+' FCFA). Risque de défaut de paiement.'});
  if(margeP>0&&margeP<5)alertes.push({type:'warn',icon:'📉',msg:'Marge nette très faible ('+margeP+'%). Analysez vos charges pour identifier des économies possibles.'});
  if(IMMOS.length>0){var vnc=IMMOS.reduce(function(a,i){return a+(i.vnc||0);},0);if(vnc/Math.max(tPr,1)<0.1)alertes.push({type:'info',icon:'💡',msg:'Vos immobilisations ont une faible VNC. Pensez à renouveler votre parc matériel pour maintenir la capacité productive.'});}
  if(!is&&tPr>0)alertes.push({type:'warn',icon:'🏛️',msg:'L\'IS n\'a pas encore été calculé pour cet exercice. Allez dans Exercice & IS pour éviter les surprises fiscales.'});
  var aHtml=alertes.length?alertes.map(function(a){return`<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 12px;border-radius:var(--radius);margin-bottom:6px;background:${a.type==='danger'?'var(--red-light)':a.type==='warn'?'var(--amber-light)':'var(--blue-light)'};border:1px solid ${a.type==='danger'?'var(--red-border)':a.type==='warn'?'var(--amber-border)':'var(--blue-border)'}"><span style="font-size:16px">${a.icon}</span><span style="font-size:11.5px;color:var(--text)">${a.msg}</span></div>`;}).join(''):
    '<div style="color:var(--text-faint);font-style:italic;font-size:12px;padding:8px 0">✓ Aucun point d\'attention critique détecté — vos comptes semblent en ordre.</div>';
  document.getElementById('dash-alertes-body').innerHTML=aHtml;
}

async function refreshDashboard(){
  var btn=document.querySelector('#pane-dashboard button');if(btn)btn.disabled=true;
  renderDashboard();
  var recoel=document.getElementById('dash-reco');
  recoel.innerHTML='<div class="ai-reco-title">✦ Recommandations prioritaires de l\'IA</div><div style="display:flex;gap:6px;padding:8px 0"><div style="width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse .8s ease-in-out infinite"></div><div style="width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse .8s ease-in-out infinite;animation-delay:.16s"></div><div style="width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse .8s ease-in-out infinite;animation-delay:.32s"></div><div style="font-size:11.5px;color:rgba(168,164,159,.8);margin-left:8px">Analyse en cours...</div></div>';
  var tPr=0,tCh=0;EC.concat(REGL).forEach(function(e){if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA)tPr+=e.credit;if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA)tCh+=e.debit;});
  var att=EC.filter(function(e){return e.stat==='attente'&&!e.isTVA&&!e.isAvance});
  var sc=typeof getSoldeCalcule==='function'?getSoldeCalcule():{caisse:0,banque:0};
  var is=window._IS_CALCULE,isTotal=is?is.isTotal:0;
  var ctx='Tu es un expert-comptable OHADA senior spécialisé au Togo. Fournis 3 recommandations concrètes et actionnables MAINTENANT pour améliorer la santé financière de cette entreprise.\n\nDonnées exercice '+EXERCICE.annee+':\n- CA Produits: '+Math.round(tPr).toLocaleString('fr-FR')+' FCFA\n- Charges totales: '+Math.round(tCh).toLocaleString('fr-FR')+' FCFA\n- Résultat brut: '+Math.round(tPr-tCh).toLocaleString('fr-FR')+' FCFA\n- IS estimé (27%): '+Math.round(isTotal).toLocaleString('fr-FR')+' FCFA\n- Créances impayées: '+att.length+' factures — '+Math.round(att.reduce(function(a,e){return a+e.ttc;},0)).toLocaleString('fr-FR')+' FCFA\n- Caisse: '+Math.round(sc.caisse).toLocaleString('fr-FR')+' FCFA | Banque: '+Math.round(sc.banque).toLocaleString('fr-FR')+' FCFA\n- Immobilisations: '+IMMOS.length+'\n- Employés: '+EMPLOYES.length+'\n\nFormat: JSON strict avec tableau "recommandations" de 3 objets: {priorite:"HAUTE/MOYENNE/FAIBLE", titre:"...", description:"..."}. Répondre uniquement en JSON valide.';
  try{
    var r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,messages:[{role:'user',content:ctx}]})});
    var d=await r.json();var rep=(d.content && d.content[0] ? d.content[0].text : '')||'{}';
    var clean=rep.replace(/```json|```/g,'').trim();
    var parsed=JSON.parse(clean);
    var recos=parsed.recommandations||[];
    var colors={'HAUTE':'#E24B4A','MOYENNE':'#BA7517','FAIBLE':'var(--accent)'};
    recoel.innerHTML='<div class="ai-reco-title">✦ Recommandations IA — '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+'</div>'+recos.map(function(r,i){return`<div class="ai-reco-item"><div class="ai-prio" style="background:${colors[r.priorite]||'#888'};color:#fff">${i+1}</div><div><div style="font-size:12px;font-weight:600;color:#fff;margin-bottom:2px">${r.titre}</div><div style="font-size:11px;color:rgba(255,255,255,.7);line-height:1.5">${r.description}</div></div></div>`;}).join('');
  }catch(err){recoel.innerHTML='<div class="ai-reco-title">✦ Recommandations prioritaires</div><div style="color:rgba(168,164,159,.6);font-size:11.5px">Connectez-vous à internet pour obtenir des recommandations IA personnalisées.</div>';}
  if(btn)btn.disabled=false;
}

// ─────────────────────────────────────
// 2. SCORE FINANCIER
// ─────────────────────────────────────
var scoreDonutChart=null;
function calculerScore(){
  var tPr=0,tCh=0;EC.concat(REGL).forEach(function(e){if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA)tPr+=e.credit;if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA)tCh+=e.debit;});
  if(!tPr&&!tCh){document.getElementById('score-global-val').textContent='N/A';document.getElementById('score-global-label').textContent='Aucune donnée';document.getElementById('score-details').innerHTML='<div style="color:var(--text-faint);font-size:12px;font-style:italic">Saisissez des factures pour calculer votre score.</div>';return;}
  var sc=typeof getSoldeCalcule==='function'?getSoldeCalcule():{caisse:0,banque:0};
  var att=EC.filter(function(e){return e.stat==='attente'&&!e.isTVA&&!e.isAvance});
  var attMt=att.reduce(function(a,e){return a+e.ttc;},0);
  var treso=sc.caisse+sc.banque;
  var is=window._IS_CALCULE,isTotal=is?is.isTotal:0;
  var res=tPr-tCh-isTotal;
  var margeP=tPr>0?Math.round((tPr-tCh)/tPr*100):0;
  var liquiditeP=attMt>0?Math.round(treso/attMt*100):100;
  var rotCreance=tPr>0?Math.round(attMt/tPr*365):0;
  var today=new Date().toISOString().split('T')[0];
  var retardNb=att.filter(function(e){return e.echeance&&e.echeance<today}).length;

  // Calcul des scores par critère (0-100)
  var criteres=[
    {label:'Rentabilité',desc:'Marge nette / CA',val:margeP,note:margeP>=20?100:margeP>=10?80:margeP>=5?60:margeP>=0?40:10,ref:'>20% = Excellent',ico:'📈'},
    {label:'Liquidité',desc:'Trésorerie / Créances',val:liquiditeP+'%',note:liquiditeP>=150?100:liquiditeP>=100?80:liquiditeP>=50?60:liquiditeP>=0?40:20,ref:'>150% = Excellent',ico:'💧'},
    {label:'Recouvrement',desc:'Délai moyen paiement',val:rotCreance+'j',note:rotCreance<=30?100:rotCreance<=60?75:rotCreance<=90?50:rotCreance<=120?30:10,ref:'<30j = Excellent',ico:'⏱️'},
    {label:'Ponctualité',desc:'Factures en retard',val:retardNb+' retard(s)',note:retardNb===0?100:retardNb<=1?70:retardNb<=3?40:10,ref:'0 retard = Excellent',ico:'📅'},
    {label:'IS & Fiscalité',desc:'IS calculé / provisionné',val:isTotal>0?'Oui':'Non',note:isTotal>0?90:30,ref:'IS provisionné = Bon',ico:'🏛️'},
    {label:'Immobilisations',desc:'Biens durables présents',val:IMMOS.length+' bien(s)',note:IMMOS.length>=3?100:IMMOS.length>=1?70:40,ref:'≥3 biens = Excellent',ico:'🏗️'},
  ];

  var scoreMoyen=Math.round(criteres.reduce(function(a,c){return a+c.note;},0)/criteres.length);
  var label=scoreMoyen>=80?'Excellent':scoreMoyen>=65?'Bon':scoreMoyen>=50?'Moyen':scoreMoyen>=35?'Fragile':'Critique';
  var color=scoreMoyen>=80?'var(--accent)':scoreMoyen>=65?'#0891B2':scoreMoyen>=50?'#BA7517':scoreMoyen>=35?'#E24B4A':'#7F1D1D';

  document.getElementById('score-global-val').textContent=scoreMoyen;
  document.getElementById('score-global-label').textContent=label;
  document.getElementById('score-global-val').style.color=color;

  if(scoreDonutChart)scoreDonutChart.destroy();
  var ctx=document.getElementById('score-donut');
  if(ctx)scoreDonutChart=new Chart(ctx,{type:'doughnut',data:{datasets:[{data:[scoreMoyen,100-scoreMoyen],backgroundColor:[color,'#F3F4F6'],borderWidth:0,circumference:280,rotation:220}]},options:{responsive:false,plugins:{legend:{display:false},tooltip:{enabled:false}},cutout:'72%'}});

  document.getElementById('score-details').innerHTML=criteres.map(function(c){
    return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span style="font-size:16px;width:24px">${c.ico}</span>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:12px;font-weight:600">${c.label} <span style="font-size:10px;color:var(--text-faint);font-weight:400">— ${c.val}</span></span>
          <span style="font-size:11px;font-weight:700;color:${c.note>=80?'var(--green)':c.note>=60?'var(--blue)':c.note>=40?'var(--amber)':'var(--red)'}">${c.note}/100</span>
        </div>
        <div class="score-bar"><div class="score-bar-fill" style="width:${c.note}%;background:${c.note>=80?'var(--green)':c.note>=60?'var(--blue)':c.note>=40?'var(--amber)':'var(--red)'}"></div></div>
        <div style="font-size:9px;color:var(--text-faint);margin-top:2px">${c.ref}</div>
      </div>
    </div>`;
  }).join('');

  var conseils=criteres.filter(function(c){return c.note<60}).map(function(c){return'• <strong>'+c.label+'</strong> ('+c.note+'/100) : '+c.ref;}).join('<br>');
  document.getElementById('score-rapport').innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:2px solid var(--border);margin-bottom:12px">
      <div style="width:50px;height:50px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:700">${scoreMoyen}</div>
      <div><div style="font-size:14px;font-weight:700;color:${color}">${label}</div><div style="font-size:11px;color:var(--text-muted)">Score global calculé sur ${criteres.length} critères OHADA</div></div>
    </div>
    ${conseils?'<div style="font-size:12px;line-height:1.8;margin-bottom:10px"><strong>Axes d\'amélioration :</strong><br>'+conseils+'</div>':'<div style="color:var(--green-dark);font-size:12px;font-weight:500">✓ Tous les critères sont satisfaisants — bonne santé financière.</div>'}
    <div style="font-size:10px;color:var(--text-faint);border-top:2px solid var(--border);padding-top:8px;margin-top:8px">Score calculé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} | Exercice ${EXERCICE.annee}</div>`;
}

// ─────────────────────────────────────
// 3. OCR — SAISIE PAR PHOTO
// ─────────────────────────────────────
var ocrData={};
function ocr_drop(e){e.preventDefault();var f=e.dataTransfer.files[0];if(f)ocr_process(f);}
function ocr_upload(e){var f=e.target.files[0];if(f)ocr_process(f);}
function ocr_process(file){
  var status=document.getElementById('ocr-status');
  var preview=document.getElementById('ocr-preview');
  status.textContent='Chargement de l\'image...';
  var reader=new FileReader();
  reader.onload=function(e){
    preview.src=e.target.result;preview.style.display='block';
    status.innerHTML='<span style="color:var(--amber)">🤖 Analyse IA en cours — extraction des données...</span>';
    ocr_analyzeWithAI(e.target.result);
  };
  reader.readAsDataURL(file);
}
async function ocr_analyzeWithAI(dataUrl){
  var status=document.getElementById('ocr-status');
  var b64=dataUrl.split(',')[1],mt=dataUrl.split(';')[0].split(':')[1];
  var prompt='Analyse cette image de facture ou reçu et extrait les informations suivantes. Réponds UNIQUEMENT en JSON valide:\n{"numero_facture":"...","date":"YYYY-MM-DD","fournisseur_client":"...","description":"...","montant_ht":0,"taux_tva":18,"montant_tva":0,"montant_ttc":0,"type":"achat ou vente","confiance":"haute/moyenne/faible"}\nSi une information est illisible, mets null. Ne mets aucun autre texte.';
  try{
    var r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:mt,data:b64}},{type:'text',text:prompt}]}]})});
    var d=await r.json();
    var rep=(d.content && d.content[0] ? d.content[0].text : '')||'{}';
    var parsed=JSON.parse(rep.replace(/```json|```/g,'').trim());
    ocrData=parsed;
    var conf=parsed.confiance||'—';
    var confColor=conf==='haute'?'var(--green)':conf==='moyenne'?'var(--amber)':'var(--red)';
    document.getElementById('ocr-result').innerHTML=`
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:12px;font-weight:700;color:var(--green-dark)">✓ Extraction réussie</div>
        <div style="font-size:10px;padding:2px 8px;border-radius:var(--radius);background:var(--bg);color:${confColor};font-weight:600">Confiance : ${conf}</div>
      </div>
      ${[
        {l:'N° Facture',v:parsed.numero_facture||'—'},
        {l:'Date',v:parsed.date||'—'},
        {l:'Fournisseur/Client',v:parsed.fournisseur_client||'—'},
        {l:'Description',v:parsed.description||'—'},
        {l:'Montant HT',v:parsed.montant_ht?Math.round(parsed.montant_ht).toLocaleString('fr-FR')+' FCFA':'—'},
        {l:'TVA ('+parsed.taux_tva+'%)',v:parsed.montant_tva?Math.round(parsed.montant_tva).toLocaleString('fr-FR')+' FCFA':'—'},
        {l:'Montant TTC',v:parsed.montant_ttc?Math.round(parsed.montant_ttc).toLocaleString('fr-FR')+' FCFA':'—'},
        {l:'Type',v:parsed.type||'—'},
      ].map(function(row){return`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:2px solid var(--border);font-size:12px"><span style="color:var(--text-muted)">${row.l}</span><span style="font-weight:600">${row.v}</span></div>`;}).join('')}`;
    document.getElementById('ocr-actions').style.display='block';
    status.innerHTML='<span style="color:var(--green)">✓ Extraction terminée — vérifiez les données et cliquez sur "Remplir le formulaire".</span>';
  }catch(err){
    document.getElementById('ocr-result').innerHTML='<div style="color:var(--red);font-size:12px">⚠ Erreur d\'analyse. Vérifiez votre connexion internet ou essayez une image plus nette.</div>';
    status.innerHTML='<span style="color:var(--red)">Erreur de traitement</span>';
  }
}
function ocr_appliquer(){
  if(!ocrData||!ocrData.montant_ht)return alert('Données insuffisantes extraites.');
  if(ocrData.numero_facture)document.getElementById('f-num').value=ocrData.numero_facture;
  if(ocrData.date)document.getElementById('f-date').value=ocrData.date;
  if(ocrData.fournisseur_client)document.getElementById('f-client').value=ocrData.fournisseur_client;
  if(ocrData.description)document.getElementById('f-desc').value=ocrData.description;
  if(ocrData.montant_ht)document.getElementById('f-ht').value=Math.round(ocrData.montant_ht);
  if(ocrData.taux_tva)document.getElementById('f-tva-taux').value=ocrData.taux_tva;
  if(ocrData.type==='achat')document.getElementById('f-type').value='achat';
  else if(ocrData.type==='vente')document.getElementById('f-type').value='vente';
  if(typeof calcM==='function')calcM();
  go('facture',document.querySelectorAll('.nav-item')[0]);
  alert('✓ Formulaire pré-rempli depuis la photo. Vérifiez les données et validez.');
}

// ─────────────────────────────────────
// 4. DÉTECTION D'ANOMALIES
// ─────────────────────────────────────
function lancerDetection(){
  var anomalies=[];
  var today=new Date().toISOString().split('T')[0];
  // 1. Doublons potentiels (même montant + même client + même mois)
  var seen={};
  EC.forEach(function(e,i){if(e.isTVA||e.isAvance)return;var k=e.cli+'|'+Math.round(e.ttc)+'|'+e.date.substring(0,7);if(seen[k]!==undefined)anomalies.push({niveau:'haute',icon:'🔴',titre:'Doublon potentiel',desc:'Deux écritures similaires : '+e.num+' et '+EC[seen[k]].num+' — même client ('+e.cli+'), même montant ('+Math.round(e.ttc).toLocaleString('fr-FR')+' FCFA), même mois.'});else seen[k]=i;});
  // 2. Écritures déséquilibrées
  EC.concat(REGL).forEach(function(e){if(Math.abs(e.debit-e.credit)>1)anomalies.push({niveau:'haute',icon:'⚖️',titre:'Écriture déséquilibrée',desc:'L\'écriture '+e.num+' a un débit ('+Math.round(e.debit).toLocaleString('fr-FR')+') différent du crédit ('+Math.round(e.credit).toLocaleString('fr-FR')+') FCFA.'});});
  // 3. Factures très en retard (>60j)
  EC.filter(function(e){return e.stat==='attente'&&e.echeance&&e.echeance<today}).forEach(function(e){var days=Math.round((new Date(today)-new Date(e.echeance))/(1000*60*60*24));if(days>60)anomalies.push({niveau:'haute',icon:'⏰',titre:'Retard extrême ('+days+'j)',desc:'Facture '+e.num+' de '+e.cli+' — '+Math.round(e.ttc).toLocaleString('fr-FR')+' FCFA — en retard de '+days+' jours. Risque d\'irrécouvrabilité.'});else if(days>30)anomalies.push({niveau:'moyenne',icon:'⚠️',titre:'Retard important ('+days+'j)',desc:'Facture '+e.num+' de '+e.cli+' en retard de '+days+' jours.'});});
  // 4. Montants ronds inhabituels (suspicion)
  EC.filter(function(e){return !e.isTVA&&!e.isAvance&&e.ttc>500000&&e.ttc%100000===0}).forEach(function(e){anomalies.push({niveau:'faible',icon:'💡',titre:'Montant rond élevé',desc:'La facture '+e.num+' a un montant très rond ('+Math.round(e.ttc).toLocaleString('fr-FR')+' FCFA). Vérifiez que c\'est bien le montant exact.'});});
  // 5. Taux TVA incohérent (vente avec TVA achat ou vice versa)
  EC.filter(function(e){return !e.isTVA&&e.tvaCpt}).forEach(function(e){if((e.type==='vente'||e.type==='service')&&e.tvaCpt==='4452')anomalies.push({niveau:'moyenne',icon:'🧾',titre:'TVA incohérente',desc:'La facture de vente '+e.num+' utilise le compte 4452 (TVA achat). Une vente devrait utiliser le compte 4431 (TVA collectée).'});if(e.type==='achat'&&e.tvaCpt==='4431')anomalies.push({niveau:'moyenne',icon:'🧾',titre:'TVA incohérente',desc:'La facture d\'achat '+e.num+' utilise le compte 4431 (TVA vente). Un achat devrait utiliser le compte 4452 (TVA récupérable).'});});
  // 6. Écritures sans description
  EC.filter(function(e){return !e.desc||e.desc.length<5}).forEach(function(e){anomalies.push({niveau:'faible',icon:'📝',titre:'Description manquante',desc:'L\'écriture '+e.num+' n\'a pas de description suffisante. Ajoutez un libellé pour faciliter les contrôles.'});});
  // 7. Balance non équilibrée globalement
  var tD=0,tC=0;EC.concat(REGL).forEach(function(e){tD+=e.debit;tC+=e.credit;});
  if(Math.abs(tD-tC)>1)anomalies.push({niveau:'haute',icon:'⚖️',titre:'Journal global déséquilibré',desc:'Le total débit ('+Math.round(tD).toLocaleString('fr-FR')+') ne correspond pas au total crédit ('+Math.round(tC).toLocaleString('fr-FR')+') FCFA. Écart : '+Math.round(Math.abs(tD-tC)).toLocaleString('fr-FR')+' FCFA.'});

  var crit=anomalies.filter(function(a){return a.niveau==='haute'}).length;
  var med=anomalies.filter(function(a){return a.niveau==='moyenne'}).length;
  var info=anomalies.filter(function(a){return a.niveau==='faible'}).length;
  var integ=Math.max(0,100-crit*20-med*10-info*3);
  document.getElementById('fr-crit').textContent=crit;
  document.getElementById('fr-med').textContent=med;
  document.getElementById('fr-info').textContent=info;
  document.getElementById('fr-score').textContent=integ;
  document.getElementById('fr-score').className='kpi-value '+(integ>=80?'kpi-pos':integ>=60?'':'kpi-neg');

  if(!anomalies.length){
    document.getElementById('fraude-results').innerHTML='<div style="text-align:center;padding:32px;color:var(--green-dark);background:var(--green-light);border-radius:var(--radius);font-size:13px;font-weight:600">✓ Aucune anomalie détectée — vos '+EC.length+' écritures semblent conformes.</div>';
    return;
  }
  document.getElementById('fraude-results').innerHTML=anomalies.map(function(a){
    var cls=a.niveau==='haute'?'anomalie-haute':a.niveau==='moyenne'?'anomalie-moyenne':'anomalie-faible';
    return`<div class="anomalie-row ${cls}"><div class="anomalie-icon">${a.icon}</div><div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--text)">${a.titre}</div><div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;line-height:1.5">${a.desc}</div></div><div style="font-size:9px;font-weight:600;padding:2px 6px;border-radius:var(--radius);white-space:nowrap;background:${a.niveau==='haute'?'var(--red)':a.niveau==='moyenne'?'var(--amber)':'var(--blue)'};color:#fff">${a.niveau.toUpperCase()}</div></div>`;
  }).join('');
}

// ─────────────────────────────────────
// 5. MULTI-ENTREPRISES
// ─────────────────────────────────────
var ENTREPRISES_PORTEFEUILLE=JSON.parse(localStorage.getItem('comptaia_portefeuille')||'[]');

function renderMultiEntreprise(){
  // Ajouter l'entreprise actuelle si pas encore
  var nomActuel=(document.querySelector('.logo-sub')||{}).textContent||'Mon Entreprise';
  var existante=ENTREPRISES_PORTEFEUILLE.find(function(e){return e.nom===nomActuel;});
  if(!existante){
    var tPr=0,tCh=0;EC.concat(REGL).forEach(function(e){if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA)tPr+=e.credit;if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA)tCh+=e.debit;});
    ENTREPRISES_PORTEFEUILLE=[{nom:nomActuel,annee:EXERCICE.annee,ca:Math.round(tPr),charges:Math.round(tCh),res:Math.round(tPr-tCh),nbEcritures:EC.length,actif:true},...ENTREPRISES_PORTEFEUILLE.filter(function(e){return e.nom!==nomActuel;})];
    localStorage.setItem('comptaia_portefeuille',JSON.stringify(ENTREPRISES_PORTEFEUILLE));
  }
  var liste=document.getElementById('entreprises-liste');
  liste.innerHTML=ENTREPRISES_PORTEFEUILLE.map(function(e,i){
    return`<div class="entreprise-card ${e.actif?'active-co':''}" style="margin:8px;border-radius:var(--radius);padding:10px 12px" onclick="selectEntreprise(${i})">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div style="font-size:12.5px;font-weight:600">${e.nom}</div><div style="font-size:10px;color:var(--text-muted)">Ex. ${e.annee} · ${e.nbEcritures} écritures</div></div>
        ${e.actif?'<span style="font-size:9px;padding:1px 6px;border-radius:var(--radius);background:var(--green);color:#fff">Actif</span>':''}
      </div>
      <div style="margin-top:6px;display:flex;gap:12px;font-size:10px;color:var(--text-muted)">
        <span>CA : <strong style="color:var(--green)">${Math.round(e.ca).toLocaleString('fr-FR')}</strong></span>
        <span>Rés. : <strong style="color:${e.res>=0?'var(--green)':'var(--red)'}">${Math.round(e.res).toLocaleString('fr-FR')}</strong></span>
      </div>
    </div>`;
  }).join('');
  // Consolidation
  if(ENTREPRISES_PORTEFEUILLE.length>1){
    var totCA=ENTREPRISES_PORTEFEUILLE.reduce(function(a,e){return a+e.ca;},0);
    var totCh=ENTREPRISES_PORTEFEUILLE.reduce(function(a,e){return a+e.charges;},0);
    var totRes=ENTREPRISES_PORTEFEUILLE.reduce(function(a,e){return a+e.res;},0);
    document.getElementById('multi-compare').innerHTML=`
      <div style="font-size:12px;font-weight:600;margin-bottom:12px;color:var(--text-muted)">Consolidation du groupe (${ENTREPRISES_PORTEFEUILLE.length} entreprises)</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
        <div class="kpi" style="border-top:3px solid var(--green)"><div class="kpi-label">CA Consolidé</div><div class="kpi-value kpi-pos">${Math.round(totCA).toLocaleString('fr-FR')}</div><div class="kpi-sub">FCFA</div></div>
        <div class="kpi" style="border-top:3px solid var(--red)"><div class="kpi-label">Charges Totales</div><div class="kpi-value kpi-neg">${Math.round(totCh).toLocaleString('fr-FR')}</div><div class="kpi-sub">FCFA</div></div>
        <div class="kpi" style="border-top:3px solid ${totRes>=0?'var(--blue)':'var(--red)'}"><div class="kpi-label">Résultat Groupe</div><div class="kpi-value ${totRes>=0?'kpi-pos':'kpi-neg'}">${Math.round(totRes).toLocaleString('fr-FR')}</div><div class="kpi-sub">FCFA</div></div>
      </div>
      <table style="width:100%;font-size:11px">
        <thead><tr><th>Entreprise</th><th style="text-align:right">CA</th><th style="text-align:right">Charges</th><th style="text-align:right">Résultat</th><th style="text-align:right">Part CA</th></tr></thead>
        <tbody>${ENTREPRISES_PORTEFEUILLE.map(function(e){return`<tr><td style="font-weight:500">${e.nom}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${Math.round(e.ca).toLocaleString('fr-FR')}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${Math.round(e.charges).toLocaleString('fr-FR')}</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:600;color:${e.res>=0?'var(--green)':'var(--red)'}">${Math.round(e.res).toLocaleString('fr-FR')}</td><td style="text-align:right;color:var(--text-muted)">${totCA>0?Math.round(e.ca/totCA*100):'—'}%</td></tr>`;}).join('')}</tbody>
      </table>`;
  }
}
function creerEntreprise(){
  var nom=prompt('Nom de la nouvelle entreprise :');
  if(!nom)return;
  ENTREPRISES_PORTEFEUILLE.push({nom,annee:EXERCICE.annee,ca:0,charges:0,res:0,nbEcritures:0,actif:false});
  localStorage.setItem('comptaia_portefeuille',JSON.stringify(ENTREPRISES_PORTEFEUILLE));
  renderMultiEntreprise();
}
function selectEntreprise(i){
  ENTREPRISES_PORTEFEUILLE.forEach(function(e,j){e.actif=(j===i);});
  localStorage.setItem('comptaia_portefeuille',JSON.stringify(ENTREPRISES_PORTEFEUILLE));
  var nom=ENTREPRISES_PORTEFEUILLE[i].nom;
  document.querySelector('.logo-sub').textContent=nom;
  renderMultiEntreprise();
  alert('Entreprise active : '+nom+'. Pour basculer réellement les données, importez le fichier JSON de cette entreprise.');
}
function exporterEntreprise(){exporterJSON();}
function importerEntreprise(ev){lireJSON(ev);renderMultiEntreprise();}

// ─────────────────────────────────────
// 6. BENCHMARKS SECTORIELS
// ─────────────────────────────────────
var BENCH_DATA={
  commerce:{tpe:{margeNette:3,rotCreance:45,chargesCA:82,liquidite:110},pme:{margeNette:5,rotCreance:35,chargesCA:78,liquidite:130}},
  negoce:{tpe:{margeNette:4,rotCreance:40,chargesCA:80,liquidite:120},pme:{margeNette:6,rotCreance:30,chargesCA:76,liquidite:140}},
  services:{tpe:{margeNette:12,rotCreance:30,chargesCA:72,liquidite:160},pme:{margeNette:15,rotCreance:25,chargesCA:68,liquidite:180}},
  industrie:{tpe:{margeNette:6,rotCreance:50,chargesCA:80,liquidite:100},pme:{margeNette:8,rotCreance:40,chargesCA:77,liquidite:120}},
  btp:{tpe:{margeNette:4,rotCreance:60,chargesCA:83,liquidite:90},pme:{margeNette:6,rotCreance:45,chargesCA:80,liquidite:110}},
  agri:{tpe:{margeNette:8,rotCreance:35,chargesCA:78,liquidite:130},pme:{margeNette:10,rotCreance:28,chargesCA:74,liquidite:150}},
  transport:{tpe:{margeNette:5,rotCreance:40,chargesCA:81,liquidite:105},pme:{margeNette:7,rotCreance:32,chargesCA:78,liquidite:125}},
};
var benchChartInst=null;
function renderBenchmarks(){
  var secteur=document.getElementById('bench-secteur').value;
  var taille=document.getElementById('bench-taille').value||'tpe';
  var ref=(BENCH_DATA[secteur] && BENCH_DATA[secteur][taille] ? BENCH_DATA[secteur][taille] : (BENCH_DATA[secteur] && BENCH_DATA[secteur].tpe ? BENCH_DATA[secteur].tpe : {margeNette:5,rotCreance:45,chargesCA:80,liquidite:120}));
  var tPr=0,tCh=0,attMt=0;
  EC.concat(REGL).forEach(function(e){if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA)tPr+=e.credit;if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA)tCh+=e.debit;});
  var att=EC.filter(function(e){return e.stat==='attente'&&!e.isTVA&&!e.isAvance});
  attMt=att.reduce(function(a,e){return a+e.ttc;},0);
  var sc=typeof getSoldeCalcule==='function'?getSoldeCalcule():{caisse:0,banque:0};
  var treso=(sc.caisse||0)+(sc.banque||0);
  var margeNette=tPr>0?Math.round((tPr-tCh)/tPr*100):0;
  var rotCreance=tPr>0?Math.round(attMt/tPr*365):0;
  var chargesCA=tPr>0?Math.round(tCh/tPr*100):0;
  var liquidite=attMt>0?Math.round(treso/attMt*100):100;
  var ratios=[
    {label:'Marge nette (%)',vous:margeNette,ref:ref.margeNette,unit:'%',higher:true},
    {label:'Délai créances (jours)',vous:rotCreance,ref:ref.rotCreance,unit:'j',higher:false},
    {label:'Charges / CA (%)',vous:chargesCA,ref:ref.chargesCA,unit:'%',higher:false},
    {label:'Liquidité (%)',vous:liquidite,ref:ref.liquidite,unit:'%',higher:true},
  ];
  document.getElementById('bench-ratios').innerHTML=ratios.map(function(r){
    var good=r.higher?(r.vous>=r.ref):(r.vous<=r.ref);
    var diff=r.vous-r.ref;var maxBar=Math.max(r.vous,r.ref,1);
    return`<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:12px;font-weight:600">${r.label}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;font-weight:700;color:${good?'var(--green)':'var(--red)'}">${r.vous}${r.unit}</span>
          <span style="font-size:10px;color:var(--text-faint)">vs ${r.ref}${r.unit} secteur</span>
          <span style="font-size:10px;padding:1px 6px;border-radius:var(--radius);font-weight:600;background:${good?'var(--green-light)':'var(--red-light)'};color:${good?'var(--green-dark)':'var(--red)'}">${good?'✓ Meilleur':'⚠ Inférieur'}</span>
        </div>
      </div>
      <div style="position:relative;height:14px;background:var(--bg);border-radius:var(--radius);overflow:hidden;border:2px solid var(--border)">
        <div style="height:100%;width:${Math.min(100,r.vous/maxBar*100)}%;background:${good?'var(--green)':'var(--red)'};border-radius:var(--radius);transition:width .6s ease"></div>
        <div style="position:absolute;top:0;height:100%;left:${Math.min(100,r.ref/maxBar*100)}%;width:2px;background:var(--amber)"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-faint);margin-top:2px">
        <span>Vous : ${r.vous}${r.unit}</span><span style="color:var(--amber)">Référence secteur : ${r.ref}${r.unit}</span>
      </div>
    </div>`;
  }).join('');
  // Graphique radar via Chart.js bar
  if(benchChartInst)benchChartInst.destroy();
  var ctx=document.getElementById('bench-chart');
  if(ctx&&tPr>0){
    benchChartInst=new Chart(ctx,{type:'bar',data:{labels:ratios.map(function(r){return r.label;}),datasets:[{label:'Votre entreprise',data:ratios.map(function(r){return r.vous;}),backgroundColor:'rgba(var(--accent-rgb),.75)',borderColor:'var(--accent)',borderWidth:1,borderRadius:4},{label:'Moyenne secteur',data:ratios.map(function(r){return r.ref;}),backgroundColor:'rgba(186,117,23,.6)',borderColor:'#BA7517',borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:12,font:{size:11}}}},scales:{y:{beginAtZero:true}}}});
  }else if(ctx){
    document.getElementById('bench-ratios').innerHTML='<div style="color:var(--text-faint);font-style:italic;font-size:12px">Saisissez des factures pour voir votre comparaison avec le secteur.</div>';
  }
}

// ─────────────────────────────────────
// FINAL — Mise à jour footer et titre
// ─────────────────────────────────────
document.title='ComptaIA v12 — OHADA Togo';
document.querySelector('.sidebar-footer').textContent='ComptaIA v12 — OHADA Togo';
document.querySelector('.logo-sub').textContent='Mon Entreprise SARL';
