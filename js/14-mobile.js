// Mobile drawer menu + touch/table-scroll JS - extracted from ComptaIA_Pro_original.html lines 9677-9765
// ═══════════════════════════════════════════════════════════════
// ComptaIA — JS OPTIMISATION MOBILE
// ═══════════════════════════════════════════════════════════════
(function(){
  'use strict';
  var MQ = window.matchMedia('(max-width:900px)');

  /* — Fond assombri derrière le tiroir — */
  var bd = document.createElement('div');
  bd.id = 'nav-backdrop';
  document.body.appendChild(bd);

  /* — Bouton hamburger dans la topbar — */
  var topbar = document.querySelector('.topbar');
  var burger = document.createElement('button');
  burger.id = 'menu-burger';
  burger.type = 'button';
  burger.setAttribute('aria-label', 'Ouvrir le menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '☰';
  if (topbar) topbar.insertBefore(burger, topbar.firstChild);

  function ouvrirMenu(){ document.body.classList.add('nav-open'); burger.setAttribute('aria-expanded','true'); }
  function fermerMenu(){ document.body.classList.remove('nav-open'); burger.setAttribute('aria-expanded','false'); }
  function basculerMenu(){ document.body.classList.contains('nav-open') ? fermerMenu() : ouvrirMenu(); }
  window.fermerMenuMobile = fermerMenu;

  burger.addEventListener('click', function(e){ e.stopPropagation(); basculerMenu(); });
  bd.addEventListener('click', fermerMenu);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') fermerMenu(); });

  /* — Fermer le tiroir automatiquement après une navigation — */
  var _go = window.go;
  window.go = function(id, el){
    if (typeof _go === 'function') _go(id, el);
    if (MQ.matches) fermerMenu();
  };

  /* — Gestes : balayer depuis le bord gauche pour ouvrir, vers la gauche pour fermer — */
  var swipeX = null, swipeY = 0;
  document.addEventListener('touchstart', function(e){
    if (!MQ.matches) { swipeX = null; return; }
    var t = e.touches[0];
    swipeX = (t.clientX < 26 || document.body.classList.contains('nav-open')) ? t.clientX : null;
    swipeY = t.clientY;
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    if (swipeX === null || !MQ.matches) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - swipeX, dy = Math.abs(t.clientY - swipeY);
    if (dx > 60 && dy < 60 && !document.body.classList.contains('nav-open')) ouvrirMenu();
    else if (dx < -60 && dy < 60 && document.body.classList.contains('nav-open')) fermerMenu();
    swipeX = null;
  }, {passive:true});

  /* — Envelopper tout tableau sans conteneur défilant (sécurité anti-débordement) — */
  function envelopperTables(){
    var tables = document.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++){
      var t = tables[i];
      if (t.closest('.tw-auto,.table-wrap')) continue;
      var p = t.parentElement, ok = false, garde = 0;
      while (p && p !== document.body && garde++ < 8){
        var st = p.getAttribute('style') || '';
        if (p.classList.contains('card-body') || p.classList.contains('table-wrap') || p.classList.contains('tw-auto') ||
            st.indexOf('overflow-x:auto') > -1 || st.indexOf('overflow:auto') > -1 || st.indexOf('overflow-x: auto') > -1){
          ok = true; break;
        }
        p = p.parentElement;
      }
      if (ok) continue;
      var w = document.createElement('div');
      w.className = 'tw-auto';
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    }
  }
  try { envelopperTables(); } catch(e){}

  /* Ré-appliquer quand le contenu est régénéré par l'application */
  var timer = null;
  var obs = new MutationObserver(function(){
    if (timer) return;
    timer = setTimeout(function(){ timer = null; try { envelopperTables(); } catch(e){} }, 150);
  });
  obs.observe(document.querySelector('.content') || document.body, {childList:true, subtree:true});
})();
