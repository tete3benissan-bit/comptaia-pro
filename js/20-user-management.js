// Gestion des utilisateurs (admin uniquement) — comptes réels via Supabase
// Auth + table "profiles" (voir supabase/migrations/0001_auth.sql), scopés à
// l'entreprise de l'admin par RLS. La création d'un nouveau compte passe par
// l'Edge Function invite-user (seule la clé service_role, jamais côté
// client, peut créer un compte auth.users pour quelqu'un d'autre).
//
// NOTE (limite honnête, Phase 1) : la suppression d'un compte est pour
// l'instant une désactivation (active=false), pas une suppression
// définitive de l'utilisateur Auth — ça nécessiterait une 2e Edge Function,
// pas encore construite.

var UM_SEARCH = '';
var UM_CACHE = [];

if(typeof window.esc!=='function'){
  window.esc=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');};
}
var esc=window.esc;

// Rôles, libellés et couleurs de badge sont centralisés dans js/22-permissions.js
async function umUsers(){
  var res=await supabaseClient.from('profiles').select('id,nom,email,role,active').order('nom');
  if(res.error){console.error('umUsers',res.error);return [];}
  return res.data||[];
}
function umIsAdmin(){ return permEstAdmin(); }
function umLabelRole(r){ return permLabelRole(r); }
function umNbAdminsActifs(users){ return users.filter(function(x){return x.role==='admin'&&x.active!==false;}).length; }

async function renderUtilisateurs(){
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
  if(roleSelect && !roleSelect.options.length) roleSelect.innerHTML=permOptionsRoles('');
  wrap.innerHTML = '<div style="text-align:center;color:var(--text-faint);padding:28px;font-style:italic">Chargement…</div>';
  var users = await umUsers();
  UM_CACHE = users;
  var q = UM_SEARCH.trim().toLowerCase();
  if(q) users = users.filter(function(u){ return (u.nom||'').toLowerCase().indexOf(q)>=0 || (u.email||'').toLowerCase().indexOf(q)>=0; });
  if(!users.length){ wrap.innerHTML = '<div style="text-align:center;color:var(--text-faint);padding:28px;font-style:italic">Aucun utilisateur trouvé</div>'; return; }
  var h = '<div class="table-wrap"><table><thead><tr><th>Nom complet</th><th>E-mail</th><th>Rôle</th><th>Statut</th><th></th></tr></thead><tbody>';
  users.forEach(function(u){
    var actif = u.active !== false;
    var isSelf = window.CURRENT_USER && CURRENT_USER.id === u.id;
    h += '<tr id="um-row-'+esc(u.id)+'">'
      + '<td>'+esc(u.nom||'—')+'</td>'
      + '<td>'+esc(u.email)+'</td>'
      + '<td><span class="badge '+permBadgeClass(u.role)+'">'+umLabelRole(u.role)+'</span></td>'
      + '<td><span class="badge '+(actif?'bg-green':'bg-red')+'">'+(actif?'Actif':'Désactivé')+'</span></td>'
      + '<td style="white-space:nowrap">'
      +   '<button class="btn btn-sm" onclick="umEditerLigne(\''+u.id+'\')">Modifier</button> '
      +   '<button class="btn btn-sm" onclick="umReinitialiserMdp(\''+u.id+'\')">Réinit. mdp</button> '
      +   '<button class="btn btn-sm" onclick="umToggleActif(\''+u.id+'\')"'+(isSelf?' disabled title="Vous ne pouvez pas modifier votre propre statut"':'')+'>'+(actif?'Désactiver':'Réactiver')+'</button>'
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
    var email=(document.getElementById('um-user').value||'').trim();
    var roleEl=document.getElementById('um-role');
    var role=roleEl?roleEl.value:'';
    if(!nom||!email){alert('Nom complet et e-mail requis.');return;}
    if(!role){alert("Aucun rôle sélectionné — rechargez la page et réessayez.");return;}
    var res=await supabaseClient.functions.invoke('invite-user',{body:{email:email,nom:nom,role:role}});
    if(res.error||(res.data&&res.data.error)){
      alert("Erreur lors de l'invitation : "+(res.data&&res.data.error?res.data.error:(res.error&&res.error.message?res.error.message:'inconnue')));
      return;
    }
    document.getElementById('um-nom').value='';
    document.getElementById('um-user').value='';
    try{ajouterNotif('save','Invitation envoyée : '+nom,email+' — '+umLabelRole(role));}catch(e){}
    renderUtilisateurs();
  }catch(err){
    alert("Erreur lors de la création de l'utilisateur : "+(err&&err.message?err.message:err));
  }
}

function umEditerLigne(id){
  var u=UM_CACHE.find(function(x){return x.id===id;});
  var row=document.getElementById('um-row-'+id);
  if(!u||!row)return;
  row.innerHTML = '<td colspan="5"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;padding:6px 0">'
    + '<div class="fg" style="min-width:160px"><label>Nom complet</label><input type="text" id="um-edit-nom" value="'+esc(u.nom||'')+'"/></div>'
    + '<div class="fg" style="min-width:150px"><label>Rôle</label><select id="um-edit-role">'+permOptionsRoles(u.role)+'</select></div>'
    + '<button class="btn btn-sm btn-primary" onclick="umEnregistrerEdition(\''+id+'\')">Enregistrer</button>'
    + '<button class="btn btn-sm" onclick="renderUtilisateurs()">Annuler</button>'
    + '</div></td>';
}

async function umEnregistrerEdition(id){
  var u=UM_CACHE.find(function(x){return x.id===id;});
  if(!u)return;
  var nom=(document.getElementById('um-edit-nom').value||'').trim();
  var role=document.getElementById('um-edit-role').value;
  if(!nom){alert('Le nom complet est requis.');return;}
  if(!role){alert('Choisissez un rôle avant d\'enregistrer.');return;}
  if(u.role==='admin'&&role!=='admin'&&umNbAdminsActifs(UM_CACHE)<=1){
    alert("Impossible : c'est le dernier compte administrateur actif.");return;
  }
  var res=await supabaseClient.from('profiles').update({nom:nom,role:role}).eq('id',id);
  if(res.error){alert('Échec de la mise à jour : '+res.error.message);return;}
  if(window.CURRENT_USER && CURRENT_USER.id===id){
    CURRENT_USER.nom=nom; CURRENT_USER.role=role;
  }
  renderUtilisateurs();
}

async function umReinitialiserMdp(id){
  var u=UM_CACHE.find(function(x){return x.id===id;});
  if(!u)return;
  if(!confirm('Envoyer un e-mail de réinitialisation de mot de passe à '+u.email+' ?'))return;
  var res=await supabaseClient.auth.resetPasswordForEmail(u.email);
  if(res.error){alert('Échec : '+res.error.message);return;}
  alert('E-mail de réinitialisation envoyé à '+u.email+'.');
}

async function umToggleActif(id){
  if(window.CURRENT_USER && CURRENT_USER.id===id){alert('Vous ne pouvez pas modifier votre propre statut.');return;}
  var u=UM_CACHE.find(function(x){return x.id===id;});
  if(!u)return;
  var nextActive = !(u.active!==false);
  if(!nextActive && u.role==='admin' && umNbAdminsActifs(UM_CACHE)<=1){
    alert("Impossible : c'est le dernier compte administrateur actif.");return;
  }
  var res=await supabaseClient.from('profiles').update({active:nextActive}).eq('id',id);
  if(res.error){alert('Échec de la mise à jour : '+res.error.message);return;}
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
