import { useState, useEffect } from 'react';
import { PasswordEntry } from '../types/password';

interface PasswordFormProps {
  password?: PasswordEntry | null;
  currentDomain?: string;
  onSave: (passwordData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function PasswordForm({ password, currentDomain, onSave, onCancel }: PasswordFormProps) {
  const [website, setWebsite] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (password) {
      setWebsite(password.website);
      setUsername(password.username);
      setPasswordValue(password.password);
    } else {
      setWebsite(currentDomain || '');
      setUsername('');
      setPasswordValue('');
    }
  }, [password, currentDomain]);

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPasswordValue(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!website.trim() || !username.trim() || !passwordValue.trim()) {
      alert('Please fill in all fields');
      return;
    }

    onSave({
      website: website.trim(),
      username: username.trim(),
      password: passwordValue.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        {password ? 'Edit Password' : 'New Password'}
      </h3>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
          Website/Application
        </label>
        <input
          type="text"
          id="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="e.g. gmail.com, facebook.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username/Email
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. your.email@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            placeholder="Enter or generate a password"
            className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-gray-700"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            <button
              type="button"
              onClick={generatePassword}
              className="text-blue-600 hover:text-blue-800"
              title="Generate random password"
            >
              🎲
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {password ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
