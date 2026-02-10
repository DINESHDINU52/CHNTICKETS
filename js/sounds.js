/**
 * CHN IT Support System
 * Enhanced Sound System
 * Version: 2.0.0 - Multiple Sound Types
 */

const Sound = {
  enabled: true,
  sounds: {},
  
  // Initialize
  init() {
    // Load saved preference
    this.enabled = localStorage.getItem('chn_sound_enabled') !== 'false';
    
    // Cache all audio elements
    this.sounds = {
      click: document.getElementById('sound-click'),
      success: document.getElementById('sound-success'),
      error: document.getElementById('sound-error'),
      notification: document.getElementById('sound-notification')
    };
    
    // Update icon
    this.updateIcon();
    
    console.log('🔊 Sound system initialized');
  },
  
  // Play specific sound
  play(type = 'click') {
    if (!this.enabled) return;
    
    const audio = this.sounds[type];
    if (!audio) {
      console.warn('Sound not found:', type);
      return;
    }
    
    try {
      audio.currentTime = 0;
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      console.error('Sound play error:', e);
    }
  },
  
  // Specific sound methods
  click() { this.play('click'); },
  success() { this.play('success'); },
  error() { this.play('error'); },
  notify() { this.play('notification'); },
  
  // Toggle sound on/off
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('chn_sound_enabled', this.enabled);
    this.updateIcon();
    
    if (this.enabled) {
      this.play('click');
    }
    
    return this.enabled;
  },
  
  // Update sound icon
  updateIcon() {
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = this.enabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
      }
      btn.title = this.enabled ? 'Sound On' : 'Sound Off';
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Sound.init();
});

// Export
window.Sound = Sound;