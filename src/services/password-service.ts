import { PasswordEntry, PasswordDatabase } from '../types/password';

class IndexedDBPasswordService implements PasswordDatabase {
  private dbName = 'PasswordManagerDB';
  private version = 1;
  private storeName = 'passwords';

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('website', 'website', { unique: false });
          store.createIndex('username', 'username', { unique: false });
        }
      };
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async getAll(): Promise<PasswordEntry[]> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result.map(entry => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }));
        resolve(entries);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve entries'));
      };
    });
  }

  async getById(id: string): Promise<PasswordEntry | undefined> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          resolve({
            ...entry,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt)
          });
        } else {
          resolve(undefined);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve entry'));
      };
    });
  }

  async add(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this.openDatabase();
    const id = this.generateId();
    const now = new Date();
    
    const newEntry: PasswordEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(newEntry);

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = () => {
        reject(new Error('Failed to add entry'));
      };
    });
  }

  async update(id: string, entry: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>): Promise<void> {
    const db = await this.openDatabase();
    const existingEntry = await this.getById(id);
    
    if (!existingEntry) {
      throw new Error('Entry not found');
    }

    const updatedEntry: PasswordEntry = {
      ...existingEntry,
      ...entry,
      id,
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updatedEntry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to update entry'));
      };
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete entry'));
      };
    });
  }
}

export const passwordService = new IndexedDBPasswordService();
