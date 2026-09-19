import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export enum UserPermission {
  // Permissions de lecture
  READ_USERS = 'users:read',
  READ_ROLES = 'roles:read',
  READ_ACTIVITIES = 'activities:read',
  READ_SESSIONS = 'sessions:read',
  
  // Permissions de gestion des utilisateurs
  CREATE_USER = 'users:create',
  UPDATE_USER = 'users:update',
  DELETE_USER = 'users:delete',
  DEACTIVATE_USER = 'users:deactivate',
  ACTIVATE_USER = 'users:activate',
  
  // Permissions de gestion des rôles
  MANAGE_ROLES = 'roles:manage',
  
  // Permissions d'administration
  ADMIN_ACCESS = 'admin:access',
  VIEW_LOGS = 'logs:view'
}

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const requiredPermissions = this.reflector.get<UserPermission[]>(
      'userPermissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true; // Aucune permission requise
    }

    const user = request['user'];
    console.log('🔒 UserAuthGuard: Vérification des permissions');
    console.log('🔒 UserAuthGuard: requiredPermissions =', requiredPermissions);
    console.log('🔒 UserAuthGuard: user =', user);
    
    if (!user) {
      console.log('❌ UserAuthGuard: Aucun utilisateur trouvé dans la requête');
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur a les permissions requises
    const hasPermission = this.checkUserPermissions(user, requiredPermissions);
    
    if (!hasPermission) {
      throw new ForbiddenException('Permissions insuffisantes pour cette action');
    }

    return true;
  }

  private checkUserPermissions(user: any, requiredPermissions: UserPermission[]): boolean {
    // Bloquer les utilisateurs désactivés
    if (user.status === 'DESACTIVE') {
      return false;
    }

    // Si l'utilisateur a idRole = 1 (ADMIN) ou idRole = 5 (SUPER ADMIN), il a toutes les permissions
    if (user.idRole === 1 || user.idRole === 5) {
      console.log('👑 Utilisateur avec rôle admin (idRole:', user.idRole, ') - toutes les permissions accordées');
      return true;
    }

    // Vérifier les permissions selon le rôle (libellé)
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    
    switch (userRole) {
      case 'ADMIN':
      case 'SUPER ADMIN':
      case 'SUPER_ADMIN':
        return true; // Toutes les permissions

      case 'MANAGER':
      case 'AGENCY MANAGER':
      case 'AGENCY_MANAGER':
      case 'USER':
      default:
        // Seuls ADMIN et SUPER ADMIN peuvent créer, modifier, désactiver/supprimer des utilisateurs.
        // Les Managers et Utilisateurs ont uniquement droit à la lecture (READ_USERS, READ_ROLES).
        return requiredPermissions.every(permission => 
          [UserPermission.READ_USERS, UserPermission.READ_ROLES].includes(permission)
        );
    }
  }
}

// Décorateur pour définir les permissions requises
export const RequireUserPermissions = (...permissions: UserPermission[]) => 
  Reflector.createDecorator<UserPermission[]>({
    key: 'userPermissions'
  })(permissions);
