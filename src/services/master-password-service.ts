import CryptoJS from 'crypto-js';
import { PasswordEntry } from '../types/password';

export interface SecurityService {
  // Funcionalidades existentes de integridade
  validateDataIntegrity(data: PasswordEntry[]): boolean;
  detectTampering(data: PasswordEntry[]): boolean;
  verifyExtensionIsolation(): Promise<boolean>;
  generateDataHash(data: PasswordEntry[]): Promise<string>;
  verifyDataHash(data: PasswordEntry[], expectedHash: string): Promise<boolean>;
  
  // Novas funcionalidades de Master Password
  lockVault(): void;
  unlockVault(masterPassword: string): Promise<boolean>;
  isLocked(): boolean;
  setMasterPassword(password: string): Promise<void>;
  changeMasterPassword(currentPassword: string, newPassword: string): Promise<void>;
  hasMasterPassword(): Promise<boolean>;
  encryptData(data: string): string;
  decryptData(encryptedData: string): string | null;
  setAutoLockTimer(minutes: number): void;
  clearAutoLockTimer(): void;
  resetSecurity(): Promise<void>;
}

interface SecurityState {
  isLocked: boolean;
  masterPasswordHash: string | null;
  encryptionKey: string | null;
  autoLockTimer: NodeJS.Timeout | null;
  lastActivity: number;
}

class SecurityServiceImpl implements SecurityService {
  private readonly HASH_ALGORITHM = 'SHA-256';
  private readonly EXTENSION_ID = chrome.runtime.id;
  
  // Master Password properties
  private state: SecurityState = {
    isLocked: true,
    masterPasswordHash: null,
    encryptionKey: null,
    autoLockTimer: null,
    lastActivity: Date.now()
  };

  private readonly STORAGE_KEY = 'password_manager_security';
  private readonly SALT = 'password_manager_salt_2025';
  private readonly DEFAULT_AUTO_LOCK_MINUTES = 15;

  constructor() {
    this.loadSecurityState();
    this.setupActivityListener();
  }

  // ================= MASTER PASSWORD METHODS =================

  /**
   * Sets up a master password for the first time
   */
  async setMasterPassword(password: string): Promise<void> {
    if (!password || password.length < 8) {
      throw new Error('Master password must be at least 8 characters long');
    }

    // Generate hash of master password for verification
    const hash = CryptoJS.PBKDF2(password, this.SALT, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();

    // Generate encryption key derived from master password
    const encryptionKey = CryptoJS.PBKDF2(password + '_encryption', this.SALT, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();

    this.state.masterPasswordHash = hash;
    this.state.encryptionKey = encryptionKey;
    this.state.isLocked = false;
    this.state.lastActivity = Date.now();

    await this.saveSecurityState();
    this.setAutoLockTimer(this.DEFAULT_AUTO_LOCK_MINUTES);
  }

  async changeMasterPassword(currentPassword: string, newPassword: string): Promise<void> {
    // First verify the current password
    const isValidCurrent = await this.unlockVault(currentPassword);
    if (!isValidCurrent) {
      throw new Error('Current password is incorrect');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error('New master password must be at least 8 characters long');
    }

    // Get all encrypted passwords before changing the master password
    const passwordService = (await import('./password-service')).passwordService;
    const allPasswords = await passwordService.getAll();

    // Decrypt all passwords with current key
    const decryptedPasswords = allPasswords.map(password => ({
      ...password,
      password: this.decryptData(password.password) || password.password
    }));

    // Generate new hash and encryption key
    const newHash = CryptoJS.PBKDF2(newPassword, this.SALT, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();

    const newEncryptionKey = CryptoJS.PBKDF2(newPassword + '_encryption', this.SALT, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();

    // Update the encryption key
    const oldEncryptionKey = this.state.encryptionKey;
    this.state.encryptionKey = newEncryptionKey;

    // Re-encrypt all passwords with new key
    const reEncryptedPasswords = decryptedPasswords.map(password => ({
      ...password,
      password: this.encryptData(password.password)
    }));

    try {
      // Save re-encrypted passwords using the same key as password service
      await chrome.storage.local.set({ password_manager_passwords: reEncryptedPasswords });

      // Update master password hash
      this.state.masterPasswordHash = newHash;
      this.state.lastActivity = Date.now();

      await this.saveSecurityState();
    } catch (error) {
      // If saving fails, restore old encryption key
      this.state.encryptionKey = oldEncryptionKey;
      throw new Error('Failed to change master password. Please try again.');
    }
  }

  /**
   * Checks if a master password is already configured
   */
  async hasMasterPassword(): Promise<boolean> {
    await this.loadSecurityState();
    return this.state.masterPasswordHash !== null;
  }

  /**
   * Attempts to unlock the vault with the master password
   */
  async unlockVault(masterPassword: string): Promise<boolean> {
    if (!this.state.masterPasswordHash) {
      throw new Error('No master password set');
    }

    const inputHash = CryptoJS.PBKDF2(masterPassword, this.SALT, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();

    if (inputHash !== this.state.masterPasswordHash) {
      return false;
    }

    // Regenerate encryption key
    const encryptionKey = CryptoJS.PBKDF2(masterPassword + '_encryption', this.SALT, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();

    this.state.encryptionKey = encryptionKey;
    this.state.isLocked = false;
    this.state.lastActivity = Date.now();

    this.setAutoLockTimer(this.DEFAULT_AUTO_LOCK_MINUTES);
    return true;
  }

  /**
   * Locks the vault and clears the encryption key from memory
   */
  lockVault(): void {
    this.state.isLocked = true;
    this.state.encryptionKey = null;
    this.clearAutoLockTimer();
  }

  /**
   * Checks if the vault is locked
   */
  isLocked(): boolean {
    return this.state.isLocked;
  }

  /**
   * Encrypts data using the master key
   */
  encryptData(data: string): string {
    if (!this.state.encryptionKey) {
      throw new Error('Vault is locked - cannot encrypt data');
    }

    this.updateActivity();
    return CryptoJS.AES.encrypt(data, this.state.encryptionKey).toString();
  }

  /**
   * Decrypts data using the master key
   */
  decryptData(encryptedData: string): string | null {
    if (!this.state.encryptionKey) {
      throw new Error('Vault is locked - cannot decrypt data');
    }

    try {
      this.updateActivity();
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.state.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  /**
   * Sets up automatic lock timer
   */
  setAutoLockTimer(minutes: number): void {
    this.clearAutoLockTimer();
    
    const timeoutMs = minutes * 60 * 1000;
    this.state.autoLockTimer = setTimeout(() => {
      this.lockVault();
    }, timeoutMs);
  }

  /**
   * Clears the automatic lock timer
   */
  clearAutoLockTimer(): void {
    if (this.state.autoLockTimer) {
      clearTimeout(this.state.autoLockTimer);
      this.state.autoLockTimer = null;
    }
  }

  /**
   * Clears all security data (for complete reset)
   */
  async resetSecurity(): Promise<void> {
    this.lockVault();
    this.state.masterPasswordHash = null;
    
    // Clear all stored passwords and security data
    try {
      await chrome.storage.local.clear(); // This clears ALL extension data
      await this.saveSecurityState();
      
      // Also clear localStorage security state
      localStorage.removeItem(this.STORAGE_KEY);
      
      console.log('Security: All data has been cleared');
    } catch (error) {
      console.error('Security: Failed to clear all data:', error);
      throw new Error('Failed to reset security data');
    }
  }

  /**
   * Updates last activity timestamp and restarts timer
   */
  private updateActivity(): void {
    this.state.lastActivity = Date.now();
    if (!this.state.isLocked) {
      this.setAutoLockTimer(this.DEFAULT_AUTO_LOCK_MINUTES);
    }
  }

  /**
   * Sets up listener for user activity
   */
  private setupActivityListener(): void {
    // Listen for activity throughout the extension
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (!this.state.isLocked) {
          this.updateActivity();
        }
      }, true);
    });
  }

  /**
   * Loads security state from storage
   */
  private async loadSecurityState(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.state.masterPasswordHash = data.masterPasswordHash || null;
        this.state.isLocked = data.masterPasswordHash ? true : false; // Always starts locked if has master password
      }
    } catch (error) {
      console.error('Failed to load security state:', error);
    }
  }

  /**
   * Saves security state to storage
   */
  private async saveSecurityState(): Promise<void> {
    try {
      const dataToStore = {
        masterPasswordHash: this.state.masterPasswordHash,
        lastActivity: this.state.lastActivity
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save security state:', error);
    }
  }

  /**
   * Validates master password strength
   */
  static validateMasterPassword(password: string): { isValid: boolean; message: string } {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
    }

    return { isValid: true, message: 'Password is strong' };
  }

  // ================= EXISTING INTEGRITY METHODS =================

  /**
   * Validates data integrity by checking structure and types
   */
  validateDataIntegrity(data: PasswordEntry[]): boolean {
    if (!Array.isArray(data)) {
      console.warn('Security: Data is not an array');
      return false;
    }

    return data.every((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        console.warn(`Security: Entry ${index} is not an object`);
        return false;
      }

      const requiredFields = ['id', 'website', 'username', 'password', 'createdAt'];
      for (const field of requiredFields) {
        if (!(field in entry)) {
          console.warn(`Security: Entry ${index} missing field: ${field}`);
          return false;
        }
      }

      // Validação de tipos
      if (typeof entry.id !== 'string' || 
          typeof entry.website !== 'string' || 
          typeof entry.username !== 'string' || 
          typeof entry.password !== 'string') {
        console.warn(`Security: Entry ${index} has invalid field types`);
        return false;
      }

      // Date validation
      if (!entry.createdAt || isNaN(new Date(entry.createdAt).getTime())) {
        console.warn(`Security: Entry ${index} has invalid createdAt date`);
        return false;
      }

      return true;
    });
  }

  /**
   * Detects possible unauthorized modifications in data
   */
  detectTampering(data: PasswordEntry[]): boolean {
    // Check digital signatures or checksums if available
    // For now, focus on structure validation
    if (!this.validateDataIntegrity(data)) {
      return true; // Tampering detected
    }

    // Check for suspicious entries
    const suspiciousPatterns = [
      /script/i,
      /javascript/i,
      /<.*>/,
      /on\w+=/i
    ];

    for (const entry of data) {
      const textToCheck = `${entry.website} ${entry.username}`;
      if (suspiciousPatterns.some(pattern => pattern.test(textToCheck))) {
        console.warn('Security: Suspicious content detected in entry');
        return true;
      }
    }

    return false;
  }

  /**
   * Verifies if the extension is running in adequate isolation
   */
  async verifyExtensionIsolation(): Promise<boolean> {
    try {
      // Check if we only have access to our own data
      const extensionUrl = chrome.runtime.getURL('');
      if (!extensionUrl.startsWith(`chrome-extension://${this.EXTENSION_ID}`)) {
        console.warn('Security: Extension ID mismatch');
        return false;
      }

      // Check extension permissions
      const permissions = await chrome.permissions.getAll();
      const allowedPermissions = ['storage', 'sidePanel', 'activeTab'];
      
      for (const permission of permissions.permissions || []) {
        if (!allowedPermissions.includes(permission)) {
          console.warn(`Security: Unexpected permission: ${permission}`);
          return false;
        }
      }

      // Check if there are no suspicious origins
      if (permissions.origins && permissions.origins.length > 0) {
        console.warn('Security: Unexpected host permissions found');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Security: Failed to verify extension isolation:', error);
      return false;
    }
  }

  /**
   * Generates data hash for integrity verification
   */
  async generateDataHash(data: PasswordEntry[]): Promise<string> {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    
    try {
      const hashBuffer = await crypto.subtle.digest(this.HASH_ALGORITHM, dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback to simple hash if crypto.subtle is not available
      let hash = 0;
      const str = JSON.stringify(data);
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    }
  }

  /**
   * Verifies if the data hash matches the expected one
   */
  async verifyDataHash(data: PasswordEntry[], expectedHash: string): Promise<boolean> {
    const currentHash = await this.generateDataHash(data);
    return currentHash === expectedHash;
  }
}

export const securityService = new SecurityServiceImpl();
