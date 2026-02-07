/**
 * CHN IT Support System
 * Utilities Module
 * Version: 4.0.0 - Fixed spinner issue
 */

// ============ SOUND MODULE ============
const Sound = {
  enabled: true,
  volume: 0.5,

  init() {
    const saved = localStorage.getItem('chn_sound_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
    this.updateIcon();
  },

  play(type) {
    if (!this.enabled) return;
    const audio = document.getElementById('sound-' + type);
    if (audio) {
      audio.volume = this.volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('chn_sound_enabled', this.enabled);
    this.updateIcon();
    return this.enabled;
  },

  updateIcon() {
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = this.enabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
      }
    }
  }
};

// ============ UTILS MODULE ============
const Utils = {

  // API Call
  async api(action, params) {
    const url = CONFIG.API_URL;
    params = params || {};

    if (!url) {
      console.error('API URL not configured');
      return { success: false, message: 'API not configured' };
    }

    try {
      this.setSyncStatus('syncing');

      const urlObj = new URL(url);
      urlObj.searchParams.append('action', action);

      Object.entries(params).forEach(function(entry) {
        var key = entry[0];
        var value = entry[1];
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            urlObj.searchParams.append(key, JSON.stringify(value));
          } else {
            urlObj.searchParams.append(key, String(value));
          }
        }
      });

      const response = await fetch(urlObj.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      const result = await response.json();

      this.setSyncStatus(result.success ? 'synced' : 'error');

      return result;

    } catch (error) {
      console.error('API Error:', error);
      this.setSyncStatus('error');
      return { success: false, message: 'Connection error. Please try again.' };
    }
  },

  // Sync Status Indicator
  setSyncStatus(status) {
    const el = document.getElementById('sync-indicator');
    if (!el) return;

    const icon = el.querySelector('i');
    const text = el.querySelector('span');

    el.className = 'sync-indicator';

    if (status === 'syncing') {
      el.classList.add('syncing');
      if (icon) icon.className = 'fas fa-sync-alt fa-spin';
      if (text) text.textContent = 'Syncing...';
    } else if (status === 'synced') {
      if (icon) icon.className = 'fas fa-check-circle';
      if (text) text.textContent = 'Synced';
    } else {
      el.classList.add('error');
      if (icon) icon.className = 'fas fa-exclamation-circle';
      if (text) text.textContent = 'Error';
    }
  },

  // Toast Notifications
  showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;

    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML =
      '<i class="fas ' + (icons[type] || icons.info) + '"></i>' +
      '<span>' + this.escapeHtml(message) + '</span>' +
      '<button class="toast-close">&times;</button>';

    container.appendChild(toast);

    // Sound
    if (type === 'success') Sound.play('success');
    else if (type === 'error') Sound.play('error');
    else Sound.play('notification');

    // Show with animation
    setTimeout(function() { toast.classList.add('show'); }, 10);

    // Close handler
    var self = this;
    toast.querySelector('.toast-close').onclick = function() {
      self.removeToast(toast);
    };

    // Auto remove
    if (duration > 0) {
      setTimeout(function() { self.removeToast(toast); }, duration);
    }
  },

  removeToast(toast) {
    if (!toast) return;
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode) toast.remove();
    }, 400);
  },

  // Validation
  isValidEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },

  // Date Formatting
  formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return '-'; }
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (e) { return '-'; }
  },

  timeAgo(dateStr) {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';

      const seconds = Math.floor((new Date() - date) / 1000);

      if (seconds < 60) return 'Just now';
      if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
      if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
      if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';

      return this.formatDate(dateStr);
    } catch (e) { return '-'; }
  },

  // String Helpers
  escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  truncate(str, length) {
    length = length || 50;
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(' ').filter(function(p) { return p; });
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },

  // Status/Priority Helpers
  statusToClass(status) {
    if (!status) return 'open';
    return status.toLowerCase().replace(/\s+/g, '-');
  },

  priorityToClass(priority) {
    return (priority || 'medium').toLowerCase();
  },

  // Button Loading State
  setButtonLoading(btn, loading, text) {
    if (!btn) return;
    text = text || 'Loading...';

    if (loading) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + text;
    } else {
      btn.disabled = false;
      if (btn.dataset.originalHtml) {
        btn.innerHTML = btn.dataset.originalHtml;
      }
    }
  },

  // Show/Hide
  show(el) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (el) el.classList.remove('hidden');
  },

  hide(el) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (el) el.classList.add('hidden');
  },

  // Local Storage
  storage: {
    set(key, value) {
      try {
        localStorage.setItem('chn_' + key, JSON.stringify(value));
      } catch (e) {
        console.error('Storage error:', e);
      }
    },

    get(key, defaultValue) {
      try {
        var item = localStorage.getItem('chn_' + key);
        return item ? JSON.parse(item) : (defaultValue || null);
      } catch (e) {
        return defaultValue || null;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem('chn_' + key);
      } catch (e) {}
    }
  },

  // CSV Export
  exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      this.showToast('No data to export', 'warning');
      return;
    }

    var headers = Object.keys(data[0]);
    var csv = headers.join(',') + '\n';

    data.forEach(function(row) {
      var values = headers.map(function(h) {
        var val = row[h] || '';
        return '"' + String(val).replace(/"/g, '""') + '"';
      });
      csv += values.join(',') + '\n';
    });

    var blob = new Blob([csv], { type: 'text/csv' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename + '_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();

    this.showToast('Export successful!', 'success');
  }
};

// Initialize Sound on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  Sound.init();
});