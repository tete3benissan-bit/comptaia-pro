// v13: profil entreprise, devis, bons de commande/livraison, recurrentes, inventaire, provisions, multi-devises, TFT, calendrier fiscal - extracted from ComptaIA_Pro_original.html lines 5333-6136
// ════════════════════════════════════════════════════════
// GEST Africa v13 — JAVASCRIPT COMPLET
// ════════════════════════════════════════════════════════

// ─── DATA STORES ───────────────────────────────────────
var DEVIS_LIST = JSON.parse(localStorage.getItem('v13_devis')||'[]');
var BC_LIST    = JSON.parse(localStorage.getItem('v13_bc')||'[]');
var BL_LIST    = JSON.parse(localStorage.getItem('v13_bl')||'[]');
var RECURRENTES= JSON.parse(localStorage.getItem('v13_rec')||'[]');
var PROVISIONS_LIST = JSON.parse(localStorage.getItem('v13_prov')||'[]');
var FX_LIST    = JSON.parse(localStorage.getItem('v13_fx')||'[]');
var PROFIL_DATA= JSON.parse(localStorage.getItem('v13_profil')||'{}');

function saveV13(){
  try{
    localStorage.setItem('v13_devis',JSON.stringify(DEVIS_LIST));
    localStorage.setItem('v13_bc',JSON.stringify(BC_LIST));
    localStorage.setItem('v13_bl',JSON.stringify(BL_LIST));
    localStorage.setItem('v13_rec',JSON.stringify(RECURRENTES));
    localStorage.setItem('v13_prov',JSON.stringify(PROVISIONS_LIST));
    localStorage.setItem('v13_fx',JSON.stringify(FX_LIST));
    localStorage.setItem('v13_profil',JSON.stringify(PROFIL_DATA));
  }catch(e){}
}

// ─── HELPERS ───────────────────────────────────────────
function fmtD(d){if(!d)return'—';var p=d.split('-');return p[2]+'/'+p[1]+'/'+p[0];}
function nextNum(prefix,list,key){
  var max=0;list.forEach(function(x){var n=parseInt((x[key||'num']||'').replace(/\D/g,''))||0;if(n>max)max=n;});
  return prefix+(new Date().getFullYear())+'-'+String(max+1).padStart(3,'0');
}
function badge(txt,cls){return '<span class="badge '+cls+'" style="font-size:9px">'+txt+'</span>';}

// ─── GO() PATCH v13 ────────────────────────────────────
(function(){
  var _oldGo = window.go;
  window.go = function(id, el){
    var v13panes=['devis','bc','bl','recurrentes','inventaire','provisions','multidevises','tft','calendrier','profil'];
    if(v13panes.indexOf(id)>-1){
      document.querySelectorAll('.pane').forEach(function(p){p.classList.remove('active');});
      document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
      var pane=document.getElementById('pane-'+id);
      if(pane)pane.classList.add('active');
      if(el)el.classList.add('active');
      var titles={devis:'📋 Devis',bc:'🛒 Bons de commande',bl:'🚚 Bons de livraison',recurrentes:'🔄 Factures récurrentes',inventaire:'🔢 Inventaire physique',provisions:'⚠️ Provisions & Dépréciations',multidevises:'💱 Multi-devises',tft:'💧 Tableau des Flux de Trésorerie',calendrier:'📅 Calendrier fiscal',profil:'🏢 Profil entreprise'};
      var pt=document.getElementById('page-title');if(pt)pt.textContent=titles[id]||id;
      // Render on open
      if(id==='devis')renderDevis();
      if(id==='bc')renderBC();
      if(id==='bl')renderBL();
      if(id==='recurrentes')renderRec();
      if(id==='inventaire')renderInventaire();
      if(id==='provisions')renderProvisions();
      if(id==='multidevises'){renderFX();populateFXTiers();}
      if(id==='tft'){}
      if(id==='calendrier')renderCalendrier();
      if(id==='profil')chargerProfil();
      return;
    }
    _oldGo(id,el);
  };
})();

// ─── PROFIL ENTREPRISE ─────────────────────────────────
function chargerProfil(){
  var p=PROFIL_DATA;
  ['nom','ifu','rccm','tva-num','capital','adresse','tel','email','web','banque','iban','swift','mobi','mentions','couleur','logo-url'].forEach(function(k){
    var el=document.getElementById('p-'+k);
    if(el&&p[k]!==undefined)el.value=p[k];
  });
  if(p.logo){
    document.getElementById('p-logo-img').src=p.logo;
    document.getElementById('p-logo-preview').style.display='block';
    if(document.getElementById('p-logo-url'))document.getElementById('p-logo-url').value=p['logo-url']||'';
  }
}
function sauverProfil(){
  var p={};
  ['nom','ifu','rccm','tva-num','capital','adresse','tel','email','web','banque','iban','swift','mobi','mentions','couleur','logo-url'].forEach(function(k){
    var el=document.getElementById('p-'+k);if(el)p[k]=el.value;
  });
  if(PROFIL_DATA.logo)p.logo=PROFIL_DATA.logo;
  PROFIL_DATA=p;
  // Update sidebar
  var sub=document.querySelector('.logo-sub');
  if(sub&&p.nom)sub.textContent=p.nom;
  saveV13();
  var notif=document.getElementById('profil-notif');
  if(notif){notif.style.display='block';setTimeout(function(){notif.style.display='none';},3500);}
}
function resetProfil(){
  if(confirm('Effacer le profil ?')){PROFIL_DATA={};saveV13();chargerProfil();}
}
function chargerLogo(input){
  if(!input.files||!input.files[0])return;
  var r=new FileReader();
  r.onload=function(e){
    var data=e.target.result;
    PROFIL_DATA.logo=data;
    document.getElementById('p-logo-img').src=data;
    document.getElementById('p-logo-preview').style.display='block';
    saveV13();
  };
  r.readAsDataURL(input.files[0]);
}

// ─── DEVIS ─────────────────────────────────────────────
function ouvrirFormulaireDevis(data){
  var f=document.getElementById('devis-form');
  f.style.display='block';
  document.getElementById('dv-date').value=new Date().toISOString().split('T')[0];
  var v=new Date(); v.setDate(v.getDate()+30);
  document.getElementById('dv-validite').value=v.toISOString().split('T')[0];
  // Populate client list
  var dl=document.getElementById('dv-clients-list');
  if(dl&&typeof TIERS!=='undefined'){dl.innerHTML='';TIERS.forEach(function(t){if(t.type==='client'){var o=document.createElement('option');o.value=t.nom;dl.appendChild(o);}});}
  if(data){document.getElementById('dv-client').value=data.client||'';document.getElementById('dv-objet').value=data.objet||'';document.getElementById('dv-ht').value=data.ht||0;calcDevisTTC();}
}
function fermerFormulaireDevis(){document.getElementById('devis-form').style.display='none';}
function calcDevisTTC(){
  var ht=parseFloat(document.getElementById('dv-ht').value)||0;
  var tva=parseFloat(document.getElementById('dv-tva').value)||0;
  document.getElementById('dv-ttc').value=Math.round(ht*(1+tva/100)).toLocaleString('fr-FR')+' FCFA';
}
function sauverDevis(){
  var client=document.getElementById('dv-client').value.trim();
  var objet=document.getElementById('dv-objet').value.trim();
  var ht=parseFloat(document.getElementById('dv-ht').value)||0;
  if(!client||!objet||!ht){alert('Client, objet et montant HT sont obligatoires.');return;}
  var tva=parseFloat(document.getElementById('dv-tva').value)||0;
  var dv={id:Date.now(),num:nextNum('DV',DEVIS_LIST,'num'),client:client,date:document.getElementById('dv-date').value,validite:document.getElementById('dv-validite').value,objet:objet,ht:ht,tva:tva,ttc:Math.round(ht*(1+tva/100)),notes:document.getElementById('dv-notes').value,statut:'brouillon'};
  DEVIS_LIST.push(dv);saveV13();fermerFormulaireDevis();renderDevis();
  if(typeof ajouterNotif==='function')ajouterNotif('info','Devis '+dv.num+' créé','Client: '+client+' — '+dv.ttc.toLocaleString('fr-FR')+' FCFA TTC');
}
function renderDevis(){
  var w=document.getElementById('devis-list-wrap');if(!w)return;
  if(!DEVIS_LIST.length){w.innerHTML='<div style="text-align:center;padding:36px;color:var(--text-faint);font-style:italic">Aucun devis. Cliquez sur "+ Nouveau devis" pour commencer.</div>';return;}
  var statusColors={brouillon:'bg-blue',envoye:'bg-amber',accepte:'bg-green',refuse:'bg-red',expire:'bg-teal'};
  var html='<div class="card"><div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--bg)"><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">N° Devis</th><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Client</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Objet</th><th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">TTC</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Validité</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Statut</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Actions</th></tr></thead><tbody>';
  DEVIS_LIST.slice().reverse().forEach(function(dv,i){
    var idx=DEVIS_LIST.length-1-i;
    html+='<tr style="border-bottom:2px solid var(--border)"><td style="padding:8px 10px;font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--green)">'+dv.num+'</td><td style="padding:8px 10px">'+dv.client+'</td><td style="padding:8px 10px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+dv.objet+'">'+dv.objet+'</td><td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:600">'+dv.ttc.toLocaleString('fr-FR')+'</td><td style="padding:8px 10px;font-size:11px;color:var(--text-muted)">'+fmtD(dv.validite)+'</td><td style="padding:8px 10px">'+badge(dv.statut,(statusColors[dv.statut]||'bg-blue'))+'</td><td style="padding:8px 10px"><div style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn btn-sm" style="font-size:9px;padding:2px 6px" onclick="changerStatutDevis('+idx+')" title="Changer statut">✏</button>'+(dv.statut==='accepte'?'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px;background:var(--amber);color:#fff;border-color:var(--amber)" onclick="convertirDevisEnBC('+idx+')">→ BC</button>':'')+'<button class="btn btn-sm" style="font-size:9px;padding:2px 6px;background:var(--blue);color:#fff;border-color:var(--blue)" onclick="imprimerDevis('+idx+')">🖨</button><button class="btn btn-sm" style="font-size:9px;padding:2px 6px;color:var(--red);border-color:var(--red-border)" onclick="supprimerDevis('+idx+')">✕</button></div></td></tr>';
  });
  html+='</tbody></table></div></div>';
  w.innerHTML=html;
}
function changerStatutDevis(i){
  var statuts=['brouillon','envoye','accepte','refuse','expire'];
  var cur=DEVIS_LIST[i].statut;
  var idx=statuts.indexOf(cur);
  DEVIS_LIST[i].statut=statuts[(idx+1)%statuts.length];
  saveV13();renderDevis();
}
function supprimerDevis(i){if(confirm('Supprimer ce devis ?')){DEVIS_LIST.splice(i,1);saveV13();renderDevis();}}
function convertirDevisEnBC(i){
  var dv=DEVIS_LIST[i];
  dv.statut='accepte';
  BC_LIST.push({id:Date.now(),num:nextNum('BC',BC_LIST,'num'),tiers:dv.client,type:'client',date:new Date().toISOString().split('T')[0],livraison:'',devisRef:dv.num,objet:dv.objet,ht:dv.ht,tva:dv.tva,ttc:dv.ttc,conds:dv.notes,statut:'ouvert'});
  saveV13();
  if(typeof ajouterNotif==='function')ajouterNotif('info','BC créé depuis '+dv.num,'Devis converti en bon de commande automatiquement');
  alert('✓ Bon de commande créé depuis le devis '+dv.num+'. Consultez l\'onglet Bons de commande.');
  renderDevis();
}
function imprimerDevis(i){
  var dv=DEVIS_LIST[i];
  var p=PROFIL_DATA;
  var jsPDF_=window.jspdf?window.jspdf.jsPDF:window.jsPDF;
  if(!jsPDF_){alert('Module PDF non disponible.');return;}
  var doc=new jsPDF_({unit:'mm',format:'a4'});
  var couleur=p.couleur||'var(--accent)';
  var W=210,M=14,y=20;
  // En-tête coloré
  var rgb=couleur.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if(rgb)doc.setFillColor(parseInt(rgb[1],16),parseInt(rgb[2],16),parseInt(rgb[3],16));
  else doc.setFillColor(29,158,117);
  doc.rect(0,0,W,30,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');
  doc.text(p.nom||'Mon Entreprise',M,13);
  doc.setFontSize(8.5);doc.setFont('helvetica','normal');
  if(p.ifu)doc.text('IFU: '+p.ifu,M,19);
  if(p.rccm)doc.text('RCCM: '+p.rccm,M,24);
  doc.setFontSize(20);doc.setFont('helvetica','bold');
  doc.text('DEVIS',W-M,18,{align:'right'});
  doc.setFontSize(11);doc.setFont('helvetica','normal');
  doc.text(dv.num,W-M,25,{align:'right'});
  // Corps
  doc.setTextColor(0,0,0);y=40;
  doc.setFontSize(9);
  doc.text('Client : '+dv.client,M,y);doc.text('Date : '+fmtD(dv.date),W-M,y,{align:'right'});y+=5;
  doc.text('Validité : '+fmtD(dv.validite),W-M,y,{align:'right'});y+=10;
  doc.setFont('helvetica','bold');doc.text('Objet :',M,y);doc.setFont('helvetica','normal');doc.text(dv.objet,M+18,y);y+=10;
  // Tableau montants
  if(rgb)doc.setFillColor(parseInt(rgb[1],16),parseInt(rgb[2],16),parseInt(rgb[3],16));
  doc.rect(M,y,W-2*M,7,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');
  doc.text('Désignation',M+3,y+5);doc.text('HT',W-50,y+5,{align:'right'});doc.text('TVA',W-30,y+5,{align:'right'});doc.text('TTC',W-M,y+5,{align:'right'});y+=7;
  doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');
  doc.setDrawColor(220,220,220);doc.rect(M,y,W-2*M,8);
  doc.text(dv.objet,M+3,y+5);
  doc.text(dv.ht.toLocaleString('fr-FR'),W-50,y+5,{align:'right'});
  doc.text(dv.tva+'%',W-30,y+5,{align:'right'});
  doc.text(dv.ttc.toLocaleString('fr-FR')+' FCFA',W-M-3,y+5,{align:'right'});y+=16;
  doc.setFontSize(11);doc.setFont('helvetica','bold');
  doc.text('TOTAL TTC : '+dv.ttc.toLocaleString('fr-FR')+' FCFA',W-M,y,{align:'right'});y+=10;
  if(dv.notes){doc.setFontSize(8.5);doc.setFont('helvetica','italic');doc.text('Notes : '+dv.notes,M,y);}
  // Pied
  var py=275;
  if(p.banque)doc.text('Banque : '+p.banque+(p.iban?' — '+p.iban:''),M,py);
  if(p.mobi)doc.text('Mobile Money : '+p.mobi,M,py+4.5);
  if(p.mentions){doc.setFontSize(7.5);var lines=doc.splitTextToSize(p.mentions,W-2*M);doc.text(lines,M,py+9);}
  doc.save('Devis_'+dv.num+'.pdf');
}

// ─── BON DE COMMANDE ───────────────────────────────────
function ouvrirFormulaireBC(){
  document.getElementById('bc-form').style.display='block';
  document.getElementById('bc-date').value=new Date().toISOString().split('T')[0];
  var dl=document.getElementById('bc-tiers-list');
  if(dl&&typeof TIERS!=='undefined'){dl.innerHTML='';TIERS.forEach(function(t){var o=document.createElement('option');o.value=t.nom;dl.appendChild(o);});}
  var dvSel=document.getElementById('bc-devis-ref');
  dvSel.innerHTML='<option value="">— Sans devis lié —</option>';
  DEVIS_LIST.filter(function(d){return d.statut==='accepte';}).forEach(function(d){var o=document.createElement('option');o.value=d.num;o.textContent=d.num+' — '+d.client+' ('+d.ttc.toLocaleString('fr-FR')+' FCFA)';dvSel.appendChild(o);});
}
function calcBCTTC(){
  var ht=parseFloat(document.getElementById('bc-ht').value)||0;
  var tva=parseFloat(document.getElementById('bc-tva').value)||0;
  document.getElementById('bc-ttc').value=Math.round(ht*(1+tva/100)).toLocaleString('fr-FR')+' FCFA';
}
function sauverBC(){
  var tiers=document.getElementById('bc-tiers').value.trim();
  var objet=document.getElementById('bc-objet').value.trim();
  var ht=parseFloat(document.getElementById('bc-ht').value)||0;
  if(!tiers||!objet){alert('Tiers et objet obligatoires.');return;}
  var tva=parseFloat(document.getElementById('bc-tva').value)||0;
  var bc={id:Date.now(),num:nextNum('BC',BC_LIST,'num'),tiers:tiers,type:document.getElementById('bc-type').value,date:document.getElementById('bc-date').value,livraison:document.getElementById('bc-livraison').value,devisRef:document.getElementById('bc-devis-ref').value,objet:objet,ht:ht,tva:tva,ttc:Math.round(ht*(1+tva/100)),conds:document.getElementById('bc-conds').value,statut:'ouvert'};
  BC_LIST.push(bc);saveV13();document.getElementById('bc-form').style.display='none';renderBC();
}
function renderBC(){
  var w=document.getElementById('bc-list-wrap');if(!w)return;
  if(!BC_LIST.length){w.innerHTML='<div style="text-align:center;padding:36px;color:var(--text-faint);font-style:italic">Aucun bon de commande.</div>';return;}
  var sc={ouvert:'bg-blue',livre:'bg-green',annule:'bg-red'};
  var html='<div class="card"><div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--bg)"><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">N°</th><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Tiers</th><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Objet</th><th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">TTC</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Livraison</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Statut</th><th style="padding:8px 10px;border-bottom:2px solid var(--border)">Actions</th></tr></thead><tbody>';
  BC_LIST.slice().reverse().forEach(function(bc,i){
    var idx=BC_LIST.length-1-i;
    html+='<tr style="border-bottom:2px solid var(--border)"><td style="padding:8px 10px;font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--amber)">'+bc.num+'</td><td style="padding:8px 10px">'+bc.tiers+'</td><td style="padding:8px 10px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+bc.objet+'</td><td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+bc.ttc.toLocaleString('fr-FR')+'</td><td style="padding:8px 10px;font-size:11px;color:var(--text-muted)">'+fmtD(bc.livraison)+'</td><td style="padding:8px 10px">'+badge(bc.statut,(sc[bc.statut]||'bg-blue'))+'</td><td style="padding:8px 10px"><div style="display:flex;gap:4px"><button class="btn btn-sm" style="font-size:9px;padding:2px 6px;background:var(--green);color:#fff;border-color:var(--green)" onclick="convertirBCenBL('+idx+')">→ BL</button><button class="btn btn-sm" style="font-size:9px;padding:2px 6px;color:var(--red);border-color:var(--red-border)" onclick="supprimerBC('+idx+')">✕</button></div></td></tr>';
  });
  html+='</tbody></table></div></div>';
  w.innerHTML=html;
}
function supprimerBC(i){if(confirm('Supprimer ce bon de commande ?')){BC_LIST.splice(i,1);saveV13();renderBC();}}
function convertirBCenBL(i){
  var bc=BC_LIST[i];
  bc.statut='livre';
  var bl={id:Date.now(),num:nextNum('BL',BL_LIST,'num'),client:bc.tiers,date:new Date().toISOString().split('T')[0],bcRef:bc.num,factRef:'',transport:'',livreur:'',desc:bc.objet,adresse:'',statut:'livre'};
  BL_LIST.push(bl);saveV13();
  alert('✓ Bon de livraison BL créé depuis BC '+bc.num+'. Consultez l\'onglet Bons de livraison.');
  renderBC();
}

// ─── BON DE LIVRAISON ──────────────────────────────────
function ouvrirFormulaireBL(){
  document.getElementById('bl-form').style.display='block';
  document.getElementById('bl-date').value=new Date().toISOString().split('T')[0];
  var dl=document.getElementById('bl-clients-list');
  if(dl&&typeof TIERS!=='undefined'){dl.innerHTML='';TIERS.forEach(function(t){var o=document.createElement('option');o.value=t.nom;dl.appendChild(o);});}
  var bcSel=document.getElementById('bl-bc-ref');
  bcSel.innerHTML='<option value="">— Sans BC lié —</option>';
  BC_LIST.forEach(function(bc){var o=document.createElement('option');o.value=bc.num;o.textContent=bc.num+' — '+bc.tiers;bcSel.appendChild(o);});
}
function sauverBL(){
  var client=document.getElementById('bl-client').value.trim();
  var desc=document.getElementById('bl-desc').value.trim();
  if(!client||!desc){alert('Client et désignation obligatoires.');return;}
  var bl={id:Date.now(),num:nextNum('BL',BL_LIST,'num'),client:client,date:document.getElementById('bl-date').value,bcRef:document.getElementById('bl-bc-ref').value,factRef:document.getElementById('bl-fact-ref').value,transport:document.getElementById('bl-transport').value,livreur:document.getElementById('bl-livreur').value,desc:desc,adresse:document.getElementById('bl-adresse').value,statut:'livre'};
  BL_LIST.push(bl);saveV13();document.getElementById('bl-form').style.display='none';renderBL();
}
function renderBL(){
  var w=document.getElementById('bl-list-wrap');if(!w)return;
  if(!BL_LIST.length){w.innerHTML='<div style="text-align:center;padding:36px;color:var(--text-faint);font-style:italic">Aucun bon de livraison.</div>';return;}
  var html='<div class="card"><div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--bg)"><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">N°</th><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Client</th><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Marchandises</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Date</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Réf BC</th><th style="padding:8px 10px;border-bottom:2px solid var(--border)">Actions</th></tr></thead><tbody>';
  BL_LIST.slice().reverse().forEach(function(bl,i){
    var idx=BL_LIST.length-1-i;
    html+='<tr style="border-bottom:2px solid var(--border)"><td style="padding:8px 10px;font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--blue)">'+bl.num+'</td><td style="padding:8px 10px">'+bl.client+'</td><td style="padding:8px 10px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+bl.desc+'</td><td style="padding:8px 10px;font-size:11px;color:var(--text-muted)">'+fmtD(bl.date)+'</td><td style="padding:8px 10px;font-family:\'Archivo\',sans-serif;font-size:11px">'+( bl.bcRef||'—')+'</td><td style="padding:8px 10px"><div style="display:flex;gap:4px"><button class="btn btn-sm" style="font-size:9px;padding:2px 6px;background:var(--blue);color:#fff;border-color:var(--blue)" onclick="imprimerBL('+idx+')">🖨 PDF</button><button class="btn btn-sm" style="font-size:9px;padding:2px 6px;color:var(--red);border-color:var(--red-border)" onclick="supprimerBL('+idx+')">✕</button></div></td></tr>';
  });
  html+='</tbody></table></div></div>';
  w.innerHTML=html;
}
function supprimerBL(i){if(confirm('Supprimer ce bon de livraison ?')){BL_LIST.splice(i,1);saveV13();renderBL();}}
function imprimerBL(i){
  var bl=BL_LIST[i];var p=PROFIL_DATA;
  var jsPDF_=window.jspdf?window.jspdf.jsPDF:window.jsPDF;
  if(!jsPDF_){alert('PDF non disponible.');return;}
  var doc=new jsPDF_({unit:'mm',format:'a4'});
  var W=210,M=14,y=20;
  var rgb=(p.couleur||'var(--accent)').match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if(rgb)doc.setFillColor(parseInt(rgb[1],16),parseInt(rgb[2],16),parseInt(rgb[3],16));else doc.setFillColor(29,158,117);
  doc.rect(0,0,W,30,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont('helvetica','bold');
  doc.text(p.nom||'Mon Entreprise',M,12);
  doc.setFontSize(8);doc.setFont('helvetica','normal');
  if(p.ifu)doc.text('IFU: '+p.ifu,M,18);
  if(p.rccm)doc.text('RCCM: '+p.rccm,M,23);
  if(p.adresse)doc.text(p.adresse,M,28);
  doc.setFontSize(20);doc.setFont('helvetica','bold');doc.text('BON DE LIVRAISON',W-M,18,{align:'right'});
  doc.setFontSize(11);doc.setFont('helvetica','normal');doc.text(bl.num,W-M,25,{align:'right'});
  doc.setTextColor(0,0,0);y=40;
  doc.setFontSize(9);
  doc.setDrawColor(220,220,220);doc.rect(M,y,80,25);doc.rect(W-M-80,y,80,25);
  doc.setFont('helvetica','bold');doc.text('LIVRÉ À :',M+3,y+5);doc.setFont('helvetica','normal');
  doc.text(bl.client,M+3,y+11);
  if(bl.adresse){var al=doc.splitTextToSize(bl.adresse,72);doc.text(al,M+3,y+17);}
  doc.setFont('helvetica','bold');doc.text('DATE LIVRAISON :',W-M-77,y+5);doc.setFont('helvetica','normal');
  doc.text(fmtD(bl.date),W-M-77,y+11);
  if(bl.bcRef)doc.text('Réf. BC : '+bl.bcRef,W-M-77,y+17);
  if(bl.factRef)doc.text('Réf. Facture : '+bl.factRef,W-M-77,y+22);
  y+=34;
  if(rgb)doc.setFillColor(parseInt(rgb[1],16),parseInt(rgb[2],16),parseInt(rgb[3],16));
  doc.rect(M,y,W-2*M,7,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(9);
  doc.text('DÉSIGNATION DES MARCHANDISES LIVRÉES',M+3,y+5);doc.text('QUANTITÉ / DÉTAIL',W-M-3,y+5,{align:'right'});y+=7;
  doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');doc.setDrawColor(220,220,220);doc.rect(M,y,W-2*M,30);
  var descLines=doc.splitTextToSize(bl.desc,W-2*M-6);doc.text(descLines,M+3,y+6);y+=38;
  if(bl.transport){doc.text('Transporteur : '+bl.transport,M,y);y+=5;}
  if(bl.livreur){doc.text('Livreur : '+bl.livreur,M,y);y+=5;}
  y+=10;
  // Signatures
  doc.rect(M,y,80,25);doc.rect(W-M-80,y,80,25);
  doc.setFont('helvetica','bold');doc.setFontSize(8.5);
  doc.text('Signature du livreur',M+25,y+5);doc.text('Signature du destinataire',W-M-55,y+5);
  doc.setFont('helvetica','normal');doc.text('(Nom & cachet)',M+27,y+22);doc.text('(Nom & cachet)',W-M-53,y+22);
  if(p.mentions){y+=35;doc.setFontSize(7.5);var ml=doc.splitTextToSize(p.mentions,W-2*M);doc.text(ml,M,y);}
  doc.save('BL_'+bl.num+'.pdf');
}

// ─── FACTURES RÉCURRENTES ──────────────────────────────
function ouvrirFormulaireRec(){
  document.getElementById('rec-form').style.display='block';
  document.getElementById('rec-debut').value=new Date().toISOString().split('T')[0];
  var dl=document.getElementById('rec-tiers-list');
  if(dl&&typeof TIERS!=='undefined'){dl.innerHTML='';TIERS.forEach(function(t){var o=document.createElement('option');o.value=t.nom;dl.appendChild(o);});}
}
function sauverRec(){
  var lib=document.getElementById('rec-lib').value.trim();
  var ht=parseFloat(document.getElementById('rec-ht').value)||0;
  if(!lib||!ht){alert('Libellé et montant HT obligatoires.');return;}
  var rec={id:Date.now(),lib:lib,tiers:document.getElementById('rec-tiers').value,type:document.getElementById('rec-type').value,ht:ht,tva:parseFloat(document.getElementById('rec-tva').value)||0,freq:document.getElementById('rec-freq').value,debut:document.getElementById('rec-debut').value,fin:document.getElementById('rec-fin').value,cpt:document.getElementById('rec-cpt').value||'6000',actif:true,derniere:null};
  RECURRENTES.push(rec);saveV13();document.getElementById('rec-form').style.display='none';renderRec();
}
function renderRec(){
  var w=document.getElementById('rec-list-wrap');if(!w)return;
  if(!RECURRENTES.length){w.innerHTML='<div style="text-align:center;padding:36px;color:var(--text-faint);font-style:italic">Aucune facture récurrente configurée.</div>';return;}
  var freqLabel={mensuel:'Mensuelle',trimestriel:'Trimestrielle',semestriel:'Semestrielle',annuel:'Annuelle'};
  var html='<div class="card"><div class="card-header"><span class="card-title">Règles de facturation automatique</span></div><div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--bg)"><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Libellé</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Tiers</th><th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Montant HT</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Fréquence</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Début</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Statut</th><th style="padding:8px 10px;border-bottom:2px solid var(--border)">Actions</th></tr></thead><tbody>';
  RECURRENTES.forEach(function(r,i){
    html+='<tr style="border-bottom:2px solid var(--border)"><td style="padding:8px 10px;font-weight:600">'+r.lib+'</td><td style="padding:8px 10px;font-size:11px">'+( r.tiers||'—')+'</td><td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+r.ht.toLocaleString('fr-FR')+' FCFA</td><td style="padding:8px 10px">'+badge(freqLabel[r.freq]||r.freq,'bg-blue')+'</td><td style="padding:8px 10px;font-size:11px;color:var(--text-muted)">'+fmtD(r.debut)+'</td><td style="padding:8px 10px">'+badge(r.actif?'Actif':'Pausé',r.actif?'bg-green':'bg-teal')+'</td><td style="padding:8px 10px"><div style="display:flex;gap:4px"><button class="btn btn-sm" style="font-size:9px;padding:2px 6px" onclick="toggleRec('+i+')">'+( r.actif?'⏸ Pauser':'▶ Activer')+'</button><button class="btn btn-sm" style="font-size:9px;padding:2px 6px;color:var(--red);border-color:var(--red-border)" onclick="supprimerRec('+i+')">✕</button></div></td></tr>';
  });
  html+='</tbody></table></div></div>';
  w.innerHTML=html;
}
function toggleRec(i){RECURRENTES[i].actif=!RECURRENTES[i].actif;saveV13();renderRec();}
function supprimerRec(i){if(confirm('Supprimer cette règle récurrente ?')){RECURRENTES.splice(i,1);saveV13();renderRec();}}
function genererEcheancesRecurrentes(){
  if(!RECURRENTES.length){alert('Aucune règle récurrente configurée.');return;}
  var today=new Date();today.setHours(0,0,0,0);
  var generated=0;
  RECURRENTES.filter(function(r){return r.actif;}).forEach(function(r){
    var nextDate=new Date(r.derniere||r.debut);
    if(!r.derniere)nextDate=new Date(r.debut);
    else{
      nextDate=new Date(r.derniere);
      if(r.freq==='mensuel')nextDate.setMonth(nextDate.getMonth()+1);
      else if(r.freq==='trimestriel')nextDate.setMonth(nextDate.getMonth()+3);
      else if(r.freq==='semestriel')nextDate.setMonth(nextDate.getMonth()+6);
      else nextDate.setFullYear(nextDate.getFullYear()+1);
    }
    nextDate.setHours(0,0,0,0);
    if(nextDate<=today){
      if(r.fin&&new Date(r.fin)<today)return;
      var ttc=Math.round(r.ht*(1+(r.tva/100)));
      var ecriture={date:nextDate.toISOString().split('T')[0],num:'REC-'+Date.now(),cli:r.tiers||'Récurrent',type:r.type==='produit'?'service':'achat',desc:'[REC] '+r.lib,ht:r.ht,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'attente',qty:1,unite:'forfait',produit:r.lib,cp:0,tvaType:r.tva+'v',tvaTaux:r.tva,tvaCpt:'4431',avoir:false,echeance:'',cptD:r.cpt,cptC:'521',debit:ttc,credit:ttc,isTVA:false};
      if(typeof EC!=='undefined')EC.push(ecriture);
      r.derniere=nextDate.toISOString().split('T')[0];
      generated++;
    }
  });
  saveV13();
  if(typeof sauvegarderAuto==='function')sauvegarderAuto();
  if(typeof renderJournal==='function')renderJournal();
  if(generated>0){
    alert('✓ '+generated+' écriture(s) récurrente(s) générée(s) dans le journal.');
    if(typeof ajouterNotif==='function')ajouterNotif('info',generated+' factures récurrentes générées','Vérifiez le journal pour les détails.');
  } else {
    alert('Aucune échéance due aujourd\'hui. Prochaine vérification demain.');
  }
  renderRec();
}

// ─── INVENTAIRE PHYSIQUE ───────────────────────────────
function renderInventaire(){
  if(document.getElementById('inv-annee'))document.getElementById('inv-annee').textContent=(typeof EXERCICE!=='undefined'?EXERCICE.annee:new Date().getFullYear());
  var tbody=document.getElementById('inv-tbody');if(!tbody)return;
  var stocks=typeof STOCKS!=='undefined'?STOCKS:{};
  var articles=Object.keys(stocks);
  if(!articles.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-faint);font-style:italic">Aucun article en stock. Alimentez le module Stock d\'abord.</td></tr>';return;}
  var html='';
  articles.forEach(function(ref){
    var s=stocks[ref];
    var qth=s.qte||0;
    html+='<tr style="border-bottom:2px solid var(--border)">'
      +'<td style="padding:8px 10px;font-weight:500">'+ref+'<div style="font-size:10px;color:var(--text-muted)">'+(s.desc||'')+'</div></td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+qth+'</td>'
      +'<td style="padding:8px 10px;text-align:right"><input type="number" min="0" value="'+qth+'" id="inv-reel-'+ref.replace(/[^a-z0-9]/gi,'_')+'" onchange="majEcartInv(\''+ref+'\')" style="width:80px;text-align:right;font-family:\'Archivo\',sans-serif"/></td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:600" id="inv-ecart-'+ref.replace(/[^a-z0-9]/gi,'_')+'">0</td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+(s.pu||0).toLocaleString('fr-FR')+'</td>'
      +'<td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif" id="inv-val-'+ref.replace(/[^a-z0-9]/gi,'_')+'">0</td>'
      +'<td style="padding:8px 10px;text-align:center" id="inv-stat-'+ref.replace(/[^a-z0-9]/gi,'_')+'"><span class="badge bg-green" style="font-size:9px">OK</span></td>'
      +'</tr>';
  });
  tbody.innerHTML=html;
}
function majEcartInv(ref){
  var key=ref.replace(/[^a-z0-9]/gi,'_');
  var s=typeof STOCKS!=='undefined'?STOCKS[ref]:{};
  var qth=s?s.qte||0:0;
  var reel=parseFloat((document.getElementById('inv-reel-'+key)||{}).value)||0;
  var ecart=reel-qth;
  var pu=s?s.pu||0:0;
  var val=Math.abs(ecart)*pu;
  var ecEl=document.getElementById('inv-ecart-'+key);
  var valEl=document.getElementById('inv-val-'+key);
  var statEl=document.getElementById('inv-stat-'+key);
  if(ecEl){ecEl.textContent=(ecart>=0?'+':'')+ecart;ecEl.style.color=ecart===0?'var(--text-muted)':ecart>0?'var(--green)':'var(--red)';}
  if(valEl)valEl.textContent=val.toLocaleString('fr-FR');
  if(statEl){
    if(ecart===0)statEl.innerHTML='<span class="badge bg-green" style="font-size:9px">OK</span>';
    else if(ecart>0)statEl.innerHTML='<span class="badge bg-green" style="font-size:9px">Surplus</span>';
    else statEl.innerHTML='<span class="badge bg-red" style="font-size:9px">Manque</span>';
  }
}
function comptabiliserEcarts(){
  var stocks=typeof STOCKS!=='undefined'?STOCKS:{};
  var articles=Object.keys(stocks);
  if(!articles.length){alert('Aucun stock à inventorier.');return;}
  var ecritures=[];
  articles.forEach(function(ref){
    var key=ref.replace(/[^a-z0-9]/gi,'_');
    var s=stocks[ref];
    var qth=s?s.qte||0:0;
    var reel=parseFloat((document.getElementById('inv-reel-'+key)||{}).value)||0;
    var ecart=reel-qth;
    if(ecart===0)return;
    var pu=s?s.pu||0:0;
    var val=Math.abs(ecart)*pu;
    var dateAuj=new Date().toISOString().split('T')[0];
    if(ecart<0){
      // Perte stock : D.6031 / C.3111
      ecritures.push({date:dateAuj,num:'INV-'+Date.now(),cli:'Inventaire',type:'achat',desc:'Manque inventaire — '+ref+' ('+Math.abs(ecart)+'u)',ht:val,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'payee',qty:1,unite:'lot',produit:ref,cp:val,tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',cptD:'6031',cptC:'3111',debit:val,credit:val,isTVA:false});
      if(typeof STOCKS!=='undefined')STOCKS[ref].qte=reel;
    } else {
      // Surplus stock : D.3111 / C.7032
      ecritures.push({date:dateAuj,num:'INV-'+Date.now()+1,cli:'Inventaire',type:'vente',desc:'Surplus inventaire — '+ref+' (+'+ecart+'u)',ht:val,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'payee',qty:1,unite:'lot',produit:ref,cp:0,tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',cptD:'3111',cptC:'7032',debit:val,credit:val,isTVA:false});
      if(typeof STOCKS!=='undefined')STOCKS[ref].qte=reel;
    }
  });
  if(!ecritures.length){alert('Aucun écart à comptabiliser.');return;}
  if(typeof EC!=='undefined')ecritures.forEach(function(e){EC.push(e);});
  if(typeof sauvegarderAuto==='function')sauvegarderAuto();
  if(typeof renderJournal==='function')renderJournal();
  var summary=document.getElementById('inv-summary');
  if(summary){summary.style.display='block';summary.innerHTML='<div style="padding:10px 14px;background:var(--green-light);border:2px solid var(--green-border);border-radius:var(--radius);color:var(--green-dark);font-size:12px">✓ <strong>'+ecritures.length+' écritures d\'inventaire comptabilisées</strong> dans le journal (D.6031/C.3111 pour les manques, D.3111/C.7032 pour les surplus). Vérifiez le journal.</div>';}
  if(typeof ajouterNotif==='function')ajouterNotif('info','Inventaire physique comptabilisé',ecritures.length+' écritures générées automatiquement.');
}

// ─── PROVISIONS & DÉPRÉCIATIONS ────────────────────────
var PROV_COMPTES={creance:{D:'6911',C:'491'},stock:{D:'6031',C:'391'},risque:{D:'6812',C:'151'},conges:{D:'6412',C:'428'},reprise:{D:'491',C:'791'}};
function majComptesProv(){
  var type=document.getElementById('prov-type').value;
  var cptes=PROV_COMPTES[type]||{D:'',C:''};
  document.getElementById('prov-cptD').value=cptes.D;
  document.getElementById('prov-cptC').value=cptes.C;
}
function enregistrerProvision(){
  var type=document.getElementById('prov-type').value;
  var desc=document.getElementById('prov-desc').value.trim();
  var mt=parseFloat(document.getElementById('prov-mt').value)||0;
  var date=document.getElementById('prov-date').value;
  if(!desc||!mt||!date){alert('Description, montant et date obligatoires.');return;}
  var cptes=PROV_COMPTES[type];
  var prov={id:Date.now(),type:type,desc:desc,mt:mt,date:date,cptD:cptes.D,cptC:cptes.C};
  PROVISIONS_LIST.push(prov);
  // Comptabiliser dans EC
  if(typeof EC!=='undefined'){
    EC.push({date:date,num:'PROV-'+Date.now(),cli:desc,type:'achat',desc:'[Provision] '+desc,ht:mt,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'payee',qty:1,unite:'',produit:'',cp:mt,tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',cptD:cptes.D,cptC:cptes.C,debit:mt,credit:mt,isTVA:false});
  }
  saveV13();
  if(typeof sauvegarderAuto==='function')sauvegarderAuto();
  if(typeof renderJournal==='function')renderJournal();
  renderProvisions();
  document.getElementById('prov-desc').value='';document.getElementById('prov-mt').value='';
  if(typeof ajouterNotif==='function')ajouterNotif('info','Provision comptabilisée — D.'+cptes.D+'/C.'+cptes.C,desc+' : '+mt.toLocaleString('fr-FR')+' FCFA');
}
function renderProvisions(){
  var w=document.getElementById('prov-list-wrap');if(!w)return;
  if(!PROVISIONS_LIST.length){w.innerHTML='<div style="text-align:center;padding:36px;color:var(--text-faint);font-style:italic">Aucune provision enregistrée.</div>';return;}
  var typeLabels={creance:'Créance douteuse',stock:'Dépréciation stock',risque:'Provision risque',conges:'Provision congés',reprise:'Reprise provision'};
  var html='<div class="card"><div class="card-header"><span class="card-title">Provisions enregistrées</span></div><div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--bg)"><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Date</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Type</th><th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Description</th><th style="padding:8px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Montant</th><th style="padding:8px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Écriture</th><th style="padding:8px 10px;border-bottom:2px solid var(--border)">Actions</th></tr></thead><tbody>';
  PROVISIONS_LIST.forEach(function(p,i){
    html+='<tr style="border-bottom:2px solid var(--border)"><td style="padding:8px 10px;font-size:11px">'+fmtD(p.date)+'</td><td style="padding:8px 10px">'+badge(typeLabels[p.type]||p.type,'bg-amber')+'</td><td style="padding:8px 10px">'+p.desc+'</td><td style="padding:8px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:600;color:var(--amber)">'+p.mt.toLocaleString('fr-FR')+' FCFA</td><td style="padding:8px 10px;font-family:\'Archivo\',sans-serif;font-size:11px">D.'+p.cptD+' / C.'+p.cptC+'</td><td style="padding:8px 10px"><button class="btn btn-sm" style="font-size:9px;padding:2px 6px;color:var(--red);border-color:var(--red-border)" onclick="supprimerProv('+i+')">✕</button></td></tr>';
  });
  html+='</tbody></table></div></div>';
  w.innerHTML=html;
}
function supprimerProv(i){if(confirm('Supprimer cette provision ?')){PROVISIONS_LIST.splice(i,1);saveV13();renderProvisions();}}

// ─── MULTI-DEVISES ─────────────────────────────────────
var FX_RATES={EUR:655.957,USD:606,CNY:84,GBP:785};
function chargerTauxChange(){
  // Taux approximatifs 2026 — EUR fixe UEMOA, autres estimés
  FX_RATES={EUR:655.957,USD:606,CNY:84,GBP:785};
  var ud=document.getElementById('fx-usd');if(ud)ud.textContent='~'+FX_RATES.USD;
  var cn=document.getElementById('fx-cny');if(cn)cn.textContent='~'+FX_RATES.CNY;
  var gb=document.getElementById('fx-gbp');if(gb)gb.textContent='~'+FX_RATES.GBP;
  // Pré-remplir le taux dans le formulaire selon la devise sélectionnée
  calcFXConv();
}
function populateFXTiers(){
  var dl=document.getElementById('fx-tiers-list');
  if(dl&&typeof TIERS!=='undefined'){dl.innerHTML='';TIERS.forEach(function(t){var o=document.createElement('option');o.value=t.nom;dl.appendChild(o);});}
}
function calcFXConv(){
  var devise=(document.getElementById('fx-devise')||{}).value||'EUR';
  var taux=parseFloat((document.getElementById('fx-taux')||{}).value)||FX_RATES[devise]||1;
  if(!document.getElementById('fx-taux').value)document.getElementById('fx-taux').value=FX_RATES[devise]||1;
  var mt=parseFloat((document.getElementById('fx-montant-dev')||{}).value)||0;
  var fcfa=Math.round(mt*taux);
  var el=document.getElementById('fx-montant-fcfa');if(el)el.value=fcfa.toLocaleString('fr-FR')+' FCFA';
}
(document.getElementById('fx-devise')||{addEventListener:function(){}}).addEventListener('change',function(){
  var dev=this.value;
  if(document.getElementById('fx-taux'))document.getElementById('fx-taux').value=FX_RATES[dev]||1;
  calcFXConv();
});
function enregistrerFX(){
  var devise=document.getElementById('fx-devise').value;
  var mt=parseFloat(document.getElementById('fx-montant-dev').value)||0;
  var taux=parseFloat(document.getElementById('fx-taux').value)||FX_RATES[devise]||1;
  var lib=document.getElementById('fx-lib').value.trim();
  var tiers=document.getElementById('fx-tiers').value.trim();
  var date=document.getElementById('fx-date').value;
  if(!mt||!lib||!date){alert('Montant, libellé et date obligatoires.');return;}
  var fcfa=Math.round(mt*taux);
  var tauxRef=FX_RATES[devise]||taux;
  var ecartChange=Math.round(mt*(taux-tauxRef));
  var op={id:Date.now(),devise:devise,montant:mt,taux:taux,fcfa:fcfa,lib:lib,tiers:tiers,date:date,type:document.getElementById('fx-type').value,ecart:ecartChange};
  FX_LIST.push(op);
  // Écriture dans EC
  if(typeof EC!=='undefined'){
    var cptD=op.type==='facture'?'4111':'521';
    var cptC=op.type==='facture'?'701':'4011';
    EC.push({date:date,num:'FX-'+Date.now(),cli:tiers||lib,type:op.type==='facture'?'vente':'achat',desc:'[FX '+devise+'] '+lib+' ('+mt+' '+devise+' × '+taux+' = '+fcfa.toLocaleString('fr-FR')+' FCFA)',ht:fcfa,escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'attente',qty:1,unite:'',produit:'',cp:0,tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',cptD:cptD,cptC:cptC,debit:fcfa,credit:fcfa,isTVA:false});
    // Écart de change si taux différent du taux de référence
    if(Math.abs(ecartChange)>0){
      EC.push({date:date,num:'FX-ECT-'+Date.now(),cli:'Écart change '+devise,type:'achat',desc:'[Écart change] '+devise+' — variation taux',ht:Math.abs(ecartChange),escp:0,rrr:0,tr:0,port:0,avance:0,pay:'banque',stat:'payee',qty:1,unite:'',produit:'',cp:0,tvaType:'0v',tvaTaux:0,tvaCpt:'',avoir:false,echeance:'',cptD:ecartChange<0?'476':'477',cptC:ecartChange<0?'477':'476',debit:Math.abs(ecartChange),credit:Math.abs(ecartChange),isTVA:false});
    }
  }
  saveV13();if(typeof sauvegarderAuto==='function')sauvegarderAuto();if(typeof renderJournal==='function')renderJournal();
  renderFX();
  document.getElementById('fx-montant-dev').value='';document.getElementById('fx-lib').value='';document.getElementById('fx-montant-fcfa').value='';
  if(typeof ajouterNotif==='function')ajouterNotif('info','Opération FX enregistrée — '+mt+' '+devise,'= '+fcfa.toLocaleString('fr-FR')+' FCFA'+( Math.abs(ecartChange)>0?' | Écart change: '+ecartChange.toLocaleString('fr-FR')+' FCFA':''));
}
function renderFX(){
  var w=document.getElementById('fx-list-wrap');if(!w)return;
  if(!FX_LIST.length){w.innerHTML='<div style="text-align:center;padding:24px;color:var(--text-faint);font-style:italic">Aucune opération en devise.</div>';return;}
  var html='<div class="card" style="margin-top:12px"><div class="card-header"><span class="card-title">Historique opérations en devises</span></div><div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--bg)"><th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Date</th><th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Devise</th><th style="padding:7px 10px;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Libellé</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Montant dev.</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Taux</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">FCFA</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--text-muted)">Écart change</th></tr></thead><tbody>';
  FX_LIST.slice().reverse().forEach(function(op){
    html+='<tr style="border-bottom:2px solid var(--border)"><td style="padding:7px 10px;font-size:11px">'+fmtD(op.date)+'</td><td style="padding:7px 10px"><span class="badge bg-blue" style="font-size:9px">'+op.devise+'</span></td><td style="padding:7px 10px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+op.lib+'</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+op.montant.toLocaleString('fr-FR')+' '+op.devise+'</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif">'+op.taux+'</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;font-weight:600">'+op.fcfa.toLocaleString('fr-FR')+' FCFA</td><td style="padding:7px 10px;text-align:right;font-family:\'Archivo\',sans-serif;color:'+(op.ecart>=0?'var(--green)':'var(--red)')+'">'+(op.ecart>=0?'+':'')+op.ecart.toLocaleString('fr-FR')+'</td></tr>';
  });
  html+='</tbody></table></div></div>';
  w.innerHTML=html;
}

// ─── TABLEAU FLUX TRÉSORERIE (TFT) ─────────────────────
function calculerTFT(){
  var el=document.getElementById('tft-content');if(!el)return;
  if(typeof EC==='undefined'){el.innerHTML='<div style="color:var(--text-faint);padding:24px;text-align:center">Aucune donnée comptable disponible.</div>';return;}
  var fluxExp=0,fluxInv=0,fluxFin=0;
  var detailsExp=[],detailsInv=[],detailsFin=[];
  var treso0=0;
  if(typeof SOLDES!=='undefined'){treso0=(SOLDES['521']||0)+(SOLDES['571']||0);}
  EC.concat(typeof REGL!=='undefined'?REGL:[]).forEach(function(e){
    if(!e.cptD&&!e.cptC)return;
    var d=e.cptD||'',c=e.cptC||'';
    var mt=e.debit||e.ttc||0;
    // Exploitation
    if((d.startsWith('6')||c.startsWith('7'))&&!d.startsWith('28')&&!d.startsWith('68')){
      if(c.startsWith('7'))fluxExp+=mt;
      if(d.startsWith('6'))fluxExp-=mt;
      detailsExp.push({lib:e.desc,mt:c.startsWith('7')?mt:-mt,cpt:c.startsWith('7')?c:d});
    }
    // Investissement
    if(d.startsWith('2')&&!d.startsWith('28')){fluxInv-=mt;detailsInv.push({lib:e.desc,mt:-mt,cpt:d});}
    if(c.startsWith('2')&&!c.startsWith('28')){fluxInv+=mt;detailsInv.push({lib:e.desc,mt:mt,cpt:c});}
    // Financement
    if(d.startsWith('16')||d.startsWith('10')){fluxFin-=mt;detailsFin.push({lib:e.desc,mt:-mt,cpt:d});}
    if(c.startsWith('16')||c.startsWith('10')){fluxFin+=mt;detailsFin.push({lib:e.desc,mt:mt,cpt:c});}
  });
  var varTotal=fluxExp+fluxInv+fluxFin;
  var tresoN=treso0+varTotal;
  var html='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px">';
  [{lib:'Flux exploitation',val:fluxExp,cls:fluxExp>=0?'green':'red'},{lib:'Flux investissement',val:fluxInv,cls:fluxInv>=0?'green':'red'},{lib:'Flux financement',val:fluxFin,cls:fluxFin>=0?'green':'red'},{lib:'Variation trésorerie',val:varTotal,cls:varTotal>=0?'green':'red'}].forEach(function(k){
    html+='<div style="background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">'+k.lib+'</div><div style="font-size:18px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--'+k.cls+')">'+(k.val>=0?'+':'')+Math.round(k.val).toLocaleString('fr-FR')+'</div><div style="font-size:9px;color:var(--text-faint)">FCFA</div></div>';
  });
  html+='</div>';
  function renderSection(title,icon,details,total,couleur){
    var r='<div style="background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);margin-bottom:12px;overflow:hidden"><div style="padding:10px 14px;background:var(--bg);border-bottom:2px solid var(--border);display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600;font-size:12px">'+icon+' '+title+'</span><span style="font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--'+couleur+')">'+(total>=0?'+':'')+Math.round(total).toLocaleString('fr-FR')+' FCFA</span></div><div style="padding:10px 14px">';
    if(details.length){
      r+='<table style="width:100%;border-collapse:collapse;font-size:11px"><tbody>';
      var shown=details.slice(0,8);
      shown.forEach(function(d){r+='<tr><td style="padding:3px 0;color:var(--text-muted)">'+d.lib+'</td><td style="text-align:right;font-family:\'Archivo\',sans-serif;color:'+(d.mt>=0?'var(--green)':'var(--red)')+'"> '+(d.mt>=0?'+':'')+Math.round(d.mt).toLocaleString('fr-FR')+'</td></tr>';});
      if(details.length>8)r+='<tr><td colspan="2" style="color:var(--text-faint);font-style:italic;padding:3px 0">... et '+(details.length-8)+' autres opérations</td></tr>';
      r+='</tbody></table>';
    } else {r+='<div style="color:var(--text-faint);font-style:italic;font-size:11px">Aucun flux de ce type.</div>';}
    r+='</div></div>';
    return r;
  }
  html+=renderSection('Flux d\'exploitation','⚙️',detailsExp,fluxExp,'green');
  html+=renderSection('Flux d\'investissement','🏗️',detailsInv,fluxInv,'blue');
  html+=renderSection('Flux de financement','💼',detailsFin,fluxFin,'purple');
  html+='<div style="background:var(--sidebar-bg);border-radius:var(--radius);padding:16px 20px;color:#fff;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--green-border)">Trésorerie d\'ouverture</div><div style="font-size:18px;font-weight:700;font-family:\'Archivo\',sans-serif">'+Math.round(treso0).toLocaleString('fr-FR')+' FCFA</div></div><div style="font-size:28px;color:var(--green-border)">→</div><div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--amber)">Trésorerie de clôture</div><div style="font-size:28px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--amber)">'+Math.round(tresoN).toLocaleString('fr-FR')+' FCFA</div></div></div>';
  html+='<div style="margin-top:8px;font-size:10px;color:var(--text-faint)">SYSCOHADA révisé 2017 — TFT méthode indirecte. Variation trésorerie = Flux exploitation + Flux investissement + Flux financement = '+(varTotal>=0?'+':'')+Math.round(varTotal).toLocaleString('fr-FR')+' FCFA.</div>';
  el.innerHTML=html;
}
function exporterTFTPDF(){
  calculerTFT();
  var jsPDF_=window.jspdf?window.jspdf.jsPDF:window.jsPDF;
  if(!jsPDF_){alert('PDF non disponible.');return;}
  var doc=new jsPDF_({unit:'mm',format:'a4'});
  var W=210,M=14,y=20;
  doc.setFillColor(13,31,26);doc.rect(0,0,W,28,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont('helvetica','bold');
  doc.text('Tableau des Flux de Trésorerie — SYSCOHADA',M,12);
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  doc.text(((document.querySelector('.logo-sub')||{}).textContent||'Mon Entreprise')+' | Exercice '+(typeof EXERCICE!=='undefined'?EXERCICE.annee:new Date().getFullYear()),M,20);
  doc.text('Généré le '+new Date().toLocaleDateString('fr-FR'),W-M,25,{align:'right'});
  doc.setTextColor(0,0,0);y=36;
  doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('Tableau des Flux de Trésorerie',M,y);y+=8;
  doc.setFontSize(8.5);doc.setFont('helvetica','normal');
  doc.text('Document conforme SYSCOHADA révisé 2017.',M,y);y+=10;
  doc.setFont('helvetica','bold');doc.text('Cet état est généré automatiquement depuis les écritures GEST Africa.',M,y);
  doc.save('TFT_GestAfrica_'+(typeof EXERCICE!=='undefined'?EXERCICE.annee:new Date().getFullYear())+'.pdf');
}

// ─── CALENDRIER FISCAL TOGO ────────────────────────────
function renderCalendrier(){
  var an=typeof EXERCICE!=='undefined'?EXERCICE.annee:new Date().getFullYear();
  var el=document.getElementById('cal-annee-badge');if(el)el.textContent=an;
  var today=new Date();today.setHours(0,0,0,0);
  var echeances=[
    // TVA mensuelle (15 de chaque mois)
    {mois:1,jour:15,lib:'Déclaration TVA — Décembre '+(an-1),org:'DGI',type:'tva',priorite:'urgent'},
    {mois:2,jour:15,lib:'Déclaration TVA — Janvier '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:3,jour:15,lib:'Déclaration TVA — Février '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:4,jour:15,lib:'Déclaration TVA — Mars '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:5,jour:15,lib:'Déclaration TVA — Avril '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:6,jour:15,lib:'Déclaration TVA — Mai '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:7,jour:15,lib:'Déclaration TVA — Juin '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:8,jour:15,lib:'Déclaration TVA — Juillet '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:9,jour:15,lib:'Déclaration TVA — Août '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:10,jour:15,lib:'Déclaration TVA — Septembre '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:11,jour:15,lib:'Déclaration TVA — Octobre '+an,org:'DGI',type:'tva',priorite:'urgent'},
    {mois:12,jour:15,lib:'Déclaration TVA — Novembre '+an,org:'DGI',type:'tva',priorite:'urgent'},
    // IS acomptes
    {mois:4,jour:30,lib:'1er acompte IS — 33,33% de l\'IS estimé',org:'DGI',type:'is',priorite:'important'},
    {mois:7,jour:31,lib:'2e acompte IS — 33,33% de l\'IS estimé',org:'DGI',type:'is',priorite:'important'},
    {mois:10,jour:31,lib:'3e acompte IS — 33,33% de l\'IS estimé',org:'DGI',type:'is',priorite:'important'},
    {mois:3,jour:31,lib:'Solde IS — Régularisation IS exercice '+(an-1),org:'DGI',type:'is',priorite:'important'},
    // CNSS trimestriel
    {mois:1,jour:31,lib:'CNSS — Cotisations T4 '+(an-1)+' (salarié 4% + patronal 17,5%)',org:'CNSS',type:'cnss',priorite:'urgent'},
    {mois:4,jour:30,lib:'CNSS — Cotisations T1 '+an,org:'CNSS',type:'cnss',priorite:'urgent'},
    {mois:7,jour:31,lib:'CNSS — Cotisations T2 '+an,org:'CNSS',type:'cnss',priorite:'urgent'},
    {mois:10,jour:31,lib:'CNSS — Cotisations T3 '+an,org:'CNSS',type:'cnss',priorite:'urgent'},
    // ITS mensuel
    {mois:1,jour:15,lib:'ITS — Retenues salariales Décembre '+(an-1),org:'DGI',type:'its',priorite:'normal'},
    {mois:2,jour:15,lib:'ITS — Retenues salariales Janvier '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:3,jour:15,lib:'ITS — Retenues salariales Février '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:4,jour:15,lib:'ITS — Retenues salariales Mars '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:5,jour:15,lib:'ITS — Retenues salariales Avril '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:6,jour:15,lib:'ITS — Retenues salariales Mai '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:7,jour:15,lib:'ITS — Retenues salariales Juin '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:8,jour:15,lib:'ITS — Retenues salariales Juillet '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:9,jour:15,lib:'ITS — Retenues salariales Août '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:10,jour:15,lib:'ITS — Retenues salariales Septembre '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:11,jour:15,lib:'ITS — Retenues salariales Octobre '+an,org:'DGI',type:'its',priorite:'normal'},
    {mois:12,jour:15,lib:'ITS — Retenues salariales Novembre '+an,org:'DGI',type:'its',priorite:'normal'},
    // Bilan annuel
    {mois:6,jour:30,lib:'Dépôt états financiers SYSCOHADA — Exercice '+(an-1)+' (AGO)',org:'RCCM / OEC',type:'bilan',priorite:'important'},
    {mois:4,jour:30,lib:'Liasse fiscale annuelle — IS, BIC (déclaration DGI)',org:'DGI',type:'bilan',priorite:'important'},
    // Patente
    {mois:3,jour:31,lib:'Paiement patente / contribution des patentes',org:'DGI',type:'autre',priorite:'normal'},
    // IMF
    {mois:6,jour:30,lib:'IMF (Impôt Minimum Forfaitaire) — si IS < IMF',org:'DGI',type:'autre',priorite:'normal'},
  ];
  // Attach dates and compute days remaining
  echeances.forEach(function(e){
    e.date=new Date(an,e.mois-1,e.jour);
    e.date.setHours(0,0,0,0);
    e.joursRestants=Math.round((e.date-today)/(1000*60*60*24));
  });
  echeances.sort(function(a,b){return a.date-b.date;});
  // Prochaine échéance
  var prochaine=echeances.find(function(e){return e.joursRestants>=0;});
  var pEl=document.getElementById('cal-prochaine');
  if(pEl&&prochaine){
    var urgence=prochaine.joursRestants<=7?'🔴':prochaine.joursRestants<=30?'🟡':'🟢';
    pEl.innerHTML='<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--red);margin-bottom:4px">'+urgence+' Prochaine échéance</div><div style="font-size:13px;font-weight:600">'+prochaine.lib+'</div><div style="font-size:11px;color:var(--text-muted);margin-top:3px">'+prochaine.org+' — '+(prochaine.joursRestants===0?'<strong style="color:var(--red)">Aujourd\'hui !</strong>':prochaine.joursRestants+' jour(s)')+'</div>';
  }
  var futurs=echeances.filter(function(e){return e.joursRestants>=0;}).length;
  var nbEl=document.getElementById('cal-nb-echeances');
  if(nbEl)nbEl.innerHTML='<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Total à venir</div><div style="font-size:24px;font-weight:700;font-family:\'Archivo\',sans-serif;color:var(--amber)">'+futurs+'</div><div style="font-size:10px;color:var(--text-faint)">échéances</div>';
  // Regrouper par mois
  var parMois={};
  echeances.forEach(function(e){
    var k=e.mois+'-'+an;
    if(!parMois[k])parMois[k]=[];
    parMois[k].push(e);
  });
  var moisNoms=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  var typeColors={tva:'bg-green',is:'bg-amber',cnss:'bg-blue',its:'bg-purple',bilan:'bg-teal',autre:'bg-red'};
  var prioriteColors={urgent:'var(--red)',important:'var(--amber)',normal:'var(--text-muted)'};
  var html='';
  for(var m=1;m<=12;m++){
    var k=m+'-'+an;
    var items=parMois[k]||[];
    var hasPassees=items.some(function(e){return e.joursRestants<0;});
    var hasFutures=items.some(function(e){return e.joursRestants>=0;});
    var moisClass=hasPassees&&!hasFutures?'opacity:.5':'';
    html+='<div style="'+moisClass+';margin-bottom:10px;background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);overflow:hidden">';
    html+='<div style="padding:8px 14px;background:var(--bg);border-bottom:2px solid var(--border);display:flex;align-items:center;gap:8px"><strong style="font-size:12px">'+moisNoms[m-1]+' '+an+'</strong><span style="font-size:10px;color:var(--text-faint)">'+items.length+' obligation(s)</span></div>';
    if(items.length){
      html+='<div style="padding:8px 14px">';
      items.forEach(function(e){
        var bgPasse=e.joursRestants<0?'opacity:.5;':'';
        var pasteBg=e.joursRestants<0?'background:var(--bg);':e.joursRestants<=7?'background:var(--red-light);':'';
        var rowBg=e.joursRestants<0?'background:var(--bg)':e.joursRestants<=7?'background:var(--red-light)':e.joursRestants<=30?'background:var(--amber-light)':'background:var(--surface)';
        html+='<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:var(--radius);margin-bottom:4px;border:2px solid var(--border);'+rowBg+'">';
        html+='<div style="min-width:32px;text-align:center;font-family:\'Archivo\',sans-serif;font-size:16px;font-weight:700;color:var(--text-muted)">'+String(e.jour).padStart(2,'0')+'</div>';
        html+='<div style="flex:1"><div style="font-size:12px;font-weight:500">'+(e.joursRestants<0?'<s>':'')+e.lib+(e.joursRestants<0?'</s>':'')+'</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px;display:flex;gap:8px"><span>'+badge(e.org,typeColors[e.type]||'bg-blue')+'</span>'+(e.joursRestants>=0?'<span style="color:'+prioriteColors[e.priorite]+'">'+( e.joursRestants===0?'<strong>Aujourd\'hui !</strong>':e.joursRestants+' j')+'</span>':'<span style="color:var(--text-faint)">Passée</span>')+'</div></div>';
        html+='</div>';
      });
      html+='</div>';
    }
    html+='</div>';
  }
  var calEl=document.getElementById('cal-content');if(calEl)calEl.innerHTML=html;
}

// ─── MISE À JOUR DU GO() UNIFIÉ v12 ────────────────────
// Extend the existing T map for page titles
(function(){
  var unifiedGo=window.go;
  var newTitles={devis:'📋 Devis',bc:'🛒 Bons de commande',bl:'🚚 Bons de livraison',recurrentes:'🔄 Factures récurrentes',inventaire:'🔢 Inventaire physique',provisions:'⚠️ Provisions & Dépréciations',multidevises:'💱 Multi-devises',tft:'💧 Tableau des Flux de Trésorerie',calendrier:'📅 Calendrier fiscal',profil:'🏢 Profil entreprise'};
  // Already patched above — just extend the title map if needed
})();

// ─── INIT v13 ──────────────────────────────────────────
(function(){
  // Update footer
  var footer=document.getElementById('sidebar-footer');
  if(footer)footer.textContent='GEST Africa v13 — OHADA Togo';
  document.title='GEST Africa v13 — OHADA Togo';
  // Load profil into sidebar name
  if(PROFIL_DATA.nom){
    var sub=document.querySelector('.logo-sub');
    if(sub)sub.textContent=PROFIL_DATA.nom;
  }
  // Init prov comptes defaults
  majComptesProv();
  // Add today's date to fx
  var fxDate=document.getElementById('fx-date');
  if(fxDate)fxDate.value=new Date().toISOString().split('T')[0];
  // Check recurrentes on load
  setTimeout(function(){
    if(typeof RECURRENTES!=='undefined'&&RECURRENTES.length){
      var today=new Date();today.setHours(0,0,0,0);
      var dues=RECURRENTES.filter(function(r){
        if(!r.actif)return false;
        var next=new Date(r.derniere||r.debut);
        if(r.derniere){
          if(r.freq==='mensuel')next.setMonth(next.getMonth()+1);
          else if(r.freq==='trimestriel')next.setMonth(next.getMonth()+3);
          else if(r.freq==='semestriel')next.setMonth(next.getMonth()+6);
          else next.setFullYear(next.getFullYear()+1);
        }
        next.setHours(0,0,0,0);
        return next<=today&&(!r.fin||new Date(r.fin)>=today);
      });
      if(dues.length&&typeof ajouterNotif==='function'){
        ajouterNotif('warn',dues.length+' facture(s) récurrente(s) en attente de génération','Allez dans Factures récurrentes → Générer les échéances dues');
      }
    }
  },1500);
})();
