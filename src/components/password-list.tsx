import { useState } from 'react';
import { PasswordEntry } from '../types/password';

interface PasswordListProps {
  passwords: PasswordEntry[];
  currentDomain?: string;
  onEdit: (password: PasswordEntry) => void;
  onDelete: (id: string) => void;
}

export function PasswordList({ passwords, currentDomain, onEdit, onDelete }: PasswordListProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (passwords.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-lg mb-2">No passwords found</div>
        <div className="text-sm">Add a new password to get started</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {passwords.map((password) => {
        const isCurrentDomain = currentDomain && 
          password.website.toLowerCase().includes(currentDomain.toLowerCase());
        
        return (
          <div 
            key={password.id} 
            className={`relative p-4 rounded-lg border-2 hover:shadow-md transition-all duration-200 ${
              isCurrentDomain 
                ? 'bg-blue-50 border-blue-500 shadow-sm' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Header with website and actions */}
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">{password.website}</h3>
                  {isCurrentDomain && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                      Current Site
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{password.username}</p>
              </div>
              <div className="flex space-x-2 flex-shrink-0 ml-2">
                <button
                  onClick={() => onEdit(password)}
                  className="text-blue-600 hover:text-blue-800 text-sm p-1 hover:bg-blue-100 rounded"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(password.id)}
                  className="text-red-600 hover:text-red-800 text-sm p-1 hover:bg-red-100 rounded"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Username section */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 uppercase tracking-wide">Username</span>
                <button
                  onClick={() => copyToClipboard(password.username)}
                  className="text-blue-600 hover:text-blue-800 text-sm p-1 hover:bg-blue-100 rounded"
                  title="Copy username"
                >
                  📋
                </button>
              </div>
              <div className="text-sm text-gray-900 truncate mt-1 font-mono">
                {password.username}
              </div>
            </div>

            {/* Password section */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 uppercase tracking-wide">Password</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => togglePasswordVisibility(password.id)}
                    className="text-gray-500 hover:text-gray-700 text-sm p-1 hover:bg-gray-100 rounded"
                    title={visiblePasswords.has(password.id) ? 'Hide password' : 'Show password'}
                  >
                    {visiblePasswords.has(password.id) ? '🙈' : '👁️'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(password.password)}
                    className="text-blue-600 hover:text-blue-800 text-sm p-1 hover:bg-blue-100 rounded"
                    title="Copy password"
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="text-sm font-mono truncate mt-1 text-gray-900">
                {visiblePasswords.has(password.id) ? password.password : '••••••••••••'}
              </div>
            </div>

            {/* Footer with date */}
            <div className="text-xs text-gray-400 border-t border-gray-200 pt-2">
              Updated: {password.updatedAt.toLocaleDateString('en-US')}
            </div>
          </div>
        );
      })}
    </div>
  );
}