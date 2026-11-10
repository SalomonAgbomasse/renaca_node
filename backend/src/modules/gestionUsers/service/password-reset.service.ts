import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { EmailService } from '../../../services/email.service';
import { SmsService } from '../../../services/sms.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  // Générer un code de réinitialisation (email ou téléphone)
  async generateResetCode(identifier: string): Promise<{ success: boolean; message: string; code?: string }> {
    try {
      // Vérifier si l'utilisateur existe par email ou téléphone
      const user = await this.userRepository.findOne({ 
        where: [
          { email: identifier },
          { phone: identifier }
        ],
        relations: ['role']
      });

      if (!user || user.status !== 'ACTIVE') {
        return {
          success: true,
          message: 'Si cet identifiant correspond à un compte actif, des instructions avec un code de vérification lui ont été transmises.'
        };
      }

      // Vérifier que l'utilisateur est actif
      if (user.status !== 'ACTIVE') {
        return {
          success: false,
          message: 'Votre compte est désactivé. Contactez l\'administrateur.'
        };
      }

      // Générer un code à 6 chiffres
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code et l'expiration dans la base (on peut utiliser un champ temporaire)
      // Pour l'instant, on va stocker dans un champ existant ou créer une table dédiée
      // Ici, on va utiliser le champ 'smsToken' temporairement
      user.smsToken = resetCode;
      user.smsTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await this.userRepository.save(user);

      // Détecter si c'est un email ou un téléphone
      const isEmail = identifier.includes('@');
      
      if (isEmail) {
        // Envoyer l'email avec le code
        const emailResult = await this.emailService.sendPasswordResetCode(
          identifier, 
          resetCode, 
          user.firstname || 'Utilisateur'
        );

        if (emailResult.success) {
          return {
            success: true,
            message: 'Code de réinitialisation envoyé par email',
            // code retiré pour la sécurité
          };
        } else {
          return {
            success: false,
            message: 'Erreur lors de l\'envoi de l\'email'
          };
        }
      } else {
        // Envoyer le SMS avec le code
        const smsResult = await this.smsService.sendOTPCode(
          identifier, 
          resetCode, 
          user.firstname || 'Utilisateur'
        );

        if (smsResult.success) {
          return {
            success: true,
            message: 'Code de réinitialisation envoyé par SMS',
            // code retiré pour la sécurité
          };
        } else {
          return {
            success: false,
            message: 'Erreur lors de l\'envoi du SMS'
          };
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération du code de reset:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Vérifier le code et réinitialiser le mot de passe
  async resetPassword(identifier: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Vérifier si l'utilisateur existe par email ou téléphone
      const user = await this.userRepository.findOne({ 
        where: [
          { email: identifier },
          { phone: identifier }
        ],
        relations: ['role']
      });

      if (!user || user.status !== 'ACTIVE') {
        return {
          success: true,
          message: 'Si cet identifiant correspond à un compte actif, des instructions avec un code de vérification lui ont été transmises.'
        };
      }

      // Vérifier que l'utilisateur est actif
      if (user.status !== 'ACTIVE') {
        return {
          success: false,
          message: 'Votre compte est désactivé. Contactez l\'administrateur.'
        };
      }

      // Vérifier le code et l'expiration
      if (!user.smsToken || user.smsToken !== code || !user.smsTokenExpires || new Date() > user.smsTokenExpires) {
        return {
          success: false,
          message: 'Identifiant ou code de réinitialisation invalide.'
        };
      }

      // Générer un nouveau salt et hasher le nouveau mot de passe
      const newSalt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(newPassword + newSalt, 10);
      
      // Mettre à jour le mot de passe et le salt
      user.password = hashedPassword;
      user.salt = newSalt;
      user.smsToken = '';
      user.smsTokenExpires = new Date(0);
      
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }
}
