// Correctif: adopts orphan pane divs into .content - extracted from ComptaIA_Pro_original.html lines 7065-7089
// ── CORRECTIF : adopter tous les panes orphelins dans .content ─────────
(function(){
  var content = document.querySelector('.content');
  if(!content) return;
  var paneIds = [
    'pane-profil','pane-devis','pane-bc','pane-bl','pane-recurrentes',
    'pane-inventaire','pane-provisions','pane-multidevises','pane-tft','pane-calendrier',
    'pane-emprunts','pane-analytique','pane-audit','pane-simulateur','pane-production','pane-caisse'
  ];
  paneIds.forEach(function(id){
    var el = document.getElementById(id);
    if(el && el.parentElement !== content){
      content.appendChild(el);
    }
  });
  // Also ensure pane-tva and pane-rapprochement are inside content
  ['pane-tva','pane-rapprochement'].forEach(function(id){
    var el = document.getElementById(id);
    if(el && el.parentElement !== content){
      content.appendChild(el);
    }
  });
})();
