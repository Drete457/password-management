import { useState, useEffect } from 'react';
import { PasswordEntry } from '../types/password';
import { passwordService } from '../services/password-service';
import { PasswordList } from './password-list';
import { PasswordForm } from './password-form';

export function SidePanel() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentDomain, setCurrentDomain] = useState<string>('');

  useEffect(() => {
    loadPasswords();
    getCurrentDomain();

    // Listen for tab changes
    const handleTabChange = () => {
      getCurrentDomain();
    };

    // Listen for URL changes within the same tab
    const handleTabUpdate = (_: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.url && tab.active) {
        getCurrentDomain();
      }
    };

    // Add tab activation listener
    chrome.tabs.onActivated.addListener(handleTabChange);
    
    // Add tab update listener for URL changes within the same tab
    chrome.tabs.onUpdated.addListener(handleTabUpdate);

    // Cleanup listeners on component unmount
    return () => {
      chrome.tabs.onActivated.removeListener(handleTabChange);
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, []);

  const getCurrentDomain = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url) {
        const url = new URL(tab.url);
        const domain = url.hostname.replace('www.', '');
        setCurrentDomain(domain);
      }
    } catch (error) {
      console.error('Error getting current domain:', error);
    }
  };

  const loadPasswords = async () => {
    try {
      setIsLoading(true);
      const allPasswords = await passwordService.getAll();
      setPasswords(allPasswords);
    } catch (error) {
      console.error('Error loading passwords:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPassword = async (passwordData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await passwordService.add(passwordData);
      await loadPasswords();
      setShowForm(false);
    } catch (error) {
      console.error('Error adding password:', error);
    }
  };

  const handleUpdatePassword = async (id: string, passwordData: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>) => {
    try {
      await passwordService.update(id, passwordData);
      await loadPasswords();
      setEditingPassword(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  const handleDeletePassword = async (id: string) => {
    if (confirm('Are you sure you want to delete this password?')) {
      try {
        await passwordService.delete(id);
        await loadPasswords();
      } catch (error) {
        console.error('Error deleting password:', error);
      }
    }
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setShowForm(true);
  };

  const handleShowNewPasswordForm = async () => {
    await getCurrentDomain(); // Refresh domain before showing form
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingPassword(null);
    setShowForm(false);
  };

  const filteredPasswords = passwords.filter(password =>
    password.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort passwords: current domain first, then alphabetically
  const sortedPasswords = filteredPasswords.sort((a, b) => {
    // If we have a current domain, prioritize matching domains
    if (currentDomain) {
      const aMatchesDomain = a.website.toLowerCase().includes(currentDomain.toLowerCase());
      const bMatchesDomain = b.website.toLowerCase().includes(currentDomain.toLowerCase());
      
      // If one matches current domain and other doesn't, prioritize the match
      if (aMatchesDomain && !bMatchesDomain) return -1;
      if (!aMatchesDomain && bMatchesDomain) return 1;
    }
    
    // For same priority level, sort alphabetically by website
    return a.website.toLowerCase().localeCompare(b.website.toLowerCase());
  });

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">Password Manager</h1>
        {currentDomain && (
          <div className="text-sm mt-1 opacity-90">
            Current site: {currentDomain}
            {(() => {
              const domainCount = passwords.filter(p => 
                p.website.toLowerCase().includes(currentDomain.toLowerCase())
              ).length;
              return domainCount > 0 ? ` (${domainCount} password${domainCount > 1 ? 's' : ''})` : '';
            })()}
          </div>
        )}
      </header>

      <div className="p-4 border-b bg-white">
        <input
          type="text"
          placeholder="Search by website or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="p-4 border-b bg-white">
        <button
          onClick={() => showForm ? setShowForm(false) : handleShowNewPasswordForm()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Password'}
        </button>
      </div>

      <main className="flex-1 overflow-auto">
        {showForm && (
          <div className="p-4 bg-white border-b">
            <PasswordForm
              password={editingPassword}
              currentDomain={currentDomain}
              onSave={editingPassword ? 
                (data: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>) => handleUpdatePassword(editingPassword.id, data) : 
                handleAddPassword
              }
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading passwords...</div>
          </div>
        ) : (
          <PasswordList
            passwords={sortedPasswords}
            currentDomain={currentDomain}
            onEdit={handleEditPassword}
            onDelete={handleDeletePassword}
          />
        )}
      </main>
    </div>
  );
}
