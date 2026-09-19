import { Controller, Post, Get, Put, Delete, Body, Param, ParseIntPipe, Req, Res, UseGuards, UseInterceptors, Query, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { UserService } from '../service/user.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserAuthGuard } from '../guards/user-auth.guard';
import { UserAuthInterceptor } from '../interceptors/user-auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import type { Request, Response } from 'express';

@Controller('auth')
@UseInterceptors(ResponseTransformInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  // Générer un token SMS
  @Post('sms/generate')
  async generateSmsToken(@Body() body: { emailOrPhone: string }) {
    const token = await this.authService.generateSmsToken(body.emailOrPhone);
    return {
      message: 'Token SMS généré et envoyé avec succès',
      token: {
        expiresIn: '10 minutes',
        sentTo: body.emailOrPhone
      }
    };
  }

  // Connexion classique avec email/mot de passe
  @Post('login')
  async login(
    @Body() body: { email?: string; identifier?: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Utiliser identifier ou email selon ce qui est fourni
    const loginIdentifier = body.identifier || body.email;
    
    if (!loginIdentifier) {
      throw new BadRequestException('Email ou identifiant requis');
    }

    const result = await this.authService.login(
      loginIdentifier,
      body.password,
      ipAddress,
      userAgent
    );

    // Si l'utilisateur a la 2FA activée, envoyer automatiquement l'OTP
    if (result.requiresTwoFactor) {
      // Détecter si c'est un email ou un téléphone
      const isEmail = loginIdentifier.includes('@');
      
      if (isEmail) {
        // Envoyer OTP par email
        const otpResult = await this.authService.sendOTPAfterLogin(loginIdentifier, body.password);
        if (otpResult.success) {
          return {
            message: 'Code de vérification envoyé par email',
            requiresTwoFactor: true,
            userId: result.user.id,
            twoFactorEnabled: true
          };
        }
      } else {
        // Envoyer OTP par SMS
        const otpResult = await this.authService.sendOTPAfterLoginSMS(loginIdentifier, body.password);
        if (otpResult.success) {
          return {
            message: 'Code de vérification envoyé par SMS',
            requiresTwoFactor: true,
            userId: result.user.id,
            twoFactorEnabled: true
          };
        }
      }
      
      // Si l'envoi échoue, retourner quand même l'info 2FA
      return {
        message: 'Double authentification requise',
        requiresTwoFactor: true,
        userId: result.user.id,
        twoFactorEnabled: true
      };
    }

    // CONNEXION NORMALE (sans 2FA) - Configurer le cookie ici aussi
    console.log('🔒 Connexion normale - Configuration du cookie');

    console.log('🔒 Session créée pour l\'utilisateur:', result.user.id);
    console.log('📤 SessionId:', result.session?.id);
    console.log('📤 JWT Token généré:', result.jwtToken ? 'OUI' : 'NON');

    // Configurer le cookie HttpOnly sécurisé pour le token (connexion normale)
    if (result.jwtToken) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      res.cookie('auth_token', result.jwtToken, {
        httpOnly: true,
        secure: isProduction, // HTTPS obligatoire en production
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 30 * 60 * 1000, // 30 minutes (renouvelé automatiquement)
        path: '/',
      });
      console.log(`🍪 Cookie auth_token configuré (${isProduction ? 'production' : 'développement'})`);
    }

    return {
      message: 'Connexion réussie',
      user: {
        id: result.user.id,
        firstname: result.user.firstname,
        lastname: result.user.lastname,
        email: result.user.email,
        role: result.user.role,
        agency: result.user.agency
      },
      sessionId: result.session?.id
      // Plus de token dans la réponse JSON - il est dans le cookie !
    };
  }

  // Vérifier le token SMS et se connecter
  @Post('sms/verify')
  async verifySmsTokenAndLogin(
    @Body() body: { emailOrPhone: string; smsToken: string },
    @Req() req: Request
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    const result = await this.authService.verifySmsTokenAndLogin(
      body.emailOrPhone,
      body.smsToken,
      ipAddress,
      userAgent
    );

    return {
      message: 'Connexion réussie avec vérification SMS',
      user: {
        id: result.user.id,
        firstname: result.user.firstname,
        lastname: result.user.lastname,
        email: result.user.email,
        role: result.user.role,
        agency: result.user.agency
      },
      token: result.session.token
    };
  }

  // Vérifier la double authentification après connexion
  @Post('two-factor/verify')
  async verifyTwoFactor(
    @Body() body: { userId: number; twoFactorCode: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    const result = await this.authService.verifyTwoFactorAndCompleteLogin(
      body.userId,
      body.twoFactorCode,
      ipAddress,
      userAgent
    );

    // Configurer le cookie HttpOnly sécurisé
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('auth_token', result.jwtToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS obligatoire en production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 60 * 1000, // 30 minutes (renouvelé automatiquement)
      path: '/',
    });

    console.log(`🔒 Cookie HttpOnly configuré pour la 2FA (${isProduction ? 'production' : 'développement'})`);

    return {
      message: 'Double authentification validée et connexion réussie',
      user: {
        id: result.user.id,
        firstname: result.user.firstname,
        lastname: result.user.lastname,
        email: result.user.email,
        role: result.user.role,
        agency: result.user.agency
      }
      // Plus de token dans la réponse JSON !
    };
  }


  // Endpoint de heartbeat pour maintenir la session active
  @Post('ping')
  @UseGuards(JwtAuthGuard)
  async ping(@Req() req: Request) {
    const user = req['user'];
    return {
      alive: true,
      userId: user?.id,
      timestamp: new Date().toISOString(),
      message: 'Session maintenue active'
    };
  }

  // Activer/désactiver la double authentification
  @Put('two-factor/:userId')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async toggleTwoFactor(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { enable: boolean }
  ) {
    const result = await this.authService.toggleTwoFactor(userId, body.enable);
    return {
      message: body.enable ? 'Double authentification activée avec succès' : 'Double authentification désactivée avec succès',
      twoFactorEnabled: body.enable,
      userId: userId
    };
  }

  // Déconnexion
  @Post('logout')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const userId = req['user']?.id;
    const sessionId = req['user']?.sessionId; // Extraire le sessionId du token
    
    if (sessionId) {
      // Déconnecter la session spécifique
      await this.authService.logoutSession(sessionId);
    } else if (userId) {
      // Fallback : déconnecter toutes les sessions de l'utilisateur
      await this.authService.logoutUser(userId);
    }

    // Supprimer le cookie HttpOnly
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    console.log('🔒 Cookie HttpOnly supprimé lors de la déconnexion');
    
    return {
      message: 'Déconnexion réussie',
      success: true
    };
  }

  // Rafraîchir le token
  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    // Cette méthode sera implémentée plus tard dans AuthService
    return {
      message: 'Fonctionnalité de rafraîchissement de token à implémenter',
      success: false
    };
  }

  // Vérifier la validité du token
  @Get('verify-token')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async verifyToken(@Req() req: Request) {
    console.log('🔍 verify-token appelé');
    console.log('🍪 Cookies reçus:', req.cookies);
    console.log('🔑 Cookie auth_token:', req.cookies?.auth_token ? 'PRÉSENT' : 'ABSENT');
    
    const user = req['user'];
    console.log('👤 Utilisateur authentifié:', user?.email);
    
    return {
      message: 'Token valide',
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        agency: user.agency
      },
      tokenValid: true
    };
  }

  // Obtenir les sessions actives d'un utilisateur
  @Get('sessions/:userId')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getUserSessions(@Param('userId', ParseIntPipe) userId: number) {
    const sessions = await this.authService.getUserActiveSessions(userId);
    return {
      message: `${sessions.length} session(s) active(s) trouvée(s)`,
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt
      }))
    };
  }

  // Déconnecter un utilisateur de toutes ses sessions
  @Delete('sessions/:userId')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async logoutUserFromAllSessions(@Param('userId', ParseIntPipe) userId: number) {
    await this.authService.logoutUser(userId);
    return {
      message: 'Utilisateur déconnecté de toutes ses sessions',
      userId: userId
    };
  }

  // Obtenir l'historique des activités d'un utilisateur
  @Get('activities/:userId')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getUserActivities(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit: string
  ) {
    const activities = await this.authService.getUserActivities(userId, parseInt(limit) || 50);
    return {
      message: `${activities.length} activité(s) récupérée(s)`,
      activities: activities.map(activity => ({
        id: activity.id,
        activityType: activity.activityType,
        description: activity.description,
        ipAddress: activity.ipAddress,
        createdAt: activity.createdAt
      }))
    };
  }

  // Réinitialiser le mot de passe oublié
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    // Cette méthode sera implémentée plus tard dans AuthService
    return {
      message: 'Fonctionnalité de mot de passe oublié à implémenter',
      email: body.email,
      success: false
    };
  }

  // Réinitialiser le mot de passe avec token
  @Post('reset-password-with-token')
  async resetPasswordWithToken(@Body() body: { token: string; newPassword: string }) {
    // Cette méthode sera implémentée plus tard dans AuthService
    return {
      message: 'Fonctionnalité de réinitialisation avec token à implémenter',
      success: false
    };
  }

  // Changer le mot de passe (utilisateur connecté)
  @Put('change-password')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async changePassword(
    @Req() req: Request,
    @Body() body: { current_password: string; new_password: string }
  ) {
    const userId = req['user']?.id;
    
    if (!userId) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    try {
      await this.authService.changePassword(userId, body.current_password, body.new_password);
      
      return {
        message: 'Mot de passe modifié avec succès',
        success: true
      };
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le profil de l'utilisateur connecté
  @Put('profile')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async updateProfile(
    @Req() req: Request,
    @Body() updateData: {
      firstname?: string;
      lastname?: string;
      email?: string;
      phone?: string;
      address?: string;
      birthdate?: string;
      gender?: string;
      fonction?: string;
    }
  ) {
    const userId = req['user']?.id;
    
    if (!userId) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    try {
      // Mettre à jour l'utilisateur
      const updatedUser = await this.userService.update(userId, updateData);
      
      if (!updatedUser) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Récupérer l'utilisateur complet avec ses relations
      const user = await this.userService.findOne(userId, {
        includeRole: true,
        includeAgency: true,
        includePermissions: false
      });

      // Supprimer les champs sensibles
      const { password, salt, smsToken, smsTokenExpires, twoFactorSecret, ...safeUser } = user!;
      
      // Construire l'objet utilisateur avec tous les champs nécessaires
      const userProfile = {
        id: safeUser.id,
        firstname: safeUser.firstname,
        lastname: safeUser.lastname,
        email: safeUser.email,
        address: safeUser.address,
        phone: safeUser.phone,
        birthdate: safeUser.birthdate,
        gender: safeUser.gender,
        fonction: safeUser.fonction,
        avatar: safeUser.avatar,
        status: safeUser.status,
        isVerified: safeUser.isVerified,
        twoFactorEnabled: safeUser.twoFactorEnabled,
        lastLogin: safeUser.lastLogin,
        createdAt: safeUser.createdAt,
        updatedAt: safeUser.updatedAt,
        idRole: safeUser.idRole,
        idAgency: safeUser.idAgency,
        role: safeUser.role,
        agency: safeUser.agency
      };
      
      return {
        message: 'Profil utilisateur mis à jour avec succès',
        user: userProfile
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtenir le profil de l'utilisateur connecté
  @Get('profile')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getProfile(@Req() req: Request) {
    const userId = req['user']?.id;
    
    if (!userId) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    try {
      // Récupérer l'utilisateur complet avec ses relations
      const user = await this.userService.findOne(userId, {
        includeRole: true,
        includeAgency: true,
        includePermissions: false
      });

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Log pour debug - voir tous les champs récupérés de la base
      console.log('🔍 Utilisateur récupéré de la base:', {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        address: user.address,
        phone: user.phone,
        birthdate: user.birthdate,
        gender: user.gender,
        fonction: user.fonction,
        avatar: user.avatar,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        role: user.role,
        agency: user.agency
      });

      // Supprimer les champs sensibles
      const { password, salt, smsToken, smsTokenExpires, twoFactorSecret, ...safeUser } = user!;
      
      // Construire l'objet utilisateur avec tous les champs nécessaires
      const userProfile = {
        id: safeUser.id,
        firstname: safeUser.firstname,
        lastname: safeUser.lastname,
        email: safeUser.email,
        address: safeUser.address,
        phone: safeUser.phone,
        birthdate: safeUser.birthdate,
        gender: safeUser.gender,
        fonction: safeUser.fonction,
        avatar: safeUser.avatar,
        status: safeUser.status,
        isVerified: safeUser.isVerified,
        twoFactorEnabled: safeUser.twoFactorEnabled,
        lastLogin: safeUser.lastLogin,
        createdAt: safeUser.createdAt,
        updatedAt: safeUser.updatedAt,
        idRole: safeUser.idRole,
        idAgency: safeUser.idAgency,
        role: safeUser.role,
        agency: safeUser.agency
      };
      
      return {
        message: 'Profil utilisateur récupéré avec succès',
        user: userProfile
      };
    } catch (error) {
      throw error;
    }
  }


  // Obtenir les statistiques de l'utilisateur
  @Get('profile/stats')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getUserStats(@Req() req: Request, @Query('days') days: string = '30') {
    const userId = req['user']?.id;
    const daysNum = parseInt(days, 10) || 30;
    
    try {
      // Récupérer les vraies statistiques de l'utilisateur
      const stats = await this.userService.getUserStatistics(userId, daysNum);
      
      return {
        message: 'Statistiques utilisateur récupérées avec succès',
        data: stats
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }

  // Obtenir les activités récentes
  @Get('profile/activities')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getProfileActivities(@Req() req: Request, @Query('limit') limit: string = '10', @Query('page') page: string = '1') {
    const userId = req['user']?.id;
    const limitNum = parseInt(limit, 10) || 10;
    const pageNum = parseInt(page, 10) || 1;
    
    // Simuler des activités pour l'instant
    const activities = Array.from({ length: limitNum }, (_, i) => ({
      id: i + 1,
      type: ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE'][Math.floor(Math.random() * 4)],
      description: `Activité ${i + 1}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      ipAddress: '192.168.1.1'
    }));
    
    return {
      message: 'Activités récupérées avec succès',
      activities,
      total: 50,
      page: pageNum,
      limit: limitNum,
      totalPages: 5
    };
  }

  // Obtenir les sessions actives
  @Get('profile/sessions')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getActiveSessions(@Req() req: Request) {
    const userId = req['user']?.id;
    
    // Simuler des sessions pour l'instant
    const sessions = [
      {
        id: 1,
        device: 'Chrome sur Windows',
        location: 'Paris, France',
        lastActivity: new Date().toISOString(),
        isCurrent: true
      },
      {
        id: 2,
        device: 'Safari sur iPhone',
        location: 'Lyon, France',
        lastActivity: new Date(Date.now() - 3600000).toISOString(),
        isCurrent: false
      }
    ];
    
    return {
      message: 'Sessions actives récupérées avec succès',
      sessions
    };
  }

  // Obtenir les statistiques de production
  @Get('profile/production-stats')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getProductionStats(@Req() req: Request) {
    const userId = req['user']?.id;
    
    // Simuler des statistiques de production
    return {
      message: 'Statistiques de production récupérées avec succès',
      stats: {
        contractsCreated: Math.floor(Math.random() * 50) + 10,
        contractsProcessed: Math.floor(Math.random() * 100) + 20,
        totalValue: Math.floor(Math.random() * 1000000) + 100000,
        thisMonth: Math.floor(Math.random() * 20) + 5
      }
    };
  }

  // Obtenir l'historique de sécurité
  @Get('profile/security-history')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getSecurityHistory(@Req() req: Request) {
    const userId = req['user']?.id;
    
    // Simuler l'historique de sécurité
    const history = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      action: ['PASSWORD_CHANGE', 'LOGIN', 'LOGOUT', 'PROFILE_UPDATE'][Math.floor(Math.random() * 4)],
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...'
    }));
    
    return {
      message: 'Historique de sécurité récupéré avec succès',
      history
    };
  }

  // Obtenir les statistiques de sécurité
  @Get('profile/security-stats')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getSecurityStats(@Req() req: Request) {
    const userId = req['user']?.id;
    
    // Simuler des statistiques de sécurité
    return {
      message: 'Statistiques de sécurité récupérées avec succès',
      stats: {
        passwordStrength: 4,
        twoFactorEnabled: false,
        lastPasswordChange: new Date(Date.now() - 30 * 86400000).toISOString(),
        failedLogins: 0,
        securityScore: 85
      }
    };
  }

  // Obtenir les paramètres de sécurité
  @Get('profile/security-settings')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getSecuritySettings(@Req() req: Request) {
    const userId = req['user']?.id;
    
    // Simuler les paramètres de sécurité
    return {
      message: 'Paramètres de sécurité récupérés avec succès',
      settings: {
        twoFactorEnabled: false,
        loginAlerts: true,
        passwordExpiry: 90,
        sessionTimeout: 30,
        allowedIPs: [],
        blockedIPs: []
      }
    };
  }

  // Obtenir les informations de sécurité de l'utilisateur
  @Get('security-info')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getSecurityInfo(@Req() req: Request) {
    const user = req['user'];
    return {
      message: 'Informations de sécurité récupérées',
      securityInfo: {
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: user.lastLogin,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil,
        isVerified: user.isVerified
      }
    };
  }

  // Contrats de l'utilisateur connecté (onglet Profil)
  @Get('profile/contracts')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getProfileContracts(@Req() req: Request, @Query('limit') limit: string = '200') {
    const userId = req['user']?.id;
    const limitNum = parseInt(limit, 10) || 200;
    try {
      const contracts = await this.userService.getUserContracts(userId, limitNum);
      return {
        message: 'Contrats récupérés avec succès',
        data: contracts,
        total: contracts.length
      };
    } catch (error) {
      console.error('Erreur profile/contracts:', error);
      return { message: 'Erreur', data: [], total: 0 };
    }
  }

  // Cotations de l'utilisateur connecté (onglet Profil)
  @Get('profile/cotations')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async getProfileCotations(@Req() req: Request, @Query('limit') limit: string = '200') {
    const userId = req['user']?.id;
    const limitNum = parseInt(limit, 10) || 200;
    try {
      const cotations = await this.userService.getUserCotations(userId, limitNum);
      return {
        message: 'Cotations récupérées avec succès',
        data: cotations,
        total: cotations.length
      };
    } catch (error) {
      console.error('Erreur profile/cotations:', error);
      return { message: 'Erreur', data: [], total: 0 };
    }
  }
}
