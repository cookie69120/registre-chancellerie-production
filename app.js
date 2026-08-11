const SUPABASE_URL = 'https://hqiyraklzdmgqmytjjjo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hCFQ6GdF0AqQH32_qbKrkg_UJTbq70i';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const storageKey = 'imperialChancellerieData';
const sessionKey = 'imperialChancellerieSession';

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

// ========== GESTION DE SESSION LOCALE ==========
function saveLocalSession() {
  try {
    localStorage.setItem(
      sessionKey,
      JSON.stringify({
        currentUserId: appState.currentUser ? appState.currentUser.id : null,
        isAuthenticated: appState.isAuthenticated,
      })
    );
  } catch (error) {
    console.error('Erreur sauvegarde session locale :', error);
  }
}

function loadLocalSession() {
  try {
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erreur lecture session locale :', error);
    return null;
  }
}

function clearLocalSession() {
  localStorage.removeItem(sessionKey);
  appState.currentUser = null;
  appState.isAuthenticated = false;
}

// ========== ÉLÉMENTS DOM ==========
const elements = {
  loginSection: document.getElementById('login-section'),
  appSection: document.getElementById('app-section'),
  loginForm: document.getElementById('login-form'),
  emailInput: document.getElementById('email'),
  passwordInput: document.getElementById('password'),
  loginButton: document.getElementById('login-button'),
  loginError: document.getElementById('login-error'),
  logoutButton: document.getElementById('logout-button'),
  currentUserName: document.getElementById('current-user-name'),
  currentUserRole: document.getElementById('current-user-role'),
  nav: document.getElementById('nav'),
  sections: document.querySelectorAll('[data-section]'),
  dashboardSection: document.getElementById('dashboard-section'),
  judicialSection: document.getElementById('judicial-section'),
  certificationSection: document.getElementById('certification-section'),
  receiptsSection: document.getElementById('receipts-section'),
  usersSection: document.getElementById('users-section'),
  journalSection: document.getElementById('journal-section'),
  settingsSection: document.getElementById('settings-section'),
  newJudicialButton: document.getElementById('new-judicial-button'),
  newCertificationButton: document.getElementById('new-certification-button'),
  addReceiptButton: document.getElementById('add-receipt-button'),
  refreshDashboardButton: document.getElementById('refresh-dashboard'),
  refreshJudicialButton: document.getElementById('refresh-judicial'),
  refreshCertificationButton: document.getElementById('refresh-certification'),
  refreshReceiptButton: document.getElementById('refresh-receipt'),
  refreshUsersButton: document.getElementById('refresh-users'),
  refreshJournalButton: document.getElementById('refresh-journal'),
  judicialForm: document.getElementById('judicial-form'),
  judicialModal: document.getElementById('judicial-modal'),
  certificationForm: document.getElementById('certification-form'),
  certificationModal: document.getElementById('certification-modal'),
  receiptForm: document.getElementById('receipt-form'),
  receiptModal: document.getElementById('receipt-modal'),
  userForm: document.getElementById('user-form'),
  userModal: document.getElementById('user-modal'),
  settingsForm: document.getElementById('settings-form'),
  settingsModal: document.getElementById('settings-modal'),
  cardTotalJudicial: document.getElementById('card-total-judicial'),
  cardTotalCertification: document.getElementById('card-total-certification'),
  cardTotalFines: document.getElementById('card-total-fines'),
  cardTotalDue: document.getElementById('card-total-due'),
  cardTotalTreasury: document.getElementById('card-total-treasury'),
  cardTotalChancellery: document.getElementById('card-total-chancellery'),
  cardTotalCertifications: document.getElementById('card-total-certifications'),
  cardPendingTotal: document.getElementById('card-pending-total'),
  cardPendingTreasury: document.getElementById('card-pending-treasury'),
  cardPendingChancellery: document.getElementById('card-pending-chancellery'),
  cardArchivedJudicial: document.getElementById('card-archived-judicial'),
  cardArchivedCertifications: document.getElementById('card-archived-certifications'),
  dashboardLatestList: document.getElementById('dashboard-latest-list'),
  statusNotStarted: document.getElementById('status-not-started'),
  statusInProgress: document.getElementById('status-in-progress'),
  statusCompleted: document.getElementById('status-completed'),
  statusSuspended: document.getElementById('status-suspended'),
  statusCancelled: document.getElementById('status-cancelled'),
  statusRemaining: document.getElementById('status-remaining'),
  judicialSearch: document.getElementById('judicial-search'),
  judicialStatusFilter: document.getElementById('judicial-status-filter'),
  judicialFineStatusFilter: document.getElementById('judicial-fine-status-filter'),
  judicialShowArchived: document.getElementById('judicial-show-archived'),
  judicialTable: document.getElementById('judicial-table'),
  certificationSearch: document.getElementById('certification-search'),
  certificationStatusFilter: document.getElementById('certification-status-filter'),
  certificationPaymentFilter: document.getElementById('certification-payment-filter'),
  certificationShowArchived: document.getElementById('certification-show-archived'),
  certificationTable: document.getElementById('certification-table'),
  receiptTable: document.getElementById('receipt-table'),
  receiptSelect: document.getElementById('receipt-select'),
  usersList: document.getElementById('users-list'),
  journalTable: document.getElementById('journal-table'),
};

// ========== RESET ET INIT STATE ==========
function resetState() {
  const year = new Date().getFullYear();
  appState.users = [
    {
      id: crypto.randomUUID(),
      name: 'Chancelier impérial',
      email: 'chancelier@empire.im',
      password: 'Imperial123',
      role: 'Chancelier',
      status: 'Habilité',
      createdAt: new Date().toISOString(),
      lastActivity: null,
    },
    {
      id: crypto.randomUUID(),
      name: 'Magistrat Solenne',
      email: 'magistrat@empire.im',
      password: 'Magistrat123',
      role: 'Magistrat',
      status: 'Habilité',
      createdAt: new Date().toISOString(),
      lastActivity: null,
    },
    {
      id: crypto.randomUUID(),
      name: 'Scribe Aurèle',
      email: 'scribe@empire.im',
      password: 'Scribe123',
      role: 'Scribe',
      status: 'Habilité',
      createdAt: new Date().toISOString(),
      lastActivity: null,
    },
    {
      id: crypto.randomUUID(),
      name: 'Trésorier Valyn',
      email: 'tresorier@empire.im',
      password: 'Tresorier123',
      role: 'Trésorier',
      status: 'Habilité',
      createdAt: new Date().toISOString(),
      lastActivity: null,
    },
  ];
  appState.settings = {
    judicialTreasuryPercentage: 60,
    certificationTreasuryPercentage: 60,
    referenceYear: String(year),
    institution: 'Registre de la Chancellerie impériale',
    currency: 'septimes',
  };
  appState.journal = [];
  appState.judicialRecords = [];
  appState.certifications = [];
  appState.receipts = [];
  appState.counters = { judicial: 0, certification: 0 };
  appState.activeSection = 'dashboard';
}

// ========== SAUVEGARDE/CHARGEMENT DONNÉES PARTAGÉES ==========
async function saveState() {
  // Crée une copie SANS currentUser et isAuthenticated
  const sharedState = {
    users: appState.users,
    judicialRecords: appState.judicialRecords,
    certifications: appState.certifications,
    receipts: appState.receipts,
    journal: appState.journal,
    settings: appState.settings,
    counters: appState.counters,
    activeSection: appState.activeSection,
  };

  const { data, error } = await supabaseClient
    .from('app_settings')
    .upsert(
      {
        id: 1,
        app_state: sharedState,
      },
      {
        onConflict: 'id',
      }
    )
    .select();

  if (error) {
    console.error('Erreur sauvegarde Supabase :', error);
    return false;
  }

  console.log('État partagé sauvegardé dans Supabase');
  return true;
}

async function loadState() {
  const { data, error } = await supabaseClient
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Erreur chargement Supabase :', error);
    resetState();
    return false;
  }

  if (data && data.app_state) {
    const shared = data.app_state;
    appState.users = shared.users || [];
    appState.judicialRecords = shared.judicialRecords || [];
    appState.certifications = shared.certifications || [];
    appState.receipts = shared.receipts || [];
    appState.journal = shared.journal || [];
    appState.settings = shared.settings || {};
    appState.counters = shared.counters || { judicial: 0, certification: 0 };
    appState.activeSection = shared.activeSection || 'dashboard';
  } else {
    resetState();
  }

  // Restaure la session LOCALE (propre à ce navigateur)
  const localSession = loadLocalSession();
  if (localSession && localSession.isAuthenticated && localSession.currentUserId) {
    const user = appState.users.find((u) => u.id === localSession.currentUserId);
    if (user) {
      appState.currentUser = user;
      appState.isAuthenticated = true;
    } else {
      clearLocalSession();
    }
  } else {
    appState.currentUser = null;
    appState.isAuthenticated = false;
  }

  return true;
}

// ========== FORMATAGE ==========
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', dateOptions);
}

function formatMoney(value) {
  const amount = Number(value);
  const unit = Math.abs(amount) === 1 ? 'Septim' : 'Septims';
  return `${amount.toLocaleString('fr-FR')} ${unit}`;
}

function getSentenceStatusColor(status) {
  switch (status) {
    case 'Non commencée':
      return 'status-red';
    case "En cours d'exécution":
      return 'status-orange';
    case 'Exécutée':
      return 'status-green';
    default:
      return '';
  }
}

function getFineStatusColor(status) {
  switch (status) {
    case 'Non réglée':
    case 'Non réglé':
      return 'status-red';
    case 'Partiellement réglée':
    case 'Partiellement réglé':
      return 'status-orange';
    case 'Réglée':
    case 'Réglé':
      return 'status-green';
    default:
      return '';
  }
}

const getPaymentStatusColor = getFineStatusColor;

// ========== RECHERCHE UTILISATEUR ==========
function getUserByEmail(email) {
  return appState.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  return appState.users.find((user) => user.id === id);
}

// ========== PERMISSIONS ==========
function getPermission(role) {
  return {
    canCreateJudicial: role === 'Chancelier' || role === 'Magistrat',
    canEditJudicial: role === 'Chancelier' || role === 'Magistrat' || role === 'Scribe',
    canArchiveJudicial: role === 'Chancelier' || role === 'Magistrat' || role === 'Scribe',
    canCreateCertification: role === 'Chancelier' || role === 'Magistrat',
    canEditCertification: role === 'Chancelier' || role === 'Scribe' || role === 'Magistrat',
    canModifyReceipt: role === 'Chancelier',
    canRecordReceipt: role !== 'Trésorier',
    canManageUsers: role === 'Chancelier',
    canChangeSettings: role === 'Chancelier',
    canView: true,
  };
}

function formatAccessRights(role) {
  const perms = getPermission(role);
  const granted = [];
  if (perms.canCreateJudicial) granted.push('Créer dossiers judiciaires');
  if (perms.canEditJudicial) granted.push('Modifier dossiers judiciaires');
  if (perms.canArchiveJudicial) granted.push('Archiver dossiers');
  if (perms.canCreateCertification) granted.push('Créer certifications');
  if (perms.canEditCertification) granted.push('Modifier certifications');
  if (perms.canRecordReceipt) granted.push('Enregistrer des recettes');
  if (perms.canManageUsers) granted.push('Gérer utilisateurs');
  if (perms.canChangeSettings) granted.push('Modifier paramètres');
  return granted.length ? granted.join(', ') : 'Aucun';
}

// ========== AUTHENTIFICATION ==========
async function login(email, password) {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return 'Adresse électronique ou mot de passe invalide.';
  }

  appState.currentUser = { ...user };
  appState.isAuthenticated = true;
  saveLocalSession();
  updateCurrentUserActivity();
  return null;
}

async function logout() {
  clearLocalSession();
  appState.activeSection = 'dashboard';
  showPublicScreen();
}

function ensureAuthVisibility() {
  if (!appState.currentUser) return;
  elements.currentUserName.textContent = appState.currentUser.name;
  elements.currentUserRole.textContent = appState.currentUser.role;
  const permission = getPermission(appState.currentUser.role);
  elements.newJudicialButton.style.display = permission.canCreateJudicial ? 'inline-flex' : 'none';
  elements.newCertificationButton.style.display = permission.canCreateCertification ? 'inline-flex' : 'none';
  elements.addReceiptButton.style.display = permission.canRecordReceipt ? 'inline-flex' : 'none';
  const journalLink = document.querySelector('[data-section="journal"]');
  const usersLink = document.querySelector('[data-section="users"]');
  if (journalLink) journalLink.style.display = permission.canManageUsers ? 'inline-flex' : 'none';
  if (usersLink) usersLink.style.display = permission.canManageUsers ? 'inline-flex' : 'none';
}

function updateCurrentUserActivity() {
  if (!appState.currentUser) return;
  appState.currentUser.lastActivity = new Date().toISOString();
  const user = appState.users.find((u) => u.id === appState.currentUser.id);
  if (user) user.lastActivity = appState.currentUser.lastActivity;
  saveState();
}

// ========== NAVIGATION ET ÉCRANS ==========
function showPublicScreen() {
  elements.loginSection.style.display = 'block';
  elements.appSection.style.display = 'none';
}

function showAppScreen() {
  elements.loginSection.style.display = 'none';
  elements.appSection.style.display = 'block';
}

function navigateTo(section) {
  appState.activeSection = section;
  elements.sections.forEach((el) => {
    el.style.display = el.dataset.section === section ? 'block' : 'none';
  });
  document.querySelectorAll('[data-section]').forEach((link) => {
    link.classList.toggle('active', link.dataset.section === section);
  });
}

// ========== JOURNAL ==========
function logAction(user, action, type, reference, details) {
  appState.journal.push({
    id: crypto.randomUUID(),
    user,
    action,
    type,
    reference,
    details,
    timestamp: new Date().toISOString(),
  });
  saveState();
}

// ========== DOSSIERS JUDICIAIRES ==========
function createJudicialRecord(data) {
  const record = {
    id: crypto.randomUUID(),
    reference: `CH-${appState.settings.referenceYear}-T-${String(appState.counters.judicial + 1).padStart(4, '0')}`,
    defendantName: data.defendantName,
    defendantType: data.defendantType,
    offense: data.offense,
    verdict: data.verdict,
    sentenceType: data.sentenceType,
    sentenceValue: data.sentenceValue,
    sentenceUnit: data.sentenceUnit,
    sentenceStatus: 'Non commencée',
    fineAmount: data.fineAmount ? Number(data.fineAmount) : 0,
    fineStatus: data.fineAmount ? 'Non réglée' : 'N/A',
    createdAt: new Date().toISOString(),
    createdBy: appState.currentUser.name,
    archived: false,
  };
  appState.judicialRecords.push(record);
  appState.counters.judicial++;
  saveState();
  logAction(appState.currentUser.name, 'Création d'un dossier', 'Judiciaire', record.reference, `Dossier créé pour ${data.defendantName}`);
  return record;
}

function updateRecord(type, id, updates) {
  const collection = type === 'Judiciaire' ? appState.judicialRecords : appState.certifications;
  const record = collection.find((item) => item.id === id);
  if (record) {
    Object.assign(record, updates);
    saveState();
    logAction(appState.currentUser.name, "Modification d'un dossier", type, record.reference, `Dossier modifié (${record.reference})`);
  }
}

function archiveRecord(type, id) {
  const collection = type === 'Judiciaire' ? appState.judicialRecords : appState.certifications;
  const record = collection.find((item) => item.id === id);
  if (record) {
    record.archived = true;
    saveState();
    logAction(appState.currentUser.name, 'Archivage d'un dossier', type, record.reference, `Dossier archivé`);
  }
}

function restoreRecord(type, id) {
  const collection = type === 'Judiciaire' ? appState.judicialRecords : appState.certifications;
  const record = collection.find((item) => item.id === id);
  if (record) {
    record.archived = false;
    saveState();
    logAction(appState.currentUser.name, 'Restauration d'un dossier', type, record.reference, `Dossier restauré`);
  }
}

function deleteJudicialRecord(id) {
  const index = appState.judicialRecords.findIndex((item) => item.id === id);
  if (index !== -1) {
    const removed = appState.judicialRecords.splice(index, 1)[0];
    appState.counters.judicial = appState.judicialRecords.length;
    saveState();
    logAction(appState.currentUser.name, 'Suppression d'un dossier', 'Judiciaire', removed.reference, 'Dossier supprimé');
  }
}

// ========== CERTIFICATIONS ==========
function createCertification(data) {
  const record = {
    id: crypto.randomUUID(),
    reference: `CH-${appState.settings.referenceYear}-C-${String(appState.counters.certification + 1).padStart(4, '0')}`,
    certificationType: data.certificationType,
    requestor: data.requestor,
    purpose: data.purpose,
    feeAmount: data.feeAmount ? Number(data.feeAmount) : 0,
    paymentStatus: data.feeAmount ? 'Non réglée' : 'N/A',
    createdAt: new Date().toISOString(),
    createdBy: appState.currentUser.name,
    archived: false,
  };
  appState.certifications.push(record);
  appState.counters.certification++;
  saveState();
  logAction(appState.currentUser.name, 'Création d'une certification', 'Certification', record.reference, `Certification créée pour ${data.requestor}`);
  return record;
}

function deleteCertificationRecord(id) {
  const index = appState.certifications.findIndex((item) => item.id === id);
  if (index !== -1) {
    const removed = appState.certifications.splice(index, 1)[0];
    appState.counters.certification = appState.certifications.length;
    saveState();
    logAction(appState.currentUser.name, 'Suppression d'une certification', 'Certification', removed.reference, 'Certification supprimée');
  }
}

// ========== RECETTES ==========
function getRecordReceipts(record) {
  return appState.receipts.filter((r) => r.linkedRecordId === record.id);
}

function getRecordRemainingAmount(record) {
  const amount = record.fineAmount || record.feeAmount || 0;
  const paid = getRecordReceipts(record).reduce((sum, r) => sum + r.amount, 0);
  return Math.max(0, amount - paid);
}

function createReceipt(data) {
  const receipt = {
    id: crypto.randomUUID(),
    reference: `REC-${appState.settings.referenceYear}-${String(appState.counters.judicial + appState.counters.certification + 1).padStart(4, '0')}`,
    linkedRecordId: data.linkedRecordId,
    linkedRecordType: data.linkedRecordType,
    amount: Number(data.amount),
    method: data.method,
    treasuryPercent: 60,
    chancelleriePercent: 40,
    treasuryAmount: Math.round(Number(data.amount) * 0.6),
    chancelleryAmount: Math.round(Number(data.amount) * 0.4),
    treasuryTransferred: false,
    chancelleryTransferred: false,
    createdAt: new Date().toISOString(),
    createdBy: appState.currentUser.name,
  };
  appState.receipts.push(receipt);
  updatePaymentStatuses(false);
  saveState();
  logAction(appState.currentUser.name, 'Enregistrement d'une recette', data.linkedRecordType, '', `Recette enregistrée : ${formatMoney(receipt.amount)}`);
  return receipt;
}

function updateReceipt(id, updates) {
  const receipt = appState.receipts.find((r) => r.id === id);
  if (receipt) {
    Object.assign(receipt, updates);
    updatePaymentStatuses(false);
    saveState();
    logAction(appState.currentUser.name, 'Modification d'une recette', '', receipt.reference, 'Recette modifiée');
  }
}

function deleteReceipt(id) {
  const index = appState.receipts.findIndex((r) => r.id === id);
  if (index !== -1) {
    const removed = appState.receipts.splice(index, 1)[0];
    updatePaymentStatuses(false);
    saveState();
    logAction(appState.currentUser.name, 'Suppression d'une recette', '', removed.reference, 'Recette supprimée');
  }
}

function updatePaymentStatuses(saveChanges = true) {
  let hasChanged = false;

  appState.judicialRecords.forEach((record) => {
    if (!record.fineAmount || record.fineAmount === 0) {
      record.fineStatus = 'N/A';
      return;
    }
    const remaining = getRecordRemainingAmount(record);
    const newStatus = remaining === 0 ? 'Réglée' : getRecordReceipts(record).length > 0 ? 'Partiellement réglée' : 'Non réglée';
    if (record.fineStatus !== newStatus) {
      record.fineStatus = newStatus;
      hasChanged = true;
    }
  });

  appState.certifications.forEach((record) => {
    if (record.paymentStatus === 'Annulée') return;
    const remaining = getRecordRemainingAmount(record);
    const newStatus = remaining === 0 ? 'Réglée' : getRecordReceipts(record).length > 0 ? 'Partiellement réglée' : 'Non réglée';
    if (record.paymentStatus !== newStatus) {
      record.paymentStatus = newStatus;
      hasChanged = true;
    }
  });

  if (saveChanges && hasChanged) {
    saveState();
  }
}

// ========== UTILISATEURS ==========
function createUser(data) {
  const user = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    status: data.status || 'Habilité',
    createdAt: new Date().toISOString(),
    lastActivity: null,
  };
  appState.users.push(user);
  saveState();
  logAction(appState.currentUser.name, 'Création d'un utilisateur', 'Utilisateur', user.email, `Utilisateur ${user.name} créé`);
  return user;
}

function updateUser(id, updates) {
  const user = appState.users.find((u) => u.id === id);
  if (user) {
    Object.assign(user, updates);
    if (appState.currentUser && appState.currentUser.id === id) {
      Object.assign(appState.currentUser, updates);
      saveLocalSession();
    }
    saveState();
    logAction(appState.currentUser.name, 'Modification d'un utilisateur', 'Utilisateur', user.email, `Utilisateur ${user.name} modifié`);
  }
}

function deleteUser(id) {
  const index = appState.users.findIndex((u) => u.id === id);
  if (index !== -1) {
    const removed = appState.users.splice(index, 1)[0];
    saveState();
    logAction(appState.currentUser.name, 'Suppression d'un utilisateur', 'Utilisateur', removed.email, `Utilisateur ${removed.name} supprimé`);
  }
}

// ========== RENDUS ==========
function renderJudicialList() {
  const filtered = appState.judicialRecords.filter((record) => {
    if (!elements.judicialShowArchived.checked && record.archived) return false;
    if (elements.judicialStatusFilter.value && record.sentenceStatus !== elements.judicialStatusFilter.value) return false;
    if (elements.judicialFineStatusFilter.value && record.fineStatus !== elements.judicialFineStatusFilter.value) return false;
    if (elements.judicialSearch.value) {
      const searchLower = elements.judicialSearch.value.toLowerCase();
      return record.reference.toLowerCase().includes(searchLower) || record.defendantName.toLowerCase().includes(searchLower);
    }
    return true;
  });

  elements.judicialTable.innerHTML = filtered
    .map((record) => {
      return `
        <tr class="${record.archived ? 'archived' : ''}">
          <td>${record.reference}</td>
          <td>${record.defendantName}</td>
          <td>${record.offense}</td>
          <td class="${getSentenceStatusColor(record.sentenceStatus)}">${record.sentenceStatus}</td>
          <td class="${getSentenceStatusColor(record.sentenceStatus)}">${record.sentenceValue} ${record.sentenceUnit}</td>
          <td>${formatMoney(record.fineAmount)}</td>
          <td class="${getFineStatusColor(record.fineStatus)}">${record.fineStatus}</td>
          <td>${formatDate(record.createdAt)}</td>
          <td>${record.createdBy}</td>
          <td>
            ${!record.archived ? `<button class="edit-judicial-btn" data-id="${record.id}">✏️</button>` : ''}
            ${!record.archived ? `<button class="archive-judicial-btn" data-id="${record.id}">📦</button>` : ''}
            ${record.archived ? `<button class="restore-judicial-btn" data-id="${record.id}">↩️</button>` : ''}
            ${record.archived ? `<button class="delete-judicial-btn" data-id="${record.id}">🗑️</button>` : ''}
          </td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="10">Aucun dossier à afficher.</td></tr>';
}

function renderCertificationList() {
  const filtered = appState.certifications.filter((record) => {
    if (!elements.certificationShowArchived.checked && record.archived) return false;
    if (elements.certificationStatusFilter.value && record.certificationType !== elements.certificationStatusFilter.value) return false;
    if (elements.certificationPaymentFilter.value && record.paymentStatus !== elements.certificationPaymentFilter.value) return false;
    if (elements.certificationSearch.value) {
      const searchLower = elements.certificationSearch.value.toLowerCase();
      return record.reference.toLowerCase().includes(searchLower) || record.requestor.toLowerCase().includes(searchLower);
    }
    return true;
  });

  elements.certificationTable.innerHTML = filtered
    .map((record) => {
      return `
        <tr class="${record.archived ? 'archived' : ''}">
          <td>${record.reference}</td>
          <td>${record.certificationType}</td>
          <td>${record.requestor}</td>
          <td>${record.purpose}</td>
          <td>${formatMoney(record.feeAmount)}</td>
          <td class="${getPaymentStatusColor(record.paymentStatus)}">${record.paymentStatus}</td>
          <td>${formatDate(record.createdAt)}</td>
          <td>${record.createdBy}</td>
          <td>
            ${!record.archived ? `<button class="edit-certification-btn" data-id="${record.id}">✏️</button>` : ''}
            ${!record.archived ? `<button class="archive-certification-btn" data-id="${record.id}">📦</button>` : ''}
            ${record.archived ? `<button class="restore-certification-btn" data-id="${record.id}">↩️</button>` : ''}
            ${record.archived ? `<button class="delete-certification-btn" data-id="${record.id}">🗑️</button>` : ''}
          </td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="8">Aucune certification à afficher.</td></tr>';
}

function renderReceiptTable() {
  const allRecords = [...appState.judicialRecords, ...appState.certifications].filter((r) => !r.archived);
  elements.receiptSelect.innerHTML = allRecords
    .map((r) => `<option value="${r.id}">${r.reference} - ${r.defendantName || r.requestor}</option>`)
    .join('');

  const receipts = appState.receipts;
  elements.receiptTable.innerHTML = receipts
    .map((receipt) => {
      const record = [...appState.judicialRecords, ...appState.certifications].find((r) => r.id === receipt.linkedRecordId);
      return `
        <tr>
          <td>${receipt.reference}</td>
          <td>${record ? record.reference : 'N/A'}</td>
          <td>${receipt.method}</td>
          <td>${formatMoney(receipt.amount)}</td>
          <td>${receipt.treasuryPercent}%</td>
          <td>${receipt.chancelleriePercent}%</td>
          <td>${formatMoney(receipt.treasuryAmount)}</td>
          <td>${receipt.chancelleryAmount}</td>
          <td>${receipt.treasuryTransferred ? '✓' : '✗'}</td>
          <td>${receipt.chancelleryTransferred ? '✓' : '✗'}</td>
          <td>${formatDate(receipt.createdAt)}</td>
          <td>${receipt.createdBy}</td>
          <td>
            <button class="edit-receipt-btn" data-id="${receipt.id}">✏️</button>
            <button class="delete-receipt-btn" data-id="${receipt.id}">🗑️</button>
          </td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="13">Aucune recette à afficher.</td></tr>';
}

function renderUsersList() {
  elements.usersList.innerHTML = appState.users
    .map((user) => {
      return `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.status}</td>
          <td>${formatAccessRights(user.role)}</td>
          <td>${user.lastActivity ? formatDate(user.lastActivity) : 'Jamais'}</td>
          <td>
            ${user.id !== appState.currentUser.id ? `<button class="edit-user-btn" data-id="${user.id}">✏️</button>` : ''}
            ${user.id !== appState.currentUser.id ? `<button class="delete-user-btn" data-id="${user.id}">🗑️</button>` : ''}
          </td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="7">Aucun utilisateur à afficher.</td></tr>';
}

function renderJournal() {
  elements.journalTable.innerHTML = appState.journal
    .slice()
    .reverse()
    .map((entry) => {
      return `
        <tr>
          <td>${entry.user}</td>
          <td>${entry.action}</td>
          <td>${entry.type}</td>
          <td>${entry.reference}</td>
          <td>${entry.details}</td>
          <td>${formatDate(entry.timestamp)}</td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="6">Aucune activité à afficher.</td></tr>';
}

function renderDashboard() {
  const totalJudicial = appState.judicialRecords.filter((r) => !r.archived).length;
  const totalCertification = appState.certifications.filter((r) => !r.archived).length;
  const totalFines = appState.judicialRecords.reduce((sum, r) => sum + (r.fineAmount || 0), 0);
  const totalDue = appState.judicialRecords
    .filter((r) => r.fineStatus === 'Non réglée' || r.fineStatus === 'Partiellement réglée')
    .reduce((sum, r) => sum + getRecordRemainingAmount(r), 0);
  const certFees = appState.certifications.reduce((sum, r) => sum + (r.feeAmount || 0), 0);
  const certDue = appState.certifications
    .filter((r) => r.paymentStatus === 'Non réglée' || r.paymentStatus === 'Partiellement réglée')
    .reduce((sum, r) => sum + getRecordRemainingAmount(r), 0);
  const totalTreasury = appState.receipts.reduce((sum, r) => sum + r.treasuryAmount, 0);
  const totalChancellery = appState.receipts.reduce((sum, r) => sum + r.chancelleryAmount, 0);
  const pendingTotal = totalDue + certDue;
  const pendingTreasury = Math.round(pendingTotal * 0.6);
  const pendingChancellery = Math.round(pendingTotal * 0.4);
  const archivedJudicial = appState.judicialRecords.filter((r) => r.archived).length;
  const archivedCertifications = appState.certifications.filter((r) => r.archived).length;

  elements.cardTotalJudicial.textContent = totalJudicial;
  elements.cardTotalCertification.textContent = totalCertification;
  elements.cardTotalFines.textContent = formatMoney(totalFines);
  elements.cardTotalDue.textContent = formatMoney(totalDue);
  elements.cardTotalTreasury.textContent = formatMoney(totalTreasury);
  elements.cardTotalChancellery.textContent = formatMoney(totalChancellery);
  elements.cardTotalCertifications.textContent = formatMoney(certFees);
  elements.cardPendingTotal.textContent = formatMoney(pendingTotal);
  elements.cardPendingTreasury.textContent = formatMoney(pendingTreasury);
  elements.cardPendingChancellery.textContent = formatMoney(pendingChancellery);
  elements.cardArchivedJudicial.textContent = archivedJudicial;
  elements.cardArchivedCertifications.textContent = archivedCertifications;

  const latestRecords = [...appState.judicialRecords, ...appState.certifications]
    .filter((r) => !r.archived)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  elements.dashboardLatestList.innerHTML = latestRecords
    .map((record) => {
      return `
        <div class="latest-item">
          <strong>${record.reference}</strong> - ${record.defendantName || record.requestor} <br/>
          <small>${formatDate(record.createdAt)} par ${record.createdBy}</small>
        </div>
      `;
    })
    .join('');

  const sentenceNotStarted = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === 'Non commencée').length;
  const sentenceInProgress = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === "En cours d'exécution").length;
  const sentenceCompleted = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === 'Exécutée').length;
  const fineNotPaid = appState.judicialRecords.filter((r) => !r.archived && r.fineStatus === 'Non réglée').length;
  const finePartiallyPaid = appState.judicialRecords.filter((r) => !r.archived && r.fineStatus === 'Partiellement réglée').length;
  const finePaid = appState.judicialRecords.filter((r) => !r.archived && r.fineStatus === 'Réglée').length;

  elements.statusNotStarted.textContent = sentenceNotStarted;
  elements.statusInProgress.textContent = sentenceInProgress;
  elements.statusCompleted.textContent = sentenceCompleted;
  elements.statusSuspended.textContent = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === 'Suspendue').length;
  elements.statusCancelled.textContent = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === 'Annulée').length;
  elements.statusRemaining.textContent = formatMoney(totalDue);
}

// ========== MODALES ET FORMULAIRES ==========
function showDeletionConfirmation(message, confirmText = 'Confirmer', cancelText = 'Annuler') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-card">
        <h3>Confirmation</h3>
        <p class="confirm-message">${message}</p>
        <div class="form-actions confirm-actions">
          <button type="button" class="secondary-btn" id="confirm-cancel-button">${cancelText}</button>
          <button type="button" class="primary-btn danger-btn" id="confirm-ok-button">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#confirm-cancel-button').addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });

    modal.querySelector('#confirm-ok-button').addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });
  });
}

function openJudicialModal(id = null) {
  const form = elements.judicialForm;
  if (id) {
    const record = appState.judicialRecords.find((r) => r.id === id);
    if (record) {
      form.defendantName.value = record.defendantName;
      form.defendantType.value = record.defendantType;
      form.offense.value = record.offense;
      form.verdict.value = record.verdict;
      form.sentenceType.value = record.sentenceType;
      form.sentenceValue.value = record.sentenceValue;
      form.sentenceUnit.value = record.sentenceUnit;
      form.sentenceStatus.value = record.sentenceStatus;
      form.fineAmount.value = record.fineAmount;
      form.fineStatus.value = record.fineStatus;
    }
    form.recordId = id;
  } else {
    form.reset();
    form.recordId = null;
  }
  elements.judicialModal.style.display = 'flex';
}

function closeJudicialModal() {
  elements.judicialModal.style.display = 'none';
}

function openCertificationModal(id = null) {
  const form = elements.certificationForm;
  if (id) {
    const record = appState.certifications.find((r) => r.id === id);
    if (record) {
      form.certificationType.value = record.certificationType;
      form.requestor.value = record.requestor;
      form.purpose.value = record.purpose;
      form.feeAmount.value = record.feeAmount;
    }
    form.recordId = id;
  } else {
    form.reset();
    form.recordId = null;
  }
  elements.certificationModal.style.display = 'flex';
}

function closeCertificationModal() {
  elements.certificationModal.style.display = 'none';
}

function openReceiptModal(id = null) {
  const form = elements.receiptForm;
  if (id) {
    const receipt = appState.receipts.find((r) => r.id === id);
    if (receipt) {
      form.amount.value = receipt.amount;
      form.method.value = receipt.method;
      form.linkedRecordId.value = receipt.linkedRecordId;
      form.treasuryTransferred.checked = receipt.treasuryTransferred;
      form.chancelleryTransferred.checked = receipt.chancelleryTransferred;
    }
    form.receiptId = id;
  } else {
    form.reset();
    form.receiptId = null;
  }
  elements.receiptModal.style.display = 'flex';
}

function closeReceiptModal() {
  elements.receiptModal.style.display = 'none';
}

function openUserModal(id = null) {
  const form = elements.userForm;
  if (id) {
    const user = appState.users.find((u) => u.id === id);
    if (user) {
      form.name.value = user.name;
      form.email.value = user.email;
      form.password.value = user.password;
      form.role.value = user.role;
      form.status.value = user.status;
    }
    form.userId = id;
  } else {
    form.reset();
    form.userId = null;
  }
  elements.userModal.style.display = 'flex';
}

function closeUserModal() {
  elements.userModal.style.display = 'none';
}

function openSettingsModal() {
  const form = elements.settingsForm;
  form.institution.value = appState.settings.institution;
  form.referenceYear.value = appState.settings.referenceYear;
  form.judicialTreasuryPercentage.value = appState.settings.judicialTreasuryPercentage;
  form.certificationTreasuryPercentage.value = appState.settings.certificationTreasuryPercentage;
  form.currency.value = appState.settings.currency;
  elements.settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
  elements.settingsModal.style.display = 'none';
}

// ========== INITIALISATIONS ==========
function initAuth() {
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    const error = await login(email, password);
    if (error) {
      elements.loginError.textContent = error;
    } else {
      elements.loginError.textContent = '';
      elements.emailInput.value = '';
      elements.passwordInput.value = '';
      showAppScreen();
      ensureAuthVisibility();
      renderDashboard();
      renderJudicialList();
      renderCertificationList();
      renderReceiptOptions();
      renderReceiptTable();
      renderUsersList();
      renderJournal();
      navigateTo('dashboard');
    }
  });

  elements.logoutButton.addEventListener('click', () => {
    logout();
  });
}

function initNav() {
  document.querySelectorAll('[data-section]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      navigateTo(section);
    });
  });
}

function initForms() {
  // Judicial Form
  elements.newJudicialButton.addEventListener('click', () => openJudicialModal());
  elements.judicialForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (elements.judicialForm.recordId) {
      updateRecord('Judiciaire', elements.judicialForm.recordId, {
        defendantName: elements.judicialForm.defendantName.value,
        defendantType: elements.judicialForm.defendantType.value,
        offense: elements.judicialForm.offense.value,
        verdict: elements.judicialForm.verdict.value,
        sentenceType: elements.judicialForm.sentenceType.value,
        sentenceValue: elements.judicialForm.sentenceValue.value,
        sentenceUnit: elements.judicialForm.sentenceUnit.value,
        sentenceStatus: elements.judicialForm.sentenceStatus.value,
        fineAmount: Number(elements.judicialForm.fineAmount.value) || 0,
        fineStatus: elements.judicialForm.fineStatus.value,
      });
    } else {
      createJudicialRecord({
        defendantName: elements.judicialForm.defendantName.value,
        defendantType: elements.judicialForm.defendantType.value,
        offense: elements.judicialForm.offense.value,
        verdict: elements.judicialForm.verdict.value,
        sentenceType: elements.judicialForm.sentenceType.value,
        sentenceValue: elements.judicialForm.sentenceValue.value,
        sentenceUnit: elements.judicialForm.sentenceUnit.value,
        fineAmount: Number(elements.judicialForm.fineAmount.value) || 0,
      });
    }
    closeJudicialModal();
    renderJudicialList();
    renderDashboard();
  });

  // Certification Form
  elements.newCertificationButton.addEventListener('click', () => openCertificationModal());
  elements.certificationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (elements.certificationForm.recordId) {
      updateRecord('Certification', elements.certificationForm.recordId, {
        certificationType: elements.certificationForm.certificationType.value,
        requestor: elements.certificationForm.requestor.value,
        purpose: elements.certificationForm.purpose.value,
        feeAmount: Number(elements.certificationForm.feeAmount.value) || 0,
      });
    } else {
      createCertification({
        certificationType: elements.certificationForm.certificationType.value,
        requestor: elements.certificationForm.requestor.value,
        purpose: elements.certificationForm.purpose.value,
        feeAmount: Number(elements.certificationForm.feeAmount.value) || 0,
      });
    }
    closeCertificationModal();
    renderCertificationList();
    renderDashboard();
  });

  // Receipt Form
  elements.addReceiptButton.addEventListener('click', () => openReceiptModal());
  elements.receiptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (elements.receiptForm.receiptId) {
      updateReceipt(elements.receiptForm.receiptId, {
        amount: Number(elements.receiptForm.amount.value),
        method: elements.receiptForm.method.value,
        linkedRecordId: elements.receiptForm.linkedRecordId.value,
        treasuryTransferred: elements.receiptForm.treasuryTransferred.checked,
        chancelleryTransferred: elements.receiptForm.chancelleryTransferred.checked,
      });
    } else {
      createReceipt({
        linkedRecordId: elements.receiptForm.linkedRecordId.value,
        linkedRecordType: (() => {
          const record = [...appState.judicialRecords, ...appState.certifications].find((r) => r.id === elements.receiptForm.linkedRecordId.value);
          return record && record.defendantName ? 'Judiciaire' : 'Certification';
        })(),
        amount: elements.receiptForm.amount.value,
        method: elements.receiptForm.method.value,
      });
    }
    closeReceiptModal();
    renderReceiptTable();
    renderDashboard();
  });

  // User Form
  if (elements.userForm) {
    elements.userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (elements.userForm.userId) {
        updateUser(elements.userForm.userId, {
          name: elements.userForm.name.value,
          email: elements.userForm.email.value,
          password: elements.userForm.password.value,
          role: elements.userForm.role.value,
          status: elements.userForm.status.value,
        });
      } else {
        createUser({
          name: elements.userForm.name.value,
          email: elements.userForm.email.value,
          password: elements.userForm.password.value,
          role: elements.userForm.role.value,
          status: elements.userForm.status.value,
        });
      }
      closeUserModal();
      renderUsersList();
    });
  }

  // Settings Form
  if (elements.settingsForm) {
    elements.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      appState.settings.institution = elements.settingsForm.institution.value;
      appState.settings.referenceYear = elements.settingsForm.referenceYear.value;
      appState.settings.judicialTreasuryPercentage = Number(elements.settingsForm.judicialTreasuryPercentage.value);
      appState.settings.certificationTreasuryPercentage = Number(elements.settingsForm.certificationTreasuryPercentage.value);
      appState.settings.currency = elements.settingsForm.currency.value;
      saveState();
      closeSettingsModal();
      alert('Paramètres sauvegardés avec succès');
    });
  }
}

function initFilters() {
  elements.judicialSearch.addEventListener('input', renderJudicialList);
  elements.judicialStatusFilter.addEventListener('change', renderJudicialList);
  elements.judicialFineStatusFilter.addEventListener('change', renderJudicialList);
  elements.judicialShowArchived.addEventListener('change', renderJudicialList);

  elements.certificationSearch.addEventListener('input', renderCertificationList);
  elements.certificationStatusFilter.addEventListener('change', renderCertificationList);
  elements.certificationPaymentFilter.addEventListener('change', renderCertificationList);
  elements.certificationShowArchived.addEventListener('change', renderCertificationList);

  elements.refreshDashboardButton?.addEventListener('click', () => {
    renderDashboard();
  });
  elements.refreshJudicialButton?.addEventListener('click', renderJudicialList);
  elements.refreshCertificationButton?.addEventListener('click', renderCertificationList);
  elements.refreshReceiptButton?.addEventListener('click', renderReceiptTable);
  elements.refreshUsersButton?.addEventListener('click', renderUsersList);
  elements.refreshJournalButton?.addEventListener('click', renderJournal);
}

function initTableActions() {
  document.addEventListener('click', async (e) => {
    // Judicial
    if (e.target.classList.contains('edit-judicial-btn')) {
      openJudicialModal(e.target.dataset.id);
    }
    if (e.target.classList.contains('archive-judicial-btn')) {
      archiveRecord('Judiciaire', e.target.dataset.id);
      renderJudicialList();
      renderDashboard();
    }
    if (e.target.classList.contains('restore-judicial-btn')) {
      restoreRecord('Judiciaire', e.target.dataset.id);
      renderJudicialList();
      renderDashboard();
    }
    if (e.target.classList.contains('delete-judicial-btn')) {
      const confirmed = await showDeletionConfirmation('Êtes-vous sûr de vouloir supprimer ce dossier judiciaire ? Cette action est irréversible.', 'Supprimer', 'Annuler');
      if (confirmed) {
        deleteJudicialRecord(e.target.dataset.id);
        renderJudicialList();
        renderDashboard();
      }
    }

    // Certification
    if (e.target.classList.contains('edit-certification-btn')) {
      openCertificationModal(e.target.dataset.id);
    }
    if (e.target.classList.contains('archive-certification-btn')) {
      archiveRecord('Certification', e.target.dataset.id);
      renderCertificationList();
      renderDashboard();
    }
    if (e.target.classList.contains('restore-certification-btn')) {
      restoreRecord('Certification', e.target.dataset.id);
      renderCertificationList();
      renderDashboard();
    }
    if (e.target.classList.contains('delete-certification-btn')) {
      const confirmed = await showDeletionConfirmation('Êtes-vous sûr de vouloir supprimer cette certification ? Cette action est irréversible.', 'Supprimer', 'Annuler');
      if (confirmed) {
        deleteCertificationRecord(e.target.dataset.id);
        renderCertificationList();
        renderDashboard();
      }
    }

    // Receipt
    if (e.target.classList.contains('edit-receipt-btn')) {
      openReceiptModal(e.target.dataset.id);
    }
    if (e.target.classList.contains('delete-receipt-btn')) {
      const confirmed = await showDeletionConfirmation('Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.', 'Supprimer', 'Annuler');
      if (confirmed) {
        deleteReceipt(e.target.dataset.id);
        renderReceiptTable();
        renderDashboard();
      }
    }

    // User
    if (e.target.classList.contains('edit-user-btn')) {
      const permission = getPermission(appState.currentUser.role);
      if (!permission.canManageUsers) {
        alert('Vous n'avez pas la permission de modifier des utilisateurs.');
        return;
      }
      openUserModal(e.target.dataset.id);
    }
    if (e.target.classList.contains('delete-user-btn')) {
      const permission = getPermission(appState.currentUser.role);
      if (!permission.canManageUsers) {
        alert('Vous n'avez pas la permission de supprimer un utilisateur.');
        return;
      }
      const confirmed = await showDeletionConfirmation('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.', 'Supprimer', 'Annuler');
      if (!confirmed) return;
      if (e.target.dataset.id === appState.currentUser.id) {
        alert('Vous ne pouvez pas supprimer votre propre compte.');
        return;
      }
      deleteUser(e.target.dataset.id);
      renderUsersList();
    }
  });
}

function renderReceiptOptions() {
  const allRecords = [...appState.judicialRecords, ...appState.certifications].filter((r) => !r.archived);
  elements.receiptSelect.innerHTML = allRecords
    .map((r) => `<option value="${r.id}">${r.reference} - ${r.defendantName || r.requestor}</option>`)
    .join('');
}

// ========== RESET DATA (pour tester) ==========
function resetDataFilters() {
  elements.judicialSearch.value = '';
  elements.judicialStatusFilter.value = '';
  elements.judicialFineStatusFilter.value = '';
  elements.judicialShowArchived.checked = false;
  elements.certificationSearch.value = '';
  elements.certificationStatusFilter.value = '';
  elements.certificationPaymentFilter.value = '';
  elements.certificationShowArchived.checked = false;
}

// ========== MODAL CLOSE BUTTONS ==========
document.addEventListener('DOMContentLoaded', () => {
  const closeButtons = document.querySelectorAll('[data-close-modal]');
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal.id === 'judicial-modal') closeJudicialModal();
      if (modal.id === 'certification-modal') closeCertificationModal();
      if (modal.id === 'receipt-modal') closeReceiptModal();
      if (modal.id === 'user-modal') closeUserModal();
      if (modal.id === 'settings-modal') closeSettingsModal();
    });
  });
});

// ========== DEMARRAGE APP ==========
async function mountApp() {
  await loadState();
  initAuth();
  initNav();
  initTableActions();
  initFilters();
  initForms();
  if (appState.isAuthenticated && appState.currentUser) {
    const activeUser = appState.users.find((user) => user.id === appState.currentUser.id);
    appState.currentUser = activeUser || appState.currentUser;
    showAppScreen();
    resetDataFilters();
    ensureAuthVisibility();
    renderDashboard();
    renderJudicialList();
    renderCertificationList();
    renderReceiptOptions();
    renderReceiptTable();
    renderUsersList();
    renderJournalconst SUPABASE_URL = 'https://hqiyraklzdmgqmytjjjo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hCFQ6GdF0AqQH32_qbKrkg_UJTbq70i';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const storageKey = 'imperialChancellerieData';
const sessionKey = 'imperialChancellerieSession';

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

// ========== GESTION DE SESSION LOCALE ==========
function saveLocalSession() {
  try {
    localStorage.setItem(
      sessionKey,
      JSON.stringify({
        currentUserId: appState.currentUser ? appState.currentUser.id : null,
        isAuthenticated: appState.isAuthenticated,
      })
    );
  } catch (error) {
    console.error('Erreur sauvegarde session locale :', error);
  }
}

function loadLocalSession() {
  try {
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erreur lecture session locale :', error);
    return null;
  }
}

function clearLocalSession() {
  localStorage.removeItem(sessionKey);
  appState.currentUser = null;
  appState.isAuthenticated = false;
}

// ========== ÉLÉMENTS DOM ==========
const elements = {
  loginSection: document.getElementById('login-section'),
  appSection: document.getElementById('app-section'),
  loginForm: document.getElementById('login-form'),
  emailInput: document.getElementById('email'),
  passwordInput: document.getElementById('password'),
  loginButton: document.getElementById('login-button'),
  loginError: document.getElementById('login-error'),
  logoutButton: document.getElementById('logout-button'),
  currentUserName: document.getElementById('current-user-name'),
  currentUserRole: document.getElementById('current-user-role'),
  nav: document.getElementById('nav'),
  sections: document.querySelectorAll('[data-section]'),
  dashboardSection: document.getElementById('dashboard-section'),
  judicialSection: document.getElementById('judicial-section'),
  certificationSection: document.getElementById('certification-section'),
  receiptsSection: document.getElementById('receipts-section'),
  usersSection: document.getElementById('users-section'),
  journalSection: document.getElementById('journal-section'),
  settingsSection: document.getElementById('settings-section'),
  newJudicialButton: document.getElementById('new-judicial-button'),
  newCertificationButton: document.getElementById('new-certification-button'),
  addReceiptButton: document.getElementById('add-receipt-button'),
  refreshDashboardButton: document.getElementById('refresh-dashboard'),
  refreshJudicialButton: document.getElementById('refresh-judicial'),
  refreshCertificationButton: document.getElementById('refresh-certification'),
  refreshReceiptButton: document.getElementById('refresh-receipt'),
  refreshUsersButton: document.getElementById('refresh-users'),
  refreshJournalButton: document.getElementById('refresh-journal'),
  judicialForm: document.getElementById('judicial-form'),
  judicialModal: document.getElementById('judicial-modal'),
  certificationForm: document.getElementById('certification-form'),
  certificationModal: document.getElementById('certification-modal'),
  receiptForm: document.getElementById('receipt-form'),
  receiptModal: document.getElementById('receipt-modal'),
  userForm: document.getElementById('user-form'),
  userModal: document.getElementById('user-modal'),
  settingsForm: document.getElementById('settings-form'),
  settingsModal: document.getElementById('settings-modal'),
  cardTotalJudicial: document.getElementById('card-total-judicial'),
  cardTotalCertification: document.getElementById('card-total-certification'),
  cardTotalFines: document.getElementById('card-total-fines'),
  cardTotalDue: document.getElementById('card-total-due'),
  cardTotalTreasury: document.getElementById('card-total-treasury'),
  cardTotalChancellery: document.getElementById('card-total-chancellery'),
  cardTotalCertifications: document.getElementById('card-total-certifications'),
  cardPendingTotal: document.getElementById('card-pending-total'),
  cardPendingTreasury: document.getElementById('card-pending-treasury'),
  cardPendingChancellery: document.getElementById('card-pending-chancellery'),
  cardArchivedJudicial: document.getElementById('card-archived-judicial'),
  cardArchivedCertifications: document.getElementById('card-archived-certifications'),
  dashboardLatestList: document.getElementById('dashboard-latest-list'),
  statusNotStarted: document.getElementById('status-not-started'),
  statusInProgress: document.getElementById('status-in-progress'),
  statusCompleted: document.getElementById('status-completed'),
  statusSuspended: document.getElementById('status-suspended'),
  statusCancelled: document.getElementById('status-cancelled'),
  statusRemaining: document.getElementById('status-remaining'),
  judicialSearch: document.getElementById('judicial-search'),
  judicialStatusFilter: document.getElementById('judicial-status-filter'),
  judicialFineStatusFilter: document.getElementById('judicial-fine-status-filter'),
  judicialShowArchived: document.getElementById('judicial-show-archived'),
  judicialTable: document.getElementById('judicial-table'),
  certificationSearch: document.getElementById('certification-search'),
  certificationStatusFilter: document.getElementById('certification-status-filter'),
  certificationPaymentFilter: document.getElementById('certification-payment-filter'),
  certificationShowArchived: document.getElementById('certification-show-archived'),
  certificationTable: document.getElementById('certification-table'),
  receiptTable: document.getElementById('receipt-table'),
  receiptSelect: document.getElementById('receipt-select'),
  usersList: document.getElementById('users-list'),
  journalTable: document.getElementById('journal-table'),
};

// ========== RESET ET INIT STATE ==========
function resetState() {
  const year = new Date().getFullYear();
  appState.users = [
    {
      id: crypto.randomUUID(),
      name: 'Chancelier impérial',
      email: 'chancelier@empire.im',
      password: 'Imperial123',
      role: 'Chancelier',
      status: 'Habilité',
      createdAt: new Date().toISOString(),
      lastActivity: null,
    },
    {
      id: crypto.randomUUID(),
      name: 'Magistrat Solenne',
      email: 'magistrat@empire.im',
      password: 'Magistrat123',
      role: 'Magistrat',
      status: 'Habilité',
      createdAt: new Date().toISOString(),
      lastActivity: null,
    },
    {
      id: crypto.randomUUID(),
      name: 'Scribe Aurèle',
      email: 'scribe@empire.im',
      password: 'Scribe123',
      role: 'Scribe',
      status: 'Habilité',
      createdAt: new Date().toISOString(),
      lastActivity: null,
    },
    {
      id: crypto.randomUUID(),
      name: 'Trésorier Valyn',
      email: 'tresorier@empire.im',
      password: 'Tresorier123',
      role: 'Trésorier',
      status: 'Habilité',
      createdAt: new Date().toISOString(),
      lastActivity: null,
    },
  ];
  appState.settings = {
    judicialTreasuryPercentage: 60,
    certificationTreasuryPercentage: 60,
    referenceYear: String(year),
    institution: 'Registre de la Chancellerie impériale',
    currency: 'septimes',
  };
  appState.journal = [];
  appState.judicialRecords = [];
  appState.certifications = [];
  appState.receipts = [];
  appState.counters = { judicial: 0, certification: 0 };
  appState.activeSection = 'dashboard';
}

// ========== SAUVEGARDE/CHARGEMENT DONNÉES PARTAGÉES ==========
async function saveState() {
  // Crée une copie SANS currentUser et isAuthenticated
  const sharedState = {
    users: appState.users,
    judicialRecords: appState.judicialRecords,
    certifications: appState.certifications,
    receipts: appState.receipts,
    journal: appState.journal,
    settings: appState.settings,
    counters: appState.counters,
    activeSection: appState.activeSection,
  };

  const { data, error } = await supabaseClient
    .from('app_settings')
    .upsert(
      {
        id: 1,
        app_state: sharedState,
      },
      {
        onConflict: 'id',
      }
    )
    .select();

  if (error) {
    console.error('Erreur sauvegarde Supabase :', error);
    return false;
  }

  console.log('État partagé sauvegardé dans Supabase');
  return true;
}

async function loadState() {
  const { data, error } = await supabaseClient
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Erreur chargement Supabase :', error);
    resetState();
    return false;
  }

  if (data && data.app_state) {
    const shared = data.app_state;
    appState.users = shared.users || [];
    appState.judicialRecords = shared.judicialRecords || [];
    appState.certifications = shared.certifications || [];
    appState.receipts = shared.receipts || [];
    appState.journal = shared.journal || [];
    appState.settings = shared.settings || {};
    appState.counters = shared.counters || { judicial: 0, certification: 0 };
    appState.activeSection = shared.activeSection || 'dashboard';
  } else {
    resetState();
  }

  // Restaure la session LOCALE (propre à ce navigateur)
  const localSession = loadLocalSession();
  if (localSession && localSession.isAuthenticated && localSession.currentUserId) {
    const user = appState.users.find((u) => u.id === localSession.currentUserId);
    if (user) {
      appState.currentUser = user;
      appState.isAuthenticated = true;
    } else {
      clearLocalSession();
    }
  } else {
    appState.currentUser = null;
    appState.isAuthenticated = false;
  }

  return true;
}

// ========== FORMATAGE ==========
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', dateOptions);
}

function formatMoney(value) {
  const amount = Number(value);
  const unit = Math.abs(amount) === 1 ? 'Septim' : 'Septims';
  return `${amount.toLocaleString('fr-FR')} ${unit}`;
}

function getSentenceStatusColor(status) {
  switch (status) {
    case 'Non commencée':
      return 'status-red';
    case "En cours d'exécution":
      return 'status-orange';
    case 'Exécutée':
      return 'status-green';
    default:
      return '';
  }
}

function getFineStatusColor(status) {
  switch (status) {
    case 'Non réglée':
    case 'Non réglé':
      return 'status-red';
    case 'Partiellement réglée':
    case 'Partiellement réglé':
      return 'status-orange';
    case 'Réglée':
    case 'Réglé':
      return 'status-green';
    default:
      return '';
  }
}

const getPaymentStatusColor = getFineStatusColor;

// ========== RECHERCHE UTILISATEUR ==========
function getUserByEmail(email) {
  return appState.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  return appState.users.find((user) => user.id === id);
}

// ========== PERMISSIONS ==========
function getPermission(role) {
  return {
    canCreateJudicial: role === 'Chancelier' || role === 'Magistrat',
    canEditJudicial: role === 'Chancelier' || role === 'Magistrat' || role === 'Scribe',
    canArchiveJudicial: role === 'Chancelier' || role === 'Magistrat' || role === 'Scribe',
    canCreateCertification: role === 'Chancelier' || role === 'Magistrat',
    canEditCertification: role === 'Chancelier' || role === 'Scribe' || role === 'Magistrat',
    canModifyReceipt: role === 'Chancelier',
    canRecordReceipt: role !== 'Trésorier',
    canManageUsers: role === 'Chancelier',
    canChangeSettings: role === 'Chancelier',
    canView: true,
  };
}

function formatAccessRights(role) {
  const perms = getPermission(role);
  const granted = [];
  if (perms.canCreateJudicial) granted.push('Créer dossiers judiciaires');
  if (perms.canEditJudicial) granted.push('Modifier dossiers judiciaires');
  if (perms.canArchiveJudicial) granted.push('Archiver dossiers');
  if (perms.canCreateCertification) granted.push('Créer certifications');
  if (perms.canEditCertification) granted.push('Modifier certifications');
  if (perms.canRecordReceipt) granted.push('Enregistrer des recettes');
  if (perms.canManageUsers) granted.push('Gérer utilisateurs');
  if (perms.canChangeSettings) granted.push('Modifier paramètres');
  return granted.length ? granted.join(', ') : 'Aucun';
}

// ========== AUTHENTIFICATION ==========
async function login(email, password) {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return 'Adresse électronique ou mot de passe invalide.';
  }

  appState.currentUser = { ...user };
  appState.isAuthenticated = true;
  saveLocalSession();
  updateCurrentUserActivity();
  return null;
}

async function logout() {
  clearLocalSession();
  appState.activeSection = 'dashboard';
  showPublicScreen();
}

function ensureAuthVisibility() {
  if (!appState.currentUser) return;
  elements.currentUserName.textContent = appState.currentUser.name;
  elements.currentUserRole.textContent = appState.currentUser.role;
  const permission = getPermission(appState.currentUser.role);
  elements.newJudicialButton.style.display = permission.canCreateJudicial ? 'inline-flex' : 'none';
  elements.newCertificationButton.style.display = permission.canCreateCertification ? 'inline-flex' : 'none';
  elements.addReceiptButton.style.display = permission.canRecordReceipt ? 'inline-flex' : 'none';
  const journalLink = document.querySelector('[data-section="journal"]');
  const usersLink = document.querySelector('[data-section="users"]');
  if (journalLink) journalLink.style.display = permission.canManageUsers ? 'inline-flex' : 'none';
  if (usersLink) usersLink.style.display = permission.canManageUsers ? 'inline-flex' : 'none';
}

function updateCurrentUserActivity() {
  if (!appState.currentUser) return;
  appState.currentUser.lastActivity = new Date().toISOString();
  const user = appState.users.find((u) => u.id === appState.currentUser.id);
  if (user) user.lastActivity = appState.currentUser.lastActivity;
  saveState();
}

// ========== NAVIGATION ET ÉCRANS ==========
function showPublicScreen() {
  elements.loginSection.style.display = 'block';
  elements.appSection.style.display = 'none';
}

function showAppScreen() {
  elements.loginSection.style.display = 'none';
  elements.appSection.style.display = 'block';
}

function navigateTo(section) {
  appState.activeSection = section;
  elements.sections.forEach((el) => {
    el.style.display = el.dataset.section === section ? 'block' : 'none';
  });
  document.querySelectorAll('[data-section]').forEach((link) => {
    link.classList.toggle('active', link.dataset.section === section);
  });
}

// ========== JOURNAL ==========
function logAction(user, action, type, reference, details) {
  appState.journal.push({
    id: crypto.randomUUID(),
    user,
    action,
    type,
    reference,
    details,
    timestamp: new Date().toISOString(),
  });
  saveState();
}

// ========== DOSSIERS JUDICIAIRES ==========
function createJudicialRecord(data) {
  const record = {
    id: crypto.randomUUID(),
    reference: `CH-${appState.settings.referenceYear}-T-${String(appState.counters.judicial + 1).padStart(4, '0')}`,
    defendantName: data.defendantName,
    defendantType: data.defendantType,
    offense: data.offense,
    verdict: data.verdict,
    sentenceType: data.sentenceType,
    sentenceValue: data.sentenceValue,
    sentenceUnit: data.sentenceUnit,
    sentenceStatus: 'Non commencée',
    fineAmount: data.fineAmount ? Number(data.fineAmount) : 0,
    fineStatus: data.fineAmount ? 'Non réglée' : 'N/A',
    createdAt: new Date().toISOString(),
    createdBy: appState.currentUser.name,
    archived: false,
  };
  appState.judicialRecords.push(record);
  appState.counters.judicial++;
  saveState();
  logAction(appState.currentUser.name, 'Création d'un dossier', 'Judiciaire', record.reference, `Dossier créé pour ${data.defendantName}`);
  return record;
}

function updateRecord(type, id, updates) {
  const collection = type === 'Judiciaire' ? appState.judicialRecords : appState.certifications;
  const record = collection.find((item) => item.id === id);
  if (record) {
    Object.assign(record, updates);
    saveState();
    logAction(appState.currentUser.name, "Modification d'un dossier", type, record.reference, `Dossier modifié (${record.reference})`);
  }
}

function archiveRecord(type, id) {
  const collection = type === 'Judiciaire' ? appState.judicialRecords : appState.certifications;
  const record = collection.find((item) => item.id === id);
  if (record) {
    record.archived = true;
    saveState();
    logAction(appState.currentUser.name, 'Archivage d'un dossier', type, record.reference, `Dossier archivé`);
  }
}

function restoreRecord(type, id) {
  const collection = type === 'Judiciaire' ? appState.judicialRecords : appState.certifications;
  const record = collection.find((item) => item.id === id);
  if (record) {
    record.archived = false;
    saveState();
    logAction(appState.currentUser.name, 'Restauration d'un dossier', type, record.reference, `Dossier restauré`);
  }
}

function deleteJudicialRecord(id) {
  const index = appState.judicialRecords.findIndex((item) => item.id === id);
  if (index !== -1) {
    const removed = appState.judicialRecords.splice(index, 1)[0];
    appState.counters.judicial = appState.judicialRecords.length;
    saveState();
    logAction(appState.currentUser.name, 'Suppression d'un dossier', 'Judiciaire', removed.reference, 'Dossier supprimé');
  }
}

// ========== CERTIFICATIONS ==========
function createCertification(data) {
  const record = {
    id: crypto.randomUUID(),
    reference: `CH-${appState.settings.referenceYear}-C-${String(appState.counters.certification + 1).padStart(4, '0')}`,
    certificationType: data.certificationType,
    requestor: data.requestor,
    purpose: data.purpose,
    feeAmount: data.feeAmount ? Number(data.feeAmount) : 0,
    paymentStatus: data.feeAmount ? 'Non réglée' : 'N/A',
    createdAt: new Date().toISOString(),
    createdBy: appState.currentUser.name,
    archived: false,
  };
  appState.certifications.push(record);
  appState.counters.certification++;
  saveState();
  logAction(appState.currentUser.name, 'Création d'une certification', 'Certification', record.reference, `Certification créée pour ${data.requestor}`);
  return record;
}

function deleteCertificationRecord(id) {
  const index = appState.certifications.findIndex((item) => item.id === id);
  if (index !== -1) {
    const removed = appState.certifications.splice(index, 1)[0];
    appState.counters.certification = appState.certifications.length;
    saveState();
    logAction(appState.currentUser.name, 'Suppression d'une certification', 'Certification', removed.reference, 'Certification supprimée');
  }
}

// ========== RECETTES ==========
function getRecordReceipts(record) {
  return appState.receipts.filter((r) => r.linkedRecordId === record.id);
}

function getRecordRemainingAmount(record) {
  const amount = record.fineAmount || record.feeAmount || 0;
  const paid = getRecordReceipts(record).reduce((sum, r) => sum + r.amount, 0);
  return Math.max(0, amount - paid);
}

function createReceipt(data) {
  const receipt = {
    id: crypto.randomUUID(),
    reference: `REC-${appState.settings.referenceYear}-${String(appState.counters.judicial + appState.counters.certification + 1).padStart(4, '0')}`,
    linkedRecordId: data.linkedRecordId,
    linkedRecordType: data.linkedRecordType,
    amount: Number(data.amount),
    method: data.method,
    treasuryPercent: 60,
    chancelleriePercent: 40,
    treasuryAmount: Math.round(Number(data.amount) * 0.6),
    chancelleryAmount: Math.round(Number(data.amount) * 0.4),
    treasuryTransferred: false,
    chancelleryTransferred: false,
    createdAt: new Date().toISOString(),
    createdBy: appState.currentUser.name,
  };
  appState.receipts.push(receipt);
  updatePaymentStatuses(false);
  saveState();
  logAction(appState.currentUser.name, 'Enregistrement d'une recette', data.linkedRecordType, '', `Recette enregistrée : ${formatMoney(receipt.amount)}`);
  return receipt;
}

function updateReceipt(id, updates) {
  const receipt = appState.receipts.find((r) => r.id === id);
  if (receipt) {
    Object.assign(receipt, updates);
    updatePaymentStatuses(false);
    saveState();
    logAction(appState.currentUser.name, 'Modification d'une recette', '', receipt.reference, 'Recette modifiée');
  }
}

function deleteReceipt(id) {
  const index = appState.receipts.findIndex((r) => r.id === id);
  if (index !== -1) {
    const removed = appState.receipts.splice(index, 1)[0];
    updatePaymentStatuses(false);
    saveState();
    logAction(appState.currentUser.name, 'Suppression d'une recette', '', removed.reference, 'Recette supprimée');
  }
}

function updatePaymentStatuses(saveChanges = true) {
  let hasChanged = false;

  appState.judicialRecords.forEach((record) => {
    if (!record.fineAmount || record.fineAmount === 0) {
      record.fineStatus = 'N/A';
      return;
    }
    const remaining = getRecordRemainingAmount(record);
    const newStatus = remaining === 0 ? 'Réglée' : getRecordReceipts(record).length > 0 ? 'Partiellement réglée' : 'Non réglée';
    if (record.fineStatus !== newStatus) {
      record.fineStatus = newStatus;
      hasChanged = true;
    }
  });

  appState.certifications.forEach((record) => {
    if (record.paymentStatus === 'Annulée') return;
    const remaining = getRecordRemainingAmount(record);
    const newStatus = remaining === 0 ? 'Réglée' : getRecordReceipts(record).length > 0 ? 'Partiellement réglée' : 'Non réglée';
    if (record.paymentStatus !== newStatus) {
      record.paymentStatus = newStatus;
      hasChanged = true;
    }
  });

  if (saveChanges && hasChanged) {
    saveState();
  }
}

// ========== UTILISATEURS ==========
function createUser(data) {
  const user = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    status: data.status || 'Habilité',
    createdAt: new Date().toISOString(),
    lastActivity: null,
  };
  appState.users.push(user);
  saveState();
  logAction(appState.currentUser.name, 'Création d'un utilisateur', 'Utilisateur', user.email, `Utilisateur ${user.name} créé`);
  return user;
}

function updateUser(id, updates) {
  const user = appState.users.find((u) => u.id === id);
  if (user) {
    Object.assign(user, updates);
    if (appState.currentUser && appState.currentUser.id === id) {
      Object.assign(appState.currentUser, updates);
      saveLocalSession();
    }
    saveState();
    logAction(appState.currentUser.name, 'Modification d'un utilisateur', 'Utilisateur', user.email, `Utilisateur ${user.name} modifié`);
  }
}

function deleteUser(id) {
  const index = appState.users.findIndex((u) => u.id === id);
  if (index !== -1) {
    const removed = appState.users.splice(index, 1)[0];
    saveState();
    logAction(appState.currentUser.name, 'Suppression d'un utilisateur', 'Utilisateur', removed.email, `Utilisateur ${removed.name} supprimé`);
  }
}

// ========== RENDUS ==========
function renderJudicialList() {
  const filtered = appState.judicialRecords.filter((record) => {
    if (!elements.judicialShowArchived.checked && record.archived) return false;
    if (elements.judicialStatusFilter.value && record.sentenceStatus !== elements.judicialStatusFilter.value) return false;
    if (elements.judicialFineStatusFilter.value && record.fineStatus !== elements.judicialFineStatusFilter.value) return false;
    if (elements.judicialSearch.value) {
      const searchLower = elements.judicialSearch.value.toLowerCase();
      return record.reference.toLowerCase().includes(searchLower) || record.defendantName.toLowerCase().includes(searchLower);
    }
    return true;
  });

  elements.judicialTable.innerHTML = filtered
    .map((record) => {
      return `
        <tr class="${record.archived ? 'archived' : ''}">
          <td>${record.reference}</td>
          <td>${record.defendantName}</td>
          <td>${record.offense}</td>
          <td class="${getSentenceStatusColor(record.sentenceStatus)}">${record.sentenceStatus}</td>
          <td class="${getSentenceStatusColor(record.sentenceStatus)}">${record.sentenceValue} ${record.sentenceUnit}</td>
          <td>${formatMoney(record.fineAmount)}</td>
          <td class="${getFineStatusColor(record.fineStatus)}">${record.fineStatus}</td>
          <td>${formatDate(record.createdAt)}</td>
          <td>${record.createdBy}</td>
          <td>
            ${!record.archived ? `<button class="edit-judicial-btn" data-id="${record.id}">✏️</button>` : ''}
            ${!record.archived ? `<button class="archive-judicial-btn" data-id="${record.id}">📦</button>` : ''}
            ${record.archived ? `<button class="restore-judicial-btn" data-id="${record.id}">↩️</button>` : ''}
            ${record.archived ? `<button class="delete-judicial-btn" data-id="${record.id}">🗑️</button>` : ''}
          </td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="10">Aucun dossier à afficher.</td></tr>';
}

function renderCertificationList() {
  const filtered = appState.certifications.filter((record) => {
    if (!elements.certificationShowArchived.checked && record.archived) return false;
    if (elements.certificationStatusFilter.value && record.certificationType !== elements.certificationStatusFilter.value) return false;
    if (elements.certificationPaymentFilter.value && record.paymentStatus !== elements.certificationPaymentFilter.value) return false;
    if (elements.certificationSearch.value) {
      const searchLower = elements.certificationSearch.value.toLowerCase();
      return record.reference.toLowerCase().includes(searchLower) || record.requestor.toLowerCase().includes(searchLower);
    }
    return true;
  });

  elements.certificationTable.innerHTML = filtered
    .map((record) => {
      return `
        <tr class="${record.archived ? 'archived' : ''}">
          <td>${record.reference}</td>
          <td>${record.certificationType}</td>
          <td>${record.requestor}</td>
          <td>${record.purpose}</td>
          <td>${formatMoney(record.feeAmount)}</td>
          <td class="${getPaymentStatusColor(record.paymentStatus)}">${record.paymentStatus}</td>
          <td>${formatDate(record.createdAt)}</td>
          <td>${record.createdBy}</td>
          <td>
            ${!record.archived ? `<button class="edit-certification-btn" data-id="${record.id}">✏️</button>` : ''}
            ${!record.archived ? `<button class="archive-certification-btn" data-id="${record.id}">📦</button>` : ''}
            ${record.archived ? `<button class="restore-certification-btn" data-id="${record.id}">↩️</button>` : ''}
            ${record.archived ? `<button class="delete-certification-btn" data-id="${record.id}">🗑️</button>` : ''}
          </td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="8">Aucune certification à afficher.</td></tr>';
}

function renderReceiptTable() {
  const allRecords = [...appState.judicialRecords, ...appState.certifications].filter((r) => !r.archived);
  elements.receiptSelect.innerHTML = allRecords
    .map((r) => `<option value="${r.id}">${r.reference} - ${r.defendantName || r.requestor}</option>`)
    .join('');

  const receipts = appState.receipts;
  elements.receiptTable.innerHTML = receipts
    .map((receipt) => {
      const record = [...appState.judicialRecords, ...appState.certifications].find((r) => r.id === receipt.linkedRecordId);
      return `
        <tr>
          <td>${receipt.reference}</td>
          <td>${record ? record.reference : 'N/A'}</td>
          <td>${receipt.method}</td>
          <td>${formatMoney(receipt.amount)}</td>
          <td>${receipt.treasuryPercent}%</td>
          <td>${receipt.chancelleriePercent}%</td>
          <td>${formatMoney(receipt.treasuryAmount)}</td>
          <td>${receipt.chancelleryAmount}</td>
          <td>${receipt.treasuryTransferred ? '✓' : '✗'}</td>
          <td>${receipt.chancelleryTransferred ? '✓' : '✗'}</td>
          <td>${formatDate(receipt.createdAt)}</td>
          <td>${receipt.createdBy}</td>
          <td>
            <button class="edit-receipt-btn" data-id="${receipt.id}">✏️</button>
            <button class="delete-receipt-btn" data-id="${receipt.id}">🗑️</button>
          </td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="13">Aucune recette à afficher.</td></tr>';
}

function renderUsersList() {
  elements.usersList.innerHTML = appState.users
    .map((user) => {
      return `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.status}</td>
          <td>${formatAccessRights(user.role)}</td>
          <td>${user.lastActivity ? formatDate(user.lastActivity) : 'Jamais'}</td>
          <td>
            ${user.id !== appState.currentUser.id ? `<button class="edit-user-btn" data-id="${user.id}">✏️</button>` : ''}
            ${user.id !== appState.currentUser.id ? `<button class="delete-user-btn" data-id="${user.id}">🗑️</button>` : ''}
          </td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="7">Aucun utilisateur à afficher.</td></tr>';
}

function renderJournal() {
  elements.journalTable.innerHTML = appState.journal
    .slice()
    .reverse()
    .map((entry) => {
      return `
        <tr>
          <td>${entry.user}</td>
          <td>${entry.action}</td>
          <td>${entry.type}</td>
          <td>${entry.reference}</td>
          <td>${entry.details}</td>
          <td>${formatDate(entry.timestamp)}</td>
        </tr>
      `;
    })
    .join('') || '<tr><td colspan="6">Aucune activité à afficher.</td></tr>';
}

function renderDashboard() {
  const totalJudicial = appState.judicialRecords.filter((r) => !r.archived).length;
  const totalCertification = appState.certifications.filter((r) => !r.archived).length;
  const totalFines = appState.judicialRecords.reduce((sum, r) => sum + (r.fineAmount || 0), 0);
  const totalDue = appState.judicialRecords
    .filter((r) => r.fineStatus === 'Non réglée' || r.fineStatus === 'Partiellement réglée')
    .reduce((sum, r) => sum + getRecordRemainingAmount(r), 0);
  const certFees = appState.certifications.reduce((sum, r) => sum + (r.feeAmount || 0), 0);
  const certDue = appState.certifications
    .filter((r) => r.paymentStatus === 'Non réglée' || r.paymentStatus === 'Partiellement réglée')
    .reduce((sum, r) => sum + getRecordRemainingAmount(r), 0);
  const totalTreasury = appState.receipts.reduce((sum, r) => sum + r.treasuryAmount, 0);
  const totalChancellery = appState.receipts.reduce((sum, r) => sum + r.chancelleryAmount, 0);
  const pendingTotal = totalDue + certDue;
  const pendingTreasury = Math.round(pendingTotal * 0.6);
  const pendingChancellery = Math.round(pendingTotal * 0.4);
  const archivedJudicial = appState.judicialRecords.filter((r) => r.archived).length;
  const archivedCertifications = appState.certifications.filter((r) => r.archived).length;

  elements.cardTotalJudicial.textContent = totalJudicial;
  elements.cardTotalCertification.textContent = totalCertification;
  elements.cardTotalFines.textContent = formatMoney(totalFines);
  elements.cardTotalDue.textContent = formatMoney(totalDue);
  elements.cardTotalTreasury.textContent = formatMoney(totalTreasury);
  elements.cardTotalChancellery.textContent = formatMoney(totalChancellery);
  elements.cardTotalCertifications.textContent = formatMoney(certFees);
  elements.cardPendingTotal.textContent = formatMoney(pendingTotal);
  elements.cardPendingTreasury.textContent = formatMoney(pendingTreasury);
  elements.cardPendingChancellery.textContent = formatMoney(pendingChancellery);
  elements.cardArchivedJudicial.textContent = archivedJudicial;
  elements.cardArchivedCertifications.textContent = archivedCertifications;

  const latestRecords = [...appState.judicialRecords, ...appState.certifications]
    .filter((r) => !r.archived)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  elements.dashboardLatestList.innerHTML = latestRecords
    .map((record) => {
      return `
        <div class="latest-item">
          <strong>${record.reference}</strong> - ${record.defendantName || record.requestor} <br/>
          <small>${formatDate(record.createdAt)} par ${record.createdBy}</small>
        </div>
      `;
    })
    .join('');

  const sentenceNotStarted = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === 'Non commencée').length;
  const sentenceInProgress = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === "En cours d'exécution").length;
  const sentenceCompleted = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === 'Exécutée').length;
  const fineNotPaid = appState.judicialRecords.filter((r) => !r.archived && r.fineStatus === 'Non réglée').length;
  const finePartiallyPaid = appState.judicialRecords.filter((r) => !r.archived && r.fineStatus === 'Partiellement réglée').length;
  const finePaid = appState.judicialRecords.filter((r) => !r.archived && r.fineStatus === 'Réglée').length;

  elements.statusNotStarted.textContent = sentenceNotStarted;
  elements.statusInProgress.textContent = sentenceInProgress;
  elements.statusCompleted.textContent = sentenceCompleted;
  elements.statusSuspended.textContent = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === 'Suspendue').length;
  elements.statusCancelled.textContent = appState.judicialRecords.filter((r) => !r.archived && r.sentenceStatus === 'Annulée').length;
  elements.statusRemaining.textContent = formatMoney(totalDue);
}

// ========== MODALES ET FORMULAIRES ==========
function showDeletionConfirmation(message, confirmText = 'Confirmer', cancelText = 'Annuler') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-card">
        <h3>Confirmation</h3>
        <p class="confirm-message">${message}</p>
        <div class="form-actions confirm-actions">
          <button type="button" class="secondary-btn" id="confirm-cancel-button">${cancelText}</button>
          <button type="button" class="primary-btn danger-btn" id="confirm-ok-button">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#confirm-cancel-button').addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });

    modal.querySelector('#confirm-ok-button').addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });
  });
}

function openJudicialModal(id = null) {
  const form = elements.judicialForm;
  if (id) {
    const record = appState.judicialRecords.find((r) => r.id === id);
    if (record) {
      form.defendantName.value = record.defendantName;
      form.defendantType.value = record.defendantType;
      form.offense.value = record.offense;
      form.verdict.value = record.verdict;
      form.sentenceType.value = record.sentenceType;
      form.sentenceValue.value = record.sentenceValue;
      form.sentenceUnit.value = record.sentenceUnit;
      form.sentenceStatus.value = record.sentenceStatus;
      form.fineAmount.value = record.fineAmount;
      form.fineStatus.value = record.fineStatus;
    }
    form.recordId = id;
  } else {
    form.reset();
    form.recordId = null;
  }
  elements.judicialModal.style.display = 'flex';
}

function closeJudicialModal() {
  elements.judicialModal.style.display = 'none';
}

function openCertificationModal(id = null) {
  const form = elements.certificationForm;
  if (id) {
    const record = appState.certifications.find((r) => r.id === id);
    if (record) {
      form.certificationType.value = record.certificationType;
      form.requestor.value = record.requestor;
      form.purpose.value = record.purpose;
      form.feeAmount.value = record.feeAmount;
    }
    form.recordId = id;
  } else {
    form.reset();
    form.recordId = null;
  }
  elements.certificationModal.style.display = 'flex';
}

function closeCertificationModal() {
  elements.certificationModal.style.display = 'none';
}

function openReceiptModal(id = null) {
  const form = elements.receiptForm;
  if (id) {
    const receipt = appState.receipts.find((r) => r.id === id);
    if (receipt) {
      form.amount.value = receipt.amount;
      form.method.value = receipt.method;
      form.linkedRecordId.value = receipt.linkedRecordId;
      form.treasuryTransferred.checked = receipt.treasuryTransferred;
      form.chancelleryTransferred.checked = receipt.chancelleryTransferred;
    }
    form.receiptId = id;
  } else {
    form.reset();
    form.receiptId = null;
  }
  elements.receiptModal.style.display = 'flex';
}

function closeReceiptModal() {
  elements.receiptModal.style.display = 'none';
}

function openUserModal(id = null) {
  const form = elements.userForm;
  if (id) {
    const user = appState.users.find((u) => u.id === id);
    if (user) {
      form.name.value = user.name;
      form.email.value = user.email;
      form.password.value = user.password;
      form.role.value = user.role;
      form.status.value = user.status;
    }
    form.userId = id;
  } else {
    form.reset();
    form.userId = null;
  }
  elements.userModal.style.display = 'flex';
}

function closeUserModal() {
  elements.userModal.style.display = 'none';
}

function openSettingsModal() {
  const form = elements.settingsForm;
  form.institution.value = appState.settings.institution;
  form.referenceYear.value = appState.settings.referenceYear;
  form.judicialTreasuryPercentage.value = appState.settings.judicialTreasuryPercentage;
  form.certificationTreasuryPercentage.value = appState.settings.certificationTreasuryPercentage;
  form.currency.value = appState.settings.currency;
  elements.settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
  elements.settingsModal.style.display = 'none';
}

// ========== INITIALISATIONS ==========
function initAuth() {
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    const error = await login(email, password);
    if (error) {
      elements.loginError.textContent = error;
    } else {
      elements.loginError.textContent = '';
      elements.emailInput.value = '';
      elements.passwordInput.value = '';
      showAppScreen();
      ensureAuthVisibility();
      renderDashboard();
      renderJudicialList();
      renderCertificationList();
      renderReceiptOptions();
      renderReceiptTable();
      renderUsersList();
      renderJournal();
      navigateTo('dashboard');
    }
  });

  elements.logoutButton.addEventListener('click', () => {
    logout();
  });
}

function initNav() {
  document.querySelectorAll('[data-section]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      navigateTo(section);
    });
  });
}

function initForms() {
  // Judicial Form
  elements.newJudicialButton.addEventListener('click', () => openJudicialModal());
  elements.judicialForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (elements.judicialForm.recordId) {
      updateRecord('Judiciaire', elements.judicialForm.recordId, {
        defendantName: elements.judicialForm.defendantName.value,
        defendantType: elements.judicialForm.defendantType.value,
        offense: elements.judicialForm.offense.value,
        verdict: elements.judicialForm.verdict.value,
        sentenceType: elements.judicialForm.sentenceType.value,
        sentenceValue: elements.judicialForm.sentenceValue.value,
        sentenceUnit: elements.judicialForm.sentenceUnit.value,
        sentenceStatus: elements.judicialForm.sentenceStatus.value,
        fineAmount: Number(elements.judicialForm.fineAmount.value) || 0,
        fineStatus: elements.judicialForm.fineStatus.value,
      });
    } else {
      createJudicialRecord({
        defendantName: elements.judicialForm.defendantName.value,
        defendantType: elements.judicialForm.defendantType.value,
        offense: elements.judicialForm.offense.value,
        verdict: elements.judicialForm.verdict.value,
        sentenceType: elements.judicialForm.sentenceType.value,
        sentenceValue: elements.judicialForm.sentenceValue.value,
        sentenceUnit: elements.judicialForm.sentenceUnit.value,
        fineAmount: Number(elements.judicialForm.fineAmount.value) || 0,
      });
    }
    closeJudicialModal();
    renderJudicialList();
    renderDashboard();
  });

  // Certification Form
  elements.newCertificationButton.addEventListener('click', () => openCertificationModal());
  elements.certificationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (elements.certificationForm.recordId) {
      updateRecord('Certification', elements.certificationForm.recordId, {
        certificationType: elements.certificationForm.certificationType.value,
        requestor: elements.certificationForm.requestor.value,
        purpose: elements.certificationForm.purpose.value,
        feeAmount: Number(elements.certificationForm.feeAmount.value) || 0,
      });
    } else {
      createCertification({
        certificationType: elements.certificationForm.certificationType.value,
        requestor: elements.certificationForm.requestor.value,
        purpose: elements.certificationForm.purpose.value,
        feeAmount: Number(elements.certificationForm.feeAmount.value) || 0,
      });
    }
    closeCertificationModal();
    renderCertificationList();
    renderDashboard();
  });

  // Receipt Form
  elements.addReceiptButton.addEventListener('click', () => openReceiptModal());
  elements.receiptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (elements.receiptForm.receiptId) {
      updateReceipt(elements.receiptForm.receiptId, {
        amount: Number(elements.receiptForm.amount.value),
        method: elements.receiptForm.method.value,
        linkedRecordId: elements.receiptForm.linkedRecordId.value,
        treasuryTransferred: elements.receiptForm.treasuryTransferred.checked,
        chancelleryTransferred: elements.receiptForm.chancelleryTransferred.checked,
      });
    } else {
      createReceipt({
        linkedRecordId: elements.receiptForm.linkedRecordId.value,
        linkedRecordType: (() => {
          const record = [...appState.judicialRecords, ...appState.certifications].find((r) => r.id === elements.receiptForm.linkedRecordId.value);
          return record && record.defendantName ? 'Judiciaire' : 'Certification';
        })(),
        amount: elements.receiptForm.amount.value,
        method: elements.receiptForm.method.value,
      });
    }
    closeReceiptModal();
    renderReceiptTable();
    renderDashboard();
  });

  // User Form
  if (elements.userForm) {
    elements.userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (elements.userForm.userId) {
        updateUser(elements.userForm.userId, {
          name: elements.userForm.name.value,
          email: elements.userForm.email.value,
          password: elements.userForm.password.value,
          role: elements.userForm.role.value,
          status: elements.userForm.status.value,
        });
      } else {
        createUser({
          name: elements.userForm.name.value,
          email: elements.userForm.email.value,
          password: elements.userForm.password.value,
          role: elements.userForm.role.value,
          status: elements.userForm.status.value,
        });
      }
      closeUserModal();
      renderUsersList();
    });
  }

  // Settings Form
  if (elements.settingsForm) {
    elements.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      appState.settings.institution = elements.settingsForm.institution.value;
      appState.settings.referenceYear = elements.settingsForm.referenceYear.value;
      appState.settings.judicialTreasuryPercentage = Number(elements.settingsForm.judicialTreasuryPercentage.value);
      appState.settings.certificationTreasuryPercentage = Number(elements.settingsForm.certificationTreasuryPercentage.value);
      appState.settings.currency = elements.settingsForm.currency.value;
      saveState();
      closeSettingsModal();
      alert('Paramètres sauvegardés avec succès');
    });
  }
}

function initFilters() {
  elements.judicialSearch.addEventListener('input', renderJudicialList);
  elements.judicialStatusFilter.addEventListener('change', renderJudicialList);
  elements.judicialFineStatusFilter.addEventListener('change', renderJudicialList);
  elements.judicialShowArchived.addEventListener('change', renderJudicialList);

  elements.certificationSearch.addEventListener('input', renderCertificationList);
  elements.certificationStatusFilter.addEventListener('change', renderCertificationList);
  elements.certificationPaymentFilter.addEventListener('change', renderCertificationList);
  elements.certificationShowArchived.addEventListener('change', renderCertificationList);

  elements.refreshDashboardButton?.addEventListener('click', () => {
    renderDashboard();
  });
  elements.refreshJudicialButton?.addEventListener('click', renderJudicialList);
  elements.refreshCertificationButton?.addEventListener('click', renderCertificationList);
  elements.refreshReceiptButton?.addEventListener('click', renderReceiptTable);
  elements.refreshUsersButton?.addEventListener('click', renderUsersList);
  elements.refreshJournalButton?.addEventListener('click', renderJournal);
}

function initTableActions() {
  document.addEventListener('click', async (e) => {
    // Judicial
    if (e.target.classList.contains('edit-judicial-btn')) {
      openJudicialModal(e.target.dataset.id);
    }
    if (e.target.classList.contains('archive-judicial-btn')) {
      archiveRecord('Judiciaire', e.target.dataset.id);
      renderJudicialList();
      renderDashboard();
    }
    if (e.target.classList.contains('restore-judicial-btn')) {
      restoreRecord('Judiciaire', e.target.dataset.id);
      renderJudicialList();
      renderDashboard();
    }
    if (e.target.classList.contains('delete-judicial-btn')) {
      const confirmed = await showDeletionConfirmation('Êtes-vous sûr de vouloir supprimer ce dossier judiciaire ? Cette action est irréversible.', 'Supprimer', 'Annuler');
      if (confirmed) {
        deleteJudicialRecord(e.target.dataset.id);
        renderJudicialList();
        renderDashboard();
      }
    }

    // Certification
    if (e.target.classList.contains('edit-certification-btn')) {
      openCertificationModal(e.target.dataset.id);
    }
    if (e.target.classList.contains('archive-certification-btn')) {
      archiveRecord('Certification', e.target.dataset.id);
      renderCertificationList();
      renderDashboard();
    }
    if (e.target.classList.contains('restore-certification-btn')) {
      restoreRecord('Certification', e.target.dataset.id);
      renderCertificationList();
      renderDashboard();
    }
    if (e.target.classList.contains('delete-certification-btn')) {
      const confirmed = await showDeletionConfirmation('Êtes-vous sûr de vouloir supprimer cette certification ? Cette action est irréversible.', 'Supprimer', 'Annuler');
      if (confirmed) {
        deleteCertificationRecord(e.target.dataset.id);
        renderCertificationList();
        renderDashboard();
      }
    }

    // Receipt
    if (e.target.classList.contains('edit-receipt-btn')) {
      openReceiptModal(e.target.dataset.id);
    }
    if (e.target.classList.contains('delete-receipt-btn')) {
      const confirmed = await showDeletionConfirmation('Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.', 'Supprimer', 'Annuler');
      if (confirmed) {
        deleteReceipt(e.target.dataset.id);
        renderReceiptTable();
        renderDashboard();
      }
    }

    // User
    if (e.target.classList.contains('edit-user-btn')) {
      const permission = getPermission(appState.currentUser.role);
      if (!permission.canManageUsers) {
        alert('Vous n'avez pas la permission de modifier des utilisateurs.');
        return;
      }
      openUserModal(e.target.dataset.id);
    }
    if (e.target.classList.contains('delete-user-btn')) {
      const permission = getPermission(appState.currentUser.role);
      if (!permission.canManageUsers) {
        alert('Vous n'avez pas la permission de supprimer un utilisateur.');
        return;
      }
      const confirmed = await showDeletionConfirmation('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.', 'Supprimer', 'Annuler');
      if (!confirmed) return;
      if (e.target.dataset.id === appState.currentUser.id) {
        alert('Vous ne pouvez pas supprimer votre propre compte.');
        return;
      }
      deleteUser(e.target.dataset.id);
      renderUsersList();
    }
  });
}

function renderReceiptOptions() {
  const allRecords = [...appState.judicialRecords, ...appState.certifications].filter((r) => !r.archived);
  elements.receiptSelect.innerHTML = allRecords
    .map((r) => `<option value="${r.id}">${r.reference} - ${r.defendantName || r.requestor}</option>`)
    .join('');
}

// ========== RESET DATA (pour tester) ==========
function resetDataFilters() {
  elements.judicialSearch.value = '';
  elements.judicialStatusFilter.value = '';
  elements.judicialFineStatusFilter.value = '';
  elements.judicialShowArchived.checked = false;
  elements.certificationSearch.value = '';
  elements.certificationStatusFilter.value = '';
  elements.certificationPaymentFilter.value = '';
  elements.certificationShowArchived.checked = false;
}

// ========== MODAL CLOSE BUTTONS ==========
document.addEventListener('DOMContentLoaded', () => {
  const closeButtons = document.querySelectorAll('[data-close-modal]');
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal.id === 'judicial-modal') closeJudicialModal();
      if (modal.id === 'certification-modal') closeCertificationModal();
      if (modal.id === 'receipt-modal') closeReceiptModal();
      if (modal.id === 'user-modal') closeUserModal();
      if (modal.id === 'settings-modal') closeSettingsModal();
    });
  });
});

// ========== DEMARRAGE APP ==========
async function mountApp() {
  await loadState();
  initAuth();
  initNav();
  initTableActions();
  initFilters();
  initForms();
  if (appState.isAuthenticated && appState.currentUser) {
    const activeUser = appState.users.find((user) => user.id === appState.currentUser.id);
    appState.currentUser = activeUser || appState.currentUser;
    showAppScreen();
    resetDataFilters();
    ensureAuthVisibility();
    renderDashboard();
    renderJudicialList();
    renderCertificationList();
    renderReceiptOptions();
    renderReceiptTable();
    renderUsersList();
    renderJournal