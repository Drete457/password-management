import { useState } from 'react';
import { filePasswordService } from '../services/file-password-service';

interface FileManagerProps {
  onImportComplete: () => void;
  onClose: () => void;
}

export function FileManager({ onImportComplete, onClose }: FileManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string>('');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await filePasswordService.exportToFile();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export passwords. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportError('');
      
      await filePasswordService.importFromFile(file);
      onImportComplete();
      alert('Passwords imported successfully!');
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleClearAll = async () => {
    const confirmed = confirm(
      'Are you sure you want to clear all passwords? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        await filePasswordService.clearAll();
        onImportComplete();
        alert('All passwords cleared successfully!');
        onClose();
      } catch (error) {
        console.error('Clear failed:', error);
        alert('Failed to clear passwords. Please try again.');
      }
    }
  };

  return (
    <div className="theme-settings-container">
      <div className="theme-settings-header">
        <h3 className="theme-settings-title">
          File Management
        </h3>
        <button
          onClick={onClose}
          className="theme-settings-close-btn"
          title="Close file manager"
        >
          ✕
        </button>
      </div>

      <div className="theme-settings-content">
        {/* Export Section */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">Export Passwords</h4>
          <p className="text-sm themed-text-secondary mb-3">
            Download all your passwords as a JSON file for backup or transfer.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg themed-accent-bg hover:themed-accent-hover text-white transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <span className="theme-reset-spinner">⟳</span>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Export to File</span>
              </>
            )}
          </button>
        </div>

        {/* Import Section */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">Import Passwords</h4>
          <p className="text-sm themed-text-secondary mb-3">
            Upload a JSON file to import passwords. This will replace all current passwords.
          </p>
          
          {importError && (
            <div className="p-3 mb-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
              <strong>Import Error:</strong> {importError}
            </div>
          )}

          <div className="space-y-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              disabled={isImporting}
              className="w-full p-2 text-sm themed-border rounded-lg themed-bg-secondary themed-text-primary file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[var(--accent-500)] file:text-white file:cursor-pointer hover:file:bg-[var(--accent-600)] disabled:opacity-50"
            />
            
            {isImporting && (
              <div className="flex items-center space-x-2 text-sm themed-text-secondary">
                <span className="theme-reset-spinner">⟳</span>
                <span>Importing passwords...</span>
              </div>
            )}
          </div>
        </div>

        {/* Clear Section */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">Clear All Data</h4>
          <p className="text-sm themed-text-secondary mb-3">
            Remove all passwords from storage. This action cannot be undone.
          </p>
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <span>🗑️</span>
            <span>Clear All Passwords</span>
          </button>
        </div>

        {/* Info Section */}
        <div className="theme-settings-section">
          <div className="p-3 rounded-lg themed-bg-secondary themed-border">
            <h4 className="text-sm font-medium themed-text-primary mb-2">💡 File Storage Info</h4>
            <ul className="text-xs themed-text-secondary space-y-1">
              <li>• Files are stored locally in Chrome storage</li>
              <li>• Export creates a downloadable JSON backup</li>
              <li>• Import replaces all current passwords</li>
              <li>• Always backup before making changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
