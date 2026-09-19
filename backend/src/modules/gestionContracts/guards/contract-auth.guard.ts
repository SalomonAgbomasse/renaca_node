import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export enum ContractPermission {
  CREATE = 'contract:create',
  READ = 'contract:read',
  UPDATE = 'contract:update',
  DELETE = 'contract:delete',
  MANAGE_AGENCY = 'agency:manage',
  MANAGE_CUSTOMER = 'customer:manage',
  MANAGE_PRODUCT = 'product:manage',
  MANAGE_COTATION = 'cotation:manage',
  MANAGE_CONTRACT_STATE = 'contract_state:manage',
  BI_READ = 'bi:read'
}

@Injectable()
export class ContractAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const requiredPermissions = this.reflector.get<ContractPermission[]>(
      'permissions',
      context.getHandler()
    );

    console.log('🛡️ ContractAuthGuard - Permissions requises:', requiredPermissions);

    if (!requiredPermissions) {
      console.log('✅ ContractAuthGuard - Aucune permission requise, accès autorisé');
      return true; // Aucune permission requise
    }

    // TODO: Implémenter la vérification des permissions basée sur le rôle utilisateur
    // Pour l'instant, on simule une vérification basique
    
    const user = request['user']; // Sera défini par le guard d'authentification
    console.log('👤 ContractAuthGuard - Utilisateur:', user);
    
    if (!user) {
      console.log('❌ ContractAuthGuard - Utilisateur non authentifié');
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur a les permissions requises
    const hasPermission = this.checkUserPermissions(user, requiredPermissions);
    console.log('🔍 ContractAuthGuard - Permission accordée:', hasPermission);
    
    if (!hasPermission) {
      console.log('❌ ContractAuthGuard - Permissions insuffisantes');
      throw new ForbiddenException('Permissions insuffisantes pour cette action');
    }

    console.log('✅ ContractAuthGuard - Accès autorisé');
    return true;
  }

  private checkUserPermissions(user: any, requiredPermissions: ContractPermission[]): boolean {
    // Vérifier si l'utilisateur est actif
    if (user.status === 'DESACTIVE') {
      return false;
    }

    // Si l'utilisateur a le rôle ID = 1 (ADMIN) ou ID = 5 (SUPER ADMIN), il a toutes les permissions
    if (user.idRole === 1 || user.idRole === 5) {
      console.log('👑 Utilisateur avec rôle ID = 1 ou 5 - toutes les permissions accordées');
      return true;
    }

    // Vérifier les permissions spécifiques selon le rôle (basé sur le libellé)
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    
    switch (userRole) {
      case 'ADMIN':
      case 'SUPER ADMIN':
      case 'SUPER_ADMIN':
        return true; // Toutes les permissions
      case 'MANAGER':
      case 'AGENCY MANAGER':
      case 'AGENCY_MANAGER':
        return requiredPermissions.every(permission => 
          permission !== ContractPermission.MANAGE_AGENCY
        );
      case 'USER':
      default:
        // Pour les utilisateurs et autres rôles métier, autoriser la lecture, la création, la modification et le BI
        return requiredPermissions.every(permission => 
          [ContractPermission.READ, ContractPermission.CREATE, ContractPermission.UPDATE, ContractPermission.BI_READ].includes(permission)
        );
    }
  }
}

// Décorateur pour définir les permissions requises
export const RequirePermissions = (...permissions: ContractPermission[]) => 
  Reflector.createDecorator<ContractPermission[]>({
    key: 'permissions'
  })(permissions);
