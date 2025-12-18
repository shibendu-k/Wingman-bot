import crypto from 'crypto';

/**
 * Crypto Manager - Handles AES-256 encryption/decryption
 */
class CryptoManager {
  constructor() {
    this.encryptionKey = null;
    this.algorithm = 'aes-256-cbc';
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  deriveKey(password, userId = 'default') {
    // Create a user-specific salt using PBKDF2
    const salt = crypto.pbkdf2Sync(
      userId,
      'wingman-global-pepper-v2',
      10000,
      32,
      'sha256'
    );
    
    // Derive the actual encryption key
    const key = crypto.pbkdf2Sync(
      password,
      salt,
      100000,
      32,
      'sha256'
    );
    
    this.encryptionKey = key;
    return key;
  }

  /**
   * Encrypt data with AES-256-CBC
   */
  encrypt(data) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set. Call deriveKey() first.');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt data with AES-256-CBC
   */
  decrypt(encryptedData) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set. Call deriveKey() first.');
    }

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed. Wrong password or corrupted data.');
    }
  }

  /**
   * Test if password is correct by attempting decryption
   */
  testPassword(password, encryptedData, userId = 'default') {
    try {
      this.deriveKey(password, userId);
      this.decrypt(encryptedData);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear encryption key from memory
   */
  clearKey() {
    if (this.encryptionKey) {
      this.encryptionKey.fill(0);
      this.encryptionKey = null;
    }
  }

  /**
   * Check if system is unlocked (key is set)
   */
  isUnlocked() {
    return this.encryptionKey !== null;
  }
}

// Export singleton instance
const cryptoManager = new CryptoManager();
export default cryptoManager;
