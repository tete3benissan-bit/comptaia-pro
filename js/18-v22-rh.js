// v22: full HR module (employees, contracts, presence, conges, perf, formation, recrutement, sante, discipline, docs) - extracted from ComptaIA_Pro_original.html lines 10997-11755
// ═══════════════════════════════════════════════════════════════
// GEST Africa v22 — RESSOURCES HUMAINES
// ═══════════════════════════════════════════════════════════════
(function(){
'use strict';
function q(id){return document.getElementById(id);}
function e22(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function uid(){return 'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function auj(){return new Date().toISOString().split('T')[0];}
function dFR(d){if(!d)return'—';var p=String(d).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d;}
function jRestants(fin){if(!fin)return null;return Math.ceil((new Date(fin)-new Date(auj()))/86400000);}
function jEntre(a,b){return Math.round((new Date(b)-new Date(a))/86400000)+1;}
function fN(n){return Math.round(n||0).toLocaleString('fr-FR');}

/* ─────────── DONNÉES ─────────── */
var RH={emp:[],contrats:[],pt:[],conges:[],evals:[],formations:[],budgetFormation:0,
        offres:[],cands:[],sante:[],disc:[],sign:null,docsGen:[],notifies:{}};
function rhCharger(){
  try{var d=localStorage.getItem('comptaia_rh');if(d){var o=JSON.parse(d);Object.keys(RH).forEach(function(k){if(o[k]!=null)RH[k]=o[k];});}}catch(e){}
}
function rhSave(){try{localStorage.setItem('comptaia_rh',JSON.stringify(RH));}catch(e){}}
function rhE(id){return RH.emp.find(function(x){return x.id===id;})||null;}
function rhNom(id){var e=rhE(id);return e?e.nom:'—';}
function rhActifs(){return RH.emp.filter(function(e){return e.statut!=='parti';});}
function optsEmp(sel){
  return '<option value="">— Employé —</option>'+rhActifs().map(function(e){
    return '<option value="'+e.id+'"'+(sel===e.id?' selected':'')+'>'+e22(e.nom)+'</option>';
  }).join('');
}
function notifRH(type,titre,det){try{if(typeof ajouterNotif==='function')ajouterNotif(type,titre,det);}catch(e){}}
function photoHTML(emp,lg){
  var cl=lg?'rh-photo-lg':'rh-photo';
  return emp&&emp.photo?'<img src="'+emp.photo+'" class="'+cl+'"/>':'<span class="'+cl+'">👤</span>';
}
function dernierContrat(empId){
  var cs=RH.contrats.filter(function(c){return c.empId===empId;});
  return cs.length?cs[cs.length-1]:null;
}

/* ─────────── CRÉATION DES PANNEAUX ─────────── */
function carte(titre,corpsId,extraHeader){
  return '<div class="card" style="margin-bottom:12px"><div class="card-header"><span class="card-title">'+titre+'</span>'+(extraHeader||'')+'</div><div class="card-body" id="'+corpsId+'"></div></div>';
}
function creerPanes(){
  var content=document.querySelector('.content');
  if(!content||q('pane-rh-dash'))return;
  var defs={
'rh-dash':
 '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">'+
 '<div><div style="font-size:15px;font-weight:700">Tableau de bord RH</div><div style="font-size:11px;color:var(--text-muted)">Vue d\'ensemble du personnel — indicateurs en temps réel</div></div>'+
 '<div style="display:flex;gap:6px"><button class="btn btn-sm" onclick="rhExporter()">💾 Exporter RH</button><button class="btn btn-sm" onclick="q(\'rh-import\').click()">📂 Importer</button><input type="file" id="rh-import" accept=".json" style="display:none" onchange="rhImporter(event)"/></div></div>'+
 '<div class="kpi-grid kpi-grid-4" id="rh-kpis" style="margin-bottom:12px"></div>'+
 '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
   carte('👫 Répartition & services','rh-repart')+carte('⏰ Contrats & anniversaires','rh-echeances')+
 '</div>'+carte('🏢 Organigramme (par service)','rh-orga'),
'rh-employes':
 '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">'+
 '<div><div style="font-size:15px;font-weight:700">Employés</div><div style="font-size:11px;color:var(--text-muted)">Dossiers complets : identité, photo, documents, parcours, contacts d\'urgence</div></div>'+
 '<button class="btn btn-primary btn-sm" onclick="rhNouvelEmp()">+ Nouvel employé</button></div>'+
 '<div class="card" id="rh-fiche-card" style="display:none;margin-bottom:12px"><div class="card-header"><span class="card-title" id="rh-fiche-titre">Nouvel employé</span><button class="rh-action" onclick="rhFermerFiche()">✕</button></div><div class="card-body" id="rh-fiche"></div></div>'+
 carte('Liste des employés <input type="text" id="rh-emp-filtre" placeholder="🔍 filtrer…" oninput="rhR_employes()" style="margin-left:10px;max-width:170px;font-size:11px;padding:5px 8px"/>','rh-emp-liste'),
'rh-contrats':
 '<div style="margin-bottom:12px"><div style="font-size:15px;font-weight:700">Contrats</div><div style="font-size:11px;color:var(--text-muted)">CDI, CDD, stage, prestataire — alertes automatiques 30 jours avant expiration</div></div>'+
 carte('Nouveau contrat','rh-contrat-form')+carte('Contrats en cours','rh-contrat-liste'),
'rh-presence':
 '<div style="margin-bottom:12px"><div style="font-size:15px;font-weight:700">Présence & pointage</div><div style="font-size:11px;color:var(--text-muted)">Pointage du jour, retards, absences, heures supplémentaires, travail de nuit</div></div>'+
 carte('Pointage <input type="date" id="rh-pt-date" style="margin-left:10px;font-size:11px;padding:5px 8px;max-width:150px" onchange="rhR_presence()"/>','rh-pt-grille')+
 carte('📈 Statistiques du mois','rh-pt-stats'),
'rh-conges':
 '<div style="margin-bottom:12px"><div style="font-size:15px;font-weight:700">Congés</div><div style="font-size:11px;color:var(--text-muted)">Demandes, validation, soldes (2,5 j/mois — OHADA Togo), calendrier des absences</div></div>'+
 '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+carte('Nouvelle demande','rh-cg-form')+carte('🧮 Soldes de congés','rh-cg-soldes')+'</div>'+
 carte('Demandes','rh-cg-liste')+carte('🗓️ Calendrier des absences à venir','rh-cg-cal'),
'rh-perf':
 '<div style="margin-bottom:12px"><div style="font-size:15px;font-weight:700">Performance</div><div style="font-size:11px;color:var(--text-muted)">Évaluations annuelles, objectifs, résultats, promotions</div></div>'+
 carte('Nouvelle évaluation','rh-pf-form')+carte('Historique des évaluations','rh-pf-liste'),
'rh-formation':
 '<div style="margin-bottom:12px"><div style="font-size:15px;font-weight:700">Formation</div><div style="font-size:11px;color:var(--text-muted)">Formations, certifications, expirations, budget</div></div>'+
 carte('Budget & nouvelle formation','rh-fo-form')+carte('Formations & certifications','rh-fo-liste'),
'rh-recrut':
 '<div style="margin-bottom:12px"><div style="font-size:15px;font-weight:700">Recrutement</div><div style="font-size:11px;color:var(--text-muted)">Offres, candidatures, entretiens, embauche en un clic</div></div>'+
 '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+carte('📢 Offres d\'emploi','rh-rc-offres')+carte('Nouvelle candidature','rh-rc-form')+'</div>'+
 carte('Candidatures','rh-rc-liste'),
'rh-sante':
 '<div style="margin-bottom:12px"><div style="font-size:15px;font-weight:700">Santé & sécurité</div><div style="font-size:11px;color:var(--text-muted)">Visites médicales, accidents de travail, EPI, incidents</div></div>'+
 carte('Nouvel enregistrement','rh-sa-form')+carte('Registre santé & sécurité','rh-sa-liste'),
'rh-discipline':
 '<div style="margin-bottom:12px"><div style="font-size:15px;font-weight:700">Discipline</div><div style="font-size:11px;color:var(--text-muted)">Avertissements, sanctions, historique disciplinaire</div></div>'+
 carte('Nouvelle mesure','rh-di-form')+carte('Historique disciplinaire <select id="rh-di-filtre" onchange="rhR_discipline()" style="margin-left:10px;font-size:11px;padding:5px 8px;max-width:180px"></select>','rh-di-liste'),
'rh-docs':
 '<div style="margin-bottom:12px"><div style="font-size:15px;font-weight:700">Documents RH</div><div style="font-size:11px;color:var(--text-muted)">Attestations, certificats de travail, lettres — générés, signés et imprimables en un clic</div></div>'+
 '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+carte('📄 Générer un document','rh-do-form')+carte('✍️ Signature électronique de l\'entreprise','rh-do-sign')+'</div>'+
 carte('Historique des documents générés','rh-do-liste')
  };
  Object.keys(defs).forEach(function(id){
    var p=document.createElement('div');
    p.className='pane';p.id='pane-'+id;p.innerHTML=defs[id];
    content.appendChild(p);
  });
  rhConstruireFormulaires();
}

/* ─────────── FORMULAIRES STATIQUES ─────────── */
function rhConstruireFormulaires(){
  /* Contrat */
  q('rh-contrat-form').innerHTML=
  '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">'+
  '<div class="fg"><label>Employé</label><select id="rh-ct-emp"></select></div>'+
  '<div class="fg"><label>Type</label><select id="rh-ct-type"><option>CDI</option><option>CDD</option><option>Stage</option><option>Prestataire</option></select></div>'+
  '<div class="fg"><label>Début</label><input type="date" id="rh-ct-debut"/></div>'+
  '<div class="fg"><label>Fin (vide si CDI)</label><input type="date" id="rh-ct-fin"/></div></div>'+
  '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="rhAjContrat()">💾 Enregistrer le contrat</button>';
  /* Congés */
  q('rh-cg-form').innerHTML=
  '<div class="fg" style="margin-bottom:8px"><label>Employé</label><select id="rh-cg-emp"></select></div>'+
  '<div class="fg" style="margin-bottom:8px"><label>Type</label><select id="rh-cg-type"><option value="paye">Congé payé</option><option value="maladie">Congé maladie</option><option value="maternite">Congé maternité</option><option value="sans_solde">Sans solde</option></select></div>'+
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px">'+
  '<div class="fg"><label>Du</label><input type="date" id="rh-cg-du"/></div>'+
  '<div class="fg"><label>Au</label><input type="date" id="rh-cg-au"/></div></div>'+
  '<div class="fg" style="margin-bottom:8px"><label>Motif</label><input type="text" id="rh-cg-motif" placeholder="optionnel"/></div>'+
  '<button class="btn btn-primary btn-sm" onclick="rhAjConge()">📨 Soumettre la demande</button>';
  /* Performance */
  q('rh-pf-form').innerHTML=
  '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'+
  '<div class="fg"><label>Employé</label><select id="rh-pf-emp"></select></div>'+
  '<div class="fg"><label>Année</label><input type="number" id="rh-pf-annee" value="'+new Date().getFullYear()+'"/></div>'+
  '<div class="fg"><label>Note globale (1-5)</label><input type="number" id="rh-pf-note" min="1" max="5" step="0.5" value="3"/></div>'+
  '<div class="fg"><label>Objectifs</label><input type="text" id="rh-pf-obj" placeholder="ex : +15% de ventes"/></div>'+
  '<div class="fg"><label>Résultats</label><input type="text" id="rh-pf-res" placeholder="ex : objectif atteint"/></div>'+
  '<div class="fg"><label>Promotion (nouveau poste)</label><input type="text" id="rh-pf-promo" placeholder="vide si aucune"/></div></div>'+
  '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="rhAjEval()">💾 Enregistrer l\'évaluation</button>';
  /* Formation */
  q('rh-fo-form').innerHTML=
  '<div class="rh-ligne" style="margin-bottom:10px"><span class="rh-lbl">Budget formation annuel</span><input type="number" id="rh-fo-budget" style="max-width:160px" onchange="rhMajBudget(this.value)"/><span style="font-size:11px;color:var(--text-muted)">FCFA</span></div>'+
  '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'+
  '<div class="fg"><label>Employé</label><select id="rh-fo-emp"></select></div>'+
  '<div class="fg"><label>Intitulé</label><input type="text" id="rh-fo-titre" placeholder="ex : Excel avancé"/></div>'+
  '<div class="fg"><label>Type</label><select id="rh-fo-type"><option value="formation">Formation</option><option value="certification">Certification</option></select></div>'+
  '<div class="fg"><label>Date</label><input type="date" id="rh-fo-date"/></div>'+
  '<div class="fg"><label>Expiration (certif.)</label><input type="date" id="rh-fo-exp"/></div>'+
  '<div class="fg"><label>Coût (FCFA)</label><input type="number" id="rh-fo-cout" min="0"/></div></div>'+
  '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="rhAjFormation()">💾 Enregistrer</button>';
  /* Recrutement */
  q('rh-rc-form').innerHTML=
  '<div class="fg" style="margin-bottom:8px"><label>Nom du candidat</label><input type="text" id="rh-rc-nom"/></div>'+
  '<div class="fg" style="margin-bottom:8px"><label>Poste visé</label><input type="text" id="rh-rc-poste" list="rh-offres-dl"/><datalist id="rh-offres-dl"></datalist></div>'+
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px">'+
  '<div class="fg"><label>Note entretien (1-5)</label><input type="number" id="rh-rc-note" min="1" max="5" step="0.5"/></div>'+
  '<div class="fg"><label>Statut</label><select id="rh-rc-statut"><option value="recu">Candidature reçue</option><option value="entretien">Entretien planifié</option><option value="refuse">Refusé</option></select></div></div>'+
  '<div class="fg" style="margin-bottom:8px"><label>Notes du recruteur</label><input type="text" id="rh-rc-com"/></div>'+
  '<button class="btn btn-primary btn-sm" onclick="rhAjCand()">💾 Enregistrer la candidature</button>';
  /* Santé */
  q('rh-sa-form').innerHTML=
  '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">'+
  '<div class="fg"><label>Employé</label><select id="rh-sa-emp"></select></div>'+
  '<div class="fg"><label>Type</label><select id="rh-sa-type"><option value="visite">Visite médicale</option><option value="accident">Accident de travail</option><option value="incident">Incident</option><option value="epi">Remise d\'EPI</option></select></div>'+
  '<div class="fg"><label>Date</label><input type="date" id="rh-sa-date"/></div>'+
  '<div class="fg"><label>Prochaine visite</label><input type="date" id="rh-sa-next"/></div></div>'+
  '<div class="fg" style="margin-top:8px"><label>Détails</label><input type="text" id="rh-sa-det" placeholder="description, équipements remis, gravité…"/></div>'+
  '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="rhAjSante()">💾 Enregistrer</button>';
  /* Discipline */
  q('rh-di-form').innerHTML=
  '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'+
  '<div class="fg"><label>Employé</label><select id="rh-di-emp"></select></div>'+
  '<div class="fg"><label>Mesure</label><select id="rh-di-type"><option value="avertissement">Avertissement</option><option value="sanction">Sanction</option></select></div>'+
  '<div class="fg"><label>Date</label><input type="date" id="rh-di-date" value="'+auj()+'"/></div></div>'+
  '<div class="fg" style="margin-top:8px"><label>Motif</label><input type="text" id="rh-di-motif"/></div>'+
  '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="rhAjDisc()">💾 Enregistrer</button>';
  /* Documents */
  q('rh-do-form').innerHTML=
  '<div class="fg" style="margin-bottom:8px"><label>Employé</label><select id="rh-do-emp"></select></div>'+
  '<div class="fg" style="margin-bottom:8px"><label>Type de document</label><select id="rh-do-type">'+
    '<option value="attestation">Attestation de travail</option>'+
    '<option value="certificat">Certificat de travail</option>'+
    '<option value="conge">Autorisation de congé</option>'+
    '<option value="felicitations">Lettre de félicitations</option></select></div>'+
  '<button class="btn btn-primary btn-sm" onclick="rhGenererDoc()">🖨️ Générer & imprimer</button>'+
  '<div style="font-size:10.5px;color:var(--text-muted);margin-top:8px">Le document s\'ouvre prêt à imprimer ou enregistrer en PDF, avec la signature électronique si elle est définie.</div>';
  q('rh-do-sign').innerHTML=
  '<canvas id="rh-signpad" width="300" height="100"></canvas>'+
  '<div style="display:flex;gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap">'+
  '<button class="btn btn-sm" onclick="rhSignEffacer()">✕ Effacer</button>'+
  '<button class="btn btn-primary btn-sm" onclick="rhSignSauver()">💾 Enregistrer la signature</button>'+
  '<span id="rh-sign-etat" style="font-size:11px;color:var(--text-muted)"></span></div>';
  rhInitSignature();
  var d=q('rh-pt-date');if(d)d.value=auj();
}

/* ─────────── EMPLOYÉS ─────────── */
var EMP_EDIT=null;
window.rhNouvelEmp=function(){EMP_EDIT=null;rhOuvrirFiche({});};
window.rhEditerEmp=function(id){EMP_EDIT=id;rhOuvrirFiche(rhE(id)||{});};
window.rhFermerFiche=function(){var c=q('rh-fiche-card');if(c)c.style.display='none';};
function rhOuvrirFiche(e){
  var c=q('rh-fiche-card');if(!c)return;
  q('rh-fiche-titre').textContent=e.id?('Fiche — '+e.nom):'Nouvel employé';
  q('rh-fiche').innerHTML=
  '<div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px">'+
  '<div style="text-align:center">'+photoHTML(e,true)+'<br/><button class="btn btn-sm" style="margin-top:6px" onclick="q(\'rh-photo-in\').click()">📷 Photo</button><input type="file" id="rh-photo-in" accept="image/*" style="display:none" onchange="rhPhoto(event)"/></div>'+
  '<div style="flex:1;min-width:240px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'+
    '<div class="fg"><label>Nom complet *</label><input type="text" id="rh-f-nom" value="'+e22(e.nom||'')+'"/></div>'+
    '<div class="fg"><label>Poste</label><input type="text" id="rh-f-poste" value="'+e22(e.poste||'')+'"/></div>'+
    '<div class="fg"><label>Service</label><input type="text" id="rh-f-service" value="'+e22(e.service||'')+'" placeholder="ex : Ventes"/></div>'+
    '<div class="fg"><label>Sexe</label><select id="rh-f-sexe"><option value="H"'+(e.sexe==='H'?' selected':'')+'>Homme</option><option value="F"'+(e.sexe==='F'?' selected':'')+'>Femme</option></select></div>'+
    '<div class="fg"><label>Naissance</label><input type="date" id="rh-f-naiss" value="'+(e.naissance||'')+'"/></div>'+
    '<div class="fg"><label>Embauche</label><input type="date" id="rh-f-emb" value="'+(e.embauche||auj())+'"/></div>'+
    '<div class="fg"><label>Téléphone</label><input type="text" id="rh-f-tel" value="'+e22(e.tel||'')+'"/></div>'+
    '<div class="fg"><label>Email</label><input type="text" id="rh-f-email" value="'+e22(e.email||'')+'"/></div>'+
    '<div class="fg"><label>Salaire de base (FCFA)</label><input type="number" id="rh-f-sal" value="'+(e.salaire||'')+'"/></div>'+
    '<div class="fg"><label>Contact d\'urgence — nom</label><input type="text" id="rh-f-urgnom" value="'+e22(e.urgNom||'')+'"/></div>'+
    '<div class="fg"><label>Contact d\'urgence — tél.</label><input type="text" id="rh-f-urgtel" value="'+e22(e.urgTel||'')+'"/></div>'+
    '<div class="fg"><label>Statut</label><select id="rh-f-statut"><option value="actif"'+(e.statut!=='parti'?' selected':'')+'>Actif</option><option value="parti"'+(e.statut==='parti'?' selected':'')+'>Parti</option></select></div>'+
  '</div></div>'+
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
    '<div><div class="section-label">📎 Documents (CNI, diplôme, contrat…)</div><div id="rh-f-docs"></div>'+
      '<button class="btn btn-sm" onclick="q(\'rh-doc-in\').click()">+ Ajouter un document</button><input type="file" id="rh-doc-in" style="display:none" onchange="rhAjDoc(event)"/></div>'+
    '<div><div class="section-label">🧭 Historique des postes</div><div id="rh-f-postes"></div>'+
      '<div style="display:flex;gap:6px;margin-top:4px"><input type="text" id="rh-f-npos" placeholder="Nouveau poste" style="flex:1"/><button class="btn btn-sm" onclick="rhChangerPoste()">Changer</button></div></div>'+
  '</div>'+
  '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'+
  '<button class="btn btn-primary" onclick="rhSauverEmp()">💾 Enregistrer l\'employé</button>'+
  (e.id?'<button class="btn btn-sm" onclick="go(\'paie\')">💰 Gérer sa paie</button><button class="btn btn-sm" style="color:var(--red)" onclick="rhSupprEmp(\''+e.id+'\')">🗑️ Supprimer</button>':'')+
  '</div>';
  window._FICHE_TMP={photo:e.photo||null,docs:(e.docs||[]).slice(),postes:(e.postes||[]).slice()};
  rhRendreDocsFiche();rhRendrePostesFiche();
  c.style.display='block';
  c.scrollIntoView({behavior:'smooth',block:'start'});
}
function rhRendreDocsFiche(){
  var z=q('rh-f-docs');if(!z)return;
  var ds=window._FICHE_TMP.docs;
  z.innerHTML=ds.length?ds.map(function(d,i){
    return '<div class="rh-doc-item"><span>📄</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis">'+e22(d.n)+'</span><span style="color:var(--text-faint)">'+Math.round(d.taille/1024)+' Ko</span>'+
    (d.data?'<a href="'+d.data+'" download="'+e22(d.n)+'" class="rh-action" title="Télécharger">⬇️</a>':'')+
    '<button class="rh-action" onclick="rhSupDoc('+i+')" style="color:var(--red)">✕</button></div>';
  }).join(''):'<div style="font-size:11px;color:var(--text-faint);font-style:italic;margin-bottom:6px">Aucun document</div>';
}
function rhRendrePostesFiche(){
  var z=q('rh-f-postes');if(!z)return;
  var ps=window._FICHE_TMP.postes;
  z.innerHTML=ps.length?ps.map(function(p){return '<div style="font-size:11.5px;padding:3px 0">• <strong>'+e22(p.poste)+'</strong> <span style="color:var(--text-faint)">depuis le '+dFR(p.date)+'</span></div>';}).join(''):'<div style="font-size:11px;color:var(--text-faint);font-style:italic;margin-bottom:6px">Aucun changement enregistré</div>';
}
window.rhSupDoc=function(i){window._FICHE_TMP.docs.splice(i,1);rhRendreDocsFiche();};
window.rhChangerPoste=function(){
  var np=q('rh-f-npos').value.trim();if(!np)return;
  window._FICHE_TMP.postes.push({date:auj(),poste:np});
  q('rh-f-poste').value=np;q('rh-f-npos').value='';
  rhRendrePostesFiche();
};
window.rhPhoto=function(ev){
  var f=ev.target.files&&ev.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(e){
    var img=new Image();
    img.onload=function(){
      var c=document.createElement('canvas'),m=280,ratio=Math.min(1,m/Math.max(img.width,img.height));
      c.width=Math.round(img.width*ratio);c.height=Math.round(img.height*ratio);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      window._FICHE_TMP.photo=c.toDataURL('image/jpeg',.82);
      var ph=q('rh-fiche').querySelector('.rh-photo-lg');
      if(ph)ph.outerHTML='<img src="'+window._FICHE_TMP.photo+'" class="rh-photo-lg"/>';
    };
    img.src=e.target.result;
  };
  r.readAsDataURL(f);
};
window.rhAjDoc=function(ev){
  var f=ev.target.files&&ev.target.files[0];if(!f)return;
  if(f.size>400*1024){
    window._FICHE_TMP.docs.push({n:f.name,taille:f.size,data:null});
    rhRendreDocsFiche();
    alert('Fichier > 400 Ko : seul le nom est archivé (pour préserver le stockage local).');
    return;
  }
  var r=new FileReader();
  r.onload=function(e){window._FICHE_TMP.docs.push({n:f.name,taille:f.size,data:e.target.result});rhRendreDocsFiche();};
  r.readAsDataURL(f);
};
window.rhSauverEmp=function(){
  var nom=q('rh-f-nom').value.trim();
  if(!nom)return alert('Le nom est obligatoire.');
  var e=EMP_EDIT?rhE(EMP_EDIT):null;
  if(!e){e={id:uid(),postes:[],docs:[]};RH.emp.push(e);}
  e.nom=nom;e.poste=q('rh-f-poste').value.trim();e.service=q('rh-f-service').value.trim()||'Général';
  e.sexe=q('rh-f-sexe').value;e.naissance=q('rh-f-naiss').value;e.embauche=q('rh-f-emb').value;
  e.tel=q('rh-f-tel').value.trim();e.email=q('rh-f-email').value.trim();
  e.salaire=parseFloat(q('rh-f-sal').value)||0;
  e.urgNom=q('rh-f-urgnom').value.trim();e.urgTel=q('rh-f-urgtel').value.trim();
  e.statut=q('rh-f-statut').value;
  e.photo=window._FICHE_TMP.photo;e.docs=window._FICHE_TMP.docs;e.postes=window._FICHE_TMP.postes;
  if(!e.postes.length&&e.poste)e.postes.push({date:e.embauche||auj(),poste:e.poste});
  rhSave();rhFermerFiche();rhRenderTout();
  notifRH('info','👤 Employé enregistré : '+e.nom,(e.poste||'')+' — '+(e.service||''));
};
window.rhSupprEmp=function(id){
  if(!confirm('Supprimer définitivement cet employé et son historique RH ?'))return;
  RH.emp=RH.emp.filter(function(x){return x.id!==id;});
  ['contrats','conges','evals','formations','sante','disc'].forEach(function(k){RH[k]=RH[k].filter(function(x){return x.empId!==id;});});
  RH.pt=RH.pt.filter(function(x){return x.empId!==id;});
  rhSave();rhFermerFiche();rhRenderTout();
};
window.rhR_employes=function(){
  var z=q('rh-emp-liste');if(!z)return;
  var f=(q('rh-emp-filtre')&&q('rh-emp-filtre').value||'').toLowerCase();
  var lst=RH.emp.filter(function(e){return !f||(e.nom+' '+(e.poste||'')+' '+(e.service||'')).toLowerCase().indexOf(f)>-1;});
  if(!lst.length){z.innerHTML='<div class="rh-vide">Aucun employé — cliquez sur « + Nouvel employé » pour commencer.</div>';return;}
  z.innerHTML='<div class="table-wrap"><table style="width:100%;border-collapse:collapse" class="rh-mini-table"><thead><tr><th></th><th style="text-align:left">Nom</th><th style="text-align:left">Poste</th><th style="text-align:left">Service</th><th style="text-align:left">Contrat</th><th style="text-align:right">Salaire</th><th>Statut</th><th></th></tr></thead><tbody>'+
  lst.map(function(e){
    var ct=dernierContrat(e.id);
    return '<tr><td>'+photoHTML(e)+'</td><td><strong>'+e22(e.nom)+'</strong></td><td>'+e22(e.poste||'—')+'</td><td>'+e22(e.service||'—')+'</td>'+
    '<td>'+(ct?'<span class="tagr tagr-info">'+ct.type+'</span>':'<span class="tagr tagr-neutre">aucun</span>')+'</td>'+
    '<td style="text-align:right;font-variant-numeric:tabular-nums">'+fN(e.salaire)+'</td>'+
    '<td style="text-align:center">'+(e.statut==='parti'?'<span class="tagr tagr-bad">parti</span>':'<span class="tagr tagr-ok">actif</span>')+'</td>'+
    '<td style="white-space:nowrap"><button class="rh-action" title="Fiche" onclick="rhEditerEmp(\''+e.id+'\')">✏️</button></td></tr>';
  }).join('')+'</tbody></table></div>';
};

/* ─────────── CONTRATS ─────────── */
window.rhAjContrat=function(){
  var empId=q('rh-ct-emp').value;if(!empId)return alert('Choisissez un employé.');
  var c={id:uid(),empId:empId,type:q('rh-ct-type').value,debut:q('rh-ct-debut').value||auj(),fin:q('rh-ct-fin').value||null};
  RH.contrats.push(c);rhSave();rhRenderTout();
  notifRH('info','📃 Contrat '+c.type+' — '+rhNom(empId),'Du '+dFR(c.debut)+(c.fin?' au '+dFR(c.fin):' (durée indéterminée)'));
};
window.rhRenouveler=function(id){
  var c=RH.contrats.find(function(x){return x.id===id;});if(!c||!c.fin)return;
  var f=new Date(c.fin);f.setFullYear(f.getFullYear()+1);
  c.fin=f.toISOString().split('T')[0];delete RH.notifies['ct'+c.id];
  rhSave();rhRenderTout();
  notifRH('info','🔄 Contrat renouvelé — '+rhNom(c.empId),'Nouvelle échéance : '+dFR(c.fin));
};
window.rhTerminerContrat=function(id){
  var c=RH.contrats.find(function(x){return x.id===id;});if(!c)return;
  if(!confirm('Mettre fin à ce contrat aujourd\'hui ?'))return;
  c.fin=auj();rhSave();rhRenderTout();
};
window.rhR_contrats=function(){
  var z=q('rh-contrat-liste');if(!z)return;
  var s=q('rh-ct-emp');if(s)s.innerHTML=optsEmp(s.value);
  if(!RH.contrats.length){z.innerHTML='<div class="rh-vide">Aucun contrat enregistré.</div>';return;}
  z.innerHTML='<div class="table-wrap"><table style="width:100%;border-collapse:collapse" class="rh-mini-table"><thead><tr><th style="text-align:left">Employé</th><th>Type</th><th>Début</th><th>Fin</th><th>Statut</th><th></th></tr></thead><tbody>'+
  RH.contrats.slice().reverse().map(function(c){
    var jr=jRestants(c.fin),tag;
    if(!c.fin)tag='<span class="tagr tagr-ok">en cours</span>';
    else if(jr<0)tag='<span class="tagr tagr-bad">terminé</span>';
    else if(jr<=30)tag='<span class="tagr tagr-warn">expire dans '+jr+' j</span>';
    else tag='<span class="tagr tagr-ok">en cours</span>';
    return '<tr><td>'+e22(rhNom(c.empId))+'</td><td style="text-align:center"><span class="tagr tagr-info">'+c.type+'</span></td><td style="text-align:center">'+dFR(c.debut)+'</td><td style="text-align:center">'+dFR(c.fin)+'</td><td style="text-align:center">'+tag+'</td>'+
    '<td style="white-space:nowrap;text-align:right">'+(c.fin&&jr>=0?'<button class="btn btn-sm" onclick="rhRenouveler(\''+c.id+'\')">🔄 Renouveler</button> ':'')+(!c.fin||jr>0?'<button class="btn btn-sm" onclick="rhTerminerContrat(\''+c.id+'\')">⏹ Terminer</button>':'')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
};
function rhVerifierContrats(){
  RH.contrats.forEach(function(c){
    var jr=jRestants(c.fin);
    if(c.fin&&jr!=null&&jr>=0&&jr<=30&&!RH.notifies['ct'+c.id]){
      RH.notifies['ct'+c.id]=1;
      notifRH('alerte','⏰ Contrat qui expire — '+rhNom(c.empId),c.type+' : fin le '+dFR(c.fin)+' ('+jr+' jours restants)');
    }
  });
  rhSave();
}

/* ─────────── PRÉSENCE ─────────── */
function ptDe(date,empId){return RH.pt.find(function(p){return p.date===date&&p.empId===empId;})||null;}
window.rhPointer=function(empId,etat){
  var date=q('rh-pt-date').value||auj();
  var p=ptDe(date,empId);
  if(!p){p={date:date,empId:empId,etat:etat,hsup:0,nuit:false};RH.pt.push(p);}
  else p.etat=etat;
  rhSave();rhR_presence();
};
window.rhHSup=function(empId,v){
  var date=q('rh-pt-date').value||auj();
  var p=ptDe(date,empId);
  if(!p){p={date:date,empId:empId,etat:'present',hsup:0,nuit:false};RH.pt.push(p);}
  p.hsup=parseFloat(v)||0;rhSave();
};
window.rhNuit=function(empId,on){
  var date=q('rh-pt-date').value||auj();
  var p=ptDe(date,empId);
  if(!p){p={date:date,empId:empId,etat:'present',hsup:0,nuit:false};RH.pt.push(p);}
  p.nuit=!!on;rhSave();
};
window.rhR_presence=function(){
  var z=q('rh-pt-grille');if(!z)return;
  var date=(q('rh-pt-date')&&q('rh-pt-date').value)||auj();
  var lst=rhActifs();
  if(!lst.length){z.innerHTML='<div class="rh-vide">Ajoutez d\'abord des employés.</div>';}
  else z.innerHTML='<div class="table-wrap"><table style="width:100%;border-collapse:collapse" class="rh-mini-table"><thead><tr><th style="text-align:left">Employé</th><th>Pointage</th><th>H. supp</th><th>Nuit</th></tr></thead><tbody>'+
  lst.map(function(e){
    var p=ptDe(date,e.id)||{};
    return '<tr><td>'+photoHTML(e)+' '+e22(e.nom)+'</td>'+
    '<td style="text-align:center;white-space:nowrap">'+
      '<button class="pt-btn'+(p.etat==='present'?' actif-p':'')+'" onclick="rhPointer(\''+e.id+'\',\'present\')">✓ Présent</button> '+
      '<button class="pt-btn'+(p.etat==='retard'?' actif-r':'')+'" onclick="rhPointer(\''+e.id+'\',\'retard\')">⏱ Retard</button> '+
      '<button class="pt-btn'+(p.etat==='absent'?' actif-a':'')+'" onclick="rhPointer(\''+e.id+'\',\'absent\')">✕ Absent</button></td>'+
    '<td style="text-align:center"><input type="number" min="0" step="0.5" value="'+(p.hsup||0)+'" style="max-width:70px;text-align:center" onchange="rhHSup(\''+e.id+'\',this.value)"/></td>'+
    '<td style="text-align:center"><input type="checkbox" '+(p.nuit?'checked':'')+' onchange="rhNuit(\''+e.id+'\',this.checked)" style="width:18px;height:18px"/></td></tr>';
  }).join('')+'</tbody></table></div>';
  /* stats du mois */
  var zs=q('rh-pt-stats');if(!zs)return;
  var mois=date.slice(0,7);
  var duMois=RH.pt.filter(function(p){return p.date.slice(0,7)===mois;});
  var ret=duMois.filter(function(p){return p.etat==='retard';}).length;
  var abs=duMois.filter(function(p){return p.etat==='absent';}).length;
  var hs=duMois.reduce(function(s,p){return s+(p.hsup||0);},0);
  var nuits=duMois.filter(function(p){return p.nuit;}).length;
  zs.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center">'+
  [['Retards',ret,'var(--amber)'],['Absences',abs,'var(--red)'],['Heures supp.',hs+' h','var(--blue)'],['Nuits travaillées',nuits,'var(--text)']].map(function(k){
    return '<div><div style="font-size:20px;font-weight:800;color:'+k[2]+'">'+k[1]+'</div><div style="font-size:10.5px;color:var(--text-muted)">'+k[0]+' — '+mois+'</div></div>';
  }).join('')+'</div>';
};

/* ─────────── CONGÉS ─────────── */
function soldeConges(empId){
  var e=rhE(empId);if(!e)return 0;
  var an=new Date().getFullYear();
  var deb=new Date(Math.max(new Date(e.embauche||an+'-01-01'),new Date(an+'-01-01')));
  var mois=Math.max(0,(new Date().getMonth()-deb.getMonth())+(new Date().getFullYear()-deb.getFullYear())*12+1);
  var acquis=Math.min(30,mois*2.5);
  var pris=RH.conges.filter(function(c){return c.empId===empId&&c.type==='paye'&&c.statut==='approuve'&&c.du.slice(0,4)==String(an);})
    .reduce(function(s,c){return s+jEntre(c.du,c.au);},0);
  return Math.round((acquis-pris)*10)/10;
}
window.rhAjConge=function(){
  var empId=q('rh-cg-emp').value;if(!empId)return alert('Choisissez un employé.');
  var du=q('rh-cg-du').value,au=q('rh-cg-au').value;
  if(!du||!au||au<du)return alert('Vérifiez les dates.');
  var c={id:uid(),empId:empId,type:q('rh-cg-type').value,du:du,au:au,motif:q('rh-cg-motif').value.trim(),statut:'attente'};
  RH.conges.push(c);rhSave();rhR_conges();
  notifRH('info','🌴 Demande de congé — '+rhNom(empId),dFR(du)+' → '+dFR(au)+' ('+jEntre(du,au)+' j)');
};
window.rhStatutConge=function(id,st){
  var c=RH.conges.find(function(x){return x.id===id;});if(!c)return;
  c.statut=st;rhSave();rhR_conges();rhR_dash();
  notifRH('info',(st==='approuve'?'✅ Congé approuvé — ':'🚫 Congé refusé — ')+rhNom(c.empId),dFR(c.du)+' → '+dFR(c.au));
};
var TYPES_CG={paye:'Congé payé',maladie:'Maladie',maternite:'Maternité',sans_solde:'Sans solde'};
window.rhR_conges=function(){
  var s=q('rh-cg-emp');if(s)s.innerHTML=optsEmp(s.value);
  var z=q('rh-cg-liste');
  if(z){
    if(!RH.conges.length)z.innerHTML='<div class="rh-vide">Aucune demande.</div>';
    else z.innerHTML='<div class="table-wrap"><table style="width:100%;border-collapse:collapse" class="rh-mini-table"><thead><tr><th style="text-align:left">Employé</th><th>Type</th><th>Période</th><th>Jours</th><th>Statut</th><th></th></tr></thead><tbody>'+
    RH.conges.slice().reverse().map(function(c){
      var tag=c.statut==='approuve'?'<span class="tagr tagr-ok">approuvé</span>':c.statut==='refuse'?'<span class="tagr tagr-bad">refusé</span>':'<span class="tagr tagr-warn">en attente</span>';
      return '<tr><td>'+e22(rhNom(c.empId))+'</td><td style="text-align:center">'+TYPES_CG[c.type]+'</td><td style="text-align:center">'+dFR(c.du)+' → '+dFR(c.au)+'</td><td style="text-align:center">'+jEntre(c.du,c.au)+'</td><td style="text-align:center">'+tag+'</td>'+
      '<td style="white-space:nowrap;text-align:right">'+(c.statut==='attente'?'<button class="btn btn-sm" onclick="rhStatutConge(\''+c.id+'\',\'approuve\')">✅</button> <button class="btn btn-sm" onclick="rhStatutConge(\''+c.id+'\',\'refuse\')">🚫</button>':'')+'</td></tr>';
    }).join('')+'</tbody></table></div>';
  }
  var zs=q('rh-cg-soldes');
  if(zs){
    var lst=rhActifs();
    zs.innerHTML=lst.length?lst.map(function(e){
      var s2=soldeConges(e.id);
      return '<div class="rh-ligne"><span class="rh-lbl">'+e22(e.nom)+'</span><div class="rh-bar"><div style="width:'+Math.max(0,Math.min(100,s2/30*100))+'%"></div></div><strong style="font-size:11.5px;min-width:52px;text-align:right">'+s2+' j</strong></div>';
    }).join(''):'<div class="rh-vide">—</div>';
  }
  var zc=q('rh-cg-cal');
  if(zc){
    var av=RH.conges.filter(function(c){return c.statut==='approuve'&&c.au>=auj();}).sort(function(a,b){return a.du<b.du?-1:1;});
    zc.innerHTML=av.length?av.map(function(c){
      return '<div class="rh-ligne"><span style="font-size:14px">🗓️</span><strong style="font-size:12px">'+e22(rhNom(c.empId))+'</strong><span style="font-size:11.5px;color:var(--text-muted)">'+TYPES_CG[c.type]+' · '+dFR(c.du)+' → '+dFR(c.au)+'</span></div>';
    }).join(''):'<div class="rh-vide">Aucune absence à venir.</div>';
  }
};

/* ─────────── PERFORMANCE ─────────── */
window.rhAjEval=function(){
  var empId=q('rh-pf-emp').value;if(!empId)return alert('Choisissez un employé.');
  var promo=q('rh-pf-promo').value.trim();
  var ev={id:uid(),empId:empId,annee:q('rh-pf-annee').value,objectifs:q('rh-pf-obj').value.trim(),
          resultat:q('rh-pf-res').value.trim(),note:parseFloat(q('rh-pf-note').value)||0,promotion:promo||null};
  RH.evals.push(ev);
  if(promo){var e=rhE(empId);if(e){e.poste=promo;(e.postes=e.postes||[]).push({date:auj(),poste:promo});notifRH('info','🎉 Promotion — '+e.nom,'Nouveau poste : '+promo);}}
  rhSave();rhRenderTout();
};
window.rhR_perf=function(){
  var s=q('rh-pf-emp');if(s)s.innerHTML=optsEmp(s.value);
  var z=q('rh-pf-liste');if(!z)return;
  if(!RH.evals.length){z.innerHTML='<div class="rh-vide">Aucune évaluation.</div>';return;}
  z.innerHTML='<div class="table-wrap"><table style="width:100%;border-collapse:collapse" class="rh-mini-table"><thead><tr><th style="text-align:left">Employé</th><th>Année</th><th>Note</th><th style="text-align:left">Objectifs</th><th style="text-align:left">Résultats</th><th>Promotion</th></tr></thead><tbody>'+
  RH.evals.slice().reverse().map(function(v){
    var etoiles='★★★★★'.slice(0,Math.round(v.note))+'☆☆☆☆☆'.slice(0,5-Math.round(v.note));
    return '<tr><td>'+e22(rhNom(v.empId))+'</td><td style="text-align:center">'+v.annee+'</td><td style="text-align:center;color:var(--amber);letter-spacing:1px">'+etoiles+'</td><td>'+e22(v.objectifs||'—')+'</td><td>'+e22(v.resultat||'—')+'</td><td style="text-align:center">'+(v.promotion?'<span class="tagr tagr-ok">'+e22(v.promotion)+'</span>':'—')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
};

/* ─────────── FORMATION ─────────── */
window.rhMajBudget=function(v){RH.budgetFormation=parseFloat(v)||0;rhSave();rhR_formation();};
window.rhAjFormation=function(){
  var empId=q('rh-fo-emp').value;if(!empId)return alert('Choisissez un employé.');
  RH.formations.push({id:uid(),empId:empId,titre:q('rh-fo-titre').value.trim(),type:q('rh-fo-type').value,
    date:q('rh-fo-date').value,expire:q('rh-fo-exp').value||null,cout:parseFloat(q('rh-fo-cout').value)||0});
  rhSave();rhR_formation();
};
window.rhR_formation=function(){
  var s=q('rh-fo-emp');if(s)s.innerHTML=optsEmp(s.value);
  var b=q('rh-fo-budget');if(b&&document.activeElement!==b)b.value=RH.budgetFormation||'';
  var z=q('rh-fo-liste');if(!z)return;
  var consomme=RH.formations.reduce(function(s2,f){return s2+(f.cout||0);},0);
  var tete='<div class="rh-ligne" style="margin-bottom:10px"><span class="rh-lbl">Budget consommé</span><div class="rh-bar"><div style="width:'+(RH.budgetFormation?Math.min(100,consomme/RH.budgetFormation*100):0)+'%;background:'+(RH.budgetFormation&&consomme>RH.budgetFormation?'var(--red)':'var(--accent,var(--green))')+'"></div></div><strong style="font-size:11.5px;white-space:nowrap">'+fN(consomme)+' / '+fN(RH.budgetFormation)+' F</strong></div>';
  if(!RH.formations.length){z.innerHTML=tete+'<div class="rh-vide">Aucune formation.</div>';return;}
  z.innerHTML=tete+'<div class="table-wrap"><table style="width:100%;border-collapse:collapse" class="rh-mini-table"><thead><tr><th style="text-align:left">Employé</th><th style="text-align:left">Intitulé</th><th>Type</th><th>Date</th><th>Expiration</th><th style="text-align:right">Coût</th></tr></thead><tbody>'+
  RH.formations.slice().reverse().map(function(f){
    var jr=jRestants(f.expire),tag='—';
    if(f.expire){tag=jr<0?'<span class="tagr tagr-bad">expirée</span>':jr<=60?'<span class="tagr tagr-warn">'+dFR(f.expire)+' ('+jr+' j)</span>':dFR(f.expire);}
    return '<tr><td>'+e22(rhNom(f.empId))+'</td><td>'+e22(f.titre)+'</td><td style="text-align:center"><span class="tagr '+(f.type==='certification'?'tagr-info':'tagr-neutre')+'">'+f.type+'</span></td><td style="text-align:center">'+dFR(f.date)+'</td><td style="text-align:center">'+tag+'</td><td style="text-align:right">'+fN(f.cout)+'</td></tr>';
  }).join('')+'</tbody></table></div>';
};

/* ─────────── RECRUTEMENT ─────────── */
window.rhAjOffre=function(){
  var p=q('rh-of-poste').value.trim();if(!p)return;
  RH.offres.push({id:uid(),poste:p,statut:'ouverte',date:auj()});
  q('rh-of-poste').value='';rhSave();rhR_recrut();
};
window.rhToggleOffre=function(id){
  var o=RH.offres.find(function(x){return x.id===id;});if(!o)return;
  o.statut=o.statut==='ouverte'?'fermee':'ouverte';rhSave();rhR_recrut();
};
window.rhAjCand=function(){
  var nom=q('rh-rc-nom').value.trim();if(!nom)return alert('Nom du candidat requis.');
  RH.cands.push({id:uid(),nom:nom,poste:q('rh-rc-poste').value.trim(),note:parseFloat(q('rh-rc-note').value)||0,
    statut:q('rh-rc-statut').value,commentaire:q('rh-rc-com').value.trim()});
  ['rh-rc-nom','rh-rc-poste','rh-rc-note','rh-rc-com'].forEach(function(i){if(q(i))q(i).value='';});
  rhSave();rhR_recrut();
};
window.rhEmbaucher=function(id){
  var c=RH.cands.find(function(x){return x.id===id;});if(!c)return;
  c.statut='embauche';
  var e={id:uid(),nom:c.nom,poste:c.poste,service:'Général',sexe:'H',embauche:auj(),salaire:0,
         docs:[],postes:[{date:auj(),poste:c.poste||''}],statut:'actif'};
  RH.emp.push(e);rhSave();rhRenderTout();
  notifRH('info','🎉 Embauche : '+c.nom,(c.poste||'')+' — complétez sa fiche employé et son contrat.');
  window.go('rh-employes',null);
  setTimeout(function(){rhEditerEmp(e.id);},250);
};
window.rhR_recrut=function(){
  var zo=q('rh-rc-offres');
  if(zo){
    zo.innerHTML='<div style="display:flex;gap:6px;margin-bottom:10px"><input type="text" id="rh-of-poste" placeholder="Poste à pourvoir…" style="flex:1"/><button class="btn btn-primary btn-sm" onclick="rhAjOffre()">+ Publier</button></div>'+
    (RH.offres.length?RH.offres.slice().reverse().map(function(o){
      return '<div class="rh-ligne"><span>'+(o.statut==='ouverte'?'🟢':'⚪')+'</span><strong style="flex:1;font-size:12px">'+e22(o.poste)+'</strong><span style="font-size:10.5px;color:var(--text-faint)">'+dFR(o.date)+'</span><button class="btn btn-sm" onclick="rhToggleOffre(\''+o.id+'\')">'+(o.statut==='ouverte'?'Clôturer':'Rouvrir')+'</button></div>';
    }).join(''):'<div class="rh-vide">Aucune offre publiée.</div>');
    var dl=q('rh-offres-dl');if(dl)dl.innerHTML=RH.offres.filter(function(o){return o.statut==='ouverte';}).map(function(o){return '<option value="'+e22(o.poste)+'">';}).join('');
  }
  var z=q('rh-rc-liste');if(!z)return;
  if(!RH.cands.length){z.innerHTML='<div class="rh-vide">Aucune candidature.</div>';return;}
  var ST={recu:'<span class="tagr tagr-neutre">reçue</span>',entretien:'<span class="tagr tagr-info">entretien</span>',embauche:'<span class="tagr tagr-ok">embauché</span>',refuse:'<span class="tagr tagr-bad">refusé</span>'};
  z.innerHTML='<div class="table-wrap"><table style="width:100%;border-collapse:collapse" class="rh-mini-table"><thead><tr><th style="text-align:left">Candidat</th><th style="text-align:left">Poste</th><th>Note</th><th style="text-align:left">Notes recruteur</th><th>Statut</th><th></th></tr></thead><tbody>'+
  RH.cands.slice().reverse().map(function(c){
    return '<tr><td><strong>'+e22(c.nom)+'</strong></td><td>'+e22(c.poste||'—')+'</td><td style="text-align:center">'+(c.note||'—')+'/5</td><td>'+e22(c.commentaire||'—')+'</td><td style="text-align:center">'+ST[c.statut]+'</td>'+
    '<td style="text-align:right">'+(c.statut!=='embauche'&&c.statut!=='refuse'?'<button class="btn btn-sm btn-primary" onclick="rhEmbaucher(\''+c.id+'\')">✅ Embaucher</button>':'')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
};

/* ─────────── SANTÉ & SÉCURITÉ ─────────── */
window.rhAjSante=function(){
  var empId=q('rh-sa-emp').value;if(!empId)return alert('Choisissez un employé.');
  RH.sante.push({id:uid(),empId:empId,type:q('rh-sa-type').value,date:q('rh-sa-date').value||auj(),
    detail:q('rh-sa-det').value.trim(),prochaine:q('rh-sa-next').value||null});
  rhSave();rhR_sante();
  if(q('rh-sa-type').value==='accident')notifRH('alerte','🚑 Accident de travail — '+rhNom(empId),q('rh-sa-det').value||'');
};
var TYPES_SA={visite:['🩺','Visite médicale','tagr-info'],accident:['🚑','Accident','tagr-bad'],incident:['⚠️','Incident','tagr-warn'],epi:['🦺','EPI','tagr-neutre']};
window.rhR_sante=function(){
  var s=q('rh-sa-emp');if(s)s.innerHTML=optsEmp(s.value);
  var z=q('rh-sa-liste');if(!z)return;
  if(!RH.sante.length){z.innerHTML='<div class="rh-vide">Registre vide.</div>';return;}
  z.innerHTML='<div class="table-wrap"><table style="width:100%;border-collapse:collapse" class="rh-mini-table"><thead><tr><th style="text-align:left">Employé</th><th>Type</th><th>Date</th><th style="text-align:left">Détails</th><th>Prochaine visite</th></tr></thead><tbody>'+
  RH.sante.slice().reverse().map(function(x){
    var t=TYPES_SA[x.type],jr=jRestants(x.prochaine);
    var next=x.prochaine?(jr!=null&&jr<=30&&jr>=0?'<span class="tagr tagr-warn">'+dFR(x.prochaine)+'</span>':dFR(x.prochaine)):'—';
    return '<tr><td>'+e22(rhNom(x.empId))+'</td><td style="text-align:center"><span class="tagr '+t[2]+'">'+t[0]+' '+t[1]+'</span></td><td style="text-align:center">'+dFR(x.date)+'</td><td>'+e22(x.detail||'—')+'</td><td style="text-align:center">'+next+'</td></tr>';
  }).join('')+'</tbody></table></div>';
};

/* ─────────── DISCIPLINE ─────────── */
window.rhAjDisc=function(){
  var empId=q('rh-di-emp').value;if(!empId)return alert('Choisissez un employé.');
  var motif=q('rh-di-motif').value.trim();
  RH.disc.push({id:uid(),empId:empId,type:q('rh-di-type').value,date:q('rh-di-date').value||auj(),motif:motif});
  q('rh-di-motif').value='';rhSave();rhR_discipline();
  notifRH('info','⚖️ '+(q('rh-di-type').value==='sanction'?'Sanction':'Avertissement')+' — '+rhNom(empId),motif);
};
window.rhR_discipline=function(){
  var s=q('rh-di-emp');if(s)s.innerHTML=optsEmp(s.value);
  var f=q('rh-di-filtre');
  if(f){var v=f.value;f.innerHTML='<option value="">Tous les employés</option>'+rhActifs().map(function(e){return '<option value="'+e.id+'"'+(v===e.id?' selected':'')+'>'+e22(e.nom)+'</option>';}).join('');}
  var z=q('rh-di-liste');if(!z)return;
  var filt=f&&f.value?RH.disc.filter(function(d){return d.empId===f.value;}):RH.disc;
  if(!filt.length){z.innerHTML='<div class="rh-vide">Aucune mesure disciplinaire.</div>';return;}
  z.innerHTML=filt.slice().reverse().map(function(d){
    return '<div class="rh-ligne"><span>'+(d.type==='sanction'?'🔴':'🟠')+'</span><strong style="font-size:12px">'+e22(rhNom(d.empId))+'</strong><span class="tagr '+(d.type==='sanction'?'tagr-bad':'tagr-warn')+'">'+d.type+'</span><span style="font-size:11.5px;color:var(--text-muted);flex:1">'+e22(d.motif||'—')+'</span><span style="font-size:10.5px;color:var(--text-faint)">'+dFR(d.date)+'</span></div>';
  }).join('');
};

/* ─────────── DOCUMENTS RH + SIGNATURE ─────────── */
function rhInitSignature(){
  var c=q('rh-signpad');if(!c)return;
  var ctx=c.getContext('2d');ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='#1a1a1a';
  var actif=false;
  function pos(ev){var r=c.getBoundingClientRect();return{x:(ev.clientX-r.left)*(c.width/r.width),y:(ev.clientY-r.top)*(c.height/r.height)};}
  c.addEventListener('pointerdown',function(ev){actif=true;var p=pos(ev);ctx.beginPath();ctx.moveTo(p.x,p.y);ev.preventDefault();});
  c.addEventListener('pointermove',function(ev){if(!actif)return;var p=pos(ev);ctx.lineTo(p.x,p.y);ctx.stroke();ev.preventDefault();});
  ['pointerup','pointerleave'].forEach(function(t){c.addEventListener(t,function(){actif=false;});});
  if(RH.sign){var img=new Image();img.onload=function(){ctx.drawImage(img,0,0);};img.src=RH.sign;}
  rhSignEtat();
}
function rhSignEtat(){var s=q('rh-sign-etat');if(s)s.textContent=RH.sign?'✓ Signature enregistrée':'Dessinez la signature ci-dessus (souris ou doigt).';}
window.rhSignEffacer=function(){var c=q('rh-signpad');if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);RH.sign=null;rhSave();rhSignEtat();};
window.rhSignSauver=function(){var c=q('rh-signpad');if(!c)return;RH.sign=c.toDataURL('image/png');rhSave();rhSignEtat();};
function nomSociete(){
  var s=document.querySelector('.logo-sub');
  return (s&&s.textContent.trim())||'Mon Entreprise';
}
window.rhGenererDoc=function(){
  var empId=q('rh-do-emp').value;if(!empId)return alert('Choisissez un employé.');
  var e=rhE(empId),type=q('rh-do-type').value;
  var ct=dernierContrat(empId);
  var societe=nomSociete(),date=new Date().toLocaleDateString('fr-FR');
  var titres={attestation:'ATTESTATION DE TRAVAIL',certificat:'CERTIFICAT DE TRAVAIL',conge:'AUTORISATION DE CONGÉ',felicitations:'LETTRE DE FÉLICITATIONS'};
  var corps='';
  var intro='Nous soussignés, <strong>'+e22(societe)+'</strong>, attestons que :';
  var idb='<strong>'+e22(e.nom)+'</strong>'+(e.poste?', occupant le poste de <strong>'+e22(e.poste)+'</strong>':'')+(e.service?' au service '+e22(e.service):'')+(e.embauche?', employé(e) depuis le '+dFR(e.embauche):'')+(ct?' (contrat '+ct.type+')':'');
  if(type==='attestation')corps=intro+'<p style="margin:14px 0">'+idb+', est employé(e) au sein de notre entreprise à ce jour.</p><p>La présente attestation est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit.</p>';
  else if(type==='certificat')corps=intro+'<p style="margin:14px 0">'+idb+', a travaillé au sein de notre entreprise'+(e.embauche?' du '+dFR(e.embauche):'')+' au '+date+'.</p><p>Durant cette période, l\'intéressé(e) a fait preuve de professionnalisme. Le présent certificat est délivré pour servir et valoir ce que de droit.</p>';
  else if(type==='conge'){
    var cg=RH.conges.filter(function(c){return c.empId===empId&&c.statut==='approuve';}).pop();
    corps=intro+'<p style="margin:14px 0">'+idb+', est autorisé(e) à s\'absenter'+(cg?' du <strong>'+dFR(cg.du)+'</strong> au <strong>'+dFR(cg.au)+'</strong> ('+TYPES_CG[cg.type]+')':' pour la période convenue')+'.</p>';
  }
  else corps='<p>'+intro+'</p><p style="margin:14px 0">La direction adresse ses sincères félicitations à '+idb+' pour la qualité de son travail et son engagement au service de l\'entreprise.</p>';
  var sig=RH.sign?'<img src="'+RH.sign+'" style="height:60px"/>':'<div style="height:60px"></div>';
  var html='<!DOCTYPE html><html><head><meta charset="utf-8"/><title>'+titres[type]+'</title>'+
  '<style>body{font-family:Georgia,serif;color:#1a1a1a;max-width:640px;margin:40px auto;padding:0 24px;line-height:1.8;font-size:14px}h1{font-size:17px;text-align:center;letter-spacing:2px;text-decoration:underline;margin:34px 0}header{display:flex;justify-content:space-between;font-size:12px;border-bottom:2px solid #1a1a1a;padding-bottom:10px}footer{margin-top:60px;text-align:right}@media print{body{margin:10mm auto}}</style></head><body>'+
  '<header><div><strong>'+e22(societe)+'</strong><br/>Lomé — Togo</div><div>Réf. RH-'+Date.now().toString(36).toUpperCase()+'</div></header>'+
  '<h1>'+titres[type]+'</h1>'+corps+
  '<footer><div>Fait à ____________, le '+date+'</div><div style="margin-top:14px">La Direction</div>'+sig+'</footer>'+
  '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},350);};</scr'+'ipt></body></html>';
  var w=window.open('','_blank');
  if(!w)return alert('Autorisez les fenêtres pop-up pour imprimer le document.');
  w.document.write(html);w.document.close();
  RH.docsGen.push({id:uid(),empId:empId,type:titres[type],date:auj()});
  rhSave();rhR_docs();
};
window.rhR_docs=function(){
  var s=q('rh-do-emp');if(s)s.innerHTML=optsEmp(s.value);
  var z=q('rh-do-liste');if(!z)return;
  if(!RH.docsGen.length){z.innerHTML='<div class="rh-vide">Aucun document généré.</div>';return;}
  z.innerHTML=RH.docsGen.slice().reverse().map(function(d){
    return '<div class="rh-ligne"><span>📄</span><strong style="font-size:12px">'+e22(d.type)+'</strong><span style="font-size:11.5px;color:var(--text-muted);flex:1">'+e22(rhNom(d.empId))+'</span><span style="font-size:10.5px;color:var(--text-faint)">'+dFR(d.date)+'</span></div>';
  }).join('');
};

/* ─────────── TABLEAU DE BORD RH ─────────── */
window.rhR_dash=function(){
  var zk=q('rh-kpis');if(!zk)return;
  var actifs=rhActifs();
  var masse=actifs.reduce(function(s,e){return s+(e.salaire||0);},0);
  var il30=new Date();il30.setDate(il30.getDate()-30);
  var pt30=RH.pt.filter(function(p){return new Date(p.date)>=il30;});
  var absPct=pt30.length?Math.round(pt30.filter(function(p){return p.etat==='absent';}).length/pt30.length*100):0;
  var enConge=RH.conges.filter(function(c){return c.statut==='approuve'&&c.du<=auj()&&c.au>=auj();}).length;
  zk.innerHTML=[
    ['Effectif actif',actifs.length,'employés','var(--accent,var(--green))'],
    ['Masse salariale',fN(masse),'FCFA / mois','var(--blue)'],
    ['Absentéisme (30 j)',absPct+'%','sur pointages','var(--amber)'],
    ['En congé aujourd\'hui',enConge,'employé(s)','var(--teal)']
  ].map(function(k){
    return '<div class="kpi" style="border-top:3px solid '+k[3]+'"><div class="kpi-label">'+k[0]+'</div><div class="kpi-value">'+k[1]+'</div><div class="kpi-sub">'+k[2]+'</div></div>';
  }).join('');
  /* répartitions */
  var zr=q('rh-repart');
  if(zr){
    var h2=actifs.filter(function(e){return e.sexe==='H';}).length,f2=actifs.length-h2;
    var services={};actifs.forEach(function(e){var s=e.service||'Général';services[s]=(services[s]||0)+1;});
    var coutMoy=actifs.length?Math.round(masse/actifs.length):0;
    zr.innerHTML='<div class="rh-ligne"><span class="rh-lbl">Hommes / Femmes</span><div class="rh-bar"><div style="width:'+(actifs.length?h2/actifs.length*100:0)+'%"></div></div><strong style="font-size:11.5px;white-space:nowrap">'+h2+' H · '+f2+' F</strong></div>'+
    '<div class="rh-ligne"><span class="rh-lbl">Coût moyen / employé</span><strong style="font-size:12px">'+fN(coutMoy)+' FCFA</strong></div>'+
    '<div class="section-label" style="margin-top:10px">Par service</div>'+
    Object.keys(services).map(function(s){
      return '<div class="rh-ligne"><span class="rh-lbl">'+e22(s)+'</span><div class="rh-bar"><div style="width:'+(services[s]/actifs.length*100)+'%"></div></div><strong style="font-size:11.5px">'+services[s]+'</strong></div>';
    }).join('');
  }
  /* échéances */
  var ze=q('rh-echeances');
  if(ze){
    var exp=RH.contrats.filter(function(c){var j=jRestants(c.fin);return c.fin&&j!=null&&j>=0&&j<=60;})
      .map(function(c){return '<div class="rh-ligne"><span>⏰</span><strong style="font-size:12px">'+e22(rhNom(c.empId))+'</strong><span style="font-size:11.5px;color:var(--text-muted);flex:1">'+c.type+' — fin '+dFR(c.fin)+'</span><span class="tagr tagr-warn">'+jRestants(c.fin)+' j</span></div>';});
    var mois=new Date().getMonth()+1;
    var anniv=actifs.filter(function(e){return e.naissance&&parseInt(e.naissance.split('-')[1])===mois;})
      .map(function(e){return '<div class="rh-ligne"><span>🎂</span><strong style="font-size:12px">'+e22(e.nom)+'</strong><span style="font-size:11.5px;color:var(--text-muted)">le '+dFR(e.naissance).slice(0,5)+'</span></div>';});
    ze.innerHTML=(exp.length?'<div class="section-label">Contrats ≤ 60 jours</div>'+exp.join(''):'')+
                 (anniv.length?'<div class="section-label" style="margin-top:8px">🎂 Anniversaires du mois</div>'+anniv.join(''):'')||'<div class="rh-vide">Rien à signaler.</div>';
  }
  /* organigramme */
  var zo=q('rh-orga');
  if(zo){
    var sv={};actifs.forEach(function(e){var s=e.service||'Général';(sv[s]=sv[s]||[]).push(e);});
    zo.innerHTML=Object.keys(sv).length?'<div style="display:flex;gap:12px;flex-wrap:wrap">'+Object.keys(sv).map(function(s){
      return '<div style="flex:1;min-width:170px;border:2px solid var(--border);border-radius:var(--radius-lg);overflow:hidden"><div style="background:var(--bg);padding:7px 10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid var(--border)">'+e22(s)+' ('+sv[s].length+')</div><div style="padding:8px 10px">'+
      sv[s].map(function(e){return '<div style="font-size:11.5px;padding:2px 0">'+photoHTML(e)+' '+e22(e.nom)+' <span style="color:var(--text-faint)">· '+e22(e.poste||'')+'</span></div>';}).join('')+'</div></div>';
    }).join('')+'</div>':'<div class="rh-vide">Ajoutez des employés pour construire l\'organigramme.</div>';
  }
};

/* ─────────── EXPORT / IMPORT ─────────── */
window.rhExporter=function(){
  var a=document.createElement('a');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(RH,null,1));
  a.download='comptaia_rh_'+auj()+'.json';a.click();
};
window.rhImporter=function(ev){
  var f=ev.target.files&&ev.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(e){
    try{var o=JSON.parse(e.target.result);Object.keys(RH).forEach(function(k){if(o[k]!=null)RH[k]=o[k];});rhSave();rhRenderTout();alert('✓ Données RH importées.');}
    catch(err){alert('Fichier invalide.');}
  };
  r.readAsText(f);
};

/* ─────────── ORCHESTRATION ─────────── */
window.rhRenderTout=function(){
  ['rhR_dash','rhR_employes','rhR_contrats','rhR_presence','rhR_conges','rhR_perf','rhR_formation','rhR_recrut','rhR_sante','rhR_discipline','rhR_docs'].forEach(function(f){
    try{window[f]();}catch(e){}
  });
};
function marqueV22(){
  try{
    document.title=document.title.replace(/GEST Africa( Pro)? v[12][0-9]/,'GEST Africa v22');
    if(document.title.indexOf('v22')===-1)document.title='GEST Africa v22 — OHADA Togo';
    var f=q('sidebar-footer');
    if(f)f.textContent=f.textContent.replace(/GEST Africa( Pro)? v[12][0-9]/,'GEST Africa v22');
  }catch(e){}
}
/* Init */
rhCharger();
try{creerPanes();}catch(e){}
try{rhRenderTout();}catch(e){}
try{rhVerifierContrats();}catch(e){}
marqueV22();
try{
  var _go22=window.go;
  window.go=function(id,el){
    if(typeof _go22==='function')_go22(id,el);
    if(id&&String(id).indexOf('rh-')===0){try{rhRenderTout();}catch(e){}}
  };
}catch(e){}
var _oas22=window.onAuthSuccess;
window.onAuthSuccess=function(){
  if(typeof _oas22==='function')_oas22();
  try{rhRenderTout();rhVerifierContrats();}catch(e){}
  marqueV22();
};
window.__v22={soldeConges:soldeConges,jRestants:jRestants,jEntre:jEntre,RH:RH};
})();
