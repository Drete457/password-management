export interface BackupService {
  exportData(): Promise<string>; // JSON encrypted
  importData(data: string): Promise<void>;
  autoBackup(): void;
}

export interface BackupData {
  passwords: any[];
  exportDate: string;
  version: string;
  encrypted: boolean;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupInterval: number; // minutes
  maxBackups: number;
  encryptionEnabled: boolean;
  lastBackupDate?: string;
}
