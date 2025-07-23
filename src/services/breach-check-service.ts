/**
 * Breach Check Service
 * Verifica se passwords foram comprometidos usando a API HaveIBeenPwned
 * Utiliza k-anonymity para proteger a privacidade (apenas os primeiros 5 caracteres do SHA-1)
 */

export interface BreachCheckResult {
  isBreached: boolean;
  occurrences?: number;
  error?: string;
}

export interface PasswordBreachInfo {
  password: string;
  hash: string;
  isBreached: boolean;
  occurrences: number;
  lastChecked: Date;
}

class BreachCheckService {
  private readonly API_BASE_URL = 'https://api.pwnedpasswords.com/range/';
  private cache: Map<string, PasswordBreachInfo> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Gera SHA-1 hash de uma password
   */
  private async generateSHA1(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  /**
   * Verifica se uma password foi comprometida usando k-anonymity
   * Envia apenas os primeiros 5 caracteres do hash SHA-1
   */
  async checkPasswordBreach(password: string): Promise<BreachCheckResult> {
    try {
      // Gerar hash SHA-1 da password
      const passwordHash = await this.generateSHA1(password);
      
      // Verificar cache primeiro
      const cached = this.getCachedResult(passwordHash);
      if (cached) {
        return {
          isBreached: cached.isBreached,
          occurrences: cached.occurrences
        };
      }

      // k-anonymity: usar apenas os primeiros 5 caracteres
      const hashPrefix = passwordHash.substring(0, 5);
      const hashSuffix = passwordHash.substring(5);

      // Fazer request para a API
      const response = await fetch(`${this.API_BASE_URL}${hashPrefix}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Password-Manager-Extension',
          'Add-Padding': 'true' // To add extra security padding
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const responseText = await response.text();
      const hashes = responseText.split('\n');

      // Procurar pelo sufixo do hash
      let occurrences = 0;
      let isBreached = false;

      for (const line of hashes) {
        const [suffix, count] = line.trim().split(':');
        if (suffix === hashSuffix) {
          occurrences = parseInt(count, 10);
          isBreached = true;
          break;
        }
      }

      // Cachear resultado
      this.cacheResult(passwordHash, password, isBreached, occurrences);

      return {
        isBreached,
        occurrences: isBreached ? occurrences : 0
      };

    } catch (error) {
      console.error('Error checking password breach:', error);
      return {
        isBreached: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Verifica múltiplas passwords em batch
   */
  async checkMultiplePasswords(passwords: string[]): Promise<Map<string, BreachCheckResult>> {
    const results = new Map<string, BreachCheckResult>();
    
    // Process in small batches to avoid overloading the API
    const batchSize = 5;
    for (let i = 0; i < passwords.length; i += batchSize) {
      const batch = passwords.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (password) => {
        const result = await this.checkPasswordBreach(password);
        return { password, result };
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ password, result }) => {
        results.set(password, result);
      });

      // Pequeno delay entre batches para ser respeitoso com a API
      if (i + batchSize < passwords.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Obter resultado do cache se ainda válido
   */
  private getCachedResult(hash: string): PasswordBreachInfo | null {
    const cached = this.cache.get(hash);
    if (cached) {
      const isExpired = Date.now() - cached.lastChecked.getTime() > this.CACHE_DURATION;
      if (!isExpired) {
        return cached;
      } else {
        this.cache.delete(hash);
      }
    }
    return null;
  }

  /**
   * Cachear resultado da verificação
   */
  private cacheResult(hash: string, password: string, isBreached: boolean, occurrences: number): void {
    this.cache.set(hash, {
      password,
      hash,
      isBreached,
      occurrences,
      lastChecked: new Date()
    });

    // Limitar tamanho do cache
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obter estatísticas do cache
   */
  getCacheStats(): { size: number; breachedCount: number } {
    let breachedCount = 0;
    for (const info of this.cache.values()) {
      if (info.isBreached) {
        breachedCount++;
      }
    }
    
    return {
      size: this.cache.size,
      breachedCount
    };
  }

  /**
   * Verificar se uma password específica está no cache e foi comprometida
   */
  isPasswordInCache(password: string): PasswordBreachInfo | null {
    for (const info of this.cache.values()) {
      if (info.password === password) {
        return info;
      }
    }
    return null;
  }
}

export const breachCheckService = new BreachCheckService();
