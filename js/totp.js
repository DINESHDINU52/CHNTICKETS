/**
 * CHN IT Support System
 * TOTP Module - Client Side
 * Version: 4.0.0
 * 
 * Generates TOTP secrets and QR codes locally
 * No backend dependency for setup
 */

const TOTP = {

  // Base32 alphabet
  BASE32: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',

  /**
   * Generate a random Base32 secret (20 bytes = 32 chars)
   */
  generateSecret(length) {
    length = length || 32;
    var result = '';
    var array = new Uint8Array(length);
    
    // Use crypto API if available, otherwise Math.random
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      for (var i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    for (var j = 0; j < length; j++) {
      result += this.BASE32[array[j] % 32];
    }
    
    return result;
  },

  /**
   * Build otpauth:// URI
   */
  buildOTPAuthURI(secret, email, issuer) {
    issuer = issuer || 'CHN IT Support';
    email = email || 'admin';
    
    var uri = 'otpauth://totp/' + 
              encodeURIComponent(issuer) + ':' + 
              encodeURIComponent(email) + 
              '?secret=' + secret + 
              '&issuer=' + encodeURIComponent(issuer) + 
              '&algorithm=SHA256' +
              '&digits=6' +
              '&period=30';
    
    return uri;
  },

  /**
   * Generate QR Code as HTML using qrcode-generator library
   */
  generateQRCode(text, size) {
    size = size || 6;
    
    try {
      // Using qrcode-generator library
      if (typeof qrcode !== 'undefined') {
        var qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        return qr.createImgTag(size, 0);
      }
    } catch (e) {
      console.error('QR generation error:', e);
    }
    
    // Fallback: Use external API
    return '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + 
           encodeURIComponent(text) + 
           '" alt="QR Code" style="width:200px;height:200px;" crossorigin="anonymous">';
  },

  /**
   * Generate QR code using external API (backup)
   */
  getQRImageURL(text, size) {
    size = size || 200;
    return 'https://api.qrserver.com/v1/create-qr-code/?size=' + 
           size + 'x' + size + 
           '&data=' + encodeURIComponent(text) +
           '&format=svg';
  },

  /**
   * Format secret for display (groups of 4)
   */
  formatSecret(secret) {
    if (!secret) return '';
    return secret.match(/.{1,4}/g).join(' ');
  },

  /**
   * Full setup: generate secret + QR code HTML
   */
  setup(email) {
    var secret = this.generateSecret(32);
    var uri = this.buildOTPAuthURI(secret, email);
    var qrHtml = this.generateQRCode(uri, 5);
    var qrImageUrl = this.getQRImageURL(uri, 250);
    
    return {
      secret: secret,
      uri: uri,
      qrHtml: qrHtml,
      qrImageUrl: qrImageUrl,
      formattedSecret: this.formatSecret(secret)
    };
  }
};