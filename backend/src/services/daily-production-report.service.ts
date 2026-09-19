import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ProductionState } from '../modules/gestionContracts/entity/production-state.entity';
import { Contract } from '../modules/gestionContracts/entity/contract.entity';
import { EmailService } from './email.service';
import { ContractService } from '../modules/gestionContracts/service/contract.service';
import { ExcelService } from './excel.service';
import { ContractStateService } from '../modules/gestionContracts/service/contract-state.service';
import { EmailNotificationService } from '../modules/gestionUsers/service/email-notification.service';
import { emailConfig } from '../configs/email.config';

@Injectable()
export class DailyProductionReportService {
  private readonly logger = new Logger(DailyProductionReportService.name);

  constructor(
    @InjectRepository(ProductionState)
    private readonly productionStateRepository: Repository<ProductionState>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    private readonly emailService: EmailService,
    private readonly contractService: ContractService,
    private readonly excelService: ExcelService,
    private readonly contractStateService: ContractStateService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {
    // Vérifier que les services sont bien injectés
    if (!this.contractService || !this.excelService || !this.contractStateService) {
      this.logger.error('❌ Erreur: Services non injectés correctement');
    }
  }

  /**
   * Envoie le rapport quotidien de production par email
   * S'exécute tous les jours à 20h00
   */
  @Cron('0 20 * * *') // Tous les jours à 20h00
  async sendDailyProductionReport() {
    await this.sendDailyProductionReportToEmails();
  }

  /**
   * Envoie le rapport quotidien de production par email à des adresses spécifiques
   */
  async sendDailyProductionReportToEmails(recipientEmails?: string[]) {
    this.logger.log('📊 Début de l\'envoi du rapport quotidien de production...');

    try {
      const today = new Date();
      // Utiliser la date locale pour éviter les problèmes de décalage horaire
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();
      
      const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

      // Formater les dates pour la requête (format YYYY-MM-DD)
      const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const endDateStr = startDateStr; // Même jour pour début et fin

      this.logger.log(`📅 Période: ${startDateStr} à ${endDateStr}`);

      // Récupérer les productions créées aujourd'hui
      const todayProductions = await this.productionStateRepository
        .createQueryBuilder('production')
        .where('production.createdAt >= :startOfDay', { startOfDay })
        .andWhere('production.createdAt <= :endOfDay', { endOfDay })
        .leftJoinAndSelect('production.agency', 'agency')
        .leftJoinAndSelect('production.user', 'user')
        .orderBy('production.createdAt', 'DESC')
        .getMany();

      // Récupérer les contrats créés aujourd'hui
      const todayContracts = await this.contractService.findByPeriodAndFilters(
        startOfDay,
        endOfDay,
        undefined, // Toutes les agences
        undefined  // Tous les utilisateurs
      );

      this.logger.log(`📋 ${todayProductions.length} production(s) créée(s) aujourd'hui`);
      this.logger.log(`📋 ${todayContracts.length} contrat(s) créé(s) aujourd'hui`);

      // Calculer les statistiques
      const stats = this.calculateDailyStats(todayProductions, todayContracts);

      // Générer le rapport Excel si des contrats existent
      let excelAttachment: { filename: string; content: Buffer } | null = null;
      if (todayContracts.length > 0) {
        try {
          const contractStates = await this.contractStateService.findAll();
          const userIds = [...new Set(todayContracts.map(c => c.user?.id).filter(Boolean))];
          const users = await this.contractService.findUsersByIds(userIds);

          const reportData = {
            contracts: todayContracts,
            contractStates,
            users,
            period: {
              startDate: startDateStr,
              endDate: endDateStr
            }
          };

          const excelResult = await this.excelService.generateProductionReportBuffer(reportData);
          excelAttachment = {
            filename: `rapport_production_quotidien_${startDateStr}.xlsx`,
            content: excelResult
          };

          this.logger.log('✅ Rapport Excel généré avec succès');
        } catch (error) {
          this.logger.error('❌ Erreur lors de la génération du rapport Excel:', error);
        }
      }

      // Récupérer les adresses email depuis les paramètres, la table ou les variables d'environnement
      let emails: string[] = [];
      
      if (recipientEmails && recipientEmails.length > 0) {
        // Utiliser les emails fournis en paramètre (pour les tests)
        emails = recipientEmails;
      } else {
        // Essayer de récupérer depuis la table email_notifications
        try {
          emails = await this.emailNotificationService.getActiveEmails('daily_report');
          this.logger.log(`📧 ${emails.length} adresse(s) email récupérée(s) depuis la table email_notifications`);
        } catch (error) {
          this.logger.warn('⚠️ Erreur lors de la récupération des emails depuis la table, utilisation des variables d\'environnement');
        }
        
        // Fallback sur les variables d'environnement si la table est vide
        if (emails.length === 0) {
          emails = this.getRecipientEmails();
          if (emails.length > 0) {
            this.logger.log(`📧 ${emails.length} adresse(s) email récupérée(s) depuis les variables d'environnement`);
          }
        }
      }

      if (emails.length === 0) {
        this.logger.warn('⚠️ Aucune adresse email configurée pour le rapport quotidien');
        return;
      }

      // Envoyer l'email
      const emailResult = await this.sendReportEmail(emails, stats, startDateStr, excelAttachment);
      
      if (emailResult && emailResult.success) {
        this.logger.log(`✅ Rapport quotidien envoyé avec succès à ${emails.length} destinataire(s)`);
        this.logger.log(`📧 Message ID: ${emailResult.messageId}`);
      } else {
        this.logger.error(`❌ Échec de l'envoi du rapport quotidien: ${emailResult?.error || 'Erreur inconnue'}`);
      }

    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'envoi du rapport quotidien:', error);
    }
  }

  /**
   * Calcule les statistiques quotidiennes
   */
  private calculateDailyStats(productions: ProductionState[], contracts: Contract[]) {
    const totalProductions = productions.length;
    const totalContracts = contracts.length;
    
    let totalCapital = 0;
    let totalPrimeTTC = 0;
    const contractsByAgency: { [key: string]: number } = {};
    const contractsByUser: { [key: string]: number } = {};

    contracts.forEach(contract => {
      totalCapital += Number(contract.capital) || 0;
      totalPrimeTTC += Number(contract.puttc) || 0;

      const agencyName = contract.agency?.name || 'Non spécifiée';
      contractsByAgency[agencyName] = (contractsByAgency[agencyName] || 0) + 1;

      const userName = contract.user ? `${contract.user.firstname} ${contract.user.lastname}` : 'Non spécifié';
      contractsByUser[userName] = (contractsByUser[userName] || 0) + 1;
    });

    return {
      totalProductions,
      totalContracts,
      totalCapital,
      totalPrimeTTC,
      avgCapital: totalContracts > 0 ? totalCapital / totalContracts : 0,
      avgPrimeTTC: totalContracts > 0 ? totalPrimeTTC / totalContracts : 0,
      contractsByAgency,
      contractsByUser,
      productions: productions.map(p => ({
        code: p.code,
        agency: p.agency?.name || 'Toutes',
        status: p.status,
        summary: p.summary
      }))
    };
  }

  /**
   * Récupère les adresses email des destinataires depuis les variables d'environnement
   */
  private getRecipientEmails(): string[] {
    // Récupérer depuis la variable d'environnement DAILY_REPORT_EMAILS ou EMAIL_NOTIFICATION_CC
    const emailsEnv = process.env.DAILY_REPORT_EMAILS || process.env.EMAIL_NOTIFICATION_CC || '';
    
    if (!emailsEnv) {
      return [];
    }

    // Séparer par virgule et nettoyer les espaces
    return emailsEnv
      .split(',')
      .map(email => email.trim())
      .filter(email => email && this.isValidEmail(email));
  }

  /**
   * Valide une adresse email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Envoie l'email avec le rapport
   */
  private async sendReportEmail(
    recipients: string[],
    stats: any,
    date: string,
    excelAttachment: { filename: string; content: Buffer } | null
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Utiliser la date d'aujourd'hui pour le formatage
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = this.generateEmailHtml(stats, dateFormatted);

    const mailOptions: any = {
      to: recipients.join(', '),
      subject: `Rapport quotidien de production - ${dateFormatted}`,
      html: htmlContent,
    };

    // Ajouter la pièce jointe Excel si disponible
    if (excelAttachment) {
      mailOptions.attachments = [
        {
          filename: excelAttachment.filename,
          content: excelAttachment.content,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ];
    }

    try {
      this.logger.log(`📧 Tentative d'envoi de l'email vers: ${recipients.join(', ')}`);
      this.logger.log(`📧 Sujet: ${mailOptions.subject}`);
      this.logger.log(`📧 Pièces jointes: ${excelAttachment ? 'Oui (' + excelAttachment.filename + ')' : 'Non'}`);
      
      const result = await this.emailService.sendEmail(mailOptions);
      
      if (result && result.success) {
        this.logger.log(`✅ Email envoyé avec succès vers: ${recipients.join(', ')}`);
        this.logger.log(`📧 Message ID: ${result.messageId}`);
      } else {
        this.logger.error(`❌ Échec de l'envoi de l'email: ${result?.error || 'Erreur inconnue'}`);
      }
      
      return result;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'envoi de l'email:`, error);
      this.logger.error(`❌ Stack trace:`, error.stack);
      return {
        success: false,
        error: error.message || 'Erreur inconnue lors de l\'envoi de l\'email'
      };
    }
  }

  /**
   * Génère le contenu HTML de l'email
   */
  private generateEmailHtml(stats: any, dateFormatted: string): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount);
    };

    const agenciesList = Object.entries(stats.contractsByAgency)
      .map(([agency, count]) => `<li><strong>${agency}:</strong> ${count} contrat(s)</li>`)
      .join('');

    const usersList = Object.entries(stats.contractsByUser)
      .map(([user, count]) => `<li><strong>${user}:</strong> ${count} contrat(s)</li>`)
      .join('');

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
        <div style="background-color: #2c3e50; color: white; padding: 32px 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Rapport Quotidien de Production</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${dateFormatted}</p>
        </div>
        
        <div style="padding: 40px; background-color: white;">
          <div style="margin-bottom: 32px;">
            <h2 style="color: #495057; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; border-bottom: 1px solid #e9ecef; padding-bottom: 8px;">
              Statistiques Générales
            </h2>
            
            <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 0;">
              <div style="display: table-row;">
                <div style="display: table-cell; width: 50%; padding-right: 12px; padding-bottom: 16px; vertical-align: top;">
                  <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 20px;">
                    <div style="font-size: 12px; color: #6c757d; font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px;">États de Production</div>
                    <div style="font-size: 28px; font-weight: 600; color: #2c3e50;">${stats.totalProductions}</div>
                  </div>
                </div>
                <div style="display: table-cell; width: 50%; padding-left: 12px; padding-bottom: 16px; vertical-align: top;">
                  <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 20px;">
                    <div style="font-size: 12px; color: #6c757d; font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px;">Contrats Créés</div>
                    <div style="font-size: 28px; font-weight: 600; color: #2c3e50;">${stats.totalContracts}</div>
                  </div>
                </div>
              </div>
              <div style="display: table-row;">
                <div style="display: table-cell; width: 50%; padding-right: 12px; vertical-align: top;">
                  <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 20px;">
                    <div style="font-size: 12px; color: #6c757d; font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px;">Capital Total</div>
                    <div style="font-size: 18px; font-weight: 600; color: #212529;">${formatCurrency(stats.totalCapital)}</div>
                  </div>
                </div>
                <div style="display: table-cell; width: 50%; padding-left: 12px; vertical-align: top;">
                  <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 20px;">
                    <div style="font-size: 12px; color: #6c757d; font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px;">Prime TTC Total</div>
                    <div style="font-size: 18px; font-weight: 600; color: #212529;">${formatCurrency(stats.totalPrimeTTC)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          ${stats.totalContracts > 0 ? `
          <div style="margin-bottom: 32px; padding-top: 24px; border-top: 1px solid #e9ecef;">
            <h2 style="color: #495057; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">Moyennes</h2>
            <div style="color: #495057; font-size: 14px; line-height: 1.8;">
              <div style="margin-bottom: 8px;"><strong>Capital moyen:</strong> ${formatCurrency(stats.avgCapital)}</div>
              <div><strong>Prime TTC moyenne:</strong> ${formatCurrency(stats.avgPrimeTTC)}</div>
            </div>
          </div>
          ` : ''}

          ${agenciesList ? `
          <div style="margin-bottom: 32px; padding-top: 24px; border-top: 1px solid #e9ecef;">
            <h2 style="color: #495057; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">Contrats par Agence</h2>
            <div style="color: #495057; font-size: 14px; line-height: 1.8;">
              ${Object.entries(stats.contractsByAgency).map(([agency, count]) => `
                <div style="margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 500;">${agency}</span>
                  <span style="color: #6c757d; margin-left: 8px;">${count} contrat(s)</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${usersList ? `
          <div style="margin-bottom: 32px; padding-top: 24px; border-top: 1px solid #e9ecef;">
            <h2 style="color: #495057; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">Contrats par Utilisateur</h2>
            <div style="color: #495057; font-size: 14px; line-height: 1.8;">
              ${Object.entries(stats.contractsByUser).map(([user, count]) => `
                <div style="margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 500;">${user}</span>
                  <span style="color: #6c757d; margin-left: 8px;">${count} contrat(s)</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${stats.productions.length > 0 ? `
          <div style="margin-bottom: 32px; padding-top: 24px; border-top: 1px solid #e9ecef;">
            <h2 style="color: #495057; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">États de Production Créés</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-size: 12px; font-weight: 600; color: #495057; text-transform: uppercase; letter-spacing: 0.3px;">Code</th>
                  <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-size: 12px; font-weight: 600; color: #495057; text-transform: uppercase; letter-spacing: 0.3px;">Agence</th>
                  <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-size: 12px; font-weight: 600; color: #495057; text-transform: uppercase; letter-spacing: 0.3px;">Statut</th>
                </tr>
              </thead>
              <tbody>
                ${stats.productions.map((p: any) => `
                  <tr>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 14px; color: #212529;">${p.code}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 14px; color: #212529;">${p.agency}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #e9ecef;">
                      <span style="display: inline-block; padding: 4px 8px; border-radius: 3px; background-color: ${
                        p.status === 'completed' ? '#d4edda' : 
                        p.status === 'processing' ? '#fff3cd' : 
                        p.status === 'failed' ? '#f8d7da' : '#e2e3e5'
                      }; color: ${
                        p.status === 'completed' ? '#155724' : 
                        p.status === 'processing' ? '#856404' : 
                        p.status === 'failed' ? '#721c24' : '#383d41'
                      }; font-size: 12px; font-weight: 500; text-transform: capitalize;">
                        ${p.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${stats.totalContracts === 0 && stats.totalProductions === 0 ? `
          <div style="background-color: #f8f9fa; border-left: 3px solid #6c757d; padding: 16px 20px; margin: 24px 0;">
            <p style="margin: 0; color: #495057; font-size: 14px;">
              Aucune activité enregistrée aujourd'hui.
            </p>
          </div>
          ` : ''}
        </div>
        
        <div style="background-color: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; font-size: 12px; color: #6c757d;">
            Ce rapport est généré automatiquement par le système ${emailConfig.app.name}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6c757d;">
            ${emailConfig.app.companyName}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Méthode manuelle pour tester l'envoi du rapport
   */
  async sendReportManually(recipientEmails?: string[]) {
    this.logger.log('📊 Envoi manuel du rapport quotidien...');
    await this.sendDailyProductionReportToEmails(recipientEmails);
  }
}
