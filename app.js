const SUPABASE_URL = 'https://hqiyraklzdmgqmytjjjo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hCFQ6GdF0AqQH32_qbKrkg_UJTbq70i';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

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

const elements = {
  publicView: document.getElementById('public-view'),
  appShell: document.getElementById('app-shell'),
  loginScreen: document.getElementById('login-screen'),
  registerScreen: document.getElementById('register-screen'),
  showRegister: document.getElementById('show-register'),
  showLogin: document.getElementById('show-login'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  loginError: document.getElementById('login-error'),
  registerMessage: document.getElementById('register-message'),
  currentUserName: document.getElementById('current-user-name'),
  currentUserRole: document.getElementById('current-user-role'),
  logoutButton: document.getElementById('logout-button'),
  navLinks: Array.from(document.querySelectorAll('.nav-link')),
  sectionTitle: document.getElementById('section-title'),
  sections: {
    dashboard: document.getElementById('dashboard'),
    judicial: document.getElementById('judicial'),
    certifications: document.getElementById('certifications'),
    payments: document.getElementById('payments'),
    users: document.getElementById('users'),
    journal: document.getElementById('journal'),
    settings: document.getElementById('settings'),
  },
  cardOpenJudicial: document.getElementById('card-open-judicial'),
  cardOpenCertifications: document.getElementById('card-open-certifications'),
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
  judicialList: document.getElementById('judicial-list'),
  newJudicialButton: document.getElementById('new-judicial-button'),
  certificationSearch: document.getElementById('certification-search'),
  certificationStatusFilter: document.getElementById('certification-status-filter'),
  certificationShowArchived: document.getElementById('certification-show-archived'),
  certificationList: document.getElementById('certification-list'),
  newCertificationButton: document.getElementById('new-certification-button'),
  cardTotalReceived: document.getElementById('card-total-received'),
  cardReceivedTreasury: document.getElementById('card-received-treasury'),
  cardReceivedChancellery: document.getElementById('card-received-chancellery'),
  addReceiptButton: document.getElementById('add-receipt-button'),
  receiptMessage: document.getElementById('receipt-message'),
  receiptList: document.getElementById('receipt-list'),
  usersList: document.getElementById('users-list'),
  journalList: document.getElementById('journal-list'),
  settingJudicialTreasury: document.getElementById('setting-judicial-treasury'),
  settingCertificationTreasury: document.getElementById('setting-certification-treasury'),
  settingJudicialDisplay: document.getElementById('setting-judicial-display'),
  settingCertificationDisplay: document.getElementById('setting-certification-display'),
  settingYear: document.getElementById('setting-year'),
  settingInstitution: document.getElementById('setting-institution'),
  settingCurrency: document.getElementById('setting-currency'),
  settingsForm: document.getElementById('settings-form'),
  refreshJudicialButton: document.getElementById('refresh-judicial-button'),
  refreshCertificationButton: document.getElementById('refresh-certification-button'),
  refreshDashboardButton: document.getElementById('refresh-dashboard-button'),
  refreshPaymentsButton: document.getElementById('refresh-payments-button'),
  refreshUsersButton: document.getElementById('refresh-users-button'),
  refreshJournalButton: document.getElementById('refresh-journal-button'),
  refreshStatusJudicial: document.getElementById('refresh-status-judicial'),
  refreshStatusCertification: document.getElementById('refresh-status-certification'),
  refreshStatusDashboard: document.getElementById('refresh-status-dashboard'),
  refreshStatusPayments: document.getElementById('refresh-status-payments'),
  refreshStatusUsers: document.getElementById('refresh-status-users'),
  refreshStatusJournal: document.getElementById('refresh-status-journal'),
};

const authFields = {
  email: document.getElementById('login-email'),
  password: document.getElementById('login-password'),
  name: document.getElementById('register-name'),
  registerEmail: document.getElementById('register-email'),
  registerPassword: document.getElementById('register-password'),
};

const dialog = {
  createElement: (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  },
};

async function loadState() {
  try {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('app_state')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Erreur chargement Supabase :', error);
      return;
    }

    if (data && data.app_state) {
      // Merge defensively: fall back to current in-memory value for any
      // field missing from the stored snapshot, instead of wiping it.
      Object.assign(appState, {
        users: Array.isArray(data.app_state.users) ? data.app_state.users : appState.users,
        judicialRecords: Array.isArray(data.app_state.judicialRecords) ? data.app_state.judicialRecords : appState.judicialRecords,
        certifications: Array.isArray(data.app_state.certifications) ? data.app_state.certifications : appState.certifications,
        receipts: Array.isArray(data.app_state.receipts) ? data.app_state.receipts : appState.receipts,
        journal: Array.isArray(data.app_state.journal) ? data.app_state.journal : appState.journal,
        settings: data.app_state.settings || appState.settings,
        counters: data.app_state.counters || appState.counters,
        currentUser: data.app_state.currentUser ?? appState.currentUser,
        activeSection: data.app_state.activeSection || appState.activeSection,
        isAuthenticated: Boolean(data.app_state.isAuthenticated),
      });

      console.log('État chargé depuis Supabase');
      console.log('Dossiers judiciaires chargés :', appState.judicialRecords.length);
      console.log('Certifications chargées :', appState.certifications.length);
      console.log('Utilisateur restauré :', appState.currentUser);
      console.log('Authentifié :', appState.isAuthenticated);
    } else {
      console.log('Aucun état trouvé dans Supabase.');
    }
  } catch (error) {
    console.error('Erreur inattendue lors du chargement :', error);
  }
}


function normalizeAppState(data = {}) {
  appState.users = Array.isArray(data.users) ? data.users : [];

  appState.currentUser = data.currentUser || null;

  appState.isAuthenticated = Boolean(
    appState.currentUser &&
    appState.currentUser.status === 'Habilité'
  );

  appState.settings = {
    judicialTreasuryPercentage: Number(
      data.settings?.judicialTreasuryPercentage ??
      data.settings?.treasuryPercentage ??
      60
    ),
    certificationTreasuryPercentage: Number(
      data.settings?.certificationTreasuryPercentage ??
      data.settings?.treasuryPercentage ??
      60
    ),
    referenceYear:
      data.settings?.referenceYear ??
      String(new Date().getFullYear()),
    institution:
      data.settings?.institution ??
      'Registre de la Chancellerie impériale',
    currency: data.settings?.currency ?? 'septimes',
  };

  appState.receipts = (data.receipts || []).map((receipt) => {
    const normalized = { ...receipt };
    const amount = Number(normalized.amount || 0);

    const treasuryPercent = Number(
      normalized.treasuryPercent ??
      appState.settings.judicialTreasuryPercentage
    );

    normalized.treasuryPercent = treasuryPercent;
    normalized.chancelleryPercent = 100 - treasuryPercent;
    normalized.treasuryAmount = Math.round(
      amount * treasuryPercent / 100
    );
    normalized.chancelleryAmount =
      amount - normalized.treasuryAmount;

    normalized.treasuryTransferred =
      Boolean(normalized.treasuryTransferred);

    normalized.chancelleryTransferred =
      Boolean(normalized.chancelleryTransferred);

    normalized.collectorName =
      normalized.collectorName || '';

    normalized.allocation =
      `${normalized.treasuryPercent}% Trésor / ` +
      `${normalized.chancelleryPercent}% Chancellerie`;

    return normalized;
  });
}


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
  appState.judicialRecords = [
    {
      id: crypto.randomUUID(),
      reference: `CH-${year}-T-0001`,
      suspect: 'Marius Valerius',
      magistrate: 'Magistrat Solenne',
      judgmentDate: new Date().toISOString().slice(0, 10),
      qualification: 'Vol aggravé',
      fineAmount: 15000,
      sentence: 'Travail forcé sur les terres impériales',
      sentenceStatus: 'En cours d’exécution',
      judgmentReference: 'JUG-21-454',
      judgmentLink: 'https://discord.gg/exemple',
      treasuryAmount: 9000,
      chancelleryAmount: 6000,
      fineStatus: 'Partiellement réglée',
      notes: 'Travail supervisé par la chancellerie.',
      archived: false,
      createdAt: new Date().toISOString(),
      type: 'Judiciaire',
    },
  ];
  appState.certifications = [
    {
      id: crypto.randomUUID(),
      reference: `C-${year}-0001`,
      candidateName: 'Helena de Brun',
      instructor: 'Scribe Aurèle',
      trainingDate: new Date().toISOString().slice(0, 10),
      trainingType: 'Avocati',
      amount: 9000,
      treasuryAmount: 5400,
      chancelleryAmount: 3600,
      paymentStatus: 'Non réglée',
      notes: 'Demande de certification pour la garde impériale.',
      archived: false,
      createdAt: new Date().toISOString(),
      type: 'Certification',
    },
  ];
  appState.receipts = [
    {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      dossierTitle: 'Marius Valerius',
      reference: 'CH-' + year + '-T-0001',
      type: 'Judiciaire',
      amount: 6000,
      treasuryPercent: appState.settings.judicialTreasuryPercentage,
      chancelleryPercent: 100 - appState.settings.judicialTreasuryPercentage,
      treasuryAmount: Math.round((6000 * appState.settings.judicialTreasuryPercentage) / 100),
      chancelleryAmount: 6000 - Math.round((6000 * appState.settings.judicialTreasuryPercentage) / 100),
      allocation: `${appState.settings.judicialTreasuryPercentage}% Trésor / ${100 - appState.settings.judicialTreasuryPercentage}% Chancellerie`,
      method: 'Espèces',
      recordedBy: 'Scribe Aurèle',
    },
  ];
  appState.counters = { judicial: 1, certification: 1 };
  appState.isAuthenticated = false;
  saveState();
}

async function saveState() {
  const { data, error } = await supabaseClient
    .from('app_settings')
    .upsert(
      {
        id: 1,
        app_state: appState,
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

  console.log('État sauvegardé dans Supabase');
  return true;
}

function capitalize(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function getRefreshElements(section) {
  const key = capitalize(section);
  return {
    button: elements[`refresh${key}Button`],
    status: elements[`refreshStatus${key}`],
  };
}

function setRefreshState(section, isLoading) {
  const target = getRefreshElements(section);
  if (!target.button) return;
  target.button.disabled = isLoading;
  target.button.textContent = isLoading ? 'Rafraîchissement…' : 'Rafraîchir';
  if (target.status) {
    target.status.textContent = isLoading ? 'Chargement des données…' : '';
    target.status.classList.toggle('hidden', !isLoading);
    target.status.classList.toggle('error', false);
  }
}

function showRefreshMessage(section, message, isError = false) {
  const target = getRefreshElements(section);
  if (!target.status) return;
  target.status.textContent = message;
  target.status.classList.toggle('hidden', false);
  target.status.classList.toggle('error', Boolean(isError));
}

function clearRefreshMessage(section) {
  const target = getRefreshElements(section);
  if (!target.status) return;
  target.status.textContent = '';
  target.status.classList.add('hidden');
  target.status.classList.remove('error');
}

function renderAppContent() {
  renderDashboard();
  renderJudicialList();
  renderCertificationList();
  renderReceiptOptions();
  renderReceiptTable();
  renderUsersList();
  renderJournal();
  renderSettings();
}

async function refreshSection(section) {
  const currentSection = section || appState.activeSection || 'dashboard';
  setRefreshState(currentSection, true);
  try {
    await loadState();
    if (appState.isAuthenticated && appState.currentUser) {
      const activeUser = appState.users.find((user) => user.id === appState.currentUser.id);
      appState.currentUser = activeUser || appState.currentUser;
      updateAuthView();
      ensureAuthVisibility();
      setSection(currentSection);
      renderAppContent();
      showRefreshMessage(currentSection, 'Données rechargées avec succès.', false);
    } else {
      showPublicScreen();
      showRefreshMessage(currentSection, 'Vous devez être connecté pour rafraîchir.', true);
    }
  } catch (error) {
    console.error('Erreur de rafraîchissement de la section', error);
    showRefreshMessage(currentSection, 'Impossible de recharger les données.', true);
  } finally {
    setTimeout(() => setRefreshState(currentSection, false), 400);
  }
}

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

function getUserByEmail(email) {
  return appState.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

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

function setSection(section) {
  // Prevent access to sensitive sections for unauthorized roles
  const permission = appState.currentUser ? getPermission(appState.currentUser.role) : { canManageUsers: false };
  let target = section;
  if ((section === 'journal' || section === 'users') && !permission.canManageUsers) {
    target = 'dashboard';
  }
  appState.activeSection = target;
  elements.sectionTitle.textContent = target === 'dashboard' ? 'Tableau de bord' : document.querySelector(`[data-section="${target}"]`).textContent;
  elements.navLinks.forEach((button) => {
    button.classList.toggle('active', button.dataset.section === target);
  });
  Object.entries(elements.sections).forEach(([key, el]) => {
    el.classList.toggle('active', key === target);
    el.classList.toggle('hidden', key !== target);
  });
}

function showLoginView() {
  elements.loginScreen.classList.remove('hidden');
  elements.registerScreen.classList.add('hidden');
}

function showRegisterView() {
  elements.loginScreen.classList.add('hidden');
  elements.registerScreen.classList.remove('hidden');
}

function updateAuthView() {
  const isAuthenticated = Boolean(appState.isAuthenticated && appState.currentUser);
  document.body.classList.toggle('dashboard-view', isAuthenticated);
  document.body.classList.toggle('login-view', !isAuthenticated);
  if (isAuthenticated) {
    elements.publicView.classList.add('hidden');
    elements.appShell.classList.remove('hidden');
  } else {
    elements.publicView.classList.remove('hidden');
    elements.appShell.classList.add('hidden');
  }
}

function showPublicScreen() {
  appState.isAuthenticated = false;
  updateAuthView();
  showLoginView();
}

function showAppScreen() {
  updateAuthView();
  setSection(appState.activeSection);
}

function renderDashboard() {
  refreshRecordPaymentStatuses(true);
  const openJudicial = appState.judicialRecords.filter((record) => !record.archived).length;
  const archivedJudicial = appState.judicialRecords.filter((record) => record.archived).length;
  const openCertifications = appState.certifications.filter((record) => !record.archived).length;
  const archivedCertifications = appState.certifications.filter((record) => record.archived).length;
  const totalFines = appState.judicialRecords.reduce((sum, record) => sum + Number(record.fineAmount || 0), 0);
  const totalTreasury = appState.receipts
    .filter((receipt) => receipt.cancelled !== true)
    .reduce((sum, receipt) => sum + Number(receipt.treasuryAmount || 0), 0);
  const totalChancellery = appState.receipts
    .filter((receipt) => receipt.cancelled !== true)
    .reduce((sum, receipt) => sum + Number(receipt.chancelleryAmount || 0), 0);
  const totalCertificationsAmount = appState.certifications.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const totalDue = [
    ...appState.judicialRecords,
    ...appState.certifications,
  ].reduce((sum, record) => sum + getRecordRemainingAmount(record), 0);
  // Transfer / pending computation
  const validReceipts = appState.receipts.filter((r) => r.cancelled !== true);
  const totalTransferredTreasury = validReceipts.reduce((sum, r) => sum + (r.treasuryTransferred ? Number(r.treasuryAmount || 0) : 0), 0);
  const totalTransferredChancellery = validReceipts.reduce((sum, r) => sum + (r.chancelleryTransferred ? Number(r.chancelleryAmount || 0) : 0), 0);
  const totalPendingTreasury = validReceipts.reduce((sum, r) => sum + ((r.treasuryTransferred) ? 0 : Number(r.treasuryAmount || 0)), 0);
  const totalPendingChancellery = validReceipts.reduce((sum, r) => sum + ((r.chancelleryTransferred) ? 0 : Number(r.chancelleryAmount || 0)), 0);
  const totalPending = totalPendingTreasury + totalPendingChancellery;
  elements.cardOpenJudicial.textContent = openJudicial;
  elements.cardArchivedJudicial.textContent = archivedJudicial;
  elements.cardOpenCertifications.textContent = openCertifications;
  elements.cardArchivedCertifications.textContent = archivedCertifications;
  elements.cardTotalDue.textContent = formatMoney(totalDue);
  elements.cardTotalCertifications.textContent = formatMoney(totalCertificationsAmount);
  elements.cardTotalFines.textContent = formatMoney(totalFines);
  elements.cardTotalTreasury.textContent = formatMoney(totalTransferredTreasury);
  elements.cardTotalChancellery.textContent = formatMoney(totalTransferredChancellery);
  if (elements.cardPendingTotal) elements.cardPendingTotal.textContent = formatMoney(totalPending);
  if (elements.cardPendingTreasury) elements.cardPendingTreasury.textContent = formatMoney(totalPendingTreasury);
  if (elements.cardPendingChancellery) elements.cardPendingChancellery.textContent = formatMoney(totalPendingChancellery);
  const latest = [...appState.judicialRecords, ...appState.certifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  elements.dashboardLatestList.innerHTML = latest.map((item) => {
    const subject = item.type === 'Judiciaire' ? item.suspect : item.candidateName;
    const amount = item.type === 'Judiciaire' ? item.fineAmount : item.amount;
    return `
      <tr>
        <td>${item.reference}</td>
        <td>${item.type}</td>
        <td>${subject}</td>
        <td>${formatDate(item.createdAt)}</td>
        <td>${item.archived ? 'Archivé' : 'Actif'}</td>
        <td>${formatMoney(amount)}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6">Aucun dossier récent.</td></tr>';
  const statusCounts = {
    'Non commencée': 0,
    'En cours d’exécution': 0,
    'Exécutée': 0,
    'Suspendue': 0,
    'Annulée': 0,
  };
  appState.judicialRecords.forEach((record) => {
    if (record.sentenceStatus in statusCounts) {
      statusCounts[record.sentenceStatus] += 1;
    }
  });
  elements.statusNotStarted.textContent = statusCounts['Non commencée'];
  elements.statusInProgress.textContent = statusCounts['En cours d’exécution'];
  elements.statusCompleted.textContent = statusCounts['Exécutée'];
  elements.statusSuspended.textContent = statusCounts['Suspendue'];
  elements.statusCancelled.textContent = statusCounts['Annulée'];
  const remaining = appState.judicialRecords.filter((record) => ['Non commencée', 'En cours d’exécution', 'Suspendue'].includes(record.sentenceStatus)).length;
  elements.statusRemaining.textContent = remaining;
}

function getRecordReceipts(record) {
  return appState.receipts.filter((receipt) => {
    if (receipt.cancelled === true) return false;
    if (receipt.type !== record.type) return false;
    if (receipt.recordId && receipt.recordId === record.id) return true;
    return receipt.reference === record.reference;
  });
}

function getRecordRemainingAmount(record) {
  if (!record) return 0;
  const amount = Number(record.type === 'Judiciaire' ? record.fineAmount || 0 : record.amount || 0);
  const paid = getRecordReceipts(record).reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
  const remaining = Math.max(0, amount - paid);
  if (record.type === 'Judiciaire' && record.fineStatus === 'Annulée') return 0;
  if (record.type === 'Certification' && record.paymentStatus === 'Annulée') return 0;
  return remaining;
}

function refreshRecordPaymentStatuses(saveChanges = false) {
  let hasChanged = false;

  appState.judicialRecords.forEach((record) => {
    if (record.fineStatus === 'Annulée') return;
    const remaining = getRecordRemainingAmount(record);
    const newStatus = remaining === 0
      ? 'Réglée'
      : getRecordReceipts(record).length > 0
        ? 'Partiellement réglée'
        : 'Non réglée';
    if (record.fineStatus !== newStatus) {
      record.fineStatus = newStatus;
      hasChanged = true;
    }
  });

  appState.certifications.forEach((record) => {
    if (record.paymentStatus === 'Annulée') return;
    const remaining = getRecordRemainingAmount(record);
    const newStatus = remaining === 0
      ? 'Réglée'
      : getRecordReceipts(record).length > 0
        ? 'Partiellement réglée'
        : 'Non réglée';
    if (record.paymentStatus !== newStatus) {
      record.paymentStatus = newStatus;
      hasChanged = true;
    }
  });

  if (saveChanges && hasChanged) {
    saveState();
  }
}

function renderJudicialList() {
  const query = elements.judicialSearch.value.trim().toLowerCase();
  const statusFilter = elements.judicialStatusFilter.value;
  const fineStatusFilter = elements.judicialFineStatusFilter.value;
  const showArchived = elements.judicialShowArchived.checked;
  const permission = getPermission(appState.currentUser.role);
  const list = appState.judicialRecords.filter((record) => {
    if (!showArchived && record.archived) return false;
    if (showArchived === false && record.archived) return false;
    if (query) {
      const text = `${record.reference} ${record.suspect} ${record.magistrate} ${record.qualification}`.toLowerCase();
      if (!text.includes(query)) return false;
    }
    if (statusFilter !== 'all' && statusFilter !== 'none' && record.sentenceStatus !== statusFilter) return false;
    if (statusFilter === 'none' && record.sentenceStatus !== 'Aucune' && record.sentenceStatus !== '') return false;
    if (fineStatusFilter !== 'all' && record.fineStatus !== fineStatusFilter) return false;
    return true;
  });
  
  
  
  elements.judicialList.innerHTML = list.map((record) => {
    const actions = [];
    if (!record.archived && permission.canEditJudicial) {
      actions.push(`<button class="action-btn primary" data-action="edit-judicial" data-id="${record.id}">Modifier</button>`);
    }
    if (!record.archived && permission.canArchiveJudicial) {
      actions.push(`<button class="action-btn danger" data-action="archive-judicial" data-id="${record.id}">Archiver</button>`);
    }
    if (permission.canArchiveJudicial) {
      actions.push(`<button class="action-btn danger" data-action="delete-judicial" data-id="${record.id}">Supprimer</button>`);
    }
    if (record.archived && permission.canArchiveJudicial) {
      actions.push(`<button class="action-btn primary" data-action="restore-judicial" data-id="${record.id}">Restaurer</button>`);
    }
    
    const discordLink = record.judgmentLink ? `<a href="${record.judgmentLink}" target="_blank" class="discord-link-btn" title="Ouvrir le lien Discord">🔗</a>` : '—';
    
    return `
      <tr>
        <td>${record.reference}</td>
        <td>${record.suspect}</td>
        <td>${record.magistrate}</td>
        <td>${record.qualification}</td>
        <td>${formatMoney(record.fineAmount)}</td>
        <td>${formatMoney(record.treasuryAmount)}</td>
        <td>${formatMoney(record.chancelleryAmount)}</td>
        <td>${record.sentence || 'Aucune'}</td>
        <td class="status-cell ${getSentenceStatusColor(record.sentenceStatus)}">${record.sentenceStatus}</td>
        <td class="status-cell ${getFineStatusColor(record.fineStatus)}">${record.fineStatus}</td>
        <td class="discord-cell">${discordLink}</td>
        <td class="table-actions">${actions.join('')}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="12">Aucun dossier à afficher.</td></tr>';
}

function renderCertificationList() {
  const query = elements.certificationSearch.value.trim().toLowerCase();
  const statusFilter = elements.certificationStatusFilter.value;
  const showArchived = elements.certificationShowArchived.checked;
  const permission = getPermission(appState.currentUser.role);
  const list = appState.certifications.filter((record) => {
    if (!showArchived && record.archived) return false;
    if (query) {
      const text = `${record.reference} ${record.candidateName} ${record.instructor}`.toLowerCase();
      if (!text.includes(query)) return false;
    }
    if (statusFilter !== 'all' && record.paymentStatus !== statusFilter) return false;
    return true;
  });
  elements.certificationList.innerHTML = list.map((record) => {
    const actions = [];
    if (!record.archived && permission.canEditCertification) {
      actions.push(`<button class="action-btn primary" data-action="edit-certification" data-id="${record.id}">Modifier</button>`);
    }
    if (!record.archived && permission.canArchiveJudicial) {
      actions.push(`<button class="action-btn danger" data-action="archive-certification" data-id="${record.id}">Archiver</button>`);
    }
    if (!record.archived && permission.canArchiveJudicial) {
      actions.push(`<button class="action-btn danger" data-action="delete-certification" data-id="${record.id}">Supprimer</button>`);
    }
    if (record.archived && permission.canArchiveJudicial) {
      actions.push(`<button class="action-btn primary" data-action="restore-certification" data-id="${record.id}">Restaurer</button>`);
    }
    return `
      <tr>
        <td>${record.reference}</td>
        <td>${record.candidateName}</td>
        <td>${record.instructor}</td>
        <td>${formatDate(record.trainingDate)}</td>
        <td>${record.trainingType}</td>
        <td>${formatMoney(record.amount)}</td>
        <td>${formatMoney(record.treasuryAmount)}</td>
        <td>${formatMoney(record.chancelleryAmount)}</td>
        <td class="status-cell ${getPaymentStatusColor(record.paymentStatus)}">${record.paymentStatus}</td>
        <td class="table-actions">${actions.join('')}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="10">Aucune demande à afficher.</td></tr>';
}

function renderReceiptTable() {
  const validReceipts = appState.receipts.filter((item) => item.cancelled !== true);
  const totalReceived = validReceipts.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalTransferredTreasury = validReceipts.reduce((sum, item) => sum + (item.treasuryTransferred ? Number(item.treasuryAmount || 0) : 0), 0);
  const totalTransferredChancellery = validReceipts.reduce((sum, item) => sum + (item.chancelleryTransferred ? Number(item.chancelleryAmount || 0) : 0), 0);
  const totalPendingTreasury = validReceipts.reduce((sum, item) => sum + ((item.treasuryTransferred) ? 0 : Number(item.treasuryAmount || 0)), 0);
  const totalPendingChancellery = validReceipts.reduce((sum, item) => sum + ((item.chancelleryTransferred) ? 0 : Number(item.chancelleryAmount || 0)), 0);
  elements.cardTotalReceived.textContent = formatMoney(totalReceived);
  elements.cardReceivedTreasury.textContent = formatMoney(totalTransferredTreasury);
  elements.cardReceivedChancellery.textContent = formatMoney(totalTransferredChancellery);
  const permission = getPermission(appState.currentUser?.role || '');
  elements.receiptList.innerHTML = validReceipts.map((receipt) => {
    const treasuryPercent = receipt.treasuryPercent ?? appState.settings.certificationTreasuryPercentage;
    const chancelleryPercent = receipt.chancelleryPercent ?? (100 - treasuryPercent);
    const allocation = receipt.allocation || `${treasuryPercent}% Trésor / ${chancelleryPercent}% Chancellerie`;
    const treasuryAmount = Number(receipt.treasuryAmount ?? Math.round((receipt.amount || 0) * treasuryPercent / 100));
    const chancelleryAmount = Number(receipt.chancelleryAmount ?? ((receipt.amount || 0) - treasuryAmount));
    const treasuryTransferred = Boolean(receipt.treasuryTransferred);
    const chancelleryTransferred = Boolean(receipt.chancelleryTransferred);
    const actions = [];
    if (permission.canModifyReceipt) {
      actions.push(`<button class="action-btn primary" data-action="edit-receipt" data-id="${receipt.id}">Modifier</button>`);
      actions.push(`<button class="action-btn danger" data-action="delete-receipt" data-id="${receipt.id}">Supprimer</button>`);
    }
    return `
      <tr>
        <td>${formatDate(receipt.date)}</td>
        <td>${receipt.dossierTitle}</td>
        <td>${receipt.reference}</td>
        <td>${receipt.type}</td>
        <td>${formatMoney(receipt.amount)}</td>
        <td>${allocation}</td>
        <td>
          <div class="transfer-cell">
            <div class="transfer-status ${treasuryTransferred ? 'status-green' : 'status-red'}">${treasuryTransferred ? 'Transférée' : 'Non transférée'}</div>
            <div class="transfer-amount ${treasuryTransferred ? 'status-green' : 'status-red'}">${formatMoney(treasuryAmount)}</div>
            <label class="checkbox-label"><input type="checkbox" data-action="toggle-transfer-treasury" data-id="${receipt.id}" ${treasuryTransferred ? 'checked' : ''}/> Transféré</label>
          </div>
        </td>
        <td>
          <div class="transfer-cell">
            <div class="transfer-status ${chancelleryTransferred ? 'status-green' : 'status-red'}">${chancelleryTransferred ? 'Transférée' : 'Non transférée'}</div>
            <div class="transfer-amount ${chancelleryTransferred ? 'status-green' : 'status-red'}">${formatMoney(chancelleryAmount)}</div>
            <label class="checkbox-label"><input type="checkbox" data-action="toggle-transfer-chancellery" data-id="${receipt.id}" ${chancelleryTransferred ? 'checked' : ''}/> Transféré</label>
          </div>
        </td>
        <td>${receipt.method}</td>
        <td>${receipt.recordedBy}${receipt.collectorName ? ` — Collecté par: ${receipt.collectorName}` : ''}</td>
        <td class="table-actions">${actions.join('')}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="11">Aucune recette enregistrée.</td></tr>';
}

function renderReceiptOptions() {
  return [
    ...appState.judicialRecords.map((record) => ({ type: 'Judiciaire', id: record.id, title: `${record.suspect}${record.archived ? ' (archivé)' : ''}`, reference: record.reference })),
    ...appState.certifications.map((record) => ({ type: 'Certification', id: record.id, title: `${record.candidateName}${record.archived ? ' (archivé)' : ''}`, reference: record.reference })),
  ];
}

function showReceiptModal() {
  const permission = getPermission(appState.currentUser.role);
  if (!permission.canRecordReceipt) return;
  const dossiers = renderReceiptOptions();
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-card">
      <h3>Créer une nouvelle recette</h3>
      <form id="receipt-modal-form">
        <label>Rechercher un dossier<label class="input-label"><input type="search" id="receipt-modal-search" placeholder="Rechercher un dossier..." /></label></label>
        <label>Dossier concerné<label class="input-label">
          <select id="receipt-modal-dossier" name="dossier" required>
            ${dossiers.map((item) => `<option value="${item.type}|${item.id}|${item.reference}|${item.title}">${item.type} — ${item.reference} — ${item.title}</option>`).join('')}
          </select>
        </label></label>
        <label>Type de dossier<label class="input-label">
          <select id="receipt-modal-type" disabled>
            <option value="Judiciaire">Judiciaire</option>
            <option value="Certification">Certification</option>
          </select>
        </label></label>
        <label>Montant reçu<label class="input-label"><input type="number" name="amount" min="0" step="1" value="0" required /></label></label>
          <label>Nom du collecteur des septims<label class="input-label"><input type="text" name="collectorName" placeholder="Nom et prénom" required /></label></label>
        <div class="receipt-summary">
          <div class="summary-line"><span>Pourcentage Trésor impérial</span><strong id="receipt-modal-treasury-percent">0%</strong></div>
          <div class="summary-line"><span>Pourcentage Chancellerie</span><strong id="receipt-modal-chancellery-percent">0%</strong></div>
          <div class="summary-line"><span>Montant reversé au Trésor</span><strong id="receipt-modal-treasury-amount">0 Septims</strong></div>
          <div class="summary-line"><span>Montant conservé par la Chancellerie</span><strong id="receipt-modal-chancellery-amount">0 Septims</strong></div>
        </div>
        <label>Date de réception<label class="input-label"><input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required /></label></label>
        <label>Moyen de paiement<label class="input-label">
          <select name="method" required>
            <option value="Espèces">Espèces</option>
            <option value="Virement bancaire">Virement bancaire</option>
          </select>
        </label></label>
        <div class="form-actions">
          <button type="submit" class="primary-btn">Enregistrer la recette</button>
          <button type="button" class="secondary-btn" id="close-receipt-modal">Annuler</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  const form = modal.querySelector('#receipt-modal-form');
  const searchInput = modal.querySelector('#receipt-modal-search');
  const dossierSelect = modal.querySelector('#receipt-modal-dossier');
  const typeSelect = modal.querySelector('#receipt-modal-type');
  const amountInput = modal.querySelector('[name="amount"]');
  const treasuryPercentEl = modal.querySelector('#receipt-modal-treasury-percent');
  const chancelleriePercentEl = modal.querySelector('#receipt-modal-chancellery-percent');
  const treasuryAmountEl = modal.querySelector('#receipt-modal-treasury-amount');
  const chancellerieAmountEl = modal.querySelector('#receipt-modal-chancellery-amount');
  const updateType = () => {
    const value = dossierSelect.value.split('|')[0];
    typeSelect.value = value || 'Judiciaire';
  };
  const computeReceiptSummary = () => {
    const amount = Number(amountInput.value) || 0;
    const type = dossierSelect.value.split('|')[0] || 'Judiciaire';
    const treasuryPercent = type === 'Judiciaire'
      ? appState.settings.judicialTreasuryPercentage
      : appState.settings.certificationTreasuryPercentage;
    const chancelleryPercent = 100 - treasuryPercent;
    const treasuryAmount = Math.round((amount * treasuryPercent) / 100);
    const chancelleryAmount = amount - treasuryAmount;
    treasuryPercentEl.textContent = `${treasuryPercent}%`;
    chancelleriePercentEl.textContent = `${chancelleryPercent}%`;
    treasuryAmountEl.textContent = formatMoney(treasuryAmount);
    chancellerieAmountEl.textContent = formatMoney(chancelleryAmount);
    return { treasuryPercent, chancelleryPercent, treasuryAmount, chancelleryAmount };
  };
  const updateDossierOptions = () => {
    const filter = searchInput.value.trim().toLowerCase();
    dossierSelect.innerHTML = dossiers
      .filter((item) => `${item.type} ${item.reference} ${item.title}`.toLowerCase().includes(filter))
      .map((item) => `<option value="${item.type}|${item.id}|${item.reference}|${item.title}">${item.type} — ${item.reference} — ${item.title}</option>`)
      .join('');
    if (!dossierSelect.value && dossierSelect.options.length > 0) {
      dossierSelect.selectedIndex = 0;
    }
    updateType();
    computeReceiptSummary();
  };
  searchInput.addEventListener('input', updateDossierOptions);
  dossierSelect.addEventListener('change', () => {
    updateType();
    computeReceiptSummary();
  });
  amountInput.addEventListener('input', computeReceiptSummary);
  updateType();
  computeReceiptSummary();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const selected = data.get('dossier') || dossierSelect.value;
    const [type, recordId, reference, title] = selected.split('|');
    const amount = Number(data.get('amount'));
    const summary = computeReceiptSummary();
    if (!selected || !amount || amount < 0) {
      elements.receiptMessage.textContent = 'Veuillez sélectionner un dossier valide et saisir un montant positif.';
      elements.receiptMessage.className = 'form-error';
      elements.receiptMessage.classList.remove('hidden');
      return;
    }
    const collector = (data.get('collectorName') || '').trim();
    if (!collector) {
      elements.receiptMessage.textContent = 'Veuillez indiquer le nom du collecteur.';
      elements.receiptMessage.className = 'form-error';
      elements.receiptMessage.classList.remove('hidden');
      return;
    }

    const receipt = {
      id: crypto.randomUUID(),
      date: data.get('date') || new Date().toISOString().slice(0, 10),
      recordId,
      dossierTitle: title,
      reference,
      type,
      amount,
      allocation: `${summary.treasuryPercent}% Trésor / ${summary.chancelleryPercent}% Chancellerie`,
      treasuryPercent: summary.treasuryPercent,
      chancelleryPercent: summary.chancelleryPercent,
      treasuryAmount: summary.treasuryAmount,
      chancelleryAmount: summary.chancelleryAmount,
      treasuryTransferred: false,
      chancelleryTransferred: false,
      method: data.get('method'),
      recordedBy: appState.currentUser.name,
      collectorName: collector,
    };
    appState.receipts.push(receipt);
    saveState();
    logAction(appState.currentUser.name, 'Enregistrement d’une recette', type, reference, `Recette de ${formatMoney(amount)} enregistrée (${summary.treasuryPercent}% Trésor / ${summary.chancelleryPercent}% Chancellerie).`);
    renderReceiptTable();
    renderDashboard();
    elements.receiptMessage.textContent = 'Recette enregistrée avec succès.';
    elements.receiptMessage.className = 'form-info';
    elements.receiptMessage.classList.remove('hidden');
    modal.remove();
  });
  modal.querySelector('#close-receipt-modal').addEventListener('click', () => modal.remove());
}

function showReceiptForm(id) {
  const permission = getPermission(appState.currentUser.role);
  if (!permission.canModifyReceipt) return;
  const receipt = appState.receipts.find((item) => item.id === id);
  if (!receipt) return;
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-card">
      <h3>Modifier une recette</h3>
      <form id="receipt-edit-form">
        <label>Date<label class="input-label"><input type="date" name="date" value="${receipt.date}" required /></label></label>
        <label>Référence<label class="input-label"><input type="text" name="reference" value="${receipt.reference}" readonly /></label></label>
        <label>Dossier<label class="input-label"><input type="text" name="dossierTitle" value="${receipt.dossierTitle}" readonly /></label></label>
        <label>Type<label class="input-label"><input type="text" name="type" value="${receipt.type}" readonly /></label></label>
        <label>Montant reçu<label class="input-label"><input type="number" name="amount" min="0" value="${receipt.amount}" required /></label></label>
        <label>Nom du collecteur des septims<label class="input-label"><input type="text" name="collectorName" value="${receipt.collectorName || ''}" required /></label></label>
        <label>Moyen de paiement<label class="input-label">
          <select name="method" required>
            <option value="Espèces" ${receipt.method === 'Espèces' ? 'selected' : ''}>Espèces</option>
            <option value="Virement bancaire" ${receipt.method === 'Virement bancaire' ? 'selected' : ''}>Virement bancaire</option>
          </select>
        </label></label>
        <div class="receipt-summary">
          <div class="summary-line"><span>Pourcentage Trésor impérial</span><strong id="receipt-edit-treasury-percent">${receipt.treasuryPercent}%</strong></div>
          <div class="summary-line"><span>Pourcentage Chancellerie</span><strong id="receipt-edit-chancellery-percent">${receipt.chancelleryPercent}%</strong></div>
          <div class="summary-line"><span>Montant reversé au Trésor</span><strong id="receipt-edit-treasury-amount">${formatMoney(receipt.treasuryAmount)}</strong></div>
          <div class="summary-line"><span>Montant conservé par la Chancellerie</span><strong id="receipt-edit-chancellery-amount">${formatMoney(receipt.chancelleryAmount)}</strong></div>
          <div class="summary-line"><label class="checkbox-label"><input type="checkbox" id="receipt-edit-treasury-transferred" ${receipt.treasuryTransferred ? 'checked' : ''}/> Transféré au Trésor</label></div>
          <div class="summary-line"><label class="checkbox-label"><input type="checkbox" id="receipt-edit-chancellery-transferred" ${receipt.chancelleryTransferred ? 'checked' : ''}/> Transféré à la Chancellerie</label></div>
        </div>
        <div class="form-actions">
          <button type="submit" class="primary-btn">Enregistrer les modifications</button>
          <button type="button" class="secondary-btn" id="close-receipt-edit-modal">Annuler</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  const form = modal.querySelector('#receipt-edit-form');
  const amountInput = form.querySelector('[name="amount"]');
  const treasuryPercentEl = form.querySelector('#receipt-edit-treasury-percent');
  const chancelleriePercentEl = form.querySelector('#receipt-edit-chancellery-percent');
  const treasuryAmountEl = form.querySelector('#receipt-edit-treasury-amount');
  const chancellerieAmountEl = form.querySelector('#receipt-edit-chancellery-amount');
  const collectorInput = form.querySelector('[name="collectorName"]');
  const treasuryTransferredInput = form.querySelector('#receipt-edit-treasury-transferred');
  const chancellerieTransferredInput = form.querySelector('#receipt-edit-chancellery-transferred');
  const computeAmounts = () => {
    const amount = Number(amountInput.value) || 0;
    const type = receipt.type || 'Judiciaire';
    const treasuryPercent = type === 'Judiciaire'
      ? appState.settings.judicialTreasuryPercentage
      : appState.settings.certificationTreasuryPercentage;
    const chancelleryPercent = 100 - treasuryPercent;
    const treasuryAmount = Math.round((amount * treasuryPercent) / 100);
    const chancelleryAmount = amount - treasuryAmount;
    treasuryPercentEl.textContent = `${treasuryPercent}%`;
    chancelleriePercentEl.textContent = `${chancelleryPercent}%`;
    treasuryAmountEl.textContent = formatMoney(treasuryAmount);
    chancellerieAmountEl.textContent = formatMoney(chancelleryAmount);
    return { treasuryPercent, chancelleryPercent, treasuryAmount, chancelleryAmount };
  };
  amountInput.addEventListener('input', computeAmounts);
  computeAmounts();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const oldReceipt = { ...receipt };
    const data = new FormData(form);
    const amount = Number(data.get('amount')) || 0;
    const values = computeAmounts();
    receipt.date = data.get('date');
    receipt.amount = amount;
    receipt.method = data.get('method');
    receipt.treasuryPercent = values.treasuryPercent;
    receipt.chancelleryPercent = values.chancelleryPercent;
    receipt.treasuryAmount = values.treasuryAmount;
    receipt.chancelleryAmount = values.chancelleryAmount;
    receipt.collectorName = (data.get('collectorName') || '').trim();
    receipt.treasuryTransferred = treasuryTransferredInput.checked === true;
    receipt.chancelleryTransferred = chancellerieTransferredInput.checked === true;
    if (!receipt.collectorName) {
      alert('Le nom du collecteur est requis.');
      return;
    }
    receipt.allocation = `${values.treasuryPercent}% Trésor / ${values.chancelleryPercent}% Chancellerie`;
    saveState();
    logAction(
      appState.currentUser.name,
      'Modification d’une recette',
      receipt.type,
      receipt.reference,
      `Recette modifiée : montant ${formatMoney(oldReceipt.amount)} → ${formatMoney(receipt.amount)}, méthode ${oldReceipt.method} → ${receipt.method}`
    );
    renderReceiptTable();
    renderDashboard();
    renderJournal();
    modal.remove();
  });
  modal.querySelector('#close-receipt-edit-modal').addEventListener('click', () => modal.remove());
}

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

function renderUsersList() {
  const permission = appState.currentUser ? getPermission(appState.currentUser.role) : { canManageUsers: false };
  if (!permission.canManageUsers) {
    elements.usersList.innerHTML = '<tr><td colspan="8">Accès refusé.</td></tr>';
    return;
  }
  const rows = appState.users.map((user) => {
    const actionButtons = [];
    if (permission.canManageUsers) {
      if (user.status === 'En attente d’habilitation') {
        actionButtons.push(`<button class="action-btn primary" data-action="approve-user" data-id="${user.id}">Approuver</button>`);
        actionButtons.push(`<button class="action-btn danger" data-action="reject-user" data-id="${user.id}">Refuser</button>`);
      }
      if (user.status === 'Habilité') {
        actionButtons.push(`<button class="action-btn danger" data-action="suspend-user" data-id="${user.id}">Suspendre</button>`);
      }
      if (user.status !== 'Habilité' && user.status !== 'Suspendu') {
        actionButtons.push(`<button class="action-btn primary" data-action="reactivate-user" data-id="${user.id}">Réactiver</button>`);
      }
      if (user.status === 'Suspendu') {
        actionButtons.push(`<button class="action-btn primary" data-action="reactivate-user" data-id="${user.id}">Réactiver</button>`);
      }
      // delete user (Chancelier only)
      actionButtons.push(`<button class="action-btn danger" data-action="delete-user" data-id="${user.id}">Supprimer</button>`);
    }
    const roleSelect = permission.canManageUsers ? `
      <select class="role-select" data-id="${user.id}">
        <option value="Chancelier" ${user.role === 'Chancelier' ? 'selected' : ''}>Chancelier</option>
        <option value="Magistrat" ${user.role === 'Magistrat' ? 'selected' : ''}>Magistrat</option>
        <option value="Scribe" ${user.role === 'Scribe' ? 'selected' : ''}>Scribe</option>
        <option value="Trésorier" ${user.role === 'Trésorier' ? 'selected' : ''}>Trésorier</option>
      </select>
    ` : user.role;
    return `
      <tr>
        <td>${user.name || user.id}</td>
        <td>${user.email}</td>
        <td>${roleSelect}</td>
        <td>${user.status}</td>
        <td>${formatAccessRights(user.role)}</td>
        <td>${user.createdAt ? formatDate(user.createdAt) : '-'}</td>
        <td>${user.lastActivity ? formatDate(user.lastActivity) : '-'}</td>
        <td class="table-actions">${actionButtons.join('')}</td>
      </tr>
    `;
  }).join('');
  elements.usersList.innerHTML = rows || '<tr><td colspan="8">Aucun utilisateur enregistré.</td></tr>';
}

function renderJournal() {
  const permission = appState.currentUser ? getPermission(appState.currentUser.role) : { canManageUsers: false };
  if (!permission.canManageUsers) {
    elements.journalList.innerHTML = '<tr><td colspan="7">Accès refusé.</td></tr>';
    return;
  }

  elements.journalList.innerHTML = appState.journal.slice().reverse().map((entry) => `
      <tr>
        <td>${entry.user}</td>
        <td>${formatDate(entry.date)}</td>
        <td>${new Date(entry.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
        <td>${entry.action}</td>
        <td>${entry.type}</td>
        <td>${entry.reference}</td>
        <td>${entry.description}</td>
      </tr>
    `).join('') || '<tr><td colspan="7">Aucune action enregistrée.</td></tr>';
}

function renderSettings() {
  elements.settingJudicialTreasury.value = appState.settings.judicialTreasuryPercentage;
  elements.settingCertificationTreasury.value = appState.settings.certificationTreasuryPercentage;
  elements.settingJudicialDisplay.textContent = `${appState.settings.judicialTreasuryPercentage}% / ${100 - appState.settings.judicialTreasuryPercentage}%`;
  elements.settingCertificationDisplay.textContent = `${appState.settings.certificationTreasuryPercentage}% / ${100 - appState.settings.certificationTreasuryPercentage}%`;
  elements.settingYear.value = appState.settings.referenceYear;
  elements.settingInstitution.value = appState.settings.institution;
  elements.settingCurrency.value = appState.settings.currency;
  const permission = getPermission(appState.currentUser.role);
  elements.settingJudicialTreasury.disabled = !permission.canChangeSettings;
  elements.settingCertificationTreasury.disabled = !permission.canChangeSettings;
  elements.settingYear.disabled = !permission.canChangeSettings;
  elements.settingInstitution.disabled = !permission.canChangeSettings;
  elements.settingCurrency.disabled = !permission.canChangeSettings;
  elements.settingsForm.querySelector('button').disabled = !permission.canChangeSettings;
}

function ensureAuthVisibility() {
  elements.currentUserName.textContent = appState.currentUser.name;
  elements.currentUserRole.textContent = appState.currentUser.role;
  const permission = getPermission(appState.currentUser.role);
  elements.newJudicialButton.style.display = permission.canCreateJudicial ? 'inline-flex' : 'none';
  elements.newCertificationButton.style.display = permission.canCreateCertification ? 'inline-flex' : 'none';
  elements.addReceiptButton.style.display = permission.canRecordReceipt ? 'inline-flex' : 'none';
  // hide sensitive nav links for non-Chancelier
  const journalLink = document.querySelector('[data-section="journal"]');
  const usersLink = document.querySelector('[data-section="users"]');
  if (journalLink) journalLink.style.display = permission.canManageUsers ? 'inline-flex' : 'none';
  if (usersLink) usersLink.style.display = permission.canManageUsers ? 'inline-flex' : 'none';
}

function updateCurrentUserActivity() {
  appState.currentUser.lastActivity = new Date().toISOString();
  const user = appState.users.find((u) => u.id === appState.currentUser.id);
  if (user) user.lastActivity = appState.currentUser.lastActivity;
  saveState();
}

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error) {
    console.error('Erreur de connexion Supabase :', error);
    return 'Adresse électronique ou mot de passe invalide.';
  }

  const user = getUserByEmail(email);

  if (!user) {
    await supabaseClient.auth.signOut({ scope: 'local' });
    return 'Compte trouvé dans Supabase, mais absent des utilisateurs de l’application.';
  }

  if (user.status !== 'Habilité') {
    await supabaseClient.auth.signOut({ scope: 'local' });
    return `Compte ${user.status.toLowerCase()} et inaccessible.`;
  }

  appState.currentUser = {
    ...user,
    authId: data.user.id
  };

  appState.isAuthenticated = true;

  updateCurrentUserActivity();
  await saveState();

  return null;
}

async function handleLogin(event) {
  event.preventDefault();
  const email = authFields.email.value.trim();
  const password = authFields.password.value;
  const error = await login(email, password);
  if (error) {
    elements.loginError.textContent = error;
    elements.loginError.classList.remove('hidden');
    return;
  }
  elements.loginError.classList.add('hidden');
  showAppScreen();
  resetDataFilters();
  ensureAuthVisibility();
  renderDashboard();
  renderJudicialList();
  renderCertificationList();
  renderReceiptOptions();
  renderReceiptTable();
  renderUsersList();
  renderJournal();
  renderSettings();
}

async function handleRegister(event) {
  event.preventDefault();

  const name = authFields.name.value.trim();
  const email = authFields.registerEmail.value.trim();
  const password = authFields.registerPassword.value;

  if (!name || !email || !password) {
    elements.registerMessage.textContent =
      'Tous les champs sont obligatoires.';
    elements.registerMessage.className = 'form-error';
    elements.registerMessage.classList.remove('hidden');
    return;
  }

  if (getUserByEmail(email)) {
    elements.registerMessage.textContent =
      'Cette adresse électronique est déjà utilisée.';
    elements.registerMessage.className = 'form-error';
    elements.registerMessage.classList.remove('hidden');
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'Scribe',
      },
    },
  });

  if (error) {
    console.error('Erreur lors de la création du compte :', error);
    elements.registerMessage.textContent =
      'Impossible de créer le compte : ' + error.message;
    elements.registerMessage.className = 'form-error';
    elements.registerMessage.classList.remove('hidden');
    return;
  }

  const newUser = {
    id: data.user.id,
    name,
    email,
    role: 'Scribe',
    status: 'En attente d’habilitation',
    createdAt: new Date().toISOString(),
    lastActivity: null,
  };

  appState.users.push(newUser);

  logAction(
    'Système',
    'Demande d’habilitation',
    'Utilisateur',
    '',
    `Nouvelle demande de ${name}`
  );

  await saveState();
  renderUsersList();

  elements.registerMessage.textContent =
    'Votre demande est enregistrée. Attendez l’approbation du Chancelier.';
  elements.registerMessage.className = 'form-info';
  elements.registerMessage.classList.remove('hidden');

  authFields.name.value = '';
  authFields.registerEmail.value = '';
  authFields.registerPassword.value = '';
}

function logAction(user, action, type, reference, description) {
  appState.journal.push({ id: crypto.randomUUID(), user, action, type, reference, description, date: new Date().toISOString() });
  saveState();
  if (elements.journalList) renderJournal();
}

function addJudicialRecord(record) {
  appState.judicialRecords.push(record);
  logAction(appState.currentUser.name, 'Création d’un dossier', 'Judiciaire', record.reference, `Dossier créé pour ${record.suspect}`);
  saveState();
}

function addCertification(record) {
  appState.certifications.push(record);
  logAction(appState.currentUser.name, 'Création d’un dossier', 'Certification', record.reference, `Certification créée pour ${record.candidateName}`);
  saveState();
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
    logAction(appState.currentUser.name, 'Archivage d’un dossier', type, record.reference, `Dossier archivé`);
  }
}

function restoreRecord(type, id) {
  const collection = type === 'Judiciaire' ? appState.judicialRecords : appState.certifications;
  const record = collection.find((item) => item.id === id);
  if (record) {
    record.archived = false;
    saveState();
    logAction(appState.currentUser.name, 'Restauration d’un dossier', type, record.reference, `Dossier restauré`);
  }
}

function deleteJudicialRecord(id) {
  const index = appState.judicialRecords.findIndex(
    (item) => item.id === id
  );

  if (index !== -1) {
    const removed = appState.judicialRecords.splice(index, 1)[0];

    // Mise à jour du compteur judiciaire
    appState.counters.judicial = appState.judicialRecords.length;

    logAction(
      appState.currentUser.name,
      'Suppression d’un dossier judiciaire',
      'Judiciaire',
      removed.reference,
      `Dossier judiciaire supprimé : ${removed.suspect}.`
    );

    saveState();
    renderJudicialList();
    renderDashboard();
  }
}

function deleteCertificationRecord(id) {
  const index = appState.certifications.findIndex((item) => item.id === id);
  if (index !== -1) {
    const removed = appState.certifications.splice(index, 1)[0];
    saveState();
    logAction(appState.currentUser.name, 'Suppression d’une demande de certification', 'Certification', removed.reference, `Demande de certification supprimée : ${removed.candidateName}.`);
    renderCertificationList();
    renderDashboard();
  }
}

async function handleTableAction(event) {
  if (!event.target.dataset.action) return;
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (action === 'edit-judicial') {
    showJudicialForm(id);
  }
  if (action === 'edit-receipt') {
    showReceiptForm(id);
  }
  if (action === 'delete-receipt') {
    const confirmed = await showDeletionConfirmation(
      'Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.',
      'Confirmer la suppression',
      'Annuler'
    );
    if (!confirmed) return;
    const index = appState.receipts.findIndex((item) => item.id === id);
    if (index !== -1) {
      const removed = appState.receipts.splice(index, 1)[0];
      saveState();
      logAction(appState.currentUser.name, 'Suppression d’une recette', removed.type, removed.reference, `Recette supprimée : ${formatMoney(removed.amount)}.`);
      renderReceiptTable();
      renderDashboard();
    }
    return;
  }
  if (action === 'archive-judicial') {
    if (!confirm('Confirmez-vous l’archivage de ce dossier judiciaire ?')) return;
    archiveRecord('Judiciaire', id);
    renderJudicialList();
    renderDashboard();
  }
  if (action === 'delete-judicial') {
    const confirmed = await showDeletionConfirmation(
      'Voulez-vous vraiment supprimer ce dossier judiciaire ? Cette action est irréversible.',
      'Supprimer',
      'Annuler'
    );
    if (!confirmed) return;
    deleteJudicialRecord(id);
    return;
  }

  if (action === 'delete-certification') {
    const confirmed = await showDeletionConfirmation(
      'Voulez-vous vraiment supprimer cette demande de certification ? Cette action est irréversible.',
      'Supprimer',
      'Annuler'
    );
    if (!confirmed) return;
    deleteCertificationRecord(id);
    return;
  }
  if (action === 'toggle-transfer-treasury' || action === 'toggle-transfer-chancellery') {
    const receipt = appState.receipts.find((r) => r.id === id);
    if (!receipt) return;
    const isTreasury = action === 'toggle-transfer-treasury';
    const checked = event.target.checked === true;
    if (isTreasury) {
      if (receipt.treasuryTransferred === checked) return;
      receipt.treasuryTransferred = checked;
      logAction(appState.currentUser.name, `Mise à jour transfert Trésor`, 'Recette', receipt.reference, `Transfert Trésor ${checked ? 'confirmé' : 'annulé'} pour ${formatMoney(receipt.treasuryAmount)}`);
    } else {
      if (receipt.chancelleryTransferred === checked) return;
      receipt.chancelleryTransferred = checked;
      logAction(appState.currentUser.name, `Mise à jour transfert Chancellerie`, 'Recette', receipt.reference, `Transfert Chancellerie ${checked ? 'confirmé' : 'annulé'} pour ${formatMoney(receipt.chancelleryAmount)}`);
    }
    saveState();
    renderReceiptTable();
    renderDashboard();
    return;
  }
  if (action === 'restore-judicial') {
    if (!confirm('Confirmez-vous la restauration de ce dossier judiciaire ?')) return;
    restoreRecord('Judiciaire', id);
    renderJudicialList();
    renderDashboard();
  }
  if (action === 'edit-certification') {
    showCertificationForm(id);
  }
  if (action === 'archive-certification') {
    if (!confirm('Confirmez-vous l’archivage de cette demande de certification ?')) return;
    archiveRecord('Certification', id);
    renderCertificationList();
    renderDashboard();
  }
  if (action === 'restore-certification') {
    if (!confirm('Confirmez-vous la restauration de cette demande de certification ?')) return;
    restoreRecord('Certification', id);
    renderCertificationList();
    renderDashboard();
  }
  if (action.startsWith('approve-user')) {
    handleUserAction(id, 'Habilité', 'Validation d’une habilitation', `Compte approuvé`);
  }
  if (action.startsWith('reject-user')) {
    handleUserAction(id, 'Refusé', 'Refus d’une habilitation', `Compte refusé`);
  }
  if (action.startsWith('suspend-user')) {
    handleUserAction(id, 'Suspendu', 'Suspension d’un compte', `Compte suspendu`);
  }
  if (action.startsWith('reactivate-user')) {
    handleUserAction(id, 'Habilité', 'Réactivation d’un compte', `Compte réactivé`);
  }
  if (action === 'delete-user') {
    const confirmed = await showDeletionConfirmation(
      'Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.',
      'Supprimer',
      'Annuler'
    );
    if (!confirmed) return;
    if (id === appState.currentUser.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    deleteUser(id);
    return;
  }
}

function handleUserAction(id, status, action, description) {
  const user = appState.users.find((item) => item.id === id);
  if (!user) return;
  const confirmation = confirm(`Souhaitez-vous vraiment ${action.toLowerCase()} pour ${user.name} ?`);
  if (!confirmation) return;
  user.status = status;
  if (status === 'Habilité') user.lastActivity = new Date().toISOString();
  saveState();
  logAction(appState.currentUser.name, action, 'Utilisateur', '', `${user.name} ${description}`);
  renderUsersList();
}

function deleteUser(id) {
  const index = appState.users.findIndex((u) => u.id === id);
  if (index === -1) return;
  const removed = appState.users.splice(index, 1)[0];
  saveState();
  logAction(appState.currentUser.name, 'Suppression d’un utilisateur', 'Utilisateur', '', `Utilisateur supprimé : ${removed.name}`);
  renderUsersList();
}

function handleRoleChange(event) {
  if (!event.target.classList.contains('role-select')) return;
  const id = event.target.dataset.id;
  const user = appState.users.find((u) => u.id === id);
  if (!user) return;
  user.role = event.target.value;
  saveState();
  logAction(appState.currentUser.name, 'Modification d’un rôle', 'Utilisateur', '', `${user.name} devient ${user.role}`);
}

function setSidebarHidden() {
  if (!appState.currentUser) return;
  ensureAuthVisibility();
}

function handleNavClick(event) {
  const section = event.target.dataset.section;
  if (!section) return;
  setSection(section);
  renderDashboard();
  if (section === 'judicial') renderJudicialList();
  if (section === 'certifications') renderCertificationList();
  if (section === 'payments') renderReceiptTable();
  if (section === 'users') renderUsersList();
  if (section === 'journal') renderJournal();
  if (section === 'settings') renderSettings();
}

function initAuth() {
  elements.showRegister.addEventListener('click', showRegisterView);
  elements.showLogin.addEventListener('click', showLoginView);
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.registerForm.addEventListener('submit', handleRegister);
  elements.logoutButton.addEventListener('click', () => {
    appState.currentUser = null;
    appState.isAuthenticated = false;
    saveState();
    showPublicScreen();
  });
}

function initNav() {
  elements.navLinks.forEach((button) => button.addEventListener('click', handleNavClick));
}

function initTableActions() {
  document.addEventListener('click', handleTableAction);
  document.addEventListener('change', handleRoleChange);
}

function initFilters() {
  elements.judicialSearch.addEventListener('input', renderJudicialList);
  elements.judicialStatusFilter.addEventListener('change', renderJudicialList);
  elements.judicialFineStatusFilter.addEventListener('change', renderJudicialList);
  elements.judicialShowArchived.addEventListener('change', renderJudicialList);
  elements.certificationSearch.addEventListener('input', renderCertificationList);
  elements.certificationStatusFilter.addEventListener('change', renderCertificationList);
  elements.certificationShowArchived.addEventListener('change', renderCertificationList);
}

function resetDataFilters() {
  elements.judicialSearch.value = '';
  elements.judicialStatusFilter.value = 'all';
  elements.judicialFineStatusFilter.value = 'all';
  elements.judicialShowArchived.checked = false;
  elements.certificationSearch.value = '';
  elements.certificationStatusFilter.value = 'all';
  elements.certificationShowArchived.checked = false;
}

function initForms() {
  elements.addReceiptButton.addEventListener('click', showReceiptModal);
  elements.refreshJudicialButton?.addEventListener('click', () => refreshSection('judicial'));
  elements.refreshCertificationButton?.addEventListener('click', () => refreshSection('certifications'));
  elements.refreshPaymentsButton?.addEventListener('click', () => refreshSection('payments'));
  elements.refreshUsersButton?.addEventListener('click', () => refreshSection('users'));
  elements.refreshJournalButton?.addEventListener('click', () => refreshSection('journal'));
  elements.newJudicialButton.addEventListener('click', () => showJudicialForm());
  elements.newCertificationButton.addEventListener('click', () => showCertificationForm());
  elements.refreshDashboardButton?.addEventListener('click', () => refreshSection('dashboard'));
  const updateJudicialDisplay = () => {
    const value = Number(elements.settingJudicialTreasury.value);
    elements.settingJudicialDisplay.textContent = `${value}% / ${100 - value}%`;
  };
  const updateCertificationDisplay = () => {
    const value = Number(elements.settingCertificationTreasury.value);
    elements.settingCertificationDisplay.textContent = `${value}% / ${100 - value}%`;
  };
  elements.settingJudicialTreasury.addEventListener('input', updateJudicialDisplay);
  elements.settingCertificationTreasury.addEventListener('input', updateCertificationDisplay);
  updateJudicialDisplay();
  updateCertificationDisplay();
  elements.settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const permission = getPermission(appState.currentUser.role);
    if (!permission.canChangeSettings) return;
    const judicial = Number(elements.settingJudicialTreasury.value);
    const certification = Number(elements.settingCertificationTreasury.value);
    appState.settings.judicialTreasuryPercentage = judicial;
    appState.settings.certificationTreasuryPercentage = certification;
    appState.settings.referenceYear = elements.settingYear.value;
    appState.settings.institution = elements.settingInstitution.value;
    appState.settings.currency = elements.settingCurrency.value;
    saveState();
    logAction(appState.currentUser.name, 'Modification du paramétrage', 'Paramétrage', '', `Répartition judiciaire ${judicial}% Trésor / ${100 - judicial}% Chancellerie ; certification ${certification}% Trésor / ${100 - certification}% Chancellerie.`);
    renderSettings();
  });
}

function getNextJudicialReference() {
  appState.counters.judicial += 1;
  saveState();
  return `CH-${new Date().getFullYear()}-T-${String(appState.counters.judicial).padStart(4, '0')}`;
}

function getNextCertificationReference() {
  appState.counters.certification += 1;
  saveState();
  return `C-${new Date().getFullYear()}-${String(appState.counters.certification).padStart(4, '0')}`;
}

function showJudicialForm(id) {
  const permission = getPermission(appState.currentUser.role);
  if (!permission.canEditJudicial) return;
  const record = appState.judicialRecords.find((item) => item.id === id);
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-card">
      <h3>${record ? 'Modifier un dossier judiciaire' : 'Nouveau dossier judiciaire'}</h3>
      <form id="judicial-form">
        <label>Nom du prévenu<label class="input-label"><input type="text" name="suspect" value="${record ? record.suspect : ''}" required /></label></label>
        <label>Magistrat responsable<label class="input-label"><input type="text" name="magistrate" value="${record ? record.magistrate : ''}" required /></label></label>
        <label>Date du jugement<label class="input-label"><input type="date" name="judgmentDate" value="${record ? record.judgmentDate : new Date().toISOString().slice(0, 10)}" required /></label></label>
        <label>Qualification juridique<label class="input-label"><input type="text" name="qualification" value="${record ? record.qualification : ''}" required /></label></label>
        <label>Montant de l’amende<label class="input-label"><input type="number" name="fineAmount" min="0" value="${record ? record.fineAmount : 0}" required /></label></label>
        <label>Peine en nature<label class="input-label"><input type="text" name="sentence" value="${record ? record.sentence : ''}" /></label></label>
        <label>Statut de la peine en nature<label class="input-label">
          <select name="sentenceStatus" required>
            ${['Aucune','Non commencée','En cours d’exécution','Exécutée','Suspendue','Annulée'].map((status) => `<option value="${status}" ${record && record.sentenceStatus === status ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
        </label></label>
        <label>Lien vers la motivation du jugement — Discord<label class="input-label"><input type="url" name="judgmentLink" value="${record ? record.judgmentLink : ''}" /></label></label>
        <label>Statut de l’amende<label class="input-label">
          <select name="fineStatus" required>
            ${['Non réglée','Partiellement réglée','Réglée','Annulée'].map((status) => `<option value="${status}" ${record && record.fineStatus === status ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
        </label></label>
        <label>Observations<label class="input-label"><textarea name="notes">${record ? record.notes : ''}</textarea></label></label>
        <div class="form-actions">
          <button type="submit" class="primary-btn">${record ? 'Enregistrer les modifications' : 'Inscrire au registre'}</button>
          <button type="button" class="secondary-btn" id="close-judicial-modal">Annuler</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  const form = modal.querySelector('#judicial-form');
  const fineInput = form.querySelector('[name="fineAmount"]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      suspect: data.get('suspect').trim(),
      magistrate: data.get('magistrate').trim(),
      judgmentDate: data.get('judgmentDate'),
      qualification: data.get('qualification').trim(),
      fineAmount: Number(data.get('fineAmount')),
      sentence: data.get('sentence').trim(),
      sentenceStatus: data.get('sentenceStatus'),
      judgmentReference: record ? record.judgmentReference : '',
      judgmentLink: data.get('judgmentLink').trim(),
      fineStatus: data.get('fineStatus'),
      notes: data.get('notes').trim(),
    };
    if (!payload.suspect || !payload.magistrate || !payload.qualification) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (record) {
      updateRecord('Judiciaire', record.id, payload);
    } else {
      const newRecord = {
        id: crypto.randomUUID(),
        reference: getNextJudicialReference(),
        ...payload,
        archived: false,
        createdAt: new Date().toISOString(),
        type: 'Judiciaire',
      };
      addJudicialRecord(newRecord);
    }
    modal.remove();
    renderJudicialList();
    renderDashboard();
    renderReceiptOptions();
  });
  modal.querySelector('#close-judicial-modal').addEventListener('click', () => modal.remove());
}

function showCertificationForm(id) {
  const permission = getPermission(appState.currentUser.role);
  if (!permission.canEditCertification && !(!id && permission.canCreateCertification)) return;
  const record = appState.certifications.find((item) => item.id === id);
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-card">
      <h3>${record ? 'Modifier une demande de certification' : 'Nouvelle demande de certification'}</h3>
      <form id="certification-form">
        <label>Nom du candidat<label class="input-label"><input type="text" name="candidateName" value="${record ? record.candidateName : ''}" required /></label></label>
        <label>Professeur<label class="input-label"><input type="text" name="instructor" value="${record ? record.instructor : ''}" required /></label></label>
        <label>Date de formation<label class="input-label"><input type="date" name="trainingDate" value="${record ? record.trainingDate : new Date().toISOString().slice(0, 10)}" required /></label></label>
        <label>Type de formation<label class="input-label">
          <select name="trainingType" required>
            ${['Avocati','Magistrat','Garde'].map((type) => `<option value="${type}" ${record && record.trainingType === type ? 'selected' : ''}>${type}</option>`).join('')}
          </select>
        </label></label>
        <label>Montant de la certification<label class="input-label"><input type="number" name="amount" min="0" value="${record ? record.amount : 0}" required /></label></label>
        <label>Statut du paiement<label class="input-label">
          <select name="paymentStatus" required>
            ${['Non réglée','Partiellement réglée','Réglée','Annulée'].map((status) => `<option value="${status}" ${record && record.paymentStatus === status ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
        </label></label>
        <label>Observations<label class="input-label"><textarea name="notes">${record ? record.notes : ''}</textarea></label></label>
        <div class="form-actions">
          <button type="submit" class="primary-btn">${record ? 'Enregistrer les modifications' : 'Inscrire la certification au registre'}</button>
          <button type="button" class="secondary-btn" id="close-certification-modal">Annuler</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  const form = modal.querySelector('#certification-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      candidateName: data.get('candidateName').trim(),
      instructor: data.get('instructor').trim(),
      trainingDate: data.get('trainingDate'),
      trainingType: data.get('trainingType'),
      amount: Number(data.get('amount')),
      paymentStatus: data.get('paymentStatus'),
      notes: data.get('notes').trim(),
    };
    if (!payload.candidateName || !payload.instructor || !payload.trainingType) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (record) {
      updateRecord('Certification', record.id, payload);
    } else {
      const newRecord = {
        id: crypto.randomUUID(),
        reference: getNextCertificationReference(),
        ...payload,
        archived: false,
        createdAt: new Date().toISOString(),
        type: 'Certification',
      };
      addCertification(newRecord);
    }
    modal.remove();
    renderCertificationList();
    renderDashboard();
    renderReceiptOptions();
  });
  modal.querySelector('#close-certification-modal').addEventListener('click', () => modal.remove());
}

function mountApp() {
  // NOTE: state is already loaded by the caller (see DOMContentLoaded below)
  // before mountApp() runs — calling loadState() again here created a race
  // condition where a second, unawaited Supabase read could silently
  // overwrite in-memory state after the UI had already rendered.
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
    renderJournal();
    renderSettings();
  } else {
    appState.currentUser = null;
    appState.isAuthenticated = false;
    showPublicScreen();
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Charge d'abord les données sauvegardées
    await loadState();

    // Puis initialise l'application
    await mountApp();
  } catch (error) {
    console.error('Erreur lors du démarrage de l’application :', error);
  }
});

async function testSupabase() {
  const { data, error } = await supabaseClient
    .from('app_settings')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Erreur Supabase :', error);
  } else {
    console.log('Connexion Supabase réussie :', data);
  }
}

testSupabase();