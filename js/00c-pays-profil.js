// Profil comptable par pays — Phase 2 de l'évolution vers un ERP multi-pays
// (voir le plan de la conversation). Centralise les constantes OHADA qui
// étaient jusqu'ici codées en dur, éparpillées dans js/01-core.js (NOMS,
// TVA_P, comptes de getComptes()/valider(), listes du bilan, tranches du
// compte de résultats). Refactor mécanique : les valeurs 'tg' ci-dessous
// sont une copie EXACTE de ce qui existait déjà - aucun chiffre ne change
// pour le Togo. Le contenu fiscal réel d'un 2ᵉ pays (taux de TVA, comptes)
// reste un travail futur distinct (recherche juridique par pays), pas
// seulement du code : PAYS_PROFILE n'a donc qu'une seule entrée pour
// l'instant.
var PAYS_PROFILE={
  tg:{
    // Copie exacte de l'ancien `var NOMS` (01-core.js). NOMS reste un objet
    // global MUTABLE à l'usage (renommerCpt(), nouveaux comptes du grand
    // livre, fusion des libellés personnalisés d'une entreprise via
    // chargerLocalStorage) - ce profil n'en est que le point de départ,
    // copié dans NOMS à la connexion (voir onAuthSuccess()), jamais lu en
    // direct à la place de NOMS.
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
    // Copie exacte de l'ancien `var TVA_P`. Jamais muté à l'exécution (lecture
    // seule partout), donc référencé directement, sans copie.
    tvaPresets:{'18v':{t:18,c:'4431'},'18a':{t:18,c:'4452'},'8t':{t:8,c:'4454'},'5i':{t:5,c:'4453'},'10s':{t:10,c:'4455'},'0':{t:0,c:''},'custom':{t:18,c:'4431'}},
    // Comptes utilisés par getComptes()/valider() - mêmes numéros qu'avant,
    // juste sortis des littéraux inline.
    comptes:{
      vente:'7011', service:'7061', achat:'6011',
      clientCaisse:'571', clientBanque:'521', clientCredit:'4111',
      fournCaisse:'571', fournBanque:'521', fournCredit:'401',
      avanceClient:'419', avanceFournisseur:'4091'
    },
    // Listes du bilan (renderBilan) - mêmes comptes qu'avant.
    bilan:{
      actif:['571','521','4111','4452','4453','4454','4455','3111','6011'],
      passif:['7011','7061','401','4431','110','119','1301','1302','12']
    },
    // Tranches du compte de résultats (renderResultats) - mêmes bornes
    // qu'avant (classes 6/7 du plan comptable OHADA).
    resultats:{
      ch60:[6000,6099], ch61:[6100,6299], ch63:[6300,6599], ch66:[6600,6999],
      pr70:[7000,7099], pr71:[7100,7399], pr74:[7400,7599], pr76:[7600,7999]
    }
  }
};

// Le profil actif suit CURRENT_USER.pays (posé en Phase 1) ; retombe sur
// 'tg' si l'utilisateur n'est pas encore chargé ou si son pays n'a pas
// encore de profil réel dédié (voir le commentaire en tête de fichier).
function activeProfile(){
  var p=(typeof CURRENT_USER!=='undefined'&&CURRENT_USER&&CURRENT_USER.pays)||'tg';
  return PAYS_PROFILE[p]||PAYS_PROFILE.tg;
}
