/**
 * CHN IT Support System
 * Main Application
 * Version: 4.0.0 - TOTP + Full Screen
 */

var App = {
  currentPage: 'dashboard',
  refreshInterval: null,
  _totpSecret: null,

  // ============ INITIALIZATION ============

  init: async function() {
    console.log('🏰 CHN IT Support v4.0.0');

    try {
      this.updateLoadingStep(1, 'active');
      this.updateLoadingText('Connecting to server...');
      await this.delay(800);
      this.updateLoadingStep(1, 'done');

      this.updateLoadingStep(2, 'active');
      this.updateLoadingText('Checking session...');
      var hasSession = Auth.init();
      await this.delay(600);
      this.updateLoadingStep(2, 'done');

      this.updateLoadingStep(3, 'active');
      this.updateLoadingText('Preparing dashboard...');
      this.setupEventListeners();
      await this.delay(400);
      this.updateLoadingStep(3, 'done');

      this.updateLoadingText('Welcome!');
      await this.delay(300);

      this.hideLoading();
      await this.delay(100);

      if (hasSession && Auth.isLoggedIn) {
        console.log('✅ Logged in:', Auth.getUserEmail());
        this.showDashboard();
      } else {
        console.log('👤 No session');
        this.showLogin();
      }
    } catch (error) {
      console.error('❌ Init error:', error);
      this.hideLoading();
      this.showLogin();
    }
  },

  updateLoadingStep: function(step, status) {
    var el = document.getElementById('load-step-' + step);
    if (el) {
      el.classList.remove('active', 'done');
      el.classList.add(status);
    }
  },

  updateLoadingText: function(text) {
    var el = document.querySelector('.loading-content > p:last-child');
    if (el) el.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> ' + text;
  },

  delay: function(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  },

  hideLoading: function() {
    var loading = document.getElementById('loading-screen');
    var app = document.getElementById('app');
    if (loading) {
      loading.classList.add('fade-out');
      setTimeout(function() { loading.style.display = 'none'; }, 700);
    }
    if (app) app.classList.add('visible');
  },

  // ============ VIEW MANAGEMENT ============

  showLogin: function() {
    Utils.hide('dashboard-section');
    Utils.show('login-section');
    Utils.show('login-card');
    Utils.hide('register-card');
    Utils.hide('pending-card');
    this.stopAutoRefresh();
  },

  showDashboard: function() {
    Utils.hide('login-section');
    Utils.show('dashboard-section');
    this.updateUserUI();
    this.updatePermissionsUI();
    this.navigateTo('dashboard');
    this.startAutoRefresh();
  },

  updateUserUI: function() {
    var name = Auth.getUserName();
    var role = Auth.getUserRole();
    var initials = Auth.getInitials();

    var el;
    el = document.getElementById('header-user-name'); if (el) el.textContent = name;
    el = document.getElementById('header-user-role'); if (el) el.textContent = role;
    el = document.getElementById('user-avatar'); if (el) el.textContent = initials;
    el = document.getElementById('dropdown-name'); if (el) el.textContent = name;
    el = document.getElementById('dropdown-email'); if (el) el.textContent = Auth.getUserEmail();
    el = document.getElementById('dropdown-avatar'); if (el) el.textContent = initials;
    el = document.getElementById('requester-name'); if (el) el.textContent = name;
    el = document.getElementById('requester-email'); if (el) el.textContent = Auth.getUserEmail();
    el = document.getElementById('requester-department'); if (el) el.textContent = Auth.getUserDepartment() || '-';
    el = document.getElementById('requester-designation'); if (el) el.textContent = Auth.getUserDesignation() || '-';
  },

  updatePermissionsUI: function() {
    var isAdmin = Auth.hasAdminAccess();
    var canViewAll = Auth.canViewAllTickets();

    document.querySelectorAll('.admin-only').forEach(function(el) {
      el.classList.toggle('hidden', !isAdmin);
    });
    document.querySelectorAll('.engineer-only').forEach(function(el) {
      el.classList.toggle('hidden', !canViewAll);
    });
  },

  // ============ NAVIGATION ============

  navigateTo: function(page) {
    if (page === 'all-tickets' && !Auth.canViewAllTickets()) {
      Utils.showToast('Access denied', 'error');
      page = 'my-tickets';
    }
    if (page === 'admin' && !Auth.hasAdminAccess()) {
      Utils.showToast('Access denied', 'error');
      page = 'dashboard';
    }

    this.currentPage = page;

    document.querySelectorAll('.nav-item').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    document.querySelectorAll('.page').forEach(function(p) {
      var pageId = p.id.replace('page-', '');
      if (pageId === page) {
        p.classList.add('active');
        p.classList.remove('hidden');
      } else {
        p.classList.remove('active');
        p.classList.add('hidden');
      }
    });

    this.loadPage(page);
    Sound.play('click');
  },

  loadPage: async function(page) {
    switch (page) {
      case 'dashboard': await this.loadDashboard(); break;
      case 'create': this.setupCreateForm(); break;
      case 'my-tickets': await this.loadMyTickets(); break;
      case 'all-tickets':
        if (Auth.canViewAllTickets()) await this.loadAllTickets();
        break;
      case 'admin':
        if (Auth.hasAdminAccess()) await this.loadAdminPanel();
        break;
    }
  },

  // ============ DASHBOARD ============

  loadDashboard: async function() {
    var recentCard = document.getElementById('recent-tickets')?.closest('.dashboard-card');
    var activityCard = document.getElementById('activity-feed')?.closest('.dashboard-card');
    var highCard = document.querySelector('.stat-card.purple');

    if (Auth.canViewAllTickets()) {
      if (recentCard) recentCard.style.display = '';
      if (activityCard) activityCard.style.display = '';
      if (highCard) highCard.style.display = '';
      await Promise.all([this.loadStats(), this.loadRecentTickets(), this.loadMyRecentTickets(), this.loadActivityFeed()]);
    } else {
      if (recentCard) recentCard.style.display = 'none';
      if (activityCard) activityCard.style.display = 'none';
      if (highCard) highCard.style.display = 'none';
      await Promise.all([this.loadMyStats(), this.loadMyRecentTickets()]);
    }
  },

  refreshDashboard: async function() {
    Utils.showToast('Refreshing...', 'info', 1500);
    Tickets.cache = [];
    Tickets.myTickets = [];
    await this.loadDashboard();
  },

  loadStats: async function() {
    var result = await Tickets.getStats();
    if (result.success && result.stats) {
      var s = result.stats;
      this.animateStat('stat-open', s.open || 0);
      this.animateStat('stat-progress', s.inProgress || 0);
      this.animateStat('stat-critical', s.critical || 0);
      this.animateStat('stat-high', s.high || 0);
      this.animateStat('stat-resolved', s.resolved || 0);
      this.animateStat('stat-today', s.resolvedToday || 0);
    }
  },

  loadMyStats: async function() {
    var result = await Tickets.getMyTickets();
    if (result.success && result.tickets) {
      var t = result.tickets;
      this.animateStat('stat-open', t.filter(function(x){return x.status==='Open'}).length);
      this.animateStat('stat-progress', t.filter(function(x){return x.status==='In Progress'}).length);
      this.animateStat('stat-critical', t.filter(function(x){return x.status==='Pending'}).length);
      this.animateStat('stat-resolved', t.filter(function(x){return x.status==='Resolved'||x.status==='Closed'}).length);
      this.animateStat('stat-today', t.length);

      var cl = document.querySelector('#critical-card .stat-label');
      if (cl) cl.textContent = 'Pending';
      var tl = document.querySelector('.stat-card.teal .stat-label');
      if (tl) tl.textContent = 'Total';
    }
  },

  animateStat: function(id, value) {
    var el = document.getElementById(id);
    if (!el) return;
    var start = parseInt(el.textContent) || 0;
    var duration = 500;
    var startTime = performance.now();
    function animate(time) {
      var progress = Math.min((time - startTime) / duration, 1);
      el.textContent = Math.round(start + (value - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  },

  loadRecentTickets: async function() {
    var container = document.getElementById('recent-tickets');
    if (!container || !Auth.canViewAllTickets()) return;
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    var tickets = await Tickets.getRecent(5);
    if (tickets.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No tickets yet</p></div>';
      return;
    }
    container.innerHTML = tickets.map(function(t) { return App.renderTicketItem(t); }).join('');
  },

  loadMyRecentTickets: async function() {
    var container = document.getElementById('my-recent-tickets');
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    var tickets = await Tickets.getMyRecent(5);
    if (tickets.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No tickets yet</p><button class="btn-primary" onclick="App.navigateTo(\'create\')"><i class="fas fa-plus"></i> Create Ticket</button></div>';
      return;
    }
    container.innerHTML = tickets.map(function(t) { return App.renderTicketItem(t); }).join('');
  },

  loadActivityFeed: async function() {
    var container = document.getElementById('activity-feed');
    if (!container || !Auth.canViewAllTickets()) return;
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    var activities = await Tickets.getActivityFeed(10);
    if (activities.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-stream"></i><p>No activity</p></div>';
      return;
    }
    container.innerHTML = activities.map(function(a) {
      return '<div class="activity-item"><div class="activity-icon ' + (a.type||'updated') + '"><i class="fas ' + App.getActivityIcon(a.type) + '"></i></div><div class="activity-text">' + Utils.escapeHtml(a.action) + '</div><div class="activity-time">' + Utils.timeAgo(a.time) + '</div></div>';
    }).join('');
  },

  getActivityIcon: function(type) {
    var icons = { created:'fa-plus-circle', updated:'fa-edit', resolved:'fa-check-circle', login:'fa-sign-in-alt', register:'fa-user-plus', feedback:'fa-star', register_pending:'fa-user-clock', registration_approved:'fa-user-check', registration_rejected:'fa-user-times', totp_setup:'fa-key' };
    return icons[type] || 'fa-circle';
  },

  renderTicketItem: function(ticket) {
    var pc = Tickets.getPriorityClass(ticket.priority);
    var sc = Tickets.getStatusClass(ticket.status);
    return '<div class="ticket-list-item ' + pc + '" onclick="App.openTicketModal(\'' + ticket.ticketId + '\')">' +
      '<div class="ticket-info"><div class="ticket-id">' + ticket.ticketId + '</div><div class="ticket-title">' + Utils.escapeHtml(Utils.truncate(ticket.title,50)) + '</div><div class="ticket-meta"><span><i class="fas fa-user"></i> ' + Utils.escapeHtml(ticket.createdBy) + '</span><span><i class="fas fa-clock"></i> ' + Utils.timeAgo(ticket.createdTime) + '</span></div></div>' +
      '<div class="ticket-badges"><span class="status-badge ' + sc + '">' + ticket.status + '</span><span class="priority-badge ' + pc + '">' + ticket.priority + '</span></div></div>';
  },

  // ============ CREATE TICKET ============

  setupCreateForm: function() {
    document.querySelectorAll('input[name="category"]').forEach(function(input) {
      input.addEventListener('change', function(e) { App.onCategoryChange(e.target.value); });
    });
    var titleInput = document.getElementById('ticket-title');
    var titleCount = document.getElementById('title-count');
    if (titleInput && titleCount) {
      titleInput.addEventListener('input', function() { titleCount.textContent = titleInput.value.length; });
    }
  },

  onCategoryChange: function(category) {
    var section = document.getElementById('subcategory-section');
    var select = document.getElementById('ticket-subcategory');
    if (!section || !select) return;
    var cat = CONFIG.CATEGORIES.find(function(c) { return c.id === category; });
    if (cat && cat.subcategories && cat.subcategories.length > 0) {
      section.classList.remove('hidden');
      select.innerHTML = '<option value="">Select type...</option>' + cat.subcategories.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');
    } else {
      section.classList.add('hidden');
    }
  },

  handleCreateTicket: async function(e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('button[type="submit"]');
    var cat = form.querySelector('input[name="category"]:checked');
    var category = cat ? cat.value : '';
    var subcategory = document.getElementById('ticket-subcategory')?.value || '';
    var title = (document.getElementById('ticket-title')?.value || '').trim();
    var description = (document.getElementById('ticket-description')?.value || '').trim();
    var priority = document.getElementById('ticket-priority')?.value;
    var location = (document.getElementById('ticket-location')?.value || '').trim();

    if (!category) { Utils.showToast('Select a category', 'error'); return; }
    if (!title || title.length < 5) { Utils.showToast('Subject must be at least 5 characters', 'error'); return; }
    if (!description || description.length < 10) { Utils.showToast('Description must be at least 10 characters', 'error'); return; }

    Utils.setButtonLoading(btn, true, 'Submitting...');
    var result = await Tickets.create({ category:category, subcategory:subcategory, title:title, description:description, priority:priority, location:location });
    Utils.setButtonLoading(btn, false);

    if (result.success) {
      Utils.showToast('Ticket ' + result.ticketId + ' created!', 'success');
      form.reset();
      var tc = document.getElementById('title-count'); if (tc) tc.textContent = '0';
      Utils.hide('subcategory-section');
      setTimeout(function() { App.navigateTo('my-tickets'); }, 1500);
    } else {
      Utils.showToast(result.message || 'Failed', 'error');
    }
  },

  // ============ MY TICKETS ============

  loadMyTickets: async function(filter) {
    filter = filter || 'all';
    var container = document.getElementById('my-tickets-list');
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    var result = await Tickets.getMyTickets();
    if (!result.success || result.tickets.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-ticket-alt"></i><h3>No Tickets</h3><p>You haven\'t submitted any tickets yet.</p><button class="btn-primary" onclick="App.navigateTo(\'create\')"><i class="fas fa-plus"></i> Create Ticket</button></div>';
      return;
    }
    var tickets = result.tickets;
    if (filter !== 'all') tickets = tickets.filter(function(t) { return t.status === filter; });
    if (tickets.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-filter"></i><p>No ' + filter + ' tickets</p></div>';
      return;
    }
    container.innerHTML = tickets.map(function(t) { return App.renderTicketItem(t); }).join('');
  },

  // ============ ALL TICKETS ============

  loadAllTickets: async function() {
    if (!Auth.canViewAllTickets()) { this.navigateTo('my-tickets'); return; }
    var tbody = document.getElementById('tickets-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    var result = await Tickets.getAll();
    if (!result.success || result.tickets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No tickets found</td></tr>';
      return;
    }
    var filtered = Tickets.filterTickets(result.tickets);
    var paginated = Tickets.paginate(filtered, Tickets.currentPage);
    Tickets.totalPages = Math.ceil(filtered.length / Tickets.itemsPerPage);
    if (paginated.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No matching tickets</td></tr>';
      return;
    }
    tbody.innerHTML = paginated.map(function(t) {
      return '<tr onclick="App.openTicketModal(\'' + t.ticketId + '\')" style="cursor:pointer"><td class="ticket-id-col">' + t.ticketId + '</td><td>' + Utils.escapeHtml(Utils.truncate(t.title,40)) + '</td><td>' + (t.category||'-') + '</td><td>' + Utils.escapeHtml(t.createdBy) + '</td><td><span class="priority-badge ' + Tickets.getPriorityClass(t.priority) + '">' + t.priority + '</span></td><td><span class="status-badge ' + Tickets.getStatusClass(t.status) + '">' + t.status + '</span></td><td>' + (t.assignedTo||'-') + '</td><td>' + Utils.timeAgo(t.createdTime) + '</td><td><button class="btn-small" onclick="event.stopPropagation();App.openTicketModal(\'' + t.ticketId + '\')"><i class="fas fa-eye"></i></button></td></tr>';
    }).join('');
    document.getElementById('page-info').textContent = 'Page ' + Tickets.currentPage + ' of ' + Tickets.totalPages;
  },

  applyFilters: function() {
    Tickets.setFilters({
      status: document.getElementById('filter-status')?.value || 'All',
      priority: document.getElementById('filter-priority')?.value || 'All',
      category: document.getElementById('filter-category')?.value || 'All',
      search: document.getElementById('filter-search')?.value || ''
    });
    this.loadAllTickets();
  },

  clearFilters: function() {
    document.getElementById('filter-status').value = 'All';
    document.getElementById('filter-priority').value = 'All';
    document.getElementById('filter-category').value = 'All';
    document.getElementById('filter-search').value = '';
    Tickets.clearFilters();
    this.loadAllTickets();
  },

  // ============ ADMIN PANEL ============

  loadAdminPanel: async function() {
    if (!Auth.hasAdminAccess()) return;
    await this.loadPendingUsers();
    this.checkTOTPStatus();
  },

  loadPendingUsers: async function() {
    var container = document.getElementById('pending-users-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    var result = await Auth.getPendingRegistrations();
    var badge = document.getElementById('pending-count');
    if (badge) badge.textContent = result.registrations?.length || 0;
    if (!result.success || !result.registrations || result.registrations.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-user-check"></i><h3>No Pending</h3><p>All registrations processed.</p></div>';
      return;
    }
    container.innerHTML = result.registrations.map(function(user) {
      var safeEmail = user.email.replace(/[^a-z0-9]/gi, '_');
      return '<div class="pending-user-card" data-email="' + user.email + '"><div class="pending-user-header"><div><div class="pending-user-name">' + Utils.escapeHtml(user.name) + '</div><div class="pending-user-email">' + Utils.escapeHtml(user.email) + '</div></div><div class="pending-user-time"><i class="fas fa-clock"></i> ' + Utils.timeAgo(user.registeredAt) + '</div></div><div class="pending-user-details"><div><label>Department</label><span>' + (user.department||'-') + '</span></div><div><label>Designation</label><span>' + (user.designation||'-') + '</span></div><div><label>Phone</label><span>' + (user.phone||'-') + '</span></div><div><label>Location</label><span>' + (user.location||'-') + '</span></div></div><div class="pending-user-actions"><input type="text" class="otp-input-field" id="totp-' + safeEmail + '" placeholder="TOTP Code" maxlength="6" inputmode="numeric" autocomplete="one-time-code" oninput="this.value=this.value.replace(/[^0-9]/g,\'\')"><button class="btn-approve" onclick="App.approveUser(\'' + user.email + '\')"><i class="fas fa-check"></i> Approve</button><button class="btn-reject" onclick="App.rejectUser(\'' + user.email + '\')"><i class="fas fa-times"></i> Reject</button></div></div>';
    }).join('');
  },

  approveUser: async function(email) {
    var safeEmail = email.replace(/[^a-z0-9]/gi, '_');
    var input = document.getElementById('totp-' + safeEmail);
    var code = input ? input.value.trim() : '';
    if (!code || code.length !== 6) {
      Utils.showToast('Enter 6-digit code from Authenticator', 'error');
      if (input) input.focus();
      return;
    }
    var card = document.querySelector('.pending-user-card[data-email="' + email + '"]');
    var btn = card ? card.querySelector('.btn-approve') : null;
    if (btn) Utils.setButtonLoading(btn, true, 'Verifying...');
    var result = await Auth.approveRegistration(email, code);
    if (btn) Utils.setButtonLoading(btn, false);
    if (result.success) {
      Utils.showToast('✅ User approved!', 'success');
      if (card) { card.style.transition='all 0.3s'; card.style.opacity='0'; card.style.transform='translateX(100px)'; }
      setTimeout(function() { App.loadPendingUsers(); }, 300);
    } else {
      Utils.showToast(result.message || 'Failed', 'error');
    }
  },

  rejectUser: async function(email) {
    if (!confirm('Reject this registration?')) return;
    var reason = prompt('Reason (optional):');
    var card = document.querySelector('.pending-user-card[data-email="' + email + '"]');
    var btn = card ? card.querySelector('.btn-reject') : null;
    if (btn) Utils.setButtonLoading(btn, true, 'Rejecting...');
    var result = await Auth.rejectRegistration(email, reason || '');
    if (btn) Utils.setButtonLoading(btn, false);
    if (result.success) {
      Utils.showToast('Rejected', 'warning');
      if (card) { card.style.transition='all 0.3s'; card.style.opacity='0'; }
      setTimeout(function() { App.loadPendingUsers(); }, 300);
    } else {
      Utils.showToast(result.message || 'Failed', 'error');
    }
  },

  loadAllUsers: async function() {
    var tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    var result = await Utils.api('getUsers');
    if (!result.success || !result.users || result.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
      return;
    }
    tbody.innerHTML = result.users.map(function(u) {
      return '<tr><td>' + Utils.escapeHtml(u.name) + '</td><td>' + Utils.escapeHtml(u.email) + '</td><td>' + (u.department||'-') + '</td><td><span class="role-badge">' + (u.role||'Staff') + '</span></td><td>' + (u.lastLogin ? Utils.timeAgo(u.lastLogin) : 'Never') + '</td><td><button class="btn-small"><i class="fas fa-edit"></i></button></td></tr>';
    }).join('');
  },

  // ============ TOTP SETUP ============

  generateTOTP: function() {
    console.log('🔑 generateTOTP called');

    if (typeof TOTP === 'undefined') {
      Utils.showToast('TOTP module not loaded. Check js/totp.js', 'error');
      console.error('TOTP is undefined');
      return;
    }

    var email = Auth.getUserEmail() || 'admin';
    var setup = TOTP.setup(email);

    console.log('🔑 Secret:', setup.secret.substring(0, 8) + '...');
    console.log('🔑 QR HTML length:', setup.qrHtml.length);

    this._totpSecret = setup.secret;

    // Show QR Code
    var qrEl = document.getElementById('totp-qr-code');
    if (qrEl) {
      qrEl.innerHTML = setup.qrHtml;
    }

    // Show secret for manual entry
    var secEl = document.getElementById('totp-secret-display');
    if (secEl) {
      secEl.textContent = setup.formattedSecret;
    }

    // Toggle visibility using style.display
    document.getElementById('totp-step-generate').style.display = 'none';
    var alreadyEl = document.getElementById('totp-already-setup');
    if (alreadyEl) alreadyEl.style.display = 'none';
    document.getElementById('totp-step-scan').style.display = 'block';
    document.getElementById('totp-step-verify').style.display = 'block';

    // Clear and focus verify input
    var verifyInput = document.getElementById('totp-verify-code');
    if (verifyInput) {
      verifyInput.value = '';
      setTimeout(function() { verifyInput.focus(); }, 300);
    }

    // Hide any previous status
    var statusEl = document.getElementById('totp-verify-status');
    if (statusEl) statusEl.style.display = 'none';

    Utils.showToast('Secret generated! Scan the QR code.', 'success');
    Sound.play('success');
  },

  copyTOTPSecret: function() {
    if (!this._totpSecret) {
      Utils.showToast('No secret. Generate one first.', 'error');
      return;
    }
    var secret = this._totpSecret;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(secret).then(function() {
        Utils.showToast('Secret copied!', 'success');
      }).catch(function() {
        App._doCopy(secret);
      });
    } else {
      this._doCopy(secret);
    }
  },

  _doCopy: function(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      Utils.showToast('Secret copied!', 'success');
    } catch (e) {
      Utils.showToast('Copy failed', 'error');
    }
    document.body.removeChild(ta);
  },

  verifyTOTPSetup: async function() {
    var inp = document.getElementById('totp-verify-code');
    var code = inp ? inp.value.replace(/\D/g, '') : '';
    var statusEl = document.getElementById('totp-verify-status');

    if (!code || code.length !== 6) {
      Utils.showToast('Enter 6-digit code from your app', 'error');
      if (inp) inp.focus();
      return;
    }

    if (!this._totpSecret) {
      Utils.showToast('Generate a secret first', 'error');
      return;
    }

    // Find and disable button
    var btns = document.querySelectorAll('#totp-step-verify button.btn-primary');
    var btn = btns.length > 0 ? btns[0] : null;
    if (btn) Utils.setButtonLoading(btn, true, 'Verifying...');

    var result = await Utils.api('verifyTOTPSetup', {
      code: code,
      secret: this._totpSecret,
      email: Auth.getUserEmail()
    });

    if (btn) Utils.setButtonLoading(btn, false);

    if (result.success) {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(34,197,94,0.1)';
        statusEl.style.color = '#16a34a';
        statusEl.style.border = '2px solid rgba(34,197,94,0.3)';
        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> TOTP Verified & Activated!';
      }
      Utils.showToast('✅ TOTP activated!', 'success');
      Sound.play('success');
      this._totpSecret = null;

      setTimeout(function() {
        document.getElementById('totp-step-scan').style.display = 'none';
        document.getElementById('totp-step-verify').style.display = 'none';
        document.getElementById('totp-step-generate').style.display = 'none';
        if (statusEl) statusEl.style.display = 'none';
        document.getElementById('totp-already-setup').style.display = 'block';
      }, 2500);
    } else {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(239,68,68,0.1)';
        statusEl.style.color = '#dc2626';
        statusEl.style.border = '2px solid rgba(239,68,68,0.3)';
        statusEl.innerHTML = '<i class="fas fa-times-circle"></i> ' + (result.message || 'Invalid code');
      }
      Utils.showToast(result.message || 'Invalid code', 'error');
      Sound.play('error');
      if (inp) { inp.value = ''; inp.focus(); }
    }
  },

  resetTOTP: function() {
    if (!confirm('Reset TOTP? You will need to set up again.')) return;
    this._totpSecret = null;
    document.getElementById('totp-already-setup').style.display = 'none';
    document.getElementById('totp-step-scan').style.display = 'none';
    document.getElementById('totp-step-verify').style.display = 'none';
    document.getElementById('totp-step-generate').style.display = 'block';
    var st = document.getElementById('totp-verify-status');
    if (st) st.style.display = 'none';
    Utils.showToast('Click Generate to create new secret', 'info');
  },

  checkTOTPStatus: async function() {
    try {
      var result = await Utils.api('getSettings');
      if (result.success && result.settings) {
        var s = result.settings;
        if (s.totpEnabled === true || s.totpEnabled === 'TRUE') {
          document.getElementById('totp-step-generate').style.display = 'none';
          document.getElementById('totp-step-scan').style.display = 'none';
          document.getElementById('totp-step-verify').style.display = 'none';
          document.getElementById('totp-already-setup').style.display = 'block';
        }
      }
    } catch (e) {
      console.log('TOTP status check failed');
    }
  },

  // ============ TICKET MODAL ============

  openTicketModal: async function(ticketId) {
    var modal = document.getElementById('ticket-modal');
    var body = document.getElementById('modal-body');
    var footer = document.getElementById('modal-footer');
    var titleEl = document.getElementById('modal-ticket-id');
    var statusBadge = document.getElementById('modal-status-badge');
    if (!modal || !body) return;

    modal.classList.remove('hidden');
    body.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    footer.innerHTML = '';
    Sound.play('click');

    var result = await Tickets.getById(ticketId);
    if (!result.success || !result.ticket) {
      body.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Ticket not found</p></div>';
      return;
    }

    var ticket = result.ticket;
    var isOwner = ticket.createdByEmail === Auth.getUserEmail();
    var canViewAll = Auth.canViewAllTickets();

    if (!isOwner && !canViewAll) {
      body.innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i><p>Access denied</p></div>';
      footer.innerHTML = '<button class="btn-secondary" onclick="closeModal(\'ticket-modal\')">Close</button>';
      return;
    }

    var sc = Tickets.getStatusClass(ticket.status);
    if (titleEl) titleEl.textContent = ticket.ticketId;
    if (statusBadge) { statusBadge.textContent = ticket.status; statusBadge.className = 'status-badge ' + sc; }

    body.innerHTML = '<div class="ticket-detail-section"><h4><i class="fas fa-info-circle"></i> Ticket Information</h4><div class="detail-grid"><div class="detail-item"><label>Subject</label><span>' + Utils.escapeHtml(ticket.title) + '</span></div><div class="detail-item full-width"><label>Description</label><div class="detail-description">' + Utils.escapeHtml(ticket.description) + '</div></div><div class="detail-item"><label>Category</label><span>' + (ticket.category||'-') + (ticket.subcategory ? ' / '+ticket.subcategory : '') + '</span></div><div class="detail-item"><label>Priority</label><span class="priority-badge ' + Tickets.getPriorityClass(ticket.priority) + '">' + ticket.priority + '</span></div><div class="detail-item"><label>Location</label><span>' + (ticket.location||'-') + '</span></div></div></div>' +
      '<div class="ticket-detail-section"><h4><i class="fas fa-user"></i> Requester</h4><div class="detail-grid"><div class="detail-item"><label>Name</label><span>' + Utils.escapeHtml(ticket.createdBy) + '</span></div><div class="detail-item"><label>Email</label><span>' + Utils.escapeHtml(ticket.createdByEmail||'-') + '</span></div><div class="detail-item"><label>Department</label><span>' + (ticket.createdByDepartment||'-') + '</span></div></div></div>' +
      '<div class="ticket-detail-section"><h4><i class="fas fa-clock"></i> Timeline</h4><div class="detail-grid"><div class="detail-item"><label>Created</label><span>' + Utils.formatDateTime(ticket.createdTime) + '</span></div><div class="detail-item"><label>Assigned To</label><span>' + (ticket.assignedTo||'Not assigned') + '</span></div>' + (ticket.resolvedTime ? '<div class="detail-item"><label>Resolved</label><span>' + Utils.formatDateTime(ticket.resolvedTime) + '</span></div>' : '') + '</div></div>' +
      (ticket.resolutionNotes ? '<div class="ticket-detail-section"><h4><i class="fas fa-check-circle"></i> Resolution</h4><div class="detail-description">' + Utils.escapeHtml(ticket.resolutionNotes) + '</div></div>' : '') +
      (ticket.feedbackRating ? '<div class="ticket-detail-section"><h4><i class="fas fa-star"></i> Feedback</h4><div class="feedback-display"><div class="stars">' + '★'.repeat(ticket.feedbackRating) + '☆'.repeat(5-ticket.feedbackRating) + '</div>' + (ticket.feedbackComment ? '<p>"' + Utils.escapeHtml(ticket.feedbackComment) + '"</p>' : '') + '</div></div>' : '') +
      (Auth.canManageTickets() ? '<div class="ticket-detail-section admin-controls"><h4><i class="fas fa-cog"></i> Admin Controls</h4><div class="detail-grid"><div class="input-group"><label>Assign To</label><select id="modal-assign-select"><option value="">Select...</option></select></div><div class="input-group"><label>Status</label><select id="modal-status-select">' + CONFIG.STATUSES.map(function(s) { return '<option value="' + s.id + '"' + (s.id===ticket.status?' selected':'') + '>' + s.name + '</option>'; }).join('') + '</select></div><div class="input-group full-width"><label>Resolution Notes</label><textarea id="modal-resolution" rows="3">' + (ticket.resolutionNotes||'') + '</textarea></div></div></div>' : '');

    // Load engineers
    if (Auth.canManageTickets()) {
      var assignSelect = document.getElementById('modal-assign-select');
      if (assignSelect) {
        var engResult = await Tickets.getEngineers();
        if (engResult.success && engResult.engineers) {
          assignSelect.innerHTML = '<option value="">Select...</option>' + engResult.engineers.map(function(e) {
            return '<option value="' + e.email + '"' + (e.email===ticket.assignedToEmail?' selected':'') + '>' + e.name + '</option>';
          }).join('');
        }
      }
    }

    var fh = '';
    if (Auth.canManageTickets()) fh += '<button class="btn-primary" onclick="App.saveTicketChanges(\'' + ticket.ticketId + '\')"><i class="fas fa-save"></i> Save</button>';
    if (Tickets.canSubmitFeedback(ticket)) fh += '<button class="btn-primary" style="background:linear-gradient(135deg,#f59e0b,#d97706);" onclick="App.openFeedbackModal(\'' + ticket.ticketId + '\')"><i class="fas fa-star"></i> Rate</button>';
    fh += '<button class="btn-secondary" onclick="closeModal(\'ticket-modal\')">Close</button>';
    footer.innerHTML = fh;
  },

  saveTicketChanges: async function(ticketId) {
    var assignSelect = document.getElementById('modal-assign-select');
    var status = document.getElementById('modal-status-select')?.value;
    var resolution = document.getElementById('modal-resolution')?.value;
    var updates = {};
    if (assignSelect && assignSelect.value) {
      updates.assignedToEmail = assignSelect.value;
      updates.assignedTo = assignSelect.options[assignSelect.selectedIndex].text;
    }
    if (status) updates.status = status;
    if (resolution !== undefined) updates.resolutionNotes = resolution;
    if (Object.keys(updates).length === 0) { Utils.showToast('No changes', 'info'); return; }
    var result = await Tickets.update(ticketId, updates, true);
    if (result.success) {
      Utils.showToast('Updated!', 'success');
      closeModal('ticket-modal');
      this.loadPage(this.currentPage);
    } else {
      Utils.showToast(result.message || 'Failed', 'error');
    }
  },

  // ============ FEEDBACK ============

  openFeedbackModal: function(ticketId) {
    var modal = document.getElementById('feedback-modal');
    if (!modal) return;
    document.getElementById('feedback-ticket-id').value = ticketId;
    document.getElementById('feedback-rating').value = 0;
    document.getElementById('feedback-comment').value = '';
    document.getElementById('rating-text').textContent = 'Select a rating';
    document.querySelectorAll('.star-rating .star').forEach(function(s) { s.classList.remove('active'); });
    modal.classList.remove('hidden');
    closeModal('ticket-modal');
    Sound.play('click');
  },

  handleFeedbackSubmit: async function(e) {
    e.preventDefault();
    var ticketId = document.getElementById('feedback-ticket-id').value;
    var rating = parseInt(document.getElementById('feedback-rating').value);
    var comment = document.getElementById('feedback-comment').value;
    if (!rating || rating < 1) { Utils.showToast('Select a rating', 'error'); return; }
    var btn = e.target.querySelector('button[type="submit"]');
    Utils.setButtonLoading(btn, true, 'Submitting...');
    var result = await Tickets.submitFeedback(ticketId, rating, comment);
    Utils.setButtonLoading(btn, false);
    if (result.success) {
      Utils.showToast('Thank you! 🌟', 'success');
      closeModal('feedback-modal');
      this.loadPage(this.currentPage);
    } else {
      Utils.showToast(result.message || 'Failed', 'error');
    }
  },

  // ============ AUTO REFRESH ============

  startAutoRefresh: function() {
    var interval = CONFIG.AUTO_REFRESH || 30000;
    if (interval > 0) {
      this.refreshInterval = setInterval(function() {
        if (App.currentPage === 'dashboard') {
          Auth.canViewAllTickets() ? App.loadStats() : App.loadMyStats();
        }
      }, interval);
    }
  },

  stopAutoRefresh: function() {
    if (this.refreshInterval) { clearInterval(this.refreshInterval); this.refreshInterval = null; }
  },

  // ============ EVENT LISTENERS ============

  setupEventListeners: function() {
    // Login
    document.getElementById('login-form')?.addEventListener('submit', function(e) { App.handleLogin(e); });
    document.getElementById('register-form')?.addEventListener('submit', function(e) { App.handleRegister(e); });

    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var isAdmin = tab.dataset.tab === 'admin';
        var pwdGroup = document.getElementById('admin-password-group');
        if (pwdGroup) pwdGroup.classList.toggle('hidden', !isAdmin);
      });
    });

    // Register toggle
    document.getElementById('show-register-btn')?.addEventListener('click', function() { Utils.hide('login-card'); Utils.show('register-card'); });
    document.getElementById('back-to-login-btn')?.addEventListener('click', function() { Utils.hide('register-card'); Utils.show('login-card'); });
    document.getElementById('pending-back-btn')?.addEventListener('click', function() { Utils.hide('pending-card'); Utils.show('login-card'); });

    // Check status
    document.getElementById('check-status-btn')?.addEventListener('click', async function() {
      var email = Auth.pendingEmail || document.getElementById('pending-email')?.textContent;
      if (!email) return;
      Utils.showToast('Checking...', 'info', 1500);
      var result = await Auth.checkStatus(email);
      if (result.status === 'approved') {
        Utils.showToast('Account active! Please login.', 'success');
        Utils.hide('pending-card'); Utils.show('login-card');
        document.getElementById('login-email').value = email;
      } else if (result.status === 'rejected') {
        Utils.showToast('Registration rejected.', 'error');
      } else {
        Utils.showToast('Still pending.', 'info');
      }
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(function(btn) {
      btn.addEventListener('click', function() { if (btn.dataset.page) App.navigateTo(btn.dataset.page); });
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); if (confirm('Logout?')) Auth.logout(); });

    // User dropdown
    document.getElementById('user-menu-btn')?.addEventListener('click', function() { document.getElementById('user-dropdown')?.classList.toggle('hidden'); });
    document.addEventListener('click', function(e) {
      var dd = document.getElementById('user-dropdown');
      var btn = document.getElementById('user-menu-btn');
      if (dd && btn && !btn.contains(e.target) && !dd.contains(e.target)) dd.classList.add('hidden');
    });

    // Sound
    document.getElementById('sound-toggle')?.addEventListener('click', function() {
      var enabled = Sound.toggle();
      Utils.showToast(enabled ? 'Sound on 🔊' : 'Sound off 🔇', 'info', 1500);
    });

    // Create ticket
    document.getElementById('create-ticket-form')?.addEventListener('submit', function(e) { App.handleCreateTicket(e); });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        App.loadMyTickets(btn.dataset.filter);
      });
    });

    // All tickets filters
    document.getElementById('apply-filters')?.addEventListener('click', function() { App.applyFilters(); });
    document.getElementById('clear-filters')?.addEventListener('click', function() { App.clearFilters(); });

    // Pagination
    document.getElementById('prev-page')?.addEventListener('click', function() { Tickets.prevPage(); App.loadAllTickets(); });
    document.getElementById('next-page')?.addEventListener('click', function() { Tickets.nextPage(); App.loadAllTickets(); });

    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var tabName = tab.dataset.tab;
        document.querySelectorAll('.admin-tab-content').forEach(function(c) {
          var isActive = c.id === 'tab-' + tabName;
          c.classList.toggle('active', isActive);
          c.classList.toggle('hidden', !isActive);
        });
        if (tabName === 'pending-users') App.loadPendingUsers();
        else if (tabName === 'all-users') App.loadAllUsers();
        else if (tabName === 'totp-setup') App.checkTOTPStatus();
      });
    });

    // Feedback
    document.getElementById('feedback-form')?.addEventListener('submit', function(e) { App.handleFeedbackSubmit(e); });

    // Stars
    document.querySelectorAll('.star-rating .star').forEach(function(star) {
      star.addEventListener('click', function() {
        var rating = parseInt(star.dataset.rating);
        document.getElementById('feedback-rating').value = rating;
        var texts = ['','Poor 😞','Fair 😐','Good 🙂','Very Good 😊','Excellent 🤩'];
        document.getElementById('rating-text').textContent = texts[rating] || '';
        document.querySelectorAll('.star-rating .star').forEach(function(s, i) { s.classList.toggle('active', i < rating); });
        Sound.play('click');
      });
    });

    // Modal close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') document.querySelectorAll('.modal:not(.hidden)').forEach(function(m) { m.classList.add('hidden'); });
    });
    document.querySelectorAll('.modal-backdrop').forEach(function(b) {
      b.addEventListener('click', function() { b.closest('.modal')?.classList.add('hidden'); });
    });

    // Settings
    document.getElementById('save-telegram')?.addEventListener('click', async function() {
      var r = await Utils.api('saveSettings', { settings: { telegramToken: document.getElementById('setting-telegram-token')?.value, telegramChat: document.getElementById('setting-telegram-chat')?.value }});
      Utils.showToast(r.success ? 'Saved!' : 'Failed', r.success ? 'success' : 'error');
    });
    document.getElementById('test-telegram')?.addEventListener('click', async function() {
      var r = await Utils.api('testTelegram');
      Utils.showToast(r.success ? 'Test sent!' : r.message, r.success ? 'success' : 'error');
    });
    document.getElementById('save-email-settings')?.addEventListener('click', async function() {
      var r = await Utils.api('saveSettings', { settings: { emailFromName: document.getElementById('setting-email-from')?.value, adminEmail: document.getElementById('setting-admin-email')?.value }});
      Utils.showToast(r.success ? 'Saved!' : 'Failed', r.success ? 'success' : 'error');
    });
  },

  // ============ AUTH HANDLERS ============

  handleLogin: async function(e) {
    e.preventDefault();
    var email = (document.getElementById('login-email')?.value || '').trim();
    var password = document.getElementById('admin-password')?.value || '';
    var activeTab = document.querySelector('.auth-tab.active');
    var isAdmin = activeTab ? activeTab.dataset.tab === 'admin' : false;
    if (!email) { Utils.showToast('Enter email', 'error'); return; }
    var btn = e.target.querySelector('button[type="submit"]');
    Utils.setButtonLoading(btn, true, 'Signing in...');
    var result = await Auth.login(email, password, isAdmin);
    Utils.setButtonLoading(btn, false);
    if (result.success) {
      Utils.showToast('Welcome, ' + result.user.name + '!', 'success');
      this.showDashboard();
    } else if (result.isPending) {
      Auth.pendingEmail = email;
      Utils.hide('login-card'); Utils.show('pending-card');
      document.getElementById('pending-email').textContent = email;
      Utils.showToast(result.message, 'warning');
    } else if (result.notFound) {
      Utils.showToast(result.message, 'warning');
      Utils.hide('login-card'); Utils.show('register-card');
      document.getElementById('reg-email').value = email;
    } else {
      Utils.showToast(result.message || 'Login failed', 'error');
    }
  },

  handleRegister: async function(e) {
    e.preventDefault();
    var userData = {
      firstName: (document.getElementById('reg-firstname')?.value || '').trim(),
      lastName: (document.getElementById('reg-lastname')?.value || '').trim(),
      email: (document.getElementById('reg-email')?.value || '').trim(),
      phone: (document.getElementById('reg-phone')?.value || '').trim(),
      department: document.getElementById('reg-department')?.value,
      designation: (document.getElementById('reg-designation')?.value || '').trim(),
      location: (document.getElementById('reg-location')?.value || '').trim()
    };
    var btn = e.target.querySelector('button[type="submit"]');
    Utils.setButtonLoading(btn, true, 'Submitting...');
    var result = await Auth.register(userData);
    Utils.setButtonLoading(btn, false);
    if (result.success) {
      Utils.showToast('Registration submitted!', 'success');
      Utils.hide('register-card'); Utils.show('pending-card');
      document.getElementById('pending-email').textContent = userData.email;
    } else {
      Utils.showToast(result.message || 'Failed', 'error');
    }
  }
};

// Global close modal
function closeModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

// Init
document.addEventListener('DOMContentLoaded', function() { App.init(); });

// Error handling
window.addEventListener('error', function(e) { console.error('Error:', e.error); });
window.addEventListener('unhandledrejection', function(e) { console.error('Rejection:', e.reason); });