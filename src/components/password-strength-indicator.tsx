import { useEffect, useState } from 'react';
import { passwordAnalysisService, PasswordStrength } from '../services/password-analysis-service';

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({ 
  password, 
  showFeedback = true, 
  className = '' 
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  if (!strength || !password) {
    return null;
  }

  const getStrengthText = (level: string) => {
    const texts = {
      'very-weak': 'Very Weak',
      'weak': 'Weak',
      'fair': 'Fair',
      'good': 'Good',
      'strong': 'Strong'
    };
    return texts[level as keyof typeof texts] || 'Unknown';
  };

  const getStrengthIcon = (level: string) => {
    const icons = {
      'very-weak': '🔴',
      'weak': '🟠',
      'fair': '🟡',
      'good': '🟢',
      'strong': '🔒'
    };
    return icons[level as keyof typeof icons] || '❓';
  };

  useEffect(() => {
    if (password) {
      const analysis = passwordAnalysisService.analyzePasswordStrength(password);
      setStrength(analysis);
    } else {
      setStrength(null);
    }
  }, [password]);

  return (
    <div className={`password-strength-container ${className}`}>
      {/* Strength Bar */}
      <div className="flex items-center space-x-3 mb-2">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs themed-text-secondary">Password Strength</span>
            <span className="text-xs font-medium" style={{ color: strength.color }}>
              {getStrengthIcon(strength.level)} {getStrengthText(strength.level)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${strength.percentage}%`,
                backgroundColor: strength.color
              }}
            />
          </div>
        </div>
      </div>

      {/* Score Dots */}
      <div className="flex space-x-1 mb-3">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              level <= strength.score
                ? 'opacity-100'
                : 'opacity-20'
            }`}
            style={{
              backgroundColor: level <= strength.score ? strength.color : '#d1d5db'
            }}
          />
        ))}
      </div>

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs themed-text-secondary font-medium">Suggestions:</span>
          {strength.feedback.map((suggestion, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-xs text-amber-500 mt-0.5">•</span>
              <span className="text-xs themed-text-secondary">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void;
  className?: string;
}

export function PasswordGenerator({ onPasswordGenerated, className = '' }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePassword = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const password = passwordAnalysisService.generateSecurePassword(length);
      setGeneratedPassword(password);
      onPasswordGenerated(password);
      setIsGenerating(false);
    }, 100); // Small delay for visual feedback
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy password:', error);
      }
    }
  };

  return (
    <div className={`password-generator ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm themed-text-secondary font-medium">Password Generator</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs themed-text-secondary">Length:</span>
            <input
              type="range"
              min="8"
              max="32"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-16 h-1 themed-slider"
            />
            <span className="text-xs themed-text-primary font-mono w-6">{length}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={generatePassword}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg themed-accent-bg hover:themed-accent-hover text-white transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⟳</span>
                <span className="text-sm">Generating...</span>
              </>
            ) : (
              <>
                <span>🎲</span>
                <span className="text-sm">Generate</span>
              </>
            )}
          </button>

          {generatedPassword && (
            <button
              onClick={copyToClipboard}
              className="p-2 rounded-lg themed-bg-secondary hover:themed-bg-tertiary themed-border transition-colors"
              title="Copy to clipboard"
            >
              📋
            </button>
          )}
        </div>

        {generatedPassword && (
          <div className="p-3 rounded-lg themed-bg-secondary themed-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs themed-text-secondary">Generated Password:</span>
              <span className="text-xs themed-text-secondary">{length} characters</span>
            </div>
            <div className="font-mono text-sm themed-text-primary break-all p-2 rounded themed-bg-primary">
              {generatedPassword}
            </div>
            <div className="mt-2">
              <PasswordStrengthIndicator password={generatedPassword} showFeedback={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
