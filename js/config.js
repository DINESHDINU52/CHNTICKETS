/**
 * CHN IT Support System
 * Configuration File
 * Version: 4.0.0 - With TOTP Config
 */

const CONFIG = {
  // ============ API ============
  API_URL: 'https://script.google.com/macros/s/AKfycbx8LzzPYgyERRV_HUxfZb8hf5CugDoNNwqSXD76vZo9pCqHxgcgtf-RFq7ik8spMNdwjQ/exec',

  // ============ APP INFO ============
  APP_NAME: 'CHN IT Support',
  APP_VERSION: '4.0.0',
  APP_TAGLINE: 'IT Support Portal',

  // ============ COMPANY ============
  COMPANY: {
    name: 'CHN TECHNOLOGIES',
    website: 'https://chnindia.com',
    supportEmail: 'itsupport@chnindia.com'
  },

  // ============ TOTP SETTINGS ============
  TOTP: {
    enabled: true,
    issuer: 'CHN IT Support',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },

  // ============ REGISTRATION ============
  REGISTRATION: {
    requireApproval: true,
    useTOTP: true,
    notifyAdminViaTelegram: true,
    notifyAdminViaEmail: true,
    adminApprovalEmail: 'itsupport@chnindia.com',
    welcomeEmailEnabled: true
  },

  // ============ QUOTES ============
  QUOTES: [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Technology is best when it brings people together.", author: "Matt Mullenweg" },
    { text: "The advance of technology is based on making it fit in so that you don't really even notice it.", author: "Bill Gates" },
    { text: "It's not a faith in technology. It's faith in people.", author: "Steve Jobs" },
    { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
    { text: "Coming together is a beginning, staying together is progress, and working together is success.", author: "Henry Ford" },
    { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" }
  ],

  // ============ TELEGRAM ============
  TELEGRAM: {
    enabled: true,
    notifyAll: true,
    notifyCritical: true,
    notifyNewRegistration: true
  },

  // ============ EMAIL ============
  EMAIL: {
    enabled: true,
    autoAcknowledge: true,
    fromName: 'CHN IT Support',
    replyTo: 'itsupport@chnindia.com',
    ccAdmin: true
  },

  // ============ DEPARTMENTS ============
  DEPARTMENTS: [
    { id: 'IT', name: 'IT Department', icon: 'fa-laptop-code' },
    { id: 'HR', name: 'Human Resources', icon: 'fa-users' },
    { id: 'Finance', name: 'Finance', icon: 'fa-dollar-sign' },
    { id: 'Operations', name: 'Operations', icon: 'fa-cogs' },
    { id: 'Sales', name: 'Sales', icon: 'fa-chart-line' },
    { id: 'Marketing', name: 'Marketing', icon: 'fa-bullhorn' },
    { id: 'Admin', name: 'Administration', icon: 'fa-building' },
    { id: 'Other', name: 'Other', icon: 'fa-ellipsis-h' }
  ],

  // ============ CATEGORIES ============
  CATEGORIES: [
    {
      id: 'Hardware', name: 'Hardware Issue', icon: 'fa-desktop',
      subcategories: [
        'Laptop Not Working', 'Desktop Issue', 'Monitor Problem',
        'Keyboard/Mouse Issue', 'Docking Station', 'Webcam/Headset',
        'New Hardware Request', 'Hardware Upgrade', 'Other Hardware'
      ]
    },
    {
      id: 'Software', name: 'Software Issue', icon: 'fa-window-restore',
      subcategories: [
        'Software Installation', 'Software Not Working', 'License Activation',
        'Software Update', 'Application Error', 'MS Office Issue',
        'New Software Request', 'Other Software'
      ]
    },
    {
      id: 'Network', name: 'Network/Internet', icon: 'fa-wifi',
      subcategories: [
        'No Internet', 'Slow Internet', 'WiFi Not Connecting',
        'VPN Issue', 'Network Drive Access', 'IP Address Issue', 'Other Network'
      ]
    },
    {
      id: 'Email', name: 'Email/Outlook', icon: 'fa-envelope',
      subcategories: [
        'Cannot Send Email', 'Cannot Receive Email', 'Outlook Not Opening',
        'Email Configuration', 'Calendar Issue', 'Teams Integration',
        'Distribution List', 'Other Email'
      ]
    },
    {
      id: 'Security', name: 'Security/Access', icon: 'fa-shield-alt',
      subcategories: [
        'Password Reset', 'Account Locked', 'New User Account',
        'Folder Access', 'Software Access', 'Virus/Malware',
        'Suspicious Activity', 'Other Security'
      ]
    },
    {
      id: 'Other', name: 'Other IT Issue', icon: 'fa-question-circle',
      subcategories: ['General Query', 'Training Request', 'System Access', 'Other']
    }
  ],

  // ============ PRIORITIES ============
  PRIORITIES: [
    { id: 'Low', name: 'Low', icon: '🟢', color: '#22c55e', slaHours: 48 },
    { id: 'Medium', name: 'Medium', icon: '🟡', color: '#f59e0b', slaHours: 24 },
    { id: 'High', name: 'High', icon: '🟠', color: '#f97316', slaHours: 8 },
    { id: 'Critical', name: 'Critical', icon: '🔴', color: '#ef4444', slaHours: 2 }
  ],

  // ============ STATUSES ============
  STATUSES: [
    { id: 'Open', name: 'Open', icon: 'fa-folder-open', color: '#22c55e' },
    { id: 'In Progress', name: 'In Progress', icon: 'fa-spinner', color: '#f59e0b' },
    { id: 'Pending', name: 'Pending Info', icon: 'fa-pause-circle', color: '#8b5cf6' },
    { id: 'Resolved', name: 'Resolved', icon: 'fa-check-circle', color: '#06b6d4' },
    { id: 'Closed', name: 'Closed', icon: 'fa-times-circle', color: '#6b7280' }
  ],

  // ============ ROLES ============
  ROLES: [
    { id: 'Pending', name: 'Pending Approval', permissions: [] },
    { id: 'User', name: 'User', permissions: ['create', 'view_own', 'feedback'] },
    { id: 'Staff', name: 'Staff', permissions: ['create', 'view_own', 'feedback'] },
    { id: 'Engineer', name: 'Engineer', permissions: ['create', 'view_all', 'update', 'assign_self', 'feedback'] },
    { id: 'Manager', name: 'Manager', permissions: ['create', 'view_all', 'update', 'assign', 'reports', 'feedback'] },
    { id: 'Admin', name: 'Admin', permissions: ['all'] }
  ],

  // ============ SETTINGS ============
  AUTO_REFRESH: 30000,
  ITEMS_PER_PAGE: 20,
  TIMEZONE: 'Asia/Kolkata',
  DEBUG: false
};

Object.freeze(CONFIG);