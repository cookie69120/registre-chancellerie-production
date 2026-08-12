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
// VARIABLES GLOBALES
// ============================================
const storageKey = 'imperialChancellerieData';
const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };

const appState = {
  profiles: [],  // ✅ CHANGÉ: 'users' → 'profiles'
  judicialRecords: [],
  certifications: [],
  receipts: [],
  journal: [],
  settings: {},
  counters: { judicial: 0, certification: 0 },
  currentUser: null,
  activeSection: 'dashboard',
  isAuthenticated: false,
};

// ============================================
// RÉFÉRENCES AUX ÉLÉMENTS DU DOM
// ============================================
const elements = {
  // Authentification
  registerEmail: document.getElementById('register-email'),
  registerPassword: document.getElementById('register-password'),
  registerName: document.getElementById('register-name'),
  registerRole: document.getElementById('register-role'),
  registerButton: document.getElementById('register-btn'),
  registerMessage: document.getElementById('register-message'),
  // Authentification - CONNEXION
loginForm: document.getElementById('login-form'),
loginEmail: document.getElementById('login-email'),
loginPassword: document.getElementById('login-password'),
loginError: document.getElementById('login-error'),
showRegisterLink: document.getElementById('show-register'),

  // Formulaires
  judicialForm: document.getElementById('judicial-form'),
  certificationForm: document.getElementById('certification-form'),
  receiptForm: document.getElementById('receipt-form'),
  settingsForm: document.getElementById('settings-form'),

  // Tableaux
  judicialTableBody: document.getElementById('judicial-table-body'),
  certificationTableBody: document.getElementById('certification-table-body'),
  receiptTableBody: document.getElementById('receipt-table-body'),
  journalTableBody: document.getElementById('journal-table-body'),

  // Filtres Judiciaires
  judicialFilter: document.getElementById('judicial-filter'),
  judicialStatusFilter: document.getElementById('judicial-status-filter'),
  judicialDateFrom: document.getElementById('judicial-date-from'),
  judicialDateTo: document.getElementById('judicial-date-to'),
  resetJudicialFilters: document.getElementById('reset-judicial-filters'),
  judicialMessage: document.getElementById('judicial-message'),

  // Filtres Certifications
  certificationFilter: document.getElementById('certification-filter'),
  certificationStatusFilter: document.getElementById('certification-status-filter'),
  certificationDateFrom: document.getElementById('certification-date-from'),
  certificationDateTo: document.getElementById('certification-date-to'),
  resetCertificationFilters: document.getElementById('reset-certification-filters'),
  certificationMessage: document.getElementById('certification-message'),

  // Filtres Reçus
  receiptFilter: document.getElementById('receipt-filter'),
  receiptStatusFilter: document.getElementById('receipt-status-filter'),
  receiptDateFrom: document.getElementById('receipt-date-from'),
  receiptDateTo: document.getElementById('receipt-date-to'),
  resetReceiptFilters: document.getElementById('reset-receipt-filters'),
  receiptMessage: document.getElementById('receipt-message'),

  // Filtres Journal
  journalFilter: document.getElementById('journal-filter'),
  journalDateFrom: document.getElementById('journal-date-from'),
  journalDateTo: document.getElementById('journal-date-to'),
  resetJournalFilters: document.getElementById('reset-journal-filters'),
  journalMessage: document.getElementById('journal-message'),

  // Sections
  dashboardContainer: document.getElementById('dashboard-section'),
  settingsMessage: document.getElementById('settings-message'),
};

// ============================================
// FONCTION UTILITAIRE - AFFICHAGE DES MESSAGES
// ============================================

/**
 * Affiche un message temporaire
 * @param {HTMLElement} element - L'élément où afficher le message
 * @param {string} message - Le texte du message
 * @param {string} type - 'success' ou 'error'
 */
function showMessage(element, message, type) {
  if (!element) {
    console.warn('⚠️ Élément message non trouvé');
    return;
  }

  element.textContent = message;
  element.className = `form-${type}`;
  element.style.display = 'block';

  // Masquer le message après 5 secondes
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

// ============================================
// AUTHENTIFICATION SUPABASE
// ============================================

/**
 * Enregistrer un nouvel utilisateur
 */
async function registerUser() {
  const email = elements.registerEmail.value.trim();
  const password = elements.registerPassword.value.trim();
  const name = elements.registerName.value.trim();
  const role = elements.registerRole.value;

  if (!email || !password || !name || !role) {
    showMessage(elements.registerMessage, '❌ Tous les champs sont obligatoires', 'error');
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (error) {
      showMessage(elements.registerMessage, `❌ Erreur : ${error.message}`, 'error');
      return;
    }

    // ✅ CHANGÉ: Crée un profil dans 'profiles' au lieu de 'users'
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert([{
        id: data.user.id,
        name,
        email,
        role,
        status: 'En attente d\'habilitation'
      }]);

    if (profileError) throw profileError;

    showMessage(elements.registerMessage, '✅ Inscription réussie. En attente d\'approbation.', 'success');
    elements.registerForm.reset();
  } catch (err) {
    console.error('Erreur d\'enregistrement:', err);
    showMessage(elements.registerMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}

/**
 * Connexion d'un utilisateur
 */
async function loginUser() {
  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value.trim();

  if (!email || !password) {
    showMessage(elements.loginMessage, '❌ Email et mot de passe obligatoires', 'error');
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showMessage(elements.loginMessage, `❌ Erreur : ${error.message}`, 'error');
      return;
    }

    // ✅ VÉRIFICATION: data et data.user existent bien
    if (!data || !data.user) {
      showMessage(elements.loginMessage, '❌ Erreur d\'authentification', 'error');
      return;
    }

    // ✅ Charge le profil depuis 'profiles'
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Erreur profil:', profileError);
      showMessage(elements.loginMessage, '❌ Profil non trouvé', 'error');
      return;
    }

    // ✅ VÉRIFICATION: profile existe
    if (!profile) {
      showMessage(elements.loginMessage, '❌ Profil non trouvé', 'error');
      return;
    }

    if (profile.status === 'En attente d\'habilitation') {
      showMessage(elements.loginMessage, '⏳ Votre compte est en attente d\'approbation', 'error');
      await supabaseClient.auth.signOut();
      return;
    }

    // ✅ NOUVEAU: Charge le rôle de l'utilisateur depuis 'user_roles'
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('email', email)
      .single();

    // ✅ VÉRIFICATION: userRole peut être null (pas grave)
    appState.currentUser = {
      ...profile,
      role: userRole?.role || 'user'  // ✅ Ajoute le rôle
    };
    appState.isAuthenticated = true;

    console.log('✅ Connecté:', appState.currentUser.name, 'Rôle:', appState.currentUser.role);
    showMessage(elements.loginMessage, `✅ Bienvenue ${profile.name}!`, 'success');
    elements.loginForm.reset();
    
    // Petite pause avant de charger les données
    setTimeout(async () => {
      await loadAppData();
      showAuthSection('authenticated');
    }, 500);

  } catch (err) {
    console.error('Erreur de connexion:', err);
    showMessage(elements.loginMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}

/**
 * Déconnexion
 */
async function logoutUser() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    appState.isAuthenticated = false;
    appState.currentUser = null;
    appState.profiles = [];
    appState.judicialRecords = [];
    appState.certifications = [];
    appState.receipts = [];
    appState.journal = [];

    showAuthSection('unauthenticated');
    console.log('✅ Déconnexion réussie');
  } catch (err) {
    console.error('Erreur de déconnexion:', err);
  }
}

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

/**
 * Charge toutes les données de l'app
 */
async function loadAppData() {
  try {
    // ✅ VÉRIFICATION 1: Y a-t-il un utilisateur connecté ?
    if (!appState.currentUser?.id) {
      console.warn('⚠️ Aucun utilisateur connecté');
      return; // On arrête ici si pas d'utilisateur
    }

    console.log('📦 Chargement des données pour:', appState.currentUser.email);

    // Charger les enregistrements judiciaires
    const { data: judicial, error: judicialError } = await supabaseClient
      .from('judicial_records')
      .select('*')
      .order('createdAt', { ascending: false });

    // ✅ VÉRIFICATION 2: Y a-t-il une erreur ?
    if (judicialError) {
      console.warn('⚠️ Erreur chargement judiciaires:', judicialError.message);
    } else {
      appState.judicialRecords = judicial || [];
      appState.counters.judicial = appState.judicialRecords.length;
      console.log('✅ Judiciaires chargés:', appState.judicialRecords.length);
    }

    // Charger les certifications
    const { data: certs, error: certsError } = await supabaseClient
      .from('certifications')
      .select('*')
      .order('createdAt', { ascending: false });

    if (certsError) {
      console.warn('⚠️ Erreur chargement certifications:', certsError.message);
    } else {
      appState.certifications = certs || [];
      appState.counters.certifications = appState.certifications.length;
      console.log('✅ Certifications chargées:', appState.certifications.length);
    }

    // Charger les reçus
    const { data: receipts, error: receiptsError } = await supabaseClient
      .from('receipts')
      .select('*')
      .order('createdAt', { ascending: false });

    if (receiptsError) {
      console.warn('⚠️ Erreur chargement reçus:', receiptsError.message);
    } else {
      appState.receipts = receipts || [];
      appState.counters.receipts = appState.receipts.length;
      console.log('✅ Reçus chargés:', appState.receipts.length);
    }

    // Charger le journal
    const { data: journal, error: journalError } = await supabaseClient
      .from('journal')
      .select('*')
      .order('timestamp', { ascending: false });

    if (journalError) {
      console.warn('⚠️ Erreur chargement journal:', journalError.message);
    } else {
      appState.journal = journal || [];
      appState.counters.journal = appState.journal.length;
      console.log('✅ Journal chargé:', appState.journal.length);
    }

    // Actualiser les tableaux
    displayJudicial();
    displayCertification();
    displayReceipt();
    displayJournal();
    updateCounters();

  } catch (err) {
    console.error('❌ Erreur générale loadAppData:', err);
  }
}

// ============================================
// SAUVEGARDE DES DONNÉES
// ============================================

/**
 * Sauvegarde un enregistrement judiciaire - ✅ CHAMPS CORRIGÉS
 */
async function saveJudicialRecord(record) {
  try {
    const judRecord = {
      reference: record.reference,
      suspect: record.suspect || record.parties || '',  // ✅ CHANGÉ: 'parties' → 'suspect'
      magistrate: record.magistrate || '',
      judgment_date: record.judgment_date || record.date || null,
      qualification: record.qualification || record.type || '',  // ✅ CHANGÉ: 'type' → 'qualification'
      fine_amount: Number(record.fine_amount) || 0,
      sentence: record.sentence || record.verdict || '',  // ✅ CHANGÉ: 'verdict' → 'sentence'
      sentence_status: record.sentence_status || record.status || 'Nouveau',
      judgment_reference: record.judgment_reference || '',
      judgment_link: record.judgment_link || '',
      treasury_amount: Number(record.treasury_amount) || 0,
      chancellery_amount: Number(record.chancellery_amount) || 0,
      fine_status: record.fine_status || 'Non réglée',
      notes: record.notes || '',
      archived: record.archived || false,
      created_by: appState.currentUser.id,
      updated_at: new Date().toISOString(),
    };

    if (record.id) {
      const { error } = await supabaseClient
        .from('judicial_records')
        .update(judRecord)
        .eq('id', record.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from('judicial_records')
        .insert([judRecord]);
      if (error) throw error;
    }

    await loadAppData();
    await logAction('Dossier Judiciaire', record.reference, record.id ? 'Modification' : 'Création', `Dossier : ${record.reference}`);
    return true;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
    return false;
  }
}

/**
 * Sauvegarde une certification - ✅ CHAMPS CORRIGÉS
 */
async function saveCertification(cert) {
  try {
    const certData = {
      reference: cert.reference,
      candidate_name: cert.candidate_name || cert.name || '',  // ✅ CHANGÉ: 'name' → 'candidate_name'
      instructor: cert.instructor || '',
      training_date: cert.training_date || cert.date || null,
      training_type: cert.training_type || cert.type || '',  // ✅ CHANGÉ: 'type' → 'training_type'
      amount: Number(cert.amount || cert.price) || 0,  // ✅ CHANGÉ: 'price' → 'amount'
      treasury_amount: Number(cert.treasury_amount) || 0,
      chancellery_amount: Number(cert.chancellery_amount) || 0,
      payment_status: cert.payment_status || cert.status || 'Non réglée',
      notes: cert.notes || '',
      archived: cert.archived || false,
      created_by: appState.currentUser.id,
      updated_at: new Date().toISOString(),
    };

    if (cert.id) {
      const { error } = await supabaseClient
        .from('certifications')
        .update(certData)
        .eq('id', cert.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from('certifications')
        .insert([certData]);
      if (error) throw error;
    }

    await loadAppData();
    await logAction('Certification', cert.reference, cert.id ? 'Modification' : 'Création', `Certification : ${cert.reference}`);
    return true;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
    return false;
  }
}

/**
 * Sauvegarde un reçu - ✅ CHAMPS CORRIGÉS
 */
async function saveReceipt(receipt) {
  try {
    const receiptData = {
      date: receipt.date || new Date().toISOString().split('T')[0],
      dossier_title: receipt.dossier_title || '',
      reference: receipt.reference,
      dossier_type: receipt.dossier_type || receipt.recordType || '',  // ✅ CHANGÉ: 'recordType' → 'dossier_type'
      record_id: receipt.record_id || receipt.recordId || null,  // ✅ CHANGÉ: 'recordId' → 'record_id'
      amount: Number(receipt.amount) || 0,
      method: receipt.method || 'Espèces',
      collector_name: receipt.collector_name || receipt.collector || '',
      treasury_percent: Number(receipt.treasury_percent) || 60,
      chancellery_percent: Number(receipt.chancellery_percent) || 40,
      treasury_amount: Number(receipt.treasury_amount) || 0,
      chancellery_amount: Number(receipt.chancellery_amount) || 0,
      treasury_transferred: receipt.treasury_transferred || false,
      chancellery_transferred: receipt.chancellery_transferred || false,
      notes: receipt.notes || '',
      created_by: appState.currentUser.id,
    };

    if (receipt.id) {
      const { error } = await supabaseClient
        .from('receipts')
        .update(receiptData)
        .eq('id', receipt.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from('receipts')
        .insert([receiptData]);
      if (error) throw error;
    }

    await loadAppData();
    await logAction('Reçu', receipt.reference, receipt.id ? 'Modification' : 'Création', `Reçu : ${receipt.reference}`);
    return true;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
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
    console.error('Erreur lors de la suppression:', err);
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
    console.error('Erreur lors de la suppression:', err);
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
    console.error('Erreur lors de la suppression:', err);
    return false;
  }
}

/**
 * Approuve un utilisateur - ✅ UTILISE 'profiles' ET 'status'
 */
async function approveUser(userId) {
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .update({ status: 'Approuvé' })  // ✅ CHANGÉ: 'approved: true' → 'status: Approuvé'
      .eq('id', userId);
    if (error) throw error;

    await loadAppData();
    await logAction('Utilisateur', userId, 'Approbation', 'Utilisateur approuvé');
    return true;
  } catch (err) {
    console.error('Erreur lors de l\'approbation:', err);
    return false;
  }
}

/**
 * Supprime un utilisateur - ✅ UTILISE 'profiles'
 */
async function deleteUser(userId) {
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) throw error;

    await loadAppData();
    await logAction('Utilisateur', userId, 'Suppression', 'Utilisateur supprimé');
    return true;
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    return false;
  }
}

/**
 * Enregistre une action dans le journal d'audit - ✅ CHAMPS CORRIGÉS
 */
async function logAction(targetType, targetReference, action, description) {
  try {
    const logEntry = {
      actor_name: appState.currentUser?.name || 'Système',
      actor_id: appState.currentUser?.id,
      action: action,
      target_type: targetType,
      target_reference: targetReference,
      description: description,
    };

    const { error } = await supabaseClient
      .from('modification_journal')
      .insert([logEntry]);
    if (error) throw error;

    appState.journal.unshift(logEntry);
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement du journal:', err);
  }
}

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
    await logAction('Paramètres', 'app_settings', 'Modification', 'Paramètres mise à jour');
  } catch (err) {
    console.error('Erreur:', err);
    showMessage(elements.settingsMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}
// ============================================
// RENDU DES TABLEAUX
// ============================================

/**
 * Rend le tableau des enregistrements judiciaires - ✅ CHAMPS CORRIGÉS
 */
function renderJudicialTable(records = appState.judicialRecords) {
  if (!elements.judicialTableBody) return;

  elements.judicialTableBody.innerHTML = records
    .filter(r => !r.archived)
    .map(
      (record) => `
    <tr>
      <td>${record.reference || 'N/A'}</td>
      <td>${record.suspect || 'N/A'}</td>
      <td>${record.qualification || 'N/A'}</td>
      <td>${record.sentence || 'N/A'}</td>
      <td>${record.fine_amount ? formatCurrency(record.fine_amount) : '0 Septims'}</td>
      <td>${record.fine_status || 'Non réglée'}</td>
      <td>${formatDate(record.judgment_date)}</td>
      <td>${record.sentence_status || 'Nouveau'}</td>
      <td>
        ${canEdit() ? `
          <button onclick="editJudicial('${record.id}')" class="action-btn edit-btn">✎</button>
          <button onclick="archiveJudicial('${record.id}')" class="action-btn archive-btn">📦</button>
          <button onclick="deleteJudicialConfirm('${record.id}')" class="action-btn delete-btn">🗑</button>
        ` : ''}
      </td>
    </tr>
  `
    )
    .join('');
}

/**
 * Rend le tableau des certifications - ✅ CHAMPS CORRIGÉS
 */
function renderCertificationTable(records = appState.certifications) {
  if (!elements.certificationTableBody) return;

  elements.certificationTableBody.innerHTML = records
    .filter(r => !r.archived)
    .map(
      (cert) => `
    <tr>
      <td>${cert.reference || 'N/A'}</td>
      <td>${cert.candidate_name || 'N/A'}</td>
      <td>${cert.training_type || 'N/A'}</td>
      <td>${cert.amount ? formatCurrency(cert.amount) : '0 Septims'}</td>
      <td>${cert.payment_status || 'Non réglée'}</td>
      <td>${formatDate(cert.training_date)}</td>
      <td>
        ${canEdit() ? `
          <button onclick="editCertification('${cert.id}')" class="action-btn edit-btn">✎</button>
          <button onclick="archiveCertification('${cert.id}')" class="action-btn archive-btn">📦</button>
          <button onclick="deleteCertificationConfirm('${cert.id}')" class="action-btn delete-btn">🗑</button>
        ` : ''}
      </td>
    </tr>
  `
    )
    .join('');
}

/**
 * Rend le tableau des reçus - ✅ CHAMPS CORRIGÉS
 */
function renderReceiptTable(records = appState.receipts) {
  if (!elements.receiptTableBody) return;

  elements.receiptTableBody.innerHTML = records
    .map(
      (receipt) => `
    <tr>
      <td>${formatDate(receipt.date)}</td>
      <td>${receipt.reference || 'N/A'}</td>
      <td>${receipt.dossier_type || 'N/A'}</td>
      <td>${receipt.collector_name || 'N/A'}</td>
      <td>${receipt.amount ? formatCurrency(receipt.amount) : '0 Septims'}</td>
      <td>${receipt.method || 'Espèces'}</td>
      <td>${receipt.treasury_amount ? formatCurrency(receipt.treasury_amount) : '0 Septims'}</td>
      <td>${receipt.chancellery_amount ? formatCurrency(receipt.chancellery_amount) : '0 Septims'}</td>
      <td>
        ${receipt.treasury_transferred ? '✓' : '✗'}
      </td>
      <td>
        ${receipt.chancellery_transferred ? '✓' : '✗'}
      </td>
      <td>
        ${canEdit() ? `
          <button onclick="editReceipt('${receipt.id}')" class="action-btn edit-btn">✎</button>
          <button onclick="deleteReceiptConfirm('${receipt.id}')" class="action-btn delete-btn">🗑</button>
        ` : ''}
      </td>
    </tr>
  `
    )
    .join('');
}

/**
 * Rend le tableau du journal - ✅ CHAMPS CORRIGÉS
 */
function renderJournalTable(records = appState.journal) {
  if (!elements.journalTableBody) return;

  elements.journalTableBody.innerHTML = records
    .map(
      (entry) => `
    <tr>
      <td>${formatDate(entry.created_at)}</td>
      <td>${entry.actor_name || 'Système'}</td>
      <td>${entry.target_type || 'N/A'}</td>
      <td>${entry.action || 'N/A'}</td>
      <td>${entry.target_reference || 'N/A'}</td>
      <td>${entry.description || 'N/A'}</td>
    </tr>
  `
    )
    .join('');
}

/**
 * Rend le tableau des utilisateurs en attente - ✅ UTILISE 'profiles'
 */
function renderPendingUsersTable() {
  if (!elements.pendingUsersTableBody) return;

  const pendingUsers = appState.profiles.filter(u => u.status === 'En attente d\'habilitation');

  elements.pendingUsersTableBody.innerHTML = pendingUsers
    .map(
      (user) => `
    <tr>
      <td>${user.name || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.role || 'Scribe'}</td>
      <td>
        ${isAdmin() ? `
          <button onclick="approveUserConfirm('${user.id}')" class="action-btn edit-btn">✓ Approuver</button>
          <button onclick="deleteUserConfirm('${user.id}')" class="action-btn delete-btn">🗑 Rejeter</button>
        ` : ''}
      </td>
    </tr>
  `
    )
    .join('');
}

/**
 * Rend le tableau des utilisateurs approuvés - ✅ UTILISE 'profiles'
 */
function renderApprovedUsersTable() {
  if (!elements.usersTableBody) return;

  const approvedUsers = appState.profiles.filter(u => u.status === 'Approuvé');

  elements.usersTableBody.innerHTML = approvedUsers
    .map(
      (user) => `
    <tr>
      <td>${user.name || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.role || 'Scribe'}</td>
      <td>${formatDate(user.last_activity)}</td>
      <td>
        ${isAdmin() ? `
          <button onclick="deleteUserConfirm('${user.id}')" class="action-btn delete-btn">🗑</button>
        ` : ''}
      </td>
    </tr>
  `
    )
    .join('');
}

// ============================================
// ÉDITION DES FORMULAIRES
// ============================================

/**
 * Édite un enregistrement judiciaire - ✅ CHAMPS CORRIGÉS
 */
async function editJudicial(id) {
  const record = appState.judicialRecords.find(r => r.id === id);
  if (!record) return;

  showModal(`
    <form id="temp-judicial-form">
      <h3>Éditer un Enregistrement Judiciaire</h3>

      <div class="form-group">
        <label>Référence</label>
        <input type="text" name="reference" value="${record.reference}" required>
      </div>

      <div class="form-group">
        <label>Suspect/Accusé</label>
        <input type="text" name="suspect" value="${record.suspect || ''}" required>
      </div>

      <div class="form-group">
        <label>Magistrat</label>
        <input type="text" name="magistrate" value="${record.magistrate || ''}">
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
        <textarea name="sentence" required>${record.sentence || ''}</textarea>
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
        <input type="text" name="judgment_reference" value="${record.judgment_reference || ''}">
      </div>

      <div class="form-group">
        <label>Lien du Jugement</label>
        <input type="url" name="judgment_link" value="${record.judgment_link || ''}">
      </div>

      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes">${record.notes || ''}</textarea>
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
    console.error('Erreur:', err);
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
        <input type="text" name="reference" value="${cert.reference}" required>
      </div>

      <div class="form-group">
        <label>Nom du Candidat</label>
        <input type="text" name="candidate_name" value="${cert.candidate_name || ''}" required>
      </div>

      <div class="form-group">
        <label>Instructeur</label>
        <input type="text" name="instructor" value="${cert.instructor || ''}">
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
        <textarea name="notes">${cert.notes || ''}</textarea>
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
    console.error('Erreur:', err);
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
        <input type="text" name="reference" value="${receipt.reference || ''}" required>
      </div>

      <div class="form-group">
        <label>Type de Dossier</label>
        <input type="text" name="dossier_type" value="${receipt.dossier_type || ''}" required>
      </div>

      <div class="form-group">
        <label>Titre du Dossier</label>
        <input type="text" name="dossier_title" value="${receipt.dossier_title || ''}">
      </div>

      <div class="form-group">
        <label>Collecteur</label>
        <input type="text" name="collector_name" value="${receipt.collector_name || ''}" required>
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
        <textarea name="notes">${receipt.notes || ''}</textarea>
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
// SAUVEGARDE DES DONNÉES - ✅ CHAMPS CORRIGÉS
// ============================================

/**
 * Sauvegarde un enregistrement judiciaire - ✅ UTILISE 'judicial_records'
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
    console.error('Erreur lors de la sauvegarde:', err);
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
    console.error('Erreur lors de la suppression:', err);
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
    console.error('Erreur lors de la sauvegarde:', err);
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
    console.error('Erreur lors de la suppression:', err);
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
    console.error('Erreur lors de la sauvegarde:', err);
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
    console.error('Erreur lors de la suppression:', err);
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
              <td>${entry.actor_name || 'Système'}</td>
              <td>${entry.action || 'N/A'}</td>
              <td>${entry.description || 'N/A'}</td>
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
// SECTIONS
// ============================================

/**
 * Affiche une section
 */
function showSection(sectionName) {
  appState.activeSection = sectionName;

  // Masquer toutes les sections
  document.querySelectorAll('.section-content').forEach(section => {
    section.style.display = 'none';
  });

  // Retirer la classe active de tous les boutons
  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.classList.remove('active');
  });

  // Afficher la section sélectionnée
  const activeElement = document.getElementById(`${sectionName}-section`);
  if (activeElement) {
    activeElement.style.display = 'block';
  }

  // Activer le bouton de navigation correspondant
  document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

  // Initialiser le contenu de la section
  if (sectionName === 'judicial') {
    filterJudicial();
  } else if (sectionName === 'certification') {
    filterCertification();
  } else if (sectionName === 'payments') {
    filterReceipt();
  } else if (sectionName === 'journal') {
    filterJournal();
  } else if (sectionName === 'users') {
    renderPendingUsersTable();
    renderApprovedUsersTable();
  } else if (sectionName === 'settings') {
    renderSettings();
  }
}

/**
 * Réinitialise les filtres
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
// SETTINGS
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
        <input type="text" id="settings-institution" value="${appState.settings.institution || 'Chancellerie Impériale'}" placeholder="Nom de l'institution">
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
 * Affiche une modale
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
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

/**
 * Ferme la modale
 */
function closeModal() {
  const modal = document.getElementById('global-modal');
  if (modal) {
    modal.style.display = 'none';
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
// ÉVÉNEMENTS ET INITIALISATIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Application Chancellerie Impériale initialisée');
  
  // Écouter les changements d'authentification
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      appState.currentUser = session.user;
      appState.isAuthenticated = true;
      console.log('✅ Utilisateur connecté:', session.user.email);
      
      // Charger le profil complet
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
      appState.currentUser = { ...appState.currentUser, ...profile };
      console.log('✅ Profil chargé:', profile.name);
      await loadAppData();
      showSection('dashboard');
    } else {
  console.warn('⚠️ Profil non trouvé pour cet utilisateur');
  appState.isAuthenticated = false;
}
    } else {
      appState.isAuthenticated = false;
      appState.currentUser = null;
      console.log('❌ Utilisateur déconnecté');
    }
  });

  // ============================================
  // Écouteurs d'événements - Formulaires
  // ============================================
  if (elements.registerButton) {
    elements.registerButton.addEventListener('click', registerUser);
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
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('register-screen').classList.remove('hidden');
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('register-screen').classList.add('hidden');
      document.getElementById('login-screen').classList.remove('hidden');
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
  // Écouteurs d'événements - Filtres
  // ============================================
  if (elements.judicialFilter) elements.judicialFilter.addEventListener('input', filterJudicial);
  if (elements.judicialStatusFilter) elements.judicialStatusFilter.addEventListener('change', filterJudicial);
  if (elements.judicialDateFrom) elements.judicialDateFrom.addEventListener('change', filterJudicial);
  if (elements.judicialDateTo) elements.judicialDateTo.addEventListener('change', filterJudicial);
  if (elements.resetJudicialFilters) elements.resetJudicialFilters.addEventListener('click', () => resetFilters('judicial'));

  if (elements.certificationFilter) elements.certificationFilter.addEventListener('input', filterCertification);
  if (elements.certificationStatusFilter) elements.certificationStatusFilter.addEventListener('change', filterCertification);
  if (elements.certificationDateFrom) elements.certificationDateFrom.addEventListener('change', filterCertification);
  if (elements.certificationDateTo) elements.certificationDateTo.addEventListener('change', filterCertification);
  if (elements.resetCertificationFilters) elements.resetCertificationFilters.addEventListener('click', () => resetFilters('certification'));

  if (elements.receiptFilter) elements.receiptFilter.addEventListener('input', filterReceipt);
  if (elements.receiptStatusFilter) elements.receiptStatusFilter.addEventListener('change', filterReceipt);
  if (elements.receiptDateFrom) elements.receiptDateFrom.addEventListener('change', filterReceipt);
  if (elements.receiptDateTo) elements.receiptDateTo.addEventListener('change', filterReceipt);
  if (elements.resetReceiptFilters) elements.resetReceiptFilters.addEventListener('click', () => resetFilters('payments'));

  if (elements.journalFilter) elements.journalFilter.addEventListener('input', filterJournal);
  if (elements.journalDateFrom) elements.journalDateFrom.addEventListener('change', filterJournal);
  if (elements.journalDateTo) elements.journalDateTo.addEventListener('change', filterJournal);
  if (elements.resetJournalFilters) elements.resetJournalFilters.addEventListener('click', () => resetFilters('journal'));

  console.log('✅ Tous les écouteurs d\'événements sont en place');
});
