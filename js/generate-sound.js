/**
 * Sound Generator using Web Audio API
 * Run this once to create base64 audio or download files
 */

const SoundGenerator = {
  audioContext: null,
  
  init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  },
  
  // Generate a simple beep/tone
  generateTone(frequency, duration, type = 'sine', volume = 0.5) {
    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  },
  
  // Generate specific sounds
  sounds: {
    click: () => {
      SoundGenerator.generateTone(800, 0.05, 'sine', 0.3);
    },
    
    pop: () => {
      SoundGenerator.generateTone(600, 0.08, 'sine', 0.4);
      setTimeout(() => SoundGenerator.generateTone(900, 0.05, 'sine', 0.2), 30);
    },
    
    success: () => {
      SoundGenerator.generateTone(523, 0.1, 'sine', 0.4);
      setTimeout(() => SoundGenerator.generateTone(659, 0.1, 'sine', 0.4), 100);
      setTimeout(() => SoundGenerator.generateTone(784, 0.15, 'sine', 0.4), 200);
    },
    
    error: () => {
      SoundGenerator.generateTone(200, 0.15, 'sawtooth', 0.3);
      setTimeout(() => SoundGenerator.generateTone(150, 0.2, 'sawtooth', 0.3), 150);
    },
    
    warning: () => {
      SoundGenerator.generateTone(440, 0.1, 'triangle', 0.4);
      setTimeout(() => SoundGenerator.generateTone(440, 0.1, 'triangle', 0.4), 200);
    },
    
    notification: () => {
      SoundGenerator.generateTone(880, 0.1, 'sine', 0.3);
      setTimeout(() => SoundGenerator.generateTone(1100, 0.15, 'sine', 0.3), 100);
    },
    
    toggle: () => {
      SoundGenerator.generateTone(700, 0.05, 'sine', 0.25);
    },
    
    swoosh: () => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          SoundGenerator.generateTone(300 + i * 50, 0.03, 'sine', 0.1);
        }, i * 15);
      }
    },
    
    ding: () => {
      SoundGenerator.generateTone(1200, 0.3, 'sine', 0.4);
    },
    
    star: () => {
      SoundGenerator.generateTone(1000, 0.08, 'sine', 0.3);
      setTimeout(() => SoundGenerator.generateTone(1200, 0.1, 'sine', 0.25), 50);
    },
    
    complete: () => {
      SoundGenerator.generateTone(523, 0.1, 'sine', 0.4);
      setTimeout(() => SoundGenerator.generateTone(659, 0.1, 'sine', 0.4), 80);
      setTimeout(() => SoundGenerator.generateTone(784, 0.1, 'sine', 0.4), 160);
      setTimeout(() => SoundGenerator.generateTone(1047, 0.2, 'sine', 0.4), 240);
    },
    
    levelUp: () => {
      const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
      notes.forEach((freq, i) => {
        setTimeout(() => SoundGenerator.generateTone(freq, 0.08, 'sine', 0.3), i * 50);
      });
    }
  },
  
  playSound(name) {
    if (this.sounds[name]) {
      this.sounds[name]();
    }
  }
};

// Test sounds
document.addEventListener('DOMContentLoaded', () => {
  SoundGenerator.init();
  
  // Add test buttons (optional)
  const testDiv = document.createElement('div');
  testDiv.id = 'sound-test';
  testDiv.style.cssText = 'position:fixed;bottom:100px;right:20px;z-index:99999;background:#fff;padding:15px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.2);display:none;';
  testDiv.innerHTML = `
    <h4 style="margin-bottom:10px;">🔊 Test Sounds</h4>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">
      ${Object.keys(SoundGenerator.sounds).map(name => 
        `<button onclick="SoundGenerator.playSound('${name}')" style="padding:8px;border:1px solid #ddd;border-radius:5px;cursor:pointer;">${name}</button>`
      ).join('')}
    </div>
    <button onclick="this.parentElement.style.display='none'" style="margin-top:10px;width:100%;padding:8px;background:#f1f5f9;border:none;border-radius:5px;cursor:pointer;">Close</button>
  `;
  document.body.appendChild(testDiv);
  
  // Triple-click to show test panel
  let clickCount = 0;
  document.addEventListener('click', () => {
    clickCount++;
    setTimeout(() => clickCount = 0, 500);
    if (clickCount === 3) {
      testDiv.style.display = testDiv.style.display === 'none' ? 'block' : 'none';
    }
  });
});

window.SoundGenerator = SoundGenerator;