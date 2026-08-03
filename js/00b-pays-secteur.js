// Référence pays/secteur — Phase 1 de l'évolution vers un ERP multi-pays/
// multi-secteur (voir le plan de la conversation). Simple objet JS, pas de
// table Supabase : cette liste ne change que lorsqu'un développeur ajoute le
// code correspondant à un nouveau pays/secteur (moteur comptable, champs de
// facture) - une table BDD n'apporterait aucune souplesse d'exécution
// supplémentaire à ce stade, juste une migration/RLS/jointure en plus.
//
// Aujourd'hui, seul le Togo a un vrai moteur comptable (OHADA) derrière -
// les autres pays de la liste sont présents pour que le formulaire de
// création d'entreprise soit déjà prêt, mais leur contenu fiscal réel est un
// travail futur distinct (recherche juridique par pays, pas juste du code).
// Les 17 États membres de l'OHADA. Tous partagent le franc CFA (deux zones
// monétaires distinctes en réalité - UEMOA pour l'Afrique de l'Ouest, CEMAC
// pour l'Afrique centrale - mais toutes deux appelées FCFA et de parité
// identique avec l'euro, donc un seul libellé "devise" suffit ici), sauf les
// Comores qui utilisent le franc comorien (KMF).
var PAYS_REF={
  tg:{label:'Togo',devise:'FCFA'},
  ci:{label:'Côte d\'Ivoire',devise:'FCFA'},
  sn:{label:'Sénégal',devise:'FCFA'},
  bj:{label:'Bénin',devise:'FCFA'},
  bf:{label:'Burkina Faso',devise:'FCFA'},
  ml:{label:'Mali',devise:'FCFA'},
  ne:{label:'Niger',devise:'FCFA'},
  cm:{label:'Cameroun',devise:'FCFA'},
  ga:{label:'Gabon',devise:'FCFA'},
  cf:{label:'Centrafrique',devise:'FCFA'},
  cg:{label:'Congo',devise:'FCFA'},
  td:{label:'Tchad',devise:'FCFA'},
  gn:{label:'Guinée',devise:'FCFA'},
  gw:{label:'Guinée-Bissau',devise:'FCFA'},
  gq:{label:'Guinée équatoriale',devise:'FCFA'},
  cd:{label:'RDC',devise:'FCFA'},
  km:{label:'Comores',devise:'KMF'}
};

var SECTEUR_REF={
  commerce:'Commerce',
  service:'Prestations de services',
  btp:'BTP',
  sante:'Santé',
  hotellerie:'Hôtellerie',
  restauration:'Restauration',
  transport:'Transport',
  agriculture:'Agriculture',
  elevage:'Élevage',
  industrie:'Industrie',
  import_export:'Import-Export',
  pharmacie:'Pharmacie',
  education:'Éducation',
  immobilier:'Immobilier',
  cabinet_comptable:'Cabinet comptable',
  cabinet_juridique:'Cabinet juridique',
  ong:'ONG',
  association:'Association',
  cooperative:'Coopérative',
  banque:'Banque',
  assurance:'Assurance',
  telecom:'Télécommunications',
  artisanat:'Artisanat',
  autre:'Autre'
};

function remplirSelectPaysSecteur(){
  var selPays=document.getElementById('setup-pays');
  if(selPays&&!selPays.options.length){
    Object.keys(PAYS_REF).forEach(function(k){
      var o=document.createElement('option');o.value=k;o.textContent=PAYS_REF[k].label;selPays.appendChild(o);
    });
  }
  var selSecteur=document.getElementById('setup-secteur');
  if(selSecteur&&!selSecteur.options.length){
    Object.keys(SECTEUR_REF).forEach(function(k){
      var o=document.createElement('option');o.value=k;o.textContent=SECTEUR_REF[k];selSecteur.appendChild(o);
    });
  }
}
document.addEventListener('DOMContentLoaded',remplirSelectPaysSecteur);
