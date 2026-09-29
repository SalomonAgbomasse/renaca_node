import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { emailConfig } from '../configs/email.config';

@Injectable()
export class EmailService {
  private transporter;
  private readonly appName = process.env.APP_NAME || 'RENACA Simulateur';

  constructor() {
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'notificationsaavie@gmail.com';
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || 'omrg rmuc hpuz vhkx';
    const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';

    console.log(`🔍 Configuration SMTP pour ${this.appName}: ${smtpHost}:${smtpPort} (User: ${smtpUser})`);
    
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: rejectUnauthorized
      }
    });
  }

  // Vérifier la connexion
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Serveur SMTP configuré avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur de configuration SMTP:', error);
      return false;
    }
  }

  // Envoyer un code de vérification
  async sendVerificationCode(email: string, code: string, firstName: string) {
    const mailOptions = {
      from: {
        name: `${this.appName} - L'Africaine Vie Bénin SA`,
        address: process.env.SMTP_USER || process.env.EMAIL_USER || 'notificationsaavie@gmail.com'
      },
      to: email,
      subject: `🔐 Code de vérification - ${this.appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #111827 100%); padding: 30px 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${this.appName}</h2>
            <p style="color: rgba(255, 255, 255, 0.85); margin: 6px 0 0 0; font-size: 14px;">L'Africaine Vie Bénin SA - Code de vérification</p>
          </div>
          
          <div style="padding: 30px 20px; background-color: #ffffff;">
            <h3 style="color: #333; margin-top: 0;">Bonjour ${firstName},</h3>
            
            <p style="color: #555; font-size: 16px;">
              Vous avez demandé à vous connecter à votre compte sur <strong>${this.appName}</strong>. Utilisez le code suivant pour compléter votre connexion :
            </p>
            
            <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #16a34a; font-size: 36px; margin: 0; letter-spacing: 6px; font-family: monospace;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Important :</strong>
              <br>• Ce code expire dans <strong>10 minutes</strong>
              <br>• Ne partagez jamais ce code avec personne
              <br>• Si vous n'avez pas demandé cette connexion, ignorez cet email
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 0;">
              Cet email a été envoyé automatiquement par le système de sécurité de <strong>${this.appName}</strong> (L'Africaine Vie Bénin SA)
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de vérification envoyé (${this.appName}):`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un code de réinitialisation de mot de passe
  async sendPasswordResetCode(email: string, code: string, firstName: string) {
    const mailOptions = {
      from: {
        name: `${this.appName} - L'Africaine Vie Bénin SA`,
        address: process.env.SMTP_USER || process.env.EMAIL_USER || 'notificationsaavie@gmail.com'
      },
      to: email,
      subject: `🔑 Réinitialisation de votre mot de passe - ${this.appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #111827 100%); padding: 30px 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${this.appName}</h2>
            <p style="color: rgba(255, 255, 255, 0.85); margin: 6px 0 0 0; font-size: 14px;">L'Africaine Vie Bénin SA - Réinitialisation de mot de passe</p>
          </div>
          
          <div style="padding: 30px 20px; background-color: #ffffff;">
            <h3 style="color: #333; margin-top: 0;">Bonjour ${firstName},</h3>
            
            <p style="color: #555; font-size: 16px;">
              Vous avez demandé à réinitialiser votre mot de passe sur <strong>${this.appName}</strong>. Utilisez le code suivant pour créer un nouveau mot de passe :
            </p>
            
            <div style="background-color: #fef2f2; border: 2px dashed #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #dc2626; font-size: 36px; margin: 0; letter-spacing: 6px; font-family: monospace;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Important :</strong>
              <br>• Ce code expire dans <strong>10 minutes</strong>
              <br>• Ne partagez jamais ce code avec personne
              <br>• Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 0;">
              Cet email a été envoyé automatiquement par le système de sécurité de <strong>${this.appName}</strong> (L'Africaine Vie Bénin SA)
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de réinitialisation envoyé (${this.appName}):`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email de réinitialisation:', error);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un email générique
  async sendEmail(
    toOrOptions: string | { to: string | string[]; subject: string; html: string; attachments?: any[] },
    subject?: string,
    htmlContent?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let mailOptions: any;

    const senderName = process.env.EMAIL_FROM_NAME || `${this.appName} - L'Africaine Vie Bénin SA`;
    const senderAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || process.env.EMAIL_USER || 'notificationsaavie@gmail.com';

    if (typeof toOrOptions === 'object' && toOrOptions !== null) {
      mailOptions = {
        from: {
          name: senderName,
          address: senderAddress
        },
        to: Array.isArray(toOrOptions.to) ? toOrOptions.to.join(', ') : toOrOptions.to,
        subject: toOrOptions.subject,
        html: toOrOptions.html,
        attachments: toOrOptions.attachments
      };
    } else {
      mailOptions = {
        from: {
          name: senderName,
          address: senderAddress
        },
        to: toOrOptions,
        subject: subject,
        html: htmlContent
      };
    }

    try {
      console.log(`📧 Envoi d'un email à ${mailOptions.to} (Sujet: ${mailOptions.subject})...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé avec succès: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error(`❌ Échec de l'envoi de l'email à ${mailOptions.to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un code SMS (simulation)
  async sendSmsCode(phone: string, code: string) {
    // Pour l'instant, on simule l'envoi SMS
    // Plus tard, vous pourrez intégrer un service SMS comme Twilio
    console.log(`📱 SMS simulé vers ${phone}: Votre code de vérification est ${code}`);
    return { success: true, message: 'SMS simulé envoyé' };
  }
}
