/**
 * CHN IT Support System
 * PWA Manager
 * Version: 4.0.0
 */

const PWA = {
  deferredPrompt: null,
  isInstalled: false,
  isStandalone: false,
  swRegistration: null,
  
  // Initialize PWA
  init() {
    console.log('📱 PWA: Initializing...');
    
    // Check if already installed
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
    
    if (this.isStandalone) {
      console.log('📱 PWA: Running in standalone mode');
      document.body.classList.add('pwa-standalone');
    }
    
    // Register service worker
    this.registerServiceWorker();
    
    // Listen for install prompt
    this.listenForInstallPrompt();
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA: App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      Utils.showToast('App installed successfully! 🎉', 'success');
    });
    
    // Handle online/offline status
    this.setupNetworkListeners();
    
    // Check for updates
    this.checkForUpdates();
  },
  
  // Register Service Worker
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('📱 PWA: Service Worker not supported');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      this.swRegistration = registration;
      console.log('✅ PWA: Service Worker registered', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 PWA: New service worker installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available
            this.showUpdateNotification();
          }
        });
      });
      
    } catch (error) {
      console.error('❌ PWA: Service Worker registration failed:', error);
    }
  },
  
  // Listen for beforeinstallprompt event
  listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA: Install prompt available');
      
      // Prevent default mini-infobar
      e.preventDefault();
      
      // Store the event for later
      this.deferredPrompt = e;
      
      // Show custom install button
      this.showInstallButton();
    });
  },
  
  // Show install button
  showInstallButton() {
    // Check if button already exists
    if (document.getElementById('pwa-install-btn')) return;
    
    // Create install button in header
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      const btn = document.createElement('button');
      btn.id = 'pwa-install-btn';
      btn.className = 'icon-btn pwa-install-btn';
      btn.title = 'Install App';
      btn.innerHTML = '<i class="fas fa-download"></i>';
      btn.onclick = () => this.promptInstall();
      
      // Insert before sync indicator
      const syncIndicator = document.getElementById('sync-indicator');
      if (syncIndicator) {
        headerActions.insertBefore(btn, syncIndicator);
      } else {
        headerActions.prepend(btn);
      }
      
      // Add animation
      setTimeout(() => btn.classList.add('pulse'), 100);
    }
    
    // Also show in login screen
    const loginCard = document.getElementById('login-card');
    if (loginCard && !document.getElementById('pwa-install-login-btn')) {
      const btn = document.createElement('button');
      btn.id = 'pwa-install-login-btn';
      btn.className = 'btn-secondary pwa-install-login-btn';
      btn.innerHTML = '<i class="fas fa-mobile-alt"></i> Install App';
      btn.style.cssText = 'margin-top: 15px; width: 100%;';
      btn.onclick = () => this.promptInstall();
      
      const footer = loginCard.querySelector('.chn-footer');
      if (footer) {
        loginCard.insertBefore(btn, footer);
      }
    }
  },
  
  // Hide install button
  hideInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
    
    const loginBtn = document.getElementById('pwa-install-login-btn');
    if (loginBtn) loginBtn.remove();
  },
  
  // Prompt to install
  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log('📱 PWA: No install prompt available');
      
      // Show manual install instructions
      this.showManualInstallInstructions();
      return;
    }
    
    console.log('📱 PWA: Showing install prompt');
    
    // Show the prompt
    this.deferredPrompt.prompt();
    
    // Wait for user response
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('📱 PWA: User choice:', outcome);
    
    if (outcome === 'accepted') {
      Utils.showToast('Installing app...', 'success');
      Sound.play('success');
    }
    
    // Clear the prompt
    this.deferredPrompt = null;
    this.hideInstallButton();
  },
  
  // Show manual install instructions
  showManualInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMac = /Macintosh/.test(navigator.userAgent);
    const isWindows = /Windows/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = `
        <div style="text-align:left;">
          <h3 style="margin-bottom:15px;">📱 Install on iPhone/iPad</h3>
          <ol style="padding-left:20px;line-height:2;">
            <li>Tap the <strong>Share</strong> button <i class="fas fa-share-square"></i> in Safari</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> in the top right</li>
          </ol>
        </div>
      `;
    } else if (isAndroid) {
      instructions = `
        <div style="text-align:left;">
          <h3 style="margin-bottom:15px;">📱 Install on Android</h3>
          <ol style="padding-left:20px;line-height:2;">
            <li>Tap the <strong>Menu</strong> button <i class="fas fa-ellipsis-v"></i> in Chrome</li>
            <li>Tap <strong>"Add to Home screen"</strong></li>
            <li>Tap <strong>"Add"</strong></li>
          </ol>
        </div>
      `;
    } else {
      instructions = `
        <div style="text-align:left;">
          <h3 style="margin-bottom:15px;">💻 Install on Desktop</h3>
          <ol style="padding-left:20px;line-height:2;">
            <li>Click the <strong>install icon</strong> in the address bar</li>
            <li>Or press <strong>Ctrl+Shift+A</strong> (Windows) / <strong>Cmd+Shift+A</strong> (Mac)</li>
            <li>Click <strong>"Install"</strong></li>
          </ol>
        </div>
      `;
    }
    
    // Show in modal
    const modal = document.getElementById('ticket-modal');
    const body = document.getElementById('modal-body');
    const footer = document.getElementById('modal-footer');
    const title = document.getElementById('modal-ticket-id');
    const badge = document.getElementById('modal-status-badge');
    
    if (modal && body) {
      title.innerHTML = '<i class="fas fa-download"></i> Install App';
      badge.style.display = 'none';
      body.innerHTML = `
        <div style="padding:20px;">
          ${instructions}
          <div style="margin-top:25px;padding:15px;background:rgba(99,102,241,0.1);border-radius:10px;border-left:4px solid #6366f1;">
            <strong style="color:#6366f1;">Benefits of installing:</strong>
            <ul style="margin-top:10px;padding-left:20px;color:#64748b;">
              <li>Works offline</li>
              <li>Faster loading</li>
              <li>Easy access from home screen</li>
              <li>Push notifications (coming soon)</li>
            </ul>
          </div>
        </div>
      `;
      footer.innerHTML = '<button class="btn-secondary" onclick="closeModal(\'ticket-modal\')">Got it</button>';
      modal.classList.remove('hidden');
    }
  },
  
  // Setup network listeners
  setupNetworkListeners() {
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        document.body.classList.remove('is-offline');
        document.body.classList.add('is-online');
        console.log('🌐 Network: Online');
        
        // Sync pending data
        this.syncPendingData();
        
      } else {
        document.body.classList.add('is-offline');
        document.body.classList.remove('is-online');
        console.log('📴 Network: Offline');
        Utils.showToast('You are offline. Some features may be limited.', 'warning');
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
  },
  
  // Show update notification
  showUpdateNotification() {
    const toast = document.createElement('div');
    toast.className = 'pwa-update-toast';
    toast.innerHTML = `
      <div class="pwa-update-content">
        <i class="fas fa-sync-alt"></i>
        <div>
          <strong>Update Available</strong>
          <p>A new version is ready to install</p>
        </div>
        <button onclick="PWA.applyUpdate()">Update</button>
        <button onclick="this.parentElement.parentElement.remove()" class="dismiss">Later</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
  },
  
  // Apply update
  applyUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  },
  
  // Check for updates
  async checkForUpdates() {
    if (!this.swRegistration) return;
    
    try {
      await this.swRegistration.update();
    } catch (error) {
      console.log('Update check failed:', error);
    }
  },
  
  // Sync pending data when back online
  async syncPendingData() {
    // Check for pending tickets in localStorage
    const pendingTickets = Utils.storage.get('pendingTickets') || [];
    
    if (pendingTickets.length > 0) {
      Utils.showToast(`Syncing ${pendingTickets.length} pending tickets...`, 'info');
      
      for (const ticket of pendingTickets) {
        try {
          await Tickets.create(ticket);
        } catch (error) {
          console.error('Failed to sync ticket:', error);
        }
      }
      
      Utils.storage.remove('pendingTickets');
      Utils.showToast('All tickets synced!', 'success');
    }
  },
  
  // Get SW version
  async getVersion() {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve('Unknown');
        return;
      }
      
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || 'Unknown');
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    });
  },
  
  // Clear all caches
  async clearCache() {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
      Utils.showToast('Cache cleared!', 'success');
    }
  }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Slight delay to ensure other scripts are loaded
  setTimeout(() => PWA.init(), 500);
});

// Export
window.PWA = PWA;