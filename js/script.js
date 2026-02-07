
/**
 * 🏰 CHN FANTASY TICKET SYSTEM
 * Frontend Logic
 */

// ============ GLOBAL STATE ============
const AppState = {
  user: null,
  isAdmin: false,
  soundEnabled: true,
  currentPage: 'dashboard'
};

// ============ DOM ELEMENTS ============
const DOM = {
  loadingScreen: document.getElementById('loading-screen'),
  app: document.getElementById('app'),
  loginSection: document.getElementById('login-section'),
  dashboardSection: document.getElementById('dashboard-section'),
  loginForm: document.getElementById('login-form'),
  usernameInput: document.getElementById('username'),
  passwordInput: document.getElementById('password'),
  passwordGroup: document.getElementById('password-group'),
  toastContainer: document.getElementById('toast-container')
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  // Simulate loading
  await delay(2000);
  DOM.loadingScreen.classList.add('hidden');
  DOM.app.classList.remove('hidden');
  
  initEventListeners();
  playSound('ambient');
}

function initEventListeners() {
  // Login tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const isAdmin = e.target.dataset.tab === 'admin';
      DOM.passwordGroup.classList.toggle('hidden', !isAdmin);
      if (!isAdmin) DOM.passwordInput.value = '';
    });
  });

  // Login form
  DOM.loginForm.addEventListener('submit', handleLogin);

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = e.currentTarget.dataset.page;
      navigateTo(page);
    });
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Sound toggle
  document.getElementById('sound-toggle').addEventListener('click', toggleSound);

  // Create ticket form
  document.getElementById('create-ticket-form').addEventListener('submit', handleCreateTicket);

  // Filters
  document.getElementById('apply-filters').addEventListener('click', loadTicketsBoard);
  document.getElementById('refresh-board').addEventListener('click', loadTicketsBoard);

  // Modal close
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', closeAllModals);
  });

  // Star rating
  document.querySelectorAll('.star-rating .star').forEach(star => {
    star.addEventListener('click', (e) => {
      const rating = e.target.dataset.rating;
      document.getElementById('feedback-rating').value = rating;
      document.querySelectorAll('.star-rating .star').forEach((s, i) => {
        s.classList.toggle('active', i < rating);
      });
    });
  });

  // Feedback form
  document.getElementById('feedback-form').addEventListener('submit', handleFeedback);

  // Admin buttons
  document.getElementById('export-btn')?.addEventListener('click', handleExport);
}

// ============ AUTHENTICATION ============
async function handleLogin(e) {
  e.preventDefault();
  
  const username = DOM.usernameInput.value.trim();
  const password = DOM.passwordInput.value;
  const isAdmin = document.querySelector('.tab-btn.active').dataset.tab === 'admin';
  
  const btn = e.target.querySelector('button[type="submit"]');
  setButtonLoading(btn, true);
  
  try {
    const result = await callServer('authenticateUser', username, password, isAdmin);
    
    if (result.success) {
      AppState.user = result.username;
      AppState.isAdmin = result.role === 'Admin';
      
      showDashboard();
      playSound('success');
      showToast('Welcome, ' + result.username + '! ⚔️', 'success');
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Login failed: ' + error.message, 'error');
  }
  
  setButtonLoading(btn, false);
}

function showDashboard() {
  DOM.loginSection.classList.add('hidden');
  DOM.dashboardSection.classList.remove('hidden');
  
  // Update user info
  document.querySelector('.user-name').textContent = AppState.user;
  document.querySelector('.user-role-badge').textContent = AppState.isAdmin ? '👑 Admin' : '🛡️ Staff';
  
  // Show/hide admin elements
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('hidden', !AppState.isAdmin);
  });
  
  // Load initial data
  loadDashboard();
  loadEngineers();
}

function handleLogout() {
  AppState.user = null;
  AppState.isAdmin = false;
  
  DOM.dashboardSection.classList.add('hidden');
  DOM.loginSection.classList.remove('hidden');
  DOM.loginForm.reset();
  
  showToast('Farewell, brave warrior! 🏰', 'success');
}

// ============ NAVIGATION ============
function navigateTo(page) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  
  // Show/hide pages
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page)?.classList.remove('hidden');
  
  AppState.currentPage = page;
  
  // Load page data
  switch(page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'board':
      loadTicketsBoard();
      break;
    case 'admin':
      loadAdminData();
      break;
  }
}

// ============ DASHBOARD ============
async function loadDashboard() {
  try {
    const stats = await callServer('getDashboardStats');
    
    document.getElementById('stat-open').textContent = stats.open;
    document.getElementById('stat-progress').textContent = stats.inProgress;
    document.getElementById('stat-critical').textContent = stats.critical;
    document.getElementById('stat-high').textContent = stats.high;
    document.getElementById('stat-resolved').textContent = stats.resolved;
    document.getElementById('stat-today').textContent = stats.resolvedToday;
    
    // Critical alert
    const criticalCard = document.getElementById('critical-card');
    criticalCard.classList.toggle('pulse', stats.critical > 0);
    
    // Load recent tickets
    const tickets = await callServer('getAllTickets', {});
    renderRecentTickets(tickets.slice(0, 5));
    
  } catch (error) {
    showToast('Failed to load dashboard: ' + error.message, 'error');
  }
}

function renderRecentTickets(tickets) {
  const container = document.getElementById('recent-tickets');
  
  if (tickets.length === 0) {
    container.innerHTML = '<div class="empty-state">🏰 No quests yet. The realm is peaceful!</div>';
    return;
  }
  
  container.innerHTML = tickets.map(ticket => `
    <div class="ticket-item" onclick="openTicketModal('${ticket.ticketId}')">
      <div class="ticket-info">
        <div class="ticket-id">${ticket.ticketId}</div>
        <div class="ticket-title">${escapeHtml(ticket.title)}</div>
        <div class="ticket-meta">
          <span>🏰 ${ticket.department}</span>
          <span>👤 ${ticket.createdBy}</span>
          <span>📅 ${formatDate(ticket.createdTime)}</span>
        </div>
      </div>
      <div class="ticket-badges">
        <span class="badge badge-status ${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
        <span class="badge badge-priority ${ticket.priority.toLowerCase()}">${ticket.priority}</span>
      </div>
    </div>
  `).join('');
}

// ============ CREATE TICKET ============
async function handleCreateTicket(e) {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  setButtonLoading(btn, true);
  
  const ticketData = {
    createdBy: AppState.user,
    department: document.getElementById('ticket-department').value,
    issueType: document.getElementById('ticket-issue-type').value,
    title: document.getElementById('ticket-title').value,
    description: document.getElementById('ticket-description').value,
    priority: document.querySelector('input[name="priority"]:checked').value
  };
  
  try {
    const result = await callServer('createTicket', ticketData);
    
    if (result.success) {
      playSound('success');
      showToast(result.message + ' (' + result.ticketId + ')', 'success');
      e.target.reset();
      navigateTo('dashboard');
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Failed to create ticket: ' + error.message, 'error');
  }
  
  setButtonLoading(btn, false);
}

// ============ TICKET BOARD ============
async function loadTicketsBoard() {
  const filters = {
    status: document.getElementById('filter-status').value,
    priority: document.getElementById('filter-priority').value,
    department: document.getElementById('filter-department').value,
    engineer: document.getElementById('filter-engineer').value
  };
  
  try {
    const tickets = await callServer('getAllTickets', filters);
    renderTicketsTable(tickets);
  } catch (error) {
    showToast('Failed to load tickets: ' + error.message, 'error');
  }
}

function renderTicketsTable(tickets) {
  const tbody = document.getElementById('tickets-table-body');
  
  if (tickets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">🏰 No quests found</td></tr>';
    return;
  }
  
  tbody.innerHTML = tickets.map(ticket => `
    <tr>
      <td class="ticket-id-cell">${ticket.ticketId}</td>
      <td>${escapeHtml(ticket.title)}</td>
      <td>${ticket.department}</td>
      <td>
        <span class="badge badge-priority ${ticket.priority.toLowerCase()}">${ticket.priority}</span>
      </td>
      <td>
        <span class="badge badge-status ${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
      </td>
      <td>${ticket.assignedTo || '-'}</td>
      <td>${formatDate(ticket.createdTime)}</td>
      <td class="table-actions">
        <button class="btn btn-secondary" onclick="openTicketModal('${ticket.ticketId}')">👁️</button>
        ${ticket.status === 'Resolved' && !ticket.feedbackRating ? 
          `<button class="btn btn-primary" onclick="openFeedbackModal('${ticket.ticketId}')">⭐</button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function loadEngineers() {
  try {
    const engineers = await callServer('getEngineers');
    const select = document.getElementById('filter-engineer');
    
    engineers.forEach(eng => {
      const option = document.createElement('option');
      option.value = eng.username;
      option.textContent = eng.username;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load engineers:', error);
  }
}

// ============ TICKET MODAL ============
async function openTicketModal(ticketId) {
  try {
    const ticket = await callServer('getTicketById', ticketId);
    if (!ticket) {
      showToast('Ticket not found', 'error');
      return;
    }
    
    document.getElementById('modal-ticket-id').textContent = ticket.ticketId;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
      <div class="detail-row">
        <label>📜 Title:</label>
        <span>${escapeHtml(ticket.title)}</span>
      </div>
      <div class="detail-row">
        <label>📖 Description:</label>
        <span>${escapeHtml(ticket.description)}</span>
      </div>
      <div class="detail-row">
        <label>🏰 Department:</label>
        <span>${ticket.department}</span>
      </div>
      <div class="detail-row">
        <label>🔧 Issue Type:</label>
        <span>${ticket.issueType}</span>
      </div>
      <div class="detail-row">
        <label>⚔️ Priority:</label>
        <span class="badge badge-priority ${ticket.priority.toLowerCase()}">${ticket.priority}</span>
      </div>
      <div class="detail-row">
        <label>📊 Status:</label>
        <span class="badge badge-status ${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
      </div>
      <div class="detail-row">
        <label>👤 Created By:</label>
        <span>${ticket.createdBy}</span>
      </div>
      <div class="detail-row">
        <label>📅 Created:</label>
        <span>${formatDateTime(ticket.createdTime)}</span>
      </div>
      <div class="detail-row">
        <label>🛡️ Assigned To:</label>
        <span>${ticket.assignedTo || 'Unassigned'}</span>
      </div>
      ${ticket.resolutionNotes ? `
        <div class="detail-row">
          <label>✅ Resolution:</label>
          <span>${escapeHtml(ticket.resolutionNotes)}</span>
        </div>
      ` : ''}
      ${ticket.feedbackRating ? `
        <div class="detail-row">
          <label>⭐ Rating:</label>
          <span>${'★'.repeat(ticket.feedbackRating)}${'☆'.repeat(5 - ticket.feedbackRating)}</span>
        </div>
      ` : ''}
      
      ${AppState.isAdmin ? `
        <hr style="margin: 20px 0; border-color: var(--glass-border);">
        <h4 style="margin-bottom: 15px;">👑 Admin Controls</h4>
        
        <div class="form-group">
          <label>Assign To:</label>
          <select id="modal-assign-to" style="width: 100%;">
            <option value="">Select Engineer</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Status:</label>
          <select id="modal-status" style="width: 100%;">
            <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
            <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Admin Remarks:</label>
          <textarea id="modal-admin-remarks" rows="2" style="width: 100%;">${ticket.adminRemarks || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label>Admin Points:</label>
          <input type="number" id="modal-admin-points" value="${ticket.adminPoints || ''}" style="width: 100%;">
        </div>
        
        <div class="form-group">
          <label>Resolution Notes:</label>
          <textarea id="modal-resolution-notes" rows="2" style="width: 100%;">${ticket.resolutionNotes || ''}</textarea>
        </div>
        
        <button class="btn btn-primary" onclick="saveTicketChanges('${ticket.ticketId}')">
          💾 Save Changes
        </button>
      ` : ''}
    `;
    
    // Load engineers for admin
    if (AppState.isAdmin) {
      const engineers = await callServer('getEngineers');
      const select = document.getElementById('modal-assign-to');
      engineers.forEach(eng => {
        const option = document.createElement('option');
        option.value = eng.username;
        option.textContent = eng.username;
        if (eng.username === ticket.assignedTo) option.selected = true;
        select.appendChild(option);
      });
    }
    
    document.getElementById('ticket-modal').classList.remove('hidden');
    
  } catch (error) {
    showToast('Failed to load ticket: ' + error.message, 'error');
  }
}

async function saveTicketChanges(ticketId) {
  const updates = {
    assignedTo: document.getElementById('modal-assign-to').value,
    status: document.getElementById('modal-status').value,
    adminRemarks: document.getElementById('modal-admin-remarks').value,
    adminPoints: document.getElementById('modal-admin-points').value,
    resolutionNotes: document.getElementById('modal-resolution-notes').value
  };
  
  try {
    const result = await callServer('updateTicket', ticketId, updates, true);
    
    if (result.success) {
      showToast(result.message, 'success');
      closeAllModals();
      loadTicketsBoard();
      loadDashboard();
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Failed to update: ' + error.message, 'error');
  }
}

// ============ FEEDBACK ============
function openFeedbackModal(ticketId) {
  document.getElementById('feedback-ticket-id').value = ticketId;
  document.getElementById('feedback-rating').value = 0;
  document.getElementById('feedback-comment').value = '';
  document.querySelectorAll('.star-rating .star').forEach(s => s.classList.remove('active'));
  document.getElementById('feedback-modal').classList.remove('hidden');
}

async function handleFeedback(e) {
  e.preventDefault();
  
  const ticketId = document.getElementById('feedback-ticket-id').value;
  const rating = parseInt(document.getElementById('feedback-rating').value);
  const comment = document.getElementById('feedback-comment').value;
  
  if (rating === 0) {
    showToast('Please select a rating', 'error');
    return;
  }
  
  try {
    const result = await callServer('submitFeedback', ticketId, rating, comment);
    
    if (result.success) {
      showToast(result.message, 'success');
      closeAllModals();
      loadTicketsBoard();
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Failed to submit feedback: ' + error.message, 'error');
  }
}

// ============ ADMIN ============
async function loadAdminData() {
  try {
    const stats = await callServer('getDashboardStats');
    
    const workloadContainer = document.getElementById('engineer-workload');
    const engineers = Object.entries(stats.byEngineer);
    
    if (engineers.length === 0) {
      workloadContainer.innerHTML = '<p>No active assignments</p>';
      return;
    }
    
    const maxTickets = Math.max(...engineers.map(e => e[1]));
    
    workloadContainer.innerHTML = engineers.map(([name, count]) => `
      <div class="workload-item">
        <div>
          <strong>${name}</strong>
          <span style="color: var(--text-secondary);"> - ${count} tickets</span>
        </div>
        <div class="workload-bar">
          <div class="workload-fill" style="width: ${(count / maxTickets) * 100}%;"></div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    showToast('Failed to load admin data: ' + error.message, 'error');
  }
}

async function handleExport() {
  try {
    const tickets = await callServer('exportToExcel');
    
    // Convert to CSV
    const headers = ['Ticket ID', 'Created', 'Created By', 'Department', 'Issue Type', 'Title', 'Description', 'Priority', 'Status', 'Assigned To', 'Resolution Notes', 'Resolved Time', 'Rating', 'Feedback'];
    
    const rows = tickets.map(t => [
      t.ticketId,
      formatDateTime(t.createdTime),
      t.createdBy,
      t.department,
      t.issueType,
      t.title,
      t.description,
      t.priority,
      t.status,
      t.assignedTo,
      t.resolutionNotes,
      t.resolvedTime ? formatDateTime(t.resolvedTime) : '',
      t.feedbackRating,
      t.feedbackComment
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showToast('Export completed! 📊', 'success');
  } catch (error) {
    showToast('Export failed: ' + error.message, 'error');
  }
}

// ============ MODALS ============
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// ============ UTILITIES ============
function callServer(functionName, ...args) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [functionName](...args);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setButtonLoading(btn, loading) {
  const textEl = btn.querySelector('.btn-text');
  const loadingEl = btn.querySelector('.btn-loading');
  
  if (textEl && loadingEl) {
    textEl.classList.toggle('hidden', loading);
    loadingEl.classList.toggle('hidden', !loading);
  }
  
  btn.disabled = loading;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  DOM.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function playSound(type) {
  if (!AppState.soundEnabled) return;
  
  const sounds = {
    ambient: document.getElementById('sound-ambient'),
    success: document.getElementById('sound-success'),
    alert: document.getElementById('sound-alert')
  };
  
  const sound = sounds[type];
  if (sound) {
    sound.volume = type === 'ambient' ? 0.1 : 0.3;
    sound.play().catch(() => {});
  }
}

function toggleSound() {
  AppState.soundEnabled = !AppState.soundEnabled;
  
  const btn = document.getElementById('sound-toggle');
  btn.textContent = AppState.soundEnabled ? '🔊' : '🔇';
  
  const ambient = document.getElementById('sound-ambient');
  if (AppState.soundEnabled) {
    ambient.play().catch(() => {});
  } else {
    ambient.pause();
  }
}
