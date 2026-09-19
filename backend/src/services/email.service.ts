import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { emailConfig } from '../configs/email.config';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'notificationsaavie@gmail.com';
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || 'knrg zwtl jsjz ugwt';
    const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';

    console.log(`🔍 Configuration SMTP: ${smtpHost}:${smtpPort} (User: ${smtpUser})`);
    
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
        name: 'L\'Africaine Vie Bénin SA',
        address: 'notificationsaavie@gmail.com'
      },
      to: email,
      subject: 'Code de vérification - Connexion sécurisée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h2 style="color: #333; margin: 0;">L'Africaine Vie Bénin SA</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Code de vérification</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h3 style="color: #333;">Bonjour ${firstName},</h3>
            
            <p style="color: #555; font-size: 16px;">
              Vous avez demandé à vous connecter à votre compte. Utilisez le code suivant pour compléter votre connexion :
            </p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #007bff; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Important :</strong>
              <br>• Ce code expire dans <strong>10 minutes</strong>
              <br>• Ne partagez jamais ce code avec personne
              <br>• Si vous n'avez pas demandé cette connexion, ignorez cet email
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Cet email a été envoyé automatiquement par le système de sécurité de L'Africaine Vie Bénin SA
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de vérification envoyé:', info.messageId);
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
        name: 'L\'Africaine Vie Bénin SA',
        address: 'notificationsaavie@gmail.com'
      },
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h2 style="color: #333; margin: 0;">L'Africaine Vie Bénin SA</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Réinitialisation de mot de passe</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h3 style="color: #333;">Bonjour ${firstName},</h3>
            
            <p style="color: #555; font-size: 16px;">
              Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code suivant pour créer un nouveau mot de passe :
            </p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #dc3545; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Important :</strong>
              <br>• Ce code expire dans <strong>10 minutes</strong>
              <br>• Ne partagez jamais ce code avec personne
              <br>• Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Cet email a été envoyé automatiquement par le système de sécurité de L'Africaine Vie Bénin SA
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de réinitialisation envoyé:', info.messageId);
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

    if (typeof toOrOptions === 'object' && toOrOptions !== null) {
      mailOptions = {
        from: {
          name: emailConfig.from.name,
          address: emailConfig.from.address
        },
        to: Array.isArray(toOrOptions.to) ? toOrOptions.to.join(', ') : toOrOptions.to,
        subject: toOrOptions.subject,
        html: toOrOptions.html,
        attachments: toOrOptions.attachments
      };
    } else {
      mailOptions = {
        from: {
          name: emailConfig.from.name,
          address: emailConfig.from.address
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
