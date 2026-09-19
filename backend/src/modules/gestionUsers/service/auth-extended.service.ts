import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { UserSession } from '../entity/user-session.entity';
import { TwoFactorService } from './two-factor.service';
import { EmailService } from '../../../services/email.service';
import { SmsService } from '../../../services/sms.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthExtendedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    private twoFactorService: TwoFactorService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  // Vérifier les identifiants (email ou téléphone + mot de passe)
  async verifyCredentials(login: string, password: string): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      console.log('🔍 verifyCredentials - Login reçu:', login);
      console.log('🔍 verifyCredentials - Type de login:', typeof login);
      
      // Chercher l'utilisateur par email ou téléphone
      console.log('🔍 verifyCredentials - Recherche avec:', { email: login, phone: login });
      
      const user = await this.userRepository.findOne({
        where: [
          { email: login },
          { phone: login }
        ],
        relations: ['role', 'agency']
      });

      console.log('🔍 verifyCredentials - Utilisateur trouvé:', user ? 'OUI' : 'NON');
      if (user) {
        console.log('🔍 verifyCredentials - Email utilisateur:', user.email);
        console.log('🔍 verifyCredentials - Téléphone utilisateur:', user.phone);
        console.log('🔍 verifyCredentials - Type téléphone:', typeof user.phone);
      }

      if (!user) {
        return {
          success: false,
          message: 'Email ou téléphone incorrect'
        };
      }

      // Vérifier que l'utilisateur est actif
      if (user.status !== 'ACTIVE') {
        return {
          success: false,
          message: 'Votre compte est désactivé. Contactez l\'administrateur.'
        };
      }

      // Vérifier le mot de passe (comparaison avec hash bcrypt + salt)
      const passwordWithSalt = password + (user.salt || '');
      console.log('🔍 verifyCredentials - Mot de passe fourni:', password);
      console.log('🔍 verifyCredentials - Salt utilisateur:', user.salt);
      console.log('🔍 verifyCredentials - Mot de passe + salt:', passwordWithSalt);
      console.log('🔍 verifyCredentials - Hash stocké:', user.password);
      
      const isPasswordValid = await bcrypt.compare(passwordWithSalt, user.password);
      console.log('🔍 verifyCredentials - Mot de passe valide:', isPasswordValid);
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Mot de passe incorrect'
        };
      }

      return {
        success: true,
        user: user,
        message: 'Identifiants corrects'
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des identifiants:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Envoyer un code OTP par SMS après vérification des identifiants
  async sendOTPAfterLoginSMS(login: string, password: string): Promise<{ success: boolean; message: string; code?: string; user?: any }> {
    try {
      // Vérifier les identifiants d'abord
      const credentialCheck = await this.verifyCredentials(login, password);
      
      if (!credentialCheck.success) {
        return {
          success: false,
          message: credentialCheck.message
        };
      }

      const user = credentialCheck.user!;

      // Vérifier si la 2FA est activée
      if (!user.twoFactorEnabled) {
        return {
          success: false,
          message: 'Authentification à deux facteurs non activée pour ce compte'
        };
      }

      // Générer et envoyer le code OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code temporairement
      user.smsToken = code;
      user.smsTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await this.userRepository.save(user);

      // Envoyer le code par SMS
      const smsResult = await this.smsService.sendOTPCode(
        user.phone, 
        code, 
        user.firstname || 'Utilisateur'
      );

      if (smsResult.success) {
        return {
          success: true,
          message: 'Code de vérification envoyé par SMS',
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role?.libelle
          }
        };
      } else {
        return {
          success: false,
          message: 'Erreur lors de l\'envoi du SMS'
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'OTP SMS:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Envoyer un code OTP après vérification des identifiants
  async sendOTPAfterLogin(login: string, password: string): Promise<{ success: boolean; message: string; code?: string; user?: any }> {
    try {
      // Vérifier les identifiants d'abord
      const credentialCheck = await this.verifyCredentials(login, password);
      
      if (!credentialCheck.success) {
        return {
          success: false,
          message: credentialCheck.message
        };
      }

      const user = credentialCheck.user!;

      // Vérifier si la 2FA est activée
      if (!user.twoFactorEnabled) {
        return {
          success: false,
          message: 'Authentification à deux facteurs non activée pour ce compte'
        };
      }

      // Générer et envoyer le code OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code temporairement
      user.smsToken = code;
      user.smsTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await this.userRepository.save(user);

      // Envoyer le code par email
      const emailResult = await this.emailService.sendVerificationCode(
        user.email, 
        code, 
        user.firstname || 'Utilisateur'
      );

      if (emailResult.success) {
        return {
          success: true,
          message: 'Code de vérification envoyé par email',
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role?.libelle
          }
        };
      } else {
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email'
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'OTP:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Vérifier le code OTP et finaliser la connexion
  async verifyOTPAndLogin(login: string, otpCode: string): Promise<{ success: boolean; message: string; user?: any; token?: string }> {
    try {
      // Trouver l'utilisateur
      const user = await this.userRepository.findOne({
        where: [
          { email: login },
          { phone: login }
        ],
        relations: ['role', 'agency']
      });

      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      // Vérifier le code OTP
      console.log('🔍 Vérification OTP:', {
        login,
        otpCode,
        storedToken: user.smsToken,
        tokenExpires: user.smsTokenExpires,
        now: new Date()
      });
      
      if (!user.smsToken || user.smsToken !== otpCode) {
        console.log('❌ Code OTP invalide:', { expected: user.smsToken, received: otpCode });
        return {
          success: false,
          message: 'Code de vérification invalide'
        };
      }

      if (!user.smsTokenExpires || new Date() > user.smsTokenExpires) {
        return {
          success: false,
          message: 'Code de vérification expiré'
        };
      }

      // Nettoyer le code utilisé
      user.smsToken = '';
      user.smsTokenExpires = new Date(0);
      await this.userRepository.save(user);

      // Créer une session en base de données
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const session = await this.sessionRepository.save({
        idUser: user.id,
        sessionId: sessionId,
        token: '', // Champ requis
        refreshToken: '', // Champ requis
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        lastActivity: now, // Champ requis
        ipAddress: 'unknown',
        userAgent: 'unknown',
        createdAt: now,
        updatedAt: now
      });

      // Générer un JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role?.libelle,
          sessionId: sessionId,
        },
        process.env.JWT_SECRET || 'secret-key-temp', // Utiliser la même clé que le guard
        { expiresIn: '24h' }
      );

      return {
        success: true,
        message: 'Connexion réussie',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role?.libelle,
          agency: user.agency?.name
        },
        token: token
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'OTP:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Debug: Vérifier les informations utilisateur
  async debugUser(login: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const user = await this.userRepository.findOne({
        where: [
          { email: login },
          { phone: login }
        ],
        relations: ['role', 'agency']
      });

      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      return {
        success: true,
        message: 'Utilisateur trouvé',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstname: user.firstname,
          lastname: user.lastname,
          status: user.status,
          password: user.password, // Pour debug seulement
          twoFactorEnabled: user.twoFactorEnabled,
          role: user.role?.libelle
        }
      };
    } catch (error) {
      console.error('Erreur debug user:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Debug: Vérifier spécifiquement le téléphone
  async debugPhone(phone: string): Promise<{ success: boolean; message: string; users?: any[] }> {
    try {
      console.log('🔍 debugPhone - Téléphone recherché:', phone);
      console.log('🔍 debugPhone - Type:', typeof phone);
      
      // Chercher tous les utilisateurs avec ce téléphone
      const users = await this.userRepository.find({
        where: { phone: phone },
        relations: ['role', 'agency']
      });

      console.log('🔍 debugPhone - Utilisateurs trouvés:', users.length);
      
      // Chercher aussi avec des variantes
      const usersLike = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.agency', 'agency')
        .where('user.phone LIKE :phone', { phone: `%${phone}%` })
        .getMany();

      console.log('🔍 debugPhone - Utilisateurs avec LIKE:', usersLike.length);

      return {
        success: true,
        message: `Trouvé ${users.length} utilisateur(s) exact et ${usersLike.length} avec LIKE`,
        users: [
          ...users.map(u => ({
            id: u.id,
            email: u.email,
            phone: u.phone,
            phoneType: typeof u.phone,
            firstname: u.firstname,
            lastname: u.lastname
          })),
          ...usersLike.map(u => ({
            id: u.id,
            email: u.email,
            phone: u.phone,
            phoneType: typeof u.phone,
            firstname: u.firstname,
            lastname: u.lastname,
            matchType: 'LIKE'
          }))
        ]
      };
    } catch (error) {
      console.error('Erreur debug-phone:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Debug: Vérifier le code OTP stocké
  async debugOTP(login: string): Promise<{ success: boolean; message: string; otpInfo?: any }> {
    try {
      console.log('🔍 debugOTP - Login recherché:', login);
      
      // Chercher l'utilisateur par email ou téléphone
      const user = await this.userRepository.findOne({
        where: [
          { email: login },
          { phone: login }
        ],
        relations: ['role', 'agency']
      });

      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      const now = new Date();
      const isExpired = user.smsTokenExpires && user.smsTokenExpires < now;

      return {
        success: true,
        message: 'Informations OTP récupérées',
        otpInfo: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          smsToken: user.smsToken,
          smsTokenExpires: user.smsTokenExpires,
          isExpired: isExpired,
          timeRemaining: user.smsTokenExpires ? Math.max(0, user.smsTokenExpires.getTime() - now.getTime()) : 0,
          twoFactorEnabled: user.twoFactorEnabled
        }
      };
    } catch (error) {
      console.error('Erreur debug-otp:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Renvoyer OTP par email (sans mot de passe)
  async resendOTPEmail(login: string) {
    try {
      const user = await this.userRepository.findOne({ 
        where: [
          { email: login },
          { phone: login }
        ],
        relations: ['role']
      });

      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      // Vérifier que l'utilisateur est actif
      if (user.status !== 'ACTIVE') {
        return {
          success: false,
          message: 'Votre compte est désactivé. Contactez l\'administrateur.'
        };
      }

      if (!user.twoFactorEnabled) {
        return {
          success: false,
          message: 'La double authentification n\'est pas activée pour ce compte'
        };
      }

      // Générer un nouveau code OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.smsToken = otpCode;
      user.smsTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await this.userRepository.save(user);
      
      console.log('🔄 OTP renvoyé par email:', {
        login,
        otpCode,
        expires: user.smsTokenExpires
      });

      // Envoyer l'email
      const emailResult = await this.emailService.sendVerificationCode(
        user.email, 
        otpCode, 
        user.firstname || 'Utilisateur'
      );

      if (emailResult.success) {
        return {
          success: true,
          message: 'Code de vérification renvoyé par email',
          user: {
            id: user.id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
          }
        };
      } else {
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email'
        };
      }
    } catch (error) {
      console.error('Erreur resendOTPEmail:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Renvoyer OTP par SMS (sans mot de passe)
  async resendOTPSMS(login: string) {
    try {
      const user = await this.userRepository.findOne({ 
        where: [
          { email: login },
          { phone: login }
        ],
        relations: ['role']
      });

      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      // Vérifier que l'utilisateur est actif
      if (user.status !== 'ACTIVE') {
        return {
          success: false,
          message: 'Votre compte est désactivé. Contactez l\'administrateur.'
        };
      }

      if (!user.twoFactorEnabled) {
        return {
          success: false,
          message: 'La double authentification n\'est pas activée pour ce compte'
        };
      }

      // Générer un nouveau code OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.smsToken = otpCode;
      user.smsTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await this.userRepository.save(user);

      // Envoyer le SMS
      const smsResult = await this.smsService.sendOTPCode(
        user.phone, 
        otpCode, 
        user.firstname || 'Utilisateur'
      );

      if (smsResult.success) {
        return {
          success: true,
          message: 'Code de vérification renvoyé par SMS',
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstname: user.firstname,
            lastname: user.lastname
          }
        };
      } else {
        return {
          success: false,
          message: 'Erreur lors de l\'envoi du SMS'
        };
      }
    } catch (error) {
      console.error('Erreur resendOTPSMS:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Test status (temporaire pour les tests)
  async testStatus(login: string, status: string) {
    try {
      const user = await this.userRepository.findOne({ 
        where: [
          { email: login },
          { phone: login }
        ]
      });

      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      user.status = status as any;
      await this.userRepository.save(user);

      return {
        success: true,
        message: `Statut modifié vers ${status}`,
        user: {
          id: user.id,
          email: user.email,
          status: user.status
        }
      };
    } catch (error) {
      console.error('Erreur testStatus:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }
}
