// Nouvel onglet "Déclarations" (voir le plan de la conversation) :
// - envoyerDeclaration()/moduleAVenir() : messages génériques réutilisés par
//   les 9 sous-modules (bouton "Envoyer" partout, "Générer le PDF" sur les
//   deux nouveaux modules qui n'ont pas encore de vraie donnée à exporter).
// - Déclaration salaires & cotisations sociales (CNSS) : agrège les
//   bulletins déjà générés par le module Paie (js/11-v16-devis-paie.js,
//   BULLETINS[].bulletin.{cnss_sal,cnss_pat,brutTotal}) - aucune nouvelle
//   règle fiscale n'est inventée ici, seulement une vue consolidée de ce qui
//   est déjà calculé pour chaque bulletin.

function envoyerDeclaration(nom){
  if(typeof showToast==='function') showToast("L'envoi direct à l'administration ("+nom+") sera activé ultérieurement.");
  else alert("L'envoi direct à l'administration ("+nom+") sera activé ultérieurement.");
}
function moduleAVenir(nom){
  if(typeof showToast==='function') showToast('Le module "'+nom+'" sera activé ultérieurement.');
  else alert('Le module "'+nom+'" sera activé ultérieurement.');
}

function renderDeclarationCNSS(){
  var sel=document.getElementById('cnss-mois-filter');
  var bulletins=(typeof BULLETINS!=='undefined')?BULLETINS:[];
  if(sel){
    var current=sel.value;
    var mois=new Set();
    bulletins.forEach(function(b){ if(b.date) mois.add(String(b.date).substring(0,7)); });
    sel.innerHTML='<option value="">Toute la période</option>';
    Array.from(mois).sort().forEach(function(m){
      var opt=document.createElement('option');opt.value=m;
      var p=m.split('-');opt.textContent=(p[1]||'')+'/'+(p[0]||'');
      sel.appendChild(opt);
    });
    if(current) sel.value=current;
  }
  var fmois=(sel&&sel.value)||'';
  var filtres=bulletins.filter(function(b){ return !fmois||(b.date||'').indexOf(fmois)===0; });

  var totalBrut=0,totalSal=0,totalPat=0,rows='';
  filtres.forEach(function(b){
    var d=b.bulletin||{};
    totalBrut+=d.brutTotal||0; totalSal+=d.cnss_sal||0; totalPat+=d.cnss_pat||0;
    rows+='<tr><td>'+(b.date||'')+'</td><td>'+(b.empNom||'')+'</td>'
      +'<td style="text-align:right;font-family:\'Archivo\',sans-serif">'+fmt(d.brutTotal||0)+'</td>'
      +'<td style="text-align:right;font-family:\'Archivo\',sans-serif;color:var(--red)">'+fmt(d.cnss_sal||0)+'</td>'
      +'<td style="text-align:right;font-family:\'Archivo\',sans-serif;color:var(--amber)">'+fmt(d.cnss_pat||0)+'</td></tr>';
  });
  var body=document.getElementById('cnss-detail-body');
  if(body) body.innerHTML=rows||'<tr class="empty-row"><td colspan="5">Aucun bulletin trouvé pour cette période</td></tr>';
  var elBrut=document.getElementById('cnss-brut'); if(elBrut) elBrut.textContent=fmt(totalBrut);
  var elSal=document.getElementById('cnss-sal'); if(elSal) elSal.textContent=fmt(totalSal);
  var elPat=document.getElementById('cnss-pat'); if(elPat) elPat.textContent=fmt(totalPat);
}

function exporterCNSSPDF(){
  try{
    var jsPDF_=window.jspdf?window.jspdf.jsPDF:jsPDF;
    var doc=new jsPDF_({orientation:'portrait',unit:'mm',format:'a4'});
    var W=210,M=14,y=20;
    doc.setFillColor(13,31,26);doc.rect(0,0,W,30,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');
    doc.text('Déclaration salaires & cotisations sociales',M,14);
    doc.setFontSize(9);doc.setFont('helvetica','normal');
    doc.text((document.querySelector('.logo-sub')||{textContent:''}).textContent,M,22);
    doc.setTextColor(0,0,0);y=42;
    var totalBrut=parseFloat((document.getElementById('cnss-brut')||{textContent:'0'}).textContent.replace(/\D/g,''))||0;
    var totalSal=parseFloat((document.getElementById('cnss-sal')||{textContent:'0'}).textContent.replace(/\D/g,''))||0;
    var totalPat=parseFloat((document.getElementById('cnss-pat')||{textContent:'0'}).textContent.replace(/\D/g,''))||0;
    [['Masse salariale brute',fmt(totalBrut)+' FCFA'],['Cotisations salariales',fmt(totalSal)+' FCFA'],['Cotisations patronales',fmt(totalPat)+' FCFA']].forEach(function(r){
      doc.setFontSize(10);doc.text(r[0],M,y);doc.text(r[1],W-M,y,{align:'right'});y+=8;
    });
    doc.save('Declaration_CNSS.pdf');
  }catch(e){alert('PDF non disponible.');}
}

// Rafraîchit la déclaration CNSS à chaque navigation vers ce pane, même
// motif que les autres modules du hub Déclarations (tva, liasse...).
(function(){
  var _oldGo=window.go;
  window.go=function(id,el){
    if(typeof _oldGo==='function') _oldGo(id,el);
    if(id==='declaration-cnss') renderDeclarationCNSS();
  };
})();
