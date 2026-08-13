// ============================================
// CONFIGURATION SUPABASE
// ============================================
const SUPABASE_URL = 'https://hqiyraklzdmgqmytjjjo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hCFQ6GdF0AqQH32_qbKrkg_UJTbq70i';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// ============================================
// ÉTAT GLOBAL
// ============================================
const appState = {
  isAuthenticated: false,
  currentUser: null,
  profiles: [],
  judicialRecords: [],
  certifications: [],
  receipts: [],
  journal: [],
  settings: {},
  counters: {
    judicial: 0,
    certification: 0,
    receipts: 0,
    journal: 0
  },
  activeSection: 'dashboard'
};

// ============================================
// RÉFÉRENCES DOM
// ============================================
const elements = {
  // Messages
  judicialMessage: document.getElementById('judicial-message'),
  certificationMessage: document.getElementById('certification-message'),
  receiptMessage: document.getElementById('receipt-message'),
  settingsMessage: document.getElementById('settings-message'),
  
  // Conteneurs
  dashboardContainer: document.getElementById('dashboard-container'),
  judicialTableBody: document.getElementById('judicial-table-body'),
  certificationTableBody: document.getElementById('certification-table-body'),
  receiptTableBody: document.getElementById('receipt-table-body'),
  journalTableBody: document.getElementById('journal-table-body'),
  pendingUsersTableBody: document.getElementById('pending-users-table-body'),
  approvedUsersTableBody: document.getElementById('approved-users-table-body'),
  
  // Formulaires
  judicialForm: document.getElementById('judicial-form'),
  certificationForm: document.getElementById('certification-form'),
  receiptForm: document.getElementById('receipt-form'),
  settingsForm: document.getElementById('settings-form'),
  
  // Filtres judiciaires
  judicialFilter: document.getElementById('judicial-filter'),
  judicialStatusFilter: document.getElementById('judicial-status-filter'),
  judicialDateFrom: document.getElementById('judicial-date-from'),
  judicialDateTo: document.getElementById('judicial-date-to'),
  resetJudicialFilters: document.getElementById('reset-judicial-filters'),
  
  // Filtres certifications
  certificationFilter: document.getElementById('certification-filter'),
  certificationStatusFilter: document.getElementById('certification-status-filter'),
  certificationDateFrom: document.getElementById('certification-date-from'),
  certificationDateTo: document.getElementById('certification-date-to'),
  resetCertificationFilters: document.getElementById('reset-certification-filters'),
  
  // Filtres reçus
  receiptFilter: document.getElementById('receipt-filter'),
  receiptStatusFilter: document.getElementById('receipt-status-filter'),
  receiptDateFrom: document.getElementById('receipt-date-from'),
  receiptDateTo: document.getElementById('receipt-date-to'),
  resetReceiptFilters: document.getElementById('reset-receipt-filters'),
  
  // Filtres journal
  journalFilter: document.getElementById('journal-filter'),
  journalDateFrom: document.getElementById('journal-date-from'),
  journalDateTo: document.getElementById('journal-date-to'),
  resetJournalFilters: document.getElementById('reset-journal-filters'),
  
  // Boutons
  registerButton: document.getElementById('register-button'),
  logoutButton: document.getElementById('logout-button')
};

// ============================================
// OPTIONS DE FORMATAGE
// ============================================
const dateOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
};

// ============================================
// AUTHENTIFICATION
// ============================================

/**
 * Inscrit un nouvel utilisateur
 */
async function registerUser() {
  try {
    const name = document.getElementById('register-name')?.value.trim();
    const email = document.getElementById('register-email')?.value.trim();
    const password = document.getElementById('register-password')?.value;
    const role = document.getElementById('register-role')?.value || 'Utilisateur';

    if (!name || !email || !password) {
      showMessage(document.getElementById('register-message'), '❌ Tous les champs sont requis', 'error');
      return;
    }

    // Créer le compte auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }
      }
    });

    if (authError) throw authError;

    // Créer le profil (en attente d'approbation)
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert([{
        id: authData.user.id,
        name,
        email,
        role,
        status: 'En attente',
        created_at: new Date().toISOString()
      }]);

    if (profileError) throw profileError;

    showMessage(document.getElementById('register-message'), '✅ Compte créé. En attente d\'approbation.', 'success');
    
    // Basculer vers login
    setTimeout(() => {
      document.getElementById('register-screen')?.classList.add('hidden');
      document.getElementById('login-screen')?.classList.remove('hidden');
    }, 2000);

  } catch (err) {
    console.error('❌ Erreur inscription:', err);
    showMessage(document.getElementById('register-message'), `❌ Erreur : ${err.message}`, 'error');
  }
}

/**
 * Connecte un utilisateur
 */
async function loginUser() {
  try {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
      showMessage(document.getElementById('login-message'), '❌ Email et mot de passe requis', 'error');
      return;
    }

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    // Vérifier le statut du profil
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      throw new Error('Profil non trouvé');
    }

    if (profile.status !== 'Approuvé') {
      await supabaseClient.auth.signOut();
      throw new Error('Compte en attente d\'approbation');
    }

    appState.currentUser = { ...authData.user, ...profile };
    appState.isAuthenticated = true;

    await loadAppData();
    showSection('dashboard');
    console.log('✅ Connexion réussie:', profile.name);

  } catch (err) {
    console.error('❌ Erreur connexion:', err);
    showMessage(document.getElementById('login-message'), `❌ Erreur : ${err.message}`, 'error');
  }
}

/**
 * Déconnecte l'utilisateur
 */
async function logoutUser() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    // Réinitialiser l'état complet
    appState.isAuthenticated = false;
    appState.currentUser = null;
    appState.profiles = [];
    appState.judicialRecords = [];
    appState.certifications = [];
    appState.receipts = [];
    appState.journal = [];
    appState.settings = {};
    appState.counters = { judicial: 0, certification: 0, receipts: 0, journal: 0 };
    appState.activeSection = 'dashboard';

    // Masquer le contenu principal, afficher login
    document.querySelectorAll('.content-section').forEach(section => {
      section.style.display = 'none';
      section.classList.remove('active');
    });
    
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.style.display = 'block';
      loginScreen.classList.remove('hidden');
    }
    
    const registerScreen = document.getElementById('register-screen');
    if (registerScreen) {
      registerScreen.classList.add('hidden');
    }

    console.log('✅ Déconnexion réussie');

  } catch (err) {
    console.error('❌ Erreur déconnexion:', err);
  }
}

// ============================================
// GESTION DES PROFILS (ADMIN)
// ============================================

/**
 * Approuve un utilisateur en attente
 */
async function approveUser(id) {
  if (!isAdmin()) {
    console.warn('⛔ Accès refusé');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('profiles')
      .update({ status: 'Approuvé', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    await loadAppData();
    await logAction('Utilisateur', id, 'Approbation', 'Utilisateur approuvé');
    renderPendingUsersTable();
    renderApprovedUsersTable();
    showMessage(elements.settingsMessage, '✅ Utilisateur approuvé', 'success');

  } catch (err) {
    console.error('❌ Erreur approbation:', err);
    showMessage(elements.settingsMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}

/**
 * Rejette/supprime un utilisateur en attente
 */
async function rejectUser(id) {
  if (!isAdmin()) {
    console.warn('⛔ Accès refusé');
    return;
  }

  if (!confirm('Êtes-vous sûr de vouloir rejeter cet utilisateur ?')) return;

  try {
    // Supprimer le profil
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;

    // Tentative de suppression auth (peut échouer sans droits admin)
    try {
      await supabaseClient.auth.admin.deleteUser(id);
    } catch (adminErr) {
      console.warn('⚠️ Suppression auth non possible:', adminErr.message);
    }

    await loadAppData();
    await logAction('Utilisateur', id, 'Rejet', 'Utilisateur rejeté');
    renderPendingUsersTable();
    showMessage(elements.settingsMessage, '✅ Utilisateur rejeté', 'success');

  } catch (err) {
    console.error('❌ Erreur rejet:', err);
    showMessage(elements.settingsMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}

/**
 * Rend le tableau des utilisateurs en attente
 */
function renderPendingUsersTable() {
  if (!elements.pendingUsersTableBody) return;

  const pending = appState.profiles.filter(p => p.status === 'En attente');

  elements.pendingUsersTableBody.innerHTML = pending.length === 0 
    ? '<tr><td colspan="5">Aucun utilisateur en attente</td></tr>'
    : pending.map(p => `
      <tr>
        <td>${formatDate(p.created_at)}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.email)}</td>
        <td>${escapeHtml(p.role)}</td>
        <td>
          <button onclick="approveUser('${p.id}')" class="success-btn">✓ Approuver</button>
          <button onclick="rejectUser('${p.id}')" class="danger-btn">✗ Rejeter</button>
        </td>
      </tr>
    `).join('');
}

/**
 * Rend le tableau des utilisateurs approuvés
 */
function renderApprovedUsersTable() {
  if (!elements.approvedUsersTableBody) return;

  const approved = appState.profiles.filter(p => p.status === 'Approuvé');

  elements.approvedUsersTableBody.innerHTML = approved.length === 0
    ? '<tr><td colspan="5">Aucun utilisateur approuvé</td></tr>'
    : approved.map(p => `
      <tr>
        <td>${formatDate(p.created_at)}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.email)}</td>
        <td>${escapeHtml(p.role)}</td>
        <td>${p.id === appState.currentUser?.id ? 'Vous' : '-'}</td>
      </tr>
    `).join('');
}

// ============================================
// JOURNAL D'ACTIVITÉ
// ============================================

/**
 * Enregistre une action dans le journal
 */
async function logAction(entityType, entityId, action, description) {
  try {
    const { error } = await supabaseClient
      .from('modification_journal')
      .insert([{
        actor_id: appState.currentUser?.id,
        actor_name: appState.currentUser?.name || 'Système',
        entity_type: entityType,
        entity_id: String(entityId),
        action,
        description,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.warn('⚠️ Erreur journal:', error.message);
    }
  } catch (err) {
    console.warn('⚠️ Journal non enregistré:', err.message);
  }
}

// ============================================
// PARAMÈTRES DE L'APPLICATION
// ============================================

/**
 * Sauvegarde les paramètres - ✅ UTILISE 'app_settings'
 */
async function saveSettingsForm() {
  try {
    const settingsData = {
      institution: document.getElementById('settings-institution')?.value || 'Chancellerie Impériale',
      certification_display: 'Certification Impériale',
      year: new Date().getFullYear().toString(),
      updated_by: appState.currentUser.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseClient
      .from('app_settings')
      .update(settingsData)
      .eq('id', 1);

    if (error) throw error;

    await loadAppData();
    showMessage(elements.settingsMessage, '✅ Paramètres sauvegardés', 'success');
    await logAction('Paramètres', 'app_settings', 'Modification', 'Paramètres mis à jour');
  } catch (err) {
    console.error('❌ Erreur:', err);
    showMessage(elements.settingsMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}

// ============================================
// RENDU DES TABLEAUX - JUDICIAIRE
// ============================================

/**
 * Rend le tableau des enregistrements judiciaires
 */
function renderJudicialTable(records) {
  if (!elements.judicialTableBody) return;

  elements.judicialTableBody.innerHTML = records.length === 0
    ? '<tr><td colspan="10">Aucun enregistrement</td></tr>'
    : records.map(r => `
      <tr>
        <td>${escapeHtml(r.reference)}</td>
        <td>${escapeHtml(r.suspect)}</td>
        <td>${escapeHtml(r.magistrate) || 'N/A'}</td>
        <td>${formatDate(r.judgment_date)}</td>
        <td><span class="badge badge-${getQualificationClass(r.qualification)}">${escapeHtml(r.qualification)}</span></td>
        <td>${formatCurrency(r.fine_amount)}</td>
        <td>${escapeHtml(r.sentence_status)}</td>
        <td>${escapeHtml(r.fine_status)}</td>
        <td>${canEdit() ? `
          <button onclick="editJudicial('${r.id}')" class="edit-btn">✎</button>
          <button onclick="archiveJudicial('${r.id}')" class="archive-btn">📦</button>
          <button onclick="deleteJudicialConfirm('${r.id}')" class="delete-btn">🗑</button>
        ` : '-'}</td>
      </tr>
    `).join('');
}

function getQualificationClass(qualification) {
  const classes = {
    'Délit Mineur': 'info',
    'Délit Majeur': 'warning',
    'Crime': 'danger',
    'Infraction Administrative': 'secondary'
  };
  return classes[qualification] || 'default';
}

// ============================================
// RENDU DES TABLEAUX - CERTIFICATIONS
// ============================================

/**
 * Rend le tableau des certifications
 */
function renderCertificationTable(certifications) {
  if (!elements.certificationTableBody) return;

  elements.certificationTableBody.innerHTML = certifications.length === 0
    ? '<tr><td colspan="8">Aucune certification</td></tr>'
    : certifications.map(c => `
      <tr>
        <td>${escapeHtml(c.reference)}</td>
        <td>${escapeHtml(c.candidate_name)}</td>
        <td>${escapeHtml(c.instructor) || 'N/A'}</td>
        <td>${formatDate(c.training_date)}</td>
        <td>${escapeHtml(c.training_type)}</td>
        <td>${formatCurrency(c.amount)}</td>
        <td><span class="badge badge-${c.payment_status === 'Réglée' ? 'success' : c.payment_status === 'Partiellement réglée' ? 'warning' : 'danger'}">${escapeHtml(c.payment_status)}</span></td>
        <td>${canEdit() ? `
          <button onclick="editCertification('${c.id}')" class="edit-btn">✎</button>
          <button onclick="archiveCertification('${c.id}')" class="archive-btn">📦</button>
          <button onclick="deleteCertificationConfirm('${c.id}')" class="delete-btn">🗑</button>
        ` : '-'}</td>
      </tr>
    `).join('');
}

// ============================================
// RENDU DES TABLEAUX - REÇUS
// ============================================

/**
 * Rend le tableau des reçus
 */
function renderReceiptTable(receipts) {
  if (!elements.receiptTableBody) return;

  elements.receiptTableBody.innerHTML = receipts.length === 0
    ? '<tr><td colspan="10">Aucun reçu</td></tr>'
    : receipts.map(r => `
      <tr>
        <td>${formatDate(r.date)}</td>
        <td>${escapeHtml(r.reference)}</td>
        <td>${escapeHtml(r.dossier_type)}</td>
        <td>${escapeHtml(r.dossier_title) || 'N/A'}</td>
        <td>${escapeHtml(r.collector_name)}</td>
        <td>${formatCurrency(r.amount)}</td>
        <td>${escapeHtml(r.method)}</td>
        <td><span class="badge badge-${r.treasury_transferred ? 'success' : 'warning'}">${r.treasury_transferred ? '✓' : '○'}</span></td>
        <td><span class="badge badge-${r.chancellery_transferred ? 'success' : 'warning'}">${r.chancellery_transferred ? '✓' : '○'}</span></td>
        <td>${canEdit() ? `
          <button onclick="editReceipt('${r.id}')" class="edit-btn">✎</button>
          <button onclick="deleteReceiptConfirm('${r.id}')" class="delete-btn">🗑</button>
        ` : '-'}</td>
      </tr>
    `).join('');
}

// ============================================
// RENDU DES TABLEAUX - JOURNAL
// ============================================

/**
 * Rend le tableau du journal
 */
function renderJournalTable(entries) {
  if (!elements.journalTableBody) return;

  elements.journalTableBody.innerHTML = entries.length === 0
    ? '<tr><td colspan="5">Aucune entrée</td></tr>'
    : entries.map(j => `
      <tr>
        <td>${formatDate(j.created_at)}</td>
        <td>${escapeHtml(j.actor_name)}</td>
        <td>${escapeHtml(j.entity_type)}</td>
        <td><span class="badge badge-info">${escapeHtml(j.action)}</span></td>
        <td>${escapeHtml(j.description)}</td>
      </tr>
    `).join('');
}

// ============================================
// FORMULAIRES MODALES - JUDICIAIRE
// ============================================

/**
 * Édite un enregistrement judiciaire
 */
async function editJudicial(id) {
  const record = appState.judicialRecords.find(r => r.id === id);
  if (!record) return;

  showModal(`
    <form id="temp-judicial-form">
      <h3>Éditer un Enregistrement Judiciaire</h3>

      <div class="form-group">
        <label>Référence</label>
        <input type="text" name="reference" value="${escapeHtml(record.reference)}" required>
      </div>

      <div class="form-group">
        <label>Suspect/Accusé</label>
        <input type="text" name="suspect" value="${escapeHtml(record.suspect)}" required>
      </div>

      <div class="form-group">
        <label>Magistrat</label>
        <input type="text" name="magistrate" value="${escapeHtml(record.magistrate) || ''}">
      </div>

      <div class="form-group">
        <label>Date du Jugement</label>
        <input type="date" name="judgment_date" value="${record.judgment_date || ''}">
      </div>

      <div class="form-group">
        <label>Qualification/Crime</label>
        <select name="qualification" required>
          <option value="">-- Sélectionner --</option>
          <option value="Délit Mineur" ${record.qualification === 'Délit Mineur' ? 'selected' : ''}>Délit Mineur</option>
          <option value="Délit Majeur" ${record.qualification === 'Délit Majeur' ? 'selected' : ''}>Délit Majeur</option>
          <option value="Crime" ${record.qualification === 'Crime' ? 'selected' : ''}>Crime</option>
          <option value="Infraction Administrative" ${record.qualification === 'Infraction Administrative' ? 'selected' : ''}>Infraction Administrative</option>
        </select>
      </div>

      <div class="form-group">
        <label>Montant de l'Amende</label>
        <input type="number" name="fine_amount" value="${record.fine_amount || 0}" step="0.01" min="0">
      </div>

      <div class="form-group">
        <label>Sentence/Peine</label>
        <textarea name="sentence" required>${escapeHtml(record.sentence)}</textarea>
      </div>

      <div class="form-group">
        <label>Statut de la Sentence</label>
        <select name="sentence_status" required>
          <option value="Nouveau" ${record.sentence_status === 'Nouveau' ? 'selected' : ''}>Nouveau</option>
          <option value="En cours" ${record.sentence_status === 'En cours' ? 'selected' : ''}>En cours</option>
          <option value="Complétée" ${record.sentence_status === 'Complétée' ? 'selected' : ''}>Complétée</option>
          <option value="Suspendue" ${record.sentence_status === 'Suspendue' ? 'selected' : ''}>Suspendue</option>
        </select>
      </div>

      <div class="form-group">
        <label>Statut de l'Amende</label>
        <select name="fine_status">
          <option value="Non réglée" ${record.fine_status === 'Non réglée' ? 'selected' : ''}>Non réglée</option>
          <option value="Partiellement réglée" ${record.fine_status === 'Partiellement réglée' ? 'selected' : ''}>Partiellement réglée</option>
          <option value="Réglée" ${record.fine_status === 'Réglée' ? 'selected' : ''}>Réglée</option>
        </select>
      </div>

      <div class="form-group">
        <label>Référence du Jugement</label>
        <input type="text" name="judgment_reference" value="${escapeHtml(record.judgment_reference) || ''}">
      </div>

      <div class="form-group">
        <label>Lien du Jugement</label>
        <input type="url" name="judgment_link" value="${escapeHtml(record.judgment_link) || ''}">
      </div>

      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes">${escapeHtml(record.notes) || ''}</textarea>
      </div>

      <div class="form-buttons">
        <button type="submit" class="primary-btn">Enregistrer</button>
        <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `);

  document.getElementById('temp-judicial-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedRecord = {
      id: record.id,
      reference: formData.get('reference'),
      suspect: formData.get('suspect'),
      magistrate: formData.get('magistrate'),
      judgment_date: formData.get('judgment_date'),
      qualification: formData.get('qualification'),
      fine_amount: Number(formData.get('fine_amount')),
      sentence: formData.get('sentence'),
      sentence_status: formData.get('sentence_status'),
      fine_status: formData.get('fine_status'),
      judgment_reference: formData.get('judgment_reference'),
      judgment_link: formData.get('judgment_link'),
      notes: formData.get('notes'),
    };

    const success = await saveJudicialRecord(updatedRecord);
    if (success) {
      closeModal();
      showMessage(elements.judicialMessage, '✅ Enregistrement mis à jour', 'success');
      filterJudicial();
    } else {
      showMessage(elements.judicialMessage, '❌ Erreur lors de la sauvegarde', 'error');
    }
  });
}

/**
 * Crée un nouvel enregistrement judiciaire
 */
async function newJudicial() {
  showModal(`
    <form id="temp-judicial-form">
      <h3>Créer un Enregistrement Judiciaire</h3>

      <div class="form-group">
        <label>Référence</label>
        <input type="text" name="reference" value="JUD-${new Date().getFullYear()}-" required>
      </div>

      <div class="form-group">
        <label>Suspect/Accusé</label>
        <input type="text" name="suspect" required>
      </div>

      <div class="form-group">
        <label>Magistrat</label>
        <input type="text" name="magistrate">
      </div>

      <div class="form-group">
        <label>Date du Jugement</label>
        <input type="date" name="judgment_date">
      </div>

      <div class="form-group">
        <label>Qualification/Crime</label>
        <select name="qualification" required>
          <option value="">-- Sélectionner --</option>
          <option value="Délit Mineur">Délit Mineur</option>
          <option value="Délit Majeur">Délit Majeur</option>
          <option value="Crime">Crime</option>
          <option value="Infraction Administrative">Infraction Administrative</option>
        </select>
      </div>

      <div class="form-group">
        <label>Montant de l'Amende</label>
        <input type="number" name="fine_amount" value="0" step="0.01" min="0">
      </div>

      <div class="form-group">
        <label>Sentence/Peine</label>
        <textarea name="sentence" required></textarea>
      </div>

      <div class="form-group">
        <label>Statut de la Sentence</label>
        <select name="sentence_status" required>
          <option value="Nouveau" selected>Nouveau</option>
          <option value="En cours">En cours</option>
          <option value="Complétée">Complétée</option>
          <option value="Suspendue">Suspendue</option>
        </select>
      </div>

      <div class="form-group">
        <label>Statut de l'Amende</label>
        <select name="fine_status">
          <option value="Non réglée" selected>Non réglée</option>
          <option value="Partiellement réglée">Partiellement réglée</option>
          <option value="Réglée">Réglée</option>
        </select>
      </div>

      <div class="form-group">
        <label>Référence du Jugement</label>
        <input type="text" name="judgment_reference">
      </div>

      <div class="form-group">
        <label>Lien du Jugement</label>
        <input type="url" name="judgment_link">
      </div>

      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes"></textarea>
      </div>

      <div class="form-buttons">
        <button type="submit" class="primary-btn">Créer</button>
        <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `);

  document.getElementById('temp-judicial-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newRecord = {
      id: null,
      reference: formData.get('reference'),
      suspect: formData.get('suspect'),
      magistrate: formData.get('magistrate'),
      judgment_date: formData.get('judgment_date'),
      qualification: formData.get('qualification'),
      fine_amount: Number(formData.get('fine_amount')),
      sentence: formData.get('sentence'),
      sentence_status: formData.get('sentence_status'),
      fine_status: formData.get('fine_status'),
      judgment_reference: formData.get('judgment_reference'),
      judgment_link: formData.get('judgment_link'),
      notes: formData.get('notes'),
    };

    const success = await saveJudicialRecord(newRecord);
    if (success) {
      closeModal();
      showMessage(elements.judicialMessage, '✅ Enregistrement créé', 'success');
      filterJudicial();
    } else {
      showMessage(elements.judicialMessage, '❌ Erreur lors de la création', 'error');
    }
  });
}

/**
 * Archive un enregistrement judiciaire
 */
async function archiveJudicial(id) {
  if (!confirm('Êtes-vous sûr de vouloir archiver cet enregistrement ?')) return;

  try {
    const { error } = await supabaseClient
      .from('judicial_records')
      .update({ archived: true })
      .eq('id', id);

    if (error) throw error;

    await loadAppData();
    showMessage(elements.judicialMessage, '✅ Enregistrement archivé', 'success');
    await logAction('Dossier Judiciaire', id, 'Archivage', 'Dossier archivé');
    filterJudicial();
  } catch (err) {
    console.error('❌ Erreur:', err);
    showMessage(elements.judicialMessage, '❌ Erreur lors de l\'archivage', 'error');
  }
}

/**
 * Demande confirmation avant suppression d'un enregistrement judiciaire
 */
function deleteJudicialConfirm(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ? Cette action est irréversible.')) {
    deleteJudicial(id);
    showMessage(elements.judicialMessage, '✅ Enregistrement supprimé', 'success');
    filterJudicial();
  }
}

// ============================================
// FORMULAIRES MODALES - CERTIFICATIONS
// ============================================

/**
 * Édite une certification - ✅ CHAMPS CORRIGÉS
 */
async function editCertification(id) {
  const cert = appState.certifications.find(c => c.id === id);
  if (!cert) return;

  showModal(`
    <form id="temp-certification-form">
      <h3>Éditer une Certification</h3>

      <div class="form-group">
        <label>Référence</label>
        <input type="text" name="reference" value="${escapeHtml(cert.reference)}" required>
      </div>

      <div class="form-group">
        <label>Nom du Candidat</label>
        <input type="text" name="candidate_name" value="${escapeHtml(cert.candidate_name) || ''}" required>
      </div>

      <div class="form-group">
        <label>Instructeur</label>
        <input type="text" name="instructor" value="${escapeHtml(cert.instructor) || ''}">
      </div>

      <div class="form-group">
        <label>Date de Formation</label>
        <input type="date" name="training_date" value="${cert.training_date || ''}">
      </div>

      <div class="form-group">
        <label>Type de Formation</label>
        <select name="training_type" required>
          <option value="">-- Sélectionner --</option>
          <option value="Juridique" ${cert.training_type === 'Juridique' ? 'selected' : ''}>Juridique</option>
          <option value="Administrative" ${cert.training_type === 'Administrative' ? 'selected' : ''}>Administrative</option>
          <option value="Technique" ${cert.training_type === 'Technique' ? 'selected' : ''}>Technique</option>
          <option value="Autre" ${cert.training_type === 'Autre' ? 'selected' : ''}>Autre</option>
        </select>
      </div>

      <div class="form-group">
        <label>Montant</label>
        <input type="number" name="amount" value="${cert.amount || 0}" step="0.01" min="0">
      </div>

      <div class="form-group">
        <label>Statut du Paiement</label>
        <select name="payment_status" required>
          <option value="Non réglée" ${cert.payment_status === 'Non réglée' ? 'selected' : ''}>Non réglée</option>
          <option value="Partiellement réglée" ${cert.payment_status === 'Partiellement réglée' ? 'selected' : ''}>Partiellement réglée</option>
          <option value="Réglée" ${cert.payment_status === 'Réglée' ? 'selected' : ''}>Réglée</option>
        </select>
      </div>

      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes">${escapeHtml(cert.notes) || ''}</textarea>
      </div>

      <div class="form-buttons">
        <button type="submit" class="primary-btn">Enregistrer</button>
        <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `);

  document.getElementById('temp-certification-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedCert = {
      id: cert.id,
      reference: formData.get('reference'),
      candidate_name: formData.get('candidate_name'),
      instructor: formData.get('instructor'),
      training_date: formData.get('training_date'),
      training_type: formData.get('training_type'),
      amount: Number(formData.get('amount')),
      payment_status: formData.get('payment_status'),
      notes: formData.get('notes'),
    };

    const success = await saveCertification(updatedCert);
    if (success) {
      closeModal();
      showMessage(elements.certificationMessage, '✅ Certification mise à jour', 'success');
      filterCertification();
    } else {
      showMessage(elements.certificationMessage, '❌ Erreur lors de la sauvegarde', 'error');
    }
  });
}

/**
 * Crée une nouvelle certification
 */
async function newCertification() {
  showModal(`
    <form id="temp-certification-form">
      <h3>Créer une Certification</h3>

      <div class="form-group">
        <label>Référence</label>
        <input type="text" name="reference" value="CERT-${new Date().getFullYear()}-" required>
      </div>

      <div class="form-group">
        <label>Nom du Candidat</label>
        <input type="text" name="candidate_name" required>
      </div>

      <div class="form-group">
        <label>Instructeur</label>
        <input type="text" name="instructor">
      </div>

      <div class="form-group">
        <label>Date de Formation</label>
        <input type="date" name="training_date">
      </div>

      <div class="form-group">
        <label>Type de Formation</label>
        <select name="training_type" required>
          <option value="">-- Sélectionner --</option>
          <option value="Juridique">Juridique</option>
          <option value="Administrative">Administrative</option>
          <option value="Technique">Technique</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      <div class="form-group">
        <label>Montant</label>
        <input type="number" name="amount" value="0" step="0.01" min="0">
      </div>

      <div class="form-group">
        <label>Statut du Paiement</label>
        <select name="payment_status" required>
          <option value="Non réglée" selected>Non réglée</option>
          <option value="Partiellement réglée">Partiellement réglée</option>
          <option value="Réglée">Réglée</option>
        </select>
      </div>

      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes"></textarea>
      </div>

      <div class="form-buttons">
        <button type="submit" class="primary-btn">Créer</button>
        <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `);

  document.getElementById('temp-certification-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCert = {
      id: null,
      reference: formData.get('reference'),
      candidate_name: formData.get('candidate_name'),
      instructor: formData.get('instructor'),
      training_date: formData.get('training_date'),
      training_type: formData.get('training_type'),
      amount: Number(formData.get('amount')),
      payment_status: formData.get('payment_status'),
      notes: formData.get('notes'),
    };

    const success = await saveCertification(newCert);
    if (success) {
      closeModal();
      showMessage(elements.certificationMessage, '✅ Certification créée', 'success');
      filterCertification();
    } else {
      showMessage(elements.certificationMessage, '❌ Erreur lors de la création', 'error');
    }
  });
}

/**
 * Archive une certification
 */
async function archiveCertification(id) {
  if (!confirm('Êtes-vous sûr de vouloir archiver cette certification ?')) return;

  try {
    const { error } = await supabaseClient
      .from('certifications')
      .update({ archived: true })
      .eq('id', id);

    if (error) throw error;

    await loadAppData();
    showMessage(elements.certificationMessage, '✅ Certification archivée', 'success');
    await logAction('Certification', id, 'Archivage', 'Certification archivée');
    filterCertification();
  } catch (err) {
    console.error('❌ Erreur:', err);
    showMessage(elements.certificationMessage, '❌ Erreur lors de l\'archivage', 'error');
  }
}

/**
 * Demande confirmation avant suppression d'une certification
 */
function deleteCertificationConfirm(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette certification ? Cette action est irréversible.')) {
    deleteCertification(id);
    showMessage(elements.certificationMessage, '✅ Certification supprimée', 'success');
    filterCertification();
  }
}

// ============================================
// FORMULAIRES MODALES - REÇUS
// ============================================

/**
 * Édite un reçu - ✅ CHAMPS CORRIGÉS
 */
async function editReceipt(id) {
  const receipt = appState.receipts.find(r => r.id === id);
  if (!receipt) return;

  showModal(`
    <form id="temp-receipt-form">
      <h3>Éditer un Reçu</h3>

      <div class="form-group">
        <label>Date</label>
        <input type="date" name="date" value="${receipt.date}" required>
      </div>

      <div class="form-group">
        <label>Référence</label>
        <input type="text" name="reference" value="${escapeHtml(receipt.reference) || ''}" required>
      </div>

      <div class="form-group">
        <label>Type de Dossier</label>
        <input type="text" name="dossier_type" value="${escapeHtml(receipt.dossier_type) || ''}" required>
      </div>

      <div class="form-group">
        <label>Titre du Dossier</label>
        <input type="text" name="dossier_title" value="${escapeHtml(receipt.dossier_title) || ''}">
      </div>

      <div class="form-group">
        <label>Collecteur</label>
        <input type="text" name="collector_name" value="${escapeHtml(receipt.collector_name) || ''}" required>
      </div>

      <div class="form-group">
        <label>Montant Total</label>
        <input type="number" name="amount" value="${receipt.amount || 0}" step="0.01" min="0" required>
      </div>

      <div class="form-group">
        <label>Méthode de Paiement</label>
        <select name="method" required>
          <option value="Espèces" ${receipt.method === 'Espèces' ? 'selected' : ''}>Espèces</option>
          <option value="Chèque" ${receipt.method === 'Chèque' ? 'selected' : ''}>Chèque</option>
          <option value="Virement" ${receipt.method === 'Virement' ? 'selected' : ''}>Virement</option>
          <option value="Autre" ${receipt.method === 'Autre' ? 'selected' : ''}>Autre</option>
        </select>
      </div>

      <div class="form-group">
        <label>Pourcentage Trésor (%)</label>
        <input type="number" name="treasury_percent" value="${receipt.treasury_percent || 60}" min="0" max="100" step="1">
      </div>

      <div class="form-group">
        <label>Pourcentage Chancellerie (%)</label>
        <input type="number" name="chancellery_percent" value="${receipt.chancellery_percent || 40}" min="0" max="100" step="1">
      </div>

      <div class="form-group">
        <label>Montant Trésor</label>
        <input type="number" name="treasury_amount" value="${receipt.treasury_amount || 0}" step="0.01" min="0" readonly>
      </div>

      <div class="form-group">
        <label>Montant Chancellerie</label>
        <input type="number" name="chancellery_amount" value="${receipt.chancellery_amount || 0}" step="0.01" min="0" readonly>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" name="treasury_transferred" ${receipt.treasury_transferred ? 'checked' : ''}>
          Transféré au Trésor
        </label>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" name="chancellery_transferred" ${receipt.chancellery_transferred ? 'checked' : ''}>
          Transféré à la Chancellerie
        </label>
      </div>

      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes">${escapeHtml(receipt.notes) || ''}</textarea>
      </div>

      <div class="form-buttons">
        <button type="submit" class="primary-btn">Enregistrer</button>
        <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `);

  document.getElementById('temp-receipt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const amount = Number(formData.get('amount')) || 0;
    const treasuryPercent = Number(formData.get('treasury_percent')) || 60;
    const chancelleryPercent = 100 - treasuryPercent;

    const updatedReceipt = {
      id: receipt.id,
      date: formData.get('date'),
      reference: formData.get('reference'),
      dossier_type: formData.get('dossier_type'),
      dossier_title: formData.get('dossier_title'),
      collector_name: formData.get('collector_name'),
      amount: amount,
      method: formData.get('method'),
      treasury_percent: treasuryPercent,
      chancellery_percent: chancelleryPercent,
      treasury_amount: (amount * treasuryPercent) / 100,
      chancellery_amount: (amount * chancelleryPercent) / 100,
      treasury_transferred: formData.get('treasury_transferred') ? true : false,
      chancellery_transferred: formData.get('chancellery_transferred') ? true : false,
      notes: formData.get('notes'),
    };

    const success = await saveReceipt(updatedReceipt);
    if (success) {
      closeModal();
      showMessage(elements.receiptMessage, '✅ Reçu mis à jour', 'success');
      filterReceipt();
    } else {
      showMessage(elements.receiptMessage, '❌ Erreur lors de la sauvegarde', 'error');
    }
  });
}

/**
 * Crée un nouveau reçu
 */
async function newReceipt() {
  showModal(`
    <form id="temp-receipt-form">
      <h3>Créer un Reçu</h3>

      <div class="form-group">
        <label>Date</label>
        <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
      </div>

      <div class="form-group">
        <label>Référence</label>
        <input type="text" name="reference" value="RCP-${new Date().getFullYear()}-" required>
      </div>

      <div class="form-group">
        <label>Type de Dossier</label>
        <input type="text" name="dossier_type" required>
      </div>

      <div class="form-group">
        <label>Titre du Dossier</label>
        <input type="text" name="dossier_title">
      </div>

      <div class="form-group">
        <label>Collecteur</label>
        <input type="text" name="collector_name" required>
      </div>

      <div class="form-group">
        <label>Montant Total</label>
        <input type="number" name="amount" value="0" step="0.01" min="0" required>
      </div>

      <div class="form-group">
        <label>Méthode de Paiement</label>
        <select name="method" required>
          <option value="Espèces" selected>Espèces</option>
          <option value="Chèque">Chèque</option>
          <option value="Virement">Virement</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      <div class="form-group">
        <label>Pourcentage Trésor (%)</label>
        <input type="number" name="treasury_percent" value="60" min="0" max="100" step="1">
      </div>

      <div class="form-group">
        <label>Pourcentage Chancellerie (%)</label>
        <input type="number" name="chancellery_percent" value="40" min="0" max="100" step="1" readonly>
      </div>

      <div class="form-group">
        <label>Montant Trésor</label>
        <input type="number" name="treasury_amount" value="0" step="0.01" min="0" readonly>
      </div>

      <div class="form-group">
        <label>Montant Chancellerie</label>
        <input type="number" name="chancellery_amount" value="0" step="0.01" min="0" readonly>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" name="treasury_transferred">
          Transféré au Trésor
        </label>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" name="chancellery_transferred">
          Transféré à la Chancellerie
        </label>
      </div>

      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes"></textarea>
      </div>

      <div class="form-buttons">
        <button type="submit" class="primary-btn">Créer</button>
        <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
      </div>
    </form>
  `);

  document.getElementById('temp-receipt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const amount = Number(formData.get('amount')) || 0;
    const treasuryPercent = Number(formData.get('treasury_percent')) || 60;
    const chancelleryPercent = 100 - treasuryPercent;

    const newReceiptData = {
      id: null,
      date: formData.get('date'),
      reference: formData.get('reference'),
      dossier_type: formData.get('dossier_type'),
      dossier_title: formData.get('dossier_title'),
      collector_name: formData.get('collector_name'),
      amount: amount,
      method: formData.get('method'),
      treasury_percent: treasuryPercent,
      chancellery_percent: chancelleryPercent,
      treasury_amount: (amount * treasuryPercent) / 100,
      chancellery_amount: (amount * chancelleryPercent) / 100,
      treasury_transferred: formData.get('treasury_transferred') ? true : false,
      chancellery_transferred: formData.get('chancellery_transferred') ? true : false,
      notes: formData.get('notes'),
    };

    const success = await saveReceipt(newReceiptData);
    if (success) {
      closeModal();
      showMessage(elements.receiptMessage, '✅ Reçu créé', 'success');
      filterReceipt();
    } else {
      showMessage(elements.receiptMessage, '❌ Erreur lors de la création', 'error');
    }
  });
}

/**
 * Demande confirmation avant suppression d'un reçu
 */
function deleteReceiptConfirm(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce reçu ? Cette action est irréversible.')) {
    deleteReceipt(id);
    showMessage(elements.receiptMessage, '✅ Reçu supprimé', 'success');
    filterReceipt();
  }
}

// ============================================
// FONCTIONS DE SAUVEGARDE SUPABASE
// ============================================

/**
 * Sauvegarde un enregistrement judiciaire
 */
async function saveJudicialRecord(record) {
  try {
    if (record.id) {
      const { error } = await supabaseClient
        .from('judicial_records')
        .update({
          reference: record.reference,
          suspect: record.suspect,
          magistrate: record.magistrate,
          judgment_date: record.judgment_date,
          qualification: record.qualification,
          fine_amount: record.fine_amount,
          sentence: record.sentence,
          sentence_status: record.sentence_status,
          fine_status: record.fine_status,
          judgment_reference: record.judgment_reference,
          judgment_link: record.judgment_link,
          notes: record.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from('judicial_records')
        .insert([{
          reference: record.reference,
          suspect: record.suspect,
          magistrate: record.magistrate,
          judgment_date: record.judgment_date,
          qualification: record.qualification,
          fine_amount: record.fine_amount,
          sentence: record.sentence,
          sentence_status: record.sentence_status,
          fine_status: record.fine_status,
          judgment_reference: record.judgment_reference,
          judgment_link: record.judgment_link,
          notes: record.notes,
          created_by: appState.currentUser.id,
          created_at: new Date().toISOString(),
        }]);
      if (error) throw error;
    }

    await loadAppData();
    await logAction('Dossier Judiciaire', record.reference, record.id ? 'Modification' : 'Création', `Dossier : ${record.reference}`);
    return true;
  } catch (err) {
    console.error('❌ Erreur sauvegarde judiciaire:', err);
    return false;
  }
}

/**
 * Supprime un enregistrement judiciaire
 */
async function deleteJudicial(id) {
  try {
    const { error } = await supabaseClient
      .from('judicial_records')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await loadAppData();
    await logAction('Dossier Judiciaire', id, 'Suppression', 'Dossier supprimé');
    return true;
  } catch (err) {
    console.error('❌ Erreur suppression judiciaire:', err);
    return false;
  }
}

/**
 * Sauvegarde une certification - ✅ UTILISE 'certifications'
 */
async function saveCertification(cert) {
  try {
    if (cert.id) {
      const { error } = await supabaseClient
        .from('certifications')
        .update({
          reference: cert.reference,
          candidate_name: cert.candidate_name,
          instructor: cert.instructor,
          training_date: cert.training_date,
          training_type: cert.training_type,
          amount: cert.amount,
          payment_status: cert.payment_status,
          notes: cert.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cert.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from('certifications')
        .insert([{
          reference: cert.reference,
          candidate_name: cert.candidate_name,
          instructor: cert.instructor,
          training_date: cert.training_date,
          training_type: cert.training_type,
          amount: cert.amount,
          payment_status: cert.payment_status,
          notes: cert.notes,
          created_by: appState.currentUser.id,
          created_at: new Date().toISOString(),
        }]);
      if (error) throw error;
    }

    await loadAppData();
    await logAction('Certification', cert.reference, cert.id ? 'Modification' : 'Création', `Certification : ${cert.reference}`);
    return true;
  } catch (err) {
    console.error('❌ Erreur sauvegarde certification:', err);
    return false;
  }
}

/**
 * Supprime une certification
 */
async function deleteCertification(id) {
  try {
    const { error } = await supabaseClient
      .from('certifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await loadAppData();
    await logAction('Certification', id, 'Suppression', 'Certification supprimée');
    return true;
  } catch (err) {
    console.error('❌ Erreur suppression certification:', err);
    return false;
  }
}

/**
 * Sauvegarde un reçu - ✅ UTILISE 'receipts'
 */
async function saveReceipt(receipt) {
  try {
    if (receipt.id) {
      const { error } = await supabaseClient
        .from('receipts')
        .update({
          date: receipt.date,
          reference: receipt.reference,
          dossier_type: receipt.dossier_type,
          dossier_title: receipt.dossier_title,
          collector_name: receipt.collector_name,
          amount: receipt.amount,
          method: receipt.method,
          treasury_percent: receipt.treasury_percent,
          chancellery_percent: receipt.chancellery_percent,
          treasury_amount: receipt.treasury_amount,
          chancellery_amount: receipt.chancellery_amount,
          treasury_transferred: receipt.treasury_transferred,
          chancellery_transferred: receipt.chancellery_transferred,
          notes: receipt.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', receipt.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from('receipts')
        .insert([{
          date: receipt.date,
          reference: receipt.reference,
          dossier_type: receipt.dossier_type,
          dossier_title: receipt.dossier_title,
          collector_name: receipt.collector_name,
          amount: receipt.amount,
          method: receipt.method,
          treasury_percent: receipt.treasury_percent,
          chancellery_percent: receipt.chancellery_percent,
          treasury_amount: receipt.treasury_amount,
          chancellery_amount: receipt.chancellery_amount,
          treasury_transferred: receipt.treasury_transferred,
          chancellery_transferred: receipt.chancellery_transferred,
          notes: receipt.notes,
          created_by: appState.currentUser.id,
          created_at: new Date().toISOString(),
        }]);
      if (error) throw error;
    }

    await loadAppData();
    await logAction('Reçu', receipt.reference, receipt.id ? 'Modification' : 'Création', `Reçu : ${receipt.reference}`);
    return true;
  } catch (err) {
    console.error('❌ Erreur sauvegarde reçu:', err);
    return false;
  }
}

/**
 * Supprime un reçu
 */
async function deleteReceipt(id) {
  try {
    const { error } = await supabaseClient
      .from('receipts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await loadAppData();
    await logAction('Reçu', id, 'Suppression', 'Reçu supprimé');
    return true;
  } catch (err) {
    console.error('❌ Erreur suppression reçu:', err);
    return false;
  }
}

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

/**
 * Charge toutes les données depuis Supabase - ✅ TABLES CORRIGÉES
 */
async function loadAppData() {
  if (!appState.currentUser) {
    console.log('❌ Pas d\'utilisateur connecté');
    return;
  }

  console.log('📊 Chargement des données pour:', appState.currentUser.email, 'ID:', appState.currentUser.id);

  try {
    // Charger les enregistrements judiciaires
    const { data: judicial, error: judicialError } = await supabaseClient
      .from('judicial_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (judicialError) {
      console.warn('⚠️ Erreur judicial_records:', judicialError.message);
    } else {
      appState.judicialRecords = judicial || [];
      appState.counters.judicial = appState.judicialRecords.length;
      console.log('✅ Enregistrements judiciaires chargés:', appState.judicialRecords.length);
    }

    // Charger les certifications
    const { data: certifications, error: certificationsError } = await supabaseClient
      .from('certifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (certificationsError) {
      console.warn('⚠️ Erreur certifications:', certificationsError.message);
    } else {
      appState.certifications = certifications || [];
      appState.counters.certification = appState.certifications.length;
      console.log('✅ Certifications chargées:', appState.certifications.length);
    }

    // Charger les reçus
    const { data: receipts, error: receiptsError } = await supabaseClient
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });

    if (receiptsError) {
      console.warn('⚠️ Erreur receipts:', receiptsError.message);
    } else {
      appState.receipts = receipts || [];
      appState.counters.receipts = appState.receipts.length;
      console.log('✅ Reçus chargés:', appState.receipts.length);
    }

    // Charger les profils (admin seulement)
    if (isAdmin()) {
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.warn('⚠️ Erreur profiles:', profilesError.message);
      } else {
        appState.profiles = profiles || [];
        console.log('✅ Profils chargés:', appState.profiles.length);
      }
    }

    // Charger le journal
    const { data: journal, error: journalError } = await supabaseClient
      .from('modification_journal')
      .select('*')
      .order('created_at', { ascending: false });

    if (journalError) {
      console.warn('⚠️ Erreur modification_journal:', journalError.message);
    } else {
      appState.journal = journal || [];
      appState.counters.journal = appState.journal.length;
      console.log('✅ Journal chargé:', appState.journal.length);
    }

    // Charger les paramètres
    const { data: settings, error: settingsError } = await supabaseClient
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsError) {
      console.warn('⚠️ Erreur app_settings:', settingsError.message);
    } else if (settings) {
      appState.settings = settings;
      console.log('✅ Paramètres chargés');
    }

    // Afficher le dashboard
    renderDashboard();
    console.log('✅ Chargement complet réussi');

  } catch (err) {
    console.error('❌ Erreur critique lors du chargement:', err);
  }
}

// ============================================
// FILTRAGE ET RECHERCHE
// ============================================

/**
 * Filtre les enregistrements judiciaires
 */
function filterJudicial() {
  const searchTerm = elements.judicialFilter?.value.toLowerCase() || '';
  const statusFilter = elements.judicialStatusFilter?.value || '';
  const dateFrom = elements.judicialDateFrom?.value || '';
  const dateTo = elements.judicialDateTo?.value || '';

  let filtered = appState.judicialRecords.filter(r => !r.archived);

  if (searchTerm) {
    filtered = filtered.filter(r =>
      (r.reference?.toLowerCase().includes(searchTerm)) ||
      (r.suspect?.toLowerCase().includes(searchTerm)) ||
      (r.magistrate?.toLowerCase().includes(searchTerm))
    );
  }

  if (statusFilter) {
    filtered = filtered.filter(r => r.sentence_status === statusFilter);
  }

  if (dateFrom) {
    filtered = filtered.filter(r => new Date(r.judgment_date) >= new Date(dateFrom));
  }

  if (dateTo) {
    filtered = filtered.filter(r => new Date(r.judgment_date) <= new Date(dateTo));
  }

  renderJudicialTable(filtered);
}

/**
 * Filtre les certifications
 */
function filterCertification() {
  const searchTerm = elements.certificationFilter?.value.toLowerCase() || '';
  const statusFilter = elements.certificationStatusFilter?.value || '';
  const dateFrom = elements.certificationDateFrom?.value || '';
  const dateTo = elements.certificationDateTo?.value || '';

  let filtered = appState.certifications.filter(c => !c.archived);

  if (searchTerm) {
    filtered = filtered.filter(c =>
      (c.reference?.toLowerCase().includes(searchTerm)) ||
      (c.candidate_name?.toLowerCase().includes(searchTerm)) ||
      (c.instructor?.toLowerCase().includes(searchTerm))
    );
  }

  if (statusFilter) {
    filtered = filtered.filter(c => c.payment_status === statusFilter);
  }

  if (dateFrom) {
    filtered = filtered.filter(c => new Date(c.training_date) >= new Date(dateFrom));
  }

  if (dateTo) {
    filtered = filtered.filter(c => new Date(c.training_date) <= new Date(dateTo));
  }

  renderCertificationTable(filtered);
}

/**
 * Filtre les reçus
 */
function filterReceipt() {
  const searchTerm = elements.receiptFilter?.value.toLowerCase() || '';
  const statusFilter = elements.receiptStatusFilter?.value || '';
  const dateFrom = elements.receiptDateFrom?.value || '';
  const dateTo = elements.receiptDateTo?.value || '';

  let filtered = appState.receipts;

  if (searchTerm) {
    filtered = filtered.filter(r =>
      (r.reference?.toLowerCase().includes(searchTerm)) ||
      (r.dossier_type?.toLowerCase().includes(searchTerm)) ||
      (r.collector_name?.toLowerCase().includes(searchTerm))
    );
  }

  if (statusFilter) {
    filtered = filtered.filter(r => r.method === statusFilter);
  }

  if (dateFrom) {
    filtered = filtered.filter(r => new Date(r.date) >= new Date(dateFrom));
  }

  if (dateTo) {
    filtered = filtered.filter(r => new Date(r.date) <= new Date(dateTo));
  }

  renderReceiptTable(filtered);
}

/**
 * Filtre le journal
 */
function filterJournal() {
  const searchTerm = elements.journalFilter?.value.toLowerCase() || '';
  const dateFrom = elements.journalDateFrom?.value || '';
  const dateTo = elements.journalDateTo?.value || '';

  let filtered = appState.journal;

  if (searchTerm) {
    filtered = filtered.filter(j =>
      (j.actor_name?.toLowerCase().includes(searchTerm)) ||
      (j.action?.toLowerCase().includes(searchTerm)) ||
      (j.description?.toLowerCase().includes(searchTerm))
    );
  }

  if (dateFrom) {
    filtered = filtered.filter(j => new Date(j.created_at) >= new Date(dateFrom));
  }

  if (dateTo) {
    filtered = filtered.filter(j => new Date(j.created_at) <= new Date(dateTo));
  }

  renderJournalTable(filtered);
}

// ============================================
// UTILITAIRES - FORMATAGE
// ============================================

/**
 * Formate une date en DD/MM/YYYY
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', dateOptions);
  } catch {
    return 'N/A';
  }
}

/**
 * Formate une devise en Septims
 */
function formatCurrency(amount) {
  if (!amount && amount !== 0) return '0 Septims';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('€', 'Septims');
}

/**
 * Échappe les caractères HTML pour éviter XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Affiche un message temporaire
 */
function showMessage(element, message, type = 'info') {
  if (!element) return;
  element.textContent = message;
  element.className = `message message-${type}`;
  element.style.display = 'block';
  
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

// ============================================
// DASHBOARD
// ============================================

/**
 * Rend le tableau de bord - ✅ STATISTIQUES CORRIGÉES
 */
function renderDashboard() {
  if (!elements.dashboardContainer) return;

  const judicialCount = appState.judicialRecords.filter(r => !r.archived).length;
  const certificationCount = appState.certifications.filter(c => !c.archived).length;
  const totalReceipts = appState.receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const treasuryTotal = appState.receipts.reduce((sum, r) => sum + (r.treasury_amount || 0), 0);
  const chancelleryTotal = appState.receipts.reduce((sum, r) => sum + (r.chancellery_amount || 0), 0);

  elements.dashboardContainer.innerHTML = `
    <div class="dashboard-header">
      <h2>📋 Tableau de B
            <h2>📋 Tableau de Bord</h2>
      <p>Bienvenue, ${appState.currentUser?.name || 'Utilisateur'}</p>
    </div>

    <div class="dashboard-stats">
      <div class="stat-card">
        <h3>📁 Dossiers Judiciaires</h3>
        <p class="stat-number">${judicialCount}</p>
        <a href="#" data-section="judicial" class="stat-link">Voir les dossiers</a>
      </div>

      <div class="stat-card">
        <h3>📜 Certifications</h3>
        <p class="stat-number">${certificationCount}</p>
        <a href="#" data-section="certification" class="stat-link">Voir les certifications</a>
      </div>

      <div class="stat-card">
        <h3>💰 Total Reçus</h3>
        <p class="stat-number">${formatCurrency(totalReceipts)}</p>
        <a href="#" data-section="payments" class="stat-link">Voir les reçus</a>
      </div>

      <div class="stat-card">
        <h3>🏛️ Trésor Impérial</h3>
        <p class="stat-number">${formatCurrency(treasuryTotal)}</p>
      </div>

      <div class="stat-card">
        <h3>📚 Chancellerie</h3>
        <p class="stat-number">${formatCurrency(chancelleryTotal)}</p>
      </div>

      <div class="stat-card">
        <h3>👥 Utilisateurs</h3>
        <p class="stat-number">${isAdmin() ? appState.profiles.filter(p => p.status === 'Approuvé').length : 'N/A'}</p>
        ${isAdmin() ? '<a href="#" data-section="users" class="stat-link">Gérer les utilisateurs</a>' : ''}
      </div>
    </div>

    <div class="dashboard-recent">
      <h3>📝 Dernières Actions</h3>
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Acteur</th>
            <th>Action</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${appState.journal.slice(0, 10).map(entry => `
            <tr>
              <td>${formatDate(entry.created_at)}</td>
              <td>${escapeHtml(entry.actor_name) || 'Système'}</td>
              <td>${escapeHtml(entry.action) || 'N/A'}</td>
              <td>${escapeHtml(entry.description) || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Ajouter les event listeners pour la navigation
  document.querySelectorAll('[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      showSection(section);
    });
  });
}

// ============================================
// SECTIONS ET NAVIGATION
// ============================================

/**
 * Affiche une section et masque les autres
 */
function showSection(sectionName) {
  appState.activeSection = sectionName;

  // Masquer toutes les sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
    section.classList.remove('active');
  });

  // Retirer la classe active des boutons de nav
  document.querySelectorAll('.nav-btn, [data-section]').forEach(btn => {
    btn.classList.remove('active');
  });

  // Afficher la section sélectionnée
  const activeElement = document.getElementById(sectionName);
  if (activeElement) {
    activeElement.style.display = 'block';
    activeElement.classList.add('active');
  } else {
    console.error(`❌ Section introuvable : ${sectionName}`);
  }

  // Activer le bouton de navigation correspondant
  const navBtn = document.querySelector(`[data-section="${sectionName}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Initialiser le contenu spécifique
  switch (sectionName) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'judicial':
      filterJudicial();
      break;
    case 'certification':
      filterCertification();
      break;
    case 'payments':
      filterReceipt();
      break;
    case 'journal':
      filterJournal();
      break;
    case 'users':
      if (isAdmin()) {
        renderPendingUsersTable();
        renderApprovedUsersTable();
      } else {
        showSection('dashboard');
      }
      break;
    case 'settings':
      renderSettings();
      break;
  }
}

/**
 * Réinitialise les filtres d'une section
 */
function resetFilters(section) {
  if (section.includes('judicial')) {
    if (elements.judicialFilter) elements.judicialFilter.value = '';
    if (elements.judicialStatusFilter) elements.judicialStatusFilter.value = '';
    if (elements.judicialDateFrom) elements.judicialDateFrom.value = '';
    if (elements.judicialDateTo) elements.judicialDateTo.value = '';
    filterJudicial();
  } else if (section.includes('certification')) {
    if (elements.certificationFilter) elements.certificationFilter.value = '';
    if (elements.certificationStatusFilter) elements.certificationStatusFilter.value = '';
    if (elements.certificationDateFrom) elements.certificationDateFrom.value = '';
    if (elements.certificationDateTo) elements.certificationDateTo.value = '';
    filterCertification();
  } else if (section.includes('payments')) {
    if (elements.receiptFilter) elements.receiptFilter.value = '';
    if (elements.receiptStatusFilter) elements.receiptStatusFilter.value = '';
    if (elements.receiptDateFrom) elements.receiptDateFrom.value = '';
    if (elements.receiptDateTo) elements.receiptDateTo.value = '';
    filterReceipt();
  } else if (section.includes('journal')) {
    if (elements.journalFilter) elements.journalFilter.value = '';
    if (elements.journalDateFrom) elements.journalDateFrom.value = '';
    if (elements.journalDateTo) elements.journalDateTo.value = '';
    filterJournal();
  }
}

// ============================================
// PARAMÈTRES
// ============================================

/**
 * Rend la section des paramètres
 */
function renderSettings() {
  if (!elements.settingsForm) return;

  elements.settingsForm.innerHTML = `
    <div class="settings-container">
      <h2>⚙️ Paramètres de la Chancellerie</h2>

      <div class="form-group">
        <label>Nom de l'Institution</label>
        <input type="text" id="settings-institution" value="${escapeHtml(appState.settings.institution) || 'Chancellerie Impériale'}" placeholder="Nom de l'institution">
      </div>

      <div class="form-group">
        <label>Année</label>
        <input type="text" id="settings-year" value="${appState.settings.year || new Date().getFullYear()}" placeholder="Année">
      </div>

      <div class="form-buttons">
        <button type="button" onclick="saveSettingsForm()" class="primary-btn">✅ Enregistrer</button>
      </div>
    </div>
  `;
}

// ============================================
// GESTION DES MODALES
// ============================================

/**
 * Affiche une modale avec le contenu fourni
 */
function showModal(content) {
  let modal = document.getElementById('global-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'global-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content">
      <button type="button" class="modal-close" onclick="closeModal()">✕</button>
      ${content}
    </div>
  `;

  modal.style.display = 'flex';
  
  // Fermer en cliquant sur l'overlay
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Focus trap pour accessibilité
  const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

/**
 * Ferme la modale
 */
function closeModal() {
  const modal = document.getElementById('global-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.innerHTML = '';
  }
}

// ============================================
// UTILITAIRES DE PERMISSION
// ============================================

/**
 * Vérifie si l'utilisateur est administrateur
 */
function isAdmin() {
  return appState.currentUser?.role === 'Administrateur';
}

/**
 * Vérifie si l'utilisateur peut éditer
 */
function canEdit() {
  return ['Administrateur', 'Scribe', 'Magistrat'].includes(appState.currentUser?.role);
}

/**
 * Vérifie si l'utilisateur peut approuver
 */
function canApprove() {
  return isAdmin();
}

// ============================================
// FONCTIONS SUPPLÉMENTAIRES DE MANIPULATION
// ============================================

/**
 * Archive un enregistrement judiciaire (soft delete)
 */
async function archiveJudicial(id) {
  if (!canEdit()) {
    showMessage(elements.judicialMessage, '⛔ Permission insuffisante', 'error');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('judicial_records')
      .update({ 
        archived: true, 
        archived_at: new Date().toISOString(),
        archived_by: appState.currentUser.id 
      })
      .eq('id', id);

    if (error) throw error;

    await loadAppData();
    await logAction('Dossier Judiciaire', id, 'Archivage', 'Dossier archivé');
    showMessage(elements.judicialMessage, '✅ Dossier archivé', 'success');
    filterJudicial();

  } catch (err) {
    console.error('❌ Erreur archivage:', err);
    showMessage(elements.judicialMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}

/**
 * Archive une certification (soft delete)
 */
async function archiveCertification(id) {
  if (!canEdit()) {
    showMessage(elements.certificationMessage, '⛔ Permission insuffisante', 'error');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('certifications')
      .update({ 
        archived: true, 
        archived_at: new Date().toISOString(),
        archived_by: appState.currentUser.id 
      })
      .eq('id', id);

    if (error) throw error;

    await loadAppData();
    await logAction('Certification', id, 'Archivage', 'Certification archivée');
    showMessage(elements.certificationMessage, '✅ Certification archivée', 'success');
    filterCertification();

  } catch (err) {
    console.error('❌ Erreur archivage:', err);
    showMessage(elements.certificationMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}

/**
 * Confirme la suppression d'un enregistrement judiciaire
 */
function deleteJudicialConfirm(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce dossier ? Cette action est irréversible.')) {
    return;
  }
  
  deleteJudicial(id).then(success => {
    if (success) {
      showMessage(elements.judicialMessage, '✅ Dossier supprimé', 'success');
      filterJudicial();
    } else {
      showMessage(elements.judicialMessage, '❌ Erreur lors de la suppression', 'error');
    }
  });
}

/**
 * Confirme la suppression d'une certification
 */
function deleteCertificationConfirm(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette certification ? Cette action est irréversible.')) {
    return;
  }
  
  deleteCertification(id).then(success => {
    if (success) {
      showMessage(elements.certificationMessage, '✅ Certification supprimée', 'success');
      filterCertification();
    } else {
      showMessage(elements.certificationMessage, '❌ Erreur lors de la suppression', 'error');
    }
  });
}

// ============================================
// INITIALISATION - POINT D'ENTRÉE PRINCIPAL
// ============================================

let authStateInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Application Chancellerie Impériale initialisée');
  
  // ========== CORRECTION CRITIQUE : Récupérer la session existante ==========
  try {
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erreur récupération session:', sessionError.message);
    }
    
    if (session) {
      console.log('📌 Session existante détectée:', session.user.id);
      
      authStateInitialized = true;
      appState.currentUser = session.user;
      appState.isAuthenticated = true;
      
      // Charger le profil complet
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ Erreur chargement profil:', profileError.message);
        // Continuer avec les données de base
      } else if (profile) {
        appState.currentUser = { ...appState.currentUser, ...profile };
        console.log('✅ Profil restauré:', profile.name, '- Rôle:', profile.role);
      }
      
      if (appState.currentUser?.status === 'Approuvé') {
        await loadAppData();
        showSection('dashboard');
      } else {
        console.warn('⛔ Compte non approuvé');
        await supabaseClient.auth.signOut();
        appState.isAuthenticated = false;
        appState.currentUser = null;
      }
    } else {
      console.log('ℹ️ Aucune session existante - affichage écran de connexion');
    }
  } catch (initErr) {
    console.error('❌ Erreur critique initialisation:', initErr);
  }
  // ========== FIN CORRECTION CRITIQUE ==========

  // Écouter les changements futurs d'authentification
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log('🔔 Événement auth:', event);
    
    // Éviter le double traitement
    if (event === 'INITIAL_SESSION' && authStateInitialized) {
      console.log('⏩ Événement INITIAL_SESSION déjà traité, ignoré');
      return;
    }
    
    if (event === 'INITIAL_SESSION' && session) {
      authStateInitialized = true;
      // Déjà géré par getSession() ci-dessus
      return;
    }

    if (event === 'SIGNED_IN' && session) {
      authStateInitialized = true;
      appState.currentUser = session.user;
      appState.isAuthenticated = true;
      
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Erreur profil:', error.message);
        return;
      }

      if (profile) {
        appState.currentUser = { ...appState.currentUser, ...profile };
        console.log('✅ Profil chargé après connexion:', profile.name);
        
        if (profile.status === 'Approuvé') {
          await loadAppData();
          showSection('dashboard');
        } else {
          showMessage(document.getElementById('login-message'), '⛔ Compte en attente d\'approbation', 'warning');
          await supabaseClient.auth.signOut();
        }
      } else {
        console.warn('⚠️ Profil non trouvé pour cet utilisateur');
        appState.isAuthenticated = false;
        appState.currentUser = null;
      }
    } 
    
    else if (event === 'SIGNED_OUT') {
      authStateInitialized = false;
      appState.isAuthenticated = false;
      appState.currentUser = null;
      console.log('❌ Utilisateur déconnecté');
      
      // Redirection vers login
      document.querySelectorAll('.content-section').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
      });
      
      const loginScreen = document.getElementById('login-screen');
      if (loginScreen) {
        loginScreen.style.display = 'block';
        loginScreen.classList.remove('hidden');
      }
    } 
    
    else if (event === 'TOKEN_REFRESHED') {
      console.log('🔄 Token rafraîchi');
    } 
    
    else if (event === 'USER_UPDATED') {
      console.log('👤 Utilisateur mis à jour');
      // Recharger le profil si nécessaire
      if (session?.user) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) {
          appState.currentUser = { ...appState.currentUser, ...profile };
        }
      }
    }
  });

  // ============================================
  // Écouteurs d'événements - Formulaires
  // ============================================
  if (elements.registerButton) {
    elements.registerButton.addEventListener('click', registerUser);
  }

  if (elements.logoutButton) {
    elements.logoutButton.addEventListener('click', logoutUser);
  }

  if (elements.judicialForm) {
    elements.judicialForm.addEventListener('submit', (e) => {
      e.preventDefault();
      newJudicial();
    });
  }

  if (elements.certificationForm) {
    elements.certificationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      newCertification();
    });
  }

  if (elements.receiptForm) {
    elements.receiptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      newReceipt();
    });
  }

  // ============================================
  // Écouteurs d'événements - Navigation Auth
  // ============================================
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('login-screen')?.classList.add('hidden');
      document.getElementById('register-screen')?.classList.remove('hidden');
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('register-screen')?.classList.add('hidden');
      document.getElementById('login-screen')?.classList.remove('hidden');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await loginUser();
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await registerUser();
    });
  }

  // ============================================
  // Écouteurs d'événements - Filtres judiciaires
  // ============================================
  if (elements.judicialFilter) {
    elements.judicialFilter.addEventListener('input', debounce(filterJudicial, 300));
  }
  if (elements.judicialStatusFilter) {
    elements.judicialStatusFilter.addEventListener('change', filterJudicial);
  }
  if (elements.judicialDateFrom) {
    elements.judicialDateFrom.addEventListener('change', filterJudicial);
  }
  if (elements.judicialDateTo) {
    elements.judicialDateTo.addEventListener('change', filterJudicial);
  }
  if (elements.resetJudicialFilters) {
    elements.resetJudicialFilters.addEventListener('click', () => resetFilters('judicial'));
  }

  // ============================================
  // Écouteurs d'événements - Filtres certifications
  // ============================================
  if (elements.certificationFilter) {
    elements.certificationFilter.addEventListener('input', debounce(filterCertification, 300));
  }
  if (elements.certificationStatusFilter) {
    elements.certificationStatusFilter.addEventListener('change', filterCertification);
  }
  if (elements.certificationDateFrom) {
    elements.certificationDateFrom.addEventListener('change', filterCertification);
  }
  if (elements.certificationDateTo) {
    elements.certificationDateTo.addEventListener('change', filterCertification);
  }
  if (elements.resetCertificationFilters) {
    elements.resetCertificationFilters.addEventListener('click', () => resetFilters('certification'));
  }

  // ============================================
  // Écouteurs d'événements - Filtres reçus
  // ============================================
  if (elements.receiptFilter) {
    elements.receiptFilter.addEventListener('input', debounce(filterReceipt, 300));
  }
  if (elements.receiptStatusFilter) {
    elements.receiptStatusFilter.addEventListener('change', filterReceipt);
  }
  if (elements.receiptDateFrom) {
    elements.receiptDateFrom.addEventListener('change', filterReceipt);
  }
  if (elements.receiptDateTo) {
    elements.receiptDateTo.addEventListener('change', filterReceipt);
  }
  if (elements.resetReceiptFilters) {
    elements.resetReceiptFilters.addEventListener('click', () => resetFilters('payments'));
  }

  // ============================================
  // Écouteurs d'événements - Filtres journal
  // ============================================
  if (elements.journalFilter) {
    elements.journalFilter.addEventListener('input', debounce(filterJournal, 300));
  }
  if (elements.journalDateFrom) {
    elements.journalDateFrom.addEventListener('change', filterJournal);
  }
  if (elements.journalDateTo) {
    elements.journalDateTo.addEventListener('change', filterJournal);
  }
  if (elements.resetJournalFilters) {
    elements.resetJournalFilters.addEventListener('click', () => resetFilters('journal'));
  }

  console.log('✅ Tous les écouteurs d\'événements sont en place');
});

// ============================================
// UTILITAIRES GLOBAUX
// ============================================

/**
 * Debounce pour limiter les appels fréquents
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Expose les fonctions nécessaires globalement pour les onclick inline
 */
window.newJudicial = newJudicial;
window.newCertification = newCertification;
window.newReceipt = newReceipt;
window.editJudicial = editJudicial;
window.editCertification = editCertification;
window.editReceipt = editReceipt;
window.deleteJudicialConfirm = deleteJudicialConfirm;
window.deleteCertificationConfirm = deleteCertificationConfirm;
window.deleteReceiptConfirm = deleteReceiptConfirm;
window.archiveJudicial = archiveJudicial;
window.archiveCertification = archiveCertification;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.saveSettingsForm = saveSettingsForm;
window.closeModal = closeModal;
window.resetFilters = resetFilters;
// ============================================
// FONCTIONS DE GESTION DES UTILISATEURS (suite)
// ============================================

/**
 * Affiche les détails d'un utilisateur dans une modale
 */
function showUserDetails(userId) {
  const user = appState.profiles.find(p => p.id === userId);
  if (!user) {
    showMessage(document.getElementById('users-message'), '❌ Utilisateur non trouvé', 'error');
    return;
  }

  const content = `
    <div class="user-detail-modal">
      <h3>📋 Profil de ${escapeHtml(user.name)}</h3>
      
      <div class="detail-row">
        <span class="detail-label">Email :</span>
        <span class="detail-value">${escapeHtml(user.email)}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Rôle :</span>
        <span class="detail-value">${escapeHtml(user.role) || 'Non assigné'}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Statut :</span>
        <span class="detail-value">${user.status === 'Approuvé' ? '✅ Approuvé' : '⏳ En attente'}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Date d'inscription :</span>
        <span class="detail-value">${formatDate(user.created_at)}</span>
      </div>
      
      ${user.approved_by ? `
        <div class="detail-row">
          <span class="detail-label">Approuvé par :</span>
          <span class="detail-value">${escapeHtml(user.approved_by_name) || 'Inconnu'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date d'approbation :</span>
          <span class="detail-value">${formatDate(user.approved_at)}</span>
        </div>
      ` : ''}
      
      <div class="form-buttons">
        <button type="button" class="secondary-btn" onclick="closeModal()">❌ Fermer</button>
      </div>
    </div>
  `;
  
  showModal(content);
}

// ============================================
// FONCTIONS DE PARAMÈTRES (suite)
// ============================================

/**
 * Sauvegarde les paramètres depuis le formulaire
 */
async function saveSettingsForm() {
  if (!isAdmin()) {
    showMessage(elements.settingsMessage, '⛔ Permission insuffisante', 'error');
    return;
  }

  const institution = document.getElementById('settings-institution')?.value.trim();
  const year = document.getElementById('settings-year')?.value.trim();

  if (!institution) {
    showMessage(elements.settingsMessage, '⚠️ Le nom de l\'institution est requis', 'error');
    return;
  }

  const settings = {
    institution: institution,
    year: parseInt(year) || new Date().getFullYear(),
    updated_at: new Date().toISOString(),
    updated_by: appState.currentUser.id
  };

  try {
    // Vérifier si un enregistrement existe
    const { data: existing, error: checkError } = await supabaseClient
      .from('app_settings')
      .select('id')
      .eq('id', 1)
      .maybeSingle();

    if (checkError) throw checkError;

    let result;
    if (existing) {
      // Mise à jour
      result = await supabaseClient
        .from('app_settings')
        .update(settings)
        .eq('id', 1);
    } else {
      // Création
      result = await supabaseClient
        .from('app_settings')
        .insert([{ id: 1, ...settings }]);
    }

    if (result.error) throw result.error;

    appState.settings = { ...appState.settings, ...settings };
    await logAction('Paramètres', 1, 'Modification', `Institution: ${institution}, Année: ${year}`);
    showMessage(elements.settingsMessage, '✅ Paramètres enregistrés', 'success');

  } catch (err) {
    console.error('❌ Erreur sauvegarde paramètres:', err);
    showMessage(elements.settingsMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}

// ============================================
// FONCTIONS DE RENDU DES TABLEAUX (manquantes)
// ============================================

/**
 * Rend le tableau des utilisateurs en attente
 */
function renderPendingUsersTable() {
  if (!elements.pendingUsersTableBody) return;

  const pending = appState.profiles.filter(p => p.status !== 'Approuvé');

  if (pending.length === 0) {
    elements.pendingUsersTableBody.innerHTML = `
      <tr><td colspan="5" class="empty-message">Aucun utilisateur en attente d'approbation</td></tr>
    `;
    return;
  }

  elements.pendingUsersTableBody.innerHTML = pending.map(user => `
    <tr>
      <td>${formatDate(user.created_at)}</td>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.role) || 'Non assigné'}</td>
      <td class="actions">
        <button class="btn-approve" onclick="approveUser('${user.id}')">✅ Approuver</button>
        <button class="btn-reject" onclick="rejectUser('${user.id}')">❌ Rejeter</button>
        <button class="btn-view" onclick="showUserDetails('${user.id}')">👁️ Détails</button>
      </td>
    </tr>
  `).join('');
}

/**
 * Rend le tableau des utilisateurs approuvés
 */
function renderApprovedUsersTable() {
  if (!elements.approvedUsersTableBody) return;

  const approved = appState.profiles.filter(p => p.status === 'Approuvé');

  if (approved.length === 0) {
    elements.approvedUsersTableBody.innerHTML = `
      <tr><td colspan="5" class="empty-message">Aucun utilisateur approuvé</td></tr>
    `;
    return;
  }

  elements.approvedUsersTableBody.innerHTML = approved.map(user => `
    <tr>
      <td>${formatDate(user.approved_at || user.created_at)}</td>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.role) || 'Non assigné'}</td>
      <td class="actions">
        <button class="btn-view" onclick="showUserDetails('${user.id}')">👁️ Détails</button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// FONCTIONS DE STATISTIQUES AVANCÉES
// ============================================

/**
 * Calcule les statistiques judiciaires
 */
function getJudicialStats() {
  const records = appState.judicialRecords.filter(r => !r.archived);
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  return {
    total: records.length,
    pending: records.filter(r => r.sentence_status === 'En attente').length,
    completed: records.filter(r => r.sentence_status === 'Exécuté').length,
    recent: records.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length,
    byStatus: groupBy(records, 'sentence_status')
  };
}

/**
 * Calcule les statistiques de trésorerie
 */
function getTreasuryStats() {
  const receipts = appState.receipts;
  const thirtyDaysAgo = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);

  return {
    totalCollected: receipts.reduce((sum, r) => sum + (r.amount || 0), 0),
    treasuryAmount: receipts.reduce((sum, r) => sum + (r.treasury_amount || 0), 0),
    chancelleryAmount: receipts.reduce((sum, r) => sum + (r.chancellery_amount || 0), 0),
    recentReceipts: receipts.filter(r => new Date(r.date) >= thirtyDaysAgo).length
  };
}

/**
 * Groupe un tableau par une propriété
 */
function groupBy(array, property) {
  return array.reduce((groups, item) => {
    const key = item[property] || 'Non défini';
    groups[key] = (groups[key] || 0) + 1;
    return groups;
  }, {});
}

// ============================================
// GESTION DES ERREURS GLOBALE
// ============================================

window.addEventListener('error', (event) => {
  console.error('❌ Erreur globale:', event.error);
  // Éviter les boucles infinies d'erreurs
  if (event.message?.includes('supabase')) {
    console.warn('🔄 Tentative de reconnexion Supabase...');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promesse non gérée:', event.reason);
});

// ============================================
// MODE DÉVELOPPEMENT - UTILITAIRES
// ============================================

/**
 * Debug: Affiche l'état complet de l'application
 */
function debugState() {
  console.log('=== ÉTAT DE L\'APPLICATION ===');
  console.log('Authentifié:', appState.isAuthenticated);
  console.log('Utilisateur:', appState.currentUser);
  console.log('Profils:', appState.profiles.length);
  console.log('Dossiers judiciaires:', appState.judicialRecords.length);
  console.log('Certifications:', appState.certifications.length);
  console.log('Reçus:', appState.receipts.length);
  console.log('Journal:', appState.journal.length);
  console.log('Paramètres:', appState.settings);
  console.log('Section active:', appState.activeSection);
  console.log('=============================');
}

// Exposer pour debug console
window.debugState = debugState;

/**
 * Vérifie la connexion Supabase
 */
async function checkSupabaseConnection() {
  try {
    const start = Date.now();
    const { data, error } = await supabaseClient.from('app_settings').select('id').limit(1);
    const duration = Date.now() - start;
    
    if (error) throw error;
    
    console.log(`✅ Connexion Supabase OK (${duration}ms)`);
    return true;
  } catch (err) {
    console.error('❌ Connexion Supabase échouée:', err.message);
    return false;
  }
}

// Exposer pour debug
window.checkSupabaseConnection = checkSupabaseConnection;

// ============================================
// FINALISATION
// ============================================

console.log('📜 Corpus Proceduralis Imperialis — Module Chancellerie chargé');
console.log('👤 Son Eminence Cassian Varo — Grand Chancelier Impérial de Bordeciel');
