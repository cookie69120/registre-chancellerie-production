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
  users: [],
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
// ÉLÉMENTS DOM
// ============================================
const elements = {
  // Auth
  authScreen: document.getElementById('auth-screen'),
  appScreen: document.getElementById('app-screen'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginButton: document.getElementById('login-button'),
  loginMessage: document.getElementById('login-message'),
  registerEmail: document.getElementById('register-email'),
  registerPassword: document.getElementById('register-password'),
  registerName: document.getElementById('register-name'),
  registerRole: document.getElementById('register-role'),
  registerButton: document.getElementById('register-button'),
  registerMessage: document.getElementById('register-message'),
  logoutButton: document.getElementById('logout-button'),
  currentUserName: document.getElementById('current-user-name'),
  currentUserRole: document.getElementById('current-user-role'),

  // Navigation
  navSections: document.querySelectorAll('[data-section]'),

  // Sections
  dashboardSection: document.getElementById('dashboard-section'),
  judicialSection: document.getElementById('judicial-section'),
  certificationSection: document.getElementById('certification-section'),
  paymentsSection: document.getElementById('payments-section'),
  usersSection: document.getElementById('users-section'),
  journalSection: document.getElementById('journal-section'),
  settingsSection: document.getElementById('settings-section'),

  // Formulaires Judicial
  judicialForm: document.getElementById('judicial-form'),
  judicialMessage: document.getElementById('judicial-message'),
  judicialTableBody: document.getElementById('judicial-table-body'),
  judicialFilter: document.getElementById('judicial-filter'),
  judicialStatusFilter: document.getElementById('judicial-status-filter'),
  judicialDateFrom: document.getElementById('judicial-date-from'),
  judicialDateTo: document.getElementById('judicial-date-to'),
  resetJudicialFilters: document.getElementById('reset-judicial-filters'),

  // Formulaires Certification
  certificationForm: document.getElementById('certification-form'),
  certificationMessage: document.getElementById('certification-message'),
  certificationTableBody: document.getElementById('certification-table-body'),
  certificationFilter: document.getElementById('certification-filter'),
  certificationStatusFilter: document.getElementById('certification-status-filter'),
  certificationDateFrom: document.getElementById('certification-date-from'),
  certificationDateTo: document.getElementById('certification-date-to'),
  resetCertificationFilters: document.getElementById('reset-certification-filters'),

  // Formulaires Receipts
  receiptForm: document.getElementById('receipt-form'),
  receiptMessage: document.getElementById('receipt-message'),
  receiptTableBody: document.getElementById('receipt-table-body'),
  receiptFilter: document.getElementById('receipt-filter'),
  receiptStatusFilter: document.getElementById('receipt-status-filter'),
  receiptDateFrom: document.getElementById('receipt-date-from'),
  receiptDateTo: document.getElementById('receipt-date-to'),
  resetReceiptFilters: document.getElementById('reset-receipt-filters'),

  // Formulaires Users
  usersTableBody: document.getElementById('users-table-body'),
  pendingUsersTableBody: document.getElementById('pending-users-table-body'),

  // Formulaires Journal
  journalTableBody: document.getElementById('journal-table-body'),
  journalFilter: document.getElementById('journal-filter'),
  journalDateFrom: document.getElementById('journal-date-from'),
  journalDateTo: document.getElementById('journal-date-to'),
  resetJournalFilters: document.getElementById('reset-journal-filters'),

  // Settings
  settingsForm: document.getElementById('settings-form'),
  settingsMessage: document.getElementById('settings-message'),
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Formate une date en format JJ/MM/AAAA
 */
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', dateOptions);
}

/**
 * Formate une monnaie (Or)
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0).replace('€', 'Or');
}

/**
 * Vérifie si l'utilisateur est admin
 */
function isAdmin() {
  return appState.currentUser?.role === 'admin';
}

/**
 * Vérifie si l'utilisateur est greffier
 */
function isGreffier() {
  return appState.currentUser?.role === 'greffier';
}

/**
 * Vérifie si l'utilisateur peut éditer
 */
function canEdit() {
  return isAdmin() || isGreffier();
}

/**
 * Montre un message temporaire
 */
function showMessage(element, message, type = 'success', duration = 3000) {
  if (!element) return;
  element.textContent = message;
  element.className = type === 'success' ? 'form-success' : 'form-error';
  element.style.display = 'block';
  if (duration > 0) {
    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  }
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
        data: { name, role, approved: false },
      },
    });

    if (error) {
      showMessage(elements.registerMessage, `❌ Erreur : ${error.message}`, 'error');
      return;
    }

    showMessage(elements.registerMessage, '✅ Inscription réussie ! En attente d\'approbation.', 'success');
    elements.registerEmail.value = '';
    elements.registerPassword.value = '';
    elements.registerName.value = '';
    elements.registerRole.value = 'greffier';
  } catch (err) {
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
    showMessage(elements.loginMessage, '❌ Email et mot de passe requis', 'error');
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

    const user = data.user;
    appState.currentUser = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      role: user.user_metadata?.role || 'greffier',
      approved: user.user_metadata?.approved || false,
    };
    
    appState.isAuthenticated = true;
    await loadAppData();
    showAppScreen();
  } catch (err) {
    showMessage(elements.loginMessage, `❌ Erreur : ${err.message}`, 'error');
  }
}

/**
 * Déconnexion
 */
async function logout() {
  try {
    await supabaseClient.auth.signOut();
    // Le listener onAuthStateChange déclenchera automatiquement le logout
  } catch (err) {
    console.error('Erreur lors de la déconnexion:', err);
  }
}

/**
 * Affiche l'écran d'authentification
 */
function showAuthScreen() {
  elements.authScreen.style.display = 'flex';
  elements.appScreen.style.display = 'none';
  elements.loginEmail.value = '';
  elements.loginPassword.value = '';
  elements.registerEmail.value = '';
  elements.registerPassword.value = '';
  elements.registerName.value = '';
  elements.registerRole.value = 'greffier';
}

/**
 * Affiche l'écran principal
 */
function showAppScreen() {
  elements.authScreen.style.display = 'none';
  elements.appScreen.style.display = 'flex';
  elements.currentUserName.textContent = appState.currentUser?.name || 'Utilisateur';
  elements.currentUserRole.textContent = appState.currentUser?.role === 'admin' ? 'Administrateur' : 'Greffier';
  initNav();
  setSection('dashboard');
}

// ============================================
// CHARGEMENT & SAUVEGARDE DONNÉES SUPABASE
// ============================================

/**
/**
 * Charge toutes les données de l'application
 */
async function loadAppData() {
  if (!appState.currentUser || !appState.currentUser.id) {
    console.error('❌ Utilisateur non défini');
    return;
  }

  console.log('📊 Loading data for user:', appState.currentUser.name, 'ID:', appState.currentUser.id);

  try {
    // Charger les enregistrements judiciaires
    const { data: judicial, error: judicialError } = await supabaseClient
      .from('judicial_records')
      .select('*')

    if (judicialError) throw judicialError;
    appState.judicialRecords = judicial || [];

    // Charger les certifications
    const { data: certifications, error: certificationsError } = await supabaseClient
      .from('certifications')
      .select('*')

    if (certificationsError) throw certificationsError;
    appState.certifications = certifications || [];

    // Charger les reçus
    const { data: receipts, error: receiptsError } = await supabaseClient
      .from('receipts')
      .select('*')

    if (receiptsError) throw receiptsError;
    appState.receipts = receipts || [];

    // Charger les utilisateurs (admin seulement)
    if (isAdmin()) {
      const { data: users, error: usersError } = await supabaseClient
        .from('users')
        .select('*')

      if (usersError) throw usersError;
      appState.users = users || [];
    }

    // Charger le journal
    const { data: journal, error: journalError } = await supabaseClient
      .from('modification_journal')
      .select('*')

    if (journalError) throw journalError;
    appState.journal = journal || [];
    
    // Charger les settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('settings')
      .select('*')
      .single();

    if (!settingsError && settings) {
      appState.settings = settings;
    } else {
      appState.settings = {
        judicialTreasuryPercentage: 70,
        certificationPrice: 50,
        institution: 'Chancellerie Impériale',
      };
    }

    // Mettre à jour les compteurs
    appState.counters.judicial = appState.judicialRecords.length;
    appState.counters.certification = appState.certifications.length;

    console.log('✅ Données chargées avec succès');
  } catch (err) {
    console.error('❌ Erreur lors du chargement des données:', err);
  }
}

/**
 * Sauvegarde un enregistrement judiciaire
 */
async function saveJudicialRecord(record) {
  try {
    if (record.id) {
      const { error } = await supabaseClient
        .from('judicial_records')
        .update(record)
        .eq('id', record.id);
      if (error) throw error;
    } else {
      record.id = `JUD-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      record.createdAt = new Date().toISOString();
      record.createdBy = appState.currentUser.id;
      const { error } = await supabaseClient
        .from('judicial_records')
        .insert([record]);
      if (error) throw error;
    }

    await loadAppData();
    await logAction('judicial_record', record.id, record.id ? 'edit' : 'create', `Enregistrement : ${record.reference}`);
    return true;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
    return false;
  }
}

/**
 * Sauvegarde une certification
 */
async function saveCertification(cert) {
  try {
    if (cert.id) {
      const { error } = await supabaseClient
        .from('certifications')
        .update(cert)
        .eq('id', cert.id);
      if (error) throw error;
    } else {
      cert.id = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      cert.createdAt = new Date().toISOString();
      cert.createdBy = appState.currentUser.id;
      const { error } = await supabaseClient
        .from('certifications')
        .insert([cert]);
      if (error) throw error;
    }

    await loadAppData();
    await logAction('certification', cert.id, cert.id ? 'edit' : 'create', `Certification : ${cert.reference}`);
    return true;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
    return false;
  }
}

/**
 * Sauvegarde un reçu
 */
async function saveReceipt(receipt) {
  try {
    if (receipt.id) {
      const { error } = await supabaseClient
        .from('receipts')
        .update(receipt)
        .eq('id', receipt.id);
      if (error) throw error;
    } else {
      receipt.id = `RCP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      receipt.createdAt = new Date().toISOString();
      receipt.createdBy = appState.currentUser.id;
      const { error } = await supabaseClient
        .from('receipts')
        .insert([receipt]);
      if (error) throw error;
    }

    await loadAppData();
    await logAction('receipt', receipt.id, receipt.id ? 'edit' : 'create', `Reçu : ${receipt.reference}`);
    return true;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
    return false;
  }
}

/**
 * Sauvegarde les settings
 */
async function saveSettings(settings) {
  try {
    const { data, error } = await supabaseClient
      .from('settings')
      .select('*')
      .single();

    if (!error && data) {
      const { error: updateError } = await supabaseClient
        .from('settings')
        .update(settings)
        .eq('id', data.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from('settings')
        .insert([settings]);
      if (insertError) throw insertError;
    }

    appState.settings = settings;
    await logAction('settings', 'settings', 'update', 'Paramètres mis à jour');
    return true;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde des settings:', err);
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
    await logAction('judicial_record', id, 'delete', `Enregistrement supprimé`);
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
    await logAction('certification', id, 'delete', `Certification supprimée`);
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
    await logAction('receipt', id, 'delete', `Reçu supprimé`);
    return true;
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    return false;
  }
}

/**
 * Approuve un utilisateur
 */
async function approveUser(userId) {
  try {
    const { error } = await supabaseClient
      .from('users')
      .update({ approved: true })
      .eq('id', userId);
    if (error) throw error;

    await loadAppData();
    await logAction('user', userId, 'approve', 'Utilisateur approuvé');
    return true;
  } catch (err) {
    console.error('Erreur lors de l\'approbation:', err);
    return false;
  }
}

/**
 * Supprime un utilisateur
 */
async function deleteUser(userId) {
  try {
    const { error } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;

    await loadAppData();
    await logAction('user', userId, 'delete', 'Utilisateur supprimé');
    return true;
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    return false;
  }
}

/**
 * Enregistre une action dans le journal d'audit
 */
async function logAction(entityType, entityId, action, description) {
  try {
    const logEntry = {
      entityType,
      entityId,
      action,
      description,
      userId: appState.currentUser?.id,
      userName: appState.currentUser?.name,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
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

// ============================================
// RENDU DES SECTIONS
// ============================================

/**
 * Rend le tableau des enregistrements judiciaires
 */
function renderJudicialTable(records = appState.judicialRecords) {
  if (!elements.judicialTableBody) return;

  elements.judicialTableBody.innerHTML = records
    .filter(r => !r.archived)
    .map(
      (record) => `
    <tr>
      <td>${record.reference || 'N/A'}</td>
      <td>${record.parties || 'N/A'}</td>
      <td>${record.type || 'N/A'}</td>
      <td>${record.verdict || 'N/A'}</td>
      <td>${formatDate(record.date)}</td>
      <td>${record.status || 'Nouveau'}</td>
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
 * Rend le tableau des certifications
 */
function renderCertificationTable(records = appState.certifications) {
  if (!elements.certificationTableBody) return;

  elements.certificationTableBody.innerHTML = records
    .filter(r => !r.archived)
    .map(
      (record) => `
    <tr>
      <td>${record.reference || 'N/A'}</td>
      <td>${record.name || 'N/A'}</td>
      <td>${record.type || 'N/A'}</td>
      <td>${formatCurrency(record.price || 0)}</td>
      <td>${formatDate(record.date)}</td>
      <td>${record.status || 'Nouveau'}</td>
      <td>
        ${canEdit() ? `
          <button onclick="editCertification('${record.id}')" class="action-btn edit-btn">✎</button>
          <button onclick="archiveCertification('${record.id}')" class="action-btn archive-btn">📦</button>
          <button onclick="deleteCertificationConfirm('${record.id}')" class="action-btn delete-btn">🗑</button>
        ` : ''}
      </td>
    </tr>
  `
    )
    .join('');
}

/**
 * Rend le tableau des reçus
 */
function renderReceiptTable(records = appState.receipts) {
  if (!elements.receiptTableBody) return;

  elements.receiptTableBody.innerHTML = records
    .filter(r => !r.archived)
    .map(
      (record) => `
    <tr>
      <td>${record.reference || 'N/A'}</td>
      <td>${record.collector || 'N/A'}</td>
      <td>${formatCurrency(record.amount || 0)}</td>
      <td>${formatCurrency(record.treasuryAmount || 0)}</td>
      <td>${formatCurrency(record.chancelleryAmount || 0)}</td>
      <td>${formatDate(record.date)}</td>
      <td>${record.paymentStatus || 'Nouveau'}</td>
      <td>
        ${canEdit() ? `
          <button onclick="editReceiptForm('${record.id}')" class="action-btn edit-btn">✎</button>
          <button onclick="toggleTreasuryTransfer('${record.id}')" class="action-btn ${record.treasuryTransferred ? 'transferred' : ''}">🏦</button>
          <button onclick="toggleChancelleryTransfer('${record.id}')" class="action-btn ${record.chancelleryTransferred ? 'transferred' : ''}">💼</button>
          <button onclick="archiveReceipt('${record.id}')" class="action-btn archive-btn">📦</button>
          <button onclick="deleteReceiptConfirm('${record.id}')" class="action-btn delete-btn">🗑</button>
        ` : ''}
      </td>
    </tr>
  `
    )
    .join('');
}

/**
 * Rend le tableau des utilisateurs
 */
function renderUsersTable() {
  if (!elements.usersTableBody) return;

  elements.usersTableBody.innerHTML = appState.users
    .filter(u => u.approved)
    .map(
      (user) => `
    <tr>
      <td>${user.name || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.role === 'admin' ? 'Administrateur' : 'Greffier'}</td>
      <td>
        ${isAdmin() ? `
          <button onclick="deleteUserConfirm('${user.id}')" class="action-btn delete-btn">🗑</button>
        ` : ''}
      </td>
    </tr>
  `
    )
    .join('');

  if (elements.pendingUsersTableBody) {
    elements.pendingUsersTableBody.innerHTML = appState.users
      .filter(u => !u.approved)
      .map(
        (user) => `
      <tr>
        <td>${user.name || 'N/A'}</td>
        <td>${user.email || 'N/A'}</td>
        <td>${user.role === 'admin' ? 'Administrateur' : 'Greffier'}</td>
        <td>
          ${isAdmin() ? `
            <button onclick="approveUserConfirm('${user.id}')" class="action-btn approve-btn">✓</button>
            <button onclick="deleteUserConfirm('${user.id}')" class="action-btn delete-btn">🗑</button>
          ` : ''}
        </td>
      </tr>
    `
      )
      .join('');
  }
}

/**
 * Rend le tableau du journal
 */
function renderJournalTable(records = appState.journal) {
  if (!elements.journalTableBody) return;

  elements.journalTableBody.innerHTML = records
    .map(
      (entry) => `
    <tr>
      <td>${formatDate(entry.timestamp)}</td>
      <td>${entry.userName || 'Système'}</td>
      <td>${entry.entityType || 'N/A'}</td>
      <td>${entry.action || 'N/A'}</td>
      <td>${entry.description || 'N/A'}</td>
    </tr>
  `
    )
    .join('');
}

/**
 * Rend le dashboard
 */
function renderDashboard() {
  if (!elements.dashboardSection) return;

  const judicialCount = appState.judicialRecords.filter(r => !r.archived).length;
  const certificationCount = appState.certifications.filter(r => !r.archived).length;
  const totalReceipts = appState.receipts
    .filter(r => !r.archived)
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const treasuryTotal = appState.receipts
    .filter(r => !r.archived)
    .reduce((sum, r) => sum + (r.treasuryAmount || 0), 0);

  const chancelleryTotal = appState.receipts
    .filter(r => !r.archived)
    .reduce((sum, r) => sum + (r.chancelleryAmount || 0), 0);

  const lastActions = appState.journal.slice(0, 5);

  elements.dashboardSection.innerHTML = `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>🎖️ Chancellerie Impériale de Bordeciel</h1>
        <p>Bienvenue, ${appState.currentUser?.name || 'Utilisateur'}</p>
      </div>

      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>Dossiers Judiciaires</h3>
          <p class="stat-number">${judicialCount}</p>
          <a href="#" data-section="judicial">Voir les dossiers</a>
        </div>

        <div class="stat-card">
          <h3>Certifications</h3>
          <p class="stat-number">${certificationCount}</p>
          <a href="#" data-section="certification">Voir les certifications</a>
        </div>

        <div class="stat-card">
          <h3>Total Reçus</h3>
          <p class="stat-number">${formatCurrency(totalReceipts)}</p>
          <a href="#" data-section="payments">Voir les reçus</a>
        </div>

        <div class="stat-card">
          <h3>Trésor</h3>
          <p class="stat-number">${formatCurrency(treasuryTotal)}</p>
        </div>

        <div class="stat-card">
          <h3>Chancellerie</h3>
          <p class="stat-number">${formatCurrency(chancelleryTotal)}</p>
        </div>
      </div>

      <div class="dashboard-section">
        <h2>📋 Dernières Activités</h2>
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Type</th>
              <th>Action</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${lastActions
              .map(
                (entry) => `
              <tr>
                <td>${formatDate(entry.timestamp)}</td>
                <td>${entry.userName || 'Système'}</td>
                <td>${entry.entityType || 'N/A'}</td>
                <td>${entry.action || 'N/A'}</td>
                <td>${entry.description || 'N/A'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================
// FIN BLOC 1
// ============================================
// ============================================
// FORMULAIRES & MODALES
// ============================================

/**
 * Affiche le formulaire judiciaire
 */
function showJudicialForm(record = null) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'judicial-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${record ? '✎ Modifier un Dossier' : '➕ Nouveau Dossier Judiciaire'}</h2>
        <button type="button" onclick="document.getElementById('judicial-modal').remove()" class="close-btn">✕</button>
      </div>
      <form id="temp-judicial-form">
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date" value="${record?.date || new Date().toISOString().split('T')[0]}" required>
        </div>

        <div class="form-group">
          <label>Référence</label>
          <input type="text" name="reference" value="${record?.reference || ''}" placeholder="JUD-2026-XXXXX" required>
        </div>

        <div class="form-group">
          <label>Parties Impliquées</label>
          <textarea name="parties" placeholder="Nom des parties" required>${record?.parties || ''}</textarea>
        </div>

        <div class="form-group">
          <label>Type de Dossier</label>
          <select name="type" required>
            <option value="">-- Sélectionner --</option>
            <option value="Civil" ${record?.type === 'Civil' ? 'selected' : ''}>Civil</option>
            <option value="Criminel" ${record?.type === 'Criminel' ? 'selected' : ''}>Criminel</option>
            <option value="Administratif" ${record?.type === 'Administratif' ? 'selected' : ''}>Administratif</option>
            <option value="Autre" ${record?.type === 'Autre' ? 'selected' : ''}>Autre</option>
          </select>
        </div>

        <div class="form-group">
          <label>Verdict/Décision</label>
          <textarea name="verdict" placeholder="Résumé du verdict" required>${record?.verdict || ''}</textarea>
        </div>

        <div class="form-group">
          <label>Statut</label>
          <select name="status" required>
            <option value="Nouveau" ${record?.status === 'Nouveau' ? 'selected' : ''}>Nouveau</option>
            <option value="En cours" ${record?.status === 'En cours' ? 'selected' : ''}>En cours</option>
            <option value="Clos" ${record?.status === 'Clos' ? 'selected' : ''}>Clos</option>
            <option value="Suspendu" ${record?.status === 'Suspendu' ? 'selected' : ''}>Suspendu</option>
          </select>
        </div>

        <div class="form-group">
          <label>Notes Additionnelles</label>
          <textarea name="notes" placeholder="Observations">${record?.notes || ''}</textarea>
        </div>

        <div class="modal-buttons">
          <button type="button" onclick="document.getElementById('judicial-modal').remove()" class="secondary-btn">Annuler</button>
          <button type="submit" class="primary-btn">Enregistrer</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#temp-judicial-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(modal.querySelector('#temp-judicial-form'));

    const recordData = {
      id: record?.id || null,
      date: formData.get('date'),
      reference: formData.get('reference'),
      parties: formData.get('parties'),
      type: formData.get('type'),
      verdict: formData.get('verdict'),
      status: formData.get('status'),
      notes: formData.get('notes'),
      archived: record?.archived || false,
      createdAt: record?.createdAt || new Date().toISOString(),
    };

    const success = await saveJudicialRecord(recordData);

    if (success) {
      showMessage(elements.judicialMessage, '✅ Dossier enregistré avec succès.', 'success');
      renderJudicialTable();
      modal.remove();
    } else {
      showMessage(elements.judicialMessage, '❌ Erreur lors de l\'enregistrement.', 'error');
    }
  });
}

/**
 * Édite un dossier judiciaire
 */
function editJudicial(id) {
  const record = appState.judicialRecords.find(r => r.id === id);
  if (record) {
    showJudicialForm(record);
  }
}

/**
 * Confirme la suppression d'un dossier judiciaire
 */
function deleteJudicialConfirm(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
    deleteJudicial(id);
    renderJudicialTable();
    showMessage(elements.judicialMessage, '✅ Dossier supprimé.', 'success');
  }
}

/**
 * Archive un dossier judiciaire
 */
async function archiveJudicial(id) {
  const record = appState.judicialRecords.find(r => r.id === id);
  if (record) {
    record.archived = true;
    await saveJudicialRecord(record);
    renderJudicialTable();
    showMessage(elements.judicialMessage, '✅ Dossier archivé.', 'success');
  }
}

/**
 * Restaure un dossier judiciaire
 */
async function restoreJudicial(id) {
  const record = appState.judicialRecords.find(r => r.id === id);
  if (record) {
    record.archived = false;
    await saveJudicialRecord(record);
    renderJudicialTable();
    showMessage(elements.judicialMessage, '✅ Dossier restauré.', 'success');
  }
}

// ============================================
// CERTIFICATIONS
// ============================================

/**
 * Affiche le formulaire de certification
 */
function showCertificationForm(cert = null) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'certification-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${cert ? '✎ Modifier une Certification' : '➕ Nouvelle Certification'}</h2>
        <button type="button" onclick="document.getElementById('certification-modal').remove()" class="close-btn">✕</button>
      </div>
      <form id="temp-certification-form">
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date" value="${cert?.date || new Date().toISOString().split('T')[0]}" required>
        </div>

        <div class="form-group">
          <label>Référence</label>
          <input type="text" name="reference" value="${cert?.reference || ''}" placeholder="CERT-2026-XXXXX" required>
        </div>

        <div class="form-group">
          <label>Nom du Demandeur</label>
          <input type="text" name="name" value="${cert?.name || ''}" placeholder="Nom complet" required>
        </div>

        <div class="form-group">
          <label>Type de Certification</label>
          <select name="type" required>
            <option value="">-- Sélectionner --</option>
            <option value="Authentification" ${cert?.type === 'Authentification' ? 'selected' : ''}>Authentification</option>
            <option value="Conformité" ${cert?.type === 'Conformité' ? 'selected' : ''}>Conformité</option>
            <option value="Légalisation" ${cert?.type === 'Légalisation' ? 'selected' : ''}>Légalisation</option>
            <option value="Autre" ${cert?.type === 'Autre' ? 'selected' : ''}>Autre</option>
          </select>
        </div>

        <div class="form-group">
          <label>Prix</label>
          <input type="number" name="price" value="${cert?.price || appState.settings.certificationPrice || 50}" step="0.01" required>
        </div>

        <div class="form-group">
          <label>Statut</label>
          <select name="status" required>
            <option value="Nouveau" ${cert?.status === 'Nouveau' ? 'selected' : ''}>Nouveau</option>
            <option value="En traitement" ${cert?.status === 'En traitement' ? 'selected' : ''}>En traitement</option>
            <option value="Délivré" ${cert?.status === 'Délivré' ? 'selected' : ''}>Délivré</option>
            <option value="Rejeté" ${cert?.status === 'Rejeté' ? 'selected' : ''}>Rejeté</option>
          </select>
        </div>

        <div class="form-group">
          <label>Observations</label>
          <textarea name="notes" placeholder="Notes">${cert?.notes || ''}</textarea>
        </div>

        <div class="modal-buttons">
          <button type="button" onclick="document.getElementById('certification-modal').remove()" class="secondary-btn">Annuler</button>
          <button type="submit" class="primary-btn">Enregistrer</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#temp-certification-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(modal.querySelector('#temp-certification-form'));

    const certData = {
      id: cert?.id || null,
      date: formData.get('date'),
      reference: formData.get('reference'),
      name: formData.get('name'),
      type: formData.get('type'),
      price: Number(formData.get('price')) || 0,
      status: formData.get('status'),
      notes: formData.get('notes'),
      archived: cert?.archived || false,
      createdAt: cert?.createdAt || new Date().toISOString(),
    };

    const success = await saveCertification(certData);

    if (success) {
      showMessage(elements.certificationMessage, '✅ Certification enregistrée avec succès.', 'success');
      renderCertificationTable();
      modal.remove();
    } else {
      showMessage(elements.certificationMessage, '❌ Erreur lors de l\'enregistrement.', 'error');
    }
  });
}

/**
 * Édite une certification
 */
function editCertification(id) {
  const cert = appState.certifications.find(c => c.id === id);
  if (cert) {
    showCertificationForm(cert);
  }
}

/**
 * Confirme la suppression d'une certification
 */
function deleteCertificationConfirm(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette certification ?')) {
    deleteCertification(id);
    renderCertificationTable();
    showMessage(elements.certificationMessage, '✅ Certification supprimée.', 'success');
  }
}

/**
 * Archive une certification
 */
async function archiveCertification(id) {
  const cert = appState.certifications.find(c => c.id === id);
  if (cert) {
    cert.archived = true;
    await saveCertification(cert);
    renderCertificationTable();
    showMessage(elements.certificationMessage, '✅ Certification archivée.', 'success');
  }
}

/**
 * Restaure une certification
 */
async function restoreCertification(id) {
  const cert = appState.certifications.find(c => c.id === id);
  if (cert) {
    cert.archived = false;
    await saveCertification(cert);
    renderCertificationTable();
    showMessage(elements.certificationMessage, '✅ Certification restaurée.', 'success');
  }
}

// ============================================
// REÇUS & PAIEMENTS
// ============================================

/**
 * Affiche le formulaire de reçu
 */
function showReceiptForm(receipt = null) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'receipt-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${receipt ? '✎ Modifier un Reçu' : '➕ Nouveau Reçu'}</h2>
        <button type="button" onclick="document.getElementById('receipt-modal').remove()" class="close-btn">✕</button>
      </div>
      <form id="temp-receipt-form">
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date" value="${receipt?.date || new Date().toISOString().split('T')[0]}" required>
        </div>

        <div class="form-group">
          <label>Type d'Enregistrement</label>
          <select name="recordType" required onchange="updateReceiptRecordOptions()">
            <option value="">-- Sélectionner --</option>
            <option value="judicial" ${receipt?.recordType === 'judicial' ? 'selected' : ''}>Dossier Judiciaire</option>
            <option value="certification" ${receipt?.recordType === 'certification' ? 'selected' : ''}>Certification</option>
          </select>
        </div>

        <div class="form-group">
          <label>Enregistrement</label>
          <select name="recordId" required>
            <option value="">-- Sélectionner --</option>
          </select>
        </div>

        <div class="form-group">
          <label>Collecteur</label>
          <input type="text" name="collector" value="${receipt?.collector || ''}" placeholder="Nom du collecteur" required>
        </div>

        <div class="form-group">
          <label>Montant Total (Or)</label>
          <input type="number" name="amount" value="${receipt?.amount || 0}" step="0.01" required onchange="updateReceiptDistribution()">
        </div>

        <div class="form-group">
          <label>Pourcentage Trésor (%)</label>
          <input type="number" name="treasuryPercent" value="${receipt?.treasuryPercent || appState.settings.judicialTreasuryPercentage || 70}" min="0" max="100" step="1" readonly>
        </div>

        <div class="form-group">
          <label>Montant Trésor</label>
          <input type="text" name="treasuryAmount" value="${formatCurrency(receipt?.treasuryAmount || 0)}" readonly>
        </div>

        <div class="form-group">
          <label>Montant Chancellerie</label>
          <input type="text" name="chancelleryAmount" value="${formatCurrency(receipt?.chancelleryAmount || 0)}" readonly>
        </div>

        <div class="form-group">
          <label>Méthode de Paiement</label>
          <select name="method" required>
            <option value="">-- Sélectionner --</option>
            <option value="Espèces" ${receipt?.method === 'Espèces' ? 'selected' : ''}>Espèces</option>
            <option value="Chèque" ${receipt?.method === 'Chèque' ? 'selected' : ''}>Chèque</option>
            <option value="Transfert" ${receipt?.method === 'Transfert' ? 'selected' : ''}>Transfert</option>
          </select>
        </div>

        <div class="form-group checkbox">
          <input type="checkbox" name="treasuryTransferred" ${receipt?.treasuryTransferred ? 'checked' : ''}>
          <label>Transféré au Trésor</label>
        </div>

        <div class="form-group checkbox">
          <input type="checkbox" name="chancelleryTransferred" ${receipt?.chancelleryTransferred ? 'checked' : ''}>
          <label>Transféré à la Chancellerie</label>
        </div>

        <div class="modal-buttons">
          <button type="button" onclick="document.getElementById('receipt-modal').remove()" class="secondary-btn">Annuler</button>
          <button type="submit" class="primary-btn">Enregistrer</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  updateReceiptRecordOptions();

  modal.querySelector('#temp-receipt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(modal.querySelector('#temp-receipt-form'));

    const amount = Number(formData.get('amount')) || 0;
    const treasuryPercent = appState.settings.judicialTreasuryPercentage;
    const chancelleryPercent = 100 - treasuryPercent;

    const receiptData = {
      id: receipt?.id || null,
      date: formData.get('date'),
      recordType: formData.get('recordType'),
      recordId: formData.get('recordId'),
      collector: formData.get('collector'),
      amount: amount,
      treasuryPercent: treasuryPercent,
      chancelleryPercent: chancelleryPercent,
      treasuryAmount: (amount * treasuryPercent) / 100,
      chancelleryAmount: (amount * chancelleryPercent) / 100,
      method: formData.get('method'),
      treasuryTransferred: formData.get('treasuryTransferred') ? true : false,
      chancelleryTransferred: formData.get('chancelleryTransferred') ? true : false,
      paymentStatus: 'Enregistré',
      reference: receipt?.reference || `RCP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      archived: receipt?.archived || false,
      createdAt: receipt?.createdAt || new Date().toISOString(),
    };

    const success = await saveReceipt(receiptData);

    if (success) {
      showMessage(elements.receiptMessage, '✅ Reçu enregistré avec succès.', 'success');
      renderReceiptTable();
      modal.remove();
    } else {
      showMessage(elements.receiptMessage, '❌ Erreur lors de l\'enregistrement.', 'error');
    }
  });
}

/**
 * Édite un reçu
 */
function editReceiptForm(id) {
  const receipt = appState.receipts.find(r => r.id === id);
  if (receipt) {
    showReceiptForm(receipt);
  }
}

/**
 * Met à jour les options d'enregistrement dans le formulaire reçu
 */
function updateReceiptRecordOptions() {
  const recordTypeSelect = document.querySelector('[name="recordType"]');
  const recordIdSelect = document.querySelector('[name="recordId"]');

  if (!recordTypeSelect || !recordIdSelect) return;

  const recordType = recordTypeSelect.value;
  recordIdSelect.innerHTML = '<option value="">-- Sélectionner --</option>';

  if (recordType === 'judicial') {
    appState.judicialRecords.forEach((record) => {
      const option = document.createElement('option');
      option.value = record.id;
      option.textContent = `${record.reference} - ${record.parties}`;
      recordIdSelect.appendChild(option);
    });
  } else if (recordType === 'certification') {
    appState.certifications.forEach((cert) => {
      const option = document.createElement('option');
      option.value = cert.id;
      option.textContent = `${cert.reference} - ${cert.name}`;
      recordIdSelect.appendChild(option);
    });
  }
}

/**
 * Met à jour la répartition des montants dans le formulaire reçu
 */
function updateReceiptDistribution() {
  const amountInput = document.querySelector('[name="amount"]');
  const treasuryPercentInput = document.querySelector('[name="treasuryPercent"]');
  const treasuryAmountInput = document.querySelector('[name="treasuryAmount"]');
  const chancelleryAmountInput = document.querySelector('[name="chancelleryAmount"]');

  if (!amountInput || !treasuryPercentInput) return;

  const amount = Number(amountInput.value) || 0;
  const treasuryPercent = Number(treasuryPercentInput.value) || 70;
  const chancelleryPercent = 100 - treasuryPercent;

  const treasuryAmount = (amount * treasuryPercent) / 100;
  const chancelleryAmount = (amount * chancelleryPercent) / 100;

  if (treasuryAmountInput) treasuryAmountInput.value = formatCurrency(treasuryAmount);
  if (chancelleryAmountInput) chancelleryAmountInput.value = formatCurrency(chancelleryAmount);
}

/**
 * Confirme la suppression d'un reçu
 */
function deleteReceiptConfirm(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce reçu ?')) {
    deleteReceipt(id);
    renderReceiptTable();
    showMessage(elements.receiptMessage, '✅ Reçu supprimé.', 'success');
  }
}

/**
 * Archive un reçu
 */
async function archiveReceipt(id) {
  const receipt = appState.receipts.find(r => r.id === id);
  if (receipt) {
    receipt.archived = true;
    await saveReceipt(receipt);
    renderReceiptTable();
    showMessage(elements.receiptMessage, '✅ Reçu archivé.', 'success');
  }
}

/**
 * Restaure un reçu
 */
async function restoreReceipt(id) {
  const receipt = appState.receipts.find(r => r.id === id);
  if (receipt) {
    receipt.archived = false;
    await saveReceipt(receipt);
    renderReceiptTable();
    showMessage(elements.receiptMessage, '✅ Reçu restauré.', 'success');
  }
}

/**
 * Bascule le statut de transfert au Trésor
 */
async function toggleTreasuryTransfer(id) {
  const receipt = appState.receipts.find(r => r.id === id);
  if (receipt) {
    receipt.treasuryTransferred = !receipt.treasuryTransferred;
    await saveReceipt(receipt);
    renderReceiptTable();
    showMessage(elements.receiptMessage, receipt.treasuryTransferred ? '✅ Transfert au Trésor confirmé.' : '✅ Transfert au Trésor annulé.', 'success');
  }
}

/**
 * Bascule le statut de transfert à la Chancellerie
 */
async function toggleChancelleryTransfer(id) {
  const receipt = appState.receipts.find(r => r.id === id);
  if (receipt) {
    receipt.chancelleryTransferred = !receipt.chancelleryTransferred;
    await saveReceipt(receipt);
    renderReceiptTable();
    showMessage(elements.receiptMessage, receipt.chancelleryTransferred ? '✅ Transfert à la Chancellerie confirmé.' : '✅ Transfert à la Chancellerie annulé.', 'success');
  }
}

// ============================================
// UTILISATEURS
// ============================================

/**
 * Confirme l'approbation d'un utilisateur
 */
function approveUserConfirm(userId) {
  if (confirm('Approuver cet utilisateur ?')) {
    approveUser(userId);
    renderUsersTable();
    showMessage(elements.usersTableBody?.parentElement?.querySelector('.form-success') || document.createElement('div'), '✅ Utilisateur approuvé.', 'success');
  }
}

/**
 * Confirme la suppression d'un utilisateur
 */
function deleteUserConfirm(userId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
    deleteUser(userId);
    renderUsersTable();
  }
}

// ============================================
// FILTRES & RECHERCHE
// ============================================

/**
 * Initialise les filtres
 */
function initFilters() {
  // Filtres Judiciaires
  if (elements.judicialFilter) {
    elements.judicialFilter.addEventListener('input', filterJudicial);
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
    elements.resetJudicialFilters.addEventListener('click', resetDataFilters);
  }

  // Filtres Certifications
  if (elements.certificationFilter) {
    elements.certificationFilter.addEventListener('input', filterCertification);
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
    elements.resetCertificationFilters.addEventListener('click', resetDataFilters);
  }

  // Filtres Reçus
  if (elements.receiptFilter) {
    elements.receiptFilter.addEventListener('input', filterReceipt);
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
    elements.resetReceiptFilters.addEventListener('click', resetDataFilters);
  }

  // Filtres Journal
  if (elements.journalFilter) {
    elements.journalFilter.addEventListener('input', filterJournal);
  }
  if (elements.journalDateFrom) {
    elements.journalDateFrom.addEventListener('change', filterJournal);
  }
  if (elements.journalDateTo) {
    elements.journalDateTo.addEventListener('change', filterJournal);
  }
  if (elements.resetJournalFilters) {
    elements.resetJournalFilters.addEventListener('click', resetDataFilters);
  }
}

/**
 * Filtre les enregistrements judiciaires
 */
function filterJudicial() {
  const searchTerm = elements.judicialFilter?.value.toLowerCase() || '';
  const statusFilter = elements.judicialStatusFilter?.value || '';
  const dateFrom = elements.judicialDateFrom?.value || '';
  const dateTo = elements.judicialDateTo?.value || '';

  const filtered = appState.judicialRecords.filter((record) => {
    const matchesSearch = !searchTerm || record.reference?.toLowerCase().includes(searchTerm) || record.parties?.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || record.status === statusFilter;
    const matchesDateFrom = !dateFrom || new Date(record.date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(record.date) <= new Date(dateTo);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

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

  const filtered = appState.certifications.filter((cert) => {
    const matchesSearch = !searchTerm || cert.reference?.toLowerCase().includes(searchTerm) || cert.name?.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || cert.status === statusFilter;
    const matchesDateFrom = !dateFrom || new Date(cert.date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(cert.date) <= new Date(dateTo);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

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

  const filtered = appState.receipts.filter((receipt) => {
    const matchesSearch = !searchTerm || receipt.reference?.toLowerCase().includes(searchTerm) || receipt.collector?.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || receipt.paymentStatus === statusFilter;
    const matchesDateFrom = !dateFrom || new Date(receipt.date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(receipt.date) <= new Date(dateTo);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  renderReceiptTable(filtered);
}

/**
 * Filtre le journal
 */
function filterJournal() {
  const searchTerm = elements.journalFilter?.value.toLowerCase() || '';
  const dateFrom = elements.journalDateFrom?.value || '';
  const dateTo = elements.journalDateTo?.value || '';

  const filtered = appState.journal.filter((entry) => {
    const matchesSearch = !searchTerm || entry.description?.toLowerCase().includes(searchTerm) || entry.userName?.toLowerCase().includes(searchTerm);
    const matchesDateFrom = !dateFrom || new Date(entry.timestamp) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(entry.timestamp) <= new Date(dateTo);

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  renderJournalTable(filtered);
}

/**
 * Réinitialise les filtres
 */
function resetDataFilters(e) {
  const section = e.target.closest('[id$="-section"]')?.id || '';

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
// GESTION DES SECTIONS
// ============================================

/**
 * Change la section active
 */
function setSection(sectionName) {
  appState.activeSection = sectionName;

  // Masquer toutes les sections
  document.querySelectorAll('[id$="-section"]').forEach((section) => {
    section.style.display = 'none';
  });

  // Désactiver les boutons de navigation
  elements.navSections.forEach((btn) => {
    btn.classList.remove('active');
  });

  // Afficher la section active
  let activeElement = null;
  switch (sectionName) {
    case 'dashboard':
      activeElement = elements.dashboardSection;
      renderDashboard();
      break;
    case 'judicial':
      activeElement = elements.judicialSection;
      renderJudicialTable();
      break;
    case 'certification':
      activeElement = elements.certificationSection;
      renderCertificationTable();
      break;
    case 'payments':
      activeElement = elements.paymentsSection;
      renderReceiptTable();
      break;
    case 'users':
      if (isAdmin()) {
        activeElement = elements.usersSection;
        renderUsersTable();
      }
      break;
    case 'journal':
      activeElement = elements.journalSection;
      renderJournalTable();
      break;
    case 'settings':
      if (isAdmin()) {
        activeElement = elements.settingsSection;
        renderSettings();
      }
      break;
  }

  if (activeElement) {
    activeElement.style.display = 'block';
  }

  // Activer le bouton de navigation correspondant
  document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');
}

// ============================================
// SETTINGS
// ============================================

/**
 * Rend et initialise la section settings
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
        <label>Pourcentage Trésor (%)</label>
        <input type="number" id="settings-treasury-percent" value="${appState.settings.judicialTreasuryPercentage || 70}" min="0" max="100" step="1">
      </div>

      <div class="form-group">
        <label>Prix par Défaut des Certifications (Or)</label>
        <input type="number" id="settings-cert-price" value="${appState.settings.certificationPrice || 50}" step="0.01">
      </div>

      <div class="form-buttons">
        <button type="button" onclick="saveSettingsForm()" class="primary-btn">Enregistrer</button>
      </div>
    </div>
  `;
}

/**
 * Sauvegarde les paramètres
 */
async function saveSettingsForm() {
  const institution = document.getElementById('settings-institution')?.value || '';
  const treasuryPercent = Number(document.getElementById('settings-treasury-percent')?.value) || 70;
  const certPrice = Number(document.getElementById('settings-cert-price')?.value) || 50;

  const settings = {
    institution,
    judicialTreasuryPercentage: treasuryPercent,
    certificationPrice: certPrice,
  };

  const success = await saveSettings(settings);

  if (success) {
    showMessage(elements.settingsMessage || document.createElement('div'), '✅ Paramètres enregistrés avec succès.', 'success');
  } else {
    showMessage(elements.settingsMessage || document.createElement('div'), '❌ Erreur lors de l\'enregistrement.', 'error');
  }
}

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise la navigation
 */
function initNav() {
  elements.navSections.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const section = btn.getAttribute('data-section');
      setSection(section);
    });
  });

  if (elements.logoutButton) {
    elements.logoutButton.addEventListener('click', logoutUser);
  }
}

/**
 * Initialise les formulaires
 */
function initForms() {
  // Judicial Form
  if (elements.judicialForm) {
    elements.judicialForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showJudicialForm();
    });
  }

  // Certification Form
  if (elements.certificationForm) {
    elements.certificationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showCertificationForm();
    });
  }

  // Receipt Form
  if (elements.receiptForm) {
    elements.receiptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showReceiptForm();
    });
  }

  // Login
  if (elements.loginButton) {
    elements.loginButton.addEventListener('click', loginUser);
    elements.loginEmail.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loginUser();
    });
    elements.loginPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loginUser();
    });
  }

  // Register
  if (elements.registerButton) {
    elements.registerButton.addEventListener('click', registerUser);
    elements.registerEmail.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') registerUser();
    });
    elements.registerPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') registerUser();
    });
  }
}

// ============================================
// GESTION DE L'AUTHENTIFICATION SUPABASE
// ============================================

let unsubscribeAuth = null;

async function initializeAuth() {
  // S'abonner aux changements d'authentification Supabase
  unsubscribeAuth = supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event, 'Session:', session?.user?.email);

    if (session && session.user) {
      // ✅ Utilisateur connecté
      const user = session.user;
      appState.currentUser = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || 'greffier',
        approved: user.user_metadata?.approved || false,
      };

      appState.isAuthenticated = true;
      console.log('User logged in:', appState.currentUser.name);
      
      await loadAppData();
      showAppScreen();
    } else {
      // ❌ Utilisateur déconnecté
      console.log('User logged out');
      appState.currentUser = null;
      appState.isAuthenticated = false;
      appState.judicialRecords = [];
      appState.certifications = [];
      appState.receipts = [];
      appState.journal = [];
      showAuthScreen();
    }
  });
}

// Initialiser l'authentification au chargement
document.addEventListener('DOMContentLoaded', async () => {
  await initializeAuth();
  initForms();
  initFilters();
});

// Nettoyer le listener à la déconnexion
window.addEventListener('beforeunload', () => {
  if (unsubscribeAuth) {
    unsubscribeAuth();
  }
});

// ============================================
// FIN BLOC 2
// ============================================
