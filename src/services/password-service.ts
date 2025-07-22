import { PasswordEntry, PasswordDatabase } from '../types/password';
import { securityService } from './master-password-service';

class ChromeStoragePasswordService implements PasswordDatabase {
  private storageKey = 'password_manager_passwords';

  private async saveToStorage(passwords: PasswordEntry[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.storageKey]: passwords });
    } catch (error) {
      console.error('Failed to save to chrome storage:', error);
      throw new Error('Failed to save passwords');
    }
  }

  private async loadFromStorage(): Promise<PasswordEntry[]> {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const passwords = result[this.storageKey] || [];
      console.log('PasswordService: Raw data from storage:', passwords);
      
      const processed = passwords.map((entry: any) => {
        // Validate and convert dates
        let createdAt: Date;
        let updatedAt: Date;

        try {
          createdAt = entry.createdAt ? new Date(entry.createdAt) : new Date();
          if (isNaN(createdAt.getTime())) {
            console.warn('PasswordService: Invalid createdAt date, using current date:', entry.createdAt);
            createdAt = new Date();
          }
        } catch (error) {
          console.warn('PasswordService: Error parsing createdAt, using current date:', error);
          createdAt = new Date();
        }

        try {
          updatedAt = entry.updatedAt ? new Date(entry.updatedAt) : new Date();
          if (isNaN(updatedAt.getTime())) {
            console.warn('PasswordService: Invalid updatedAt date, using current date:', entry.updatedAt);
            updatedAt = new Date();
          }
        } catch (error) {
          console.warn('PasswordService: Error parsing updatedAt, using current date:', error);
          updatedAt = new Date();
        }

        const processedEntry = {
          ...entry,
          createdAt,
          updatedAt
        };
        console.log('PasswordService: Processing entry:', entry, '-> Processed:', processedEntry);
        return processedEntry;
      });
      
      console.log('PasswordService: Final processed passwords:', processed);
      return processed;
    } catch (error) {
      console.error('Failed to load from chrome storage:', error);
      return [];
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Encripta dados sensíveis se o master password estiver configurado
   */
  private async encryptSensitiveData(entry: PasswordEntry): Promise<PasswordEntry> {
    if (!(await securityService.isLocked())) {
      try {
        return {
          ...entry,
          password: securityService.encryptData(entry.password),
          username: securityService.encryptData(entry.username)
        };
      } catch (error) {
        console.warn('Failed to encrypt data, storing unencrypted:', error);
      }
    }
    return entry;
  }

  /**
   * Decripta dados sensíveis se estiverem encriptados
   */
  private async decryptSensitiveData(entry: PasswordEntry): Promise<PasswordEntry> {
    if (!(await securityService.isLocked())) {
      try {
        const decryptedPassword = securityService.decryptData(entry.password);
        const decryptedUsername = securityService.decryptData(entry.username);
        
        return {
          ...entry,
          password: decryptedPassword || entry.password,
          username: decryptedUsername || entry.username
        };
      } catch (error) {
        console.warn('Failed to decrypt data, returning as is:', error);
      }
    }
    return entry;
  }

  async getAll(): Promise<PasswordEntry[]> {
    console.log('PasswordService: Loading passwords from storage...');
    const passwords = await this.loadFromStorage();
    console.log('PasswordService: Raw passwords loaded:', passwords);
    const decryptedPasswords = await Promise.all(passwords.map(entry => this.decryptSensitiveData(entry)));
    console.log('PasswordService: Decrypted passwords:', decryptedPasswords);
    return decryptedPasswords;
  }

  async getById(id: string): Promise<PasswordEntry | undefined> {
    const passwords = await this.loadFromStorage();
    const entry = passwords.find(p => p.id === id);
    return entry ? await this.decryptSensitiveData(entry) : undefined;
  }

  async add(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const passwords = await this.loadFromStorage();
    const id = this.generateId();
    const now = new Date();
    
    const newEntry: PasswordEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Encripta dados sensíveis antes de salvar
    const encryptedEntry = await this.encryptSensitiveData(newEntry);
    
    passwords.push(encryptedEntry);
    await this.saveToStorage(passwords);
    
    return id;
  }

  async update(id: string, entry: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>): Promise<void> {
    const passwords = await this.loadFromStorage();
    const index = passwords.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Entry not found');
    }

    const updatedEntry: PasswordEntry = {
      ...passwords[index],
      ...entry,
      id,
      updatedAt: new Date()
    };

    // Encripta dados sensíveis antes de salvar
    const encryptedEntry = await this.encryptSensitiveData(updatedEntry);
    
    passwords[index] = encryptedEntry;
    await this.saveToStorage(passwords);
  }

  async delete(id: string): Promise<void> {
    const passwords = await this.loadFromStorage();
    const filteredPasswords = passwords.filter(p => p.id !== id);
    await this.saveToStorage(filteredPasswords);
  }

  /**
   * Clear all passwords (utility method)
   */
  async clearAll(): Promise<void> {
    await chrome.storage.local.remove(this.storageKey);
  }
}

export const passwordService = new ChromeStoragePasswordService();
