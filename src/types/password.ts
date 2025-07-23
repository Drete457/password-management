export interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
  category: 'work' | 'personal' | 'shopping' | 'social' | 'other';
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordDatabase {
  getAll(): Promise<PasswordEntry[]>;
  getById(id: string): Promise<PasswordEntry | undefined>;
  add(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  update(id: string, entry: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>): Promise<void>;
  delete(id: string): Promise<void>;
}
