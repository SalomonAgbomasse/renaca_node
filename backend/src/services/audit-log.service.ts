import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../modules/gestionUsers/entity/audit-log.entity';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { SecureLogger } from '../utils/secure-logger';

/**
 * Service pour gérer les logs d'audit
 * Enregistre toutes les actions utilisateur dans la base de données et dans des fichiers
 */
@Injectable()
export class AuditLogService {
  private readonly logsDir: string;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {
    // Créer le dossier de logs s'il n'existe pas
    this.logsDir = path.join(process.cwd(), 'logs', 'audit');
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true, mode: 0o755 });
      }
    } catch (error: any) {
      // Si la création échoue, continuer quand même (les logs seront seulement en DB)
      console.warn(`⚠️ Impossible de créer le répertoire de logs: ${this.logsDir}`, error.message);
      // Essayer de créer dans /tmp comme fallback
      this.logsDir = path.join('/tmp', 'logs', 'audit');
      try {
        if (!fs.existsSync(this.logsDir)) {
          fs.mkdirSync(this.logsDir, { recursive: true, mode: 0o755 });
        }
      } catch (fallbackError: any) {
        console.error(`❌ Impossible de créer le répertoire de logs même dans /tmp: ${this.logsDir}`, fallbackError.message);
      }
    }
  }

  /**
   * Masque les données sensibles dans un objet
   */
  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const masked = Array.isArray(data) ? [] : {};
    const sensitiveKeys = [
      'password', 'pass', 'pwd', 'secret', 'token', 'key',
      'auth_token', 'csrf_token', 'smsToken', 'twoFactorSecret',
      'salt', 'jwt', 'authorization', 'cookie'
    ];

    for (const key in data) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        masked[key] = '***';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        masked[key] = this.maskSensitiveData(data[key]);
      } else {
        masked[key] = data[key];
      }
    }

    return masked;
  }

  /**
   * Génère une description en français élégant pour l'action
   */
  private getHumanReadableDescription(
    method: string,
    endpoint: string,
    action: string,
    userFullname: string | null
  ): string {
    const userLabel = userFullname ? userFullname : 'Système (ou anonyme)';
    const cleanEndpoint = endpoint.split('?')[0];

    // Dictionnaire d'actions et de routes courantes en français élégant
    if (cleanEndpoint.startsWith('/api/auth/login')) {
      return `${userLabel} s'est connecté à la plateforme.`;
    }
    if (cleanEndpoint.startsWith('/api/auth/logout')) {
      return `${userLabel} s'est déconnecté de la session active.`;
    }
    if (cleanEndpoint.startsWith('/api/auth/verify-token')) {
      return `Vérification automatique de la session active de ${userLabel}.`;
    }
    if (cleanEndpoint.startsWith('/api/auth/profile')) {
      return `Consultation des informations du profil utilisateur par ${userLabel}.`;
    }
    if (cleanEndpoint.startsWith('/api/audit-logs/all')) {
      return `Consultation de la console d'audit par ${userLabel}.`;
    }
    if (cleanEndpoint.startsWith('/api/audit-logs/files')) {
      if (method === 'GET' && (endpoint.includes('/files/') || cleanEndpoint !== '/api/audit-logs/files')) {
        const file = endpoint.split('/').pop()?.split('?')[0];
        return `Lecture du fichier de journalisation brute (${file}) par ${userLabel}.`;
      }
      return `Consultation de la liste des fichiers journaux du serveur par ${userLabel}.`;
    }
    if (cleanEndpoint.startsWith('/api/contracts')) {
      if (method === 'POST') return `${userLabel} a créé une nouvelle simulation de crédit (contrat).`;
      if (method === 'PUT' || method === 'PATCH') {
        const id = cleanEndpoint.split('/').pop();
        return `${userLabel} a mis à jour le contrat de simulation #${id}.`;
      }
      if (method === 'DELETE') {
        const id = cleanEndpoint.split('/').pop();
        return `${userLabel} a supprimé le contrat de simulation #${id}.`;
      }
      if (cleanEndpoint.includes('/history')) {
        const id = cleanEndpoint.split('/contracts/')[1]?.split('/')[0];
        return `Consultation de l'historique de modification du contrat #${id} par ${userLabel}.`;
      }
      return `Consultation ou recherche de contrats par ${userLabel}.`;
    }
    if (cleanEndpoint.startsWith('/api/customers')) {
      if (method === 'POST') return `${userLabel} a créé la fiche d'un nouveau client.`;
      if (method === 'PUT' || method === 'PATCH') {
        const id = cleanEndpoint.split('/').pop();
        return `${userLabel} a modifié la fiche du client #${id}.`;
      }
      if (method === 'DELETE') {
        const id = cleanEndpoint.split('/').pop();
        return `${userLabel} a supprimé la fiche du client #${id}.`;
      }
      if (cleanEndpoint.includes('/history')) {
        const id = cleanEndpoint.split('/customers/')[1]?.split('/')[0];
        return `Consultation de l'historique du client #${id} par ${userLabel}.`;
      }
      return `Consultation ou recherche de fiches clients par ${userLabel}.`;
    }
    if (cleanEndpoint.startsWith('/api/users')) {
      if (method === 'POST') return `${userLabel} a créé un nouvel utilisateur système.`;
      if (method === 'PUT' || method === 'PATCH') return `${userLabel} a modifié les paramètres d'un utilisateur.`;
      if (method === 'DELETE') return `${userLabel} a désactivé ou supprimé un utilisateur.`;
      return `Consultation de la liste des utilisateurs par ${userLabel}.`;
    }
    if (cleanEndpoint.startsWith('/api/roles')) {
      return `Gestion ou consultation des rôles d'accès par ${userLabel}.`;
    }
    if (cleanEndpoint.startsWith('/api/dashboard')) {
      return `Consultation du tableau de bord statistique par ${userLabel}.`;
    }

    const verb = method === 'GET' ? 'consulté' : method === 'POST' ? 'créé' : method === 'PUT' ? 'modifié' : method === 'DELETE' ? 'supprimé' : 'interagi avec';
    return `${userLabel} a ${verb} la ressource ${cleanEndpoint}.`;
  }

  log(
    req: Request,
    res: Response,
    action: string,
    description?: string,
    startTime?: number,
    error?: Error
  ): void {
    // Exécuter de manière asynchrone sans bloquer le thread principal
    setImmediate(async () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          SecureLogger.debug('🔍 AuditLogService.log: Début enregistrement', {
            method: req.method,
            endpoint: req.url,
            action,
          });
        }
        
        const user = req['user'];
        const userId = user?.id || null;
        const userFullname = user ? `${user.firstname} ${user.lastname}` : null;
        
        let sessionId = user?.sessionId || req['sessionId'] || req.headers['x-session-id'] || null;
        
        // Fallback pour extraire l'ID de session depuis le cookie JWT si présent
        if (!sessionId) {
          try {
            const jwt = require('jsonwebtoken');
            const appName = (process.env.APP_NAME || 'app').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const cookieToken = req.cookies?.[`${appName}_auth_token`] || req.cookies?.auth_token;
            if (cookieToken) {
              const decoded = jwt.decode(cookieToken) as any;
              sessionId = decoded?.sessionId || null;
            }
          } catch (e) {
            // Ignorer
          }
        }

        const ipAddress = 
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          (req.headers['x-real-ip'] as string) ||
          req.socket.remoteAddress ||
          'unknown';

        const duration = startTime ? Date.now() - startTime : null;

        const maskedBody = req.body ? this.maskSensitiveDataLight(req.body) : null;
        const maskedQuery = req.query ? this.maskSensitiveDataLight(req.query) : null;
        const maskedParams = req.params ? this.maskSensitiveDataLight(req.params) : null;

        const requestData = {
          body: maskedBody ? this.limitDataSize(maskedBody, 1000) : null,
          query: maskedQuery,
          params: maskedParams,
        };

        const responseData = {
          statusCode: res.statusCode,
          message: error ? error.message.substring(0, 200) : 'Success',
        };

        const rawUrl = req.originalUrl || req.url;
        const humanDescription = description 
          ? description.substring(0, 500) 
          : this.getHumanReadableDescription(req.method, rawUrl, action, userFullname).substring(0, 500);

        const auditLog = this.auditLogRepository.create({
          userId,
          method: req.method,
          endpoint: rawUrl.substring(0, 500),
          action,
          description: humanDescription,
          requestData,
          responseData,
          statusCode: res.statusCode,
          ipAddress,
          userAgent: req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 500) : null,
          sessionId,
          duration,
          error: error ? error.message.substring(0, 500) : null,
          metadata: null,
        });

        // Sauvegarder asynchronement en base
        this.auditLogRepository.save(auditLog).catch((saveError: any) => {
          SecureLogger.error('Erreur lors de la sauvegarde du log d\'audit en base', saveError);
        });

        // Enregistrer asynchronement dans un fichier journalier (backup physique)
        const logForFile = {
          ...auditLog,
          createdAt: new Date(),
        };
        this.logToFile(logForFile as AuditLog, userFullname).catch((fileError: any) => {
          SecureLogger.error('Erreur lors de l\'écriture du log dans le fichier', fileError);
        });
        
        if (process.env.NODE_ENV !== 'production') {
          SecureLogger.debug('✅ AuditLogService.log: Log enregistré avec succès', {
            userId,
            sessionId,
            action,
            endpoint: req.url,
          });
        }

      } catch (logError: any) {
        SecureLogger.error('Erreur lors de l\'enregistrement du log d\'audit', logError);
      }
    });
  }

  private maskSensitiveDataLight(data: any): any {
    if (!data || typeof data !== 'object') {
      return typeof data === 'string' && data.length > 200 ? data.substring(0, 200) : data;
    }

    const masked = Array.isArray(data) ? [] : {};
    const sensitiveKeys = ['password', 'pass', 'pwd', 'secret', 'token', 'key', 'auth_token', 'csrf_token'];

    const keys = Object.keys(data).slice(0, 20);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        masked[key] = '***';
      } else {
        masked[key] = data[key];
      }
    }

    return masked;
  }

  private limitDataSize(data: any, maxSize: number): any {
    if (typeof data === 'string') {
      return data.length > maxSize ? data.substring(0, maxSize) + '...' : data;
    }
    if (typeof data === 'object' && data !== null) {
      const str = JSON.stringify(data);
      if (str.length > maxSize) {
        return str.substring(0, maxSize) + '...';
      }
    }
    return data;
  }

  private async logToFile(auditLog: AuditLog, userFullname?: string | null): Promise<void> {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }

      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];
      const filename = `audit_${dateStr}.log`;
      const filepath = path.join(this.logsDir, filename);

      const logLine = JSON.stringify({
        timestamp: auditLog.createdAt ? auditLog.createdAt.toISOString() : new Date().toISOString(),
        userId: auditLog.userId,
        user: userFullname || null,
        method: auditLog.method,
        endpoint: auditLog.endpoint,
        action: auditLog.action,
        description: auditLog.description,
        statusCode: auditLog.statusCode,
        ipAddress: auditLog.ipAddress,
        sessionId: auditLog.sessionId,
        duration: auditLog.duration,
        error: auditLog.error,
      }) + '\n';

      fs.appendFileSync(filepath, logLine, 'utf8');
      
      if (process.env.NODE_ENV !== 'production') {
        SecureLogger.debug('✅ AuditLogService.logToFile: Log écrit dans le fichier', {
          filepath,
          filename,
        });
      }

    } catch (error: any) {
      SecureLogger.error('Erreur lors de l\'écriture du log dans le fichier', error);
    }
  }

  async getUserLogs(
    userId: number,
    limit: number = 100,
    offset: number = 0,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.userId = :userId', { userId })
      .orderBy('audit.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    const [logs, total] = await queryBuilder.getManyAndCount();
    return { logs, total };
  }

  async getSessionLogs(sessionId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async getAllLogs(
    limit: number = 100,
    offset: number = 0,
    userId?: number,
    action?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('audit.action = :action', { action });
    }

    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    const [logs, total] = await queryBuilder.getManyAndCount();
    return { logs, total };
  }

  async deleteOldLogs(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  listAuditFiles(): Array<{
    filename: string;
    date: string;
    size: number;
    updatedAt: string;
  }> {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return [];
      }

      const files = fs
        .readdirSync(this.logsDir)
        .filter((f) => /^audit_\d{4}-\d{2}-\d{2}\.log$/i.test(f))
        .map((filename) => {
          const filepath = path.join(this.logsDir, filename);
          const stat = fs.statSync(filepath);
          const match = filename.match(/^audit_(\d{4}-\d{2}-\d{2})\.log$/i);
          const date = match?.[1] || '';
          return {
            filename,
            date,
            size: stat.size,
            updatedAt: stat.mtime.toISOString(),
          };
        })
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

      return files;
    } catch (error: any) {
      SecureLogger.error('Erreur lors de la liste des fichiers de logs d\'audit', error);
      return [];
    }
  }

  readAuditFile(
    filename: string,
    maxBytes: number = 500_000,
  ): { filename: string; size: number; content: string; truncated: boolean } {
    if (!/^audit_\d{4}-\d{2}-\d{2}\.log$/i.test(filename)) {
      throw new Error('Nom de fichier invalide');
    }

    const resolvedDir = path.resolve(this.logsDir);
    const filepath = path.resolve(path.join(this.logsDir, filename));
    if (!filepath.startsWith(resolvedDir + path.sep) && filepath !== resolvedDir) {
      throw new Error('Accès fichier non autorisé');
    }

    const stat = fs.statSync(filepath);
    const size = stat.size;

    const start = Math.max(0, size - maxBytes);
    const fd = fs.openSync(filepath, 'r');
    try {
      const buffer = Buffer.alloc(size - start);
      fs.readSync(fd, buffer, 0, buffer.length, start);
      const content = buffer.toString('utf8');
      return {
        filename,
        size,
        content,
        truncated: start > 0,
      };
    } finally {
      fs.closeSync(fd);
    }
  }
}
