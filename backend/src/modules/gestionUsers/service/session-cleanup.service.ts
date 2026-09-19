import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserSession } from '../entity/user-session.entity';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
  ) {}

  // Nettoyer les sessions inactives toutes les 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupInactiveSessions() {
    this.logger.log('🧹 Début du nettoyage des sessions inactives...');
    
    try {
      const now = new Date();
      const inactivityTimeout = 8 * 60 * 60 * 1000; // 8 heures
      const cutoffTime = new Date(now.getTime() - inactivityTimeout);
      
      // Trouver les sessions inactives depuis plus de 30 minutes
      const inactiveSessions = await this.sessionRepository
        .createQueryBuilder('session')
        .where('session.isActive = :isActive', { isActive: true })
        .andWhere('session.lastActivity < :cutoffTime', { cutoffTime })
        .getMany();

      if (inactiveSessions.length > 0) {
        // Désactiver les sessions inactives
        const sessionIds = inactiveSessions.map(session => session.id);
        await this.sessionRepository
          .createQueryBuilder()
          .update(UserSession)
          .set({ isActive: false })
          .where('id IN (:...sessionIds)', { sessionIds })
          .execute();

        this.logger.log(`🧹 ${inactiveSessions.length} sessions inactives désactivées`);
        
        // Log des sessions nettoyées
        inactiveSessions.forEach(session => {
          const inactiveMinutes = Math.round((now.getTime() - session.lastActivity.getTime()) / 60000);
          this.logger.log(`🧹 Session ${session.sessionId} inactive depuis ${inactiveMinutes} minutes`);
        });
      } else {
        this.logger.log('🧹 Aucune session inactive trouvée');
      }

      // Nettoyer aussi les sessions expirées
      await this.cleanupExpiredSessions();
      
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage des sessions:', error);
    }
  }

  // Nettoyer les sessions expirées
  async cleanupExpiredSessions() {
    try {
      const now = new Date();
      
      // Trouver les sessions expirées
      const expiredSessions = await this.sessionRepository
        .createQueryBuilder('session')
        .where('session.isActive = :isActive', { isActive: true })
        .andWhere('session.expiresAt < :now', { now })
        .getMany();

      if (expiredSessions.length > 0) {
        // Désactiver les sessions expirées
        const sessionIds = expiredSessions.map(session => session.id);
        await this.sessionRepository
          .createQueryBuilder()
          .update(UserSession)
          .set({ isActive: false })
          .where('id IN (:...sessionIds)', { sessionIds })
          .execute();

        this.logger.log(`🧹 ${expiredSessions.length} sessions expirées désactivées`);
      }
      
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage des sessions expirées:', error);
    }
  }

  // Méthode manuelle pour forcer le nettoyage
  async forceCleanup() {
    this.logger.log('🧹 Nettoyage forcé des sessions...');
    await this.cleanupInactiveSessions();
  }

  // Obtenir les statistiques des sessions
  async getSessionStats() {
    const now = new Date();
    const inactivityTimeout = 8 * 60 * 60 * 1000; // 8 heures
    const cutoffTime = new Date(now.getTime() - inactivityTimeout);

    const [activeSessions, inactiveSessions, expiredSessions] = await Promise.all([
      this.sessionRepository.count({ where: { isActive: true } }),
      this.sessionRepository
        .createQueryBuilder('session')
        .where('session.isActive = :isActive', { isActive: true })
        .andWhere('session.lastActivity < :cutoffTime', { cutoffTime })
        .getCount(),
      this.sessionRepository
        .createQueryBuilder('session')
        .where('session.isActive = :isActive', { isActive: true })
        .andWhere('session.expiresAt < :now', { now })
        .getCount()
    ]);

    return {
      active: activeSessions,
      inactive: inactiveSessions,
      expired: expiredSessions,
      total: activeSessions + inactiveSessions + expiredSessions
    };
  }
}
