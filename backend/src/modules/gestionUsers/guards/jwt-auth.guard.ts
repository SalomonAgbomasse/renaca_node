import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { UserSession } from '../entity/user-session.entity';
import { User } from '../entity/user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Essayer d'abord les cookies, puis le header Authorization
    let token = this.extractTokenFromCookie(request);
    
    if (!token) {
      console.log('⚠️ Pas de cookie, essai avec header Authorization...');
      token = this.extractTokenFromHeader(request);
    }
    
    if (!token) {
      console.log('❌ JwtAuthGuard: Aucun token trouvé (cookies ni header)');
      throw new UnauthorizedException('Token d\'authentification requis');
    }

    try {
      // Vérifier et décoder le token JWT
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret-key-temp') as any;
      
      console.log('🔐 JwtAuthGuard: Token JWT vérifié avec succès');
      console.log('🔐 JwtAuthGuard: Payload =', payload);
      
      // Vérifier si la session spécifique existe et est active en base de données
      const session = await this.sessionRepository.findOne({
        where: { 
          idUser: payload.userId,
          sessionId: payload.sessionId,  // ← Vérifier la session spécifique
          isActive: true
        }
      });

      // Vérifier que la session n'est pas expirée
      if (session && session.expiresAt < new Date()) {
        console.log('❌ JwtAuthGuard: Session expirée pour l\'utilisateur', payload.userId, 'sessionId:', payload.sessionId);
        throw new UnauthorizedException('Session expirée');
      }

      if (!session) {
        console.log('❌ JwtAuthGuard: Session inactive ou expirée pour l\'utilisateur', payload.userId, 'sessionId:', payload.sessionId);
        throw new UnauthorizedException('Session expirée ou invalide');
      }

      // Vérifier l'inactivité (8 heures - une journée de travail)
      const now = new Date();
      const lastActivity = new Date(session.lastActivity);
      const inactivityTimeout = 8 * 60 * 60 * 1000; // 8 heures en millisecondes
      
      if (now.getTime() - lastActivity.getTime() > inactivityTimeout) {
        console.log('⏰ JwtAuthGuard: Session inactive depuis plus de 8 heures');
        console.log('⏰ Dernière activité:', lastActivity.toISOString());
        console.log('⏰ Maintenant:', now.toISOString());
        console.log('⏰ Différence:', Math.round((now.getTime() - lastActivity.getTime()) / 60000), 'minutes');
        
        // Désactiver la session inactive
        await this.sessionRepository.update(session.id, { isActive: false });
        throw new UnauthorizedException('Session inactive depuis plus de 8 heures. Veuillez vous reconnecter.');
      }

      // Mettre à jour la dernière activité et renouveler l'expiration
      const newExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h à partir de maintenant
      
      await this.sessionRepository.update(session.id, {
        lastActivity: now,
        expiresAt: newExpiresAt
      });
      
      console.log('✅ JwtAuthGuard: Session renouvelée - dernière activité et expiration mises à jour');
      
      // Renouveler le cookie pour 8 heures supplémentaires
      const response = context.switchToHttp().getResponse();
      if (response && response.cookie) {
        response.cookie('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          maxAge: 8 * 60 * 60 * 1000, // 8 heures
          path: '/',
        });
        console.log('🍪 Cookie renouvelé pour 8 heures supplémentaires');
      }
      
      console.log('✅ JwtAuthGuard: Session active trouvée et mise à jour');
      
      // Récupérer l'utilisateur complet de la base de données avec ses relations
      const fullUser = await this.userRepository.findOne({ 
        where: { id: payload.userId },
        relations: ['role', 'agency'] // Charger les relations role et agency
      });
      
      if (!fullUser) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }
      
      console.log('👤 JwtAuthGuard: Utilisateur chargé avec relations:', {
        id: fullUser.id,
        role: fullUser.role,
        agency: fullUser.agency,
        idRole: fullUser.idRole,
        idAgency: fullUser.idAgency
      });
      
      // Injecter l'utilisateur complet dans la requête avec toutes les informations nécessaires
      request['user'] = {
        id: fullUser.id,
        email: fullUser.email,
        firstname: fullUser.firstname,
        lastname: fullUser.lastname,
        role: fullUser.role || payload.role, // Utiliser le rôle de la base avec libelle, sinon celui du payload
        idRole: fullUser.idRole,
        idAgency: fullUser.idAgency,
        agency: fullUser.agency ? {
          id: fullUser.agency.id,
          name: fullUser.agency.name
        } : null,
        sessionId: payload.sessionId,
        status: fullUser.status || 'ACTIVE'
      };
      
      return true;
    } catch (error) {
      console.log('❌ JwtAuthGuard: Erreur de vérification du token JWT:', error.message);
      throw new UnauthorizedException('Token d\'authentification invalide');
    }
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    console.log('🍪 Cookies reçus:', request.cookies);
    console.log('📋 Header Cookie brut:', request.headers.cookie);
    console.log('🔍 Recherche du cookie auth_token...');
    
    const token = request.cookies?.auth_token;
    if (token) {
      console.log('✅ Cookie auth_token trouvé:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ Cookie auth_token non trouvé');
      console.log('🔍 Cookies disponibles:', Object.keys(request.cookies || {}));
    }
    return token;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    console.log('🔑 Header Authorization:', authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('✅ Token Bearer trouvé:', token.substring(0, 20) + '...');
      return token;
    }
    
    console.log('❌ Pas de token Bearer dans les headers');
    return undefined;
  }
}
