import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { UserSession } from '../entity/user-session.entity';
import { UserActivity, ActivityType } from '../entity/user-activity.entity';
import { EmailService } from '../../../services/email.service';
import { SmsService } from '../../../services/sms.service';
import { SystemSettingService } from './system-setting.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    @InjectRepository(UserActivity)
    private activityRepository: Repository<UserActivity>,
    private emailService: EmailService,
    private smsService: SmsService,
    private settingService: SystemSettingService,
  ) {}

  // Connexion classique avec email/mot de passe
  async login(identifier: string, password: string, ipAddress: string, userAgent: string): Promise<any> {
    // Chercher l'utilisateur par email ou téléphone
    const user = await this.userRepository.findOne({
      where: [
        { email: identifier },
        { phone: identifier }
      ],
      relations: ['role', 'agency']
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si l'utilisateur est désactivé
    if (user.status === 'DESACTIVE') {
      await this.logActivity(user.id, ActivityType.LOGIN_FAILED, 'Tentative de connexion d\'un utilisateur désactivé');
      throw new UnauthorizedException('Compte désactivé. Votre compte n\'est pas encore activé. Contactez l\'administrateur pour activer votre compte.');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password + user.salt, user.password);
    if (!isPasswordValid) {
      // Incrémenter les tentatives de connexion
      const newAttempts = (user.loginAttempts || 0) + 1;
      await this.userRepository.update(user.id, { loginAttempts: newAttempts });

      // Verrouiller le compte après 5 tentatives échouées
      if (newAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await this.userRepository.update(user.id, { lockedUntil: lockUntil });
        await this.logActivity(user.id, ActivityType.LOGIN_FAILED, 'Compte verrouillé après 5 tentatives échouées');
        throw new UnauthorizedException('Compte verrouillé. Réessayez dans 30 minutes.');
      }

      await this.logActivity(user.id, ActivityType.LOGIN_FAILED, 'Mot de passe incorrect');
      throw new UnauthorizedException('Mot de passe incorrect. Vérifiez votre mot de passe et réessayez.');
    }

    // Vérifier si l'utilisateur est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Compte temporairement verrouillé');
    }

    // Réinitialiser les tentatives de connexion
    await this.userRepository.update(user.id, {
      loginAttempts: 0,
      lockedUntil: undefined,
      lastLogin: new Date()
    });

    // Si l'utilisateur a la 2FA activée et que le paramètre global est actif, ne pas créer de session encore
    const enable2FA = await this.settingService.get('ENABLE_SMS_2FA', 'true');
    if (user.twoFactorEnabled && enable2FA === 'true') {
      // Générer un token SMS temporaire pour la 2FA
      const smsToken = Math.random().toString().substr(2, 6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await this.userRepository.update(user.id, {
        smsToken,
        smsTokenExpires: expiresAt
      });

      // TODO: Envoyer le SMS avec le code
      console.log(`Code 2FA pour ${user.email}: ${smsToken}`);

      await this.logActivity(user.id, ActivityType.SMS_VERIFICATION, 'Code 2FA généré après connexion');

      return {
        requiresTwoFactor: true,
        user: {
          id: user.id,
          email: user.email,
          lastname: user.lastname,
          firstname: user.firstname,
          role: user.role?.libelle,
          agency: user.agency?.name
        },
        message: 'Double authentification requise'
      };
    }

    // Pas de 2FA, créer la session directement
    const session = await this.createSession(user.id, ipAddress, userAgent);
    
    // Tracer la connexion réussie
    await this.logActivity(user.id, ActivityType.LOGIN, 'Connexion réussie');

    // Générer un token JWT avec sessionId
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role?.libelle,
        sessionId: session.sessionId  // ← Ajouter le sessionId
      },
      process.env.JWT_SECRET || 'secret-key-temp',
      { expiresIn: '24h' }
    );

    return {
      requiresTwoFactor: false,
      user: {
        id: user.id,
        email: user.email,
        lastname: user.lastname,
        firstname: user.firstname,
        role: user.role?.libelle,
        agency: user.agency?.name
      },
      session: {
        id: session.id,
        token: session.token
      },
      jwtToken: token
    };
  }

  // Générer un token SMS
  async generateSmsToken(emailOrPhone: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // Vérifier si l'utilisateur est désactivé
    if (user.status === 'DESACTIVE') {
      await this.logActivity(user.id, ActivityType.LOGIN_FAILED, 'Tentative de génération de token SMS pour un utilisateur désactivé');
      throw new BadRequestException('Compte désactivé. Impossible de générer un token de récupération.');
    }

    const smsToken = Math.random().toString().substr(2, 6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.userRepository.update(user.id, {
      smsToken,
      smsTokenExpires: expiresAt
    });

    // TODO: Envoyer le SMS/email avec le token
    console.log(`Token SMS pour ${emailOrPhone}: ${smsToken}`);

    // Tracer l'activité
    await this.logActivity(user.id, ActivityType.SMS_VERIFICATION, 'Token SMS généré');

    return smsToken;
  }

  // Vérifier le token SMS et connecter l'utilisateur
  async verifySmsTokenAndLogin(emailOrPhone: string, smsToken: string, ipAddress: string, userAgent: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // Vérifier si l'utilisateur est désactivé
    if (user.status === 'DESACTIVE') {
      await this.logActivity(user.id, ActivityType.LOGIN_FAILED, 'Tentative de connexion d\'un utilisateur désactivé');
      throw new UnauthorizedException('Compte désactivé. Contactez l\'administrateur.');
    }

    if (user.smsToken !== smsToken) {
      await this.logActivity(user.id, ActivityType.LOGIN_FAILED, 'Token SMS invalide');
      throw new UnauthorizedException('Token SMS invalide');
    }

    if (user.smsTokenExpires < new Date()) {
      await this.logActivity(user.id, ActivityType.LOGIN_FAILED, 'Token SMS expiré');
      throw new UnauthorizedException('Token SMS expiré');
    }

    // Vérifier si l'utilisateur est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Compte temporairement verrouillé');
    }

    // Créer la session
    const session = await this.createSession(user.id, ipAddress, userAgent);
    
    // Mettre à jour l'utilisateur
    await this.userRepository.update(user.id, {
      isVerified: true,
      lastLogin: new Date(),
      loginAttempts: 0,
      lockedUntil: undefined,
      smsToken: undefined,
      smsTokenExpires: undefined
    });

    // Tracer l'activité
    await this.logActivity(user.id, ActivityType.LOGIN, 'Connexion réussie via SMS', ipAddress, userAgent, session.sessionId);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        lastname: user.lastname,
        firstname: user.firstname,
        isVerified: true,
        twoFactorEnabled: user.twoFactorEnabled
      },
      session: {
        sessionId: session.sessionId,
        token: session.token,
        expiresAt: session.expiresAt
      }
    };
  }

  // Créer une session
  private async createSession(userId: number, ipAddress: string, userAgent: string): Promise<UserSession> {
    const sessionId = crypto.randomUUID();
    const token = jwt.sign(
      { userId, sessionId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const session = this.sessionRepository.create({
      idUser: userId,
      sessionId,
      token,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      lastActivity: new Date()
    });

    return this.sessionRepository.save(session);
  }

  // Tuer une session
  async killSession(sessionId: string, adminUserId?: number): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId },
      relations: ['user']
    });

    if (!session) {
      throw new BadRequestException('Session non trouvée');
    }

    await this.sessionRepository.update(sessionId, { isActive: false });

    // Tracer l'activité
    const description = adminUserId 
      ? `Session tuée par l'administrateur ${adminUserId}`
      : 'Session fermée par l\'utilisateur';
    
    await this.logActivity(
      session.idUser, 
      ActivityType.SESSION_KILLED, 
      description,
      session.ipAddress,
      session.userAgent,
      sessionId
    );
  }

  // Déconnecter un utilisateur (tuer toutes ses sessions)
  async logoutUser(userId: number): Promise<void> {
    await this.sessionRepository.update(
      { idUser: userId, isActive: true },
      { isActive: false }
    );

    await this.logActivity(userId, ActivityType.LOGOUT, 'Déconnexion de toutes les sessions');
  }

  // Déconnecter une session spécifique
  async logoutSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { sessionId, isActive: true },
      { isActive: false }
    );

    const session = await this.sessionRepository.findOne({ where: { sessionId } });
    if (session) {
      await this.logActivity(session.idUser, ActivityType.LOGOUT, `Déconnexion de la session ${sessionId}`);
    }
  }

  // Activer/désactiver la double authentification
  async toggleTwoFactor(userId: number, enable: boolean): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    if (enable) {
      const secret = crypto.randomBytes(32).toString('hex');
      await this.userRepository.update(userId, {
        twoFactorEnabled: true,
        twoFactorSecret: secret
      });
      await this.logActivity(userId, ActivityType.TWO_FACTOR_ENABLED, 'Double authentification activée');
    } else {
      await this.userRepository.update(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: undefined
      });
      await this.logActivity(userId, ActivityType.TWO_FACTOR_DISABLED, 'Double authentification désactivée');
    }
  }

  // Vérifier la double authentification et compléter la connexion
  async verifyTwoFactorAndCompleteLogin(userId: number, twoFactorCode: string, ipAddress: string, userAgent: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['role', 'agency']
    });
    
    const enable2FA = await this.settingService.get('ENABLE_SMS_2FA', 'true');
    if (!user || !user.twoFactorEnabled || enable2FA !== 'true') {
      throw new BadRequestException('Utilisateur non trouvé ou 2FA non activée/activable');
    }

    // Vérifier le code SMS
    if (user.smsToken !== twoFactorCode) {
      await this.logActivity(userId, ActivityType.LOGIN_FAILED, 'Code 2FA incorrect');
      throw new UnauthorizedException('Code de double authentification incorrect');
    }

    if (user.smsTokenExpires < new Date()) {
      await this.logActivity(userId, ActivityType.LOGIN_FAILED, 'Code 2FA expiré');
      throw new UnauthorizedException('Code de double authentification expiré');
    }

    // Créer la session maintenant que la 2FA est validée
    const session = await this.createSession(user.id, ipAddress, userAgent);
    
    // Nettoyer le token SMS
    await this.userRepository.update(user.id, {
      smsToken: undefined,
      smsTokenExpires: undefined
    });

    // Tracer la connexion réussie avec 2FA
    await this.logActivity(user.id, ActivityType.LOGIN, 'Connexion réussie avec double authentification');

    // Générer le token JWT avec sessionId
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role?.libelle,
        sessionId: session.sessionId  // ← Ajouter le sessionId
      },
      process.env.JWT_SECRET || 'secret-key-temp',
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        lastname: user.lastname,
        firstname: user.firstname,
        role: user.role?.libelle,
        agency: user.agency?.name
      },
      session: {
        id: session.id,
        token: session.token
      },
      jwtToken: token
    };
  }

  // Vérifier la double authentification (méthode simple)
  async verifyTwoFactor(userId: number, twoFactorCode: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) {
      return false;
    }

    // TODO: Implémenter la vérification TOTP
    // Pour l'instant, on simule avec un code fixe
    const isValid = twoFactorCode === '123456';
    
    if (isValid) {
      await this.logActivity(userId, ActivityType.LOGIN, 'Double authentification validée');
    }

    return isValid;
  }

  // Obtenir l'historique des activités d'un utilisateur
  async getUserActivities(userId: number, limit: number = 50): Promise<UserActivity[]> {
    return this.activityRepository.find({
      where: { idUser: userId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  // Obtenir toutes les sessions actives d'un utilisateur
  async getUserActiveSessions(userId: number): Promise<UserSession[]> {
    return this.sessionRepository.find({
      where: { idUser: userId, isActive: true },
      order: { lastActivity: 'DESC' }
    });
  }

  // Tracer une activité
  private async logActivity(
    userId: number, 
    activityType: ActivityType, 
    description: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    const activity = this.activityRepository.create({
      idUser: userId,
      activityType,
      description,
      ipAddress,
      userAgent,
      sessionId,
      metadata: {}
    });

    await this.activityRepository.save(activity);
  }

  // Changer le mot de passe de l'utilisateur connecté
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isOldPasswordValid = await bcrypt.compare(oldPassword + user.salt, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    // Valider le nouveau mot de passe
    if (newPassword.length < 8) {
      throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }

    // Générer un nouveau salt et hasher le nouveau mot de passe
    const newSalt = crypto.randomBytes(16).toString('hex');
    const hashedNewPassword = await bcrypt.hash(newPassword + newSalt, 10);

    // Mettre à jour le mot de passe et le salt
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
      salt: newSalt,
      updatedAt: new Date()
    });

    // Logger l'activité
    await this.logActivity(userId, ActivityType.PASSWORD_CHANGE, 'Mot de passe modifié avec succès');

    return true;
  }

  // Vérifier si un token est valide
  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const session = await this.sessionRepository.findOne({
        where: { sessionId: decoded.sessionId, isActive: true }
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      return this.userRepository.findOne({ where: { id: decoded.userId } });
    } catch {
      return null;
    }
  }

  // Méthodes pour l'envoi d'OTP après connexion
  async sendOTPAfterLogin(login: string, password: string): Promise<{ success: boolean; code?: string; message?: string }> {
    try {
      // Vérifier les identifiants
      const user = await this.userRepository.findOne({
        where: [
          { email: login },
          { phone: login }
        ],
        relations: ['role']
      });

      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      // Vérifier le mot de passe
      const passwordWithSalt = password + user.salt;
      const isPasswordValid = await bcrypt.compare(passwordWithSalt, user.password);
      
      if (!isPasswordValid) {
        return { success: false, message: 'Mot de passe incorrect' };
      }

      // Générer un code OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code et l'expiration
      user.smsToken = otpCode;
      user.smsTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      await this.userRepository.save(user);

      // Envoyer l'OTP par email
      console.log(`Code 2FA pour ${login}: ${otpCode}`);
      
      try {
        const emailResult = await this.emailService.sendVerificationCode(
          login, 
          otpCode, 
          user.firstname || 'Utilisateur'
        );
        
        if (emailResult.success) {
          console.log('✅ Email de vérification envoyé:', emailResult.messageId);
          return {
            success: true,
            message: 'Code de vérification envoyé par email'
          };
        } else {
          console.error('❌ Erreur envoi email:', emailResult.error);
          return {
            success: true, // On retourne success car le code est généré
            message: 'Code de vérification généré (email non envoyé)'
          };
        }
      } catch (error) {
        console.error('❌ Erreur service email:', error);
        return {
          success: true, // On retourne success car le code est généré
          message: 'Code de vérification généré (email non envoyé)'
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi OTP:', error);
      return { success: false, message: 'Erreur lors de l\'envoi du code' };
    }
  }

  async sendOTPAfterLoginSMS(login: string, password: string): Promise<{ success: boolean; code?: string; message?: string }> {
    try {
      // Vérifier les identifiants
      const user = await this.userRepository.findOne({
        where: [
          { email: login },
          { phone: login }
        ],
        relations: ['role']
      });

      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      // Vérifier le mot de passe
      const passwordWithSalt = password + user.salt;
      const isPasswordValid = await bcrypt.compare(passwordWithSalt, user.password);
      
      if (!isPasswordValid) {
        return { success: false, message: 'Mot de passe incorrect' };
      }

      // Générer un code OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code et l'expiration
      user.smsToken = otpCode;
      user.smsTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      await this.userRepository.save(user);

      // Envoyer l'OTP par SMS
      console.log(`Code 2FA SMS pour ${login}: ${otpCode}`);
      
      try {
        const smsResult = await this.smsService.sendOTPCode(
          user.phone, 
          otpCode, 
          user.firstname || 'Utilisateur'
        );
        
        if (smsResult.success) {
          console.log('✅ SMS de vérification envoyé:', smsResult.message);
          return {
            success: true,
            message: 'Code de vérification envoyé par SMS'
          };
        } else {
          console.error('❌ Erreur envoi SMS:', smsResult.message);
          return {
            success: true, // On retourne success car le code est généré
            message: 'Code de vérification généré (SMS non envoyé)'
          };
        }
      } catch (smsError) {
        console.error('❌ Erreur SMS:', smsError);
        return {
          success: true, // On retourne success car le code est généré
          message: 'Code de vérification généré (SMS non envoyé)'
        };
      }
    } catch (error) {
      console.error('Erreur sendOTPAfterLoginSMS:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }
}
