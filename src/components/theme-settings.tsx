import { useState } from 'react';
import { useTheme, ThemeMode, FontSize, AccentColor } from '../contexts/theme-context';

interface ThemeSettingsProps {
  onClose: () => void;
}

export function ThemeSettings({ onClose }: ThemeSettingsProps) {
  const { theme, updateTheme, resetTheme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);

  const handleModeChange = (mode: ThemeMode) => {
    updateTheme({ mode });
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    updateTheme({ fontSize });
  };

  const handleAccentColorChange = (accentColor: AccentColor) => {
    updateTheme({ accentColor });
  };

  const handleReset = async () => {
    setIsResetting(true);
    await resetTheme();
    setIsResetting(false);
  };

  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'auto', label: 'Auto', icon: '🔄' }
  ];

  const fontSizeOptions: { value: FontSize; label: string; preview: string }[] = [
    { value: 'small', label: 'Small', preview: 'text-sm' },
    { value: 'medium', label: 'Medium', preview: 'text-base' },
    { value: 'large', label: 'Large', preview: 'text-lg' }
  ];

  const accentColorOptions: { value: AccentColor; label: string; color: string }[] = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' }
  ];

  return (
    <div className="theme-settings-container">
      <div className="theme-settings-header">
        <h3 className="theme-settings-title">
          Theme Settings
        </h3>
        <button
          onClick={onClose}
          className="theme-settings-close-btn"
          title="Close settings"
        >
          ✕
        </button>
      </div>

      <div className="theme-settings-content">
        {/* Theme Mode Section */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">Appearance</h4>
          <div className="theme-options-grid">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleModeChange(option.value)}
                className={`theme-option-btn ${theme.mode === option.value ? 'theme-option-active' : ''}`}
              >
                <span className="theme-option-icon">{option.icon}</span>
                <span className="theme-option-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Section */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">Font Size</h4>
          <div className="theme-options-grid">
            {fontSizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFontSizeChange(option.value)}
                className={`theme-option-btn ${theme.fontSize === option.value ? 'theme-option-active' : ''}`}
              >
                <span className={`theme-option-preview ${option.preview}`}>Aa</span>
                <span className="theme-option-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color Section */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">Accent Color</h4>
          <div className="theme-colors-grid">
            {accentColorOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAccentColorChange(option.value)}
                className={`theme-color-btn ${theme.accentColor === option.value ? 'theme-color-active' : ''}`}
                title={option.label}
              >
                <div className={`theme-color-circle ${option.color}`}></div>
                <span className="theme-color-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reset Section */}
        <div className="theme-settings-section">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="theme-reset-btn"
          >
            {isResetting ? (
              <>
                <span className="theme-reset-spinner">⟳</span>
                Resetting...
              </>
            ) : (
              <>
                <span>🔄</span>
                Reset to Default
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
