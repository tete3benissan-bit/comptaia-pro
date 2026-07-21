// v12: auth, journal tabs+pagination, TVA declaration, rapprochement bancaire, dashboard chart, facture PDF, alerts, unified go() - extracted from ComptaIA_Pro_original.html lines 4402-4963
// ═══════════════════════════════════════════════════════
// ComptaIA v12 — Module principal
// ═══════════════════════════════════════════════════════

// ── Authentification ──────────────────────────────────
var CURRENT_USER = null;

async function hashPass(str) {
  try {
    var buf = new TextEncoder().encode(str);
    var hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  } catch(e) {
    // Fallback simple hash for older browsers
    var h = 0;
    for(var i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;}
    return 'h'+Math.abs(h).toString(16);
  }
}

function getUsers() { try{return JSON.parse(localStorage.getItem('comptaia_users')||'[]');}catch(e){return [];} }
function saveUsers(u) { localStorage.setItem('comptaia_users',JSON.stringify(u)); }

// Migration: installs that ran the old hardcoded-demo-account version have
// admin/comptable/lecture users already sitting in localStorage. Those never
// had a "nom" field (added with this version) — real accounts always do, so
// any user missing it is unmistakably leftover demo data. Wipe it so the
// installation goes through first-run admin setup instead of silently
// keeping the old admin123/compta123/lecture123 passwords alive.
function migrerAnciensComptesDemo() {
  var users = getUsers();
  if (users.length && users.every(function(u){ return !u.nom; })) {
    saveUsers([]);
    sessionStorage.removeItem('comptaia_session');
  }
}

// No more hardcoded demo accounts. On first launch (zero users), the auth
// screen shows a one-time "create the administrator account" form instead
// of the login form; every other account is created afterwards by that
// admin from the "Gestion des utilisateurs" panel (js/20-user-management.js).
function authBootstrap() {
  migrerAnciensComptesDemo();
  var users = getUsers();
  var loginCard = document.getElementById('auth-login-card');
  var setupCard = document.getElementById('auth-setup-card');
  if (users.length === 0) {
    if (loginCard) loginCard.style.display = 'none';
    if (setupCard) setupCard.style.display = 'flex';
  } else {
    if (loginCard) loginCard.style.display = 'flex';
    if (setupCard) setupCard.style.display = 'none';
  }
}

async function authSetupAdmin() {
  var nom=(document.getElementById('setup-nom').value||'').trim();
  var u=(document.getElementById('setup-user').value||'').trim();
  var p=document.getElementById('setup-pass').value;
  if(!nom||!u||!p){showAErr('Tous les champs sont requis.');return;}
  if(p.length<6){showAErr('Mot de passe trop court (min. 6 caractères).');return;}
  var users=getUsers();
  if(users.find(x=>x.username.toLowerCase()===u.toLowerCase())){showAErr('Identifiant déjà utilisé.');return;}
  var ph=await hashPass(p);
  var admin={nom:nom,username:u,passHash:ph,role:'admin',active:true};
  users.push(admin);
  saveUsers(users);
  CURRENT_USER=admin; sessionStorage.setItem('comptaia_session',JSON.stringify(admin));
  onAuthSuccess();
}

async function authLogin() {
  var u=(document.getElementById('auth-user').value||'').trim();
  var p=document.getElementById('auth-pass').value;
  if(!u||!p){showAErr('Identifiant et mot de passe requis.');return;}
  var users=getUsers(); var ph=await hashPass(p);
  var user=users.find(x=>x.username===u&&x.passHash===ph);
  if(!user){showAErr('Identifiant ou mot de passe incorrect.');return;}
  if(user.active===false){showAErr('Ce compte a été désactivé. Contactez votre administrateur.');return;}
  CURRENT_USER=user; sessionStorage.setItem('comptaia_session',JSON.stringify(user));
  onAuthSuccess();
}

function showAErr(m){var e=document.getElementById('auth-err');e.textContent=m;e.style.display='block';}

function onAuthSuccess() {
  document.getElementById('auth-overlay').style.display='none';
  var company=CURRENT_USER.company||'Mon Entreprise SARL';
  var logoSub=document.querySelector('.logo-sub');
  if(logoSub)logoSub.textContent=company;
  var footer=document.getElementById('sidebar-footer');
  if(footer)footer.textContent='ComptaIA v12 — '+company;
  var tu=document.getElementById('topbar-user');
  var roleLabels={admin:'Admin',comptable:'Comptable',lecture:'Lecture'};
  var displayName=CURRENT_USER.nom||CURRENT_USER.username;
  if(tu)tu.innerHTML='👤 <strong>'+displayName+'</strong> <span style="font-size:10px;padding:1px 6px;border-radius:var(--radius);font-weight:700;background:'+(CURRENT_USER.role==='admin'?'var(--green-light)':CURRENT_USER.role==='comptable'?'var(--blue-light)':'var(--amber-light)')+';color:'+(CURRENT_USER.role==='admin'?'var(--green-dark)':CURRENT_USER.role==='comptable'?'var(--blue)':'var(--amber)')+'">'+roleLabels[CURRENT_USER.role]+'</span>';
  var btnLogout=document.getElementById('btn-logout');
  if(btnLogout)btnLogout.style.display='inline-block';
  // Load data
  try{chargerLocalStorage();}catch(e){}
  try{syncTiersList();syncProduitSelect();}catch(e){}
  try{renderAll();}catch(e){}
  try{verifierRetards();}catch(e){}
  document.title='ComptaIA v12 — '+company;
  setTimeout(function(){try{verifierAlertes();}catch(e){}},1500);
}

function authLogout() {
  if(!confirm('Se déconnecter ?'))return;
  CURRENT_USER=null; sessionStorage.removeItem('comptaia_session');
  document.getElementById('auth-overlay').style.display='flex';
  var tu=document.getElementById('topbar-user'); if(tu)tu.innerHTML='';
  var btnLogout=document.getElementById('btn-logout'); if(btnLogout)btnLogout.style.display='none';
}

// ── Journal tabs + pagination ─────────────────────────
var JTAB_ACTIVE='all', J_PAGE=0, J_PAGE_SIZE=30;

function setJTab(tab,btn) {
  JTAB_ACTIVE=tab; J_PAGE=0;
  document.querySelectorAll('.jtab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderJournal();
}

// Override renderJournal with tab+pagination support
var _origRJ=renderJournal;
renderJournal=function(){
  var search=((document.getElementById('j-search')||{}).value||'').toLowerCase();
  var ftype=((document.getElementById('j-filter-type')||{}).value||'');
  var ffrom=((document.getElementById('j-filter-from')||{}).value||'');
  var fto=((document.getElementById('j-filter-to')||{}).value||'');
  var fstat=((document.getElementById('j-filter-stat')||{}).value||'');
  var all=EC.concat(REGL);
  // Tab filter
  all=all.filter(function(e){
    if(JTAB_ACTIVE==='vente')return(e.type==='vente'||e.type==='service')&&!e.isTVA&&!e.isAvance;
    if(JTAB_ACTIVE==='achat')return e.type==='achat'&&!e.isTVA&&!e.isAvance;
    if(JTAB_ACTIVE==='banque')return e.pay==='banque';
    if(JTAB_ACTIVE==='od')return e.isTVA||e.isAvance||e.isAmort;
    return true;
  });
  var filtered=all.filter(function(e){
    if(search&&!(e.desc+e.num+e.cli+'').toLowerCase().includes(search))return false;
    if(ftype&&(e.avoir?'avoir':e.type)!==ftype)return false;
    if(ffrom&&e.date<ffrom)return false;
    if(fto&&e.date>fto)return false;
    if(fstat&&e.stat!==fstat)return false;
    return true;
  });
  var jcount=document.getElementById('j-count');
  if(jcount)jcount.textContent='('+filtered.length+'/'+all.length+')';
  if(!filtered.length){
    document.getElementById('j-body').innerHTML='<tr class="empty-row"><td colspan="11">Aucune écriture</td></tr>';
    document.getElementById('j-tfoot').style.display='none';
    document.getElementById('j-equilibre').textContent='—';
    var pag=document.getElementById('j-pagination');if(pag)pag.innerHTML='';
    return;
  }
  var totalPages=Math.ceil(filtered.length/J_PAGE_SIZE);
  if(J_PAGE>=totalPages)J_PAGE=totalPages-1;
  var pageItems=filtered.slice(J_PAGE*J_PAGE_SIZE,(J_PAGE+1)*J_PAGE_SIZE);
  var h='',tD=0,tC=0,attente=0;
  filtered.forEach(function(e){tD+=e.debit;tC+=e.credit;if(e.stat==='attente'&&!REGL.includes(e))attente++;});
  pageItems.forEach(function(e){
    var origIdx=EC.indexOf(e);
    var isAtt=e.stat==='attente'&&!REGL.includes(e);
    var sb=isAtt?'<span class="badge bg-amber" style="cursor:pointer" onclick="ouvrirRegl('+origIdx+')">⏳</span>':'<span class="badge bg-green">✓</span>';
    var btnR=isAtt?'<button onclick="ouvrirRegl('+origIdx+')" style="font-size:10px;padding:2px 8px;border-radius:var(--radius);cursor:pointer;border:1px solid var(--green);background:var(--green-light);color:var(--green-dark);font-weight:600">Régler</button>':'';
    var bg=isAtt?'background:#f5efe2;':e.avoir?'background:#FAF5FF;':e.isTVA?'':'';
    var bl=isAtt?'border-left:3px solid var(--amber);':e.avoir?'border-left:3px solid var(--purple);':e.isTVA?'border-left:3px solid var(--teal);':'border-left:3px solid transparent;';
    var tags='';
    if(e._modifie)tags+=' <span style="font-size:9px;padding:1px 4px;background:var(--amber-light);color:var(--amber);border-radius:var(--radius)">modifié</span>';
    if(e.avoir)tags+=' <span style="font-size:9px;padding:1px 4px;background:var(--purple-light);color:var(--purple);border-radius:var(--radius)">AVOIR</span>';
    if(e.isTVA)tags+=' <span style="font-size:9px;padding:1px 4px;background:var(--teal-light);color:var(--teal);border-radius:var(--radius)">TVA</span>';
    var tvaBadge=e.tvaTaux>0?'<span class="badge bg-teal">'+e.tvaTaux+'%</span>':'—';
    var echTag=e.echeance?'<span style="font-size:10px;color:'+(new Date(e.echeance)<new Date()&&e.stat==='attente'?'var(--red)':'var(--text-muted)')+'">'+fmtD(e.echeance)+'</span>':'—';
    var btnEdit=origIdx>=0?'<button onclick="ouvrirEdit('+origIdx+',\'EC\')" style="font-size:10px;padding:2px 6px;border-radius:var(--radius);cursor:pointer;border:2px solid var(--border-strong);background:transparent;color:var(--text-muted)">✏️</button>'+'<button onclick="genererFacturePDF('+origIdx+')" style="font-size:10px;padding:2px 6px;border-radius:var(--radius);cursor:pointer;border:2px solid var(--blue-border);background:var(--blue-light);color:var(--blue)" title="PDF">🖨️</button>':'';
    h+='<tr style="'+bg+bl+'"><td style="white-space:nowrap">'+(e.dateF||e.date||'')+'</td><td><strong>'+e.num+'</strong>'+tags+'</td><td style="max-width:160px;white-space:normal;font-size:10.5px">'+e.desc+'</td><td><span class="acc">'+e.cptD+'</span></td><td><span class="acc">'+e.cptC+'</span></td><td style="font-family:\'Archivo\',sans-serif;text-align:right">'+fmt(e.debit)+'</td><td style="font-family:\'Archivo\',sans-serif;text-align:right">'+fmt(e.credit)+'</td><td>'+tvaBadge+'</td><td>'+echTag+'</td><td>'+sb+'</td><td style="display:flex;gap:3px;white-space:nowrap">'+btnR+btnEdit+'</td></tr>';
  });
  document.getElementById('j-body').innerHTML=h;
  document.getElementById('j-tfoot').style.display='';
  document.getElementById('j-totd').textContent=fmt(tD)+' FCFA';
  document.getElementById('j-totc').textContent=fmt(tC)+' FCFA';
  var eq=document.getElementById('j-equilibre');
  if(attente>0){eq.innerHTML='<span style="color:var(--amber)">⏳ '+attente+' en attente</span>';}
  else if(Math.abs(tD-tC)<1){eq.textContent='✓ Équilibré';eq.style.color='var(--green)';}
  else{eq.textContent='⚠ Déséquilibré '+fmt(Math.abs(tD-tC))+' FCFA';eq.style.color='var(--red)';}
  // Pagination
  var pag=document.getElementById('j-pagination');
  if(pag){
    if(totalPages>1){
      var ph='';
      if(J_PAGE>0)ph+='<button class="page-btn" onclick="jGotoPage('+(J_PAGE-1)+')">← Préc</button>';
      for(var p2=0;p2<totalPages;p2++){
        if(p2===J_PAGE)ph+='<button class="page-btn active">'+(p2+1)+'</button>';
        else if(p2<2||p2>totalPages-3||Math.abs(p2-J_PAGE)<2)ph+='<button class="page-btn" onclick="jGotoPage('+p2+')">'+(p2+1)+'</button>';
        else if(ph.slice(-4)!='...<')ph+='<span style="padding:4px 2px;color:var(--text-faint)">…</span>';
      }
      if(J_PAGE<totalPages-1)ph+='<button class="page-btn" onclick="jGotoPage('+(J_PAGE+1)+')">Suiv →</button>';
      ph+='<span style="font-size:10px;color:var(--text-faint);padding:4px 8px">'+(J_PAGE*J_PAGE_SIZE+1)+'–'+Math.min((J_PAGE+1)*J_PAGE_SIZE,filtered.length)+' / '+filtered.length+'</span>';
      pag.innerHTML=ph;
    }else pag.innerHTML='';
  }
};

function jGotoPage(p){J_PAGE=p;renderJournal();}

// ── TVA Déclaration ──────────────────────────────────
function renderTVA(){
  var fmois=((document.getElementById('tva-mois-filter')||{}).value)||'';
  // Populate month filter
  var sel=document.getElementById('tva-mois-filter');
  if(sel){
    var current=sel.value;
    var mois=new Set();
    EC.forEach(function(e){if(e.date&&e.isTVA)mois.add(e.date.substring(0,7));});
    sel.innerHTML='<option value="">Toute la période</option>';
    Array.from(mois).sort().forEach(function(m){var opt=document.createElement('option');opt.value=m;var p=m.split('-');opt.textContent=p[1]+'/'+p[0];sel.appendChild(opt);});
    if(current)sel.value=current;
    fmois=sel.value;
  }
  var collecteeE=EC.filter(function(e){return e.isTVA&&e.tvaCpt==='4431'&&(!fmois||(e.date||'').startsWith(fmois));});
  var deductE=EC.filter(function(e){return e.isTVA&&e.tvaCpt!=='4431'&&(!fmois||(e.date||'').startsWith(fmois));});
  var collectee=collecteeE.reduce(function(a,e){return a+(e.tva||0);},0);
  var deduct=deductE.reduce(function(a,e){return a+(e.tva||0);},0);
  var solde=collectee-deduct;
  var el=function(id){return document.getElementById(id);};
  if(el('tva-collectee'))el('tva-collectee').textContent=fmt(collectee)+' FCFA';
  if(el('tva-collectee-nb'))el('tva-collectee-nb').textContent=collecteeE.length+' écriture(s)';
  if(el('tva-deductible'))el('tva-deductible').textContent=fmt(deduct)+' FCFA';
  if(el('tva-deductible-nb'))el('tva-deductible-nb').textContent=deductE.length+' écriture(s)';
  var box=el('tva-solde-box'),mt=el('tva-solde-mt'),lbl=el('tva-solde-label'),sub=el('tva-solde-sub');
  if(box&&mt&&lbl&&sub){
    if(solde>0){box.style.background='var(--sidebar-bg)';mt.style.color='#ffffff';lbl.textContent='TVA À PAYER';lbl.style.color='rgba(168,164,159,.8)';sub.style.color='rgba(255,255,255,.6)';}
    else if(solde<0){box.style.background='var(--blue-light)';mt.style.color='var(--blue)';lbl.textContent='CRÉDIT TVA À REPORTER';lbl.style.color='var(--blue)';sub.style.color='var(--blue)';}
    else{box.style.background='var(--green-light)';mt.style.color='var(--green)';lbl.textContent='ÉQUILIBRE TVA';lbl.style.color='var(--green-dark)';sub.style.color='var(--green-dark)';}
    mt.textContent=fmt(Math.abs(solde))+' FCFA';
    sub.textContent=solde!==0?'TVA collectée '+fmt(collectee)+' − déductible '+fmt(deduct)+' = '+fmt(Math.abs(solde))+' FCFA':'TVA collectée = TVA déductible';
  }
  // Detail
  var CPT={'4431':'TVA collectée ventes (18%)','4452':'TVA récupérable achats (18%)','4453':'TVA importation (5%)','4454':'TVA transport (8%)','4455':'TVA services ext. (10%)'};
  var byK={};
  EC.filter(function(e){return e.isTVA&&(!fmois||(e.date||'').startsWith(fmois));}).forEach(function(e){
    var k=e.tvaCpt||'4431';if(!byK[k]){byK[k]={tva:0,base:0,n:0};}byK[k].tva+=e.tva||0;byK[k].base+=e.htNet||0;byK[k].n++;
  });
  var h='';Object.keys(byK).sort().forEach(function(cpt){var v=byK[cpt];var isC=cpt==='4431';
    h+='<tr><td><span class="acc">'+cpt+'</span></td><td>'+(CPT[cpt]||cpt)+'</td><td><span class="badge '+(isC?'bg-green':'bg-blue')+'">'+v.n+' op.</span></td><td style="text-align:right;font-family:\'Archivo\',sans-serif">'+fmt(v.base)+' FCFA</td><td style="text-align:right;font-family:\'Archivo\',sans-serif;font-weight:700;color:'+(isC?'var(--green)':'var(--blue)')+'">'+fmt(v.tva)+' FCFA</td><td><span class="badge '+(isC?'bg-green':'bg-blue')+'">'+(isC?'Collectée':'Déductible')+'</span></td></tr>';
  });
  var tb=el('tva-detail-body');if(tb)tb.innerHTML=h||'<tr class="empty-row"><td colspan="6">Aucune TVA</td></tr>';
}

function genererEcritureTVA(){
  var collectee=EC.filter(e=>e.isTVA&&e.tvaCpt==='4431').reduce((a,e)=>a+(e.tva||0),0);
  var deduct=EC.filter(e=>e.isTVA&&e.tvaCpt!=='4431').reduce((a,e)=>a+(e.tva||0),0);
  var solde=collectee-deduct;
  if(!collectee&&!deduct){alert('Aucune TVA à régulariser.');return;}
  var date=new Date().toISOString().split('T')[0];
  var num='TVA-REG-'+date.replace(/-/g,'');
  EC.push({date,dateF:fmtD(date),num,desc:'Régularisation TVA '+date.substring(0,7),cli:'DGI',
    cptD:'4431',cptC:solde>0?'4441':'4452',debit:Math.abs(solde),credit:Math.abs(solde),
    pay:'credit',stat:solde>0?'attente':'payee',ht:0,htNet:0,tva:Math.abs(solde),
    tvaTaux:0,tvaCpt:'4441',tvaType:'regul',tr:0,port:0,ttc:Math.abs(solde),
    avance:0,resteDu:solde>0?Math.abs(solde):0,echeance:'',type:'tva',qty:0,cp:0,
    avoir:false,modeLabel:'REGUL',lettre:'',_modifie:false,isRegulTVA:true});
  sauvegarderAuto();renderAll();renderTVA();
  var r=document.getElementById('tva-regul-result');
  if(r)r.innerHTML='<div class="alert alert-ok" style="display:block">✓ Écriture <strong>'+num+'</strong> générée — D 4431 / C '+(solde>0?'4441':'4452')+' : '+fmt(Math.abs(solde))+' FCFA</div>';
}

function exporterTVAPDF(){
  try{
    var jsPDF_=window.jspdf?window.jspdf.jsPDF:jsPDF;
    var doc=new jsPDF_({orientation:'portrait',unit:'mm',format:'a4'});
    var W=210,M=14,y=20;
    doc.setFillColor(13,31,26);doc.rect(0,0,W,30,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');
    doc.text('Déclaration TVA — ComptaIA v12',M,14);
    doc.setFontSize(9);doc.setFont('helvetica','normal');
    doc.text('Exercice '+EXERCICE.annee+' | '+(document.querySelector('.logo-sub')||{textContent:''}).textContent,M,22);
    doc.setTextColor(0,0,0);y=42;
    var collectee=EC.filter(e=>e.isTVA&&e.tvaCpt==='4431').reduce((a,e)=>a+(e.tva||0),0);
    var deduct=EC.filter(e=>e.isTVA&&e.tvaCpt!=='4431').reduce((a,e)=>a+(e.tva||0),0);
    var solde=collectee-deduct;
    [['TVA Collectée (4431)',fmt(collectee)+' FCFA'],['TVA Déductible (4452/53/54/55)',fmt(deduct)+' FCFA'],['SOLDE TVA',fmt(Math.abs(solde))+' FCFA '+(solde>=0?'(À PAYER)':'(CRÉDIT)')]].forEach(function(r){
      doc.setFontSize(10);doc.text(r[0],M,y);doc.text(r[1],W-M,y,{align:'right'});y+=8;
    });
    doc.save('Declaration_TVA_'+EXERCICE.annee+'.pdf');
  }catch(e){alert('PDF non disponible.');}
}

// ── Rapprochement Bancaire ───────────────────────────
var RELEVE_BANQUE=[],RAPPROCHEMENT={};

function renderRapprochement(){
  var matched=Object.keys(RAPPROCHEMENT).length;
  var unmatched=RELEVE_BANQUE.length-matched;
  var ecartMt=RELEVE_BANQUE.filter(function(r,i){return RAPPROCHEMENT[i]===undefined;}).reduce(function(a,r){return a+r.montant;},0);
  var el=function(id){return document.getElementById(id);};
  if(el('rappr-nb-releve'))el('rappr-nb-releve').textContent=RELEVE_BANQUE.length;
  if(el('rappr-nb-ok'))el('rappr-nb-ok').textContent=matched;
  if(el('rappr-nb-ko'))el('rappr-nb-ko').textContent=unmatched;
  if(el('rappr-ecart'))el('rappr-ecart').textContent=fmt(Math.abs(ecartMt))+' FCFA';
  var hR='';
  RELEVE_BANQUE.forEach(function(r,i){
    var ok=RAPPROCHEMENT[i]!==undefined;var isIn=r.montant>0;
    hR+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:2px solid var(--border);font-size:11.5px;background:'+(ok?'#eaf1ec':'#f5efe2')+'">'+
      '<span style="font-size:12px">'+(ok?'✅':'⏳')+'</span>'+
      '<div style="flex:1"><div style="font-size:11.5px;font-weight:500">'+r.lib+'</div><div style="font-size:10px;color:var(--text-muted)">'+r.date+'</div></div>'+
      '<div style="font-size:12px;font-weight:700;font-family:\'Archivo\',sans-serif;color:'+(isIn?'var(--green)':'var(--red)')+'">'+( isIn?'+':'-')+fmt(Math.abs(r.montant))+' FCFA</div></div>';
  });
  var rl=el('rappr-releve-list');
  if(rl)rl.innerHTML=hR||'<div style="text-align:center;color:var(--text-faint);padding:28px;font-style:italic">Aucun relevé importé</div>';
  var banqueEC=EC.filter(e=>e.pay==='banque'&&!e.isTVA);
  var matchedIdxs=Object.values(RAPPROCHEMENT);
  var hC='';
  banqueEC.forEach(function(e,i){
    var ok=matchedIdxs.includes(i);var isIn=e.type==='vente'||e.type==='service';
    hC+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:2px solid var(--border);font-size:11.5px;background:'+(ok?'#eaf1ec':'')+'">'+
      '<span style="font-size:12px">'+(ok?'✅':'⬜')+'</span>'+
      '<div style="flex:1"><div style="font-size:11.5px;font-weight:500">'+e.desc+'</div><div style="font-size:10px;color:var(--text-muted)">'+e.num+' | '+e.dateF+'</div></div>'+
      '<div style="font-size:12px;font-weight:700;font-family:\'Archivo\',sans-serif;color:'+(isIn?'var(--green)':'var(--red)')+'">'+( isIn?'+':'-')+fmt(e.ttc)+' FCFA</div></div>';
  });
  var cl=el('rappr-compta-list');
  if(cl)cl.innerHTML=hC||'<div style="text-align:center;color:var(--text-faint);padding:28px;font-style:italic">Aucune écriture banque</div>';
  var rt=el('rappr-releve-total');if(rt)rt.textContent='Total: '+fmt(RELEVE_BANQUE.reduce(function(a,r){return a+r.montant;},0))+' FCFA';
  var ct=el('rappr-compta-total');if(ct)ct.textContent=banqueEC.length+' écriture(s) banque';
}

function importerReleve(ev){
  var file=ev.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    var lines=e.target.result.split('\n').filter(l=>l.trim());
    RELEVE_BANQUE=[];
    lines.slice(1).forEach(function(line){
      var cols=line.split(/[,;|\t]/);if(cols.length<3)return;
      var dateRaw=(cols[0]||'').trim(),lib=(cols[1]||'').trim();
      var debit=parseFloat((cols[2]||'0').replace(/[^\d.-]/g,''))||0;
      var credit=parseFloat((cols[3]||'0').replace(/[^\d.-]/g,''))||0;
      if(!lib&&!debit&&!credit)return;
      RELEVE_BANQUE.push({date:dateRaw,lib,debit,credit,montant:credit-debit});
    });
    RAPPROCHEMENT={};renderRapprochement();
    alert('✓ '+RELEVE_BANQUE.length+' lignes importées. Cliquez "Auto-rapprocher".');
  };
  reader.readAsText(file);ev.target.value='';
}

function rapprAuto(){
  if(!RELEVE_BANQUE.length){alert('Importez d\'abord un relevé CSV.');return;}
  RAPPROCHEMENT={};
  var banqueEC=EC.filter(e=>e.pay==='banque'&&!e.isTVA);
  var used={};
  RELEVE_BANQUE.forEach(function(rel,ri){
    banqueEC.forEach(function(e,ei){
      if(RAPPROCHEMENT[ri]!==undefined||used[ei])return;
      var ecMt=(e.type==='vente'||e.type==='service')?e.ttc:-e.ttc;
      if(Math.abs(rel.montant-ecMt)<2){RAPPROCHEMENT[ri]=ei;used[ei]=true;}
    });
  });
  renderRapprochement();
  alert('✓ '+Object.keys(RAPPROCHEMENT).length+' ligne(s) rapprochées sur '+RELEVE_BANQUE.length+'.');
}

// ── Dashboard Chart.js ────────────────────────────────
var dashChartCA=null,dashChartCF=null;

function renderDashboard(){
  var tPr=0,tCh=0;
  EC.concat(REGL).forEach(function(e){
    if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA)tPr+=e.credit;
    if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA)tCh+=e.debit;
  });
  var res=tPr-tCh;
  var att=EC.filter(e=>e.stat==='attente'&&!e.isTVA&&!e.isAvance);
  var attMt=att.reduce((a,e)=>a+e.ttc,0);
  var sc=typeof getSoldeCalcule==='function'?getSoldeCalcule():{caisse:0,banque:0};
  var treso=(sc.caisse||0)+(sc.banque||0);
  var marge=tPr>0?Math.round(res/tPr*100):0;
  // KPIs
  var kpiEl=document.getElementById('dash-kpis');
  if(kpiEl){
    kpiEl.innerHTML=[
      {l:'Chiffre d\'affaires',v:fmt(tPr)+' FCFA',s:'Exercice '+EXERCICE.annee,c:'green'},
      {l:'Résultat net',v:fmt(Math.abs(res))+' FCFA',s:res>=0?'✓ Bénéfice':'⚠ Déficit',c:res>=0?'green':'red'},
      {l:'Trésorerie',v:fmt(treso)+' FCFA',s:'Caisse + Banque',c:treso>0?'blue':'red'},
      {l:'Impayés',v:fmt(attMt)+' FCFA',s:att.length+' facture(s)',c:'amber'},
      {l:'Marge nette',v:marge+'%',s:marge>10?'✓ Bonne':'Attention',c:marge>10?'green':marge>0?'amber':'red'},
      {l:'Charges',v:fmt(tCh)+' FCFA',s:'Total classe 6',c:'red'},
      {l:'Écritures',v:EC.length,s:'Journal',c:'blue'},
      {l:'Tiers',v:TIERS.length,s:'Clients & Fournisseurs',c:'purple'}
    ].map(function(k){return'<div class="dash-insight '+k.c+'"><div class="kpi-label">'+k.l+'</div><div class="kpi-value" style="font-size:18px;font-family:\'Archivo\',sans-serif;font-weight:700">'+k.v+'</div><div class="kpi-sub">'+k.s+'</div></div>';}).join('');
  }
  // Graphiques mensuels
  var caByM={},chByM={};
  EC.forEach(function(e){
    if(!e.date)return;var m=e.date.substring(0,7);
    if(!caByM[m]){caByM[m]=0;chByM[m]=0;}
    if((e.type==='vente'||e.type==='service')&&!e.isTVA&&!e.avoir)caByM[m]+=(e.htNet||e.ht||0);
    if(e.type==='achat'&&!e.isTVA)chByM[m]+=(e.htNet||e.ht||0);
  });
  var months=Object.keys(caByM).sort();
  var labels=months.map(function(m){var p=m.split('-');return p[1]+'/'+p[0];});
  var caVals=months.map(m=>caByM[m]),chVals=months.map(m=>chByM[m]);
  var canCA=document.getElementById('dash-chart-ca');
  if(canCA&&typeof Chart!=='undefined'){
    if(dashChartCA){dashChartCA.destroy();dashChartCA=null;}
    if(months.length>0){
      dashChartCA=new Chart(canCA,{type:'bar',data:{labels,datasets:[
        {label:'CA (HT)',data:caVals,backgroundColor:'rgba(var(--accent-rgb),.75)',borderColor:'var(--accent)',borderWidth:1,borderRadius:4},
        {label:'Charges',data:chVals,backgroundColor:'rgba(226,75,74,.5)',borderColor:'#E24B4A',borderWidth:1,borderRadius:4}
      ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:12,font:{size:10}}}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return (v/1000)+'k';}}}}}});
    }
  }
  // Cash flow cumulé
  var canCF=document.getElementById('dash-chart-cf');
  if(canCF&&typeof Chart!=='undefined'&&months.length>0){
    if(dashChartCF){dashChartCF.destroy();dashChartCF=null;}
    var cum=0,cfVals=months.map(function(m){cum+=caByM[m]-chByM[m];return cum;});
    dashChartCF=new Chart(canCF,{type:'line',data:{labels,datasets:[{label:'Cash flow cumulé',data:cfVals,borderColor:'#33506d',backgroundColor:'rgba(24,95,165,.1)',fill:true,tension:.3,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:12,font:{size:10}}}},scales:{y:{ticks:{callback:function(v){return (v/1000)+'k';}}}}}});
  }
  // Top clients
  var byC={};EC.filter(e=>(e.type==='vente'||e.type==='service')&&!e.isTVA&&!e.avoir).forEach(function(e){if(!byC[e.cli])byC[e.cli]=0;byC[e.cli]+=(e.htNet||e.ht||0);});
  var top=Object.entries(byC).sort((a,b)=>b[1]-a[1]).slice(0,5);
  var tcEl=document.getElementById('dash-top-clients');
  if(tcEl){
    if(!top.length){tcEl.innerHTML='<div style="text-align:center;color:var(--text-faint);padding:16px;font-style:italic">Aucune vente</div>';}
    else{var maxV=top[0][1];tcEl.innerHTML=top.map(function(tc){var pct=Math.round(tc[1]/maxV*100);return'<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12px;font-weight:600">'+tc[0]+'</span><span style="font-size:11px;font-family:\'Archivo\',sans-serif;font-weight:700;color:var(--green)">'+fmt(tc[1])+' FCFA</span></div><div style="height:8px;background:var(--bg);border-radius:var(--radius);overflow:hidden;border:2px solid var(--border)"><div style="height:100%;width:'+pct+'%;background:var(--green);border-radius:var(--radius)"></div></div></div>';}).join('');}
  }
}

// ── Facture PDF Professionnelle ───────────────────────
function genererFacturePDF(idx){
  try{
    var e=EC[idx];if(!e){alert('Facture introuvable.');return;}
    var jsPDF_=window.jspdf?window.jspdf.jsPDF:jsPDF;
    var doc=new jsPDF_({orientation:'portrait',unit:'mm',format:'a4'});
    var W=210,M=14;
    doc.setFillColor(13,31,26);doc.rect(0,0,W,38,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(22);doc.setFont('helvetica','bold');
    doc.text('ComptaIA',M,15);
    var company=(document.querySelector('.logo-sub')||{textContent:'Mon Entreprise SARL'}).textContent;
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(168,201,191);
    doc.text(company,M,21);doc.text('OHADA — Togo',M,27);
    doc.setTextColor(255,255,255);doc.setFontSize(18);doc.setFont('helvetica','bold');
    doc.text(e.avoir?'FACTURE AVOIR':'FACTURE',W-M,15,{align:'right'});
    doc.setFontSize(10);doc.setFont('helvetica','normal');doc.setTextColor(168,201,191);
    doc.text('N° '+e.num,W-M,22,{align:'right'});doc.text('Date : '+e.dateF,W-M,28,{align:'right'});
    doc.setTextColor(0,0,0);var y=50;
    // Client block
    doc.setFillColor(247,247,245);doc.rect(M,y-5,85,28,'F');
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(107,114,128);doc.text('FACTURÉ À',M+3,y);
    doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(26,26,26);doc.text(e.cli||'—',M+3,y+7);
    var tiers=TIERS.find(t=>t.nom===e.cli)||{};
    if(tiers.adresse){doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(107,114,128);doc.text(tiers.adresse,M+3,y+13);}
    if(tiers.email){doc.setFontSize(9);doc.text(tiers.email,M+3,y+19);}
    doc.setTextColor(0,0,0);y+=38;
    // Table header
    doc.setFillColor(13,31,26);doc.rect(M,y,W-2*M,8,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(8);doc.setFont('helvetica','bold');
    doc.text('Désignation',M+3,y+5.5);doc.text('Qté',M+108,y+5.5,{align:'right'});doc.text('HT',M+130,y+5.5,{align:'right'});doc.text('TVA',M+155,y+5.5,{align:'right'});doc.text('TTC',W-M,y+5.5,{align:'right'});
    y+=9;doc.setTextColor(0,0,0);doc.setFillColor(247,247,245);doc.rect(M,y,W-2*M,10,'F');
    doc.setFontSize(9);doc.setFont('helvetica','normal');
    doc.text((e.desc||'').substring(0,55),M+3,y+6.5);doc.text(String(e.qty||1),M+108,y+6.5,{align:'right'});
    doc.text(fmt(e.ht)+' FCFA',M+130,y+6.5,{align:'right'});doc.text(fmt(e.tva)+' FCFA',M+155,y+6.5,{align:'right'});doc.text(fmt(e.ttc)+' FCFA',W-M,y+6.5,{align:'right'});
    y+=16;doc.setDrawColor(229,231,235);doc.line(M,y,W-M,y);y+=6;
    var totals=[['Net HT',fmt(e.htNet||e.ht)+' FCFA']];
    if(e.tvaTaux>0)totals.push(['TVA '+e.tvaTaux+'% ('+e.tvaCpt+')',fmt(e.tva)+' FCFA']);
    if(e.tr>0)totals.push(['Transport',fmt(e.tr)+' FCFA']);
    if(e.escVal>0)totals.push(['Escompte -'+e.escPct+'%','−'+fmt(e.escVal)+' FCFA']);
    if(e.avance>0)totals.push(['Avance reçue','−'+fmt(e.avance)+' FCFA']);
    totals.forEach(function(r){doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(107,114,128);doc.text(r[0],W-M-75,y);doc.text(r[1],W-M,y,{align:'right'});y+=6;});
    y+=2;doc.setFillColor(13,31,26);doc.rect(W-M-90,y-5,90,14,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text('TOTAL TTC',W-M-87,y+2);doc.setFontSize(13);doc.text(fmt(e.ttc)+' FCFA',W-M,y+4,{align:'right'});
    if(e.resteDu>0&&e.resteDu!==e.ttc){y+=10;doc.setTextColor(226,75,74);doc.setFontSize(10);doc.text('Reste dû : '+fmt(e.resteDu)+' FCFA',W-M,y,{align:'right'});}
    doc.setTextColor(0,0,0);y+=22;
    doc.setFillColor(247,247,245);doc.rect(M,y,W-2*M,18,'F');
    doc.setFontSize(7.5);doc.setFont('helvetica','italic');doc.setTextColor(107,114,128);
    doc.text('Mode de paiement : '+(e.pay==='espece'?'Espèces':e.pay==='banque'?'Virement bancaire':'À crédit'),M+3,y+5);
    doc.text('TVA : '+(e.tvaTaux>0?'Assujetti — Compte '+e.tvaCpt:'Exonéré'),M+3,y+10);
    doc.text('Document généré par ComptaIA v12 — OHADA | '+new Date().toLocaleString('fr-FR'),W/2,y+16,{align:'center'});
    doc.save('Facture_'+e.num+'_'+new Date().toISOString().split('T')[0]+'.pdf');
  }catch(e2){alert('Erreur PDF: '+e2.message);}
}

// ── Alertes intelligentes ────────────────────────────
var ALERT_CONFIG2=(function(){try{return JSON.parse(localStorage.getItem('comptaia_alerts')||'{"retard":30,"treso_min":500000}');}catch(e){return {retard:30,treso_min:500000};}})();

function verifierAlertes(){
  var today=new Date();
  var retard=EC.filter(function(e){
    if(e.stat!=='attente')return false;
    var d=new Date(e.echeance||e.date);
    return(today-d)/(864e5)>(ALERT_CONFIG2.retard||30);
  });
  if(retard.length>0)try{ajouterNotif('retard','⚠️ '+retard.length+' facture(s) en retard de +'+(ALERT_CONFIG2.retard||30)+' jours',retard.map(e=>e.num+' ('+e.cli+')').join(' · '));}catch(e){}
  if(typeof getSoldeCalcule==='function'){
    var s=getSoldeCalcule();var t=(s.caisse||0)+(s.banque||0);
    if(t<(ALERT_CONFIG2.treso_min||500000))try{ajouterNotif('alerte','🚨 Trésorerie basse : '+fmt(t)+' FCFA','Seuil d\'alerte : '+fmt(ALERT_CONFIG2.treso_min||500000)+' FCFA');}catch(e){}
  }
}

// ── Navigation unifiée v12 ──────────────────────────
(function(){
  var unifiedGo=function(id,el){
    document.querySelectorAll('.pane').forEach(function(p){p.classList.remove('active');});
    document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
    var pane=document.getElementById('pane-'+id);
    if(pane)pane.classList.add('active');
    if(el)el.classList.add('active');
    var T={facture:'📄 Facture',tiers:'👥 Clients / Fournisseurs',journal:'📒 Journal',grandlivre:'📚 Grand livre',lettrage:'🔗 Lettrage',bilan:'⚖️ Bilan',resultats:'📈 Compte de résultats',balance:'🔢 Balance',solde:'💰 Trésorerie',analyse:'🔍 Analyse comptable',stock:'📦 Stock',suivi:'📊 Suivi',exercice:'📅 Exercice fiscal',notifs:'🔔 Alertes',immo:'🏗️ Immobilisations',tva:'🧾 Déclaration TVA',rapprochement:'🏦 Rapprochement bancaire',dashboard:'🎛️ Dashboard IA',scoring:'⭐ Score financier',ocr:'📷 Saisie photo',fraude:'🛡️ Anomalies',multiEntreprise:'🏢 Multi-entreprises',benchmarks:'📐 Benchmarks',prevision:'🔮 Prévisions IA'};
    var titleEl=document.getElementById('page-title');if(titleEl)titleEl.textContent=T[id]||id;
    currentPage=id;
    if(id==='solde')renderSolde();
    if(id==='analyse')renderAnalyse();
    if(id==='lettrage')renderLettrage();
    if(id==='exercice'){renderExercice();renderSalaires();renderDedExtras();calcImpot();}
    if(id==='immo')try{renderImmo();}catch(e){}
    if(id==='tva')renderTVA();
    if(id==='rapprochement')renderRapprochement();
    if(id==='dashboard')renderDashboard();
    if(id==='scoring')try{renderScoring();}catch(e){}
    if(id==='fraude')try{lancerDetection();}catch(e){}
    if(id==='multiEntreprise')try{renderMultiEntreprise();}catch(e){}
    if(id==='benchmarks')try{renderBenchmarks();}catch(e){}
    if(id==='prevision')renderJournal();
  };
  window.go=unifiedGo;
})();

// ── Init v12 ─────────────────────────────────────────
window.addEventListener('load',function(){
  document.title='ComptaIA v12 — OHADA Togo';
  var footer=document.getElementById('sidebar-footer');if(footer)footer.textContent='ComptaIA v12 — OHADA Togo';
  // Show auth overlay
  var overlay=document.getElementById('auth-overlay');
  if(overlay)overlay.style.display='flex';
  // Decide login vs first-run admin setup, then check for a session — but
  // always re-check the account is still active against the live user list
  // rather than trusting the stored session snapshot (an admin may have
  // disabled/deleted the account since it was saved).
  authBootstrap();
  try{
    var s=sessionStorage.getItem('comptaia_session');
    if(s){
      var savedUser=JSON.parse(s);
      var fresh=getUsers().find(function(x){return x.username===savedUser.username;});
      if(fresh&&fresh.active!==false){CURRENT_USER=fresh;onAuthSuccess();}
      else{sessionStorage.removeItem('comptaia_session');}
    }
  }catch(e){}
  // Add pagination div to journal
  setTimeout(function(){
    var jTable=document.querySelector('#pane-journal .card');
    if(jTable&&!document.getElementById('j-pagination')){
      var pDiv=document.createElement('div');
      pDiv.id='j-pagination';pDiv.style.cssText='display:flex;align-items:center;gap:6px;justify-content:center;padding:10px 0;flex-wrap:wrap';
      jTable.appendChild(pDiv);
    }
    // Add cash flow canvas to dashboard
    var dashCA=document.getElementById('dash-chart-ca');
    if(dashCA&&!document.getElementById('dash-chart-cf')){
      var cfDiv=document.createElement('div');
      cfDiv.style.cssText='position:relative;height:140px;margin-top:12px';
      cfDiv.innerHTML='<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:3px">Cash Flow Cumulé</div><canvas id="dash-chart-cf"></canvas>';
      dashCA.parentNode.appendChild(cfDiv);
    }
    // Add top clients to dashboard
    if(!document.getElementById('dash-top-clients')){
      var dashPane=document.getElementById('pane-dashboard');
      if(dashPane){
        var tcDiv=document.createElement('div');
        tcDiv.className='card';tcDiv.style.marginTop='14px';
        tcDiv.innerHTML='<div class="card-header"><span class="card-title">🏆 Top 5 Clients par CA</span></div><div class="card-body" id="dash-top-clients" style="padding:12px"><div style="text-align:center;color:var(--text-faint);font-style:italic">—</div></div>';
        dashPane.appendChild(tcDiv);
      }
    }
  },300);
});
