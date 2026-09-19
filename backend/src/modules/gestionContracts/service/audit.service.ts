import { Injectable } from '@nestjs/common';
import { Request } from 'express';

export interface AuditFields {
  createdBy?: number;
  updatedBy?: number;
  deletedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

@Injectable()
export class AuditService {
  /**
   * Prépare les champs d'audit pour la création
   */
  prepareCreateAudit(request: Request): Partial<AuditFields> {
    const user = request['user'];
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    return {
      createdBy: user.id,
      createdAt: new Date()
    };
  }

  /**
   * Prépare les champs d'audit pour la mise à jour
   */
  prepareUpdateAudit(request: Request): Partial<AuditFields> {
    const user = request['user'];
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    return {
      updatedBy: user.id,
      updatedAt: new Date()
    };
  }

  /**
   * Prépare les champs d'audit pour la suppression
   */
  prepareDeleteAudit(request: Request): Partial<AuditFields> {
    const user = request['user'];
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    return {
      deletedBy: user.id,
      deletedAt: new Date()
    };
  }

  /**
   * Prépare les champs d'audit pour la création avec agence
   */
  prepareCreateWithAgency(request: Request, agencyId?: number): Partial<AuditFields> {
    const user = request['user'];
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    return {
      createdBy: user.id,
      createdAt: new Date(),
      ...(agencyId && { idAgency: agencyId })
    };
  }

  /**
   * Prépare les champs d'audit pour la création avec utilisateur
   */
  prepareCreateWithUser(request: Request, userId?: number): Partial<AuditFields> {
    const user = request['user'];
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    return {
      createdBy: user.id,
      createdAt: new Date(),
      ...(userId && { idUser: userId })
    };
  }

  /**
   * Vérifie que l'utilisateur a accès à l'agence
   */
  canAccessAgency(request: Request, agencyId: number): boolean {
    const user = request['user'];
    if (!user) {
      return false;
    }

    // Administrateurs ont accès à toutes les agences
    if (user.role?.libelle === 'Administrateur') {
      return true;
    }

    // Utilisateurs normaux ont accès à leur agence
    return user.idAgency === agencyId;
  }

  /**
   * Vérifie que l'utilisateur peut modifier l'entité
   */
  canModifyEntity(request: Request, entityCreatedBy: number): boolean {
    const user = request['user'];
    if (!user) {
      return false;
    }

    // Administrateurs peuvent tout modifier
    if (user.role?.libelle === 'Administrateur') {
      return true;
    }

    // Utilisateurs peuvent modifier ce qu'ils ont créé
    return user.id === entityCreatedBy;
  }
}
