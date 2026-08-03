// Référence forme juridique — même motif que PAYS_REF/SECTEUR_REF
// (js/00b-pays-secteur.js) : simple liste JS, capturée à la création de
// l'entreprise et disponible sur CURRENT_USER.formeJuridique. Aucune
// logique d'adaptation comptable/fiscale n'est branchée dessus pour
// l'instant - ce serait un travail distinct nécessitant une expertise
// comptable par pays × forme juridique (ex: le régime "système minimal de
// trésorerie" SYSCOHADA pour une très petite entreprise n'est pas le même
// que pour une SA, et une association/ONG suit souvent un plan comptable
// différent) - voir le plan de la conversation.
var FORME_JURIDIQUE_REF={
  entreprise_individuelle:'Entreprise individuelle',
  entrepreneur_individuel:'Entrepreneur individuel',
  sarl:'SARL',
  sarlu:'SARLU',
  sa:'SA',
  sas:'SAS',
  sasu:'SASU',
  snc:'SNC',
  scs:'SCS',
  gie:'GIE',
  cooperative:'Coopérative',
  association:'Association',
  ong:'ONG',
  etablissement_public:'Établissement public',
  societe_civile:'Société civile',
  fondation:'Fondation',
  filiale:'Filiale',
  succursale:'Succursale',
  autre:'Autre'
};

function remplirSelectFormeJuridique(){
  var sel=document.getElementById('setup-forme-juridique');
  if(sel&&!sel.options.length){
    Object.keys(FORME_JURIDIQUE_REF).forEach(function(k){
      var o=document.createElement('option');o.value=k;o.textContent=FORME_JURIDIQUE_REF[k];sel.appendChild(o);
    });
  }
}
document.addEventListener('DOMContentLoaded',remplirSelectFormeJuridique);
