/**
 * CHN IT Support System
 * Authentication Module
 * Version: 4.0.0 - Fixed Duplicates + TOTP
 */

const Auth = {
  user: null,
  isLoggedIn: false,
  pendingEmail: null,

  
  // ============ INITIALIZATION ============

  init() {
    console.log('🔐 Auth initializing...');
    return this.checkSession();
  },

  checkSession() {
    const stored = Utils.storage.get('user');
    if (stored && stored.email) {
      this.user = stored;
      this.isLoggedIn = true;
      console.log('✅ Session restored:', stored.email);
      return true;
    }
    return false;
  },
// In auth.js
checkSession() {
  const stored = Utils.storage.get('user');
  const sessionExpiry = Utils.storage.get('sessionExpiry');
  
  if (stored && sessionExpiry) {
    if (Date.now() > sessionExpiry) {
      this.logout();
      Utils.showToast('Session expired. Please login again.', 'warning');
      return false;
    }
    return true;
  }
  return false;
},

// Set expiry on login (e.g., 8 hours)
login() {
  // ... after successful login
  const expiryTime = Date.now() + (3 * 60 * 60 * 1000); // 8 hours
  Utils.storage.set('sessionExpiry', expiryTime);
},
  // ============ LOGIN ============

  async login(email, password, isAdmin) {
    try {
      if (!email) {
        return { success: false, message: 'Email is required' };
      }

      email = email.trim().toLowerCase();

      if (!Utils.isValidEmail(email)) {
        return { success: false, message: 'Invalid email format' };
      }

      const result = await Utils.api('login', {
        email: email,
        password: password || '',
        isAdmin: isAdmin ? 'true' : 'false'
      });

      if (result.success) {
        const userData = result.user || result;

        this.user = {
          email: userData.email || email,
          name: userData.name || 
                ((userData.firstName || '') + ' ' + (userData.lastName || '')).trim() || 
                email.split('@')[0],
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          department: userData.department || '',
          designation: userData.designation || '',
          location: userData.location || '',
          role: userData.role || 'Staff',
          isAdmin: userData.isAdmin || userData.role === 'Admin' || false
        };

        this.isLoggedIn = true;
        Utils.storage.set('user', this.user);

        Sound.play('success');
        return { success: true, user: this.user, message: result.message || 'Welcome!' };
      }

      // Pending
      if (result.isPending) {
        this.pendingEmail = email;
        return { success: false, message: result.message, isPending: true };
      }

      return result;

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  },

  // ============ REGISTER ============

  async register(userData) {
    try {
      if (!userData.firstName || !userData.lastName) {
        return { success: false, message: 'Name is required' };
      }

      if (!userData.email || !Utils.isValidEmail(userData.email)) {
        return { success: false, message: 'Valid email is required' };
      }

      if (!userData.department) {
        return { success: false, message: 'Department is required' };
      }

      if (!userData.designation) {
        return { success: false, message: 'Designation is required' };
      }

      const cleanData = {
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.trim().toLowerCase(),
        phone: (userData.phone || '').trim(),
        department: userData.department,
        designation: userData.designation.trim(),
        location: (userData.location || '').trim()
      };

      const result = await Utils.api('register', { userData: cleanData });

      if (result.success) {
        this.pendingEmail = cleanData.email;
        Sound.play('notification');
      }

      return result;

    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  },

  // ============ ADMIN - PENDING USERS ============

  async getPendingRegistrations() {
    try {
      return await Utils.api('getPendingRegistrations');
    } catch (error) {
      console.error('Get pending error:', error);
      return { success: false, registrations: [] };
    }
  },

  async approveRegistration(email, totpCode) {
    try {
      if (!email) {
        return { success: false, message: 'Email is required' };
      }

      if (!totpCode || totpCode.length !== 6) {
        return { success: false, message: 'Valid 6-digit TOTP code is required' };
      }

      const result = await Utils.api('approveRegistration', {
        email: email.trim().toLowerCase(),
        totpCode: totpCode.trim(),
        approvedBy: this.getUserEmail()
      });

      if (result.success) {
        Sound.play('success');
      }

      return result;

    } catch (error) {
      console.error('Approve error:', error);
      return { success: false, message: 'Approval failed. Please try again.' };
    }
  },

  async rejectRegistration(email, reason) {
    try {
      const result = await Utils.api('rejectRegistration', {
        email: email.trim().toLowerCase(),
        reason: reason || '',
        rejectedBy: this.getUserEmail()
      });

      if (result.success) {
        Sound.play('notification');
      }

      return result;

    } catch (error) {
      console.error('Reject error:', error);
      return { success: false, message: 'Rejection failed.' };
    }
  },

  async checkStatus(email) {
    try {
      return await Utils.api('checkRegistrationStatus', {
        email: email.trim().toLowerCase()
      });
    } catch (error) {
      return { success: false, status: 'error' };
    }
  },

  // ============ LOGOUT ============

  logout() {
    this.user = null;
    this.isLoggedIn = false;
    this.pendingEmail = null;
    Utils.storage.remove('user');
    Sound.play('click');
    window.location.reload();
  },

  // ============ GETTERS ============

  getUser() {
    return this.user;
  },

  getUserName() {
    if (!this.user) return 'Guest';
    return this.user.name || this.user.email?.split('@')[0] || 'User';
  },

  getUserEmail() {
    return this.user?.email || '';
  },

  getUserRole() {
    return this.user?.role || 'Staff';
  },

  getUserDepartment() {
    return this.user?.department || '';
  },

  getUserDesignation() {
    return this.user?.designation || '';
  },

  getInitials() {
    return Utils.getInitials(this.getUserName());
  },

  // ============ PERMISSIONS (Single Definition) ============

  isAdmin() {
    return this.user?.role === 'Admin' || this.user?.isAdmin === true;
  },

  isEngineer() {
    const roles = ['Engineer', 'Manager', 'Admin', 'Technician', 'Support'];
    return roles.includes(this.user?.role);
  },

  isManager() {
    return ['Manager', 'Admin'].includes(this.user?.role);
  },

  isStaff() {
    return this.user?.role === 'Staff' || this.user?.role === 'User';
  },

  hasAdminAccess() {
    return this.isAdmin();
  },

  canViewAllTickets() {
    const roles = ['Admin', 'Manager', 'Engineer', 'Technician', 'Support'];
    return roles.includes(this.user?.role) || this.user?.isAdmin === true;
  },

  canManageTickets() {
    return this.canViewAllTickets();
  }
};
