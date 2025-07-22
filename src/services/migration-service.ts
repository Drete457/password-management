/**
 * Migration Service
 * Handles data migration from IndexedDB to Chrome Storage Local
 */

import { PasswordEntry } from '../types/password';

class MigrationService {
  private readonly oldDbName = 'PasswordManagerDB';
  private readonly oldStoreName = 'passwords';
  private readonly newStorageKey = 'password_manager_passwords';
  private readonly migrationKey = 'password_manager_migration_completed';

  /**
   * Checks if migration has already been completed
   */
  async isMigrationCompleted(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(this.migrationKey);
      return !!result[this.migrationKey];
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return false;
    }
  }

  /**
   * Marks migration as completed
   */
  async markMigrationCompleted(): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.migrationKey]: true });
    } catch (error) {
      console.error('Failed to mark migration as completed:', error);
    }
  }

  /**
   * Gets data from IndexedDB
   */
  private async getDataFromIndexedDB(): Promise<PasswordEntry[]> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.oldDbName);

      request.onerror = () => {
        // If IndexedDB doesn't exist or fails, return empty array
        resolve([]);
      };

      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains(this.oldStoreName)) {
          // If the store doesn't exist, return empty array
          resolve([]);
          return;
        }

        const transaction = db.transaction([this.oldStoreName], 'readonly');
        const store = transaction.objectStore(this.oldStoreName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const entries = getAllRequest.result.map((entry: any) => ({
            ...entry,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt)
          }));
          resolve(entries);
        };

        getAllRequest.onerror = () => {
          resolve([]);
        };
      };

      request.onupgradeneeded = () => {
        // Database doesn't exist, return empty array
        resolve([]);
      };
    });
  }

  /**
   * Migrates data from IndexedDB to Chrome Storage
   */
  async migrateData(): Promise<void> {
    try {
      // Check if migration was already completed
      if (await this.isMigrationCompleted()) {
        console.log('Migration already completed, skipping...');
        return;
      }

      console.log('Starting data migration from IndexedDB to Chrome Storage...');

      // Get existing data from Chrome Storage
      const result = await chrome.storage.local.get(this.newStorageKey);
      const existingPasswords = result[this.newStorageKey] || [];

      // If we already have data in the new storage, skip migration
      if (existingPasswords.length > 0) {
        console.log('Chrome Storage already contains data, marking migration as completed...');
        await this.markMigrationCompleted();
        return;
      }

      // Get data from IndexedDB
      const indexedDbData = await this.getDataFromIndexedDB();

      if (indexedDbData.length > 0) {
        console.log(`Migrating ${indexedDbData.length} passwords from IndexedDB to Chrome Storage...`);
        
        // Save to Chrome Storage
        await chrome.storage.local.set({ [this.newStorageKey]: indexedDbData });
        
        console.log('Migration completed successfully');
      } else {
        console.log('No data found in IndexedDB to migrate');
      }

      // Mark migration as completed
      await this.markMigrationCompleted();

    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error('Failed to migrate data from IndexedDB to Chrome Storage');
    }
  }

  /**
   * Cleans up IndexedDB after successful migration (optional)
   */
  async cleanupOldData(): Promise<void> {
    try {
      return new Promise((resolve) => {
        const deleteRequest = indexedDB.deleteDatabase(this.oldDbName);
        
        deleteRequest.onsuccess = () => {
          console.log('IndexedDB cleaned up successfully');
          resolve();
        };
        
        deleteRequest.onerror = () => {
          console.warn('Failed to cleanup IndexedDB, but migration was successful');
          resolve(); // Don't fail the migration if cleanup fails
        };
        
        deleteRequest.onblocked = () => {
          console.warn('IndexedDB cleanup blocked, but migration was successful');
          resolve();
        };
      });
    } catch (error) {
      console.warn('Error during IndexedDB cleanup:', error);
      // Don't throw error, cleanup is optional
    }
  }

  /**
   * Performs complete migration process
   */
  async performMigration(): Promise<void> {
    await this.migrateData();
    // Optionally cleanup old data
    // await this.cleanupOldData();
  }
}

export const migrationService = new MigrationService();
