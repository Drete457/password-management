import { useState } from 'react';

interface RandomCodeGeneratorProps {
  onClose: () => void;
}

export function RandomCodeGenerator({ onClose }: RandomCodeGeneratorProps) {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [codeLength, setCodeLength] = useState<number>(12);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const generateRandomCode = () => {
    let charset = '';
    
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      alert('Please select at least one character type');
      return;
    }

    let result = '';
    for (let i = 0; i < codeLength; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setGeneratedCode(result);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = generatedCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="themed-bg-primary rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold themed-text-primary">Random Code Generator</h2>
            <button
              onClick={onClose}
              className="themed-text-secondary hover:themed-text-primary transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Code Length */}
            <div>
              <label className="block text-sm font-medium themed-text-primary mb-2">
                Code Length: {codeLength}
              </label>
              <input
                type="range"
                min="4"
                max="50"
                value={codeLength}
                onChange={(e) => setCodeLength(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Character Types */}
            <div className="space-y-2">
              <label className="block text-sm font-medium themed-text-primary">
                Include Characters:
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeUppercase}
                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="themed-text-primary">Uppercase (A-Z)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeLowercase}
                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="themed-text-primary">Lowercase (a-z)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="themed-text-primary">Numbers (0-9)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="themed-text-primary">Symbols (!@#$%^&*)</span>
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateRandomCode}
              className="w-full themed-accent-bg hover:themed-accent-hover text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Generate Code
            </button>

            {/* Generated Code Display */}
            {generatedCode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium themed-text-primary">
                  Generated Code:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={generatedCode}
                    readOnly
                    className="flex-1 px-3 py-2 themed-border rounded-md themed-bg-secondary themed-text-primary font-mono text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-3 py-2 rounded-md font-medium transition-colors ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'themed-accent-bg hover:themed-accent-hover text-white'
                    }`}
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
                {copied && (
                  <p className="text-sm text-green-500">Code copied to clipboard!</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 themed-text-secondary hover:themed-text-primary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
