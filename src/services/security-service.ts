class SecurityService {
  private readonly extensionId = chrome.runtime.id;

  // Generate a security hash for data integrity
  private async generateSecurityHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + this.extensionId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Validate data integrity
  async validateDataIntegrity(data: any): Promise<boolean> {
    try {
      if (!data || typeof data !== 'object') return false;
      
      const { securityHash, ...actualData } = data;
      if (!securityHash) return false;

      const expectedHash = await this.generateSecurityHash(JSON.stringify(actualData));
      return securityHash === expectedHash;
    } catch (error) {
      console.error('Security validation failed:', error);
      return false;
    }
  }

  // Secure save with integrity hash
  async secureSave(key: string, data: any): Promise<void> {
    try {
      const dataStr = JSON.stringify(data);
      const securityHash = await this.generateSecurityHash(dataStr);
      
      const secureData = {
        ...data,
        securityHash,
        extensionId: this.extensionId,
        timestamp: new Date().toISOString()
      };

      await chrome.storage.local.set({ [key]: secureData });
    } catch (error) {
      console.error('Secure save failed:', error);
      throw new Error('Failed to save data securely');
    }
  }

  // Secure load with integrity validation
  async secureLoad(key: string): Promise<any> {
    try {
      const result = await chrome.storage.local.get(key);
      const data = result[key];

      if (!data) return null;

      // Check extension ID
      if (data.extensionId !== this.extensionId) {
        console.warn('Data from different extension detected');
        return null;
      }

      // Validate integrity
      const isValid = await this.validateDataIntegrity(data);
      if (!isValid) {
        console.warn('Data integrity validation failed');
        return null;
      }

      // Remove security fields before returning
      const { securityHash, extensionId, timestamp, ...cleanData } = data;
      return cleanData;
    } catch (error) {
      console.error('Secure load failed:', error);
      return null;
    }
  }

  // Check if current session is secure
  async checkSecurityStatus(): Promise<{
    extensionId: string;
    isSecure: boolean;
    lastCheck: string;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Check if running in incognito (less secure)
    if (chrome.extension.inIncognitoContext) {
      warnings.push('Running in incognito mode');
    }

    // Check storage integrity
    try {
      const testData = { test: 'security_check' };
      await this.secureSave('security_test', testData);
      const loaded = await this.secureLoad('security_test');
      if (!loaded || loaded.test !== 'security_check') {
        warnings.push('Storage integrity check failed');
      }
      await chrome.storage.local.remove('security_test');
    } catch (error) {
      warnings.push('Storage security test failed');
    }

    return {
      extensionId: this.extensionId,
      isSecure: warnings.length === 0,
      lastCheck: new Date().toISOString(),
      warnings
    };
  }

  // Get extension security info
  getSecurityInfo(): {
    extensionId: string;
    storageNamespace: string;
    isolationLevel: string;
  } {
    return {
      extensionId: this.extensionId,
      storageNamespace: `chrome-extension://${this.extensionId}/`,
      isolationLevel: 'Extension-level isolation (secure)'
    };
  }
}

export const securityService = new SecurityService();
