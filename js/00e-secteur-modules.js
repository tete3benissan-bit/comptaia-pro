// Config de visibilité des modules EXISTANTS par secteur — Étape A4 de
// l'évolution ERP (voir le plan de la conversation). Ne crée aucun nouveau
// module métier (ça viendra secteur par secteur, séparément) : ceci
// masque/affiche uniquement ce qui existe déjà (Stock, Devis, Bons de
// commande/livraison, Production, Caisse...) selon la pertinence pour le
// secteur de l'entreprise (CURRENT_USER.secteur, posé à la création).
//
// CORRECTIF (audit du 2026-08) : la première version de ce fichier listait
// des modules "autorisés" par secteur en incluant des panes de comptabilité/
// fiscalité (journal, bilan, resultats, tva...). Comme la liste n'a jamais
// été mise à jour quand de nouveaux panes obligatoires sont apparus
// (Déclaration IS = pane 'exercice', Liasse fiscale, CNSS, Retenues à la
// source), ces secteurs se sont retrouvés à bloquer silencieusement l'accès
// à des déclarations que TOUTE entreprise doit pouvoir faire, quel que soit
// son métier - cause exacte du bug rapporté sur le secteur Banque
// ("Déclaration IS" inaccessible). La comptabilité, la fiscalité, les
// déclarations et les RH ne varient JAMAIS selon le secteur d'activité :
// seul ce qui appartient au hub "Exploitant" (ventes, stock, production)
// varie réellement. permAutoriseParSecteur() n'examine donc plus QUE les
// panes du hub Exploitant - impossible de reproduire ce bug à l'avenir,
// même en ajoutant de nouveaux panes comptables/fiscaux plus tard.
//
// Règle de sécurité impérative : tout secteur ABSENT de SECTEUR_MODULES
// retombe sur '*' (aucune restriction) - jamais sur une liste vide. Un
// secteur non encore configuré ne doit jamais verrouiller silencieusement
// tous les modules à ses utilisateurs.
var TOUJOURS_AUTORISES_EXPLOITANT=['dashboard','tiers','profil','facture'];
var SECTEUR_MODULES={
  // Ne liste QUE les modules du hub Exploitant qui varient réellement selon
  // le secteur (devis, bons de commande/livraison, factures récurrentes,
  // caisse/PDV, stock, production) - dashboard/tiers/profil/facture sont
  // déjà toujours autorisés (voir TOUJOURS_AUTORISES_EXPLOITANT ci-dessus),
  // et tout module hors du hub Exploitant (comptabilité, fiscalité,
  // déclarations, RH, trésorerie, IA) n'est jamais concerné par cette
  // config, quel que soit le secteur.
  cabinet_juridique:{modules:['devis']},
  cabinet_comptable:{modules:['devis']},
  banque:{modules:[]},
  assurance:{modules:['devis']},
  ong:{modules:[]},
  association:{modules:[]}
};

// Retourne '*' (aucune restriction) ou un tableau d'ids de panes autorisés.
function secteurModulesActifs(){
  var s=(typeof CURRENT_USER!=='undefined'&&CURRENT_USER&&CURRENT_USER.secteur)||'commerce';
  var def=SECTEUR_MODULES[s];
  return (def&&def.modules)||'*';
}

// true si le pane `id` est autorisé pour le secteur de l'entreprise. Seuls
// les panes du hub "Exploitant" peuvent être restreints par secteur - tout
// le reste (comptabilité, fiscalité, déclarations, RH, trésorerie, IA) est
// toujours autorisé ici, quel que soit le secteur (voir le correctif
// ci-dessus). Les panes hors du système de hubs (ex: notifs, hors
// PANE2SPEC) ne sont jamais restreints non plus - même carve-out que
// permBloquerSiInterdit() pour ces ids.
function permAutoriseParSecteur(id){
  var hub=window.PANE2SPEC&&PANE2SPEC[id];
  if(hub!=='exploitant')return true;
  if(TOUJOURS_AUTORISES_EXPLOITANT.indexOf(id)>-1)return true;
  var mods=secteurModulesActifs();
  if(mods==='*')return true;
  return mods.indexOf(id)>-1;
}
