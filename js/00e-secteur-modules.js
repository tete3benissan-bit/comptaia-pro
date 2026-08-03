// Config de visibilité des modules EXISTANTS par secteur — Étape A4 de
// l'évolution ERP (voir le plan de la conversation). Ne crée aucun nouveau
// module métier (ça viendra secteur par secteur, séparément) : ceci
// masque/affiche uniquement ce qui existe déjà (Stock, Devis,
// Immobilisations, Caisse, Paie...) selon la pertinence pour le secteur de
// l'entreprise (CURRENT_USER.secteur, posé à la création).
//
// Chargé après js/15-v19-specializations.js (a besoin de PANE2SPEC pour
// valider les ids), avant js/22-permissions.js (qui l'utilise).
//
// Règle de sécurité impérative : tout secteur ABSENT de SECTEUR_MODULES
// retombe sur '*' (aucune restriction) - jamais sur une liste vide. Un
// secteur non encore configuré ne doit jamais verrouiller silencieusement
// tous les modules à ses utilisateurs.
var SECTEUR_MODULES={
  // Config volontairement clairsemée pour l'instant - à enrichir secteur par
  // secteur au fil du temps. Tout ce qui n'est pas listé ici => '*'.
  cabinet_juridique:{modules:['dashboard','tiers','facture','devis','journal','grandlivre','balance','bilan','resultats','tva','profil']},
  cabinet_comptable:{modules:['dashboard','tiers','facture','devis','journal','grandlivre','balance','bilan','resultats','tva','profil']},
  banque:{modules:['dashboard','tiers','journal','grandlivre','balance','bilan','resultats','tva','profil']},
  assurance:{modules:['dashboard','tiers','facture','journal','grandlivre','balance','bilan','resultats','tva','profil']},
  ong:{modules:['dashboard','tiers','facture','journal','grandlivre','balance','bilan','resultats','profil']},
  association:{modules:['dashboard','tiers','facture','journal','grandlivre','balance','bilan','resultats','profil']}
};

// Retourne '*' (aucune restriction) ou un tableau d'ids de panes autorisés.
function secteurModulesActifs(){
  var s=(typeof CURRENT_USER!=='undefined'&&CURRENT_USER&&CURRENT_USER.secteur)||'commerce';
  var def=SECTEUR_MODULES[s];
  return (def&&def.modules)||'*';
}

// true si le pane `id` est autorisé pour le secteur de l'entreprise. Les
// panes hors du système de hubs (ex: notifs, hors PANE2SPEC) ne sont jamais
// restreints ici - même carve-out que permBloquerSiInterdit() pour ces ids.
function permAutoriseParSecteur(id){
  var mods=secteurModulesActifs();
  if(mods==='*')return true;
  if(!window.PANE2SPEC||!PANE2SPEC[id])return true;
  return mods.indexOf(id)>-1;
}
