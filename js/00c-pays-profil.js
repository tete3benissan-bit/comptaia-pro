// Profil comptable par pays — évolution vers un ERP multi-pays OHADA (voir
// le plan de la conversation). Centralise les constantes du plan comptable
// SYSCOHADA (numéros de comptes, bilan, compte de résultats) et les taux de
// TVA propres à chaque État membre.
//
// Point important : le plan comptable SYSCOHADA (numéros de comptes 4431,
// 4452, 7011, 6011, les tranches de classes 6/7...) est IDENTIQUE dans les
// 17 pays de l'OHADA - c'est précisément l'objet de l'harmonisation OHADA.
// Seul le TAUX de TVA change réellement d'un pays à l'autre. `OHADA_COMMUN`
// ci-dessous porte donc cette base partagée une seule fois ; chaque pays ne
// définit que ses propres taux de TVA.
//
// Taux de TVA (standard 2026) fournis et validés par l'utilisateur pour les
// 17 États membres. Aucune mention légale obligatoire ni nom de format de
// déclaration n'a encore été sourcé pour aucun pays (y compris le Togo) -
// mentionsLegales reste vide partout tant que ce n'est pas confirmé (voir
// Étape B du plan) : jamais de texte inventé affiché à l'utilisateur.
var OHADA_COMMUN={
  noms:{
    '7011':'Ventes de marchandises','7061':'Prestations de services',
    '4111':'Clients','401':'Fournisseurs','571':'Caisse','521':'Banque',
    '6011':'Achats de marchandises','3111':'Stock matières',
    '4431':'TVA facturée sur vente','4452':'TVA récupérable achat',
    '4454':'TVA récupérable transport','4453':'TVA à l\'importation',
    '4455':'TVA services ext.','419':'Avances clients','4091':'Avances fourn.',
    '110':'Report à nouveau créditeur','119':'Report à nouveau débiteur',
    '12':'Résultat net de l\'exercice','1301':'Résultat — bénéfice','1302':'Résultat — perte'
  },
  comptes:{
    vente:'7011', service:'7061', achat:'6011',
    clientCaisse:'571', clientBanque:'521', clientCredit:'4111',
    fournCaisse:'571', fournBanque:'521', fournCredit:'401',
    avanceClient:'419', avanceFournisseur:'4091'
  },
  bilan:{
    actif:['571','521','4111','4452','4453','4454','4455','3111','6011'],
    passif:['7011','7061','401','4431','110','119','1301','1302','12']
  },
  resultats:{
    ch60:[6000,6099], ch61:[6100,6299], ch63:[6300,6599], ch66:[6600,6999],
    pr70:[7000,7099], pr71:[7100,7399], pr74:[7400,7599], pr76:[7600,7999]
  }
};

// Construit un profil pays : reprend OHADA_COMMUN tel quel (mêmes comptes
// pour tous), ajoute seulement les taux de TVA propres au pays. `tauxStd`
// est le taux normal fourni par l'utilisateur ; les pays autres que le Togo
// n'ont qu'un jeu de taux simplifié (vente/achat/exonéré/personnalisé) -
// pas de taux réduits différenciés (transport/import/services extérieurs)
// tant qu'ils n'ont pas été sourcés spécifiquement pour ce pays : mieux
// vaut ne pas les proposer que d'inventer des sous-taux non vérifiés.
function construireProfilPays(tauxStd){
  return {
    noms:OHADA_COMMUN.noms,
    comptes:OHADA_COMMUN.comptes,
    bilan:OHADA_COMMUN.bilan,
    resultats:OHADA_COMMUN.resultats,
    tvaPresets:{
      'norm_v':{t:tauxStd,c:'4431',lb:'TVA facturée sur vente'},
      'norm_a':{t:tauxStd,c:'4452',lb:'TVA récupérable sur achat'},
      '0':{t:0,c:'',lb:'Exonéré'},
      'custom':{t:tauxStd,c:'4431',lb:'Taux personnalisé'}
    },
    defaultTvaKey:'norm_v',
    mentionsLegales:[],
    declarationFormat:''
  };
}

var PAYS_PROFILE={
  tg:{
    noms:OHADA_COMMUN.noms,
    comptes:OHADA_COMMUN.comptes,
    bilan:OHADA_COMMUN.bilan,
    resultats:OHADA_COMMUN.resultats,
    // Taux du Togo, différenciés par nature d'opération (déjà en usage
    // réel dans l'app depuis le début - copie exacte, aucun chiffre ne
    // change ici).
    tvaPresets:{
      '18v':{t:18,c:'4431',lb:'TVA facturée sur vente'},
      '18a':{t:18,c:'4452',lb:'TVA récupérable sur achat'},
      '8t':{t:8,c:'4454',lb:'TVA récupérable sur transport'},
      '5i':{t:5,c:'4453',lb:'TVA à l\'importation'},
      '10s':{t:10,c:'4455',lb:'TVA sur services extérieurs'},
      '0':{t:0,c:'',lb:'Exonéré'},
      'custom':{t:18,c:'4431',lb:'Taux personnalisé'}
    },
    defaultTvaKey:'18v',
    mentionsLegales:[],
    declarationFormat:''
  },
  bj:construireProfilPays(18),   // Bénin
  bf:construireProfilPays(18),   // Burkina Faso
  cm:construireProfilPays(19.25),// Cameroun
  cf:construireProfilPays(19),   // Centrafrique
  km:construireProfilPays(10),   // Comores
  cg:construireProfilPays(18),   // Congo
  ci:construireProfilPays(18),   // Côte d'Ivoire
  ga:construireProfilPays(18),   // Gabon
  gn:construireProfilPays(18),   // Guinée
  gq:construireProfilPays(15),   // Guinée équatoriale
  gw:construireProfilPays(19),   // Guinée-Bissau
  ml:construireProfilPays(18),   // Mali
  ne:construireProfilPays(19),   // Niger
  cd:construireProfilPays(16),   // RDC
  sn:construireProfilPays(18),   // Sénégal
  td:construireProfilPays(18)    // Tchad
};

// Le profil actif suit CURRENT_USER.pays (posé en Phase 1) ; retombe sur
// 'tg' si l'utilisateur n'est pas encore chargé ou si son pays n'a pas
// encore de profil réel dédié.
function activeProfile(){
  var p=(typeof CURRENT_USER!=='undefined'&&CURRENT_USER&&CURRENT_USER.pays)||'tg';
  return PAYS_PROFILE[p]||PAYS_PROFILE.tg;
}
