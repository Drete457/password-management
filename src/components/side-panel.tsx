import { useState, useEffect } from 'react';
import { PasswordEntry } from '../types/password';
import { passwordService } from '../services/password-service';
import { securityService } from '../services/master-password-service';
import { PasswordList } from './password-list';
import { PasswordForm } from './password-form';
import { ThemeSettings } from './theme-settings';
import { FileManager } from './file-manager';
import { PasswordHealthDashboard } from './password-health-dashboard';
import { MasterPasswordSetup, MasterPasswordUnlock } from './master-password';
import { useTheme } from '../contexts/theme-context';

export function SidePanel() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showThemeSettings, setShowThemeSettings] = useState<boolean>(false);
  const [showFileManager, setShowFileManager] = useState<boolean>(false);
  const [showHealthDashboard, setShowHealthDashboard] = useState<boolean>(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [showMasterPasswordSetup, setShowMasterPasswordSetup] = useState<boolean>(false);
  const [showMasterPasswordUnlock, setShowMasterPasswordUnlock] = useState<boolean>(false);
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(false);
  const [hasMasterPassword, setHasMasterPassword] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { isDark } = useTheme();

  useEffect(() => {
    initializeSecurity();
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

  const initializeSecurity = async () => {
    try {
      const hasMP = await securityService.hasMasterPassword();
      const isLocked = securityService.isLocked();
      
      setHasMasterPassword(hasMP);
      setIsVaultLocked(isLocked);
      
      // Only show unlock if has master password AND is locked AND it's the first initialization
      if (hasMP && isLocked && !isInitialized) {
        setShowMasterPasswordUnlock(true);
      }
      
      setIsInitialized(true);
      // Removed: don't show setup automatically
    } catch (error) {
      console.error('Error initializing security:', error);
    }
  };

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
      
      // Don't load passwords if vault is locked
      if (securityService.isLocked()) {
        setPasswords([]);
        return;
      }
      
      const allPasswords = await passwordService.getAll();
      setPasswords(allPasswords);
    } catch (error) {
      console.error('Error loading passwords:', error);
      setPasswords([]);
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

  const handleSecurityIconClick = async () => {
    const hasMP = await securityService.hasMasterPassword();
    
    if (!hasMP) {
      // No master password configured, show setup
      setShowMasterPasswordSetup(true);
    } else if (isVaultLocked && securityService.isLocked()) {
      // Has master password but is locked, show unlock
      setShowMasterPasswordUnlock(true);
    } else {
      // Is unlocked, lock (without showing modal)
      securityService.lockVault();
      setIsVaultLocked(true);
  
      // Clear any open forms and data when locking
      setShowForm(false);
      setEditingPassword(null);
      setPasswords([]);
    }
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
    <div className="h-full themed-bg-secondary flex flex-col">
      <header className="themed-accent-bg text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex-1">
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
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHealthDashboard(!showHealthDashboard)}
              disabled={isVaultLocked}
              className={`p-2 rounded-lg transition-colors ${
                isVaultLocked 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-white hover:bg-opacity-20'
              }`}
              title={isVaultLocked ? "Unlock vault to access" : "Password Health Dashboard"}
            >
              <span className="text-lg">📊</span>
            </button>
            <button
              onClick={() => setShowFileManager(!showFileManager)}
              disabled={isVaultLocked}
              className={`p-2 rounded-lg transition-colors ${
                isVaultLocked 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-white hover:bg-opacity-20'
              }`}
              title={isVaultLocked ? "Unlock vault to access" : "File Manager"}
            >
              <span className="text-lg">📁</span>
            </button>
            <button
              onClick={handleSecurityIconClick}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
              title={
                !hasMasterPassword 
                  ? "Setup Master Password" 
                  : isVaultLocked 
                    ? "Unlock Vault" 
                    : "Lock Vault"
              }
            >
              <span className="text-lg">
                {!hasMasterPassword ? "🔐" : isVaultLocked ? "🔒" : "🔓"}
              </span>
            </button>
            <button
              onClick={() => setShowThemeSettings(!showThemeSettings)}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Theme Settings"
            >
              <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
            </button>
          </div>
        </div>
      </header>

      {showThemeSettings && (
        <div className="p-4 themed-bg-primary border-b themed-border">
          <ThemeSettings onClose={() => setShowThemeSettings(false)} />
        </div>
      )}

      {showFileManager && (
        <div className="p-4 themed-bg-primary border-b themed-border">
          <FileManager 
            onImportComplete={loadPasswords}
            onClose={() => setShowFileManager(false)} 
          />
        </div>
      )}

      {showHealthDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh]">
            <PasswordHealthDashboard 
              passwords={passwords}
              onPasswordEdit={(password) => {
                setEditingPassword(password);
                setShowForm(true);
                setShowHealthDashboard(false);
              }}
              onClose={() => setShowHealthDashboard(false)}
            />
          </div>
        </div>
      )}

      <div className="p-4 border-b themed-bg-primary themed-border">
        <input
          type="text"
          placeholder={isVaultLocked ? "Unlock vault to search..." : "Search by website or username..."}
          value={isVaultLocked ? "" : searchTerm}
          onChange={(e) => !isVaultLocked && setSearchTerm(e.target.value)}
          disabled={isVaultLocked}
          className={`w-full px-3 py-2 themed-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] themed-bg-primary themed-text-primary ${
            isVaultLocked ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
      </div>

      <div className="p-4 border-b themed-bg-primary themed-border">
        <button
          onClick={() => showForm ? setShowForm(false) : handleShowNewPasswordForm()}
          disabled={isVaultLocked}
          className={`w-full font-medium py-2 px-4 rounded-md transition-colors ${
            isVaultLocked 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'themed-accent-bg hover:themed-accent-hover text-white'
          }`}
        >
          {isVaultLocked ? 'Vault Locked' : showForm ? 'Cancel' : 'Add New Password'}
        </button>
      </div>

      <main className="flex-1 overflow-auto themed-bg-secondary">
        {isVaultLocked ? (
          <div className="flex items-center justify-center p-8 text-center">
            <div className="themed-text-secondary">
              <div className="text-lg mb-2">🔒 Vault is Locked</div>
              <div className="text-sm">Please unlock the vault to access your passwords</div>
            </div>
          </div>
        ) : showForm ? (
          <div className="p-4 themed-bg-primary border-b themed-border">
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
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="themed-text-secondary">Loading passwords...</div>
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

      {/* Master Password Modals */}
      {showMasterPasswordSetup && (
        <MasterPasswordSetup
          onComplete={async () => {
            setShowMasterPasswordSetup(false);
            setIsVaultLocked(false);
            setHasMasterPassword(true);
            loadPasswords();
          }}
          onClose={() => {
            setShowMasterPasswordSetup(false);
          }}
        />
      )}

      {showMasterPasswordUnlock && (
        <MasterPasswordUnlock
          onUnlock={() => {
            setShowMasterPasswordUnlock(false);
            setIsVaultLocked(false);
            loadPasswords();
          }}
          onClose={() => {
            setShowMasterPasswordUnlock(false);
          }}
        />
      )}
    </div>
  );
}
