/* ═══════════════════════════════════════════════
   NexaCRM — Frontend App (Node.js + SQLite Ready)
   API Base: http://localhost:8080/api
   ═══════════════════════════════════════════════ */

const API_BASE = 'http://localhost:8080/api';
const COLLEGE_PORTAL_BASE = 'https://college.roririsoft.com/';
let TOKEN = sessionStorage.getItem('nexacrm_token') || '';
let collegeDashboardData = null;
let collegeActiveTab = 'iv';

/* ════════════════════════════════
   API HELPER
   ════════════════════════════════ */
async function api(method, endpoint, body = null, isFormData = false) {
  const headers = { Authorization: `Bearer ${TOKEN}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') return null; // backend offline
    throw err;
  }
}

/* ════════════════════════════════
   DEMO DATA (used when backend offline)
   ════════════════════════════════ */
let demoClients = [
  { id:1, name:'Mrs Agnes Daniel',     email:'school@kingsschools.in', phone:'+91 8220020084', company_name:'Kings School',           project_name:'', project_status:'Completed', quotation_amount:0, paid_amount:0, payment_status:'Paid', created_at:'2025-01-15', client_username:'Mrs Agnes Daniel',     client_password:'Mrs Agnes Daniel123'     },
  { id:2, name:'Mr Kannan Nambirajan', email:'',                       phone:'+91 9585500181', company_name:'SRI KANNAN ENTERPRISES', project_name:'', project_status:'Completed', quotation_amount:0, paid_amount:0, payment_status:'Paid', created_at:'2025-02-01', client_username:'Mr Kannan Nambirajan', client_password:'Mr Kannan Nambirajan123' },
  { id:3, name:'Mr client',            email:'client@example.com',      phone:'+91 9999999999', company_name:'',                       project_name:'', project_status:'Pending',   quotation_amount:0, paid_amount:0, payment_status:'Due',  created_at:'2025-02-18', client_username:'Mr client',            client_password:'Mr client123'            },
  { id:4, name:'RKS Chamber',          email:'',                       phone:'',                company_name:'RKS Chamber',           project_name:'', project_status:'Pending',   quotation_amount:0, paid_amount:0, payment_status:'Due',  created_at:'2025-03-05', client_username:'RKS Chamber',          client_password:'RKS Chamber123'          },
  { id:5, name:'New',                  email:'new@roriri.com',         phone:'',                company_name:'New',                   project_name:'', project_status:'Pending',   quotation_amount:0, paid_amount:0, payment_status:'Due',  created_at:'2025-03-20', client_username:'New',                  client_password:'New123'                  },
];
demoClients = demoClients.map(c => ({ ...c, client_username: c.name, client_password: `${c.name}123` }));
let demoNotes = [
  { id:1, client_id:1, client_name:'Arjun Sharma',  company_name:'TechCorp India',       text:'Client prefers weekly status updates. Follow up on payment by end of month.', created_at:'2025-01-22' },
  { id:2, client_id:2, client_name:'Priya Nair',    company_name:'StartupIO',            text:'Initial discovery call done. Awaiting signed agreement. Budget is flexible.', created_at:'2025-02-03' },
  { id:3, client_id:3, client_name:'Ravi Kumar',    company_name:'Enterprise Solutions', text:'Project delivered successfully. Client is very satisfied. Ask for referral.',  created_at:'2025-03-01' },
];
let demoDocs = [
  { id:1, client_id:1, client_name:'Arjun Sharma', company_name:'TechCorp India',       title:'PRD v1.0 - E-Commerce', file_name:'prd_ecommerce_v1.pdf',  file_type:'application/pdf',  uploaded_at:'2025-01-20' },
  { id:2, client_id:3, client_name:'Ravi Kumar',   company_name:'Enterprise Solutions', title:'ERP Requirements Doc',  file_name:'erp_requirements.docx', file_type:'application/docx', uploaded_at:'2025-02-25' },
];
let demoActivity = [
  { id:1, action:'Client Added',      detail:'Arjun Sharma from TechCorp India',             action_type:'client',  created_at:'2025-01-15 10:30:00' },
  { id:2, action:'File Uploaded',     detail:'"PRD v1.0" uploaded for E-Commerce project',   action_type:'file',    created_at:'2025-01-20 14:00:00' },
  { id:3, action:'Payment Updated',   detail:'₹75,000 received from TechCorp India',         action_type:'payment', created_at:'2025-01-22 11:00:00' },
  { id:4, action:'Client Added',      detail:'Priya Nair from StartupIO',                    action_type:'client',  created_at:'2025-02-01 09:00:00' },
  { id:5, action:'Project Completed', detail:'ERP Integration for Enterprise Solutions',      action_type:'project', created_at:'2025-03-01 17:00:00' },
  { id:6, action:'Payment Received',  detail:'₹3,00,000 fully paid by Enterprise Solutions', action_type:'payment', created_at:'2025-03-02 09:30:00' },
];

/* ════════════════════════════════
   DEMO PROJECTS DATA
   ════════════════════════════════ */
let demoProjects = [
  { id:1, client_id:null, client_name:'', company_name:'', project_name:'Ledger',      project_status:'Completed', budget:null, paid_amount:null, payment_status:'', start_date:'', deadline:'', description:'https://ledger.roririitpark.com' },
  { id:2, client_id:null, client_name:'', company_name:'', project_name:'Kingsschool', project_status:'Completed', budget:null, paid_amount:null, payment_status:'', start_date:'', deadline:'', description:'https://kingsschool.roririsoft.com/landing.php' },
  { id:3, client_id:null, client_name:'', company_name:'', project_name:'Schoolerp',   project_status:'Completed', budget:null, paid_amount:null, payment_status:'', start_date:'', deadline:'', description:'https://schoolerp.roririitpark.com/app/login' },
  { id:4, client_id:null, client_name:'', company_name:'', project_name:'Badminton',   project_status:'Upcoming',  budget:null, paid_amount:null, payment_status:'', start_date:'', deadline:'', description:'' },
];
let demoProjectNextId = 5;

/* ════════════════════════════════
   DEADLINE HELPER
   ════════════════════════════════ */
function calcDeadline(deadlineStr) {
  if (!deadlineStr) return { label: '—', cls: '', days: null };
  const today    = new Date(); today.setHours(0,0,0,0);
  const deadline = new Date(deadlineStr); deadline.setHours(0,0,0,0);
  const days     = Math.round((deadline - today) / 86400000);
  if (days < 0)  return { label: `Overdue ❌`, cls: 'deadline-overdue', days };
  if (days === 0) return { label: `Due Today ⚠️`, cls: 'deadline-today', days };
  if (days <= 3)  return { label: `⏰ ${days}d left`, cls: 'deadline-critical', days };
  if (days <= 7)  return { label: `🟠 ${days}d left`, cls: 'deadline-warning', days };
  return { label: `🟢 ${days}d left`, cls: 'deadline-ok', days };
}

let demoMode   = false;
let demoNextId = 6;
let currentPage      = 'dashboard';
let editingClientId  = null;
let selectedDocFile  = null;
let allClients       = [];

function isClientRole() {
  return sessionStorage.getItem('nexacrm_role') === 'client';
}

function currentClientId() {
  return parseInt(sessionStorage.getItem('nexacrm_clientId') || '0', 10);
}

function clientName() {
  return sessionStorage.getItem('nexacrm_name') || 'Client';
}

function generatedCredentials(name) {
  const cleanName = (name || '').trim();
  return { username: cleanName, password: cleanName ? `${cleanName}123` : '' };
}

function clientScope(items, idField = 'client_id') {
  if (!isClientRole()) return items || [];
  const cid = currentClientId();
  if (!cid) return [];
  return (items || []).filter(item => Number(item[idField]) === cid);
}

/* ════════════════════════════════
   AUTH
   ════════════════════════════════ */
async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl  = document.getElementById('loginError');
  if (!email || !password) { errorEl.textContent = 'Please enter username and password.'; errorEl.classList.remove('hidden'); return; }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      TOKEN = data.token;
      sessionStorage.setItem('nexacrm_token', TOKEN);
      sessionStorage.setItem('nexacrm_role', data.role);
      sessionStorage.setItem('nexacrm_name', data.name);
      if (data.clientId) sessionStorage.setItem('nexacrm_clientId', data.clientId);
      demoMode = false;
      errorEl.classList.add('hidden');
      sessionStorage.setItem('nexacrm_auth', 'true');
      showApp();
    } else {
      const err = await res.json();
      errorEl.textContent = err.message || 'Invalid credentials.';
      errorEl.classList.remove('hidden');
    }
  } catch {
    // Backend offline — demo mode
    if (email === 'admin@gmail.com' && password === 'admin') {
      demoMode = true;
      sessionStorage.setItem('nexacrm_auth', 'demo');
      sessionStorage.setItem('nexacrm_role', 'admin');
      errorEl.classList.add('hidden');
      showApp();
    } else {
      // Demo client role check
      const login = email.toLowerCase();
      const demoClient = demoClients.find(c =>
        (c.client_username || c.name).toLowerCase() === login ||
        c.email.toLowerCase() === login ||
        c.name.toLowerCase() === login
      );
      const expectedPassword = demoClient ? (demoClient.client_password || `${demoClient.name}123`) : '';
      if (demoClient && password === expectedPassword) {
        demoMode = true;
        sessionStorage.setItem('nexacrm_auth', 'demo');
        sessionStorage.setItem('nexacrm_clientId', demoClient.id);
        sessionStorage.setItem('nexacrm_role', 'client');
        sessionStorage.setItem('nexacrm_name', demoClient.name);
        errorEl.classList.add('hidden');
        showApp();
      } else {
        errorEl.textContent = 'Backend offline. Admin: admin@gmail.com / admin';
        errorEl.classList.remove('hidden');
      }
    }
  }
}

/* ════════════════════════════════
   VIEW AS CLIENT (Admin impersonation)
   ════════════════════════════════ */
function isViewingAsClient() {
  return sessionStorage.getItem('nexacrm_viewing_as_client') === 'true';
}

function viewAsClient(clientId, clientName) {
  // Save admin session
  sessionStorage.setItem('nexacrm_admin_token', sessionStorage.getItem('nexacrm_token') || '');
  sessionStorage.setItem('nexacrm_admin_role',  sessionStorage.getItem('nexacrm_role')  || 'admin');
  sessionStorage.setItem('nexacrm_admin_name',  sessionStorage.getItem('nexacrm_name')  || 'Admin');
  sessionStorage.setItem('nexacrm_admin_auth',  sessionStorage.getItem('nexacrm_auth')  || 'demo');
  // Switch to client mode — store clientId as string
  sessionStorage.setItem('nexacrm_viewing_as_client', 'true');
  sessionStorage.setItem('nexacrm_role',     'client');
  sessionStorage.setItem('nexacrm_name',     clientName);
  sessionStorage.setItem('nexacrm_clientId', String(clientId));
  // Reset allClients so stale data is not shown
  allClients = [];
  applyRoleUI();
  updateViewingBanner(clientName);
  navigate('dashboard');
  showToast(`👁 Now viewing as ${clientName}`, 'info');
}

function exitClientView() {
  const adminToken = sessionStorage.getItem('nexacrm_admin_token') || '';
  const adminRole  = sessionStorage.getItem('nexacrm_admin_role')  || 'admin';
  const adminName  = sessionStorage.getItem('nexacrm_admin_name')  || 'Admin';
  const adminAuth  = sessionStorage.getItem('nexacrm_admin_auth')  || 'demo';
  TOKEN = adminToken;
  sessionStorage.setItem('nexacrm_token', adminToken);
  sessionStorage.setItem('nexacrm_role',  adminRole);
  sessionStorage.setItem('nexacrm_name',  adminName);
  sessionStorage.setItem('nexacrm_auth',  adminAuth);
  sessionStorage.removeItem('nexacrm_clientId');
  sessionStorage.removeItem('nexacrm_viewing_as_client');
  sessionStorage.removeItem('nexacrm_admin_token');
  sessionStorage.removeItem('nexacrm_admin_role');
  sessionStorage.removeItem('nexacrm_admin_name');
  sessionStorage.removeItem('nexacrm_admin_auth');
  applyRoleUI();
  updateViewingBanner(null);
  navigate('clients');
  showToast('↩ Back to Admin panel', 'success');
}

function updateViewingBanner(name) {
  const banner = document.getElementById('viewingAsBanner');
  if (!banner) return;
  if (name) {
    banner.innerHTML = `
      <span class="vab-icon">👁</span>
      <span class="vab-text">Viewing as <strong>${name}</strong> — client view</span>
      <button class="vab-btn" onclick="exitClientView()">↩ Back to Admin</button>`;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

/* ════════════════════════════════
   CLIENT PORTAL
   ════════════════════════════════ */
function showApp() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  applyRoleUI();
  if (isViewingAsClient()) {
    updateViewingBanner(sessionStorage.getItem('nexacrm_name') || 'Client');
  }
  if (demoMode) showToast('🔶 Demo Mode — run backend for real data', 'info');
  initApp();
  setTimeout(loadNotifications, 1200);
}

function handleLogout() {
  if (isViewingAsClient()) {
    exitClientView();
  } else {
    showLogoutConfirm('admin');
  }
}

function doAdminLogout() {
  closeLogoutConfirm();
  TOKEN = '';
  sessionStorage.clear();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

function checkAuth() {
  const auth = sessionStorage.getItem('nexacrm_auth');
  if (auth === 'true')  { demoMode = false; showApp(); }
  else if (auth === 'demo') { demoMode = true; showApp(); }
}

/* ════════════════════════════════
   INIT
   ════════════════════════════════ */
function initApp() {
  activeEntityWorkspace = null;
  updateEntityWorkspaceUI();
  updateTopbarDate();
  navigate('dashboard');
  updateSidebarBadges();
}

function applyRoleUI() {
  const client = isClientRole();
  document.body.classList.toggle('role-client', client);
  document.body.classList.toggle('role-admin', !client);
  document.querySelectorAll('[data-admin-only="true"]').forEach(el => el.classList.toggle('hidden', client));
  updateEntityWorkspaceUI();

  const name = client ? clientName() : 'Admin';
  const sidebarName = document.getElementById('sidebarName');
  const sidebarRole = document.getElementById('sidebarRole');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarRole) sidebarRole.textContent = client ? 'Client' : 'Super Admin';
  if (sidebarAvatar) sidebarAvatar.textContent = name.charAt(0).toUpperCase();

  const qaMessagesText = document.getElementById('qaMessagesText');
  if (qaMessagesText) qaMessagesText.textContent = client ? 'Message Team' : 'Messages';
  ['qaDocumentsBtn','qaRatingBtn','qaProjectBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !client);
  });

  // Rename Clients → Profile in sidebar for client role
  const navClientsLabel = document.getElementById('navClientsLabel');
  if (navClientsLabel) navClientsLabel.textContent = client ? 'Profile' : 'Clients';

  // Show client-only Projects nav item only for client role
  document.querySelectorAll('.client-only-nav').forEach(el => {
    el.style.display = client ? '' : 'none';
  });

  // Show username/password columns only for client role
  document.querySelectorAll('.client-only-col').forEach(el=>{
    el.style.display = client ? '' : 'none';
  });
}

function updateSidebarBadges() {
  ['badgeEnquiries','badgeMessages','badgeClients'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function updateTopbarDate() {
  document.getElementById('topbarDate').textContent =
    new Date().toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
}

/* ════════════════════════════════
   PASSWORD SHOW / HIDE
   ════════════════════════════════ */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

/* ════════════════════════════════
   DARK / LIGHT MODE TOGGLE
   ════════════════════════════════ */
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('nexacrm_theme', isLight ? 'light' : 'dark');
  // Redraw charts with new theme colors
  if (currentPage === 'dashboard') {
    setTimeout(() => drawDashboardCharts(allClients.length ? allClients : demoClients), 100);
  }
}

function initTheme() {
  const saved = localStorage.getItem('nexacrm_theme');
  const btn   = document.getElementById('themeToggle');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    if (btn) btn.textContent = '☀️';
  } else {
    document.body.classList.remove('light-mode');
    if (btn) btn.textContent = '🌙';
  }
}

/* ════════════════════════════════
   NAVIGATION
   ════════════════════════════════ */
const PAGE_TITLES = { dashboard:'Dashboard', businessgroups:'Business Groups', entityplaceholder:'Entity Workspace', clients:'Clients', enquiries:'Enquiries', enquiryform:'Public Enquiry Form', messages:'Messages', payments:'Payments', invoice:'Invoice Generator', timeline:'Timeline Tracker', ratings:'Ratings & Feedback', documents:'Documents', notes:'Notes', activity:'Activity Log', clientprofile:'Client Profile', projects:'All Projects', clientprojects:'My Projects', websites:'Our Websites', college:'College Dashboard', interns:'Interns', employees:'Employees', bricksincome:'Bricks Income', thingsexpense:'Things Expense', employeesalary:'Employees Salary', roshantraders:'Trade' };
const BUSINESS_GROUPS = {
  social: {
    label: 'Social & Charitable',
    icon: 'fa-hand-holding-heart',
    description: 'Foundation, outreach, and charitable initiatives',
    entities: ['foundation'],
  },
  technology: {
    label: 'Technology & Employment',
    icon: 'fa-laptop-code',
    description: 'Software services, training, placement, and consulting entities',
    entities: ['roriri', 'nexgen', 'riya'],
  },
  manufacturing: {
    label: 'Manufacturing & Trading',
    icon: 'fa-industry',
    description: 'Trading, material movement, stock, income, expense, and invoices',
    entities: ['roshan', 'rn'],
  },
  agriculture: {
    label: 'Agriculture & Wellness',
    icon: 'fa-seedling',
    description: 'Farm, food, and wellness operations',
    entities: ['rithish'],
  },
};
const ENTITY_WORKSPACES = {
  roriri: { label: 'Roriri Software Solutions', defaultPage: 'dashboard', pages: ['dashboard', 'clients', 'enquiries', 'enquiryform', 'projects', 'timeline', 'documents', 'websites', 'college', 'interns', 'employees'] },
  foundation: { label: 'Roriri Foundation', defaultPage: 'entityplaceholder', pages: ['entityplaceholder'], empty: true, group: 'social', icon: 'fa-hand-holding-heart', entityType: 'Foundation' },
  nexgen: { label: 'Nexgen IT Academy', defaultPage: 'entityplaceholder', pages: ['entityplaceholder'], empty: true, group: 'technology', icon: 'fa-graduation-cap', entityType: 'Training' },
  riya: { label: 'Riya Consultancy', defaultPage: 'entityplaceholder', pages: ['entityplaceholder'], empty: true, group: 'technology', icon: 'fa-briefcase', entityType: 'Consultancy' },
  rn: { label: 'RN Chamber', defaultPage: 'thingsexpense', pages: ['thingsexpense', 'bricksincome', 'employeesalary', 'invoice'] },
  roshan: { label: 'Roshan Traders', defaultPage: 'roshantraders', pages: ['roshantraders'] },
  rithish: { label: 'Rithish Farms', defaultPage: 'entityplaceholder', pages: ['entityplaceholder'], empty: true, group: 'agriculture', icon: 'fa-seedling', entityType: 'Agriculture' },
};
let activeEntityWorkspace = null;
let lastMainPageBeforeEntity = 'dashboard';
let activeBusinessGroup = 'technology';

function showSpinner() {
  const s = document.getElementById('pageSpinner');
  if (s) s.classList.remove('hidden');
}
function hideSpinner() {
  const s = document.getElementById('pageSpinner');
  if (s) s.classList.add('hidden');
}

function navigate(page) {
  const adminOnlyPages = ['businessgroups','entityplaceholder','enquiries','enquiryform','invoice','activity','notes','projects','college','interns','employees','bricksincome','thingsexpense','employeesalary','roshantraders'];
  if (isClientRole() && adminOnlyPages.includes(page)) page = 'dashboard';
  const workspace = activeEntityWorkspace ? ENTITY_WORKSPACES[activeEntityWorkspace] : null;
  if (workspace && !workspace.pages.includes(page)) page = workspace.defaultPage;

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-child').forEach(el => el.classList.remove('child-active'));

  const navScope = activeEntityWorkspace
    ? document.querySelector(`.entity-workspace-nav[data-entity-workspace-nav="${activeEntityWorkspace}"]`)
    : document;
  const singleItem = navScope?.querySelector(`.nav-item[data-page="${page}"]`) || document.querySelector(`.nav-item[data-page="${page}"]`);
  if (singleItem) singleItem.classList.add('active');

  const childItem = activeEntityWorkspace ? null : document.querySelector(`.nav-child[data-page="${page}"]`);
  if (childItem) {
    childItem.classList.add('child-active');
    openGroupForPage(page);
  }
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  Array.from(document.body.classList).forEach(cls => {
    if (cls.startsWith('page-current-')) document.body.classList.remove(cls);
  });
  document.body.classList.add(`page-current-${page}`);
  // Page title logic
  if (page === 'clients' && isClientRole()) {
    document.getElementById('pageTitle').textContent = 'Profile';
  } else if (activeEntityWorkspace) {
    const title = PAGE_TITLES[page] || page;
    document.getElementById('pageTitle').textContent = title;
  } else {
    document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;
  }
  currentPage = page;
  showSpinner();
  const loader = ({ dashboard:loadDashboard, businessgroups:loadBusinessGroupsPage, entityplaceholder:loadEntityPlaceholderPage, clients:loadClients, enquiries:loadEnquiries, enquiryform:loadEnquiryForm, messages:loadMessages, payments:loadPayments, invoice:loadInvoicePage, timeline:loadTimelinePage, ratings:loadRatings, documents:loadDocuments, notes:loadNotes, activity:loadActivity, projects:loadProjectsPage, clientprojects:loadClientProjects, websites:loadWebsitesPage, college:loadCollegePage, interns:loadInterns, employees:loadEmployees, bricksincome:loadBricksIncomePage, thingsexpense:loadThingsExpensePage, employeesalary:loadEmployeeSalaryPage, roshantraders:loadRoshanTradePage })[page];
  if (loader) {
    Promise.resolve(loader()).finally(() => setTimeout(hideSpinner, 300));
  } else {
    hideSpinner();
  }
}

function enterEntityWorkspace(workspaceKey) {
  const workspace = ENTITY_WORKSPACES[workspaceKey];
  if (!workspace || isClientRole()) return;
  if (!activeEntityWorkspace && currentPage) lastMainPageBeforeEntity = currentPage;
  if (lastMainPageBeforeEntity === 'businessgroups') lastMainPageBeforeEntity = 'dashboard';
  activeEntityWorkspace = workspaceKey;
  updateEntityWorkspaceUI();
  navigate(workspace.defaultPage);
  if (isMobileSidebar()) closeSidebar();
}

function exitEntityWorkspace() {
  activeEntityWorkspace = null;
  updateEntityWorkspaceUI();
  navigate(lastMainPageBeforeEntity || 'dashboard');
  if (isMobileSidebar()) closeSidebar();
}

function openBusinessGroup(groupKey) {
  if (!BUSINESS_GROUPS[groupKey] || isClientRole()) return;
  activeBusinessGroup = groupKey;
  const groupId = {
    social: 'groupBusinessSocial',
    technology: 'groupBusinessTechnology',
    manufacturing: 'groupBusinessManufacturing',
    agriculture: 'groupBusinessAgriculture',
  }[groupKey];
  if (groupId) {
    const parent = document.getElementById('groupBusiness');
    if (parent?.classList.contains('hidden')) toggleGroup('groupBusiness');
    const groupEl = document.getElementById(groupId);
    if (groupEl?.classList.contains('hidden')) toggleGroup(groupId);
  }
  if (isMobileSidebar()) closeSidebar();
}

function loadBusinessGroupsPage() {
  const group = BUSINESS_GROUPS[activeBusinessGroup] || BUSINESS_GROUPS.technology;
  document.querySelectorAll('#groupBusiness .nav-child').forEach(child => child.classList.remove('child-active'));
  document.querySelector(`#groupBusiness .nav-child[onclick*="${activeBusinessGroup}"]`)?.classList.add('child-active');
  const title = document.getElementById('businessGroupTitle');
  const sub = document.getElementById('businessGroupSub');
  const grid = document.getElementById('businessEntityGrid');
  if (title) title.textContent = group.label;
  if (sub) sub.textContent = group.description;
  if (!grid) return;
  grid.innerHTML = group.entities.map(entityKey => {
    const entity = ENTITY_WORKSPACES[entityKey] || {};
    const icon = entity.icon || (entityKey === 'roriri' ? 'fa-asterisk' : entityKey === 'roshan' ? 'fa-shop' : entityKey === 'rn' ? 'fa-building-columns' : 'fa-cube');
    const status = entity.empty ? 'No modules yet' : 'Workspace ready';
    return `
      <button class="business-entity-card" type="button" onclick="enterEntityWorkspace('${entityKey}')">
        <span class="business-entity-icon"><i class="fa-solid ${icon}"></i></span>
        <span class="business-entity-copy">
          <strong>${rnEscapeHtml(entity.label || 'Entity')}</strong>
          <small>${rnEscapeHtml(entity.entityType || status)}</small>
        </span>
        <span class="business-entity-status">${rnEscapeHtml(status)}</span>
        <span class="business-entity-arrow"><i class="fa-solid fa-arrow-right"></i></span>
      </button>`;
  }).join('');
}

function loadEntityPlaceholderPage() {
  const entity = ENTITY_WORKSPACES[activeEntityWorkspace] || {};
  const group = BUSINESS_GROUPS[entity.group] || {};
  const wrap = document.getElementById('entityPlaceholderContent');
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="entity-empty-panel">
      <div class="entity-empty-icon"><i class="fa-solid ${entity.icon || 'fa-cube'}"></i></div>
      <div class="entity-empty-kicker">${rnEscapeHtml(group.label || 'Business Group')}</div>
      <h3>${rnEscapeHtml(entity.label || 'Entity')}</h3>
      <p>This entity is created inside the app. Modules and data are not added yet.</p>
      <button class="btn-primary" type="button" onclick="exitEntityWorkspace()">Back to Business Groups</button>
    </div>`;
}

function updateEntityWorkspaceUI() {
  if (isClientRole()) activeEntityWorkspace = null;
  const inWorkspace = Boolean(activeEntityWorkspace);
  document.body.classList.toggle('entity-workspace-active', inWorkspace);
  const entityName = document.getElementById('topbarEntityName');
  if (entityName && activeEntityWorkspace) {
    entityName.textContent = ENTITY_WORKSPACES[activeEntityWorkspace]?.label || 'Entity';
  }
  document.getElementById('mainSidebarNav')?.classList.toggle('hidden', inWorkspace);
  document.querySelectorAll('.entity-workspace-nav').forEach(nav => {
    nav.classList.toggle('hidden', nav.dataset.entityWorkspaceNav !== activeEntityWorkspace);
  });
}

const SIDEBAR_MODE_KEY = 'nexacrm_sidebar_mode';
let sidebarMode = localStorage.getItem(SIDEBAR_MODE_KEY) === 'pinned' ? 'pinned' : 'hover';
let sidebarHoverExpanded = false;

function toggleSidebar() {
  if (isMobileSidebar()) {
    toggleMobileSidebar();
    return;
  }
  setSidebarMode(sidebarMode === 'hover' ? 'pinned' : 'hover');
}

function isMobileSidebar() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function setSidebarMode(mode, persist = true) {
  sidebarMode = mode === 'pinned' ? 'pinned' : 'hover';
  sidebarHoverExpanded = false;
  document.body.classList.remove('sidebar-hover-expanded', 'sidebar-open');
  document.getElementById('sidebar')?.classList.remove('open');
  if (isMobileSidebar()) {
    document.body.classList.remove('sidebar-collapsed');
  } else {
    document.body.classList.toggle('sidebar-collapsed', sidebarMode === 'hover');
  }
  if (persist) localStorage.setItem(SIDEBAR_MODE_KEY, sidebarMode);
  updateSidebarToggle();
}

function updateSidebarToggle(collapsed = document.body.classList.contains('sidebar-collapsed')) {
  const mobileBtn = document.getElementById('mobileSidebarBtn');
  const btn = document.getElementById('hamburgerBtn');
  const mobileOpen = document.body.classList.contains('sidebar-open');
  const backdrop = document.getElementById('sidebarBackdrop');
  const expanded = isMobileSidebar() ? mobileOpen : sidebarMode === 'pinned' || sidebarHoverExpanded;
  if (backdrop) backdrop.setAttribute('aria-hidden', String(!mobileOpen));
  [btn, mobileBtn].forEach(button => {
    if (!button) return;
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', expanded ? 'Close sidebar' : 'Open sidebar');
    button.classList.toggle('mobile-close-visible', isMobileSidebar() && expanded);
    button.textContent = '☰';
  });
  document.querySelectorAll('#paymentsTbody .btn-sm').forEach(btn => {
    const match = btn.getAttribute('onclick')?.match(/openPaymentModal\((\d+)\)/);
    if (!match) return;
    btn.outerHTML = `<span class="icon-btn icon-edit" title="Edit Payment" onclick="openPaymentModal(${match[1]})">✏️</span>`;
  });
  return;
  if (!btn) return;
  btn.setAttribute('aria-expanded', String(!collapsed));
  btn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  btn.textContent = collapsed ? '→' : '☰';
}

function openSidebar() {
  if (isMobileSidebar()) {
    document.body.classList.add('sidebar-open');
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarBackdrop')?.setAttribute('aria-hidden', 'false');
    updateSidebarToggle();
    return;
  }
  setSidebarMode('pinned');
}

function closeSidebar() {
  if (isMobileSidebar()) {
    document.body.classList.remove('sidebar-open');
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarBackdrop')?.setAttribute('aria-hidden', 'true');
    updateSidebarToggle();
    return;
  }
  setSidebarMode('hover');
}

function closeSidebarOverlay() {
  closeSidebar();
}

function initSidebarHover() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  setSidebarMode(sidebarMode, false);
  sidebar.addEventListener('mouseenter', () => {
    if (isMobileSidebar() || sidebarMode !== 'hover') return;
    sidebarHoverExpanded = true;
    document.body.classList.add('sidebar-hover-expanded');
    document.body.classList.remove('sidebar-collapsed');
    updateSidebarToggle();
  });
  sidebar.addEventListener('mouseleave', () => {
    if (isMobileSidebar() || !sidebarHoverExpanded || sidebarMode !== 'hover') return;
    sidebarHoverExpanded = false;
    document.body.classList.remove('sidebar-hover-expanded');
    document.body.classList.add('sidebar-collapsed');
    updateSidebarToggle();
  });
  window.addEventListener('resize', () => {
    sidebarHoverExpanded = false;
    document.body.classList.remove('sidebar-hover-expanded');
    if (isMobileSidebar()) {
      document.body.classList.remove('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-open');
      sidebar.classList.remove('open');
      document.body.classList.toggle('sidebar-collapsed', sidebarMode === 'hover');
    }
    updateSidebarToggle();
  });
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const open = !document.body.classList.contains('sidebar-open');
  document.body.classList.toggle('sidebar-open', open);
  sidebar?.classList.toggle('open', open);
  document.getElementById('sidebarBackdrop')?.setAttribute('aria-hidden', String(!open));
  updateSidebarToggle();
}

/* ════════════════════════════════
   COLLAPSIBLE NAV GROUPS
   ════════════════════════════════ */
function wrapResponsiveTables(root = document) {
  const tables = root.matches?.('table')
    ? [root]
    : Array.from(root.querySelectorAll?.('table') || []);
  tables.forEach(table => {
    if (table.closest('.table-wrap, .responsive-table-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = table.classList.contains('inv-table')
      ? 'responsive-table-wrap invoice-table-wrap'
      : 'responsive-table-wrap';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}

function initResponsiveEnhancements() {
  document.getElementById('sidebarBackdrop')?.addEventListener('click', closeSidebar);

  document.getElementById('sidebar')?.addEventListener('click', event => {
    const target = event.target.closest('a, button');
    if (!target || target.classList.contains('sidebar-toggle')) return;
    if (isMobileSidebar()) closeSidebar();
  });

  wrapResponsiveTables();
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) wrapResponsiveTables(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function toggleGroup(groupId) {
  const children = document.getElementById(groupId);
  if (!children) return;
  const arrowId  = 'arrow' + groupId.replace('group','');
  const arrow    = document.getElementById(arrowId);
  const parent   = children.previousElementSibling;

  const isOpen = !children.classList.contains('hidden');

  if (isOpen) {
    // Close
    children.style.maxHeight = children.scrollHeight + 'px';
    requestAnimationFrame(() => {
      children.style.maxHeight = '0px';
      children.style.opacity   = '0';
      refreshOpenAncestorGroups(children);
    });
    setTimeout(() => {
      children.classList.add('hidden');
      refreshOpenAncestorGroups(children);
    }, 280);
    arrow?.classList.remove('arrow-open');
    parent?.classList.remove('nav-parent-active');
  } else {
    // Open
    children.classList.remove('hidden');
    children.style.maxHeight = '0px';
    children.style.opacity   = '0';
    requestAnimationFrame(() => {
      children.style.maxHeight = children.scrollHeight + 'px';
      children.style.opacity   = '1';
      refreshOpenAncestorGroups(children);
    });
    setTimeout(() => refreshOpenAncestorGroups(children), 300);
    arrow?.classList.add('arrow-open');
    parent?.classList.add('nav-parent-active');
  }
}

function refreshOpenAncestorGroups(el) {
  let parent = el?.parentElement;
  while (parent) {
    if (parent.classList?.contains('nav-children') && !parent.classList.contains('hidden')) {
      parent.style.maxHeight = parent.scrollHeight + 'px';
    }
    parent = parent.parentElement;
  }
}

function openGroupForPage(page) {
  const roririGroupMap = {
    enquiries:   'groupRoririEnquiries',
    enquiryform: 'groupRoririEnquiries',
    projects:    'groupRoririProjects',
    timeline:    'groupRoririProjects',
    documents:   'groupRoririProjects',
    college:     'groupRoririPortals',
    clients:     'groupRoririPortals',
    interns:     'groupRoririPortals',
    employees:   'groupRoririPortals',
  };
  const mainGroupMap = {
    businessgroups: 'groupBusiness',
    enquiries:   'groupEnquiries',
    enquiryform: 'groupEnquiries',
    projects:    'groupProjects',
    timeline:    'groupProjects',
    documents:   'groupProjects',
    payments:    'groupFinance',
    invoice:     'groupFinance',
    messages:    'groupComm',
    notes:       'groupComm',
    ratings:     'groupComm',
    college:     'groupPortals',
  };
  const pageGroupMap = activeEntityWorkspace === 'roriri' ? roririGroupMap : mainGroupMap;
  const groupIds = [].concat(pageGroupMap[page] || []);
  groupIds.forEach(groupId => {
    const el = document.getElementById(groupId);
    if (el && el.classList.contains('hidden')) toggleGroup(groupId);
  });
}

/* ════════════════════════════════
   DASHBOARD
   ════════════════════════════════ */
async function loadDashboard() {
  let stats, clients;
  if (demoMode) {
    const cid = currentClientId();
    clients = isClientRole()
      ? demoClients.filter(c => Number(c.id) === cid)
      : [...demoClients];
    stats = { totalClients:clients.length, totalRevenue:clients.reduce((s,c)=>s+c.paid_amount,0), pendingPayments:clients.reduce((s,c)=>s+(c.quotation_amount-c.paid_amount),0), activeProjects:clients.filter(c=>c.project_status==='In Progress').length };
  } else {
    [stats, clients] = await Promise.all([ api('GET','/clients/dashboard-stats'), api('GET','/clients') ]);
    clients = clients || [];
  }
  if (!stats) return;
  if (isClientRole()) {
    const cid = currentClientId();
    const c = clients.find(x => Number(x.id) === cid) || clients[0] || {};
    stats = {
      totalClients: c.project_name ? 1 : 0,
      totalRevenue: c.paid_amount || 0,
      pendingPayments: (c.quotation_amount || 0) - (c.paid_amount || 0),
      activeProjects: c.project_status === 'In Progress' ? 1 : 0,
    };
    document.getElementById('dashWelcomeTitle').textContent = `Welcome back, ${clientName()}`;
    document.getElementById('dashWelcomeSub').textContent = 'Here is your project overview';
    document.getElementById('statClientsLabel').textContent = 'My Project';
    document.getElementById('statClientsTrend').textContent = c.project_status || 'Status';
    document.getElementById('statRevenueLabel').textContent = 'Amount Paid';
    document.getElementById('statPendingLabel').textContent = 'Balance Due';
    document.getElementById('statActiveLabel').textContent = 'Active Project';
  } else {
    document.getElementById('dashWelcomeTitle').textContent = 'Welcome back, Admin';
    document.getElementById('dashWelcomeSub').textContent = "Here's your business overview for today";
    document.getElementById('statClientsLabel').textContent = 'Total Clients';
    document.getElementById('statClientsTrend').textContent = 'All time';
    document.getElementById('statRevenueLabel').textContent = 'Total Revenue';
    document.getElementById('statPendingLabel').textContent = 'Pending Payments';
    document.getElementById('statActiveLabel').textContent = 'Active Projects';    stats.totalClients = 3;
    stats.activeProjects = 3;
  }
  const el = document.getElementById('dashDate');
  if (el) el.textContent = new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  if (isClientRole()) {
    animateNumber('statClients', stats.totalClients);
    animateNumber('statRevenue', stats.totalRevenue, true);
    animateNumber('statPending', stats.pendingPayments, true);
    animateNumber('statActive',  stats.activeProjects);
  } else {
    animateNumber('statClients', stats.totalClients);
    document.getElementById('statRevenue').textContent = '';
    document.getElementById('statPending').textContent = '';
    animateNumber('statActive',  stats.activeProjects);
  }
  // Draw charts after short delay — pass filtered client data
  if (isClientRole()) {
    const cid = currentClientId();
    // Get this client's projects for accurate chart data
    const myProjects = demoMode
      ? demoProjects.filter(p => Number(p.client_id) === cid)
      : (await api('GET', `/projects?clientId=${cid}`) || []);
    setTimeout(() => drawDashboardCharts(clients, myProjects), 300);
  } else {
    setTimeout(() => drawDashboardCharts(clients || demoClients, null), 300);
  }
  // Update sidebar badges
  updateSidebarBadges();

  // Deadline widget — admin only
  if (!isClientRole()) {
    const projects = demoMode ? demoProjects : (await api('GET','/projects') || []);
    const upcoming = projects
      .filter(p => p.deadline && p.project_status !== 'Completed')
      .map(p => ({ ...p, _dl: calcDeadline(p.deadline) }))
      .sort((a,b) => a._dl.days - b._dl.days)
      .slice(0, 5);
    const dlEl = document.getElementById('dashDeadlines');
    if (dlEl) {
      dlEl.innerHTML = upcoming.length ? upcoming.map(p=>`
        <div class="dl-item">
          <div class="dl-left">
            <div class="dl-name">${p.project_name}</div>
            <div class="dl-client">👤 ${p.client_name||'—'}</div>
          </div>
          <span class="dl-badge ${p._dl.cls}">${p._dl.label}</span>
        </div>`).join('')
        : '<div class="dl-empty">✅ No upcoming deadlines</div>';
    }
  }
}

/* Chart.js instances */
let revenueChartInst = null, statusChartInst = null, paymentChartInst = null;

function drawDashboardCharts(clients, projects) {
  const isDark = !document.body.classList.contains('light-mode');
  const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDark ? '#7a8099' : '#6b7280';
  const fontFamily = "'DM Sans', sans-serif";

  Chart.defaults.font.family = fontFamily;
  Chart.defaults.color = labelColor;

  // Destroy old charts
  if (revenueChartInst)  { revenueChartInst.destroy();  revenueChartInst  = null; }
  if (statusChartInst)   { statusChartInst.destroy();   statusChartInst   = null; }
  if (paymentChartInst)  { paymentChartInst.destroy();  paymentChartInst  = null; }

  const isClient = isClientRole();

  // 1 — Revenue Bar Chart
  const rCtx = document.getElementById('revenueChart');
  if (rCtx) {
    let labels, quotations, paids;
    if (isClient && projects && projects.length) {
      // Show per-project revenue for this client
      labels     = projects.map(p => p.project_name.length > 12 ? p.project_name.slice(0,12)+'…' : p.project_name);
      quotations = projects.map(p => p.budget || p.quotation_amount || 0);
      paids      = projects.map(p => p.paid_amount || 0);
    } else {
      // Admin — show per-client revenue
      labels     = clients.map(c => c.name.split(' ')[0]);
      quotations = clients.map(c => c.quotation_amount || 0);
      paids      = clients.map(c => c.paid_amount || 0);
    }
    revenueChartInst = new Chart(rCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Quotation', data: quotations, backgroundColor: 'rgba(108,99,255,0.5)', borderColor: '#6c63ff', borderWidth: 2, borderRadius: 6 },
          { label: 'Paid',      data: paids,      backgroundColor: 'rgba(0,212,170,0.5)',  borderColor: '#00d4aa', borderWidth: 2, borderRadius: 6 },
        ]
      },
      options: { responsive:true, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, padding:16 } } }, scales:{ x:{ grid:{ color:gridColor } }, y:{ grid:{ color:gridColor }, ticks:{ callback: v=>'₹'+Number(v).toLocaleString('en-IN') } } } }
    });
  }

  // 2 — Project Status Doughnut
  const sCtx = document.getElementById('statusChart');
  if (sCtx) {
    let pending, inProg, completed;
    if (isClient && projects && projects.length) {
      // Use project statuses for this client
      pending   = projects.filter(p => p.project_status === 'Pending').length;
      inProg    = projects.filter(p => p.project_status === 'In Progress').length;
      completed = projects.filter(p => p.project_status === 'Completed').length;
    } else {
      pending   = clients.filter(c => c.project_status === 'Pending').length;
      inProg    = clients.filter(c => c.project_status === 'In Progress').length;
      completed = clients.filter(c => c.project_status === 'Completed').length;
    }
    statusChartInst = new Chart(sCtx, {
      type: 'doughnut',
      data: {
        labels: ['Pending','In Progress','Completed'],
        datasets: [{ data:[pending,inProg,completed], backgroundColor:['#ffb347','#6c63ff','#00d4aa'], borderWidth:0, hoverOffset:8 }]
      },
      options: { responsive:true, cutout:'65%', plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, padding:16 } } } }
    });
  }

  // 3 — Payment Status Doughnut
  const pCtx = document.getElementById('paymentChart');
  if (pCtx) {
    let paid, partial, due;
    if (isClient && projects && projects.length) {
      // Use project payment statuses for this client
      paid    = projects.filter(p => p.payment_status === 'Paid').length;
      partial = projects.filter(p => p.payment_status === 'Partial').length;
      due     = projects.filter(p => p.payment_status === 'Due').length;
    } else {
      paid    = clients.filter(c => c.payment_status === 'Paid').length;
      partial = clients.filter(c => c.payment_status === 'Partial').length;
      due     = clients.filter(c => c.payment_status === 'Due').length;
    }
    paymentChartInst = new Chart(pCtx, {
      type: 'doughnut',
      data: {
        labels: ['Paid','Partial','Due'],
        datasets: [{ data:[paid,partial,due], backgroundColor:['#00d4aa','#ffb347','#ff6b6b'], borderWidth:0, hoverOffset:8 }]
      },
      options: { responsive:true, cutout:'65%', plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, padding:16 } } } }
    });
  }
}

function animateNumber(id, target, currency=false) {
  const el=document.getElementById(id); let cur=0; const step=target/40;
  const t=setInterval(()=>{ cur=Math.min(cur+step,target); el.textContent=currency?`₹${Math.round(cur).toLocaleString('en-IN')}`:Math.round(cur); if(cur>=target)clearInterval(t); },20);
}

/* ════════════════════════════════
   CLIENTS
   ════════════════════════════════ */
async function loadClients() {
  if (demoMode) {
    const cid = currentClientId();
    allClients = isClientRole()
      ? demoClients.filter(c => Number(c.id) === cid)
      : [...demoClients];
  } else {
    const all = await api('GET', '/clients') || [];
    allClients = isClientRole()
      ? all.filter(c => Number(c.id) === currentClientId())
      : all;
  }
  renderClientsTable(allClients);
}

function renderClientsTable(data) {
  const tbody    = document.getElementById('clientsTbody');
  const isClient = isClientRole();
  if (!data.length) {
    tbody.innerHTML=`<tr><td colspan="${isClient?6:5}"><div class="empty-state"><div class="empty-state-icon">◉</div><div class="empty-state-text">No clients found</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((c,i)=>{
    const username = c.client_username||c.name||'—';
    const password = c.client_password||`${c.name}123`;
    const credCols = isClient?`
      <td style="white-space:nowrap;font-family:monospace;color:var(--text-primary)">${username}</td>
      <td style="white-space:nowrap" onclick="event.stopPropagation()">
        <div style="display:flex;align-items:center;gap:8px">
          <span id="pwd-${c.id}" style="font-family:monospace;letter-spacing:2px;color:var(--text-primary)">••••••••</span>
          <button onclick="toggleClientPwd(${c.id},'${password}')" id="pwd-eye-${c.id}"
            style="background:none;border:none;cursor:pointer;font-size:1rem;padding:0;line-height:1"
            title="Show/Hide">👁</button>
        </div>
      </td>`:'';
    return `
    <tr class="client-row" onclick="openClientProfile(${c.id})" title="Click to view ${c.name}'s profile">
      <td class="row-num">${String(i+1).padStart(2,'0')}</td>
      <td>
        <strong style="color:var(--text-primary)">${c.name}</strong>
        ${c.company_name ? `<div style="font-size:0.78rem;color:var(--text-secondary);margin-top:3px">${c.company_name}</div>` : ''}
      </td>
      <td>${c.email||''}</td>
      ${credCols}
      <td>${c.phone||'--'}</td>
      <td class="action-icons ${isClient?'hidden':''}" onclick="event.stopPropagation()">
        <span class="icon-btn icon-dashboard" title="View as Client" onclick="viewAsClient(${c.id},'${c.name.replace(/'/g,"\\'")}')">🏠</span>
        <span class="icon-btn icon-view"       title="View Details"     onclick="openViewModal(${c.id})">👁</span>
        <span class="icon-btn icon-edit"       title="Edit Client"      onclick="openClientModal(${c.id})">✏️</span>
        <span class="icon-btn icon-delete"     title="Delete Client"    onclick="deleteClient(${c.id})">🗑️</span>
      </td>
    </tr>`;
  }).join('');
}

/* ════════════════════════════════
   PROJECTS PAGE
   ════════════════════════════════ */
let allProjects = [];
let editingProjectId = null;

async function loadProjectsPage() {
  if (demoMode) {
    allProjects = demoProjects.map(p => ({ ...p, source: 'project' }));
  } else {
    // LIVE MODE: fetch both sources in parallel
    const [projData, clientData] = await Promise.all([
      api('GET', '/projects'),
      api('GET', '/clients')
    ]);

    const dedicatedProjs   = (projData || []).map(p => ({ ...p, source: p.source || 'project' }));
    const dedicatedClientIds = dedicatedProjs.map(p => p.client_id);

    // Convert clients that have a project_name but NO dedicated project record
    const clientProjects = (clientData || [])
      .filter(c => c.project_name && !dedicatedClientIds.includes(c.id))
      .map(c => ({
        id:             'c_' + c.id,
        source:         'client',
        client_id:      c.id,
        client_name:    c.name,
        company_name:   c.company_name || '',
        project_name:   c.project_name,
        project_status: c.project_status,
        budget:         c.quotation_amount || 0,
        paid_amount:    c.paid_amount || 0,
        payment_status: c.payment_status,
        deadline:       c.deadline || '',
        start_date:     c.created_at || '',
        description:    '',
      }));

    allProjects = [...clientProjects, ...dedicatedProjs];
  }

  renderProjSummary(allProjects);
  populateProjClientFilter(allProjects);
  renderProjectsTable(allProjects);
}

function renderProjSummary(data) {
  const total     = data.length;
  const inProg    = data.filter(p => p.project_status === 'In Progress').length;
  const completed = data.filter(p => p.project_status === 'Completed').length;
  const pending   = data.filter(p => p.project_status === 'Pending').length;
  const upcoming  = data.filter(p => p.project_status === 'Upcoming').length;
  const overdue   = data.filter(p => calcDeadline(p.deadline).days !== null && calcDeadline(p.deadline).days < 0 && p.project_status !== 'Completed').length;
  const el = document.getElementById('projSummaryRow');
  if (!el) return;
  el.innerHTML = `
    <div class="proj-sum-card"><div class="proj-sum-icon" style="background:rgba(108,99,255,0.15);color:var(--c1)">◈</div><div class="proj-sum-info"><div class="proj-sum-val">${total}</div><div class="proj-sum-label">Total Projects</div></div></div>
    <div class="proj-sum-card"><div class="proj-sum-icon" style="background:rgba(255,179,71,0.15);color:var(--c4)">🟡</div><div class="proj-sum-info"><div class="proj-sum-val">${inProg}</div><div class="proj-sum-label">In Progress</div></div></div>
    <div class="proj-sum-card"><div class="proj-sum-icon" style="background:rgba(0,212,170,0.15);color:var(--c2)">🟢</div><div class="proj-sum-info"><div class="proj-sum-val">${completed}</div><div class="proj-sum-label">Completed</div></div></div>
    <div class="proj-sum-card"><div class="proj-sum-icon" style="background:rgba(255,107,107,0.15);color:var(--c3)">🔴</div><div class="proj-sum-info"><div class="proj-sum-val">${pending}</div><div class="proj-sum-label">Pending</div></div></div>
    ${overdue > 0 ? `<div class="proj-sum-card"><div class="proj-sum-icon" style="background:rgba(255,107,107,0.15);color:var(--c3)">❌</div><div class="proj-sum-info"><div class="proj-sum-val">${overdue}</div><div class="proj-sum-label">Overdue</div></div></div>` : ''}
  `;
}

function populateProjClientFilter(data) {
  const sel = document.getElementById('projectClientFilter');
  if (!sel) return;
  const clients = [...new Set(data.map(p => p.client_name).filter(Boolean))];
  sel.innerHTML = '<option value="">All Clients</option>' +
    clients.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderProjectsTable(data) {
  const tbody = document.getElementById('projectsTbody');
  if (!data || !data.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">◈</div><div class="empty-state-text">No projects yet. Click "+ Add Project" to create one.</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((p,i) => {
    const dl        = calcDeadline(p.deadline);
    const hasBudget = p.budget !== null && p.budget !== undefined && p.budget !== '';
    const hasPaid = p.paid_amount !== null && p.paid_amount !== undefined && p.paid_amount !== '';
    const remaining = hasBudget || hasPaid ? (Number(p.budget)||0) - (Number(p.paid_amount)||0) : null;
    const statusIcon = p.project_status === 'Completed' ? '🟢' : p.project_status === 'In Progress' ? '🟡' : p.project_status === 'Upcoming' ? 'New' : '🔴';
    return `
    <tr class="client-row" onclick="openProjectDetail('${p.id}')" title="Click to view details">
      <td class="row-num">${String(i+1).padStart(2,'0')}</td>
      <td>
        <strong style="color:var(--text-primary)">${p.project_name}</strong>
        ${p.source === 'client' ? '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">From Client Profile</div>' : ''}
      </td>
      <td><span style="color:var(--accent)">${p.client_name||''}</span><div style="font-size:0.75rem;color:var(--text-muted)">${p.company_name||''}</div></td>
      <td><span class="proj-status-badge proj-${(p.project_status||'').toLowerCase().replace(' ','-')}">${statusIcon} ${p.project_status}</span></td>
      <td style="font-weight:600;color:var(--text-primary)">${hasBudget ? `₹${Number(p.budget).toLocaleString('en-IN')}` : ''}</td>
      <td style="color:var(--c2);font-weight:600">${hasPaid ? `₹${Number(p.paid_amount).toLocaleString('en-IN')}` : ''}</td>
      <td style="color:${remaining>0?'var(--c3)':'var(--c2)'};font-weight:600">${remaining !== null ? `₹${remaining.toLocaleString('en-IN')}` : ''}</td>
      <td>${p.deadline ? `<span class="deadline-badge ${dl.cls}">${dl.label}</span>` : ''}</td>
      <td class="action-icons" onclick="event.stopPropagation()">
        <span class="icon-btn" title="View Details" onclick="openProjectDetail('${p.id}')">👁</span>
        ${p.source === 'client'
          ? `<span class="icon-btn" title="Edit via Clients page" onclick="navigate('clients')" style="opacity:0.5">✏️</span>`
          : `<span class="icon-btn icon-edit" title="Edit Project" onclick="openProjectModal('${p.id}')">✏️</span>
             <span class="icon-btn icon-delete" title="Delete Project" onclick="deleteProject('${p.id}')">🗑️</span>`
        }
      </td>
    </tr>`;
  }).join('');
}

function filterProjects() {
  const search   = (document.getElementById('projectSearch')?.value||'').toLowerCase();
  const statusF  = document.getElementById('projectStatusFilter')?.value || '';
  const clientF  = document.getElementById('projectClientFilter')?.value || '';
  renderProjectsTable(allProjects.filter(p =>
    (!search  || [p.project_name, p.client_name, p.description].some(v=>(v||'').toLowerCase().includes(search))) &&
    (!statusF || p.project_status === statusF) &&
    (!clientF || p.client_name === clientF)
  ));
}

/* ────────────────────────────────
   PROJECT DETAIL VIEW
   ──────────────────────────────── */
function openProjectDetail(id) {
  // id could be number or 'c_N' string — match both
  const p = allProjects.find(x => String(x.id) === String(id));
  if (!p) return;
  const dl        = calcDeadline(p.deadline);
  const remaining = (p.budget||0) - (p.paid_amount||0);
  const pct       = p.budget > 0 ? Math.round(((p.paid_amount||0)/p.budget)*100) : 0;
  const statusIcon = p.project_status === 'Completed' ? '🟢' : p.project_status === 'In Progress' ? '🟡' : '🔴';

  document.getElementById('projDetailTitle').textContent = p.project_name;
  document.getElementById('projDetailEditBtn').onclick = () => { closeProjectDetail(); openProjectModal(id); };

  document.getElementById('projDetailBody').innerHTML = `
    <!-- Status Badge -->
    <div style="margin-bottom:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="proj-status-badge proj-${(p.project_status||'').toLowerCase().replace(' ','-')}" style="font-size:0.95rem;padding:6px 14px">${statusIcon} ${p.project_status}</span>
      ${paymentBadge(p.payment_status)}
      <span class="deadline-badge ${dl.cls}" style="font-size:0.85rem">${dl.label}</span>
    </div>

    <!-- Payment Summary -->
    <div class="proj-detail-stats">
      <div class="pstat-card"><div class="pstat-label">Project Value</div><div class="pstat-value" style="color:var(--c1)">₹${(p.budget||0).toLocaleString('en-IN')}</div></div>
      <div class="pstat-card"><div class="pstat-label">Paid</div><div class="pstat-value" style="color:var(--c2)">₹${(p.paid_amount||0).toLocaleString('en-IN')}</div></div>
      <div class="pstat-card"><div class="pstat-label">Remaining</div><div class="pstat-value" style="color:${remaining>0?'var(--c3)':'var(--c2)'}">₹${remaining.toLocaleString('en-IN')}</div></div>
      <div class="pstat-card"><div class="pstat-label">Paid</div><div class="pstat-value" style="color:var(--c4)">${pct}%</div></div>
    </div>

    <!-- Progress Bar -->
    <div class="profile-progress-wrap" style="margin-bottom:20px">
      <div class="profile-progress-label"><span>Payment Progress</span><span>${pct}%</span></div>
      <div class="profile-progress-track">
        <div class="profile-progress-fill" style="width:${pct}%;background:${pct>=100?'var(--c2)':pct>=50?'var(--c1)':'var(--c3)'}"></div>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="view-grid">
      <div class="view-row"><div class="view-label">Client</div><div class="view-value" style="color:var(--accent)">${p.client_name||'—'}</div></div>
      <div class="view-row"><div class="view-label">Company</div><div class="view-value">${p.company_name||'—'}</div></div>
      <div class="view-row"><div class="view-label">Start Date</div><div class="view-value">${p.start_date||'—'}</div></div>
      <div class="view-row"><div class="view-label">Deadline</div><div class="view-value"><span class="deadline-badge ${dl.cls}">${dl.label}</span> &nbsp;${p.deadline||'—'}</div></div>
      ${p.description ? `<div class="view-row" style="grid-column:1/-1"><div class="view-label">Description</div><div class="view-value">${p.description}</div></div>` : ''}
    </div>
  `;

  document.getElementById('projectDetailModal').classList.remove('hidden');
}

function closeProjectDetail() {
  document.getElementById('projectDetailModal').classList.add('hidden');
}

async function openProjectModal(id = null) {
  editingProjectId = id;
  const existingProject = id ? allProjects.find(x => String(x.id) === String(id)) : null;
  if (existingProject?.source === 'erp') {
    editingProjectId = null;
    showToast('ERP project records are read-only here', 'info');
    return;
  }
  document.getElementById('projModalTitle').textContent = id ? 'Edit Project' : 'Add Project';
  const clients = demoMode ? demoClients : (await api('GET','/clients') || []);
  document.getElementById('projClientId').innerHTML = clients.map(c=>`<option value="${c.id}">${c.name} — ${c.company_name||''}</option>`).join('');

  if (id) {
    const p = allProjects.find(x => String(x.id) === String(id)) || {};
    document.getElementById('projName').value        = p.project_name || '';
    document.getElementById('projClientId').value    = p.client_id || '';
    document.getElementById('projStatus').value      = p.project_status || 'Pending';
    document.getElementById('projBudget').value      = p.budget || '';
    document.getElementById('projPaid').value        = p.paid_amount || '';
    document.getElementById('projPayStatus').value   = p.payment_status || 'Due';
    document.getElementById('projStartDate').value   = p.start_date || '';
    document.getElementById('projDeadline').value    = p.deadline || '';
    document.getElementById('projDesc').value        = p.description || '';
  } else {
    ['projName','projBudget','projPaid','projStartDate','projDeadline','projDesc'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('projStatus').value    = 'Pending';
    document.getElementById('projPayStatus').value = 'Due';
  }
  document.getElementById('projectModal').classList.remove('hidden');
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.add('hidden');
  editingProjectId = null;
}

async function saveProject() {
  const client_id      = parseInt(document.getElementById('projClientId').value);
  const project_name   = document.getElementById('projName').value.trim();
  const project_status = document.getElementById('projStatus').value;
  const budget         = parseFloat(document.getElementById('projBudget').value) || 0;
  const paid_amount    = parseFloat(document.getElementById('projPaid').value) || 0;
  const payment_status = document.getElementById('projPayStatus').value;
  const start_date     = document.getElementById('projStartDate').value;
  const deadline       = document.getElementById('projDeadline').value;
  const description    = document.getElementById('projDesc').value.trim();
  if (!project_name) { showToast('Project name is required','error'); return; }
  try {
    const payload = { client_id, project_name, project_status, budget, paid_amount, payment_status, start_date, deadline, description };
    if (demoMode) {
      const client = demoClients.find(c=>c.id===client_id);
      if (editingProjectId) {
        const idx = demoProjects.findIndex(p=>p.id===editingProjectId);
        if (idx>-1) demoProjects[idx] = { ...demoProjects[idx], ...payload, client_name: client?.name||'' };
      } else {
        demoProjects.push({ id:demoProjectNextId++, ...payload, client_name: client?.name||'', created_at: new Date().toISOString() });
        demoActivity.push({ id:demoActivity.length+1, action:'Project Added', detail:`"${project_name}" added`, action_type:'project', created_at:new Date().toISOString() });
      }
    } else {
      editingProjectId ? await api('PUT',`/projects/${editingProjectId}`,payload) : await api('POST','/projects',payload);
    }
    showToast(editingProjectId?'Project updated!':'Project added!','success');
    closeProjectModal();
    await loadProjectsPage();
  } catch(err) { showToast(err.message,'error'); }
}

async function deleteProject(id) {
  // Client-sourced projects (id starts with 'c_') cannot be deleted here
  // They must be deleted via the Clients page
  if (String(id).startsWith('c_')) {
    showToast('This project is linked to a client. Edit or delete via the Clients page.', 'info');
    return;
  }
  if (!confirm('Delete this project?')) return;
  try {
    const existingProject = allProjects.find(p => String(p.id) === String(id));
    if (existingProject?.source === 'erp') {
      showToast('ERP project records are read-only here', 'info');
      return;
    }
    if (demoMode) { demoProjects = demoProjects.filter(p=>p.id!==id); }
    else await api('DELETE',`/projects/${id}`);
    showToast('Project deleted.','info');
    await loadProjectsPage();
  } catch(err) { showToast(err.message,'error'); }
}

/* ════════════════════════════════
   CLIENT PROJECTS PAGE (card view)
   ════════════════════════════════ */
let clientProjectsData = [];

async function loadClientProjects() {
  const cid = currentClientId();
  if (!cid) return;

  if (demoMode) {
    let projects = demoProjects.filter(p => Number(p.client_id) === cid);
    if (!projects.length) {
      const c = demoClients.find(x => x.id === cid);
      if (c && c.project_name) {
        projects = [{ id:`c_${c.id}`, client_id:c.id, project_name:c.project_name, project_status:c.project_status, budget:c.quotation_amount||0, paid_amount:c.paid_amount||0, payment_status:c.payment_status, start_date:c.created_at||'', deadline:'', description:'', client_name:c.name, company_name:c.company_name }];
      }
    }
    clientProjectsData = projects;
  } else {
    let projects = await api('GET', `/projects?clientId=${cid}`) || [];
    if (!projects.length) {
      const clientArr = await api('GET', '/clients') || [];
      const c = clientArr.find(x => Number(x.id) === cid);
      if (c && c.project_name) {
        projects = [{ id:`c_${c.id}`, client_id:c.id, project_name:c.project_name, project_status:c.project_status, budget:c.quotation_amount||0, paid_amount:c.paid_amount||0, payment_status:c.payment_status, start_date:c.created_at||'', deadline:'', description:'', client_name:c.name, company_name:c.company_name }];
      }
    }
    clientProjectsData = projects;
  }
  renderClientProjectCards(clientProjectsData);
}

function renderClientProjectCards(projects) {
  const container = document.getElementById('clientProjectsGrid');
  if (!container) return;
  if (!projects.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">◈</div>
        <div class="empty-state-text">No projects yet. Admin will add your projects here.</div>
      </div>`;
    return;
  }
  container.innerHTML = projects.map(p => {
    const dl  = calcDeadline(p.deadline);
    const pct = p.budget > 0 ? Math.round(((p.paid_amount||0) / p.budget) * 100) : 0;
    const remaining = (p.budget||0) - (p.paid_amount||0);
    return `
    <div class="cp-card">
      <div class="cp-card-header">
        <div class="cp-card-icon">📁</div>
        <div class="cp-card-title">${p.project_name}</div>
        ${statusBadge(p.project_status)}
      </div>
      ${p.description ? `<div class="cp-card-desc">${p.description}</div>` : ''}
      <div class="cp-card-stats">
        <div class="cp-stat">
          <div class="cp-stat-label">Project Value</div>
          <div class="cp-stat-value">₹${(p.budget||0).toLocaleString('en-IN')}</div>
        </div>
        <div class="cp-stat">
          <div class="cp-stat-label">Paid</div>
          <div class="cp-stat-value" style="color:var(--c2)">₹${(p.paid_amount||0).toLocaleString('en-IN')}</div>
        </div>
        <div class="cp-stat">
          <div class="cp-stat-label">Balance</div>
          <div class="cp-stat-value" style="color:var(--c3)">₹${remaining.toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div class="cp-progress-wrap">
        <div class="cp-progress-track">
          <div class="cp-progress-fill" style="width:${pct}%;background:${pct>=100?'var(--c2)':pct>=50?'var(--c1)':'var(--c3)'}"></div>
        </div>
        <span class="cp-pct">${pct}%</span>
      </div>
      ${dl.label !== '—' ? `<div class="cp-deadline"><span class="deadline-badge ${dl.cls}">${dl.label}</span><span class="cp-deadline-date">${p.deadline||''}</span></div>` : ''}
      <div class="cp-card-actions">
        <button class="cp-btn cp-btn-timeline" onclick="openClientProjectTimeline('${timelineProjectKey(p)}')">📅 View Timeline Tracker</button>
        <button class="cp-btn cp-btn-docs"     onclick="openClientProjectDocs()">📄 View Documents</button>
      </div>
    </div>`;
  }).join('');
}

function openClientProjectTimeline(projectKey) {
  navigate('timeline');
  pendingTimelineProjectKey = projectKey;
  setTimeout(() => {
    const sel = document.getElementById('timelineProjectId');
    if (sel) { sel.value = projectKey; loadTimeline(); }
  }, 400);
}

function openClientProjectDocs() {
  navigate('documents');
}
let viewingClientId = null;

function openViewModal(id) {
  viewingClientId = id;
  const c = allClients.find(x => x.id === id);
  document.getElementById('vName').textContent          = c.name || '—';
  document.getElementById('vEmail').textContent         = c.email || '—';
  document.getElementById('vPhone').textContent         = c.phone || '—';
  document.getElementById('vCompany').textContent       = c.company_name || '—';
  document.getElementById('vProject').textContent       = c.project_name || '—';
  document.getElementById('vProjectStatus').innerHTML   = statusBadge(c.project_status);
  document.getElementById('vQuotation').textContent     = '₹' + (c.quotation_amount||0).toLocaleString('en-IN');
  document.getElementById('vPaid').textContent          = '₹' + (c.paid_amount||0).toLocaleString('en-IN');
  document.getElementById('vRemaining').textContent     = '₹' + ((c.quotation_amount||0)-(c.paid_amount||0)).toLocaleString('en-IN');
  document.getElementById('vPaymentStatus').innerHTML   = paymentBadge(c.payment_status);
  document.getElementById('vCreated').textContent       = c.created_at || '—';
  document.getElementById('viewModal').classList.remove('hidden');
}

function closeViewModal() {
  document.getElementById('viewModal').classList.add('hidden');
  viewingClientId = null;
}

function editFromView() {
  closeViewModal();
  openClientModal(viewingClientId);
}

function deleteFromView() {
  closeViewModal();
  deleteClient(viewingClientId);
}

function filterClients() {
  const search=document.getElementById('clientSearch').value.toLowerCase(), statusF=document.getElementById('clientFilter').value, payF=document.getElementById('paymentFilter').value;
  renderClientsTable(allClients.filter(c=>
    (!search||[c.name,c.company_name,c.email,c.project_name].some(v=>(v||'').toLowerCase().includes(search)))&&
    (!statusF||c.project_status===statusF)&&(!payF||c.payment_status===payF)));
}

/* ════════════════════════════════
   FORM VALIDATION — CLIENT MODAL
   All rules match requirements exactly
   ════════════════════════════════ */

// Block non-digits from phone field as user types
function enforcePhoneInput(input) {
  input.value = input.value.replace(/\D/g, '').slice(0, 10);
}

// Block non-letters/spaces from name field as user types
function enforceNameInput(input) {
  input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
}

const CLIENT_FIELD_RULES = {
  // Required | min 2 chars | only letters and spaces
  fName: {
    validate: v => v.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(v.trim()),
    message:  'Full name must be at least 2 characters (letters and spaces only)'
  },
  // Required | valid email format
  fEmail: {
    validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    message:  'Enter a valid email address (e.g. john@company.com)'
  },
  // Required | exactly 10 digits | numbers only
  fPhone: {
    validate: v => /^\d{10}$/.test(v.trim()),
    message:  'Phone must be exactly 10 digits, numbers only'
  },
  // Optional — no rule needed, kept for structure
  fCompany: {
    validate: v => true,
    message:  ''
  },
  // Required | min 2 chars
  fProject: {
    validate: v => v.trim().length >= 2,
    message:  'Project name is required (min 2 characters)'
  },
  // Required | must be positive number (> 0)
  fQuotation: {
    validate: v => v !== '' && !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    message:  'Quotation amount is required and must be greater than 0'
  },
  // Optional | must be a number | cannot exceed quotation
  fPaid: {
    validate: v => {
      if (v === '') return true;
      const p = parseFloat(v);
      const q = parseFloat(document.getElementById('fQuotation')?.value || '0');
      if (isNaN(p) || p < 0) return false;
      if (q > 0 && p > q) return false;
      return true;
    },
    message: 'Paid amount cannot exceed the quotation amount'
  },
};

// Required fields — always validated even if empty
const REQUIRED_FIELDS = ['fName', 'fEmail', 'fPhone', 'fProject', 'fQuotation'];

function setFieldState(fieldId, state, message = '') {
  const fg  = document.getElementById(`fg-${fieldId}`);
  const err = document.getElementById(`err-${fieldId}`);
  if (!fg) return;
  fg.classList.remove('has-error', 'has-success');
  if (state === 'error') {
    fg.classList.add('has-error');
    if (err) err.textContent = message;
  } else if (state === 'success') {
    fg.classList.add('has-success');
    if (err) err.textContent = '';
  } else {
    if (err) err.textContent = '';
  }
}

function validateField(fieldId) {
  const rule  = CLIENT_FIELD_RULES[fieldId];
  if (!rule) return true;
  const input = document.getElementById(fieldId);
  if (!input) return true;
  const val   = input.value;

  // Optional fields with no rule — skip if empty
  if (val === '' && !REQUIRED_FIELDS.includes(fieldId)) {
    setFieldState(fieldId, 'none');
    return true;
  }

  // Required but empty — show error
  if (val === '' && REQUIRED_FIELDS.includes(fieldId)) {
    setFieldState(fieldId, 'error', rule.message);
    return false;
  }

  const ok = rule.validate(val);
  setFieldState(fieldId, ok ? 'success' : 'error', rule.message);
  return ok;
}

function validateClientForm() {
  let ok = true;
  // Validate all required fields
  REQUIRED_FIELDS.forEach(id => { if (!validateField(id)) ok = false; });
  // Validate optional fields only if they have a value
  ['fCompany', 'fPaid'].forEach(id => {
    const v = document.getElementById(id)?.value || '';
    if (v !== '' && !validateField(id)) ok = false;
  });
  return ok;
}

function clearFieldValidation() {
  Object.keys(CLIENT_FIELD_RULES).forEach(id => setFieldState(id, 'none'));
}

function openClientModal(id=null) {
  editingClientId=id;
  document.getElementById('clientModalTitle').textContent=id?'Edit Client':'Add New Client';
  clearFieldValidation();
  if (id) {
    const c=allClients.find(x=>x.id===id);
    document.getElementById('clientId').value=c.id; document.getElementById('fName').value=c.name; document.getElementById('fEmail').value=c.email;
    document.getElementById('fPhone').value=c.phone||''; document.getElementById('fCompany').value=c.company_name||''; document.getElementById('fProject').value=c.project_name||'';
    document.getElementById('fProjectStatus').value=c.project_status; document.getElementById('fQuotation').value=c.quotation_amount; document.getElementById('fPaid').value=c.paid_amount; document.getElementById('fPaymentStatus').value=c.payment_status;
    document.getElementById('fUsername').value=c.client_username||c.name||''; document.getElementById('fClientPassword').value=c.client_password||`${c.name}123`;
  } else {
    ['clientId','fName','fEmail','fPhone','fCompany','fProject','fQuotation','fPaid','fUsername','fClientPassword'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('fProjectStatus').value='Pending'; document.getElementById('fPaymentStatus').value='Due';
  }
  syncClientCredentials();
  document.getElementById('clientModal').classList.remove('hidden');
}

function syncClientCredentials() {
  const creds=generatedCredentials(document.getElementById('fName')?.value);
  const u=document.getElementById('fUsername'), p=document.getElementById('fClientPassword');
  if (u) u.value=creds.username; if (p) p.value=creds.password;
}

function closeClientModal() {
  document.getElementById('clientModal').classList.add('hidden');
  clearFieldValidation();
  editingClientId=null;
}

async function saveClient() {
  if (!validateClientForm()) { showToast('Please fix the errors in the form.','error'); return; }
  const name=document.getElementById('fName').value.trim(), email=document.getElementById('fEmail').value.trim();
  const creds=generatedCredentials(name);
  const payload={ name, email, phone:document.getElementById('fPhone').value.trim(), company_name:document.getElementById('fCompany').value.trim(), project_name:document.getElementById('fProject').value.trim(), project_status:document.getElementById('fProjectStatus').value, quotation_amount:parseFloat(document.getElementById('fQuotation').value)||0, paid_amount:parseFloat(document.getElementById('fPaid').value)||0, payment_status:document.getElementById('fPaymentStatus').value, client_username:creds.username, client_password:creds.password };
  try {
    if (demoMode) {
      if (editingClientId) { const idx=demoClients.findIndex(c=>c.id===editingClientId); demoClients[idx]={...demoClients[idx],...payload}; }
      else { demoClients.push({id:demoNextId++,...payload,created_at:new Date().toISOString().split('T')[0]}); }
      demoActivity.push({id:demoActivity.length+1,action:editingClientId?'Client Updated':'Client Added',detail:`${name} from ${payload.company_name}`,action_type:'client',created_at:new Date().toISOString()});
    } else {
      editingClientId ? await api('PUT',`/clients/${editingClientId}`,payload) : await api('POST','/clients',payload);
    }
    showToast(editingClientId?'Client updated!':'Client added!','success');
    closeClientModal();
    ['clientId','fName','fEmail','fPhone','fCompany','fProject','fQuotation','fPaid','fUsername','fClientPassword'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('fProjectStatus').value='Pending';
    document.getElementById('fPaymentStatus').value='Due';
    await loadClients(); updateSidebarBadges();
    if (currentPage==='dashboard') loadDashboard();
  } catch(err) { showToast(err.message,'error'); }
}

async function deleteClient(id) {
  const c=allClients.find(x=>x.id===id);
  if (!confirm(`Delete client "${c.name}"?`)) return;
  try {
    if (demoMode) { demoClients=demoClients.filter(x=>x.id!==id); demoActivity.push({id:demoActivity.length+1,action:'Client Deleted',detail:`${c.name} removed`,action_type:'client',created_at:new Date().toISOString()}); }
    else await api('DELETE',`/clients/${id}`);
    showToast('Client deleted.','info'); await loadClients(); updateSidebarBadges();
  } catch(err) { showToast(err.message,'error'); }
}

function exportCSV() {
  const headers=['Name','Email','Phone','Company','Project','Status','Payment Status','Quotation','Paid','Remaining'];
  const rows=allClients.map(c=>[c.name,c.email,c.phone,c.company_name,c.project_name,c.project_status,c.payment_status,c.quotation_amount,c.paid_amount,(c.quotation_amount-c.paid_amount)]);
  const csv=[headers,...rows].map(r=>r.map(v=>`"${v||''}"`).join(',')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`nexacrm_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  showToast('CSV exported!','success');
}

/* ════════════════════════════════
   PAYMENTS
   ════════════════════════════════ */
async function loadPayments() {
  let clients;
  if (demoMode) {
    const cid = currentClientId();
    clients = isClientRole()
      ? demoClients.filter(c => Number(c.id) === cid)
      : [...demoClients];
  } else {
    const all = await api('GET', '/clients') || [];
    clients = isClientRole() ? all.filter(c => Number(c.id) === currentClientId()) : all;
  }
  allClients = clients;
  const totalQ=clients.reduce((s,c)=>s+(c.quotation_amount||0),0), totalPaid=clients.reduce((s,c)=>s+(c.paid_amount||0),0);
  document.getElementById('paymentsSummary').innerHTML=`
    <div class="pay-sum-card"><div class="pay-sum-label">Total Quotation</div><div class="pay-sum-value" style="color:var(--c1)">₹${totalQ.toLocaleString('en-IN')}</div></div>
    <div class="pay-sum-card"><div class="pay-sum-label">Total Collected</div><div class="pay-sum-value" style="color:var(--c2)">₹${totalPaid.toLocaleString('en-IN')}</div></div>
    <div class="pay-sum-card"><div class="pay-sum-label">Total Pending</div><div class="pay-sum-value" style="color:var(--c3)">₹${(totalQ-totalPaid).toLocaleString('en-IN')}</div></div>`;
  document.getElementById('paymentsTbody').innerHTML=clients.map((c,i)=>`
    <tr>
      <td class="row-num">${String(i+1).padStart(2,'0')}</td><td><strong style="color:var(--text-primary)">${c.name}</strong></td><td>${c.project_name||'—'}</td>
      <td>₹${(c.quotation_amount||0).toLocaleString('en-IN')}</td><td>₹${(c.paid_amount||0).toLocaleString('en-IN')}</td><td>₹${((c.quotation_amount||0)-(c.paid_amount||0)).toLocaleString('en-IN')}</td>
      <td>${paymentBadge(c.payment_status)}</td><td>${!isClientRole()?`<button class="btn-sm" onclick="openPaymentModal(${c.id})">Update →</button>`:'—'}</td>
    </tr>`).join('');
  return;
  document.getElementById('paymentsTbody').innerHTML=clients.map((c,i)=>`
    <tr>
      <td class="row-num">${String(i+1).padStart(2,'0')}</td>
      <td><strong style="color:var(--text-primary)">${c.name}</strong></td>
      <td>${c.project_name||''}</td>
      <td></td><td></td><td></td><td></td>
      <td class="action-icons ${isClientRole()?'hidden':''}">
        <span class="icon-btn icon-view" title="View Details" onclick="openViewModal(${c.id})">👁</span>
        <span class="icon-btn icon-edit" title="Edit Client" onclick="openClientModal(${c.id})">✏️</span>
        <span class="icon-btn icon-delete" title="Delete Client" onclick="deleteClient(${c.id})">🗑️</span>
      </td>
    </tr>`).join('');
}

async function loadPayments() {
  let clients;
  if (demoMode) {
    const cid = currentClientId();
    clients = isClientRole()
      ? demoClients.filter(c => Number(c.id) === cid)
      : [...demoClients];
  } else {
    const all = await api('GET', '/clients') || [];
    clients = isClientRole() ? all.filter(c => Number(c.id) === currentClientId()) : all;
  }
  allClients = clients;
  const totalQ = clients.reduce((s, c) => s + Number(c.quotation_amount || 0), 0);
  const totalPaid = clients.reduce((s, c) => s + Number(c.paid_amount || 0), 0);
  document.getElementById('paymentsSummary').innerHTML = `
    <div class="pay-sum-card"><div class="pay-sum-label">Total Quotation</div><div class="pay-sum-value" style="color:var(--c1)">Rs ${totalQ.toLocaleString('en-IN')}</div></div>
    <div class="pay-sum-card"><div class="pay-sum-label">Total Collected</div><div class="pay-sum-value" style="color:var(--c2)">Rs ${totalPaid.toLocaleString('en-IN')}</div></div>
    <div class="pay-sum-card"><div class="pay-sum-label">Total Pending</div><div class="pay-sum-value" style="color:var(--c3)">Rs ${(totalQ - totalPaid).toLocaleString('en-IN')}</div></div>`;
  document.getElementById('paymentsTbody').innerHTML = clients.map((c, i) => {
    const total = Number(c.quotation_amount || 0);
    const paid = Number(c.paid_amount || 0);
    const remaining = total - paid;
    return `
    <tr>
      <td class="row-num">${String(i + 1).padStart(2, '0')}</td>
      <td><strong style="color:var(--text-primary)">${rnEscapeHtml(c.name)}</strong></td>
      <td>${rnEscapeHtml(c.project_name || '-')}</td>
      <td>Rs ${total.toLocaleString('en-IN')}</td>
      <td>Rs ${paid.toLocaleString('en-IN')}</td>
      <td>Rs ${remaining.toLocaleString('en-IN')}</td>
      <td>${paymentBadge(c.payment_status)}</td>
      <td class="action-icons ${isClientRole() ? 'hidden' : ''}">
        <span class="icon-btn icon-edit" title="Edit Payment" onclick="openPaymentModal(${c.id})">✎</span>
      </td>
    </tr>`;
  }).join('');
}

function openPaymentModal(clientId) {
  const c = allClients.find(x => Number(x.id) === Number(clientId));
  if (!c) return;
  document.getElementById('payClientId').value = clientId;
  document.getElementById('payClientName').textContent = c.name || 'Client';
  document.getElementById('payProjectName').textContent = c.project_name || 'No project added';
  document.getElementById('payProjectInput').value = c.project_name || '';
  document.getElementById('payTotalAmount').textContent = `Rs ${Number(c.quotation_amount || 0).toLocaleString('en-IN')}`;
  document.getElementById('payPaidAmount').value = Number(c.paid_amount || 0);
  document.getElementById('payStatus').value = c.payment_status || 'Due';
  updatePaymentPreview();
  document.getElementById('paymentModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('payPaidAmount')?.focus(), 120);
}
function closePaymentModal() { document.getElementById('paymentModal').classList.add('hidden'); }

function updatePaymentPreview() {
  const cid = parseInt(document.getElementById('payClientId')?.value || '0', 10);
  const c = allClients.find(x => Number(x.id) === Number(cid));
  const total = Number(c?.quotation_amount || 0);
  const paid = Number(document.getElementById('payPaidAmount')?.value || 0);
  const remaining = Math.max(total - paid, 0);
  const status = document.getElementById('payStatus')?.value || 'Due';
  const remainingEl = document.getElementById('payRemainingAmount');
  const hint = document.getElementById('payEditHint');
  if (remainingEl) remainingEl.textContent = `Rs ${remaining.toLocaleString('en-IN')}`;
  if (hint) {
    hint.textContent = status === 'Paid'
      ? 'Marked as paid. Check that remaining amount is zero.'
      : status === 'Partial'
        ? 'Partial payment saved. Remaining balance will stay pending.'
        : 'No full payment yet. This client will remain due.';
  }
}

async function savePayment() {
  const cid=parseInt(document.getElementById('payClientId').value), paid=parseFloat(document.getElementById('payPaidAmount').value)||0, status=document.getElementById('payStatus').value, project_name=document.getElementById('payProjectInput')?.value.trim() || '';
  try {
    if (demoMode) { const idx=demoClients.findIndex(x=>x.id===cid); if (idx > -1) demoClients[idx].project_name=project_name; }
    if (demoMode) { const idx=demoClients.findIndex(x=>x.id===cid); demoClients[idx].paid_amount=paid; demoClients[idx].payment_status=status; demoActivity.push({id:demoActivity.length+1,action:'Payment Updated',detail:`₹${paid.toLocaleString('en-IN')} for ${demoClients[idx].name}`,action_type:'payment',created_at:new Date().toISOString()}); }
    else { const c=allClients.find(x=>x.id===cid); await api('PUT',`/clients/${cid}`,{...c,project_name,paid_amount:paid,payment_status:status}); }
    showToast('Payment updated!','success'); closePaymentModal(); loadPayments();
  } catch(err) { showToast(err.message,'error'); }
}

/* ════════════════════════════════
   DOCUMENTS
   ════════════════════════════════ */
async function loadDocuments() {
  let docs;
  if (demoMode) {
    const cid = currentClientId();
    docs = isClientRole()
      ? demoDocs.filter(d => Number(d.client_id) === cid)
      : [...demoDocs];
  } else {
    const all = await api('GET', '/documents') || [];
    docs = isClientRole() ? all.filter(d => Number(d.client_id) === currentClientId()) : all;
  }
  const grid=document.getElementById('docGrid');
  if (!docs.length) { grid.innerHTML=`<div class="empty-state"><div class="empty-state-icon">▣</div><div class="empty-state-text">No documents uploaded yet</div></div>`; return; }
  grid.innerHTML=docs.map(d=>`
    <div class="doc-card">
      <div class="doc-icon">${(d.file_type||'').includes('pdf')?'📄':'📝'}</div>
      <div class="doc-title">${d.title}</div>
      <div class="doc-client">👤 ${d.client_name||'Unknown'} — ${d.company_name||''}</div>
      <div class="doc-date">📅 ${formatDate(d.uploaded_at)}</div>
      <div class="doc-actions"><button class="btn-download" onclick="downloadDoc(${d.id})">⬇ Download</button>${!isClientRole()?`<button class="btn-delete" onclick="deleteDoc(${d.id})">✕</button>`:''}</div>
    </div>`).join('');
}

async function openDocModal() {
  const clients=demoMode?demoClients:(await api('GET','/clients')||[]);
  document.getElementById('docClientId').innerHTML=clients.map(c=>`<option value="${c.id}">${c.name} — ${c.company_name||''}</option>`).join('');
  document.getElementById('docTitle').value=''; document.getElementById('fileDropLabel').textContent='📎 Click to select file'; selectedDocFile=null;
  document.getElementById('docModal').classList.remove('hidden');
}
function closeDocModal() { document.getElementById('docModal').classList.add('hidden'); }
function onFileSelect(e) { const f=e.target.files[0]; if(f){selectedDocFile=f;document.getElementById('fileDropLabel').textContent=`✅ ${f.name}`;} }

async function uploadDoc() {
  const clientId=document.getElementById('docClientId').value, title=document.getElementById('docTitle').value.trim();
  if (!title||!selectedDocFile) { showToast('Please fill title and select a file.','error'); return; }
  try {
    if (demoMode) {
      const client=demoClients.find(c=>c.id==clientId);
      demoDocs.push({id:demoDocs.length+1,client_id:parseInt(clientId),client_name:client?.name||'',company_name:client?.company_name||'',title,file_name:selectedDocFile.name,file_type:selectedDocFile.type,uploaded_at:new Date().toISOString()});
      demoActivity.push({id:demoActivity.length+1,action:'File Uploaded',detail:`"${title}" uploaded`,action_type:'file',created_at:new Date().toISOString()});
    } else {
      const fd=new FormData(); fd.append('clientId',clientId); fd.append('title',title); fd.append('file',selectedDocFile);
      await api('POST','/documents/upload',fd,true);
    }
    showToast('Document uploaded!','success'); closeDocModal(); loadDocuments();
  } catch(err) { showToast(err.message,'error'); }
}

function downloadDoc(id) {
  if (demoMode) { showToast('Start backend to enable real downloads.','info'); return; }
  window.open(`${API_BASE}/documents/${id}/download`,`_blank`);
}

async function deleteDoc(id) {
  if (isClientRole()) { showToast('You do not have permission to delete documents.','error'); return; }
  if (!confirm('Delete this document?')) return;
  if (demoMode) { demoDocs=demoDocs.filter(d=>d.id!==id); }
  else await api('DELETE',`/documents/${id}`);
  showToast('Document deleted.','info'); loadDocuments();
}

/* ════════════════════════════════
   NOTES
   ════════════════════════════════ */
async function loadNotes() {
  const notes=demoMode?clientScope([...demoNotes].reverse(), 'client_id'):(await api('GET','/notes')||[]);
  const container=document.getElementById('notesContainer');
  if (!notes.length) { container.innerHTML=`<div class="empty-state"><div class="empty-state-icon">◧</div><div class="empty-state-text">No notes added yet</div></div>`; return; }
  container.innerHTML=notes.map(n=>`
    <div class="note-card">
      <div class="note-client">📌 ${n.client_name||'Client'} — ${n.company_name||''}</div>
      <div class="note-text">${n.text}</div>
      <div class="note-time">🕐 ${formatDate(n.created_at)}</div>
    </div>`).join('');
}

async function openNoteModal() {
  const clients=demoMode?demoClients:(await api('GET','/clients')||[]);
  document.getElementById('noteClientId').innerHTML=clients.map(c=>`<option value="${c.id}">${c.name} — ${c.company_name||''}</option>`).join('');
  document.getElementById('noteText').value='';
  document.getElementById('noteModal').classList.remove('hidden');
}
function closeNoteModal() { document.getElementById('noteModal').classList.add('hidden'); }

async function saveNote() {
  const clientId=parseInt(document.getElementById('noteClientId').value), text=document.getElementById('noteText').value.trim();
  if (!text) { showToast('Please write a note.','error'); return; }
  try {
    if (demoMode) {
      const client=demoClients.find(c=>c.id===clientId);
      demoNotes.push({id:demoNotes.length+1,client_id:clientId,client_name:client?.name||'',company_name:client?.company_name||'',text,created_at:new Date().toISOString()});
    } else { await api('POST','/notes',{clientId,text}); }
    showToast('Note saved!','success'); closeNoteModal(); loadNotes();
  } catch(err) { showToast(err.message,'error'); }
}

/* ════════════════════════════════
   ACTIVITY LOG
   ════════════════════════════════ */
async function loadActivity() {
  let logs=demoMode?[...demoActivity].reverse():(await api('GET','/activity')||[]);
  if (isClientRole()) {
    const name = clientName().toLowerCase();
    logs = logs.filter(a => (a.detail || '').toLowerCase().includes(name));
  }
  const container=document.getElementById('activityFull');
  if (!logs.length) { container.innerHTML=`<div class="empty-state"><div class="empty-state-icon">◌</div><div class="empty-state-text">No activity yet</div></div>`; return; }
  container.innerHTML=logs.map(a=>`
    <div class="activity-entry">
      <div class="act-icon-wrap" style="background:${activityColor(a.action_type)}22;color:${activityColor(a.action_type)}">${activityIcon(a.action_type)}</div>
      <div class="act-body">
        <div class="act-action">${a.action} — <span style="color:var(--text-secondary);font-weight:400">${a.detail}</span></div>
        <div class="act-time">${formatDate(a.created_at)}</div>
      </div>
    </div>`).join('');
}


/* ════════════════════════════════
   CLIENT PROFILE PAGE
   ════════════════════════════════ */
let currentProfileClientId = null;

async function openClientProfile(id) {
  currentProfileClientId = id;
  navigate('clientprofile');
  const c = allClients.find(x => x.id === id) || (await api('GET', `/clients/${id}`));
  if (!c) return;

  // Avatar initial
  document.getElementById('profileAvatar').textContent = c.name.charAt(0).toUpperCase();

  // Hero info
  document.getElementById('profileName').textContent    = c.name;
  document.getElementById('profileCompany').textContent = c.company_name || 'No Company';
  document.getElementById('profileStatusBadge').innerHTML = statusBadge(c.project_status);
  document.getElementById('profilePayBadge').innerHTML    = paymentBadge(c.payment_status);

  // Stats row
  const remaining = (c.quotation_amount||0) - (c.paid_amount||0);
  const pct = c.quotation_amount > 0 ? Math.round((c.paid_amount / c.quotation_amount) * 100) : 0;
  document.getElementById('profileStats').innerHTML = `
    <div class="pstat-card">
      <div class="pstat-label">Total Quotation</div>
      <div class="pstat-value" style="color:var(--c1)">₹${(c.quotation_amount||0).toLocaleString('en-IN')}</div>
    </div>
    <div class="pstat-card">
      <div class="pstat-label">Amount Paid</div>
      <div class="pstat-value" style="color:var(--c2)">₹${(c.paid_amount||0).toLocaleString('en-IN')}</div>
    </div>
    <div class="pstat-card">
      <div class="pstat-label">Remaining</div>
      <div class="pstat-value" style="color:var(--c3)">₹${remaining.toLocaleString('en-IN')}</div>
    </div>
    <div class="pstat-card">
      <div class="pstat-label">Paid</div>
      <div class="pstat-value" style="color:var(--c4)">${pct}%</div>
    </div>`;

  // Personal info list
  document.getElementById('profileInfoList').innerHTML = `
    <div class="pinfo-row"><span class="pinfo-label">Full Name</span><span class="pinfo-value">${c.name}</span></div>
    <div class="pinfo-row"><span class="pinfo-label">Email</span><span class="pinfo-value">${c.email}</span></div>
    <div class="pinfo-row"><span class="pinfo-label">Phone</span><span class="pinfo-value">${c.phone||'—'}</span></div>
    <div class="pinfo-row"><span class="pinfo-label">Company</span><span class="pinfo-value">${c.company_name||'—'}</span></div>
    <div class="pinfo-row"><span class="pinfo-label">Client Since</span><span class="pinfo-value">${c.created_at||'—'}</span></div>`;

  // BUG 5 FIX — fetch dedicated projects, fall back to client's project_name field
  const projData = demoMode
    ? demoProjects.filter(p => p.client_id === id)
    : (await api('GET', `/projects?clientId=${id}`) || []);

  if (projData.length) {
    document.getElementById('profileProjectList').innerHTML = projData.map(p => `
      <div class="pinfo-row"><span class="pinfo-label">Project</span><span class="pinfo-value">${p.project_name}</span></div>
      <div class="pinfo-row"><span class="pinfo-label">Status</span><span class="pinfo-value">${statusBadge(p.project_status)}</span></div>
      <div class="pinfo-row"><span class="pinfo-label">Project Value</span><span class="pinfo-value">₹${(p.budget||0).toLocaleString('en-IN')}</span></div>
      <div class="pinfo-row"><span class="pinfo-label">Payment</span><span class="pinfo-value">${paymentBadge(p.payment_status)}</span></div>
      ${projData.length > 1 ? '<hr style="border:none;border-top:1px solid var(--border);margin:6px 0">' : ''}
    `).join('');
  } else {
    document.getElementById('profileProjectList').innerHTML = `
      <div class="pinfo-row"><span class="pinfo-label">Project</span><span class="pinfo-value">${c.project_name||'—'}</span></div>
      <div class="pinfo-row"><span class="pinfo-label">Status</span><span class="pinfo-value">${statusBadge(c.project_status)}</span></div>
      <div class="pinfo-row"><span class="pinfo-label">Payment</span><span class="pinfo-value">${paymentBadge(c.payment_status)}</span></div>`;
  }

  // Progress bar
  document.getElementById('profileProgressPct').textContent  = pct + '%';
  document.getElementById('profileProgressFill').style.width = pct + '%';
  document.getElementById('profileProgressFill').style.background =
    pct >= 100 ? 'var(--c2)' : pct >= 50 ? 'var(--c1)' : 'var(--c3)';

  // Notes
  const allNotes = demoMode ? demoNotes : (await api('GET', '/notes') || []);
  const clientNotes = allNotes.filter(n => n.client_id === id);
  document.getElementById('profileNotesList').innerHTML = clientNotes.length
    ? clientNotes.map(n => `
        <div class="pnote-item">
          <div class="pnote-text">${n.text}</div>
          <div class="pnote-time">🕐 ${formatDate(n.created_at)}</div>
        </div>`).join('')
    : `<div class="pempty">No notes yet</div>`;

  // Documents
  const allDocs = demoMode ? demoDocs : (await api('GET', '/documents') || []);
  const clientDocs = allDocs.filter(d => d.client_id === id);
  document.getElementById('profileDocsList').innerHTML = clientDocs.length
    ? clientDocs.map(d => `
        <div class="pdoc-item">
          <span>${(d.file_type||'').includes('pdf') ? '📄' : '📝'} ${d.title}</span>
          <span class="pdoc-date">${formatDate(d.uploaded_at)}</span>
        </div>`).join('')
    : `<div class="pempty">No documents uploaded</div>`;

  // Activity
  const allAct = demoMode ? [...demoActivity].reverse() : (await api('GET', '/activity') || []);
  const clientAct = allAct.filter(a => a.detail && a.detail.toLowerCase().includes(c.name.toLowerCase())).slice(0, 5);
  document.getElementById('profileActivityList').innerHTML = clientAct.length
    ? clientAct.map(a => `
        <div class="pact-item">
          <span class="pact-dot" style="background:${activityColor(a.action_type)}"></span>
          <div>
            <div class="pact-action">${a.action}</div>
            <div class="pact-time">${formatDate(a.created_at)}</div>
          </div>
        </div>`).join('')
    : `<div class="pempty">No activity recorded</div>`;
}

function editCurrentClient() {
  closeViewModal();
  openClientModal(currentProfileClientId);
}

function deleteCurrentClient() {
  deleteClient(currentProfileClientId);
  navigate('clients');
}

function printClientProfile() {
  const c = allClients.find(x=>x.id===currentProfileClientId) || demoClients.find(x=>x.id===currentProfileClientId);
  if (!c) return;
  const remaining = (c.quotation_amount||0)-(c.paid_amount||0);
  const pct = c.quotation_amount>0?Math.round(c.paid_amount/c.quotation_amount*100):0;
  const win = window.open('','_blank');
  win.document.write(`<html><head><title>Client Profile — ${c.name}</title>
  <style>
    body{font-family:sans-serif;padding:40px;color:#1a1e2e;background:#fff;max-width:800px;margin:0 auto}
    h1{color:#6c63ff;font-size:24px;margin-bottom:4px}
    .sub{color:#888;font-size:14px;margin-bottom:28px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
    .stat{background:#f5f6fa;padding:16px;border-radius:8px;text-align:center}
    .stat-val{font-size:20px;font-weight:800;color:#6c63ff}
    .stat-lbl{font-size:11px;color:#888;margin-top:4px;text-transform:uppercase}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th{background:#6c63ff;color:#fff;padding:10px 14px;text-align:left;font-size:13px}
    td{padding:10px 14px;border-bottom:1px solid #eee;font-size:13px;color:#555}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#eef0ff;color:#6c63ff}
    .progress-bar{height:10px;background:#eee;border-radius:5px;overflow:hidden;margin-top:6px}
    .progress-fill{height:100%;background:#6c63ff;border-radius:5px}
    .footer{text-align:center;color:#aaa;font-size:12px;margin-top:40px;border-top:1px solid #eee;padding-top:16px}
  </style></head><body>
  <h1>${c.name}</h1>
  <div class="sub">${c.company_name||''} • Generated on ${new Date().toLocaleDateString('en-IN')}</div>
  <div class="stats">
    <div class="stat"><div class="stat-val">₹${(c.quotation_amount||0).toLocaleString('en-IN')}</div><div class="stat-lbl">Quotation</div></div>
    <div class="stat"><div class="stat-val">₹${(c.paid_amount||0).toLocaleString('en-IN')}</div><div class="stat-lbl">Paid</div></div>
    <div class="stat"><div class="stat-val">₹${remaining.toLocaleString('en-IN')}</div><div class="stat-lbl">Remaining</div></div>
    <div class="stat"><div class="stat-val">${pct}%</div><div class="stat-lbl">Progress</div></div>
  </div>
  <table>
    <tr><th colspan="2">Client Information</th></tr>
    <tr><td>Full Name</td><td>${c.name}</td></tr>
    <tr><td>Email</td><td>${c.email}</td></tr>
    <tr><td>Phone</td><td>${c.phone||'—'}</td></tr>
    <tr><td>Company</td><td>${c.company_name||'—'}</td></tr>
    <tr><td>Project</td><td>${c.project_name||'—'}</td></tr>
    <tr><td>Project Status</td><td><span class="badge">${c.project_status}</span></td></tr>
    <tr><td>Payment Status</td><td><span class="badge">${c.payment_status}</span></td></tr>
    <tr><td>Client Since</td><td>${c.created_at||'—'}</td></tr>
  </table>
  <div style="margin-bottom:8px;font-weight:600;font-size:13px">Payment Progress</div>
  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  <div class="footer">Printed from NexaCRM • Confidential</div>
  </body></html>`);
  win.document.close();
  setTimeout(()=>win.print(),500);
  showToast('Profile opened for printing!','success');
}

function openNoteForClient() {
  populateClientDropdown('noteClientId');
  document.getElementById('noteClientId').value = currentProfileClientId;
  document.getElementById('noteText').value = '';
  document.getElementById('noteModal').classList.remove('hidden');
}

function openDocForClient() {
  populateClientDropdown('docClientId');
  document.getElementById('docClientId').value = currentProfileClientId;
  document.getElementById('docTitle').value = '';
  document.getElementById('fileDropLabel').textContent = '📎 Click to select file';
  selectedDocFile = null;
  document.getElementById('docModal').classList.remove('hidden');
}


/* ════════════════════════════════
   ENQUIRIES
   ════════════════════════════════ */
let enquiries = [
  { id:316, enquiry_id:'316', name:'Jones Peter T',        email:'jonespetersoftware@gmail.com',       phone:'9597497429', service:'Main Website',                    message:'', status:'New', created_at:'2026-05-14' },
  { id:315, enquiry_id:'315', name:'Mathanraj S',          email:'mathanmathanraj030@gmail.com',       phone:'9163817789', service:'Internship Website',              message:'', status:'New', created_at:'2026-05-14' },
  { id:314, enquiry_id:'',    name:'Sanjeev Kumar M',      email:'sanjeevmanickam2002@gmail.com',      phone:'9345064249', service:'Main Website - Network Engineer', message:'', status:'New', created_at:'2026-05-11' },
  { id:313, enquiry_id:'313', name:'Vaishnavi M',          email:'vaishnavi.m.appdev@gmail.com',       phone:'6385542771', service:'Main Website',                    message:'', status:'New', created_at:'2026-05-10' },
  { id:312, enquiry_id:'312', name:'Subasri M',            email:'subasrim29@gmail.com',               phone:'7305195493', service:'Internship Website',              message:'', status:'New', created_at:'2026-05-05' },
  { id:311, enquiry_id:'311', name:'Ashika A',             email:'siranashika07_bai28@mepcoeng.ac.in', phone:'6385712973', service:'Internship Website',              message:'', status:'New', created_at:'2026-05-03' },
  { id:310, enquiry_id:'310', name:'Meena Raja Kalyani D', email:'dmpmrk@gmail.com',                   phone:'7358895673', service:'Internship Website',              message:'', status:'New', created_at:'2026-05-03' },
  { id:309, enquiry_id:'309', name:'Jenicadeva Christa S', email:'jenicasamuel725@gmail.com',           phone:'9361099083', service:'Internship Website',              message:'', status:'New', created_at:'2026-05-03' },
  { id:308, enquiry_id:'308', name:'Priya Dharshini',      email:'priyadharshini.e203@gmail.com',      phone:'7448472046', service:'Internship Website',              message:'', status:'New', created_at:'2026-05-01' },
  { id:307, enquiry_id:'307', name:'Samrat Shaurya Jha',   email:'shauryajhasamrat@gmail.com',         phone:'8090769735', service:'Internship Website',              message:'', status:'New', created_at:'2026-04-30' },
  { id:306, enquiry_id:'306', name:'Raj',                  email:'raj34@gmail.com',                    phone:'8768756598', service:'Roriri IT Park - ContactInquiry', message:'', status:'New', created_at:'2026-04-30' },
  { id:305, enquiry_id:'305', name:'Raj',                  email:'rajkarthi546545@gmail.com',          phone:'4545645654', service:'Nexgen IT Academy',               message:'', status:'New', created_at:'2026-04-30' },
  { id:304, enquiry_id:'304', name:'Ananthi B',            email:'ananthiananthib70@gmail.com',        phone:'9025490684', service:'Main Website',                    message:'', status:'New', created_at:'2026-04-29' },
  { id:303, enquiry_id:'303', name:'Nathiya K',            email:'nathiyak890@gmail.com',              phone:'9080085105', service:'Internship Website',              message:'', status:'New', created_at:'2026-04-28' },
  { id:302, enquiry_id:'302', name:'Kissor Raj',           email:'kishoreraj15032007@gmail.com',       phone:'960055313',  service:'Internship Website',              message:'', status:'New', created_at:'2026-04-24' },
];
let demoEnqNextId = 317;

async function loadEnquiries() {
  if (!demoMode) {
    const liveData = await api('GET', '/enquiries');
    if (liveData) enquiries = liveData;
  }
  const data = enquiries;
  const tbody = document.getElementById('enquiriesTbody');
  const sourceFilter = document.getElementById('enquirySourceFilter');
  const selectedSource = sourceFilter?.value || '';
  const statusFilter = document.getElementById('enquiryStatusFilter')?.value || '';
  const dateFilter = document.getElementById('enquiryDateFilter')?.value || '';
  const search = (document.getElementById('enquirySearch')?.value || '').trim().toLowerCase();
  populateEnquirySourceFilter(data, selectedSource);
  const filtered = data.filter(e => {
    const source = getEnquirySourceLabel(e);
    const haystack = `${e.name || ''} ${e.email || ''} ${e.phone || ''}`.toLowerCase();
    return (!search || haystack.includes(search))
      && (!selectedSource || source === selectedSource)
      && (!dateFilter || String(e.created_at || '').slice(0, 10) === dateFilter)
      && (!statusFilter || (e.status || 'New') === statusFilter);
  });
  if (!filtered.length) { tbody.innerHTML=`<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">◐</div><div class="empty-state-text">No enquiries found</div></div></td></tr>`; return; }
  tbody.innerHTML = filtered.map((e,i)=>`
    <tr>
      <td class="row-num">${String(i+1).padStart(2,'0')}</td>
      <td>${e.enquiry_id !== undefined ? (e.enquiry_id || '—') : (e.enquiryId || e.id || '—')}</td>
      <td>${rnEscapeHtml(getEnquirySourceLabel(e) || '—')}</td>
      <td><strong style="color:var(--text-primary)">${e.name}</strong></td>
      <td>${e.email||'—'}</td>
      <td>${e.phone||'—'}</td>
      <td>${enquiryBadge(e.status)}</td>
      <td>${formatEnquiryDate(e.created_at)}</td>
      <td class="action-icons">
        <span class="icon-btn icon-edit"   title="Edit"   onclick="openEnquiryModal(${e.id})">✏️</span>
        <span class="icon-btn icon-delete" title="Delete" onclick="deleteEnquiry(${e.id})">🗑️</span>
      </td>
    </tr>`).join('');
}

function populateEnquirySourceFilter(data, selectedValue = '') {
  const select = document.getElementById('enquirySourceFilter');
  if (!select) return;
  const sources = [...new Set(data.map(getEnquirySourceLabel).filter(Boolean))].sort();
  select.innerHTML = `<option value="">All Sources</option>${sources.map(source => `<option value="${rnEscapeHtml(source)}">${rnEscapeHtml(source)}</option>`).join('')}`;
  if (sources.includes(selectedValue)) select.value = selectedValue;
}

function getEnquirySourceLabel(e = {}) {
  if (e.source_name) return e.source_name;
  if (e.service) return e.service;
  return e.source && e.source !== 'erp' ? e.source : '';
}

function formatEnquiryDate(value) {
  const date = new Date(`${String(value || '').slice(0, 10)}T00:00:00`);
  if (!value || Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function enquiryBadge(s) {
  const map = { New:'due', Contacted:'partial', Converted:'completed', Closed:'progress' };
  return `<span class="badge badge-${map[s]||'due'}">${s || 'New'}</span>`;
}

let editingEnquiryId = null;
function openEnquiryModal(id=null) {
  editingEnquiryId = id;
  if (id) {
    const e = enquiries.find(x=>x.id===id) || {};
    if (e.source === 'erp') {
      editingEnquiryId = null;
      showToast('ERP enquiry records are read-only here', 'info');
      return;
    }
    document.getElementById('eqName').value    = e.name||'';
    document.getElementById('eqEmail').value   = e.email||'';
    document.getElementById('eqPhone').value   = e.phone||'';
    document.getElementById('eqService').value = e.service||'';
    document.getElementById('eqStatus').value  = e.status||'New';
    document.getElementById('eqMessage').value = e.message||'';
  } else {
    ['eqName','eqEmail','eqPhone','eqService','eqMessage'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('eqStatus').value='New';
  }
  document.getElementById('enquiryModal').classList.remove('hidden');
}
function closeEnquiryModal() { document.getElementById('enquiryModal').classList.add('hidden'); editingEnquiryId=null; }

async function saveEnquiry() {
  const name = document.getElementById('eqName').value.trim();
  if (!name) { showToast('Name is required','error'); return; }
  const payload = { name, email:document.getElementById('eqEmail').value.trim(), phone:document.getElementById('eqPhone').value.trim(), service:document.getElementById('eqService').value.trim(), message:document.getElementById('eqMessage').value.trim(), status:document.getElementById('eqStatus').value };
  try {
    if (editingEnquiryId) {
      if (demoMode) {
        const idx = enquiries.findIndex(e => e.id === editingEnquiryId);
        if (idx > -1) enquiries[idx] = { ...enquiries[idx], ...payload };
      } else {
        await api('PUT', `/enquiries/${editingEnquiryId}`, payload);
      }
    } else {
      if (demoMode) {
        const id = demoEnqNextId++;
        enquiries.unshift({ id, enquiry_id:String(id), ...payload, created_at:new Date().toISOString().split('T')[0] });
      } else {
        await api('POST', '/enquiries', payload);
      }
    }
    showToast(editingEnquiryId?'Enquiry updated!':'Enquiry saved!','success');
    closeEnquiryModal(); loadEnquiries(); updateSidebarBadges();
  } catch(err) { showToast(err.message,'error'); }
}

async function deleteEnquiry(id) {
  if (!confirm('Delete this enquiry?')) return;
  const e = enquiries.find(x => String(x.id) === String(id));
  if (e?.source === 'erp') {
    showToast('ERP enquiry records are read-only here', 'info');
    return;
  }
  if (demoMode) enquiries = enquiries.filter(e => e.id !== id);
  else await api('DELETE', `/enquiries/${id}`);
  showToast('Enquiry deleted','info'); loadEnquiries(); updateSidebarBadges();
}

/* ════════════════════════════════
   MESSAGES
   ════════════════════════════════ */
let demoMessages = [
  { id:1, client_id:1, sender:'client', content:'Hello! When will my project be ready?', created_at:'2025-04-20 10:00:00' },
  { id:2, client_id:1, sender:'admin',  content:'Hi Arjun! Your project is 60% complete. Expected delivery in 2 weeks.', created_at:'2025-04-20 10:30:00' },
  { id:3, client_id:2, sender:'client', content:'Can I see the project mockup?', created_at:'2025-04-21 09:00:00' },
];
let activeMsgClientId = null;

function messageInitial(name) {
  return (String(name || 'Client').trim().charAt(0) || 'C').toUpperCase();
}

async function loadMessages() {
  let clients;
  if (demoMode) {
    const cid = currentClientId();
    clients = isClientRole()
      ? demoClients.filter(c => Number(c.id) === cid)
      : [...demoClients];
  } else {
    const all = await api('GET', '/clients') || [];
    clients = isClientRole() ? all.filter(c => Number(c.id) === currentClientId()) : all;
  }
  const list = document.getElementById('msgClientList');
  list.innerHTML = clients.map(c=>`
    <div class="msg-client-item ${activeMsgClientId===c.id?'active':''}" onclick='openChat(event,${c.id},${JSON.stringify(c.name || 'Client')})'>
      <div class="msg-client-avatar">${messageInitial(c.name)}</div>
      <div class="msg-client-info">
        <div class="msg-client-name">${escapeHtml(c.name || 'Client')}</div>
        <div class="msg-client-company">${c.company_name||'—'}</div>
      </div>
    </div>`).join('');
  if (isClientRole() && clients[0]) {
    openChat(null, clients[0].id, clients[0].name);
  }
}

async function openChat(event, clientId, clientName) {
  activeMsgClientId = clientId;
  // Highlight selected
  document.querySelectorAll('.msg-client-item').forEach(el=>el.classList.remove('active'));
  if (event?.currentTarget) event.currentTarget.classList.add('active');

  const msgs = demoMode ? demoMessages.filter(m=>m.client_id===clientId) : (await api('GET',`/messages/${clientId}`)||[]);
  const chatArea = document.getElementById('msgChatArea');
  chatArea.innerHTML = `
    <div class="msg-chat-header">
      <div class="msg-chat-avatar">${messageInitial(clientName)}</div>
      <div>
        <div class="msg-chat-name">${escapeHtml(clientName || 'Client')}</div>
        <div class="msg-chat-status">● Online</div>
      </div>
    </div>
    <div class="msg-chat-body" id="msgChatBody">
      ${msgs.length ? msgs.map(m=>`
        <div class="msg-bubble-wrap ${m.sender===(isClientRole()?'client':'admin')?'sent':'received'}">
          <div class="msg-bubble ${m.sender===(isClientRole()?'client':'admin')?'bubble-sent':'bubble-received'}">
            ${escapeHtml(m.content)}
            <div class="msg-time">${formatDate(m.created_at)}</div>
          </div>
        </div>`).join('') : '<div class="pempty" style="margin-top:40px">No messages yet. Start the conversation!</div>'}
    </div>
    <div class="msg-input-area">
      <input type="text" id="msgInput" placeholder="Type a message…" onkeypress="if(event.key==='Enter')sendMessage()"/>
      <button class="btn-send" onclick="sendMessage()">Send ➤</button>
    </div>`;
  // Scroll to bottom
  setTimeout(()=>{ const b=document.getElementById('msgChatBody'); if(b){ b.style.scrollBehavior='smooth'; b.scrollTop=b.scrollHeight; } }, 150);
}

async function sendMessage() {
  const input = document.getElementById('msgInput');
  const content = input?.value.trim();
  if (!content || !activeMsgClientId) return;
  try {
    if (demoMode) {
      demoMessages.push({id:demoMessages.length+1, client_id:activeMsgClientId, sender:isClientRole()?'client':'admin', content, created_at:new Date().toISOString()});
    } else {
      await api('POST','/messages',{client_id:activeMsgClientId, content});
    }
    input.value='';
    await openChat(null, activeMsgClientId, document.querySelector('.msg-chat-name')?.textContent||'Client');
    updateSidebarBadges();
  } catch(err) { showToast(err.message,'error'); }
}

/* ════════════════════════════════
   LOGOUT CONFIRMATION
   ════════════════════════════════ */
let logoutTarget = null; // 'admin' or 'client'

function showLogoutConfirm(target) {
  logoutTarget = target;
  document.getElementById('logoutConfirmModal').classList.remove('hidden');
}

function closeLogoutConfirm() {
  document.getElementById('logoutConfirmModal').classList.add('hidden');
  logoutTarget = null;
}

function confirmLogout() {
  if (logoutTarget === 'admin')  doAdminLogout();
  if (logoutTarget === 'client') doAdminLogout();
}

/* ════════════════════════════════
   CLIENT PORTAL PASSWORD TOGGLE
   BUG 10 FIX — renamed to portalPasswordHidden, logic matches name
   ════════════════════════════════ */
let portalPasswordHidden = true; // true = showing dots, false = showing real password

function togglePortalPassword(actualPassword) {
  portalPasswordHidden = !portalPasswordHidden;
  const el  = document.getElementById('portalPasswordText');
  const btn = document.querySelector('.pwd-eye-btn');
  if (el)  el.textContent  = portalPasswordHidden ? '••••••••' : actualPassword;
  if (btn) btn.textContent = portalPasswordHidden ? '👁' : '🙈';
}

/* ════════════════════════════════
   HELPERS
   ════════════════════════════════ */
function statusBadge(s) { return `<span class="badge badge-${{Pending:'pending','In Progress':'progress',Completed:'completed'}[s]||'pending'}">${s}</span>`; }
function paymentBadge(s) { return `<span class="badge badge-${{Paid:'paid',Partial:'partial',Due:'due'}[s]||'due'}">${s}</span>`; }
function activityColor(t) { return {client:'#6c63ff',payment:'#00d4aa',file:'#ffb347',project:'#ff6b6b'}[t]||'#7a8099'; }
function activityIcon(t)  { return {client:'◉',payment:'◎',file:'▣',project:'◈'}[t]||'◌'; }
function formatDate(ts)   { if(!ts)return'—'; return new Date(ts).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

/* ════════════════════════════════
   TOAST
   ════════════════════════════════ */
let toastTimeout;
function showToast(msg, type='info') {
  const toast=document.getElementById('toast'), icons={success:'✅',error:'❌',info:'ℹ️'};
  toast.innerHTML=`${icons[type]} ${msg}`; toast.className=`toast ${type}`; toast.classList.remove('hidden');
  clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>toast.classList.add('hidden'),3500);
}

/* ════════════════════════════════
   KEYBOARD
   ════════════════════════════════ */
/* RN CHAMBER - THINGS EXPENSE */
const THINGS_EXPENSE_KEY = 'rn_chamber_things_expense';
const THINGS_PRODUCTS_KEY = 'rn_chamber_things_products';
let editingThingsExpenseId = null;
let editingThingsProductId = null;
const DEFAULT_THINGS_PRODUCTS = [
  { id: 'firewood', name: 'Firewood', icon: 'FW' },
  { id: 'm-sand-waste', name: 'M-Sand Waste', icon: 'MS' },
  { id: 'mundhiri-oil', name: 'Mundhiri Oil', icon: 'MO' }
];
let selectedThingsProduct = 'Firewood';
let thingsExpenseTableOpen = false;
let thingsExpenseRecordsCache = null;
let thingsProductsCache = null;

function getThingsExpenseRecords() {
  if (Array.isArray(thingsExpenseRecordsCache)) return thingsExpenseRecordsCache;
  try {
    return JSON.parse(localStorage.getItem(THINGS_EXPENSE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setThingsExpenseRecords(records) {
  thingsExpenseRecordsCache = records;
  localStorage.setItem(THINGS_EXPENSE_KEY, JSON.stringify(records));
}

function makeThingsProductId(name) {
  const base = normalizeThingsProduct(name).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return base || `product-${Date.now()}`;
}

function makeThingsProductIcon(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .map(word => word[0] || '')
    .join('')
    .slice(0, 3)
    .toUpperCase() || 'PR';
}

function getThingsProductAccentClass(product) {
  const key = normalizeThingsProduct(`${product?.id || ''} ${product?.name || ''}`);
  if (key.includes('firewood')) return 'accent-firewood';
  if (key.includes('m sand') || key.includes('sand') || key.includes('waste')) return 'accent-msand';
  if (key.includes('mundhiri') || key.includes('oil')) return 'accent-oil';
  return 'accent-default';
}

function cleanThingsProduct(product) {
  const name = String(product?.name || '').trim();
  if (!name) return null;
  return {
    id: String(product?.id || makeThingsProductId(name)),
    name,
    icon: String(product?.icon || makeThingsProductIcon(name)).trim().slice(0, 3).toUpperCase()
  };
}

function getThingsProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(THINGS_PRODUCTS_KEY) || 'null');
    if (Array.isArray(saved)) {
      const defaultIds = new Set(DEFAULT_THINGS_PRODUCTS.map(product => product.id));
      const products = saved
        .map(cleanThingsProduct)
        .filter(product => product && defaultIds.has(product.id))
        .slice(0, 3);
      if (products.length) return products;
    }
  } catch {}
  return DEFAULT_THINGS_PRODUCTS.map(product => ({ ...product }));
}

function setThingsProducts(products) {
  const defaultIds = new Set(DEFAULT_THINGS_PRODUCTS.map(product => product.id));
  thingsProductsCache = products
    .map(cleanThingsProduct)
    .filter(product => product && defaultIds.has(product.id))
    .slice(0, 3);
  localStorage.setItem(THINGS_PRODUCTS_KEY, JSON.stringify(thingsProductsCache));
}

function calculateThingsNetWeight() {
  const first = Number(document.getElementById('thingsFirstWeight')?.value || 0);
  const second = Number(document.getElementById('thingsSecondWeight')?.value || 0);
  return Math.max(first - second, 0);
}

function updateThingsNetWeightPreview() {
  const preview = document.getElementById('thingsNetWeightPreview');
  if (preview) preview.value = `${Number(calculateThingsNetWeight() || 0).toLocaleString('en-IN')} KG`;
}

async function loadThingsExpensePage() {
  if (!demoMode) {
    const [records, products] = await Promise.all([
      api('GET', '/rn/things-expenses'),
      api('GET', '/rn/things-products')
    ]);
    if (records) thingsExpenseRecordsCache = records;
    thingsProductsCache = DEFAULT_THINGS_PRODUCTS.map(product => ({ ...product }));
  }
  const monthInput = document.getElementById('thingsExpenseMonth');
  if (monthInput && !monthInput.value) monthInput.value = currentMonthValue();
  const products = getThingsProducts();
  if (!products.some(product => isThingsProduct(product.name, selectedThingsProduct))) {
    selectedThingsProduct = products[0]?.name || 'Firewood';
  }
  showThingsProductHome(false);
  renderThingsExpense();
}

function normalizeThingsProduct(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, ' ');
}

function isThingsProduct(recordProduct, selectedProduct) {
  return normalizeThingsProduct(recordProduct) === normalizeThingsProduct(selectedProduct);
}

function selectThingsProduct(productName) {
  if (!getThingsProducts().some(product => product.name === productName)) return;
  selectedThingsProduct = productName;
  thingsExpenseTableOpen = true;
  updateThingsExpenseView();
  document.querySelectorAll('.things-product-card').forEach(card => {
    const active = card.dataset.product === selectedThingsProduct;
    card.classList.toggle('active', active);
    card.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const tableWrap = document.getElementById('thingsExpenseTableWrap');
  if (tableWrap) {
    tableWrap.classList.remove('things-table-fade');
    void tableWrap.offsetWidth;
    tableWrap.classList.add('things-table-fade');
  }
  renderThingsExpense();
}

function handleThingsProductCardKey(event, productName) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  selectThingsProduct(productName);
}

function openThingsProductModal(id = null) {
  editingThingsProductId = id;
  const products = getThingsProducts();
  if (!id && products.length >= 3) {
    showToast('Only 3 product cards are allowed here', 'info');
    return;
  }
  const product = id ? products.find(item => item.id === id) : null;
  document.getElementById('thingsProductModalTitle').textContent = product ? 'Edit Product' : 'Add Product';
  document.getElementById('thingsProductId').value = product?.id || '';
  document.getElementById('thingsProductCardName').value = product?.name || '';
  document.getElementById('thingsProductCardIcon').value = product?.icon || '';
  document.getElementById('thingsProductModal')?.classList.remove('hidden');
  setTimeout(() => document.getElementById('thingsProductCardName')?.focus(), 120);
}

function closeThingsProductModal() {
  document.getElementById('thingsProductModal')?.classList.add('hidden');
  editingThingsProductId = null;
}

function saveThingsProduct() {
  const id = document.getElementById('thingsProductId')?.value || '';
  const name = document.getElementById('thingsProductCardName')?.value.trim() || '';
  const icon = document.getElementById('thingsProductCardIcon')?.value.trim() || makeThingsProductIcon(name);
  if (!name) {
    showToast('Add product name', 'error');
    return;
  }
  const products = getThingsProducts();
  const duplicate = products.some(product => normalizeThingsProduct(product.name) === normalizeThingsProduct(name) && product.id !== id);
  if (duplicate) {
    showToast('Product already exists', 'error');
    return;
  }
  if (id) {
    const index = products.findIndex(product => product.id === id);
    const oldName = products[index]?.name || '';
    if (index > -1) products[index] = { ...products[index], name, icon: icon.slice(0, 3).toUpperCase() };
    if (oldName && !isThingsProduct(oldName, name)) {
      setThingsExpenseRecords(getThingsExpenseRecords().map(record =>
        isThingsProduct(record.productName, oldName) ? { ...record, productName: name } : record
      ));
    }
  } else {
    const nextDefault = DEFAULT_THINGS_PRODUCTS.find(defaultProduct =>
      !products.some(product => product.id === defaultProduct.id)
    );
    if (!nextDefault) {
      showToast('Only 3 product cards are allowed here', 'info');
      return;
    }
    products.push({ id: nextDefault.id, name, icon: icon.slice(0, 3).toUpperCase() });
  }
  setThingsProducts(products);
  selectedThingsProduct = name;
  closeThingsProductModal();
  renderThingsExpense();
  showToast('Product saved', 'success');
}

function deleteThingsProduct(id) {
  const products = getThingsProducts();
  const product = products.find(item => item.id === id);
  if (!product) return;
  if (products.length <= 1) {
    showToast('At least one product card is required', 'error');
    return;
  }
  if (!confirm(`Delete ${product.name} product card? Existing expense records will be kept.`)) return;
  const nextProducts = products.filter(item => item.id !== id);
  setThingsProducts(nextProducts);
  if (isThingsProduct(selectedThingsProduct, product.name)) {
    selectedThingsProduct = nextProducts[0].name;
    thingsExpenseTableOpen = false;
  }
  renderThingsExpense();
  showToast('Product deleted', 'success');
}

function showThingsProductHome(shouldRender = true) {
  thingsExpenseTableOpen = false;
  updateThingsExpenseView();
  if (shouldRender) renderThingsExpense();
}

function updateThingsExpenseView() {
  const head = document.getElementById('thingsExpenseHomeHead');
  const cards = document.getElementById('thingsProductCards');
  const panel = document.getElementById('thingsExpenseTablePanel');
  if (head) head.classList.toggle('hidden', thingsExpenseTableOpen);
  if (cards) cards.classList.toggle('hidden', thingsExpenseTableOpen);
  if (panel) panel.classList.toggle('hidden', !thingsExpenseTableOpen);
}

function openThingsExpenseModal(id = null) {
  editingThingsExpenseId = id;
  const item = id ? getThingsExpenseRecords().find(record => Number(record.id) === Number(id)) : {};
  document.getElementById('thingsExpenseModalTitle').textContent = id ? 'Edit Things Expense' : 'Add Things Expense';
  document.getElementById('thingsExpenseId').value = item?.id || '';
  document.getElementById('thingsDate').value = item?.date || new Date().toISOString().slice(0, 10);
  document.getElementById('thingsVehicleNo').value = item?.vehicleNo || '';
  document.getElementById('thingsProductName').value = item?.productName || selectedThingsProduct;
  document.getElementById('thingsCharges').value = item?.charges || '';
  document.getElementById('thingsFirstWeight').value = item?.firstWeight || '';
  document.getElementById('thingsSecondWeight').value = item?.secondWeight || '';
  document.getElementById('thingsAmount').value = item?.amount || '';
  document.getElementById('thingsNotes').value = item?.notes || '';
  updateThingsNetWeightPreview();
  document.getElementById('thingsExpenseModal')?.classList.remove('hidden');
  setTimeout(() => document.getElementById('thingsDate')?.focus(), 120);
}

function closeThingsExpenseModal() {
  document.getElementById('thingsExpenseModal')?.classList.add('hidden');
  editingThingsExpenseId = null;
}

function saveThingsExpense() {
  const date = document.getElementById('thingsDate')?.value || '';
  const vehicleNo = document.getElementById('thingsVehicleNo')?.value.trim() || '';
  const productName = document.getElementById('thingsProductName')?.value.trim() || '';
  const charges = Number(document.getElementById('thingsCharges')?.value || 0);
  const firstWeight = Number(document.getElementById('thingsFirstWeight')?.value || 0);
  const secondWeight = Number(document.getElementById('thingsSecondWeight')?.value || 0);
  const netWeight = Math.max(firstWeight - secondWeight, 0);
  const amount = Number(document.getElementById('thingsAmount')?.value || 0);
  const notes = document.getElementById('thingsNotes')?.value.trim() || '';
  if (!date || !vehicleNo || !productName || firstWeight <= 0 || secondWeight < 0) {
    showToast('Add date, vehicle, product, first weight, and second weight', 'error');
    return;
  }
  const records = getThingsExpenseRecords();
  if (editingThingsExpenseId) {
    const idx = records.findIndex(item => Number(item.id) === Number(editingThingsExpenseId));
    if (idx > -1) records[idx] = { ...records[idx], date, vehicleNo, productName, charges, firstWeight, secondWeight, netWeight, amount, notes };
  } else {
    records.unshift({ id: Date.now(), date, vehicleNo, productName, charges, firstWeight, secondWeight, netWeight, amount, notes });
  }
  setThingsExpenseRecords(records);
  const monthInput = document.getElementById('thingsExpenseMonth');
  const dateFilter = document.getElementById('thingsExpenseDateFilter');
  const searchInput = document.getElementById('thingsExpenseSearch');
  if (monthInput) monthInput.value = date.slice(0, 7);
  if (dateFilter) dateFilter.value = '';
  if (searchInput) searchInput.value = '';
  const savedProduct = getThingsProducts().find(product => isThingsProduct(product.name, productName));
  if (savedProduct) selectedThingsProduct = savedProduct.name;
  thingsExpenseTableOpen = true;
  updateThingsExpenseView();
  closeThingsExpenseModal();
  renderThingsExpense();
  showToast('Things expense saved', 'success');
}

function deleteThingsExpense(id) {
  if (!confirm('Delete this things expense record?')) return;
  setThingsExpenseRecords(getThingsExpenseRecords().filter(item => Number(item.id) !== Number(id)));
  renderThingsExpense();
  showToast('Record deleted', 'success');
}

function updateThingsProductCards(monthRecords) {
  const wrap = document.getElementById('thingsProductCards');
  const products = getThingsProducts();
  if (wrap) {
    wrap.innerHTML = products.map(product => {
      const records = monthRecords.filter(item => isThingsProduct(item.productName, product.name));
      const expense = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const active = isThingsProduct(product.name, selectedThingsProduct);
      const accentClass = getThingsProductAccentClass(product);
      return `
        <div class="things-product-card ${accentClass} ${active ? 'active' : ''}" data-product="${rnEscapeHtml(product.name)}" role="button" tabindex="0" aria-pressed="${active ? 'true' : 'false'}" onclick="selectThingsProduct(this.dataset.product)" onkeydown="handleThingsProductCardKey(event, this.dataset.product)">
          <span class="things-product-top">
            <span class="things-product-title">${rnEscapeHtml(product.name)}</span>
            <span class="things-product-icon">${rnEscapeHtml(product.icon || makeThingsProductIcon(product.name))}</span>
          </span>
          <span class="things-product-stats">
            <span><small>Total Expense</small><strong>${rnMoney(expense)}</strong></span>
          </span>
          <span class="things-product-footer">
            <span class="things-product-status">${active ? 'Selected' : 'View records'}</span>
            <span class="things-product-actions">
              <button class="things-product-action" type="button" title="Edit product" data-product-id="${rnEscapeHtml(product.id)}" onclick="event.stopPropagation(); openThingsProductModal(this.dataset.productId)" aria-label="Edit ${rnEscapeHtml(product.name)}">
                <span aria-hidden="true">&#9998;</span>
              </button>
              <button class="things-product-action danger" type="button" title="Delete product" data-product-id="${rnEscapeHtml(product.id)}" onclick="event.stopPropagation(); deleteThingsProduct(this.dataset.productId)" aria-label="Delete ${rnEscapeHtml(product.name)}">
                <span aria-hidden="true">&#128465;</span>
              </button>
            </span>
          </span>
        </div>
      `;
    }).join('');
  }
}

function renderThingsExpense() {
  const tbody = document.getElementById('thingsExpenseTbody');
  if (!tbody) return;
  const selectedMonth = document.getElementById('thingsExpenseMonth')?.value || currentMonthValue();
  const dateFilter = document.getElementById('thingsExpenseDateFilter')?.value || '';
  const search = (document.getElementById('thingsExpenseSearch')?.value || '').trim().toLowerCase();
  const allRecords = getThingsExpenseRecords();
  const monthRecords = allRecords.filter(item => (item.date || '').slice(0, 7) === selectedMonth);
  const monthDate = selectedMonth ? new Date(`${selectedMonth}-01T00:00:00`) : new Date();
  const monthName = monthDate.toLocaleDateString('en-IN', { month:'long', year:'numeric' });
  updateThingsExpenseView();
  updateThingsProductCards(monthRecords);
  document.querySelectorAll('.things-product-card').forEach(card => {
    const active = card.dataset.product === selectedThingsProduct;
    card.classList.toggle('active', active);
    card.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const records = monthRecords.filter(item => {
    const haystack = `${item.date || ''} ${item.vehicleNo || ''} ${item.productName || ''} ${item.notes || ''}`.toLowerCase();
    return (!search || haystack.includes(search))
      && (!dateFilter || item.date === dateFilter)
      && isThingsProduct(item.productName, selectedThingsProduct);
  });
  const titleEl = document.getElementById('thingsExpenseTableTitle');
  const subEl = document.getElementById('thingsExpenseTableSub');
  if (titleEl) titleEl.textContent = `${selectedThingsProduct} Expense Records`;
  if (subEl) subEl.textContent = `${records.length.toLocaleString('en-IN')} record${records.length === 1 ? '' : 's'} in ${monthName}`;
  tbody.innerHTML = records.length ? records.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.date ? new Date(item.date).toLocaleDateString('en-IN') : ''}</td>
      <td>${rnEscapeHtml(item.vehicleNo)}</td>
      <td>${rnEscapeHtml(item.productName)}</td>
      <td>${Number(item.firstWeight || 0).toLocaleString('en-IN')} KG</td>
      <td>${Number(item.secondWeight || 0).toLocaleString('en-IN')} KG</td>
      <td style="font-weight:700;color:var(--c1)">${Number(item.netWeight || 0).toLocaleString('en-IN')} KG</td>
      <td>${rnMoney(item.charges)}</td>
      <td style="font-weight:700;color:var(--c3)">${rnMoney(item.amount)}</td>
      <td><button class="plain-action-btn" title="Edit" onclick="openThingsExpenseModal(${item.id})">✏️</button><button class="plain-action-btn danger" title="Delete" onclick="deleteThingsExpense(${item.id})">🗑️</button></td>
    </tr>
  `).join('') : `<tr><td colspan="10"><div class="things-empty-state"><strong>No ${rnEscapeHtml(selectedThingsProduct)} records found</strong><span>Try another month, date, or search term.</span></div></td></tr>`;
}

/* ROSHAN TRADERS - SIMPLE TRADE */
const ROSHAN_TRADE_KEY = 'roshan_traders_trade_v1';
const DEFAULT_ROSHAN_PRODUCTS = [
  { id: 1, product_name: 'Bricks', unit: 'pcs', icon: 'BR' },
  { id: 2, product_name: 'Firewood', unit: 'kg', icon: 'FW' },
  { id: 3, product_name: 'Oil', unit: 'ltr', icon: 'OL' }
];
let selectedRoshanProductId = 1;
let roshanTradeTableOpen = false;
let roshanTradeDataCache = null;

function defaultRoshanTradeData() {
  return {
    products: DEFAULT_ROSHAN_PRODUCTS.map(product => ({ id: product.id, product_name: product.product_name, unit: product.unit })),
    suppliers: [],
    clients: [],
    transactions: []
  };
}

function getRoshanTradeData() {
  if (roshanTradeDataCache) return roshanTradeDataCache;
  try {
    const saved = JSON.parse(localStorage.getItem(ROSHAN_TRADE_KEY) || 'null');
    if (saved && Array.isArray(saved.products) && Array.isArray(saved.suppliers) && Array.isArray(saved.clients) && Array.isArray(saved.transactions)) {
      const productIds = new Set(saved.products.map(product => Number(product.id)));
      DEFAULT_ROSHAN_PRODUCTS.forEach(product => {
        if (!productIds.has(product.id)) saved.products.push({ id: product.id, product_name: product.product_name, unit: product.unit });
      });
      saved.products = saved.products.filter(product => DEFAULT_ROSHAN_PRODUCTS.some(defaultProduct => defaultProduct.id === Number(product.id)));
      return saved;
    }
  } catch {}
  const seed = defaultRoshanTradeData();
  setRoshanTradeData(seed);
  return seed;
}

function setRoshanTradeData(data) {
  roshanTradeDataCache = data;
  localStorage.setItem(ROSHAN_TRADE_KEY, JSON.stringify(data));
}

function getRoshanProduct(productId = selectedRoshanProductId) {
  const data = getRoshanTradeData();
  return data.products.find(product => Number(product.id) === Number(productId)) || data.products[0];
}

function getRoshanProductMeta(productId) {
  return DEFAULT_ROSHAN_PRODUCTS.find(product => product.id === Number(productId)) || DEFAULT_ROSHAN_PRODUCTS[0];
}

function findOrCreateRoshanParty(data, tableName, name, phone, address) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;
  const nameKey = cleanName.toLowerCase();
  const rows = data[tableName];
  const nameField = tableName === 'suppliers' ? 'supplier_name' : 'client_name';
  let row = rows.find(item => String(item[nameField] || '').trim().toLowerCase() === nameKey);
  if (row) {
    row.phone = phone || row.phone || '';
    row.address = address || row.address || '';
    return row.id;
  }
  const id = Date.now() + rows.length;
  row = { id, [nameField]: cleanName, phone: phone || '', address: address || '' };
  rows.push(row);
  return id;
}

function roshanTradeMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

function roshanTradeQty(value) {
  return Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function roshanPaymentStatus(total, paid) {
  const totalAmount = Number(total || 0);
  const paidAmount = Number(paid || 0);
  if (paidAmount >= totalAmount && totalAmount > 0) return 'PAID';
  if (paidAmount > 0) return 'PARTIAL';
  return 'PENDING';
}

function roshanProductSummary(productId) {
  const data = getRoshanTradeData();
  const rows = data.transactions.filter(tx => Number(tx.product_id) === Number(productId));
  const purchased = rows.filter(tx => tx.transaction_type === 'PURCHASE').reduce((sum, tx) => sum + Number(tx.quantity || 0), 0);
  const sold = rows.filter(tx => tx.transaction_type === 'SALE').reduce((sum, tx) => sum + Number(tx.quantity || 0), 0);
  const purchaseDue = rows.filter(tx => tx.transaction_type === 'PURCHASE').reduce((sum, tx) => sum + Number(tx.pending_amount || 0), 0);
  const salesDue = rows.filter(tx => tx.transaction_type === 'SALE').reduce((sum, tx) => sum + Number(tx.pending_amount || 0), 0);
  const collected = rows.filter(tx => tx.transaction_type === 'SALE').reduce((sum, tx) => sum + Number(tx.paid_amount || 0), 0);
  return { stock: purchased - sold, purchaseDue, salesDue, collected, count: rows.length };
}

async function loadRoshanTradePage() {
  if (!demoMode) {
    const data = await api('GET', '/roshan/trade');
    if (data) setRoshanTradeData(data);
  }
  const dateInput = document.getElementById('roshanTxDate');
  if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
  ['roshanTxQuantity', 'roshanTxRate', 'roshanTxPaid'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.oninput = updateRoshanTradeAmountPreview;
  });
  showRoshanTradeHome(false);
  renderRoshanTrade();
}

function showRoshanTradeHome(shouldRender = true) {
  roshanTradeTableOpen = false;
  setRoshanTradeFormOpen(false);
  updateRoshanTradeView();
  if (shouldRender) renderRoshanTrade();
}

function updateRoshanTradeView() {
  document.getElementById('roshanTradeHomeHead')?.classList.toggle('hidden', roshanTradeTableOpen);
  document.getElementById('roshanTradeCards')?.classList.toggle('hidden', roshanTradeTableOpen);
  document.getElementById('roshanTradePanel')?.classList.toggle('hidden', !roshanTradeTableOpen);
}

function selectRoshanTradeProduct(productId) {
  selectedRoshanProductId = Number(productId) || 1;
  roshanTradeTableOpen = true;
  setRoshanTradeFormOpen(false);
  const dateInput = document.getElementById('roshanTxDate');
  if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
  updateRoshanTradeView();
  renderRoshanTrade();
}

function setRoshanTradeFormOpen(open) {
  const form = document.getElementById('roshanTradeForm');
  const btn = document.getElementById('roshanFormToggleBtn');
  if (form) form.classList.toggle('hidden', !open);
  if (btn) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close new transaction form' : 'Open new transaction form');
    btn.title = open ? 'Close transaction form' : 'New transaction';
    btn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-plus"></i>';
  }
}

function toggleRoshanTradeForm() {
  const form = document.getElementById('roshanTradeForm');
  setRoshanTradeFormOpen(form?.classList.contains('hidden'));
}

function handleRoshanTradeCardKey(event, productId) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  selectRoshanTradeProduct(productId);
}

function syncRoshanTradePartyFields() {
  const type = document.getElementById('roshanTxType')?.value || 'PURCHASE';
  const data = getRoshanTradeData();
  const list = document.getElementById('roshanPartyList');
  const partyInput = document.getElementById('roshanTxParty');
  if (partyInput) partyInput.placeholder = type === 'PURCHASE' ? 'Select supplier' : 'Select client';
  if (list) {
    const parties = type === 'PURCHASE'
      ? data.suppliers.map(item => item.supplier_name)
      : data.clients.map(item => item.client_name);
    list.innerHTML = parties.map(name => `<option value="${rnEscapeHtml(name)}"></option>`).join('');
  }
}

function clearRoshanTradeForm() {
  ['roshanTxParty', 'roshanTxQuantity', 'roshanTxRate', 'roshanTxPaid', 'roshanTxNote'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const dateInput = document.getElementById('roshanTxDate');
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  updateRoshanTradeAmountPreview();
}

function updateRoshanTradeAmountPreview() {
  const quantity = Number(document.getElementById('roshanTxQuantity')?.value || 0);
  const rate = Number(document.getElementById('roshanTxRate')?.value || 0);
  const paid = Number(document.getElementById('roshanTxPaid')?.value || 0);
  const total = quantity * rate;
  const pending = Math.max(total - paid, 0);
  const totalEl = document.getElementById('roshanTxTotalPreview');
  const pendingEl = document.getElementById('roshanTxPendingPreview');
  if (totalEl) totalEl.value = roshanTradeMoney(total);
  if (pendingEl) pendingEl.value = roshanTradeMoney(pending);
}

async function saveRoshanTradeTransaction() {
  const data = getRoshanTradeData();
  const type = document.getElementById('roshanTxType')?.value || 'PURCHASE';
  const product = getRoshanProduct();
  const partyName = document.getElementById('roshanTxParty')?.value.trim() || '';
  const supplierName = type === 'PURCHASE' ? partyName : '';
  const clientName = type === 'SALE' ? partyName : '';
  const quantity = Number(document.getElementById('roshanTxQuantity')?.value || 0);
  const rate = Number(document.getElementById('roshanTxRate')?.value || 0);
  const paidAmount = Number(document.getElementById('roshanTxPaid')?.value || 0);
  const paymentMode = document.getElementById('roshanTxMode')?.value || 'Cash';
  const date = document.getElementById('roshanTxDate')?.value || '';
  const note = document.getElementById('roshanTxNote')?.value.trim() || '';
  if (!date || !partyName || quantity <= 0 || rate <= 0) {
    showToast('Add date, party name, quantity, and rate', 'error');
    return;
  }
  const summary = roshanProductSummary(product.id);
  if (type === 'SALE' && quantity > summary.stock) {
    showToast(`Only ${roshanTradeQty(summary.stock)} ${product.unit} available`, 'error');
    return;
  }
  const totalAmount = quantity * rate;
  const pendingAmount = Math.max(totalAmount - paidAmount, 0);
  const transaction = {
    id: Date.now(),
    transaction_type: type,
    product_id: product.id,
    supplier_id: null,
    client_id: null,
    quantity,
    rate,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    pending_amount: pendingAmount,
    payment_status: roshanPaymentStatus(totalAmount, paidAmount),
    payment_mode: paymentMode,
    transaction_date: date,
    note
  };
  if (!demoMode) {
    const saved = await api('POST', '/roshan/transactions', {
      transaction_type: type,
      product_id: product.id,
      supplier_name: supplierName,
      client_name: clientName,
      phone: '',
      address: '',
      quantity,
      rate,
      paid_amount: paidAmount,
      payment_mode: paymentMode,
      transaction_date: date,
      note
    });
    if (!saved) {
      showToast('Backend unavailable. Transaction was not saved to MySQL.', 'error');
      return;
    }
    setRoshanTradeData(saved);
  } else {
    const supplierId = type === 'PURCHASE' ? findOrCreateRoshanParty(data, 'suppliers', supplierName, '', '') : null;
    const clientId = type === 'SALE' ? findOrCreateRoshanParty(data, 'clients', clientName, '', '') : null;
    transaction.supplier_id = supplierId;
    transaction.client_id = clientId;
    data.transactions.unshift(transaction);
    setRoshanTradeData(data);
  }
  clearRoshanTradeForm();
  setRoshanTradeFormOpen(false);
  renderRoshanTrade();
  showToast('Trade transaction saved', 'success');
}

function roshanPartyName(data, tx) {
  if (tx.transaction_type === 'PURCHASE') {
    return data.suppliers.find(supplier => Number(supplier.id) === Number(tx.supplier_id))?.supplier_name || '-';
  }
  return data.clients.find(client => Number(client.id) === Number(tx.client_id))?.client_name || '-';
}

function updateRoshanTradeCards(data) {
  const wrap = document.getElementById('roshanTradeCards');
  if (!wrap) return;
  wrap.innerHTML = data.products.map(product => {
    const meta = getRoshanProductMeta(product.id);
    const summary = roshanProductSummary(product.id);
    const active = Number(product.id) === Number(selectedRoshanProductId);
    const accent = product.product_name.toLowerCase().includes('brick') ? 'accent-bricks' : product.product_name.toLowerCase().includes('fire') ? 'accent-firewood' : 'accent-oil';
    return `
      <div class="things-product-card roshan-trade-card ${accent} ${active ? 'active' : ''}" role="button" tabindex="0" aria-pressed="${active ? 'true' : 'false'}" onclick="selectRoshanTradeProduct(${product.id})" onkeydown="handleRoshanTradeCardKey(event, ${product.id})">
        <span class="things-product-top">
          <span class="things-product-title">${rnEscapeHtml(product.product_name)}</span>
          <span class="things-product-icon">${rnEscapeHtml(meta.icon)}</span>
        </span>
        <span class="things-product-stats">
          <span><small>Available Stock</small><strong>${roshanTradeQty(summary.stock)} ${rnEscapeHtml(product.unit)}</strong></span>
        </span>
        <span class="things-product-footer">
          <span class="things-product-status">${active ? 'Selected' : 'View records'}</span>
          <span class="roshan-card-due">${roshanTradeMoney(summary.salesDue + summary.purchaseDue)} due</span>
        </span>
      </div>
    `;
  }).join('');
}

function renderRoshanTrade() {
  const tbody = document.getElementById('roshanTradeTbody');
  const data = getRoshanTradeData();
  updateRoshanTradeView();
  updateRoshanTradeCards(data);
  syncRoshanTradePartyFields();
  updateRoshanTradeAmountPreview();
  const product = getRoshanProduct();
  const summary = roshanProductSummary(product.id);
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('roshanTradeTableTitle', `${product.product_name} Transactions`);
  setText('roshanTradeTableSub', `${summary.count} record${summary.count === 1 ? '' : 's'} for purchase, sale, and money tracking`);
  setText('roshanTradeStock', `${roshanTradeQty(summary.stock)} ${product.unit}`);
  setText('roshanTradePurchaseDue', roshanTradeMoney(summary.purchaseDue));
  setText('roshanTradeSalesDue', roshanTradeMoney(summary.salesDue));
  setText('roshanTradeCollected', roshanTradeMoney(summary.collected));
  if (!tbody) return;
  const rows = data.transactions.filter(tx => {
    if (Number(tx.product_id) !== Number(product.id)) return false;
    return true;
  });
  tbody.innerHTML = rows.length ? rows.map((tx, index) => `
    <tr>
      <td>${tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('en-IN') : ''}</td>
      <td><span class="rn-status ${tx.transaction_type === 'SALE' ? 'paid' : 'pending'}">${rnEscapeHtml(tx.transaction_type)}</span></td>
      <td>${rnEscapeHtml(roshanPartyName(data, tx))}</td>
      <td>${roshanTradeQty(tx.quantity)} ${rnEscapeHtml(product.unit)}</td>
      <td>${roshanTradeMoney(tx.total_amount)}</td>
      <td>${roshanTradeMoney(tx.paid_amount)}</td>
      <td>${roshanTradeMoney(tx.pending_amount)}</td>
      <td>${rnEscapeHtml(tx.payment_status)}</td>
    </tr>
  `).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px">No transactions for this product yet</td></tr>';
}

/* RN CHAMBER - BRICKS INCOME */
const BRICKS_INCOME_KEY = 'rn_chamber_bricks_income';
let editingBricksIncomeId = null;
let bricksIncomeRecordsCache = null;

/* RN CHAMBER - EMPLOYEE WEEKLY SALARY */
const EMPLOYEE_SALARY_KEY = 'rn_chamber_employee_salary';
let editingEmployeeSalaryId = null;
let employeeSalaryRecordsCache = null;

function getEmployeeSalaryRecords() {
  if (Array.isArray(employeeSalaryRecordsCache)) return employeeSalaryRecordsCache;
  try {
    return JSON.parse(localStorage.getItem(EMPLOYEE_SALARY_KEY) || '[]');
  } catch {
    return [];
  }
}

function setEmployeeSalaryRecords(records) {
  employeeSalaryRecordsCache = records;
  localStorage.setItem(EMPLOYEE_SALARY_KEY, JSON.stringify(records));
}

function getWeekValue(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);
  const week = 1 + Math.round((target - firstThursday) / 604800000);
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function currentWeekValue() {
  return getWeekValue(new Date().toISOString().slice(0, 10));
}

function isSaturday(dateStr) {
  return new Date(`${dateStr}T00:00:00`).getDay() === 6;
}

async function loadEmployeeSalaryPage() {
  if (!demoMode) {
    const records = await api('GET', '/rn/employee-salary');
    if (records) employeeSalaryRecordsCache = records;
  }
  const monthInput = document.getElementById('salaryMonthFilter');
  if (monthInput && !monthInput.value) {
    monthInput.value = latestRecordMonth(getEmployeeSalaryRecords()) || currentMonthValue();
  }
  syncMonthDisplay('salaryMonthFilter', 'salaryMonthDisplay');
  renderSalarySaturdayOptions();
  renderEmployeeSalary();
}

function getSaturdaysInMonth(monthValue) {
  if (!monthValue) return [];
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) return [];
  const dates = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    if (date.getDay() === 6) {
      dates.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    }
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

function renderSalarySaturdayOptions() {
  const select = document.getElementById('salarySaturdayFilter');
  const monthInput = document.getElementById('salaryMonthFilter');
  if (!select || !monthInput) return;
  const current = select.value;
  const saturdays = getSaturdaysInMonth(monthInput.value || currentMonthValue());
  syncMonthDisplay('salaryMonthFilter', 'salaryMonthDisplay');
  select.innerHTML = `<option value="">All Saturdays</option>${saturdays.map(date => `<option value="${date}">${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</option>`).join('')}`;
  if (saturdays.includes(current)) select.value = current;
}

function shiftSalaryYear(delta) {
  const monthInput = document.getElementById('salaryMonthFilter');
  if (!monthInput) return;
  const value = monthInput.value || currentMonthValue();
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return;
  const nextYear = Math.max(1, year + Number(delta || 0));
  monthInput.value = `${String(nextYear).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
  syncMonthDisplay('salaryMonthFilter', 'salaryMonthDisplay');
  renderSalarySaturdayOptions();
  renderEmployeeSalary();
}

function getSalarySummarySaturday(monthValue, saturdayFilter, monthRecords, saturdays) {
  if (saturdays.includes(saturdayFilter)) return saturdayFilter;
  const paidDates = new Set(
    monthRecords
      .filter(item => isSaturday(item.date) && salaryRecordAmount(item) > 0)
      .map(item => item.date)
  );
  const latestPaidSaturday = saturdays.slice().reverse().find(date => paidDates.has(date));
  if (latestPaidSaturday) return latestPaidSaturday;
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = monthValue === today.slice(0, 7);
  return currentMonth
    ? saturdays.slice().reverse().find(date => date <= today) || saturdays[0] || ''
    : saturdays[0] || '';
}

function salaryRecordAmount(item) {
  return Number(item.salaryAmount ?? item.finalSalary ?? 0);
}

function formatEmployeeSalaryDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (!dateStr || Number.isNaN(date.getTime())) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

function formatEmployeeSalaryShortDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (!dateStr || Number.isNaN(date.getTime())) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}`;
}

function employeeSalaryWorkerKey(name) {
  return String(name || '').trim().toLowerCase();
}

function openEmployeeSalaryModal(id = null) {
  editingEmployeeSalaryId = id;
  const item = id ? getEmployeeSalaryRecords().find(record => Number(record.id) === Number(id)) : {};
  document.getElementById('employeeSalaryModalTitle').textContent = id ? 'Edit Salary' : 'Add Salary';
  document.getElementById('employeeSalaryId').value = item?.id || '';
  document.getElementById('salaryEmployeeName').value = item?.employeeName || '';
  document.getElementById('salaryEntryMonth').value = item?.date?.slice(0, 7) || document.getElementById('salaryMonthFilter')?.value || currentMonthValue();
  document.getElementById('salaryNotes').value = item?.notes || '';
  renderEmployeeSalaryModalSaturdays(item?.employeeName || '');
  document.getElementById('employeeSalaryModal')?.classList.remove('hidden');
  setTimeout(() => document.getElementById('salaryEmployeeName')?.focus(), 120);
}

function openEmployeeSalaryWorkerModal(workerName = '') {
  const monthValue = document.getElementById('salaryMonthFilter')?.value || currentMonthValue();
  openEmployeeSalaryModal(null);
  document.getElementById('employeeSalaryModalTitle').textContent = 'Edit Salary';
  document.getElementById('salaryEmployeeName').value = workerName || '';
  document.getElementById('salaryEntryMonth').value = monthValue;
  renderEmployeeSalaryModalSaturdays(workerName || '');
}

function renderEmployeeSalaryModalSaturdays(workerName = '') {
  const wrap = document.getElementById('salarySaturdayAmounts');
  if (!wrap) return;
  const monthValue = document.getElementById('salaryEntryMonth')?.value || document.getElementById('salaryMonthFilter')?.value || currentMonthValue();
  const name = workerName || document.getElementById('salaryEmployeeName')?.value || '';
  const workerKey = employeeSalaryWorkerKey(name);
  const records = getEmployeeSalaryRecords().filter(item =>
    (item.date || '').slice(0, 7) === monthValue &&
    (!workerKey || employeeSalaryWorkerKey(item.employeeName) === workerKey)
  );
  const byDate = records.reduce((map, item) => {
    map[item.date] = (map[item.date] || 0) + salaryRecordAmount(item);
    return map;
  }, {});
  const saturdays = getSaturdaysInMonth(monthValue);
  wrap.innerHTML = saturdays.length
    ? `<div class="salary-modal-saturday-title">Saturday Salary Amounts</div><div class="salary-modal-saturday-grid">${saturdays.map(date => `
        <div class="field-group">
          <label>${formatEmployeeSalaryShortDate(date)}</label>
          <input type="number" class="salary-modal-amount" data-date="${date}" min="0" step="0.01" placeholder="0" value="${Number(byDate[date] || 0) || ''}"/>
        </div>
      `).join('')}</div>`
    : '<div class="field-error">Select a valid month to generate Saturdays.</div>';
}

function closeEmployeeSalaryModal() {
  document.getElementById('employeeSalaryModal')?.classList.add('hidden');
  editingEmployeeSalaryId = null;
}

function saveEmployeeSalary() {
  const employeeName = document.getElementById('salaryEmployeeName')?.value.trim() || '';
  const monthValue = document.getElementById('salaryEntryMonth')?.value || document.getElementById('salaryMonthFilter')?.value || currentMonthValue();
  const notes = document.getElementById('salaryNotes')?.value.trim() || '';
  const amountInputs = Array.from(document.querySelectorAll('#salarySaturdayAmounts .salary-modal-amount'));
  const entries = amountInputs
    .map(input => ({ date: input.dataset.date || '', amount: Number(input.value || 0) }))
    .filter(item => item.date && item.amount > 0);
  if (!employeeName || !monthValue || !entries.length) {
    showToast('Add worker name and at least one Saturday salary amount', 'error');
    return;
  }
  const entryDates = new Set(amountInputs.map(input => input.dataset.date).filter(Boolean));
  const workerKey = employeeSalaryWorkerKey(employeeName);
  const records = getEmployeeSalaryRecords().filter(item =>
    !(entryDates.has(item.date) && employeeSalaryWorkerKey(item.employeeName) === workerKey)
  );
  const newRecords = entries.map((entry, index) => ({
    id: Date.now() + index,
    date: entry.date,
    employeeName,
    salaryAmount: entry.amount,
    finalSalary: entry.amount,
    status: 'Paid',
    notes
  }));
  records.unshift(...newRecords);
  setEmployeeSalaryRecords(records);
  const monthInput = document.getElementById('salaryMonthFilter');
  const saturdayFilter = document.getElementById('salarySaturdayFilter');
  const searchInput = document.getElementById('salarySearch');
  if (monthInput) monthInput.value = monthValue;
  renderSalarySaturdayOptions();
  if (saturdayFilter) {
    const latestEntryDate = entries.map(entry => entry.date).sort().pop() || '';
    saturdayFilter.value = latestEntryDate;
  }
  if (searchInput) searchInput.value = '';
  closeEmployeeSalaryModal();
  renderEmployeeSalary();
  showToast('Employee salary saved', 'success');
}

function saveEmployeeSalaryCell(workerName, date, amountValue) {
  const amount = Number(amountValue || 0);
  if (!workerName || !date || !isSaturday(date) || amount < 0) return;
  const workerKey = employeeSalaryWorkerKey(workerName);
  const records = getEmployeeSalaryRecords().filter(item =>
    !(item.date === date && employeeSalaryWorkerKey(item.employeeName) === workerKey)
  );
  if (amount > 0) {
    records.unshift({
      id: Date.now(),
      date,
      employeeName: workerName,
      salaryAmount: amount,
      finalSalary: amount,
      status: 'Paid',
      notes: ''
    });
  }
  setEmployeeSalaryRecords(records);
  renderEmployeeSalary();
}

function handleEmployeeSalaryCellChange(input) {
  if (!input) return;
  const saturdayFilter = document.getElementById('salarySaturdayFilter');
  if (saturdayFilter && Array.from(saturdayFilter.options).some(option => option.value === input.dataset.date)) {
    saturdayFilter.value = input.dataset.date || '';
  }
  saveEmployeeSalaryCell(input.dataset.worker || '', input.dataset.date || '', input.value);
}

function renderEmployeeSalary() {
  const thead = document.getElementById('employeeSalaryThead');
  const tbody = document.getElementById('employeeSalaryTbody');
  if (!tbody || !thead) return;
  const monthFilter = document.getElementById('salaryMonthFilter')?.value || currentMonthValue();
  const saturdayFilter = document.getElementById('salarySaturdayFilter')?.value || '';
  const search = (document.getElementById('salarySearch')?.value || '').trim().toLowerCase();
  const allRecords = getEmployeeSalaryRecords();
  const saturdays = getSaturdaysInMonth(monthFilter);
  thead.innerHTML = `<tr><th>S.No</th><th>Worker Name</th>${saturdays.map(date => `<th>${formatEmployeeSalaryShortDate(date)}</th>`).join('')}<th>Total Salary</th><th>Action</th></tr>`;
  const selectedMonthRecords = allRecords.filter(item => !monthFilter || (item.date || '').slice(0, 7) === monthFilter);
  const workerMap = new Map();
  selectedMonthRecords.forEach(item => {
    const workerName = String(item.employeeName || '').trim();
    if (!workerName) return;
    const key = employeeSalaryWorkerKey(workerName);
    if (!workerMap.has(key)) workerMap.set(key, { name: workerName, byDate: {} });
    const row = workerMap.get(key);
    row.byDate[item.date] = (row.byDate[item.date] || 0) + salaryRecordAmount(item);
  });
  const rows = Array.from(workerMap.values())
    .filter(row => !search || row.name.toLowerCase().includes(search))
    .sort((a, b) => a.name.localeCompare(b.name));
  tbody.innerHTML = rows.length ? rows.map((row, index) => {
    const total = saturdays.reduce((sum, date) => sum + Number(row.byDate[date] || 0), 0);
    return `
    <tr>
      <td>${index + 1}</td>
      <td class="salary-worker-name">${rnEscapeHtml(row.name)}</td>
      ${saturdays.map(date => `<td class="salary-amount-cell"><input class="salary-amount-input" type="number" min="0" step="0.01" value="${Number(row.byDate[date] || 0) || ''}" data-worker="${rnEscapeHtml(row.name)}" data-date="${date}" onchange="handleEmployeeSalaryCellChange(this)" onblur="handleEmployeeSalaryCellChange(this)"/></td>`).join('')}
      <td class="salary-row-total">${rnMoney(total)}</td>
      <td class="salary-action-cell"><button class="plain-action-btn salary-action-btn" title="Edit" data-worker="${rnEscapeHtml(row.name)}" onclick="openEmployeeSalaryWorkerModal(this.dataset.worker)">&#9998;</button></td>
    </tr>
  `;
  }).join('') : `<tr><td colspan="${saturdays.length + 4}" style="text-align:center;color:var(--text-muted);padding:28px">No brick worker salary records for this month</td></tr>`;
  const summarySaturday = getSalarySummarySaturday(monthFilter, saturdayFilter, selectedMonthRecords, saturdays);
  const selectedSaturdayRecords = selectedMonthRecords.filter(item =>
    item.date === summarySaturday
  );
  const gridSaturdayTotal = selectedSaturdayRecords.reduce((sum, item) => sum + salaryRecordAmount(item), 0);
  const gridMonthPaid = selectedMonthRecords.filter(item => item.status === 'Paid' && isSaturday(item.date)).reduce((sum, item) => sum + salaryRecordAmount(item), 0);
  const gridWorkers = new Set(selectedMonthRecords.filter(item => item.status === 'Paid' && salaryRecordAmount(item) > 0).map(item => employeeSalaryWorkerKey(item.employeeName)).filter(Boolean)).size;
  const completedSaturdaySet = new Set(selectedMonthRecords
    .filter(item => isSaturday(item.date) && salaryRecordAmount(item) > 0)
    .map(item => item.date));
  const completedSaturdays = saturdays.filter(date => completedSaturdaySet.has(date)).length;
  const totalSaturdays = saturdays.length;
  const progressPercent = totalSaturdays ? Math.round((completedSaturdays / totalSaturdays) * 100) : 0;
  const gridSaturdayEl = document.getElementById('salarySaturdayTotal');
  const gridMonthPaidEl = document.getElementById('salaryMonthPaid');
  const gridWorkersEl = document.getElementById('salaryTotalWorkers');
  const gridSaturdayLabel = document.getElementById('salarySaturdayLabel');
  const salaryProgressPercentEl = document.getElementById('salaryProgressPercent');
  const salaryProgressFillEl = document.getElementById('salaryProgressFill');
  const salaryProgressSubEl = document.getElementById('salaryProgressSub');
  if (gridSaturdayEl) gridSaturdayEl.textContent = rnMoney(gridSaturdayTotal);
  if (gridMonthPaidEl) gridMonthPaidEl.textContent = rnMoney(gridMonthPaid);
  if (gridWorkersEl) gridWorkersEl.textContent = Number(gridWorkers || 0).toLocaleString('en-IN');
  if (salaryProgressPercentEl) salaryProgressPercentEl.textContent = `${progressPercent}%`;
  if (salaryProgressFillEl) salaryProgressFillEl.style.width = `${progressPercent}%`;
  if (salaryProgressSubEl) salaryProgressSubEl.textContent = `${completedSaturdays} of ${totalSaturdays} Saturdays Completed`;
  if (gridSaturdayLabel) {
    gridSaturdayLabel.textContent = summarySaturday
      ? formatEmployeeSalaryDate(summarySaturday)
      : 'Selected Saturday';
  }
}

function rnMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function rnEscapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function getBricksIncomeRecords() {
  if (Array.isArray(bricksIncomeRecordsCache)) return bricksIncomeRecordsCache;
  try {
    return JSON.parse(localStorage.getItem(BRICKS_INCOME_KEY) || '[]');
  } catch {
    return [];
  }
}

function setBricksIncomeRecords(records) {
  bricksIncomeRecordsCache = records;
  localStorage.setItem(BRICKS_INCOME_KEY, JSON.stringify(records));
}

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function compactMonthLabel(monthValue) {
  const [year, month] = String(monthValue || '').split('-').map(Number);
  if (!year || !month) return 'MONTH';
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${months[month - 1]} ${year}`;
}

function syncMonthDisplay(inputId, displayId) {
  const input = document.getElementById(inputId);
  const display = document.getElementById(displayId);
  if (input && display) display.textContent = compactMonthLabel(input.value);
}

function openMonthPicker(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (typeof input.showPicker === 'function') input.showPicker();
  else input.focus();
}

function latestRecordMonth(records) {
  return records
    .map(item => String(item.date || '').slice(0, 7))
    .filter(Boolean)
    .sort()
    .pop();
}

async function loadBricksIncomePage() {
  if (!demoMode) {
    const records = await api('GET', '/rn/bricks-income');
    if (records) bricksIncomeRecordsCache = records;
  }
  const monthInput = document.getElementById('bricksIncomeMonth');
  const dateInput = document.getElementById('bricksDate');
  if (monthInput && !monthInput.value) monthInput.value = latestRecordMonth(getBricksIncomeRecords()) || currentMonthValue();
  syncMonthDisplay('bricksIncomeMonth', 'bricksIncomeMonthDisplay');
  if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
  updateBricksAmountPreview();
  renderBricksIncome();
}

function shiftBricksIncomeYear(delta) {
  const monthInput = document.getElementById('bricksIncomeMonth');
  if (!monthInput) return;
  const value = monthInput.value || latestRecordMonth(getBricksIncomeRecords()) || currentMonthValue();
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return;
  const nextYear = Math.max(1, year + Number(delta || 0));
  monthInput.value = `${String(nextYear).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
  syncMonthDisplay('bricksIncomeMonth', 'bricksIncomeMonthDisplay');
  renderBricksIncome();
}

function toggleBricksIncomeForm() {
  const form = document.getElementById('bricksIncomeForm');
  if (form) form.classList.toggle('hidden');
}

function focusBricksIncomeEntry() {
  const form = document.getElementById('bricksIncomeForm');
  if (form) form.classList.remove('hidden');
  updateBricksAmountPreview();
  form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => document.getElementById('bricksDate')?.focus(), 250);
}

function resetBricksIncomeForm() {
  ['bricksCustomer','bricksDetail','bricksRate','bricksCount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const dateInput = document.getElementById('bricksDate');
  const statusInput = document.getElementById('bricksPaymentStatus');
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  if (statusInput) statusInput.value = 'Paid';
  editingBricksIncomeId = null;
  updateBricksAmountPreview();
}

function calculateBricksAmount() {
  const rate = Number(document.getElementById('bricksRate')?.value || 0);
  const count = Number(document.getElementById('bricksCount')?.value || 0);
  return rate * count;
}

function updateBricksAmountPreview() {
  const preview = document.getElementById('bricksAmountPreview');
  if (preview) preview.value = rnMoney(calculateBricksAmount());
}

function saveBricksIncome() {
  updateBricksAmountPreview();
  const date = document.getElementById('bricksDate')?.value || '';
  const customer = document.getElementById('bricksCustomer')?.value.trim() || '';
  const detail = document.getElementById('bricksDetail')?.value.trim() || '';
  const rate = Number(document.getElementById('bricksRate')?.value || 0);
  const count = Number(document.getElementById('bricksCount')?.value || 0);
  const paymentStatus = document.getElementById('bricksPaymentStatus')?.value || 'Paid';
  const amount = rate * count;
  if (!date || !detail || rate <= 0 || count <= 0) {
    showToast('Add date, detail, rate, and count', 'error');
    return;
  }
  const records = getBricksIncomeRecords();
  if (editingBricksIncomeId) {
    const idx = records.findIndex(item => Number(item.id) === Number(editingBricksIncomeId));
    if (idx > -1) records[idx] = { ...records[idx], date, customer, detail, rate, count, amount, paymentStatus };
    editingBricksIncomeId = null;
  } else {
    records.unshift({ id: Date.now(), date, customer, detail, rate, count, amount, paymentStatus });
  }
  setBricksIncomeRecords(records);
  const monthInput = document.getElementById('bricksIncomeMonth');
  const dateFilter = document.getElementById('bricksIncomeDateFilter');
  const statusFilter = document.getElementById('bricksPaymentStatusFilter');
  const searchInput = document.getElementById('bricksIncomeSearch');
  if (monthInput) monthInput.value = date.slice(0, 7);
  syncMonthDisplay('bricksIncomeMonth', 'bricksIncomeMonthDisplay');
  if (dateFilter) dateFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  if (searchInput) searchInput.value = '';
  resetBricksIncomeForm();
  closeBricksIncomeForm();
  renderBricksIncome();
  showToast('Bricks income saved', 'success');
}

function closeBricksIncomeForm() {
  document.getElementById('bricksIncomeForm')?.classList.add('hidden');
}

function editBricksIncome(id) {
  const item = getBricksIncomeRecords().find(record => Number(record.id) === Number(id));
  if (!item) return;
  editingBricksIncomeId = item.id;
  document.getElementById('bricksDate').value = item.date || new Date().toISOString().slice(0, 10);
  document.getElementById('bricksDetail').value = item.detail || '';
  document.getElementById('bricksRate').value = item.rate || '';
  document.getElementById('bricksCount').value = item.count || '';
  document.getElementById('bricksPaymentStatus').value = item.paymentStatus || 'Paid';
  updateBricksAmountPreview();
  focusBricksIncomeEntry();
}

function deleteBricksIncome(id) {
  if (!confirm('Delete this bricks income record?')) return;
  setBricksIncomeRecords(getBricksIncomeRecords().filter(item => Number(item.id) !== Number(id)));
  renderBricksIncome();
  showToast('Record deleted', 'success');
}

function renderBricksIncome() {
  const tbody = document.getElementById('bricksIncomeTbody');
  if (!tbody) return;
  const selectedMonth = document.getElementById('bricksIncomeMonth')?.value || currentMonthValue();
  syncMonthDisplay('bricksIncomeMonth', 'bricksIncomeMonthDisplay');
  const dateFilter = document.getElementById('bricksIncomeDateFilter')?.value || '';
  const statusFilter = document.getElementById('bricksPaymentStatusFilter')?.value || '';
  const search = (document.getElementById('bricksIncomeSearch')?.value || '').trim().toLowerCase();
  const allRecords = getBricksIncomeRecords();
  const monthRecords = allRecords.filter(item => (item.date || '').slice(0, 7) === selectedMonth);
  const records = monthRecords.filter(item => {
    const haystack = `${item.date || ''} ${item.customer || ''} ${item.detail || ''}`.toLowerCase();
    const status = item.paymentStatus || 'Paid';
    return (!search || haystack.includes(search))
      && (!dateFilter || item.date === dateFilter)
      && (!statusFilter || status === statusFilter);
  });
  tbody.innerHTML = records.length ? records.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.date ? new Date(item.date).toLocaleDateString('en-IN') : ''}</td>
      <td>${rnEscapeHtml(item.detail)}</td>
      <td>${rnMoney(item.rate)}</td>
      <td>${Number(item.count || 0).toLocaleString('en-IN')}</td>
      <td style="font-weight:700;color:var(--c2)">${rnMoney(item.amount)}</td>
      <td><span class="rn-status ${((item.paymentStatus || 'Paid') === 'Paid') ? 'paid' : 'pending'}">${rnEscapeHtml(item.paymentStatus || 'Paid')}</span></td>
      <td><button class="plain-action-btn" title="Edit" onclick="editBricksIncome(${item.id})">✏️</button><button class="plain-action-btn danger" title="Delete" onclick="deleteBricksIncome(${item.id})">🗑️</button></td>
    </tr>
  `).join('') : `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:28px">No bricks income records for this month</td></tr>`;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTotal = allRecords
    .filter(item => item.date === todayKey)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthTotal = monthRecords.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const filteredTotal = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthSold = monthRecords.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const paidAmount = monthRecords
    .filter(item => (item.paymentStatus || 'Paid') === 'Paid')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pendingAmount = monthRecords
    .filter(item => (item.paymentStatus || 'Paid') === 'Pending')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthDate = selectedMonth ? new Date(`${selectedMonth}-01T00:00:00`) : new Date();
  const monthName = monthDate.toLocaleDateString('en-IN', { month:'long', year:'numeric' });
  const todayEl = document.getElementById('bricksTodayIncome');
  const monthLabel = document.getElementById('bricksMonthLabel');
  const totalEl = document.getElementById('bricksTotalIncome');
  const recordCount = document.getElementById('bricksRecordCount');
  const totalSold = document.getElementById('bricksTotalSold');
  const pendingEl = document.getElementById('bricksPendingAmount');
  const paidEl = document.getElementById('bricksPaidAmount');
  if (todayEl) todayEl.textContent = rnMoney(todayTotal);
  if (monthLabel) monthLabel.textContent = monthName;
  if (totalEl) totalEl.textContent = rnMoney(search ? filteredTotal : monthTotal);
  if (recordCount) recordCount.textContent = `${records.length} record${records.length === 1 ? '' : 's'}`;
  if (totalSold) totalSold.textContent = Number(monthSold || 0).toLocaleString('en-IN');
  if (pendingEl) pendingEl.textContent = rnMoney(pendingAmount);
  if (paidEl) paidEl.textContent = rnMoney(paidAmount);
}

document.addEventListener('keydown', e => {
  if (e.key==='Escape') { document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.add('hidden')); closeSidebar(); }
  if (e.key==='Enter'&&!document.getElementById('loginPage').classList.contains('hidden')) handleLogin();
});


/* ════════════════════════════════
   INVOICE GENERATOR
   ════════════════════════════════ */
async function loadInvoicePage() {
  // BUG 6 FIX: clientScope uses client_id field — demoClients use 'id'. Use direct filter.
  let clients;
  if (demoMode) {
    const cid = currentClientId();
    clients = isClientRole() ? demoClients.filter(c => Number(c.id) === cid) : [...demoClients];
  } else {
    clients = await api('GET', '/clients') || [];
    allClients = clients;
  }
  const sel = document.getElementById('invClientId');
  sel.innerHTML = clients.map(c=>`<option value="${c.id}">${c.name} — ${c.company_name||''}</option>`).join('');
  // Set default date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('invDate').value = today;
  const due = new Date(); due.setDate(due.getDate()+30);
  document.getElementById('invDueDate').value = due.toISOString().split('T')[0];
  if (demoMode) {
    document.getElementById('invNumber').value = 'INV-' + String(Date.now()).slice(-4);
  } else {
    const next = await api('GET', '/invoices/next-number');
    document.getElementById('invNumber').value = next?.invoice_number || 'INV-' + String(Date.now()).slice(-4);
  }
  previewInvoice();
  await loadInvoiceHistory();
}

function previewInvoice() {
  const cid = parseInt(document.getElementById('invClientId')?.value);
  const c   = (demoMode ? demoClients : allClients).find(x=>x.id===cid);
  if (!c) return;
  const invNum  = document.getElementById('invNumber')?.value || 'INV-001';
  const invDate = document.getElementById('invDate')?.value   || '—';
  const invDue  = document.getElementById('invDueDate')?.value|| '—';
  const notes   = document.getElementById('invNotes')?.value  || '';
  const remaining = (c.quotation_amount||0) - (c.paid_amount||0);
  const preview = document.getElementById('invoicePreview');
  if (!preview) return;
  preview.innerHTML = `
    <div class="invoice-doc" id="invoiceDoc">
      <div class="inv-header">
        <div class="inv-company-info">
          <div class="inv-company-name">Roriri Software Solutions</div>
          <div class="inv-company-details">contact@roriri.com | +91 98765 43210</div>
        </div>
        <div class="inv-meta">
          <div class="inv-title">INVOICE</div>
          <div class="inv-number">${invNum}</div>
        </div>
      </div>
      <div class="inv-dates-row">
        <div><span class="inv-label">Invoice Date:</span> ${invDate}</div>
        <div><span class="inv-label">Due Date:</span> ${invDue}</div>
      </div>
      <div class="inv-bill-to">
        <div class="inv-label">BILL TO</div>
        <div class="inv-client-name">${c.name}</div>
        <div class="inv-client-detail">${c.company_name||''}</div>
        <div class="inv-client-detail">${c.email}</div>
        <div class="inv-client-detail">${c.phone||''}</div>
      </div>
      <table class="inv-table">
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>${c.project_name||'Project Services'}</td><td>₹${(c.quotation_amount||0).toLocaleString('en-IN')}</td></tr>
          <tr class="inv-paid-row"><td>Amount Paid</td><td>- ₹${(c.paid_amount||0).toLocaleString('en-IN')}</td></tr>
        </tbody>
      </table>
      <div class="inv-total-row">
        <span>Balance Due</span>
        <span class="inv-total-amount">₹${remaining.toLocaleString('en-IN')}</span>
      </div>
      <div class="inv-status-badge">${c.payment_status === 'Paid' ? '✅ PAID IN FULL' : c.payment_status === 'Partial' ? '⚠ PARTIALLY PAID' : '🔴 PAYMENT DUE'}</div>
      ${notes ? `<div class="inv-notes"><div class="inv-label">NOTES</div><div>${notes}</div></div>` : ''}
      <div class="inv-footer">Thank you for your business! 🙏</div>
    </div>`;
}

async function loadInvoiceHistory() {
  const list = document.getElementById('invoiceHistoryList');
  if (!list) return;
  if (demoMode) {
    list.innerHTML = '<div class="invoice-history-empty">Saved invoices are available in live mode.</div>';
    return;
  }
  const res = await api('GET', '/invoices');
  if (!res || res.available === false) {
    list.innerHTML = '<div class="invoice-history-empty">Invoice database is not connected.</div>';
    return;
  }
  const invoices = res.invoices || [];
  list.innerHTML = invoices.length ? invoices.map(inv => `
    <button class="invoice-history-item" type="button" onclick="openSavedInvoice(${inv.id})">
      <span>
        <strong>${escapeHtml(inv.invoice_number)}</strong>
        <small>${escapeHtml(inv.bill_to || 'Client')}</small>
      </span>
      <span>
        <strong>₹${Number(inv.balance_due || 0).toLocaleString('en-IN')}</strong>
        <small>${formatCollegeDate(inv.invoice_date)}</small>
      </span>
    </button>`).join('') : '<div class="invoice-history-empty">No saved invoices yet.</div>';
}

function buildInvoicePayload() {
  const cid = parseInt(document.getElementById('invClientId')?.value);
  const c = (demoMode ? demoClients : allClients).find(x => Number(x.id) === cid);
  if (!c) return null;
  const quotation = Number(c.quotation_amount || 0);
  const paid = Number(c.paid_amount || 0);
  const balance = Math.max(quotation - paid, 0);
  const description = c.project_name || 'Project Services';
  return {
    invoice: {
      invoice_number: document.getElementById('invNumber')?.value || 'INV-0001',
      invoice_title: 'Tax Invoice',
      invoice_date: document.getElementById('invDate')?.value || new Date().toISOString().split('T')[0],
      bill_to: c.name || '',
      bill_to_address: [c.company_name, c.email, c.phone].filter(Boolean).join('\n'),
      company_name: 'Roriri Software Solutions',
      company_phone: '+91 98765 43210',
      company_email: 'contact@roriri.com',
      subtotal: quotation,
      total: quotation,
      payment_made: paid,
      balance_due: balance,
      notes: document.getElementById('invNotes')?.value || ''
    },
    items: [{
      description,
      quantity: 1,
      rate: quotation,
      base_amount: quotation,
      line_total: quotation
    }]
  };
}

async function saveInvoice() {
  if (demoMode) {
    showToast('Saving invoices needs live backend mode.', 'error');
    return;
  }
  const payload = buildInvoicePayload();
  if (!payload) {
    showToast('Please select a client first', 'error');
    return;
  }
  try {
    await api('POST', '/invoices', payload);
    showToast('Invoice saved successfully!', 'success');
    await loadInvoiceHistory();
    const next = await api('GET', '/invoices/next-number');
    if (next?.invoice_number) document.getElementById('invNumber').value = next.invoice_number;
    previewInvoice();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function openSavedInvoice(id) {
  try {
    const res = await api('GET', `/invoices/${id}`);
    const inv = res?.invoice;
    const item = res?.items?.[0];
    if (!inv) return;
    const preview = document.getElementById('invoicePreview');
    preview.innerHTML = `
      <div class="invoice-doc" id="invoiceDoc">
        <div class="inv-header">
          <div class="inv-company-info">
            <div class="inv-company-name">${escapeHtml(inv.company_name || 'Roriri Software Solutions')}</div>
            <div class="inv-company-details">${escapeHtml(inv.company_email || '')} | ${escapeHtml(inv.company_phone || '')}</div>
          </div>
          <div class="inv-meta">
            <div class="inv-title">${escapeHtml(inv.invoice_title || 'INVOICE')}</div>
            <div class="inv-number">${escapeHtml(inv.invoice_number)}</div>
          </div>
        </div>
        <div class="inv-dates-row"><div><span class="inv-label">Invoice Date:</span> ${escapeHtml(inv.invoice_date || '—')}</div></div>
        <div class="inv-bill-to">
          <div class="inv-label">BILL TO</div>
          <div class="inv-client-name">${escapeHtml(inv.bill_to || '')}</div>
          ${(inv.bill_to_address || '').split('\n').filter(Boolean).map(v => `<div class="inv-client-detail">${escapeHtml(v)}</div>`).join('')}
        </div>
        <table class="inv-table">
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>${escapeHtml(item?.description || 'Project Services')}</td><td>₹${Number(inv.total || 0).toLocaleString('en-IN')}</td></tr>
            <tr class="inv-paid-row"><td>Amount Paid</td><td>- ₹${Number(inv.payment_made || 0).toLocaleString('en-IN')}</td></tr>
          </tbody>
        </table>
        <div class="inv-total-row"><span>Balance Due</span><span class="inv-total-amount">₹${Number(inv.balance_due || 0).toLocaleString('en-IN')}</span></div>
        ${inv.notes ? `<div class="inv-notes"><div class="inv-label">NOTES</div><div>${escapeHtml(inv.notes)}</div></div>` : ''}
        <div class="inv-footer">Saved invoice record</div>
      </div>`;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function downloadInvoice() {
  const doc = document.getElementById('invoiceDoc');
  if (!doc) { showToast('Please select a client first','error'); return; }
  // Print as PDF
  const win = window.open('','_blank');
  win.document.write(`<html><head><title>Invoice</title>
    <style>
      body{font-family:sans-serif;padding:40px;color:#1a1e2e;background:#fff}
      .inv-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #6c63ff}
      .inv-company-name{font-size:22px;font-weight:800;color:#6c63ff}
      .inv-company-details{color:#666;font-size:13px;margin-top:4px}
      .inv-title{font-size:28px;font-weight:800;color:#1a1e2e;text-align:right}
      .inv-number{color:#6c63ff;font-size:14px;text-align:right}
      .inv-dates-row{display:flex;gap:40px;margin-bottom:24px;color:#555;font-size:14px}
      .inv-label{font-weight:700;color:#1a1e2e;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
      .inv-bill-to{background:#f5f6fa;padding:16px;border-radius:8px;margin-bottom:24px}
      .inv-client-name{font-size:18px;font-weight:700;margin:6px 0 4px}
      .inv-client-detail{color:#555;font-size:13px}
      .inv-table{width:100%;border-collapse:collapse;margin-bottom:16px}
      .inv-table th{background:#6c63ff;color:#fff;padding:10px 16px;text-align:left;font-size:13px}
      .inv-table td{padding:12px 16px;border-bottom:1px solid #eee;font-size:14px}
      .inv-paid-row td{color:#00875a}
      .inv-total-row{display:flex;justify-content:space-between;padding:16px;background:#1a1e2e;color:#fff;border-radius:8px;font-weight:700;font-size:18px;margin-bottom:16px}
      .inv-status-badge{text-align:center;padding:10px;font-weight:700;font-size:14px;background:#f0f2f8;border-radius:8px;margin-bottom:16px}
      .inv-notes{padding:16px;border:1px solid #eee;border-radius:8px;font-size:13px;color:#555;margin-bottom:16px}
      .inv-footer{text-align:center;color:#888;font-size:13px;padding-top:20px;border-top:1px solid #eee}
    </style></head><body>${doc.innerHTML}</body></html>`);
  win.document.close();
  setTimeout(()=>win.print(), 500);
  showToast('Invoice opened for printing/saving as PDF!','success');
}

/* ════════════════════════════════
   COLLEGE PORTAL PREVIEW
   ════════════════════════════════ */
async function loadCollegePage() {
  const root = document.getElementById('collegeContent');
  if (!root) return;
  root.innerHTML = '<div class="college-loading">Loading college data...</div>';

  try {
    const [summary, collegesRes, ivRes, galleryRes, enquiriesRes] = await Promise.all([
      api('GET', '/college/summary'),
      api('GET', '/college/colleges'),
      api('GET', '/college/iv-data'),
      api('GET', '/college/gallery'),
      api('GET', '/college/enquiries')
    ]);

    if (!summary || summary.available === false) {
      root.innerHTML = `
        <div class="college-empty-panel">
          <div class="college-empty-title">College database is not connected</div>
          <div class="college-empty-text">Import college_db or set COLLEGE_DB_HOST, COLLEGE_DB_USER, COLLEGE_DB_PASSWORD, and COLLEGE_DB_NAME in the backend .env file.</div>
          <a class="college-open-link" href="https://college.roririsoft.com/login.php" target="_blank" rel="noopener">Open existing portal</a>
        </div>`;
      return;
    }

    const stats = summary.stats || {};
    const colleges = collegesRes?.colleges || [];
    const ivRows = ivRes?.records || [];
    const gallery = galleryRes?.images || [];
    const enquiries = enquiriesRes?.enquiries || [];
    const firstCollege = colleges[0] || {};

    collegeDashboardData = { stats, colleges, ivRows, gallery, enquiries, firstCollege };
    renderCollegeDashboard();
  } catch (err) {
    root.innerHTML = `<div class="college-empty-panel"><div class="college-empty-title">Unable to load college data</div><div class="college-empty-text">${escapeHtml(err.message || 'Please check the backend and database connection.')}</div></div>`;
  }
}

function renderCollegeDashboard(tab = collegeActiveTab) {
  collegeActiveTab = tab;
  const root = document.getElementById('collegeContent');
  if (!root || !collegeDashboardData) return;
  const { stats, firstCollege } = collegeDashboardData;

  root.innerHTML = `
    ${collegeHeroPanel(firstCollege, stats)}

    <div class="college-panel college-browser">
      <div class="college-tabs">
        ${collegeTabButton('iv', 'IV Records', stats.ivRecords)}
        ${collegeTabButton('enquiries', 'Enquiries', stats.enquiries)}
        ${collegeTabButton('gallery', 'Gallery', stats.galleryImages)}
      </div>
      <div id="collegeTabContent">${renderCollegeTabContent()}</div>
    </div>`;
}

function collegeHeroPanel(c = {}, stats = {}) {
  if (!c.id) return `
    <div class="college-hero-panel">
      <div>
        <div class="college-kicker">College Portal</div>
        <div class="college-profile-name">No college records found</div>
        <div class="college-profile-meta">Import college data to view the dashboard.</div>
      </div>
    </div>`;

  return `
    <div class="college-hero-panel">
      <div class="college-hero-main">
        <div class="college-kicker">College Portal</div>
        <div class="college-profile-name">${escapeHtml(c.name)}</div>
        <div class="college-profile-meta">${escapeHtml([c.street, c.city, c.state, c.pin].filter(Boolean).join(', ') || c.location || 'Address not added')}</div>
        <div class="college-contact-row">
          <span>${escapeHtml(c.phone || 'No phone')}</span>
          <span>${escapeHtml(c.email || 'No email')}</span>
          <span>MOU: ${escapeHtml(c.mou_status || '-')}</span>
        </div>
      </div>
      <div class="college-metric-strip">
        ${collegeMetricPill('IV', stats.ivRecords)}
        ${collegeMetricPill('Gallery', stats.galleryImages)}
        ${collegeMetricPill('Enquiries', stats.enquiries)}
        ${collegeMetricPill('Internships', stats.internships)}
        ${collegeMetricPill('Placements', stats.placements)}
      </div>
    </div>`;
}

function collegeMetricPill(label, value) {
  return `
    <div class="college-metric-pill">
      <span>${escapeHtml(label)}</span>
      <strong>${Number(value || 0).toLocaleString('en-IN')}</strong>
    </div>`;
}

function collegeProfileCard(c = {}) {
  if (!c.id) return '<div class="college-panel"><div class="college-panel-title">College Profile</div><div class="college-muted">No college records found.</div></div>';
  return `
    <div class="college-panel college-profile-card">
      <div class="college-panel-title">College Profile</div>
      <div class="college-profile-name">${escapeHtml(c.name)}</div>
      <div class="college-profile-meta">${escapeHtml([c.street, c.city, c.state, c.pin].filter(Boolean).join(', ') || c.location || 'Address not added')}</div>
      <div class="college-profile-list">
        <div><span>Phone</span><strong>${escapeHtml(c.phone || '-')}</strong></div>
        <div><span>Email</span><strong>${escapeHtml(c.email || '-')}</strong></div>
        <div><span>Principal</span><strong>${escapeHtml(c.principal_name || '-')}</strong></div>
        <div><span>MOU</span><strong>${escapeHtml(c.mou_status || '-')}</strong></div>
      </div>
    </div>`;
}

function collegeTabButton(tab, label, count) {
  return `<button class="college-tab ${collegeActiveTab === tab ? 'active' : ''}" type="button" onclick="renderCollegeDashboard('${tab}')"><span>${escapeHtml(label)}</span><strong>${Number(count || 0).toLocaleString('en-IN')}</strong></button>`;
}

function renderCollegeTabContent() {
  const { ivRows, gallery, enquiries } = collegeDashboardData || {};
  if (collegeActiveTab === 'enquiries') return renderCollegeEnquiries(enquiries || []);
  if (collegeActiveTab === 'gallery') return renderCollegeGallery(gallery || []);
  return renderCollegeIvRows(ivRows || []);
}

function renderCollegeIvRows(rows) {
  return `
    <div class="college-table-head">
      <div>
        <div class="college-panel-title">Latest IV Student Records</div>
        <div class="college-muted">Showing latest ${Math.min(rows.length, 12)} records</div>
      </div>
    </div>
    <div class="table-wrap college-table-wrap">
      <table class="data-table">
        <thead><tr><th>#</th><th>Student</th><th>Department</th><th>Date</th><th>Time</th><th>Phone</th><th>Email</th></tr></thead>
        <tbody>
          ${rows.length ? rows.slice(0, 12).map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(r.student_name)}</td>
              <td>${escapeHtml(r.department)}</td>
              <td>${formatCollegeDate(r.date)}</td>
              <td>${escapeHtml(r.time || '-')}</td>
              <td>${escapeHtml(r.phone_number || '-')}</td>
              <td>${escapeHtml(r.mail_id || '-')}</td>
            </tr>`).join('') : '<tr><td colspan="7">No IV records found.</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

function renderCollegeEnquiries(enquiries) {
  return `
    <div class="college-panel-title">Recent College Enquiries</div>
    <div class="college-enquiry-list">
      ${enquiries.length ? enquiries.map(e => `
        <div class="college-enquiry-item">
          <div class="college-enquiry-top"><span>${escapeHtml(e.category || 'enquiry')}</span><span>${escapeHtml(e.status || '')}</span></div>
          <div class="college-enquiry-msg">${escapeHtml(e.message || '-')}</div>
          ${e.reply_message ? `<div class="college-enquiry-reply">Reply: ${escapeHtml(e.reply_message)}</div>` : ''}
          <div class="college-muted">${formatDate(e.created_at)}</div>
        </div>`).join('') : '<div class="college-muted">No enquiries yet.</div>'}
    </div>`;
}

function renderCollegeGallery(gallery) {
  return `
    <div class="college-table-head">
      <div>
        <div class="college-panel-title">Recent Gallery Images</div>
        <div class="college-muted">Images are loaded from the college portal uploads folder</div>
      </div>
    </div>
    <div class="college-gallery-grid">
      ${gallery.length ? gallery.slice(0, 12).map((g, i) => `
        <div class="college-gallery-card">
          <div class="college-gallery-thumb">
            <img src="${escapeHtml(collegeImageUrl(g.image_path))}" alt="${escapeHtml(shortFileName(g.image_path))}" loading="lazy" onerror="this.closest('.college-gallery-card').classList.add('image-missing')"/>
            <div class="college-gallery-fallback">Image unavailable</div>
          </div>
          <div class="college-gallery-caption" title="${escapeHtml(g.image_path)}">Gallery Photo ${String(i + 1).padStart(2, '0')}</div>
          <div class="college-gallery-date">${formatDate(g.uploaded_at)}</div>
        </div>`).join('') : '<div class="college-muted">No gallery files found.</div>'}
    </div>`;
}

function collegeStatCard(label, value) {
  return `
    <div class="college-stat-card">
      <div class="college-stat-label">${escapeHtml(label)}</div>
      <div class="college-stat-value">${Number(value || 0).toLocaleString('en-IN')}</div>
    </div>`;
}

function formatCollegeDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function shortFileName(path) {
  const name = String(path || '').split(/[\\/]/).pop() || path || '-';
  return name.length > 54 ? `${name.slice(0, 28)}...${name.slice(-18)}` : name;
}

function collegeImageUrl(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${COLLEGE_PORTAL_BASE}${value.replace(/^\/+/, '')}`;
}

/* ════════════════════════════════
   PROJECT TIMELINE
   ════════════════════════════════ */
/* ════════════════════════════════
   DEMO MILESTONES — replaces hardcoded timelines
   Saved to demoMilestones in memory (demo) or DB (live)
   ════════════════════════════════ */
let demoMilestones = {
  'client:c_1': [
    { id:1, client_id:1, title:'Project Kickoff',     date:'2025-01-15', status:'Completed',   description:'Initial meeting and requirements gathered' },
    { id:2, client_id:1, title:'UI/UX Design',         date:'2025-02-01', status:'Completed',   description:'Wireframes and design approved by client' },
    { id:3, client_id:1, title:'Frontend Development', date:'2025-02-20', status:'Completed',   description:'All pages built and responsive' },
    { id:4, client_id:1, title:'Backend Development',  date:'2025-03-10', status:'In Progress', description:'API integration in progress' },
    { id:5, client_id:1, title:'Testing & Delivery',   date:'2025-03-25', status:'Pending',     description:'QA and final delivery' },
  ],
  'client:c_3': [
    { id:6, client_id:3, title:'Requirements Gathering', date:'2025-02-18', status:'Completed', description:'Full ERP scope documented' },
    { id:7, client_id:3, title:'Development',            date:'2025-03-01', status:'Completed', description:'ERP system built' },
    { id:8, client_id:3, title:'Client Training',        date:'2025-03-10', status:'Completed', description:'Team trained on system usage' },
    { id:9, client_id:3, title:'Delivery',               date:'2025-03-15', status:'Completed', description:'Project completed successfully' },
  ],
};
let msNextId = 10;
let currentTlClientId = null;
let currentTlProjectId = null;
let currentTlProject = null;
let timelineProjects = [];
let pendingTimelineProjectKey = null;
let _lastMilestones   = [];
let editingMsId       = null;

const DEFAULT_MILESTONES = [
  { title:'Project Kickoff',   description:'Initial meeting, requirements gathering and scope defined' },
  { title:'Design & Planning', description:'UI/UX wireframes, architecture planning and design approval' },
  { title:'Development',       description:'Core development and feature implementation' },
  { title:'Testing & Review',  description:'QA testing, bug fixes and client review' },
  { title:'Delivery & Launch', description:'Final delivery, deployment and handover to client' },
];

function timelineProjectKey(project) {
  if (!project) return '';
  const source = project.source || (String(project.id).startsWith('c_') ? 'client' : 'project');
  return `${source}:${project.id}`;
}

function normalizeTimelineProject(project, clients = []) {
  const client = clients.find(c => Number(c.id) === Number(project.client_id));
  return {
    ...project,
    client_name: project.client_name || client?.name || '',
    company_name: project.company_name || client?.company_name || '',
    phone: project.phone || project.client_phone || client?.phone || '',
    source: project.source || (String(project.id).startsWith('c_') ? 'client' : 'project')
  };
}

function clientProfileProjects(clients, existingProjects = []) {
  const existingClientIds = new Set(existingProjects.map(p => Number(p.client_id)).filter(Boolean));
  return (clients || [])
    .filter(c => c.project_name && !existingClientIds.has(Number(c.id)))
    .map(c => ({
      id: `c_${c.id}`,
      source: 'client',
      client_id: c.id,
      client_name: c.name,
      company_name: c.company_name || '',
      phone: c.phone || '',
      project_name: c.project_name,
      project_status: c.project_status,
      budget: c.quotation_amount || 0,
      paid_amount: c.paid_amount || 0,
      payment_status: c.payment_status,
      start_date: c.created_at || '',
      deadline: c.deadline || '',
      description: ''
    }));
}

function normalizeWhatsAppNumber(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  return digits;
}

function buildMilestoneWhatsAppText(milestone, projectObj = currentTlProject) {
  const clientName = projectObj?.client_name || 'Client';
  const projectName = projectObj?.project_name || 'your project';
  const title = milestone?.title || 'Project milestone';
  const status = milestone?.status || 'Updated';
  const date = milestone?.date ? `\nDate: ${milestone.date}` : '';
  return `Hi ${clientName},\n\nYour project "${projectName}" milestone "${title}" is now ${status}.${date}\n\n- Roriri Software Solutions`;
}

function milestoneWhatsAppUrl(milestone, projectObj = currentTlProject) {
  const number = normalizeWhatsAppNumber(projectObj?.phone);
  if (!number) return '';
  return `https://wa.me/${number}?text=${encodeURIComponent(buildMilestoneWhatsAppText(milestone, projectObj))}`;
}

function openMilestoneWhatsApp(id) {
  const milestone = _lastMilestones.find(x => Number(x.id) === Number(id));
  if (!milestone) { showToast('Milestone not found', 'error'); return; }
  const url = milestoneWhatsAppUrl(milestone, currentTlProject);
  if (!url) {
    showToast('Client WhatsApp number is missing. Add phone number in Client details.', 'error');
    return;
  }
  window.open(url, '_blank', 'noopener');
}

async function getTimelineProjects() {
  if (demoMode) {
    const cid = currentClientId();
    const clients = isClientRole() ? demoClients.filter(c => Number(c.id) === cid) : [...demoClients];
    const dedicated = demoProjects
      .filter(p => p.client_id && (!isClientRole() || Number(p.client_id) === cid))
      .map(p => normalizeTimelineProject(p, clients));
    return [...dedicated, ...clientProfileProjects(clients, dedicated)];
  }

  const [projectsRaw, clientsRaw] = await Promise.all([
    api('GET', '/projects'),
    api('GET', '/clients')
  ]);
  const clients = clientsRaw || [];
  const dedicated = (projectsRaw || []).map(p => normalizeTimelineProject(p, clients));
  return [...dedicated, ...clientProfileProjects(clients, dedicated)];
}

async function autoGenerateMilestones(project) {
  const clientId = project.client_id;
  const projectId = timelineProjectKey(project);
  const today = new Date();
  for (let i = 0; i < DEFAULT_MILESTONES.length; i++) {
    const m = DEFAULT_MILESTONES[i];
    const d = new Date(today); d.setDate(d.getDate() + i * 14);
    const dateStr = d.toISOString().split('T')[0];
    if (demoMode) {
      if (!demoMilestones[projectId]) demoMilestones[projectId] = [];
      demoMilestones[projectId].push({ id:msNextId++, client_id:clientId, project_id:projectId, title:m.title, date:dateStr, status:'Pending', description:m.description });
    } else {
      await api('POST', '/milestones', { client_id:clientId, project_id:projectId, title:m.title, date:dateStr, status:'Pending', description:m.description });
    }
  }
}

/* BUG 2 FIX: use direct id filter instead of clientScope (which uses client_id field) */
async function loadTimelinePage() {
  timelineProjects = await getTimelineProjects();
  const sel = document.getElementById('timelineProjectId'); if (!sel) return;
  sel.innerHTML = '<option value="">-- Select a Project --</option>' +
    timelineProjects.map(p => {
      const key = timelineProjectKey(p);
      const label = isClientRole()
        ? p.project_name
        : `${p.client_name || 'Client'} - ${p.project_name}`;
      return `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`;
    }).join('');

  const preferred = pendingTimelineProjectKey || (isClientRole() && timelineProjects[0] ? timelineProjectKey(timelineProjects[0]) : '');
  if (preferred && timelineProjects.some(p => timelineProjectKey(p) === preferred)) {
    sel.value = preferred;
    pendingTimelineProjectKey = null;
    await loadTimeline();
  }
}

/* BUG 1 FIX: reads from demoMilestones/DB, not hardcoded timelines object */
async function loadTimeline() {
  currentTlProjectId = document.getElementById('timelineProjectId').value;
  currentTlProject = timelineProjects.find(p => timelineProjectKey(p) === currentTlProjectId) || null;
  currentTlClientId = currentTlProject ? Number(currentTlProject.client_id) : null;
  const container = document.getElementById('timelineContent');
  if (!currentTlProjectId || !currentTlProject) { container.innerHTML = ''; return; }

  let milestones = [];
  if (demoMode) {
    milestones = demoMilestones[currentTlProjectId] || [];
  } else {
    milestones = await api('GET', `/milestones?clientId=${currentTlClientId}&projectId=${encodeURIComponent(currentTlProjectId)}`) || [];
  }

  // Auto-generate defaults if none exist
  if (!milestones.length && currentTlProject?.project_name && !isClientRole()) {
    await autoGenerateMilestones(currentTlProject);
    milestones = demoMode
      ? (demoMilestones[currentTlProjectId] || [])
      : (await api('GET', `/milestones?clientId=${currentTlClientId}&projectId=${encodeURIComponent(currentTlProjectId)}`) || []);
  }

  _lastMilestones = milestones;
  renderTimeline(milestones, currentTlProject);
}

function renderTimeline(milestones, projectObj) {
  const container = document.getElementById('timelineContent');
  if (!milestones.length) {
    container.innerHTML = `
      <div class="timeline-empty-state">
        <div class="timeline-empty-icon">📅</div>
        <div class="timeline-empty-title">No milestones yet</div>
        <div class="timeline-empty-sub">Click "+ Add Milestone" to start tracking this project's progress</div>
        ${!isClientRole() ? `<button type="button" class="btn-primary" style="margin-top:16px" onclick="addMilestone()">+ Add First Milestone</button>` : ''}
      </div>`;
    return;
  }
  const done = milestones.filter(m => m.status === 'Completed').length;
  const pct  = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  container.innerHTML = `
    <div class="timeline-header-card">
      <div class="timeline-client-name">${escapeHtml(projectObj?.client_name||'Client')} - ${escapeHtml(projectObj?.project_name||'Project')}</div>
      <div class="timeline-progress-wrap">
        <div class="timeline-progress-label"><span>Overall Progress</span><span>${pct}%</span></div>
        <div class="profile-progress-track" style="height:12px">
          <div class="profile-progress-fill" style="width:${pct}%;background:${pct===100?'var(--c2)':pct>50?'var(--c1)':'var(--c3)'}"></div>
        </div>
      </div>
    </div>
    <div class="timeline-list">
      ${milestones.map((m, i) => {
        const dotClass = m.status==='Completed'?'dot-done':m.status==='In Progress'?'dot-active':'dot-pending';
        const dotIcon  = m.status==='Completed'?'✓':m.status==='In Progress'?'↻':'○';
        const bdgClass = m.status==='Completed'?'badge-completed':m.status==='In Progress'?'badge-progress':'badge-pending';
        return `
        <div class="timeline-item">
          <div class="timeline-left">
            <div class="timeline-dot ${dotClass}">${dotIcon}</div>
            ${i < milestones.length-1 ? '<div class="timeline-line"></div>' : ''}
          </div>
          <div class="timeline-body">
            <div class="timeline-title-row">
              <div class="timeline-title">${m.title}</div>
              ${!isClientRole() ? `
              <div class="timeline-actions">
                <button type="button" class="ms-action-btn ms-whatsapp-btn" title="Send WhatsApp update" onclick="openMilestoneWhatsApp(${m.id})"><i class="fa-brands fa-whatsapp"></i></button>
                <button type="button" class="ms-action-btn" title="Edit"   onclick="editMilestone(${m.id})">✏️</button>
                <button type="button" class="ms-action-btn" title="Delete" onclick="deleteMilestone(${m.id})">🗑️</button>
              </div>` : ''}
            </div>
            <div class="timeline-date">📅 ${m.date||'—'}</div>
            ${(m.description||m.desc) ? `<div class="timeline-desc">${m.description||m.desc}</div>` : ''}
            ${!isClientRole() ? `
            <div class="ms-status-btns">
              <button type="button" class="ms-status-btn ${m.status==='Pending'?'active':''}"     onclick="updateMilestoneStatus(${m.id},'Pending')">○ Pending</button>
              <button type="button" class="ms-status-btn ${m.status==='In Progress'?'active':''}" onclick="updateMilestoneStatus(${m.id},'In Progress')">↻ In Progress</button>
              <button type="button" class="ms-status-btn ${m.status==='Completed'?'active':''}"   onclick="updateMilestoneStatus(${m.id},'Completed')">✓ Completed</button>
            </div>` : `<span class="badge ${bdgClass}">${m.status}</span>`}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function addMilestone() {
  if (isClientRole()) return;
  const projectKey = document.getElementById('timelineProjectId').value;
  if (!projectKey || !currentTlProject) { showToast('Please select a project first', 'error'); return; }
  editingMsId = null;
  document.getElementById('msTitle').value  = '';
  document.getElementById('msDate').value   = new Date().toISOString().split('T')[0];
  document.getElementById('msStatus').value = 'Pending';
  document.getElementById('msDesc').value   = '';
  const h = document.querySelector('#milestoneModal .modal-header h3'); if (h) h.textContent = 'Add Milestone';
  document.getElementById('milestoneModal').classList.remove('hidden');
}

function editMilestone(id) {
  const m = _lastMilestones.find(x => x.id === id); if (!m) return;
  editingMsId = id;
  document.getElementById('msTitle').value  = m.title || '';
  document.getElementById('msDate').value   = m.date  || '';
  document.getElementById('msStatus').value = m.status || 'Pending';
  document.getElementById('msDesc').value   = m.description || m.desc || '';
  const h = document.querySelector('#milestoneModal .modal-header h3'); if (h) h.textContent = 'Edit Milestone';
  document.getElementById('milestoneModal').classList.remove('hidden');
}

function closeMilestoneModal() { document.getElementById('milestoneModal').classList.add('hidden'); editingMsId = null; }

async function saveMilestone(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const cid   = currentTlClientId;
  const projectId = currentTlProjectId;
  const title = document.getElementById('msTitle').value.trim();
  if (!title) { showToast('Title is required', 'error'); return; }
  if (!cid || !projectId) { showToast('Please select a project first', 'error'); return; }
  const payload = { client_id:cid, project_id:projectId, title, date:document.getElementById('msDate').value, status:document.getElementById('msStatus').value, description:document.getElementById('msDesc').value };
  if (demoMode) {
    if (editingMsId) {
      const arr = demoMilestones[projectId] || [], idx = arr.findIndex(x => x.id === editingMsId);
      if (idx > -1) arr[idx] = { ...arr[idx], ...payload, desc: payload.description };
    } else {
      if (!demoMilestones[projectId]) demoMilestones[projectId] = [];
      demoMilestones[projectId].push({ id:msNextId++, ...payload, desc:payload.description });
    }
  } else {
    editingMsId ? await api('PUT', `/milestones/${editingMsId}`, payload) : await api('POST', '/milestones', payload);
  }
  showToast(editingMsId ? 'Milestone updated!' : 'Milestone added!', 'success');
  editingMsId = null; closeMilestoneModal(); await loadTimeline();
}

async function deleteMilestone(id) {
  if (!confirm('Delete this milestone?')) return;
  const projectId = currentTlProjectId;
  if (demoMode) { if (demoMilestones[projectId]) demoMilestones[projectId] = demoMilestones[projectId].filter(x => x.id !== id); }
  else await api('DELETE', `/milestones/${id}`);
  showToast('Milestone deleted.', 'info'); await loadTimeline();
}

async function updateMilestoneStatus(id, status) {
  const projectId = currentTlProjectId;
  const existingMilestone = _lastMilestones.find(x => Number(x.id) === Number(id)) || {};
  const whatsappUrl = milestoneWhatsAppUrl({ ...existingMilestone, status }, currentTlProject);
  if (demoMode) { const m = (demoMilestones[projectId]||[]).find(x => x.id === id); if (m) m.status = status; }
  else { await api('PUT', `/milestones/${id}`, { ...existingMilestone, status }); }
  await loadTimeline();
  if (whatsappUrl) {
    window.open(whatsappUrl, '_blank', 'noopener');
    showToast('Milestone updated. WhatsApp message is ready to send.', 'success');
  } else {
    showToast('Milestone updated. Add client phone number to send WhatsApp.', 'info');
  }
}

/* ════════════════════════════════
   RATINGS & FEEDBACK
   ════════════════════════════════ */
let ratings = [
  { id:1, clientId:3, clientName:'Ravi Kumar',   company:'Enterprise Solutions', rating:5, feedback:'Excellent work! Delivered on time and exactly what we needed.', date:'2025-03-05' },
  { id:2, clientId:5, clientName:'Sanjay Patel', company:'Digital Agency',       rating:4, feedback:'Great service and communication throughout the project.', date:'2025-03-22' },
];
let selectedRating = 0;
let ratingNextId = 3;

function loadRatings() {
  const visibleRatings = isClientRole() ? ratings.filter(r => r.clientId === currentClientId()) : ratings;
  // Summary
  const avg = visibleRatings.length ? (visibleRatings.reduce((s,r)=>s+r.rating,0)/visibleRatings.length).toFixed(1) : 0;
  document.getElementById('ratingsSummary').innerHTML = `
    <div class="rating-summary-card">
      <div class="rating-avg-num">${avg}</div>
      <div class="rating-avg-stars">${renderStars(parseFloat(avg))}</div>
      <div class="rating-avg-label">Average Rating</div>
      <div class="rating-avg-count">${visibleRatings.length} review${visibleRatings.length!==1?'s':''}</div>
    </div>
    <div class="rating-bars-card">
      ${[5,4,3,2,1].map(n=>{
        const count = visibleRatings.filter(r=>r.rating===n).length;
        const pct   = visibleRatings.length ? (count/visibleRatings.length*100).toFixed(0) : 0;
        return `<div class="rating-bar-row">
          <span class="rating-bar-label">${n}★</span>
          <div class="rating-bar-track"><div class="rating-bar-fill" style="width:${pct}%;background:${n>=4?'var(--c2)':n===3?'var(--c4)':'var(--c3)'}"></div></div>
          <span class="rating-bar-count">${count}</span>
        </div>`;
      }).join('')}
    </div>`;

  // Grid
  document.getElementById('ratingsGrid').innerHTML = visibleRatings.length
    ? visibleRatings.map(r=>`
        <div class="rating-card">
          <div class="rating-card-header">
            <div class="rating-avatar">${r.clientName.charAt(0)}</div>
            <div>
              <div class="rating-client-name">${r.clientName}</div>
              <div class="rating-company">${r.company}</div>
            </div>
            <div class="rating-stars">${renderStars(r.rating)}</div>
          </div>
          <div class="rating-feedback">"${r.feedback}"</div>
          <div class="rating-date">📅 ${r.date}</div>
        </div>`).join('')
    : '<div class="empty-state"><div class="empty-state-icon">⭐</div><div class="empty-state-text">No ratings yet</div></div>';
}

function renderStars(n) {
  return [1,2,3,4,5].map(i=>`<span style="color:${i<=n?'#ffb347':'#444'};font-size:1.1rem">★</span>`).join('');
}

function openRatingModal() {
  selectedRating = 0;
  document.getElementById('ratingFeedback').value='';
  setRating(0);
  document.getElementById('ratingModal').classList.remove('hidden');
}
function closeRatingModal() { document.getElementById('ratingModal').classList.add('hidden'); }

function setRating(val) {
  selectedRating = val;
  document.querySelectorAll('.star-input').forEach((s,i)=>{
    s.style.color = i < val ? '#ffb347' : '#555';
  });
}

function submitRating() {
  if (!selectedRating) { showToast('Please select a rating','error'); return; }
  const clientId = parseInt(sessionStorage.getItem('nexacrm_clientId'));
  const client   = demoClients.find(c=>c.id===clientId) || { name:'Client', company_name:'' };
  ratings.push({ id:ratingNextId++, clientId, clientName:client.name, company:client.company_name||'', rating:selectedRating, feedback:document.getElementById('ratingFeedback').value||'Great service!', date:new Date().toISOString().split('T')[0] });
  showToast('Thank you for your feedback! ⭐','success');
  closeRatingModal();
}

/* ════════════════════════════════
   PUBLIC ENQUIRY FORM
   ════════════════════════════════ */
const EMPLOYEES_DEMO_KEY = 'nexacrm_demo_employees';
const defaultEmployees = [
  { id:1, name:'Nambirajan', role:'Developer', email:'Nambi@gmail.com', phone:'9887764545', department:'Development', current_project:'Ledger', status:'Active' },
  { id:2, name:'Anushiya', role:'Developer', email:'Anushiya@gmail.com', phone:'9876544433', department:'Development', current_project:'Ledger', status:'Active' },
  { id:3, name:'Varsha', role:'Developer', email:'varsha@gmail.com', phone:'8656546776', department:'Development', current_project:'Ledger', status:'Active' },
  { id:4, name:'Sakthi Anand', role:'Developer', email:'sakthi@gmail.com', phone:'8774549867', department:'Development', current_project:'ERP', status:'Active' },
  { id:5, name:'Nathiya', role:'Developer', email:'nathiya@gmail.com', phone:'6767677666', department:'Development', current_project:'Ledger', status:'Active' },
  { id:6, name:'Kaniyalan', role:'Developer', email:'kaniyalan@gmail.com', phone:'8777666655', department:'Development', current_project:'KingsSchool', status:'Active' },
  { id:7, name:'Sujin', role:'Developer', email:'Sujin@gmail.com', phone:'9188258968', department:'Development', current_project:'Summercamp', status:'Active' },
];
let employees = loadDemoEmployees();
let employeeNextId = Math.max(0, ...employees.map(e => Number(e.id) || 0)) + 1;
let editingEmployeeId = null;
let allEmployees = [];

function loadDemoEmployees() {
  try {
    return JSON.parse(localStorage.getItem(EMPLOYEES_DEMO_KEY) || 'null') || [...defaultEmployees];
  } catch {
    return [...defaultEmployees];
  }
}

function saveDemoEmployees() {
  localStorage.setItem(EMPLOYEES_DEMO_KEY, JSON.stringify(employees));
}

async function loadEmployees() {
  allEmployees = onlyActivePeople(demoMode ? employees : (await api('GET','/employees') || []));
  updateEmployeeMetrics();
  renderEmployees(allEmployees);
}

function updateEmployeeMetrics() {
  const total = (allEmployees || []).length;
  const activeProjects = (allEmployees || []).filter(e => (e.current_project || '').trim()).length;
  const totalEl = document.getElementById('employeeTotalCount');
  const activeEl = document.getElementById('employeeActiveProjectCount');
  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = activeProjects;
}

function employeeStatusBadge(status) {
  const icon = status === 'Active' ? '🟢' : status === 'Completed' ? '✅' : status === 'Training' ? '🔵' : '🟡';
  const cls = status === 'Active' ? 'active' : status === 'Completed' ? 'completed' : status === 'Training' ? 'training' : 'hold';
  return `<span class="intern-status ${cls}">${icon} ${status || 'Active'}</span>`;
}

function filterEmployees() {
  const search = (document.getElementById('employeeSearch')?.value || '').toLowerCase();
  const role = document.getElementById('employeeRoleFilter')?.value || '';
  const status = document.getElementById('employeeStatusFilter')?.value || '';
  const date = document.getElementById('employeeDateFilter')?.value || '';
  const filtered = onlyActivePeople(allEmployees).filter(e => {
    const haystack = [e.name, e.email, e.role, e.current_project].map(v => (v || '').toLowerCase());
    const roleText = e.role || '';
    return (!search || haystack.some(v => v.includes(search))) &&
      (!role || roleText.includes(role)) &&
      (!status || e.status === status) &&
      (!date || (e.created_at || '').slice(0,10) === date);
  });
  renderEmployees(filtered);
}

function renderEmployees(data) {
  const tbody = document.getElementById('employeesTbody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">◍</div><div class="empty-state-text">No employees yet</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((e, idx) => `
    <tr class="client-row">
      <td class="row-num">${String(idx + 1).padStart(2,'0')}</td>
      <td><strong style="color:var(--text-primary)">${e.name || ''}</strong></td>
      <td>${e.role || ''}</td>
      <td>${e.email || ''}</td>
      <td>${e.phone || ''}</td>
      <td>${e.department || ''}</td>
      <td>${e.current_project || ''}</td>
      <td>${employeeStatusBadge(e.status)}</td>
      <td class="action-icons">
        <button class="plain-action-btn" title="View" onclick="viewEmployee('${e.id}')">👁</button>
        <button class="plain-action-btn" title="Edit" onclick="openEmployeeModal('${e.id}')">✏️</button>
        <button class="plain-action-btn danger" title="Delete" onclick="deleteEmployee('${e.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function toggleEmployeeMenu(event, id) {
  event.stopPropagation();
  document.querySelectorAll('.intern-menu').forEach(m => {
    if (m.id !== `employeeMenu-${id}`) m.classList.add('hidden');
  });
  document.getElementById(`employeeMenu-${id}`)?.classList.toggle('hidden');
}

function getEmployeeById(id) {
  return employees.find(e => String(e.id) === String(id));
}

async function openEmployeeModal(id = null) {
  editingEmployeeId = id;
  const employee = id ? (demoMode ? getEmployeeById(id) : await api('GET', `/employees/${id}`)) : {};
  if (employee?.source === 'erp') {
    editingEmployeeId = null;
    showToast('ERP employee records are read-only here', 'info');
    return;
  }
  document.getElementById('employeeModalTitle').textContent = id ? 'Edit Employee' : 'Add Employee Manually';
  document.getElementById('employeeId').value = employee?.id || '';
  document.getElementById('employeeName').value = employee?.name || '';
  document.getElementById('employeeEmail').value = employee?.email || '';
  document.getElementById('employeePhone').value = employee?.phone || '';
  document.getElementById('employeeRole').value = employee?.role || '';
  document.getElementById('employeeCurrentProject').value = employee?.current_project || '';
  document.getElementById('employeeStatus').value = employee?.status || 'Active';
  const modal = document.getElementById('employeeModal');
  modal?.classList.remove('hidden', 'modal-closing');
  resetEmployeeValidation();
  setTimeout(() => document.getElementById('employeeName')?.focus(), 120);
}

function closeEmployeeModal() {
  const modal = document.getElementById('employeeModal');
  if (modal && !modal.classList.contains('hidden')) {
    modal.classList.add('modal-closing');
    setTimeout(() => modal.classList.add('hidden'), 180);
  }
  editingEmployeeId = null;
  resetEmployeeValidation();
}

const employeeValidators = {
  employeeName: value => {
    const clean = value.trim();
    if (!clean) return 'Full name is required.';
    if (clean.length < 3) return 'Enter at least 3 characters.';
    if (!/^[A-Za-z ]+$/.test(clean)) return 'Use alphabets and spaces only.';
    return '';
  },
  employeeEmail: value => {
    const clean = value.trim();
    if (!clean) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) return 'Enter a valid email address.';
    return '';
  },
  employeePhone: value => {
    const clean = value.trim();
    if (!clean) return 'Phone number is required.';
    if (!/^\d{10}$/.test(clean)) return 'Enter exactly 10 digits.';
    return '';
  },
  employeeRole: value => value ? '' : 'Select a position role.'
};

function employeeFieldIds() {
  return Object.keys(employeeValidators);
}

function setEmployeeFieldState(id, message, touched = true) {
  const input = document.getElementById(id);
  const error = document.getElementById(`${id}Error`);
  const group = input?.closest('.candidate-field');
  if (!input || !error || !group) return false;
  const valid = !message;
  input.setAttribute('aria-invalid', String(!valid));
  error.textContent = touched ? message : '';
  group.classList.toggle('is-valid', touched && valid);
  group.classList.toggle('is-invalid', touched && !valid);
  return valid;
}

function validateEmployeeField(id, touched = true) {
  const input = document.getElementById(id);
  if (!input) return false;
  if (id === 'employeeName') input.value = input.value.replace(/[^A-Za-z ]/g, '');
  if (id === 'employeePhone') input.value = input.value.replace(/\D/g, '').slice(0, 10);
  return setEmployeeFieldState(id, employeeValidators[id](input.value, input), touched);
}

function isEmployeeFormValid() {
  return employeeFieldIds().every(id => {
    const input = document.getElementById(id);
    return input && !employeeValidators[id](input.value, input);
  });
}

function syncEmployeeSubmitState() {
  const valid = isEmployeeFormValid();
  const submit = document.getElementById('employeeSubmitBtn');
  const form = document.getElementById('employeeCandidateForm');
  if (submit) submit.disabled = !valid;
  form?.classList.toggle('candidate-valid', valid);
  return valid;
}

function validateEmployeeForm({ focusFirst = false, touched = true } = {}) {
  let firstInvalid = null;
  let valid = true;
  employeeFieldIds().forEach(id => {
    const fieldValid = validateEmployeeField(id, touched);
    if (!fieldValid && !firstInvalid) firstInvalid = document.getElementById(id);
    if (!fieldValid) valid = false;
  });
  syncEmployeeSubmitState();
  if (!valid && focusFirst && firstInvalid) {
    const submit = document.getElementById('employeeSubmitBtn');
    firstInvalid.focus();
    submit?.classList.remove('shake');
    void submit?.offsetWidth;
    submit?.classList.add('shake');
  }
  return valid;
}

function resetEmployeeValidation() {
  employeeFieldIds().forEach(id => {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}Error`);
    const group = input?.closest('.candidate-field');
    if (!input || !error || !group) return;
    input.setAttribute('aria-invalid', 'false');
    error.textContent = '';
    group.classList.remove('is-valid', 'is-invalid');
  });
  const submit = document.getElementById('employeeSubmitBtn');
  const form = document.getElementById('employeeCandidateForm');
  if (submit) submit.disabled = true;
  form?.classList.remove('candidate-valid');
}

function initEmployeeValidation() {
  employeeFieldIds().forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    const eventName = input.type === 'file' || input.tagName === 'SELECT' ? 'change' : 'input';
    input.addEventListener(eventName, () => {
      validateEmployeeField(id);
      syncEmployeeSubmitState();
    });
    input.addEventListener('blur', () => validateEmployeeField(id));
  });
  document.getElementById('employeeCandidateForm')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (validateEmployeeForm({ focusFirst: true })) saveEmployee();
    }
  });
}

function employeePayload() {
  return {
    name: document.getElementById('employeeName').value.trim(),
    role: document.getElementById('employeeRole').value,
    email: document.getElementById('employeeEmail').value.trim(),
    phone: document.getElementById('employeePhone').value.trim(),
    department: 'Development',
    current_project: document.getElementById('employeeCurrentProject').value.trim(),
    status: document.getElementById('employeeStatus').value,
  };
}

async function saveEmployee() {
  if (!validateEmployeeForm({ focusFirst: true })) {
    showToast('Please fix the highlighted fields', 'error');
    return;
  }
  const payload = employeePayload();
  if (!payload.name) { showToast('Employee name is required','error'); return; }
  const wasEdit = Boolean(editingEmployeeId);
  if (demoMode) {
    if (editingEmployeeId) {
      const idx = employees.findIndex(e => String(e.id) === String(editingEmployeeId));
      if (idx > -1) employees[idx] = { ...employees[idx], ...payload };
    } else {
      employees.push({ id: employeeNextId++, ...payload });
    }
    saveDemoEmployees();
  } else {
    editingEmployeeId ? await api('PUT', `/employees/${editingEmployeeId}`, payload) : await api('POST', '/employees', payload);
  }
  closeEmployeeModal();
  showToast(wasEdit ? 'Employee updated' : 'Employee added', 'success');
  loadEmployees();
}

async function viewEmployee(id) {
  const employee = demoMode ? getEmployeeById(id) : await api('GET', `/employees/${id}`);
  if (!employee) return;
  showToast(`${employee.name} • ${employee.role || 'Employee'} • ${employee.current_project || 'No project'}`, 'info');
}

async function deleteEmployee(id) {
  if (!confirm('Delete this employee?')) return;
  const employee = (allEmployees || []).find(e => String(e.id) === String(id));
  if (employee?.source === 'erp') {
    showToast('ERP employee records are read-only here', 'info');
    return;
  }
  if (demoMode) {
    employees = employees.filter(e => String(e.id) !== String(id));
    saveDemoEmployees();
  }
  else await api('DELETE', `/employees/${id}`);
  showToast('Employee deleted', 'success');
  loadEmployees();
}

const INTERNS_DEMO_KEY = 'nexacrm_demo_interns';
const defaultInterns = [
  { id:1, name:'Hasmath Kathun H', email:'harmathhachu@gmail.com', phone:'9791992539', role:'Full Stack Intern', current_project:'NexaCRM', duration:'1 Month', start_date:'', status:'Active', college_name:'', skills:'' },
  { id:2, name:'Maharasi K', email:'kmaharasi6@gmail.com', phone:'7502448976', role:'Frontend Intern', current_project:'NexaCRM', duration:'3 Months', start_date:'', status:'Active', college_name:'', skills:'' },
  { id:3, name:'Sutherson Issac', email:'Issac@gmail.com', phone:'9361000479', role:'Full Stack Intern', current_project:'NexaCRM', duration:'3 Months', start_date:'', status:'Active', college_name:'', skills:'' },
  { id:4, name:'Rahul Selva', email:'rahulselva773@gmail.com', phone:'9751876460', role:'Full Stack Intern', current_project:'NexaCRM', duration:'3 Months', start_date:'', status:'Active', college_name:'', skills:'' },
  { id:5, name:'Barani Kumar', email:'Barani@gmail.com', phone:'9342449257', role:'Full Stack Intern', current_project:'NexaCRM', duration:'3 Months', start_date:'', status:'Active', college_name:'', skills:'' },
  { id:6, name:'Hari Hara Sudhan', email:'hari@gmail.com', phone:'9344667861', role:'Full Stack Intern', current_project:'ERP', duration:'3 Months', start_date:'', status:'Active', college_name:'', skills:'' },
  { id:7, name:'Antony Amal Rekshin', email:'rekshin@gmail.com', phone:'6383792232', role:'Full Stack Intern', current_project:'NexaCRM', duration:'3 Months', start_date:'', status:'Active', college_name:'', skills:'' },
  { id:8, name:'Madasamy', email:'ymas10132017@gmail.com', phone:'7708689565', role:'Full Stack Intern', current_project:'CRM Project', duration:'3 Months', start_date:'', status:'Active', college_name:'', skills:'' },
  { id:9, name:'Mohan S', email:'mohansm1002@gmail.com', phone:'6380751915', role:'Full Stack Intern', current_project:'Hospital Website', duration:'3 Months', start_date:'', status:'Active', college_name:'', skills:'' },
  { id:10, name:'DharunKumar V', email:'dharunkumarv486@gmail.com', phone:'8825896874', role:'Full Stack Intern', current_project:'NexaCRM', duration:'3 Months', start_date:'', status:'Active', college_name:'', skills:'' },
];
let interns = loadDemoInterns();
let internNextId = Math.max(0, ...interns.map(i => Number(i.id) || 0)) + 1;
let editingInternId = null;
let allInterns = [];

function loadDemoInterns() {
  try {
    return JSON.parse(localStorage.getItem(INTERNS_DEMO_KEY) || 'null') || [...defaultInterns];
  } catch {
    return [...defaultInterns];
  }
}

function saveDemoInterns() {
  localStorage.setItem(INTERNS_DEMO_KEY, JSON.stringify(interns));
}

async function loadInterns() {
  allInterns = onlyActivePeople(demoMode ? interns : (await api('GET','/interns') || []));
  updateInternMetrics();
  renderInterns(allInterns);
}

function onlyActivePeople(records = []) {
  return (records || []).filter(item => (item.status || 'Active') === 'Active');
}

function updateInternMetrics() {
  const total = (allInterns || []).length;
  const activeProjects = (allInterns || []).filter(i => (i.current_project || '').trim()).length;
  const totalEl = document.getElementById('internTotalCount');
  const activeEl = document.getElementById('internActiveProjectCount');
  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = activeProjects;
}

function internStatusBadge(status) {
  const icon = status === 'Active' ? '🟢' : status === 'Completed' ? '✅' : status === 'Training' ? '🔵' : '🟡';
  const cls = status === 'Active' ? 'active' : status === 'Completed' ? 'completed' : status === 'Training' ? 'training' : 'hold';
  return `<span class="intern-status ${cls}">${icon} ${status || 'Active'}</span>`;
}

function filterInterns() {
  const search = (document.getElementById('internSearch')?.value || '').toLowerCase();
  const role = document.getElementById('internRoleFilter')?.value || '';
  const status = document.getElementById('internStatusFilter')?.value || '';
  const date = document.getElementById('internDateFilter')?.value || '';
  const filtered = onlyActivePeople(allInterns).filter(i => {
    const haystack = [i.name, i.email, i.role, i.current_project].map(v => (v || '').toLowerCase());
    const roleText = i.role || '';
    return (!search || haystack.some(v => v.includes(search))) &&
      (!role || roleText.includes(role)) &&
      (!status || i.status === status) &&
      (!date || (i.start_date || i.created_at || '').slice(0,10) === date);
  });
  renderInterns(filtered);
}

function renderInterns(data) {
  const tbody = document.getElementById('internsTbody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">◌</div><div class="empty-state-text">No interns yet</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((i, idx) => `
    <tr class="client-row">
      <td class="row-num">${String(idx + 1).padStart(2,'0')}</td>
      <td><strong style="color:var(--text-primary)">${i.name || ''}</strong></td>
      <td>${i.email || ''}</td>
      <td>${i.phone || ''}</td>
      <td>${i.role || ''}</td>
      <td>${i.current_project || ''}</td>
      <td>${i.duration || ''}</td>
      <td>${internStatusBadge(i.status)}</td>
      <td class="action-icons">
        <button class="plain-action-btn" title="View" onclick="viewIntern('${i.id}')">👁</button>
        <button class="plain-action-btn" title="Edit" onclick="openInternModal('${i.id}')">✏️</button>
        <button class="plain-action-btn danger" title="Delete" onclick="deleteIntern('${i.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function toggleInternMenu(event, id) {
  event.stopPropagation();
  document.querySelectorAll('.intern-menu').forEach(m => {
    if (m.id !== `internMenu-${id}`) m.classList.add('hidden');
  });
  document.getElementById(`internMenu-${id}`)?.classList.toggle('hidden');
}

function getInternById(id) {
  return interns.find(i => String(i.id) === String(id));
}

async function openInternModal(id = null) {
  editingInternId = id;
  const intern = id ? (demoMode ? getInternById(id) : await api('GET', `/interns/${id}`)) : {};
  if (intern?.source === 'erp') {
    editingInternId = null;
    showToast('ERP intern records are read-only here', 'info');
    return;
  }
  document.getElementById('internModalTitle').textContent = id ? 'Edit Candidate' : 'Add Candidate Manually';
  document.getElementById('internId').value = intern?.id || '';
  document.getElementById('internName').value = intern?.name || '';
  document.getElementById('internEmail').value = intern?.email || '';
  document.getElementById('internPhone').value = intern?.phone || '';
  document.getElementById('internRole').value = intern?.role || '';
  document.getElementById('internCurrentProject').value = intern?.current_project || '';
  document.getElementById('internDuration').value = intern?.duration || '3 Months';
  document.getElementById('internStatus').value = intern?.status || 'Active';
  const resume = document.getElementById('internResume');
  if (resume) resume.value = '';
  const modal = document.getElementById('internModal');
  modal?.classList.remove('hidden', 'modal-closing');
  resetCandidateValidation();
  setTimeout(() => document.getElementById('internName')?.focus(), 120);
}

function closeInternModal() {
  const modal = document.getElementById('internModal');
  if (modal && !modal.classList.contains('hidden')) {
    modal.classList.add('modal-closing');
    setTimeout(() => modal.classList.add('hidden'), 180);
  }
  editingInternId = null;
  resetCandidateValidation();
}

const candidateValidators = {
  internName: value => {
    const clean = value.trim();
    if (!clean) return 'Full name is required.';
    if (clean.length < 3) return 'Enter at least 3 characters.';
    if (!/^[A-Za-z ]+$/.test(clean)) return 'Use alphabets and spaces only.';
    return '';
  },
  internEmail: value => {
    const clean = value.trim();
    if (!clean) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) return 'Enter a valid email address.';
    return '';
  },
  internPhone: value => {
    const clean = value.trim();
    if (!clean) return 'Phone number is required.';
    if (!/^\d{10}$/.test(clean)) return 'Enter exactly 10 digits.';
    return '';
  },
  internRole: value => value ? '' : 'Select a position role.',
  internResume: (_value, input) => {
    const file = input?.files?.[0];
    const allowed = ['pdf', 'doc', 'docx'];
    const maxSize = 5 * 1024 * 1024;
    if (!file) return '';
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) return 'Only PDF, DOC, or DOCX files are allowed.';
    if (file.size > maxSize) return 'Resume must be 5MB or smaller.';
    return '';
  }
};

function candidateFieldIds() {
  return Object.keys(candidateValidators);
}

function setCandidateFieldState(id, message, touched = true) {
  const input = document.getElementById(id);
  const error = document.getElementById(`${id}Error`);
  const group = input?.closest('.candidate-field');
  if (!input || !error || !group) return false;
  const valid = !message;
  input.setAttribute('aria-invalid', String(!valid));
  error.textContent = touched ? message : '';
  group.classList.toggle('is-valid', touched && valid);
  group.classList.toggle('is-invalid', touched && !valid);
  return valid;
}

function updateResumeFileStatus() {
  const input = document.getElementById('internResume');
  const nameEl = document.getElementById('internResumeName');
  const strength = document.getElementById('internResumeStrength');
  const message = candidateValidators.internResume('', input);
  const file = input?.files?.[0];
  if (nameEl) nameEl.textContent = file ? `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)` : 'No resume selected';
  if (strength) {
    strength.classList.toggle('strong', Boolean(file && !message));
    strength.classList.toggle('weak', Boolean(file && message));
  }
}

function validateCandidateField(id, touched = true) {
  const input = document.getElementById(id);
  if (!input) return false;
  if (id === 'internName') input.value = input.value.replace(/[^A-Za-z ]/g, '');
  if (id === 'internPhone') input.value = input.value.replace(/\D/g, '').slice(0, 10);
  if (id === 'internResume') updateResumeFileStatus();
  return setCandidateFieldState(id, candidateValidators[id](input.value, input), touched);
}

function isCandidateFormValid() {
  return candidateFieldIds().every(id => {
    const input = document.getElementById(id);
    return input && !candidateValidators[id](input.value, input);
  });
}

function syncCandidateSubmitState() {
  const valid = isCandidateFormValid();
  const submit = document.getElementById('internSubmitBtn');
  const form = document.getElementById('internCandidateForm');
  if (submit) submit.disabled = !valid;
  form?.classList.toggle('candidate-valid', valid);
  return valid;
}

function validateCandidateForm({ focusFirst = false, touched = true } = {}) {
  let firstInvalid = null;
  let valid = true;
  candidateFieldIds().forEach(id => {
    const fieldValid = validateCandidateField(id, touched);
    if (!fieldValid && !firstInvalid) firstInvalid = document.getElementById(id);
    if (!fieldValid) valid = false;
  });
  syncCandidateSubmitState();
  if (!valid && focusFirst && firstInvalid) {
    const submit = document.getElementById('internSubmitBtn');
    firstInvalid.focus();
    submit?.classList.remove('shake');
    void submit?.offsetWidth;
    submit?.classList.add('shake');
  }
  return valid;
}

function resetCandidateValidation() {
  candidateFieldIds().forEach(id => {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}Error`);
    const group = input?.closest('.candidate-field');
    if (!input || !error || !group) return;
    input.setAttribute('aria-invalid', 'false');
    error.textContent = '';
    group.classList.remove('is-valid', 'is-invalid');
  });
  const submit = document.getElementById('internSubmitBtn');
  const form = document.getElementById('internCandidateForm');
  const nameEl = document.getElementById('internResumeName');
  const strength = document.getElementById('internResumeStrength');
  if (submit) submit.disabled = true;
  form?.classList.remove('candidate-valid');
  if (nameEl) nameEl.textContent = 'No resume selected';
  strength?.classList.remove('strong', 'weak');
}

function initCandidateValidation() {
  candidateFieldIds().forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    const eventName = input.type === 'file' || input.tagName === 'SELECT' ? 'change' : 'input';
    input.addEventListener(eventName, () => {
      validateCandidateField(id);
      syncCandidateSubmitState();
    });
    input.addEventListener('blur', () => validateCandidateField(id));
  });
  document.getElementById('internCandidateForm')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (validateCandidateForm({ focusFirst: true })) saveIntern();
    }
  });
}

function internPayload() {
  return {
    name: document.getElementById('internName').value.trim(),
    email: document.getElementById('internEmail').value.trim(),
    phone: document.getElementById('internPhone').value.trim(),
    role: document.getElementById('internRole').value,
    current_project: document.getElementById('internCurrentProject').value.trim(),
    duration: document.getElementById('internDuration').value,
    start_date: new Date().toISOString().slice(0,10),
    status: document.getElementById('internStatus').value,
    college_name: '',
    skills: '',
  };
}

async function saveIntern() {
  if (!validateCandidateForm({ focusFirst: true })) {
    showToast('Please fix the highlighted fields', 'error');
    return;
  }
  const payload = internPayload();
  if (!payload.name) { showToast('Intern name is required','error'); return; }
  const wasEdit = Boolean(editingInternId);
  if (demoMode) {
    if (editingInternId) {
      const idx = interns.findIndex(i => String(i.id) === String(editingInternId));
      if (idx > -1) interns[idx] = { ...interns[idx], ...payload };
    } else {
      interns.push({ id: internNextId++, ...payload });
    }
    saveDemoInterns();
  } else {
    editingInternId ? await api('PUT', `/interns/${editingInternId}`, payload) : await api('POST', '/interns', payload);
  }
  closeInternModal();
  showToast(wasEdit ? 'Intern updated' : 'Intern added', 'success');
  loadInterns();
}

async function viewIntern(id) {
  const intern = demoMode ? getInternById(id) : await api('GET', `/interns/${id}`);
  if (!intern) return;
  showToast(`${intern.name} • ${intern.role || 'Intern'} • ${intern.current_project || 'No project'}`, 'info');
}

async function deleteIntern(id) {
  if (!confirm('Delete this intern?')) return;
  const intern = (allInterns || []).find(i => String(i.id) === String(id));
  if (intern?.source === 'erp') {
    showToast('ERP intern records are read-only here', 'info');
    return;
  }
  if (demoMode) {
    interns = interns.filter(i => String(i.id) !== String(id));
    saveDemoInterns();
  }
  else await api('DELETE', `/interns/${id}`);
  showToast('Intern deleted', 'success');
  loadInterns();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.intern-actions')) {
    document.querySelectorAll('.intern-menu').forEach(m => m.classList.add('hidden'));
  }
});

function loadEnquiryForm() {
  renderPublicEnquiries();
}

function renderPublicEnquiries() {
  const list = document.getElementById('publicEnqList');
  if (!list) return;
  if (!enquiries.length) { list.innerHTML='<div class="pempty">No enquiries received yet</div>'; return; }
  list.innerHTML = enquiries.slice().reverse().map(e=>`
    <div class="pub-enq-card">
      <div class="pub-enq-header">
        <strong>${e.name}</strong>
        <span class="badge badge-${e.status==='New'?'due':e.status==='Contacted'?'partial':e.status==='Converted'?'completed':'progress'}">${e.status}</span>
      </div>
      <div class="pub-enq-detail">📞 ${e.phone||'—'} &nbsp;|&nbsp; ✉ ${e.email||'—'}</div>
      <div class="pub-enq-detail">🔧 ${e.service||'—'}</div>
      ${e.message?`<div class="pub-enq-msg">"${e.message}"</div>`:''}
      <div class="pub-enq-date">📅 ${formatDate(e.created_at)}</div>
    </div>`).join('');
}

function submitPublicEnquiry() {
  showToast('Enquiry submitted! We will contact you soon.','success');
}

function copyEnquiryLink() {
  navigator.clipboard.writeText(window.location.href + '#enquiry-form').catch(()=>{});
  showToast('Link copied! Share with potential clients.','success');
}


/* ════════════════════════════════
   WEBSITES PAGE — 10/10
   ════════════════════════════════ */
const COMPANY_WEBSITES = [
  { id:1,  name:'Pharmacy Website',           url:'https://pharmacy.inforiya.in/',        icon:'💊', color:'#00c9a7', g1:'#00c9a7', g2:'#0891b2' },
  { id:2,  name:'Marble Website',             url:'https://marble.inforiya.in/',          icon:'🪨', color:'#a78bfa', g1:'#a78bfa', g2:'#7c3aed' },
  { id:3,  name:'Jewellery Website',          url:'https://jewellery.inforiya.in/',       icon:'💎', color:'#f59e0b', g1:'#f59e0b', g2:'#f97316' },
  { id:4,  name:'Supermarket Website',        url:'https://supermarket.inforiya.in/',     icon:'🛒', color:'#3b82f6', g1:'#3b82f6', g2:'#6366f1' },
  { id:5,  name:'Tuition Website',            url:'https://tuition.inforiya.in/',         icon:'🎓', color:'#06b6d4', g1:'#06b6d4', g2:'#0ea5e9' },
  { id:6,  name:'Civil Services Website',     url:'https://civil.inforiya.in/',           icon:'🏗️', color:'#94a3b8', g1:'#94a3b8', g2:'#64748b' },
  { id:7,  name:'Taxi Booking Website',       url:'https://taxi.inforiya.in/',            icon:'🚕', color:'#eab308', g1:'#eab308', g2:'#f97316' },
  { id:8,  name:'Photoshop Services Website', url:'https://photoshop.inforiya.in/',       icon:'🎨', color:'#ec4899', g1:'#ec4899', g2:'#a21caf' },
  { id:9,  name:'Events Website',             url:'https://events.inforiya.in/',          icon:'🎉', color:'#f97316', g1:'#f97316', g2:'#ef4444' },
  { id:10, name:'Finance Website',            url:'https://finance.inforiya.in/',         icon:'💰', color:'#10b981', g1:'#10b981', g2:'#059669' },
  { id:11, name:'Home Appliances Website',    url:'https://homeappliances.inforiya.in/',  icon:'🏠', color:'#8b5cf6', g1:'#8b5cf6', g2:'#6d28d9' },
  { id:12, name:'Matrimonial Website',        url:'https://matrimonial.inforiya.in/',     icon:'💍', color:'#f43f5e', g1:'#f43f5e', g2:'#e11d48' },
  { id:13, name:'Hotels Website',             url:'https://hotels.inforiya.in/',          icon:'🏨', color:'#0ea5e9', g1:'#0ea5e9', g2:'#2563eb' },
  { id:14, name:'Hospitals Website',          url:'https://hospital.inforiya.in/',        icon:'🏥', color:'#22c55e', g1:'#22c55e', g2:'#16a34a' },
  { id:15, name:'Tailor Website',             url:'https://tailor.inforiya.in/',          icon:'🧵', color:'#d946ef', g1:'#d946ef', g2:'#9333ea' },
  { id:16, name:'Painter Website',            url:'https://painter.inforiya.in/',         icon:'🖌️', color:'#fb923c', g1:'#fb923c', g2:'#f59e0b' },
  { id:17, name:'Restaurant Website',         url:'https://restaurant.inforiya.in/',      icon:'🍽️', color:'#ef4444', g1:'#ef4444', g2:'#dc2626' },
  { id:18, name:'Textile Website',            url:'https://textile.inforiya.in/',         icon:'🧶', color:'#14b8a6', g1:'#14b8a6', g2:'#0d9488' },
];

function getWebsiteCategory(name) {
  const key = (name || '').toLowerCase();
  if (key.includes('pharmacy') || key.includes('hospital')) return 'Healthcare';
  if (key.includes('marble')) return 'Interior';
  if (key.includes('jewellery')) return 'Luxury';
  if (key.includes('supermarket')) return 'Retail';
  if (key.includes('tuition')) return 'Education';
  if (key.includes('civil')) return 'Construction';
  if (key.includes('taxi')) return 'Transport';
  if (key.includes('photoshop')) return 'Creative';
  if (key.includes('events')) return 'Events';
  if (key.includes('finance')) return 'Finance';
  if (key.includes('appliances')) return 'Appliances';
  if (key.includes('matrimonial')) return 'Community';
  if (key.includes('hotels')) return 'Hospitality';
  if (key.includes('tailor') || key.includes('textile')) return 'Fashion';
  if (key.includes('painter')) return 'Services';
  if (key.includes('restaurant')) return 'Food';
  return 'Website';
}

function getWebsiteDescription(site) {
  const category = getWebsiteCategory(site.name);
  const descriptions = {
    Healthcare: 'Patient-friendly digital experience with clear service flow, trust cues, and fast mobile access.',
    Interior: 'Elegant catalogue presence built for premium browsing, visual detail, and high-trust enquiries.',
    Luxury: 'Polished showcase with refined spacing, strong visual hierarchy, and conversion-ready product storytelling.',
    Retail: 'Fast shopping-style interface shaped for clean category discovery and responsive customer journeys.',
    Education: 'Learning-focused web experience for admissions, courses, and parent-friendly discovery.',
    Construction: 'Professional service presence with structured sections, project confidence, and clear contact paths.',
    Transport: 'Booking-ready interface with crisp calls to action, location-first flow, and mobile polish.',
    Creative: 'Vibrant portfolio experience designed to make editing, retouching, and design offers shine.',
    Events: 'Energetic event showcase for packages, galleries, and memorable enquiry-led storytelling.',
    Finance: 'Trust-led layout with calm hierarchy, service clarity, and polished lead capture.',
    Appliances: 'Product-rich catalogue experience with clean browsing and strong category presentation.',
    Community: 'Warm, graceful digital presence with trust cues, profile-oriented content, and smooth navigation.',
    Hospitality: 'Premium hospitality showcase crafted for rooms, amenities, booking intent, and visual rhythm.',
    Fashion: 'Boutique catalogue concept with soft product storytelling, vibrant gradients, and polished browsing.',
    Services: 'Service portfolio with visual confidence, smooth sections, and direct action clarity.',
    Food: 'Appetizing restaurant experience with responsive menus, strong imagery rhythm, and reservation-ready CTAs.',
  };
  return descriptions[category] || 'Responsive design, fast performance, and conversion-optimised presentation.';
}

function loadWebsitesPage() {
  const page = document.getElementById('page-websites');
  const grid = document.getElementById('websitesGrid');
  if (!page || !grid) return;
  const countBadge = document.getElementById('websitesCountBadge');
  if (countBadge) countBadge.textContent = `${COMPANY_WEBSITES.length} Live Sites`;

  // ── Remove any previously injected header to prevent duplicates ──
  const oldHeader = document.getElementById('wsHeader');
  if (oldHeader) oldHeader.remove();

  // ── Animated mesh blobs (inject once into page-websites only, not body) ──
  let mesh = document.getElementById('wsMesh');
  if (!mesh) {
    mesh = document.createElement('div');
    mesh.id = 'wsMesh';
    mesh.className = 'ws-mesh';
    mesh.innerHTML =
      '<div class="ws-blob b1"></div>' +
      '<div class="ws-blob b2"></div>' +
      '<div class="ws-blob b3"></div>' +
      '<div class="ws-particle p1"></div>' +
      '<div class="ws-particle p2"></div>' +
      '<div class="ws-particle p3"></div>' +
      '<div class="ws-particle p4"></div>';
    page.insertBefore(mesh, page.firstChild);
  }

  // ── Page-level spotlight cursor ──
  let spot = document.getElementById('wsSpotlight');
  if (!spot) {
    spot = document.createElement('div');
    spot.id = 'wsSpotlight';
    spot.className = 'ws-spotlight';
    page.appendChild(spot);
    page.addEventListener('mousemove', e => {
      const r = page.getBoundingClientRect();
      spot.style.left = (e.clientX - r.left) + 'px';
      spot.style.top  = (e.clientY - r.top + page.scrollTop) + 'px';
    });
  }

  // ── Render cards ──
  grid.innerHTML = COMPANY_WEBSITES.map((site, i) => {
    const shortUrl = site.url.replace('https://','').replace(/\/$/, '');
    return `
    <div class="ws-card" data-url="${site.url}"
      style="--ws-c:${site.color};--ws-g1:${site.g1};--ws-g2:${site.g2};animation-delay:${i * 0.06}s">
      <div class="ws-card-inner">
        <div class="ws-card-orbit"></div>
        <div class="ws-card-shine"></div>
        <div class="ws-cursor-spot"></div>
        <div class="ws-card-bg"></div>
        <div class="ws-float-dot d1"></div>
        <div class="ws-float-dot d2"></div>
        <div class="ws-float-dot d3"></div>
        <div class="ws-top-row">
          <div class="ws-icon-3d">
            <div class="ws-icon-shadow"></div>
            <div class="ws-icon-box">${site.icon}</div>
          </div>
          <span class="ws-badge">${site.category || getWebsiteCategory(site.name)}</span>
        </div>
        <div class="ws-num" data-target="${i+1}">00</div>
        <h3 class="ws-name">${site.name}</h3>
        <p class="ws-desc">${site.desc || getWebsiteDescription(site)}</p>
        <div class="ws-divider"></div>
        <div class="ws-footer">
          <span class="ws-url-text">${shortUrl}</span>
          <button type="button" class="ws-visit-btn" data-url="${site.url}">
            <span class="ws-visit-label">🌐 Visit</span>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  // ── 3D magnetic tilt per card ──
  grid.querySelectorAll('.ws-card').forEach(card => {
    const curSpot = card.querySelector('.ws-cursor-spot');
    let rafId = 0;
    let nextTransform = '';

    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const x   = e.clientX - r.left;
      const y   = e.clientY - r.top;
      const cx  = r.width  / 2;
      const cy  = r.height / 2;
      const dx  = (x - cx) / cx;
      const dy  = (y - cy) / cy;
      const rX  = dy * -8;
      const rY  = dx *  8;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      card.style.setProperty('--px', `${(x / r.width) * 100}%`);
      card.style.setProperty('--py', `${(y / r.height) * 100}%`);
      card.style.transition = 'transform 0.16s cubic-bezier(0.16,1,0.3,1), box-shadow 0.36s ease, filter 0.36s ease';
      nextTransform =
        `perspective(1200px) rotateX(${rX}deg) rotateY(${rY}deg) translate3d(${dx * 3}px, ${dy * 3}px, 0) translateY(-11px) scale(1.028)`;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          card.style.transform = nextTransform;
          rafId = 0;
        });
      }
      if (curSpot) {
        curSpot.style.left    = x + 'px';
        curSpot.style.top     = y + 'px';
        curSpot.style.opacity = '1';
      }
    });

    card.addEventListener('mouseleave', () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      card.style.transition = 'transform 0.62s cubic-bezier(0.16,1,0.3,1), box-shadow 0.38s ease, filter 0.38s ease';
      card.style.transform  =
        'perspective(1200px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0) translateY(0) scale(1)';
      if (curSpot) curSpot.style.opacity = '0';
    });

    card.addEventListener('click', () => {
      if (card.dataset.url) window.open(card.dataset.url, '_blank');
    });
  });

  // ── Visit button sparkle burst ──
  grid.querySelectorAll('.ws-visit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      spawnSparkles(btn);
      setTimeout(() => window.open(btn.dataset.url, '_blank'), 200);
    });
  });

  // ── Stagger number counter ──
  grid.querySelectorAll('.ws-num').forEach(el => {
    const target = parseInt(el.dataset.target);
    const delay  = parseFloat(el.closest('.ws-card')?.style.animationDelay || '0') * 1000;
    setTimeout(() => {
      let cur = 0;
      const tick = () => {
        cur++;
        el.textContent = String(cur).padStart(2, '0');
        if (cur < target) setTimeout(tick, 30);
      };
      tick();
    }, delay + 350);
  });
}

function spawnSparkles(btn) {
  const colors = ['#fff','#ffeb3b','#ff4081','#40c4ff','#69f0ae'];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'ws-sparkle';
    const angle = (i/12)*360;
    const dist  = 30 + Math.random()*25;
    const color = colors[Math.floor(Math.random()*colors.length)];
    s.style.cssText = `
      position:absolute;width:5px;height:5px;border-radius:50%;
      background:${color};top:50%;left:50%;
      transform:translate(-50%,-50%);
      pointer-events:none;z-index:999;
      animation:wsSparkFly 0.5s ease-out forwards;
      --sx:${Math.cos(angle*Math.PI/180)*dist}px;
      --sy:${Math.sin(angle*Math.PI/180)*dist}px;
    `;
    btn.style.position = 'relative';
    btn.style.overflow = 'visible';
    btn.appendChild(s);
    setTimeout(() => s.remove(), 520);
  }
}

/* ════════════════════════════════
   BOOT
   ════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fName')?.addEventListener('input', syncClientCredentials);
  initEmployeeValidation();
  initCandidateValidation();
  initSidebarHover();
  initResponsiveEnhancements();
  checkAuth();
  updateTopbarDate();
  initTheme();
  setInterval(updateTopbarDate,60000);
});




/* ════════════════════════════════
   NOTIFICATION SYSTEM
   ════════════════════════════════ */
let notifOpen    = false;
let notifData    = [];
let notifCleared = JSON.parse(sessionStorage.getItem('notif_cleared')||'[]');

const NOTIF_ICONS = {
  payment:  {icon:'💰',cls:'payment'},
  message:  {icon:'💬',cls:'message'},
  project:  {icon:'📁',cls:'project'},
  client:   {icon:'👤',cls:'client'},
  document: {icon:'📄',cls:'document'},
  enquiry:  {icon:'📋',cls:'enquiry'},
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m=Math.floor(diff/60000), h=Math.floor(m/60), d=Math.floor(h/24);
  if (m<1) return 'Just now';
  if (m<60) return `${m}m ago`;
  if (h<24) return `${h}h ago`;
  return `${d}d ago`;
}

async function loadNotifications() {
  const isClient = isClientRole();
  let items = [];
  try {
    if (demoMode) {
      demoActivity.slice().reverse().forEach(a=>{
        items.push({id:`act_${a.id}`,type:a.action_type||'client',text:`${a.action}: ${a.detail}`,time:a.created_at});
      });
    } else {
      const activity = await api('GET','/activity')||[];
      activity.slice(0,15).forEach(a=>{
        items.push({id:`act_${a.id}`,type:a.action_type||'client',text:`${a.action}: ${a.detail}`,time:a.created_at});
      });
      const msgs = await api('GET','/messages')||[];
      const myMsgs = isClient ? msgs.filter(m=>m.sender!=='client') : msgs.filter(m=>m.sender==='client');
      myMsgs.slice(0,8).forEach(m=>{
        const label = isClient?'Admin':(m.client_name||'Client');
        items.unshift({id:`msg_${m.id}`,type:'message',text:`New message from ${label}: "${(m.content||'').slice(0,50)}${(m.content||'').length>50?'…':''}"`,time:m.created_at});
      });
      if (!isClient) {
        const clients = await api('GET','/clients')||[];
        clients.filter(c=>c.payment_status==='Due'&&c.quotation_amount>0).forEach(c=>{
          items.push({id:`due_${c.id}`,type:'payment',text:`⚠️ Payment Due: ${c.name} — ₹${((c.quotation_amount||0)-(c.paid_amount||0)).toLocaleString('en-IN')} pending`,time:c.created_at});
        });
      }
    }
  } catch(e) {}
  items.sort((a,b)=>new Date(b.time)-new Date(a.time));
  notifData = items.filter(n=>!notifCleared.includes(n.id)).slice(0,20);
  renderNotifBadge();
}

function renderNotifBadge() {
  const dot   = document.getElementById('notifDot');
  const count = document.getElementById('notifCount');
  if (!dot||!count) return;
  const total = notifData.length;
  if (total>0) {
    dot.classList.remove('hidden');
    count.classList.remove('hidden');
    count.textContent = total>9?'9+':total;
  } else {
    dot.classList.add('hidden');
    count.classList.add('hidden');
  }
}

function renderNotifList() {
  const list = document.getElementById('notifList');
  if (!list) return;
  renderNotifBadge();
  if (!notifData.length) { list.innerHTML=`<div class="notif-empty">🎉 You're all caught up!</div>`; return; }
  list.innerHTML = notifData.map(n=>{
    const {icon,cls} = NOTIF_ICONS[n.type]||NOTIF_ICONS.client;
    return `<div class="notif-item unread" onclick="handleNotifClick('${n.id}','${n.type}')">
      <div class="notif-icon ${cls}">${icon}</div>
      <div class="notif-body"><div class="notif-text">${n.text}</div><div class="notif-time">${timeAgo(n.time)}</div></div>
    </div>`;
  }).join('');
}

function toggleNotifDropdown() {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  notifOpen = !notifOpen;
  dropdown.classList.toggle('hidden',!notifOpen);
  if (notifOpen) { renderNotifList(); loadNotifications().then(renderNotifList); }
}

function handleNotifClick(id,type) {
  notifCleared.push(id);
  sessionStorage.setItem('notif_cleared',JSON.stringify(notifCleared));
  notifData = notifData.filter(n=>n.id!==id);
  renderNotifList();
  const pageMap={payment:'payments',message:'messages',project:'timeline',client:'clients',document:'documents',enquiry:'enquiries'};
  if (pageMap[type]) { toggleNotifDropdown(); navigate(pageMap[type]); }
}

function clearAllNotifs() {
  notifCleared=[...notifCleared,...notifData.map(n=>n.id)];
  sessionStorage.setItem('notif_cleared',JSON.stringify(notifCleared));
  notifData=[];
  renderNotifList();
}

document.addEventListener('click', e=>{
  if (notifOpen&&!e.target.closest('#notifBell')&&!e.target.closest('#notifDropdown')) {
    notifOpen=false;
    document.getElementById('notifDropdown')?.classList.add('hidden');
  }
});

setInterval(()=>{ if(!notifOpen) loadNotifications(); },60000);

function toggleClientPwd(id,pwd) {
  const span=document.getElementById('pwd-'+id);
  const eye=document.getElementById('pwd-eye-'+id);
  if (!span) return;
  const hidden = span.textContent==='••••••••';
  span.textContent = hidden?pwd:'••••••••';
  span.style.letterSpacing = hidden?'normal':'2px';
  if (eye) eye.textContent = hidden?'🙈':'👁';
}
