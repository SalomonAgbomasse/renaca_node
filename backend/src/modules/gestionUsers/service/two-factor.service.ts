import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { EmailService } from '../../../services/email.service';

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  // Activer la 2FA pour un utilisateur
  async enable2FA(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      user.twoFactorEnabled = true;
      await this.userRepository.save(user);

      return { success: true, message: 'Authentification à deux facteurs activée' };
    } catch (error) {
      console.error('Erreur lors de l\'activation de la 2FA:', error);
      return { success: false, message: 'Erreur interne du serveur' };
    }
  }

  // Désactiver la 2FA pour un utilisateur
  async disable2FA(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      user.twoFactorEnabled = false;
      user.twoFactorSecret = '';
      await this.userRepository.save(user);

      return { success: true, message: 'Authentification à deux facteurs désactivée' };
    } catch (error) {
      console.error('Erreur lors de la désactivation de la 2FA:', error);
      return { success: false, message: 'Erreur interne du serveur' };
    }
  }

  // Envoyer un code 2FA par email
  async send2FACode(userId: number): Promise<{ success: boolean; message: string; code?: string }> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: userId },
        relations: ['role']
      });
      
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      if (!user.twoFactorEnabled) {
        return { success: false, message: 'Authentification à deux facteurs non activée' };
      }

      // Générer un code à 6 chiffres
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code temporairement (expire dans 5 minutes)
      user.smsToken = code;
      user.smsTokenExpires = new Date(Date.now() + 5 * 60 * 1000);
      
      await this.userRepository.save(user);

      // Envoyer l'email avec le code
      const emailResult = await this.emailService.sendVerificationCode(
        user.email, 
        code, 
        user.firstname || 'Utilisateur'
      );

      if (emailResult.success) {
        return {
          success: true,
          message: 'Code de vérification envoyé par email',
          code: code // Pour les tests
        };
      } else {
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email'
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code 2FA:', error);
      return { success: false, message: 'Erreur interne du serveur' };
    }
  }

  // Vérifier le code 2FA
  async verify2FACode(userId: number, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      if (!user.twoFactorEnabled) {
        return { success: false, message: 'Authentification à deux facteurs non activée' };
      }

      // Vérifier le code et l'expiration
      if (!user.smsToken || user.smsToken !== code) {
        return { success: false, message: 'Code de vérification invalide' };
      }

      if (!user.smsTokenExpires || new Date() > user.smsTokenExpires) {
        return { success: false, message: 'Code de vérification expiré' };
      }

      // Nettoyer le code utilisé
      user.smsToken = '';
      user.smsTokenExpires = new Date(0);
      await this.userRepository.save(user);

      return { success: true, message: 'Code de vérification valide' };
    } catch (error) {
      console.error('Erreur lors de la vérification du code 2FA:', error);
      return { success: false, message: 'Erreur interne du serveur' };
    }
  }

  // Vérifier si un utilisateur a la 2FA activée
  async is2FAEnabled(userId: number): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      return user ? user.twoFactorEnabled : false;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut 2FA:', error);
      return false;
    }
  }
}
