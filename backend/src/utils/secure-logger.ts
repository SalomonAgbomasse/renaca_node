import { Logger } from '@nestjs/common';

/**
 * Logger sécurisé qui masque les informations sensibles
 */
export class SecureLogger {
  private static logger = new Logger('SecureLogger');
  private static isProduction = process.env.NODE_ENV === 'production';

  /**
   * Masque les informations sensibles dans une chaîne
   */
  private static maskSensitiveData(data: any): any {
    if (typeof data === 'string') {
      // Masquer les mots de passe, tokens, secrets
      return data
        .replace(/(password|pass|pwd|secret|token|key|auth_token|csrf_token)=[^&\s]+/gi, '$1=***')
        .replace(/("password"|"pass"|"pwd"|"secret"|"token"|"key"|"auth_token"|"csrf_token")\s*:\s*"[^"]+"/gi, '$1: "***"')
        .replace(/Bearer\s+[\w-]+/gi, 'Bearer ***')
        .replace(/[a-zA-Z0-9]{32,}/g, (match) => {
          // Masquer les longs tokens/secrets (probablement des tokens)
          return match.substring(0, 8) + '***';
        });
    }
    
    if (typeof data === 'object' && data !== null) {
      const masked: any = Array.isArray(data) ? [] : {};
      const sensitiveKeys = ['password', 'pass', 'pwd', 'secret', 'token', 'key', 'auth_token', 'csrf_token', 'smsToken', 'twoFactorSecret', 'salt'];
      
      for (const key in data) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
          masked[key] = '***';
        } else {
          masked[key] = this.maskSensitiveData(data[key]);
        }
      }
      return masked;
    }
    
    return data;
  }

  /**
   * Log sécurisé - masque automatiquement les informations sensibles
   */
  static log(message: string, data?: any) {
    if (this.isProduction) {
      // En production, logger seulement le message sans données sensibles
      this.logger.log(message);
    } else {
      // En développement, logger avec données masquées
      const maskedData = data ? this.maskSensitiveData(data) : undefined;
      this.logger.log(message, maskedData ? JSON.stringify(maskedData, null, 2) : '');
    }
  }

  /**
   * Log d'erreur sécurisé
   */
  static error(message: string, error?: any) {
    if (this.isProduction) {
      // En production, logger seulement le message et le type d'erreur
      this.logger.error(message, error?.message || '');
    } else {
      // En développement, logger avec plus de détails (masqués)
      const maskedError = error ? this.maskSensitiveData(error) : undefined;
      this.logger.error(message, maskedError);
    }
  }

  /**
   * Log d'avertissement sécurisé
   */
  static warn(message: string, data?: any) {
    const maskedData = data ? this.maskSensitiveData(data) : undefined;
    this.logger.warn(message, maskedData ? JSON.stringify(maskedData, null, 2) : '');
  }

  /**
   * Log de debug sécurisé (seulement en développement)
   */
  static debug(message: string, data?: any) {
    if (!this.isProduction) {
      const maskedData = data ? this.maskSensitiveData(data) : undefined;
      this.logger.debug(message, maskedData ? JSON.stringify(maskedData, null, 2) : '');
    }
  }
}
