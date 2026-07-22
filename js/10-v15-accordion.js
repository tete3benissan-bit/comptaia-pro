// v15: accordion sidebar groups - extracted from ComptaIA_Pro_original.html lines 7091-7172
// ══════════════════════════════════════════════
// GEST Africa v15 — ACCORDÉON SIDEBAR
// ══════════════════════════════════════════════

// Groupes et quel page → quel groupe
var GRP_MAP = {
  'facture':'exploitation','tiers':'exploitation','devis':'exploitation',
  'bc':'exploitation','bl':'exploitation','recurrentes':'exploitation',
  'stock':'exploitation','caisse':'exploitation','production':'exploitation',
  'journal':'compta','grandlivre':'compta','lettrage':'compta',
  'bilan':'compta','resultats':'compta','balance':'compta',
  'inventaire':'compta','provisions':'compta','immo':'compta',
  'analytique':'compta','tft':'compta','audit':'compta',
  'solde':'treso','rapprochement':'treso','multidevises':'treso',
  'emprunts':'treso','suivi':'treso',
  'tva':'fiscal','exercice':'fiscal','simulateur':'fiscal','calendrier':'fiscal',
  'analyse':'rh','notifs':'rh','profil':'rh','prevision':'rh',
  'dashboard':'ia','scoring':'ia','ocr':'ia','fraude':'ia',
  'multiEntreprise':'ia','benchmarks':'ia'
};

function toggleGrp(grp) {
  var body = document.getElementById('body-'+grp);
  var header = document.querySelector('#grp-'+grp+' .acc-header');
  var arrow = document.getElementById('arr-'+grp);
  if(!body) return;
  var isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if(header) header.classList.toggle('acc-open', !isOpen);
  if(arrow) arrow.textContent = isOpen ? '▸' : '▾';
}

function openGrp(grp) {
  var body = document.getElementById('body-'+grp);
  var header = document.querySelector('#grp-'+grp+' .acc-header');
  var arrow = document.getElementById('arr-'+grp);
  if(!body) return;
  body.style.display = 'block';
  if(header) header.classList.add('acc-open');
  if(arrow) arrow.textContent = '▾';
}

function closeGrp(grp) {
  var body = document.getElementById('body-'+grp);
  var header = document.querySelector('#grp-'+grp+' .acc-header');
  var arrow = document.getElementById('arr-'+grp);
  if(!body) return;
  body.style.display = 'none';
  if(header) header.classList.remove('acc-open');
  if(arrow) arrow.textContent = '▸';
}

// Patch go() pour ouvrir automatiquement le bon groupe
(function(){
  var _prev = window.go;
  window.go = function(id, el) {
    // Ouvrir le groupe correspondant, fermer les autres
    var targetGrp = GRP_MAP[id];
    if(targetGrp) {
      ['exploitation','compta','treso','fiscal','rh','ia'].forEach(function(g){
        if(g === targetGrp) openGrp(g);
      });
    }
    _prev(id, el);
  };
})();

// Mettre à jour footer et titre
(function(){
  var f = document.getElementById('sidebar-footer');
  if(f) f.textContent = 'GEST Africa v15 — OHADA Togo';
  document.title = 'GEST Africa v15 — OHADA Togo';
  // Supprimer les doublons de lettrage qui peuvent exister dans le DOM
  var lettrageItems = document.querySelectorAll('#body-compta .nav-item');
  var seen = {};
  lettrageItems.forEach(function(item){
    var key = item.getAttribute('onclick');
    if(seen[key]){item.remove();}else{seen[key]=true;}
  });
})();
