import { BackupService, BackupData, BackupSettings } from '../types/backup';
import { PasswordEntry } from '../types/password';
import { passwordService } from './password-service';
import { encryptionService } from './encryption-service';

class BackupPasswordService implements BackupService {
  private readonly settingsKey = 'backup_settings';
  private readonly backupsKey = 'auto_backups';
  private backupTimer: number | null = null;

  private defaultSettings: BackupSettings = {
    autoBackupEnabled: false,
    backupInterval: 60, // 1 hour
    maxBackups: 10,
    encryptionEnabled: true,
    lastBackupDate: undefined
  };

  async getSettings(): Promise<BackupSettings> {
    try {
      const result = await chrome.storage.local.get(this.settingsKey);
      return { ...this.defaultSettings, ...result[this.settingsKey] };
    } catch (error) {
      console.error('Failed to load backup settings:', error);
      return this.defaultSettings;
    }
  }

  async updateSettings(settings: Partial<BackupSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await chrome.storage.local.set({ [this.settingsKey]: newSettings });
      
      // Restart auto backup if settings changed
      if (settings.autoBackupEnabled !== undefined || settings.backupInterval !== undefined) {
        this.startAutoBackup();
      }
    } catch (error) {
      console.error('Failed to update backup settings:', error);
      throw new Error('Failed to update backup settings');
    }
  }

  async exportData(encryptionPassword?: string): Promise<string> {
    try {
      const passwords = await passwordService.getAll();
      const settings = await this.getSettings();
      
      const backupData: BackupData = {
        passwords: passwords.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        })),
        exportDate: new Date().toISOString(),
        version: '1.0',
        encrypted: settings.encryptionEnabled && !!encryptionPassword
      };

      let dataStr = JSON.stringify(backupData, null, 2);

      // Encrypt if enabled and password provided
      if (settings.encryptionEnabled && encryptionPassword) {
        dataStr = await encryptionService.encrypt(dataStr, encryptionPassword);
      }

      return dataStr;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export backup data');
    }
  }

  async importData(data: string, decryptionPassword?: string): Promise<void> {
    try {
      let parsedData: BackupData;

      // Try to parse as JSON first
      try {
        parsedData = JSON.parse(data);
      } catch {
        // If parsing fails, assume it's encrypted
        if (!decryptionPassword) {
          throw new Error('Data appears to be encrypted but no password provided');
        }
        const decryptedData = await encryptionService.decrypt(data, decryptionPassword);
        parsedData = JSON.parse(decryptedData);
      }

      // Validate backup data structure
      if (!parsedData.passwords || !Array.isArray(parsedData.passwords)) {
        throw new Error('Invalid backup file format');
      }

      // Check if vault is locked and throw error if needed
      const { securityService } = await import('./master-password-service');
      const hasMasterPassword = await securityService.hasMasterPassword();
      
      // Only check if vault is locked when there's a master password configured
      if (hasMasterPassword) {
        const isLocked = await securityService.isLocked();
        if (isLocked) {
          throw new Error('Vault is locked. Please unlock the vault before importing passwords.');
        }
      }

      // Convert back to PasswordEntry objects
      const passwords: PasswordEntry[] = parsedData.passwords.map((entry: any) => ({
        id: entry.id,
        website: entry.website,
        username: entry.username,
        password: entry.password,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));

      // Clear existing passwords and import new ones
      console.log('Starting import process...');
      const currentPasswords = await passwordService.getAll();
      console.log(`Found ${currentPasswords.length} existing passwords to clear`);
      
      // Clear all current passwords first
      await passwordService.clearAll();

      console.log(`Importing ${passwords.length} new passwords...`);
      for (let i = 0; i < passwords.length; i++) {
        const password = passwords[i];
        console.log(`Importing password ${i + 1}/${passwords.length}:`, password.website);
        try {
          await passwordService.add({
            website: password.website,
            username: password.username,
            password: password.password
          });
        } catch (error) {
          console.error(`Failed to import password ${i + 1}:`, error);
          throw new Error(`Failed to import password for ${password.website}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      console.log('Import completed successfully');

    } catch (error) {
      console.error('Failed to import data:', error);
      throw error instanceof Error ? error : new Error('Failed to import backup data');
    }
  }

  async exportToFile(encryptionPassword?: string): Promise<void> {
    try {
      const dataStr = await this.exportData(encryptionPassword);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const settings = await this.getSettings();
      const encrypted = settings.encryptionEnabled && !!encryptionPassword;
      const filename = `passwords-backup-${new Date().toISOString().split('T')[0]}${encrypted ? '-encrypted' : ''}.json`;

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export to file:', error);
      throw new Error('Failed to export backup file');
    }
  }

  async importFromFile(file: File, decryptionPassword?: string): Promise<void> {
    try {
      const text = await file.text();
      await this.importData(text, decryptionPassword);
    } catch (error) {
      console.error('Failed to import from file:', error);
      throw new Error('Failed to import backup file');
    }
  }

  autoBackup(): void {
    this.startAutoBackup();
  }

  private async startAutoBackup(): Promise<void> {
    // Clear existing timer
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }

    const settings = await this.getSettings();
    
    if (!settings.autoBackupEnabled) {
      return;
    }

    // Create auto backup
    const performBackup = async () => {
      try {
        const backupData = await this.exportData();
        await this.saveAutoBackup(backupData);
        
        // Update last backup date
        await this.updateSettings({ lastBackupDate: new Date().toISOString() });
        
        console.log('Auto backup completed successfully');
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    };

    // Perform initial backup
    await performBackup();

    // Set up recurring backup
    this.backupTimer = window.setInterval(
      performBackup,
      settings.backupInterval * 60 * 1000 // Convert minutes to milliseconds
    );
  }

  private async saveAutoBackup(data: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      const result = await chrome.storage.local.get(this.backupsKey);
      const backups: Array<{ date: string; data: string }> = result[this.backupsKey] || [];

      // Add new backup
      backups.push({
        date: new Date().toISOString(),
        data
      });

      // Keep only the latest maxBackups
      if (backups.length > settings.maxBackups) {
        backups.splice(0, backups.length - settings.maxBackups);
      }

      await chrome.storage.local.set({ [this.backupsKey]: backups });
    } catch (error) {
      console.error('Failed to save auto backup:', error);
      throw new Error('Failed to save auto backup');
    }
  }

  async getAutoBackups(): Promise<Array<{ date: string; data: string }>> {
    try {
      const result = await chrome.storage.local.get(this.backupsKey);
      return result[this.backupsKey] || [];
    } catch (error) {
      console.error('Failed to load auto backups:', error);
      return [];
    }
  }

  async restoreAutoBackup(backupIndex: number, decryptionPassword?: string): Promise<void> {
    try {
      const backups = await this.getAutoBackups();
      if (backupIndex < 0 || backupIndex >= backups.length) {
        throw new Error('Invalid backup index');
      }

      await this.importData(backups[backupIndex].data, decryptionPassword);
    } catch (error) {
      console.error('Failed to restore auto backup:', error);
      throw new Error('Failed to restore backup');
    }
  }

  async deleteAutoBackup(backupIndex: number): Promise<void> {
    try {
      const backups = await this.getAutoBackups();
      if (backupIndex < 0 || backupIndex >= backups.length) {
        throw new Error('Invalid backup index');
      }

      backups.splice(backupIndex, 1);
      await chrome.storage.local.set({ [this.backupsKey]: backups });
    } catch (error) {
      console.error('Failed to delete auto backup:', error);
      throw new Error('Failed to delete backup');
    }
  }

  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }
}

export const backupPasswordService = new BackupPasswordService();
