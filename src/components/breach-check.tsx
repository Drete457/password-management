import { useState, useEffect } from 'react';
import { PasswordEntry } from '../types/password';
import { breachCheckService, BreachCheckResult } from '../services/breach-check-service';

interface BreachCheckComponentProps {
  passwords: PasswordEntry[];
  onClose: () => void;
}

interface PasswordWithBreachInfo extends PasswordEntry {
  breachInfo?: BreachCheckResult;
  isChecking?: boolean;
}

export function BreachCheckComponent({ passwords, onClose }: BreachCheckComponentProps) {
  const [passwordsWithBreach, setPasswordsWithBreach] = useState<PasswordWithBreachInfo[]>([]);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [totalBreached, setTotalBreached] = useState(0);

  const checkSinglePassword = async (passwordId: string) => {
    const passwordIndex = passwordsWithBreach.findIndex(p => p.id === passwordId);
    if (passwordIndex === -1) return;

    // Marcar como "verificando"
    setPasswordsWithBreach(prev => prev.map((p, index) => 
      index === passwordIndex ? { ...p, isChecking: true } : p
    ));

    try {
      const result = await breachCheckService.checkPasswordBreach(passwordsWithBreach[passwordIndex].password);
      
      setPasswordsWithBreach(prev => prev.map((p, index) => 
        index === passwordIndex ? { 
          ...p, 
          breachInfo: result, 
          isChecking: false 
        } : p
      ));

      if (result.isBreached) {
        setTotalBreached(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error checking password breach:', error);
      setPasswordsWithBreach(prev => prev.map((p, index) => 
        index === passwordIndex ? { 
          ...p, 
          breachInfo: { isBreached: false, error: 'Failed to check' }, 
          isChecking: false 
        } : p
      ));
    }
  };

  const checkAllPasswords = async () => {
    setIsCheckingAll(true);
    setTotalBreached(0);

    const passwordStrings = passwords.map(p => p.password);
    
    try {
      // Marcar todos como "verificando"
      setPasswordsWithBreach(passwords.map(p => ({ ...p, isChecking: true })));

      const results = await breachCheckService.checkMultiplePasswords(passwordStrings);
      
      let breachedCount = 0;
      const updatedPasswords = passwords.map(password => {
        const result = results.get(password.password);
        if (result?.isBreached) {
          breachedCount++;
        }
        return {
          ...password,
          breachInfo: result,
          isChecking: false
        };
      });

      setPasswordsWithBreach(updatedPasswords);
      setTotalBreached(breachedCount);
    } catch (error) {
      console.error('Error checking passwords:', error);
    } finally {
      setIsCheckingAll(false);
    }
  };

  const getBreachStatusIcon = (breachInfo?: BreachCheckResult, isChecking?: boolean) => {
    if (isChecking) return '⏳';
    if (!breachInfo) return '❔';
    if (breachInfo.error) return '❌';
    if (breachInfo.isBreached) return '🚨';
    return '✅';
  };

  const getBreachStatusText = (breachInfo?: BreachCheckResult, isChecking?: boolean) => {
    if (isChecking) return 'Checking...';
    if (!breachInfo) return 'Not checked';
    if (breachInfo.error) return `Error: ${breachInfo.error}`;
    if (breachInfo.isBreached) {
      return `Compromised (found ${breachInfo.occurrences?.toLocaleString()} times)`;
    }
    return 'Safe';
  };

  const getBreachStatusColor = (breachInfo?: BreachCheckResult, isChecking?: boolean) => {
    if (isChecking) return 'text-yellow-600';
    if (!breachInfo) return 'text-gray-500';
    if (breachInfo.error) return 'text-red-500';
    if (breachInfo.isBreached) return 'text-red-600';
    return 'text-green-600';
  };

  const breachedPasswords = passwordsWithBreach.filter(p => p.breachInfo?.isBreached);
  const checkedPasswords = passwordsWithBreach.filter(p => p.breachInfo && !p.isChecking);

  useEffect(() => {
    // Initialize with passwords without breach information
    setPasswordsWithBreach(passwords.map(p => ({ ...p })));
  }, [passwords]);

  return (
    <div className="themed-bg-primary rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b themed-border">
        <div>
          <h2 className="text-xl font-bold themed-text-primary">🛡️ Password Breach Check</h2>
          <p className="text-sm themed-text-secondary mt-1">
            Check if your passwords have been compromised in data breaches
          </p>
        </div>
        <button
          onClick={onClose}
          className="themed-text-secondary hover:themed-text-primary p-1 rounded transition-colors"
        >
          <span className="text-xl">✕</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="p-4 border-b themed-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold themed-text-primary">{passwords.length}</div>
            <div className="text-sm themed-text-secondary">Total Passwords</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold themed-text-primary">{checkedPasswords.length}</div>
            <div className="text-sm themed-text-secondary">Checked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totalBreached}</div>
            <div className="text-sm themed-text-secondary">Breached</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {checkedPasswords.length - totalBreached}
            </div>
            <div className="text-sm themed-text-secondary">Safe</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-b themed-border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={checkAllPasswords}
            disabled={isCheckingAll}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isCheckingAll
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'themed-accent-bg hover:themed-accent-hover text-white'
            }`}
          >
            {isCheckingAll ? 'Checking All...' : 'Check All Passwords'}
          </button>
          
          {breachedPasswords.length > 0 && (
            <div className="px-4 py-2 bg-red-100 text-red-800 rounded-md text-sm font-medium">
              ⚠️ {breachedPasswords.length} password{breachedPasswords.length !== 1 ? 's' : ''} compromised
            </div>
          )}
        </div>
      </div>

      {/* Password List */}
      <div className="overflow-y-auto max-h-96">
        {passwordsWithBreach.length === 0 ? (
          <div className="p-8 text-center themed-text-secondary">
            No passwords to check
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {passwordsWithBreach.map((password) => (
              <div
                key={password.id}
                className={`p-3 rounded-lg border transition-colors ${
                  password.breachInfo?.isBreached
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                    : 'themed-border themed-bg-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getBreachStatusIcon(password.breachInfo, password.isChecking)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium themed-text-primary truncate">
                          {password.website}
                        </div>
                        <div className="text-sm themed-text-secondary truncate">
                          {password.username}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm mt-1 ${getBreachStatusColor(password.breachInfo, password.isChecking)}`}>
                      {getBreachStatusText(password.breachInfo, password.isChecking)}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {!password.breachInfo && !password.isChecking && (
                      <button
                        onClick={() => checkSinglePassword(password.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Check
                      </button>
                    )}
                    
                    {password.breachInfo?.isBreached && (
                      <div className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md font-medium">
                        Action Required
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with HaveIBeenPwned Attribution */}
      <div className="p-4 border-t themed-border themed-bg-tertiary">
        <div className="text-xs themed-text-secondary text-center">
          Powered by{' '}
          <a 
            href="https://haveibeenpwned.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            HaveIBeenPwned
          </a>
          {' '}• Privacy protected using k-anonymity
        </div>
      </div>
    </div>
  );
}
