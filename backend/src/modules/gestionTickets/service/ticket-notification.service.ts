import { Injectable } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { EmailService } from '../../../services/email.service';
import { SmsService } from '../../../services/sms.service';
import { Ticket } from '../entity/ticket.entity';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class TicketNotificationService {
  constructor(
    private readonly ticketService: TicketService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService
  ) {}

  async sendNotifications(ticket: Ticket): Promise<void> {
    try {
      console.log(`📧📱 Envoi de notifications pour ticket ${ticket.id}`);

      const userName = ticket.user
        ? `${ticket.user.firstname} ${ticket.user.lastname}`
        : 'Un utilisateur';

      const userEmail = ticket.email || ticket.user?.email || 'Non renseigné';
      const userPhone = ticket.telephone || ticket.user?.phone || 'Non renseigné';

      const emailSubject = `Nouveau ticket de support — ${ticket.sujet}`;
      const emailMessage = `
        <h2>Nouveau ticket de support</h2>
        <p>Bonjour,</p>
        <p>Un nouveau ticket de support a été créé dans le système FNDA.</p>
        <p><strong>Ticket #${ticket.id}</strong></p>
        <p><strong>Sujet:</strong> ${ticket.sujet}</p>
        <p><strong>Description:</strong></p>
        <p>${ticket.description.replace(/\n/g, '<br>')}</p>
        <p><strong>Créé par:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Téléphone:</strong> ${userPhone}</p>
        <p><strong>Priorité:</strong> ${ticket.priority}</p>
        <p><strong>Date:</strong> ${new Date(ticket.createdAt).toLocaleString('fr-FR')}</p>
        ${ticket.fichiers ? `<p><strong>Fichiers joints:</strong> ${this.parseFiles(ticket.fichiers).length} fichier(s)</p>` : ''}
        <p>Veuillez vous connecter au système pour traiter ce ticket.</p>
        <p>Cordialement,<br>L'Africaine Vie Bénin SA</p>
      `;

      // Préparer les pièces jointes
      const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];

      if (ticket.fichiers) {
        try {
          const files = this.parseFiles(ticket.fichiers);
          for (const filePath of files) {
            const fullPath = join(process.cwd(), filePath);
            if (existsSync(fullPath)) {
              const fileContent = readFileSync(fullPath);
              const fileName = filePath.split('/').pop() || 'fichier';
              let contentType = 'application/octet-stream';
              const ext = fileName.split('.').pop()?.toLowerCase();
              if (ext === 'pdf') contentType = 'application/pdf';
              else if (['jpg', 'jpeg'].includes(ext || '')) contentType = 'image/jpeg';
              else if (ext === 'png') contentType = 'image/png';
              else if (ext === 'gif') contentType = 'image/gif';
              attachments.push({ filename: fileName, content: fileContent, contentType });
              console.log(`📎 Fichier attaché: ${fileName}`);
            } else {
              console.warn(`⚠️ Fichier non trouvé: ${fullPath}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erreur lors de la préparation des fichiers joints:`, error);
        }
      }

      // Récupérer tous les admins et envoyer les notifications
      try {
        const adminUsers = await this.ticketService.getAdminUsers();
        console.log(`👥 ${adminUsers.length} administrateurs à notifier`);

        const smsMessage = `Nouveau ticket #${ticket.id}: ${ticket.sujet}. Créé par ${userName}. Priorité: ${ticket.priority}.`;

        for (const admin of adminUsers) {
          try {
            if (admin.email) {
              await this.emailService.sendEmail({
                to: admin.email,
                subject: emailSubject,
                html: emailMessage,
                attachments: attachments.length > 0 ? attachments : undefined
              });
              console.log(`✅ Email envoyé à ${admin.email}`);
            }
            if (admin.phone) {
              await this.smsService.sendSMS(admin.phone, smsMessage);
              console.log(`✅ SMS envoyé à ${admin.phone}`);
            }
          } catch (error) {
            console.error(`❌ Erreur lors de l'envoi de notification à ${admin.email || admin.phone}:`, error);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la récupération des admins:`, error);
      }

      console.log(`✅ Notifications envoyées pour le ticket ${ticket.id}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi des notifications pour le ticket ${ticket.id}:`, error);
    }
  }

  private parseFiles(filesJson: string): string[] {
    if (!filesJson) return [];
    try {
      const parsed = JSON.parse(filesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
}
