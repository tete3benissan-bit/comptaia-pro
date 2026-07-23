// Immobilisations, Bilan OHADA v9 fix, PDF export, Assistant IA chat - extracted from ComptaIA_Pro_original.html lines 2514-2834
// ═══ IMMOBILISATIONS ═══
var IMMOS=[];
var IM_CAT={'21':'281','22':'282','23':'283','24':'284','245':'2845','25':'285','26':'286'};
var IM_NOMS={'21':'Immob. incorporelles','22':'Terrains','23':'Bâtiments','24':'Matériel outillage','245':'Matériel transport','25':'Mobilier','26':'Matériel informatique'};

// Enrichir le dictionnaire de comptes
Object.assign(NOMS,{
  '101':'Capital social','106':'Réserves','110':'Report à nouveau créditeur','119':'Report à nouveau débiteur',
  '12':'Résultat net exercice','1301':'Résultat bénéfice','1302':'Résultat déficit',
  '16':'Dettes financières','164':'Emprunts bancaires',
  '21':'Immob. incorporelles','23':'Bâtiments','24':'Matériel outillage',
  '245':'Matériel transport','25':'Mobilier','26':'Matériel informatique',
  '281':'Amort. immob. incorp.','283':'Amort. bâtiments','284':'Amort. matériel',
  '285':'Amort. mobilier','286':'Amort. mat. info',
  '31':'Stocks marchandises','6813':'Dotations amortissements',
  '8951':'IS sur bénéfices','4471':'État IS à payer'
});

function calcAmort(){
  var v=parseFloat(document.getElementById('im-valeur').value)||0;
  var d=parseFloat(document.getElementById('im-duree').value)||5;
  document.getElementById('im-dotation').value=v?Math.round(v/d).toLocaleString('fr-FR')+' FCFA/an':'';
  document.getElementById('im-vnc').value=v?v.toLocaleString('fr-FR')+' FCFA':'';
}

function ajouterImmo(){
  var nom=document.getElementById('im-nom').value.trim();
  var cat=document.getElementById('im-cat').value;
  var date=document.getElementById('im-date').value;
  var valeur=parseFloat(document.getElementById('im-valeur').value)||0;
  var duree=parseInt(document.getElementById('im-duree').value)||5;
  if(!nom||!valeur||!date){alert('Nom, valeur et date requis.');return;}
  IMMOS.push({nom,cat,catNom:IM_NOMS[cat]||'Immobilisation',date,valeur,duree,dotAnnuelle:Math.round(valeur/duree),anneeDebut:parseInt(date.split('-')[0]),dotationsGenerees:[],vnc:valeur});
  ajouterNotif('modif','Immo. ajoutée : '+nom,Math.round(valeur/duree).toLocaleString('fr-FR')+' FCFA/an — '+duree+' ans');
  document.getElementById('im-nom').value='';document.getElementById('im-valeur').value='';document.getElementById('im-duree').value='5';document.getElementById('im-dotation').value='';document.getElementById('im-vnc').value='';
  renderImmo();try{renderBilan();}catch(e){}sauvegarderAuto();
}

function genererDotations(){
  if(!IMMOS.length){alert('Aucune immobilisation.');return;}
  var annee=EXERCICE.annee,dateF='31/12/'+annee,date=annee+'-12-31',total=0,count=0;
  IMMOS.forEach((im,i)=>{
    if(im.dotationsGenerees.includes(annee)||im.vnc<=0)return;
    var dot=Math.min(im.dotAnnuelle,im.vnc);
    if(dot<=0)return;
    var cptA=IM_CAT[im.cat]||'284';
    IMMOS[i].vnc=Math.max(0,im.vnc-dot);
    IMMOS[i].dotationsGenerees.push(annee);
    EC.push({date,dateF,num:'AMORT-'+annee+'-'+String(i+1).padStart(2,'0'),desc:'Dotation amort. '+annee+' — '+im.nom,cli:'',cptD:'6813',cptC:cptA,debit:dot,credit:dot,pay:'credit',stat:'payee',ht:dot,htNet:dot,escVal:0,escPct:0,rrr:0,tva:0,tvaTaux:0,tvaCpt:'',tvaType:'',tr:0,port:0,ttc:dot,avance:0,resteDu:0,echeance:'',type:'amort',qty:0,cp:0,coutReel:0,avoir:false,modeLabel:'DOIT',lettre:'',_modifie:false,isAmort:true});
    total+=dot;count++;
  });
  if(!count){alert('Toutes les dotations '+annee+' déjà générées.');return;}
  ajouterNotif('save','Dotations '+annee+' : '+count+' bien(s)','Total : '+total.toLocaleString('fr-FR')+' FCFA — D 6813 / C 28xx');
  renderImmo();renderAll();sauvegarderAuto();
  alert(count+' dotation(s) — Total : '+total.toLocaleString('fr-FR')+' FCFA\nÉcriture : D 6813 / C 28xx');
}

function renderImmo(){
  var w=document.getElementById('immo-table-wrap');if(!w)return;
  if(!IMMOS.length){w.innerHTML='<div style="text-align:center;color:var(--text-faint);padding:28px;font-style:italic">Aucune immobilisation</div>';return;}
  var annee=EXERCICE.annee,h='<div class="table-wrap"><table><thead><tr><th>Désignation</th><th>Catégorie</th><th>Date acq.</th><th style="text-align:right">Val. brute</th><th>Durée</th><th style="text-align:right">Dot./an</th><th style="text-align:right">Amort. cum.</th><th style="text-align:right">VNC</th><th style="text-align:center">'+annee+'</th><th></th></tr></thead><tbody>';
  var tV=0,tA=0,tVnc=0;
  IMMOS.forEach((im,i)=>{
    var a=im.valeur-im.vnc,p=im.valeur>0?Math.round(a/im.valeur*100):0,done=im.dotationsGenerees.includes(annee);
    tV+=im.valeur;tA+=a;tVnc+=im.vnc;
    h+=`<tr><td style="font-weight:600">${im.nom}</td><td><span class="acc">${im.cat}</span> ${im.catNom}</td><td style="font-size:10.5px">${im.date?im.date.split('-').reverse().join('/'):'—'}</td><td style="text-align:right;font-family:'Archivo',sans-serif">${im.valeur.toLocaleString('fr-FR')}</td><td>${im.duree}ans</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--amber)">${im.dotAnnuelle.toLocaleString('fr-FR')}</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--red)">${a.toLocaleString('fr-FR')}<div style="height:3px;background:var(--red-light);border-radius:var(--radius);margin-top:2px"><div style="width:${p}%;height:100%;background:var(--red);border-radius:var(--radius)"></div></div></td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:600;color:${im.vnc<=0?'var(--text-faint)':'var(--blue)'}">${im.vnc.toLocaleString('fr-FR')}</td><td style="text-align:center">${done?'<span class="badge bg-green">'+ico('check')+' Dotée</span>':im.vnc<=0?'<span class="badge" style="background:var(--bg);color:var(--text-faint)">Amortie</span>':'<span class="badge bg-amber">En attente</span>'}</td><td><button onclick="supprimerImmo(${i})" style="font-size:10px;padding:2px 6px;border-radius:var(--radius);cursor:pointer;border:2px solid var(--red-border);background:var(--red-light);color:var(--red)">${ico('close')}</button></td></tr>`;
  });
  h+=`</tbody><tfoot><tr style="background:var(--green-light);font-weight:700;color:var(--green-dark)"><td colspan="3">TOTAUX</td><td style="text-align:right;font-family:'Archivo',sans-serif">${tV.toLocaleString('fr-FR')}</td><td></td><td></td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--red)">${tA.toLocaleString('fr-FR')}</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--blue)">${tVnc.toLocaleString('fr-FR')}</td><td colspan="2"></td></tr></tfoot></table></div>`;
  w.innerHTML=h;
}

function supprimerImmo(i){if(!confirm('Supprimer ?'))return;IMMOS.splice(i,1);renderImmo();try{renderBilan();}catch(e){}sauvegarderAuto();}

// ═══ BILAN OHADA V9 CORRIGÉ ═══
function renderBilanV9(){
  var cpts={};
  EC.concat(REGL).forEach(e=>{
    if(e.cptD){if(!cpts[e.cptD])cpts[e.cptD]={d:0,cr:0};cpts[e.cptD].d+=(e.debit||0);}
    if(e.cptC){if(!cpts[e.cptC])cpts[e.cptC]={d:0,cr:0};cpts[e.cptC].cr+=(e.credit||0);}
  });
  var sD=function(c){var x=cpts[c];return x?Math.max(0,x.d-x.cr):0;};
  var sC=function(c){var x=cpts[c];return x?Math.max(0,x.cr-x.d):0;};
  var totPr=0,totCh=0;
  EC.concat(REGL).forEach(e=>{if(e.cptC&&e.cptC.startsWith('7')&&!e.isTVA)totPr+=e.credit;if(e.cptD&&e.cptD.startsWith('6')&&!e.isTVA)totCh+=e.debit;});
  var resultat=totPr-totCh;

  var vnc=IMMOS.reduce(function(a,i){return a+i.vnc;},0);
  var stocks=sD('3111')||sD('31');
  var clients=sD('4111');
  var tvaRecup=sD('4452')+sD('4454')+sD('4453')+sD('4455');
  var avF=sD('4091');
  var caisse=sD('571');if(SOLDES.caisseDefini)caisse=Math.max(caisse,SOLDES.caisse);
  var banque=sD('521');if(SOLDES.banqueDefini)banque=Math.max(banque,SOLDES.banque);
  var tActifImmo=vnc;
  var tActifCirc=stocks+clients+tvaRecup+avF+caisse+banque;
  var tActif=tActifImmo+tActifCirc;

  var capital=sC('101')||sC('10');
  var reserves=sC('106');
  var rapAN=sC('110')-sD('119');
  var dettesF=sC('16')||sC('164');
  var fournisseurs=sC('401');
  var tvaC=sC('4431');
  var isAP=sC('4471');
  var avC=sC('419');
  var tCapitaux=capital+reserves+(rapAN>0?rapAN:0)+(resultat>0?resultat:0);
  var tPassifLT=dettesF;
  var tPassifCT=fournisseurs+tvaC+isAP+avC+(rapAN<0?Math.abs(rapAN):0)+(resultat<0?Math.abs(resultat):0);
  var tPassif=tCapitaux+tPassifLT+tPassifCT;

  function R(cpt,lib,v,clr){if(v<=0)return'';return`<tr><td><span class="acc">${cpt}</span></td><td style="font-size:11px">${lib}</td><td style="text-align:right;font-family:'Archivo',sans-serif${clr?';color:'+clr:''}">${Math.round(v).toLocaleString('fr-FR')}</td></tr>`;}
  function S(t,bg,fg){return`<tr style="background:${bg}"><td colspan="3" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:4px 10px;color:${fg}">${t}</td></tr>`;}
  function T(lib,v,bg,fg){return`<tr style="background:${bg}"><td colspan="2" style="font-size:10px;font-weight:700;padding:4px 10px;color:${fg}">${lib}</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:700;color:${fg};padding:4px 10px">${Math.round(v).toLocaleString('fr-FR')}</td></tr>`;}

  var actifHTML=`<table width="100%" style="border-collapse:collapse;font-size:11.5px">
    <thead><tr><th style="background:var(--bg);padding:5px 10px;font-size:10px;font-weight:700;color:var(--text-muted);width:12%">N° Cpt</th><th style="background:var(--bg);padding:5px 10px;font-size:10px;font-weight:700;color:var(--text-muted)">Intitulé</th><th style="text-align:right;background:var(--bg);padding:5px 10px;font-size:10px;font-weight:700;color:var(--text-muted)">Montant FCFA</th></tr></thead>
    <tbody>
    ${S('Actif immobilisé','var(--sidebar-bg)','#9FE1CB')}
    ${vnc>0?`<tr><td><span class="acc">2x</span></td><td style="font-size:11px">Immobilisations nettes (${IMMOS.length} bien(s))</td><td style="text-align:right;font-family:'Archivo',sans-serif">${Math.round(vnc).toLocaleString('fr-FR')}</td></tr>`:''}
    ${T('Total actif immobilisé',tActifImmo,'#E6F1FB','#33506d')}
    ${S('Actif circulant','#33506d','#fff')}
    ${R('31','Stocks marchandises',stocks)}
    ${R('4111','Clients',clients)}
    ${R('44x','TVA récupérable',tvaRecup,'var(--teal)')}
    ${R('4091','Avances fournisseurs',avF)}
    ${R('571','Caisse',caisse,'var(--amber)')}
    ${R('521','Banque',banque,'var(--blue)')}
    ${T('Total actif circulant',tActifCirc,'#E6F1FB','#33506d')}
    <tr style="background:var(--sidebar-bg)"><td colspan="2" style="font-size:11px;font-weight:700;padding:6px 10px;color:#fff">TOTAL ACTIF</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:700;color:#fff;padding:6px 10px;font-size:13px">${Math.round(tActif).toLocaleString('fr-FR')}</td></tr>
    </tbody></table>`;

  var passifHTML=`<table width="100%" style="border-collapse:collapse;font-size:11.5px">
    <thead><tr><th style="background:var(--bg);padding:5px 10px;font-size:10px;font-weight:700;color:var(--text-muted);width:12%">N° Cpt</th><th style="background:var(--bg);padding:5px 10px;font-size:10px;font-weight:700;color:var(--text-muted)">Intitulé</th><th style="text-align:right;background:var(--bg);padding:5px 10px;font-size:10px;font-weight:700;color:var(--text-muted)">Montant FCFA</th></tr></thead>
    <tbody>
    ${S('Capitaux propres','var(--sidebar-bg)','#9FE1CB')}
    ${R('101','Capital social',capital)}
    ${R('106','Réserves',reserves)}
    ${rapAN>0?R('110','Report à nouveau créditeur',rapAN,'var(--green)'):''}
    ${rapAN<0?`<tr><td><span class="acc">119</span></td><td style="font-size:11px">Report à nouveau débiteur</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--red)">−${Math.round(Math.abs(rapAN)).toLocaleString('fr-FR')}</td></tr>`:''}
    ${resultat>0?R('12','Résultat net (bénéfice)',resultat,'var(--green)'):''}
    ${resultat<0?`<tr><td><span class="acc">12</span></td><td style="font-size:11px">Résultat (déficit)</td><td style="text-align:right;font-family:'Archivo',sans-serif;color:var(--red)">−${Math.round(Math.abs(resultat)).toLocaleString('fr-FR')}</td></tr>`:''}
    ${T('Total capitaux propres',tCapitaux,'#E1F5EE','#085041')}
    ${S('Dettes financières (LT)','#854F0B','#fff')}
    ${R('16','Emprunts & dettes financières',dettesF)}
    ${T('Total dettes LT',tPassifLT,'#FAEEDA','#BA7517')}
    ${S('Dettes à court terme','#A32D2D','#fff')}
    ${R('401','Fournisseurs',fournisseurs)}
    ${R('4431','TVA collectée',tvaC,'var(--teal)')}
    ${R('4471','IS à payer',isAP,'var(--amber)')}
    ${R('419','Avances reçues clients',avC)}
    ${T('Total dettes CT',tPassifCT,'#FCEBEB','#A32D2D')}
    <tr style="background:var(--sidebar-bg)"><td colspan="2" style="font-size:11px;font-weight:700;padding:6px 10px;color:#fff">TOTAL PASSIF</td><td style="text-align:right;font-family:'Archivo',sans-serif;font-weight:700;color:#fff;padding:6px 10px;font-size:13px">${Math.round(tPassif).toLocaleString('fr-FR')}</td></tr>
    </tbody></table>`;

  var actifWrap=document.querySelector('.bilan-actif .bilan-table');
  var passifWrap=document.querySelector('.bilan-passif .bilan-table');
  if(actifWrap)actifWrap.innerHTML=actifHTML;
  if(passifWrap)passifWrap.innerHTML=passifHTML;
  try{document.getElementById('b-ta').textContent=Math.round(tActif).toLocaleString('fr-FR')+' FCFA';}catch(e){}
  try{document.getElementById('b-tp').textContent=Math.round(tPassif).toLocaleString('fr-FR')+' FCFA';}catch(e){}
  var eq=document.getElementById('b-eq');if(eq){eq.style.display='block';
  var diff=Math.abs(tActif-tPassif);
  if(diff<100){eq.style.cssText='display:block;margin-top:10px;padding:9px 14px;border-radius:var(--radius);font-size:12px;font-weight:600;text-align:center;background:var(--green-light);color:var(--green-dark);border:2px solid var(--green-border)';eq.innerHTML=ico('check')+' Bilan OHADA équilibré — '+Math.round(tActif).toLocaleString('fr-FR')+' FCFA<br><span style="font-size:10px;font-weight:400">Actif immobilisé : '+Math.round(tActifImmo).toLocaleString('fr-FR')+' | Actif circulant : '+Math.round(tActifCirc).toLocaleString('fr-FR')+'</span>';}
  else{eq.style.cssText='display:block;margin-top:10px;padding:9px 14px;border-radius:var(--radius);font-size:12px;font-weight:600;text-align:center;background:var(--amber-light);color:var(--amber);border:2px solid var(--amber-border)';eq.innerHTML=ico('alertTriangle')+' Écart de '+Math.round(diff).toLocaleString('fr-FR')+' FCFA — Vérifiez capital social (cpt 101) et dettes (cpt 16)<br><span style="font-size:10px;font-weight:400">Actif : '+Math.round(tActif).toLocaleString('fr-FR')+' / Passif : '+Math.round(tPassif).toLocaleString('fr-FR')+'</span>';}}
}

// Hook renderBilan pour appeler la V9
var _renderBilanOrig=renderBilan;
renderBilan=renderBilanV9;

// ═══ PDF PROFESSIONNEL ═══
function exporterPDF(){
  var menu=document.createElement('div');
  menu.style.cssText='position:fixed;top:56px;right:16px;background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);z-index:9999;padding:6px 0;min-width:210px';
  var items=[[ico('book')+' Journal comptable','genPDF("journal")'],[ico('scale')+' Bilan OHADA','genPDF("bilan")'],[ico('trendUp')+' Compte de résultats','genPDF("resultats")'],[ico('calc')+' Balance des comptes','genPDF("balance")'],[ico('factory')+' Tableau des immobilisations','genPDF("immo")'],[ico('file')+' Liste des factures','genPDF("factures")']];
  menu.innerHTML='<div style="padding:4px 14px 7px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted)">Exporter en PDF</div>'+items.map(function(it){return'<div onclick="'+it[1]+';this.closest(\'div[style*=fixed]\').remove()" style="padding:8px 14px;cursor:pointer;font-size:12.5px;color:var(--text)" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'transparent\'">'+it[0]+'</div>';}).join('')+'<div style="border-top:2px solid var(--border);margin:4px 0"></div><div onclick="this.closest(\'div[style*=fixed]\').remove()" style="padding:7px 14px;cursor:pointer;font-size:11.5px;color:var(--text-muted)">'+ico('close')+' Fermer</div>';
  document.body.appendChild(menu);
  setTimeout(function(){document.addEventListener('click',function h(e){if(!menu.contains(e.target)){menu.remove();document.removeEventListener('click',h);}},true);},100);
}

function genPDF(type){
  var jsPDF_=window.jspdf&&window.jspdf.jsPDF;
  if(!jsPDF_){alert('jsPDF se charge... Réessayez dans 2 secondes.');return;}
  var doc=new jsPDF_({orientation:'portrait',unit:'mm',format:'a4'});
  var W=210,M=14,y=20,LH=5.5,ent=(document.querySelector('.logo-sub')||{}).textContent||'Mon Entreprise',an=EXERCICE.annee;

  function hdr(titre){doc.setFillColor(13,31,26);doc.rect(0,0,W,22,'F');doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont('helvetica','bold');doc.text('GEST Africa',M,9);doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(168,201,191);doc.text(ent,M,15);doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);doc.text(titre,W-M,9,{align:'right'});doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(168,201,191);doc.text('Exercice '+an+' — '+new Date().toLocaleDateString('fr-FR'),W-M,15,{align:'right'});doc.setTextColor(0,0,0);y=30;}
  function chkY(h){if(y+h>275){doc.addPage();hdr(doc.internal.title);}}
  function sec(t){chkY(8);doc.setFontSize(8.5);doc.setFont('helvetica','bold');doc.setFillColor(224,247,224);doc.rect(M,y,W-2*M,6,'F');doc.setTextColor(8,80,65);doc.text(t,M+2,y+4.2);doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');y+=7;}
  function totRow(label,v,bg){chkY(7);doc.setFillColor(bg[0],bg[1],bg[2]);doc.rect(M,y,W-2*M,6,'F');doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(label,M+2,y+4.2);doc.text(Math.round(v).toLocaleString('fr-FR')+' FCFA',W-M,y+4.2,{align:'right'});doc.setFont('helvetica','normal');y+=7;}

  if(type==='journal'){
    doc.internal.title='Journal comptable';hdr('Journal comptable');
    sec(EC.length+' écritures');
    doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setFillColor(247,247,245);doc.rect(M,y,W-2*M,5,'F');
    doc.text('Date',M+1,y+3.5);doc.text('N° Facture',M+22,y+3.5);doc.text('Libellé',M+44,y+3.5);doc.text('Cpt D',M+100,y+3.5);doc.text('Cpt C',M+115,y+3.5);doc.text('Débit',W-M-18,y+3.5,{align:'right'});doc.text('Crédit',W-M,y+3.5,{align:'right'});
    y+=6;doc.setFont('helvetica','normal');var tD=0,tC=0;
    EC.concat(REGL).forEach(function(e){chkY(LH);doc.text((e.dateF||e.date||'').substring(0,10),M+1,y+3.5);doc.text((e.num||'').substring(0,14),M+22,y+3.5);doc.text((e.desc||'').substring(0,29),M+44,y+3.5);doc.text(e.cptD||'',M+100,y+3.5);doc.text(e.cptC||'',M+115,y+3.5);doc.text(Math.round(e.debit).toLocaleString('fr-FR'),W-M-18,y+3.5,{align:'right'});doc.text(Math.round(e.credit).toLocaleString('fr-FR'),W-M,y+3.5,{align:'right'});tD+=e.debit;tC+=e.credit;doc.setDrawColor(230,230,230);doc.line(M,y+LH,W-M,y+LH);y+=LH;});
    totRow('TOTAL DÉBIT / CRÉDIT — Journal '+(Math.abs(tD-tC)<1?'ÉQUILIBRÉ':'DÉSÉQUILIBRÉ'),tD,[224,247,224]);
    doc.save('Journal_'+an+'.pdf');
  }
  else if(type==='bilan'){
    doc.internal.title='Bilan OHADA';hdr('Bilan OHADA — '+an);
    var cps={};EC.concat(REGL).forEach(function(e){if(e.cptD){if(!cps[e.cptD])cps[e.cptD]={d:0,c:0};cps[e.cptD].d+=e.debit||0;}if(e.cptC){if(!cps[e.cptC])cps[e.cptC]={d:0,c:0};cps[e.cptC].c+=e.credit||0;}});
    var gD=function(c){var x=cps[c];return x?Math.max(0,x.d-x.c):0;};var gC=function(c){var x=cps[c];return x?Math.max(0,x.c-x.d):0;};
    var tPr=0,tCh=0;EC.concat(REGL).forEach(function(e){if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA)tPr+=e.credit;if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA)tCh+=e.debit;});var res=tPr-tCh;
    var vncT=IMMOS.reduce(function(a,i){return a+i.vnc;},0);
    var tA=vncT+(gD('3111')||gD('31'))+gD('4111')+gD('4452')+gD('571')+gD('521');
    var cp=gC('101')||gC('10');var tP=cp+gC('106')+(res>0?res:0)+gC('401')+gC('4431')+gC('4471')+gC('16');
    function row2(la,va,ld,vd){chkY(LH);doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.text(la.substring(0,26),M,y+3.5);if(va>0)doc.text(Math.round(va).toLocaleString('fr-FR'),M+88,y+3.5,{align:'right'});if(ld){doc.text(ld.substring(0,26),W/2+2,y+3.5);if(vd>0)doc.text(Math.round(vd).toLocaleString('fr-FR'),W-M,y+3.5,{align:'right'});}doc.setDrawColor(230,230,230);doc.line(M,y+LH,W-M,y+LH);y+=LH;}
    function sec2(tA,tB){chkY(7);doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.setFillColor(224,247,224);doc.rect(M,y,W/2-M-2,5.5,'F');doc.setTextColor(8,80,65);doc.text(tA,M+2,y+4);if(tB){doc.setFillColor(224,247,224);doc.rect(W/2+2,y,W/2-M-2,5.5,'F');doc.text(tB,W/2+4,y+4);}doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');y+=6;doc.setDrawColor(100,100,100);doc.line(W/2,22,W/2,y+60);}
    sec2('ACTIF','PASSIF');sec2('Actif immobilisé','Capitaux propres');
    row2('Immobilisations VNC ('+IMMOS.length+')',vncT,'Capital social (101)',cp);
    row2('','','Réserves (106)',gC('106'));
    row2('','',res>0?'Bénéfice net':'Déficit net (−)',Math.abs(res));
    sec2('Actif circulant','Dettes');
    row2('Stocks (31)',gD('3111')||gD('31'),'Fournisseurs (401)',gC('401'));
    row2('Clients (4111)',gD('4111'),'TVA collectée (4431)',gC('4431'));
    row2('TVA récupérable',gD('4452'),'IS à payer (4471)',gC('4471'));
    row2('Caisse (571)',gD('571')+SOLDES.caisse,'Dettes fin. (16)',gC('16'));
    row2('Banque (521)',gD('521')+SOLDES.banque,'','');
    chkY(9);doc.setFillColor(13,31,26);doc.rect(M,y,W-2*M,8,'F');doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);doc.text('TOTAL ACTIF : '+Math.round(tA).toLocaleString('fr-FR')+' FCFA',M+2,y+5.5);doc.text('TOTAL PASSIF : '+Math.round(tP).toLocaleString('fr-FR')+' FCFA',W-M-2,y+5.5,{align:'right'});doc.setTextColor(0,0,0);
    doc.save('Bilan_OHADA_'+an+'.pdf');
  }
  else if(type==='immo'){
    doc.internal.title='Immobilisations';hdr('Tableau des immobilisations — '+an);
    if(!IMMOS.length){doc.text('Aucune immobilisation.',M,y+10);doc.save('Immobilisations_'+an+'.pdf');return;}
    sec(IMMOS.length+' immobilisation(s)');
    doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setFillColor(247,247,245);doc.rect(M,y,W-2*M,5,'F');
    doc.text('Désignation',M+1,y+3.5);doc.text('Cat.',M+55,y+3.5);doc.text('Date',M+65,y+3.5);doc.text('Valeur brute',M+88,y+3.5,{align:'right'});doc.text('Durée',M+100,y+3.5);doc.text('Dot./an',M+118,y+3.5,{align:'right'});doc.text('Amort. cum.',M+140,y+3.5,{align:'right'});doc.text('VNC',W-M,y+3.5,{align:'right'});
    y+=6;doc.setFont('helvetica','normal');var tV=0,tA2=0,tVnc=0;
    IMMOS.forEach(function(im){chkY(LH);var a=im.valeur-im.vnc;tV+=im.valeur;tA2+=a;tVnc+=im.vnc;doc.text(im.nom.substring(0,26),M+1,y+3.5);doc.text(im.cat,M+55,y+3.5);doc.text(im.date?im.date.split('-').reverse().join('/'):'-',M+65,y+3.5);doc.text(Math.round(im.valeur).toLocaleString('fr-FR'),M+88,y+3.5,{align:'right'});doc.text(im.duree+'a',M+100,y+3.5);doc.text(Math.round(im.dotAnnuelle).toLocaleString('fr-FR'),M+118,y+3.5,{align:'right'});doc.text(Math.round(a).toLocaleString('fr-FR'),M+140,y+3.5,{align:'right'});doc.text(Math.round(im.vnc).toLocaleString('fr-FR'),W-M,y+3.5,{align:'right'});doc.setDrawColor(230,230,230);doc.line(M,y+LH,W-M,y+LH);y+=LH;});
    totRow('TOTAUX — VNC : '+Math.round(tVnc).toLocaleString('fr-FR')+' FCFA',tV,[224,247,224]);
    doc.save('Immobilisations_'+an+'.pdf');
  }
  else if(type==='balance'){
    doc.internal.title='Balance';hdr('Balance des comptes — '+an);sec('Balance générale');
    doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setFillColor(247,247,245);doc.rect(M,y,W-2*M,5,'F');doc.text('N° Cpt',M+1,y+3.5);doc.text('Intitulé',M+18,y+3.5);doc.text('Débit cum.',M+105,y+3.5,{align:'right'});doc.text('Crédit cum.',M+128,y+3.5,{align:'right'});doc.text('Solde D',M+152,y+3.5,{align:'right'});doc.text('Solde C',W-M,y+3.5,{align:'right'});y+=6;doc.setFont('helvetica','normal');
    var cc={};EC.concat(REGL).forEach(function(e){if(!cc[e.cptD])cc[e.cptD]={d:0,c:0};if(!cc[e.cptC])cc[e.cptC]={d:0,c:0};cc[e.cptD].d+=e.debit;cc[e.cptC].c+=e.credit;});
    var tD2=0,tC2=0,tSD=0,tSC=0;
    Object.keys(cc).sort().forEach(function(cpt){chkY(LH);var v=cc[cpt],sd=Math.max(0,v.d-v.c),sc=Math.max(0,v.c-v.d);tD2+=v.d;tC2+=v.c;tSD+=sd;tSC+=sc;doc.text(cpt,M+1,y+3.5);doc.text((NOMS[cpt]||'Cpt '+cpt).substring(0,21),M+18,y+3.5);doc.text(Math.round(v.d).toLocaleString('fr-FR'),M+105,y+3.5,{align:'right'});doc.text(Math.round(v.c).toLocaleString('fr-FR'),M+128,y+3.5,{align:'right'});if(sd>0)doc.text(Math.round(sd).toLocaleString('fr-FR'),M+152,y+3.5,{align:'right'});if(sc>0)doc.text(Math.round(sc).toLocaleString('fr-FR'),W-M,y+3.5,{align:'right'});doc.setDrawColor(230,230,230);doc.line(M,y+LH,W-M,y+LH);y+=LH;});
    totRow('TOTAUX — Équilibre : '+(Math.abs(tSD-tSC)<1?'Oui':'Écart '+Math.round(Math.abs(tSD-tSC)).toLocaleString('fr-FR')+' FCFA'),tD2,[224,247,224]);
    doc.save('Balance_'+an+'.pdf');
  }
  else if(type==='resultats'){
    doc.internal.title='Compte de résultats';hdr('Compte de résultats — '+an);
    var byP={},byCh={},tPr2=0,tCh2=0;
    EC.concat(REGL).forEach(function(e){if(e.cptC&&e.cptC[0]==='7'&&!e.isTVA){if(!byP[e.cptC])byP[e.cptC]=0;byP[e.cptC]+=e.credit;tPr2+=e.credit;}if(e.cptD&&e.cptD[0]==='6'&&!e.isTVA){if(!byCh[e.cptD])byCh[e.cptD]=0;byCh[e.cptD]+=e.debit;tCh2+=e.debit;}});
    sec('Produits (Classe 7)');doc.setFontSize(7.5);
    Object.keys(byP).sort().forEach(function(c){chkY(LH);doc.text(c,M,y+3.5);doc.text((NOMS[c]||c).substring(0,34),M+14,y+3.5);doc.text(Math.round(byP[c]).toLocaleString('fr-FR'),W-M,y+3.5,{align:'right'});doc.setDrawColor(230,230,230);doc.line(M,y+LH,W-M,y+LH);y+=LH;});
    totRow('TOTAL PRODUITS',tPr2,[224,247,224]);y+=4;
    sec('Charges (Classe 6)');
    Object.keys(byCh).sort().forEach(function(c){chkY(LH);doc.text(c,M,y+3.5);doc.text((NOMS[c]||c).substring(0,34),M+14,y+3.5);doc.text(Math.round(byCh[c]).toLocaleString('fr-FR'),W-M,y+3.5,{align:'right'});doc.setDrawColor(230,230,230);doc.line(M,y+LH,W-M,y+LH);y+=LH;});
    totRow('TOTAL CHARGES',tCh2,[253,235,235]);y+=4;
    var res2=tPr2-tCh2;chkY(12);var clr=res2>=0?[224,247,224]:[253,235,235];doc.setFillColor(clr[0],clr[1],clr[2]);doc.rect(M,y,W-2*M,9,'F');doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(res2>=0?8:162,res2>=0?80:45,res2>=0?65:45);doc.text((res2>=0?'BÉNÉFICE NET : ':'PERTE NETTE : ')+Math.round(Math.abs(res2)).toLocaleString('fr-FR')+' FCFA',W/2,y+6,{align:'center'});doc.setTextColor(0,0,0);
    doc.save('Resultats_'+an+'.pdf');
  }
  else if(type==='factures'){
    doc.internal.title='Liste factures';hdr('Liste des factures — '+an);
    var flist=EC.filter(function(e){return!e.isTVA&&!e.isAvance&&!e.isAmort;});
    sec(flist.length+' facture(s)');doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setFillColor(247,247,245);doc.rect(M,y,W-2*M,5,'F');doc.text('Date',M+1,y+3.5);doc.text('N°',M+18,y+3.5);doc.text('Client/Fourn.',M+36,y+3.5);doc.text('Type',M+84,y+3.5);doc.text('HT',M+104,y+3.5,{align:'right'});doc.text('TVA',M+120,y+3.5,{align:'right'});doc.text('TTC',W-M,y+3.5,{align:'right'});y+=6;doc.setFont('helvetica','normal');var tH=0,tTva=0,tTtc=0;
    flist.forEach(function(e){chkY(LH);tH+=e.ht||0;tTva+=e.tva||0;tTtc+=e.ttc||0;doc.text((e.dateF||'').substring(0,10),M+1,y+3.5);doc.text((e.num||'').substring(0,12),M+18,y+3.5);doc.text((e.cli||'').substring(0,24),M+36,y+3.5);var typ=e.avoir?'AVOIR':e.type==='vente'?'Vente':e.type==='service'?'Service':'Achat';doc.text(typ,M+84,y+3.5);doc.text(Math.round(e.ht||0).toLocaleString('fr-FR'),M+104,y+3.5,{align:'right'});doc.text(Math.round(e.tva||0).toLocaleString('fr-FR'),M+120,y+3.5,{align:'right'});doc.text(Math.round(e.ttc||0).toLocaleString('fr-FR'),W-M,y+3.5,{align:'right'});doc.setDrawColor(230,230,230);doc.line(M,y+LH,W-M,y+LH);y+=LH;});
    totRow('TOTAUX — TTC : '+Math.round(tTtc).toLocaleString('fr-FR')+' FCFA',tH,[224,247,224]);
    doc.save('Factures_'+an+'.pdf');
  }
}

// ═══ ASSISTANT IA — redirige vers l'onglet "Chat IA" (js/21-ia-copilot.js), qui remplace cet ancien modal ═══
function ouvrirIA(){
  go('chat-ia');
}

// ═══ PANE IMMO dans go() ═══
// immo navigation handled by unified go() v12

// Update footer & badge
document.querySelector('.sidebar-footer').textContent='GEST Africa v12 — OHADA Togo';
setTimeout(function(){
  try{var raw=localStorage.getItem('comptaia_data');if(raw){var obj=JSON.parse(raw);if(obj.IMMOS)IMMOS=obj.IMMOS;if(obj.IMMOS&&obj.IMMOS.length)renderImmo();}}catch(e){}
  try{renderBilan();}catch(e){}
},500);
