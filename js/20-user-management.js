// Gestion des utilisateurs (admin uniquement) — remplace les comptes de
// démonstration codés en dur par de vrais comptes employés créés/gérés par
// l'administrateur : ajout, modification, réinitialisation de mot de passe,
// activation/désactivation, suppression, recherche.
// Réutilise getUsers()/saveUsers()/hashPass()/esc() de js/06 et js/17.
//
// NOTE (limite honnête) : cette application est un site statique sans
// backend — les comptes vivent dans le localStorage du navigateur. Le
// hachage SHA-256 (déjà en place via hashPass) protège contre la lecture
// en clair, mais ce n'est pas un backend d'authentification serveur ; toute
// personne ayant accès physique/devtools à ce navigateur pourrait
// contourner l'interface. C'est une limite de l'architecture "app tout
// client", pas quelque chose qu'un algorithme de hachage peut résoudre seul.

var UM_SEARCH = '';

// Rôles, libellés et couleurs de badge sont centralisés dans js/22-permissions.js
function umUsers(){ return getUsers(); }
function umIsAdmin(){ return permEstAdmin(); }
function umLabelRole(r){ return permLabelRole(r); }
function umNbAdminsActifs(users){ return users.filter(function(x){return x.role==='admin'&&x.active!==false;}).length; }

function renderUtilisateurs(){
  var wrap = document.getElementById('um-table-wrap');
  var formCard = document.getElementById('um-form-card');
  if(!wrap) return;
  if(!umIsAdmin()){
    if(formCard) formCard.style.display = 'none';
    wrap.innerHTML = '<div style="text-align:center;color:var(--text-faint);padding:28px;font-style:italic">Accès réservé à l\'administrateur.</div>';
    return;
  }
  if(formCard) formCard.style.display = '';
  var roleSelect=document.getElementById('um-role');
  if(roleSelect && !roleSelect.options.length) roleSelect.innerHTML=permOptionsRoles('exploitant');
  var users = umUsers();
  var q = UM_SEARCH.trim().toLowerCase();
  if(q) users = users.filter(function(u){ return (u.nom||'').toLowerCase().indexOf(q)>=0 || (u.username||'').toLowerCase().indexOf(q)>=0; });
  if(!users.length){ wrap.innerHTML = '<div style="text-align:center;color:var(--text-faint);padding:28px;font-style:italic">Aucun utilisateur trouvé</div>'; return; }
  var h = '<div class="table-wrap"><table><thead><tr><th>Nom complet</th><th>Identifiant</th><th>Rôle</th><th>Statut</th><th></th></tr></thead><tbody>';
  users.forEach(function(u){
    var actif = u.active !== false;
    var isSelf = window.CURRENT_USER && CURRENT_USER.username === u.username;
    h += '<tr id="um-row-'+esc(u.username)+'">'
      + '<td>'+esc(u.nom||'—')+'</td>'
      + '<td>'+esc(u.username)+'</td>'
      + '<td><span class="badge '+permBadgeClass(u.role)+'">'+umLabelRole(u.role)+'</span></td>'
      + '<td><span class="badge '+(actif?'bg-green':'bg-red')+'">'+(actif?'Actif':'Désactivé')+'</span></td>'
      + '<td style="white-space:nowrap">'
      +   '<button class="btn btn-sm" onclick="umEditerLigne(\''+u.username+'\')">Modifier</button> '
      +   '<button class="btn btn-sm" onclick="umReinitialiserMdp(\''+u.username+'\')">Réinit. mdp</button> '
      +   '<button class="btn btn-sm" onclick="umToggleActif(\''+u.username+'\')"'+(isSelf?' disabled title="Vous ne pouvez pas modifier votre propre statut"':'')+'>'+(actif?'Désactiver':'Réactiver')+'</button> '
      +   '<button class="btn btn-sm btn-danger" onclick="umSupprimer(\''+u.username+'\')"'+(isSelf?' disabled title="Vous ne pouvez pas supprimer votre propre compte"':'')+'>Supprimer</button>'
      + '</td></tr>';
  });
  h += '</tbody></table></div>';
  wrap.innerHTML = h;
}

function umRechercher(v){ UM_SEARCH = v; renderUtilisateurs(); }

async function umAjouter(){
  try{
    if(!umIsAdmin()){alert("Action refusée : vous n'êtes pas connecté en tant qu'administrateur.");return;}
    var nom=(document.getElementById('um-nom').value||'').trim();
    var u=(document.getElementById('um-user').value||'').trim();
    var p=document.getElementById('um-pass').value;
    var roleEl=document.getElementById('um-role');
    var role=roleEl?roleEl.value:'';
    if(!nom||!u||!p){alert('Nom complet, identifiant et mot de passe requis.');return;}
    if(p.length<6){alert('Mot de passe trop court (min. 6 caractères).');return;}
    if(!role){alert("Aucun rôle sélectionné — rechargez la page et réessayez.");return;}
    var users=getUsers();
    if(users.find(function(x){return x.username.toLowerCase()===u.toLowerCase();})){alert('Cet identifiant est déjà utilisé.');return;}
    var ph=await hashPass(p);
    users.push({nom:nom,username:u,passHash:ph,role:role,active:true});
    saveUsers(users);
    var verif=getUsers();
    if(!verif.find(function(x){return x.username===u;})){alert("L'enregistrement a échoué (le navigateur bloque peut-être le stockage local). Essayez de désactiver la navigation privée ou les extensions de blocage.");return;}
    document.getElementById('um-nom').value='';
    document.getElementById('um-user').value='';
    document.getElementById('um-pass').value='';
    try{ajouterNotif('save','Utilisateur créé : '+nom,'@'+u+' — '+umLabelRole(role));}catch(e){}
    renderUtilisateurs();
  }catch(err){
    alert("Erreur lors de la création de l'utilisateur : "+(err&&err.message?err.message:err));
  }
}

function umEditerLigne(username){
  var users=getUsers();
  var u=users.find(function(x){return x.username===username;});
  var row=document.getElementById('um-row-'+username);
  if(!u||!row)return;
  row.innerHTML = '<td colspan="5"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;padding:6px 0">'
    + '<div class="fg" style="min-width:160px"><label>Nom complet</label><input type="text" id="um-edit-nom" value="'+esc(u.nom||'')+'"/></div>'
    + '<div class="fg" style="min-width:150px"><label>Rôle</label><select id="um-edit-role">'+permOptionsRoles(u.role)+'</select></div>'
    + '<button class="btn btn-sm btn-primary" onclick="umEnregistrerEdition(\''+username+'\')">Enregistrer</button>'
    + '<button class="btn btn-sm" onclick="renderUtilisateurs()">Annuler</button>'
    + '</div></td>';
}

function umEnregistrerEdition(username){
  var users=getUsers();
  var idx=users.findIndex(function(x){return x.username===username;});
  if(idx<0)return;
  var nom=(document.getElementById('um-edit-nom').value||'').trim();
  var role=document.getElementById('um-edit-role').value;
  if(!nom){alert('Le nom complet est requis.');return;}
  if(users[idx].role==='admin'&&role!=='admin'&&umNbAdminsActifs(users)<=1){
    alert("Impossible : c'est le dernier compte administrateur actif.");return;
  }
  users[idx].nom=nom; users[idx].role=role;
  saveUsers(users);
  if(window.CURRENT_USER && CURRENT_USER.username===username){
    CURRENT_USER=users[idx];
    sessionStorage.setItem('comptaia_session',JSON.stringify(CURRENT_USER));
  }
  renderUtilisateurs();
}

async function umReinitialiserMdp(username){
  var p=prompt('Nouveau mot de passe pour '+username+' (min. 6 caractères) :');
  if(p===null)return;
  p=p.trim();
  if(p.length<6){alert('Mot de passe trop court (min. 6 caractères).');return;}
  var users=getUsers();
  var idx=users.findIndex(function(x){return x.username===username;});
  if(idx<0)return;
  users[idx].passHash=await hashPass(p);
  saveUsers(users);
  alert('Mot de passe réinitialisé pour '+username+'.');
}

function umToggleActif(username){
  if(window.CURRENT_USER && CURRENT_USER.username===username){alert('Vous ne pouvez pas modifier votre propre statut.');return;}
  var users=getUsers();
  var idx=users.findIndex(function(x){return x.username===username;});
  if(idx<0)return;
  var nextActive = !(users[idx].active!==false);
  if(!nextActive && users[idx].role==='admin' && umNbAdminsActifs(users)<=1){
    alert("Impossible : c'est le dernier compte administrateur actif.");return;
  }
  users[idx].active = nextActive;
  saveUsers(users);
  renderUtilisateurs();
}

function umSupprimer(username){
  if(window.CURRENT_USER && CURRENT_USER.username===username){alert('Vous ne pouvez pas supprimer votre propre compte.');return;}
  var users=getUsers();
  var u=users.find(function(x){return x.username===username;});
  if(!u)return;
  if(u.role==='admin' && umNbAdminsActifs(users)<=1){alert("Impossible : c'est le dernier compte administrateur actif.");return;}
  if(!confirm('Supprimer définitivement le compte de '+(u.nom||u.username)+' ? Cette action est irréversible.'))return;
  users=users.filter(function(x){return x.username!==username;});
  saveUsers(users);
  renderUtilisateurs();
}

// Hook into the existing monkey-patched go(): render the table whenever the
// pane opens, and set its title (it has no entry in the base go()'s title map).
(function(){
  var _goUM = window.go;
  window.go = function(id, el){
    if(typeof _goUM === 'function') _goUM(id, el);
    if(id === 'utilisateurs'){
      var pt = document.getElementById('page-title'); if(pt) pt.textContent = 'Gestion des utilisateurs';
      renderUtilisateurs();
    }
  };
})();
