import { Controller, Post, Get, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException, BadRequestException, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../service/user.service';
import { AuthService } from '../service/auth.service';
import { UserStatusGuard } from '../guards/user-status.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserAuthGuard } from '../guards/user-auth.guard';
import { UserAuthInterceptor } from '../interceptors/user-auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { User } from '../entity/user.entity';

@Controller('user-management')
@UseGuards(JwtAuthGuard, UserAuthGuard)
@UseInterceptors(UserAuthInterceptor, ResponseTransformInterceptor)
export class UserManagementController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  // Fonction utilitaire pour filtrer les champs sensibles
  private filterSensitiveFields(user: User): any {
    const { password, salt, smsToken, smsTokenExpires, twoFactorSecret, ...safeUser } = user;
    return safeUser;
  }

  // Désactiver un utilisateur
  @Put('deactivate/:id')
  async deactivateUser(@Param('id') id: string) {
    const user = await this.userService.deactivateUser(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return {
      message: 'Utilisateur désactivé avec succès',
      user: this.filterSensitiveFields(user)
    };
  }

  // Activer un utilisateur
  @Put('activate/:id')
  async activateUser(@Param('id') id: string) {
    const user = await this.userService.activateUser(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return {
      message: 'Utilisateur activé avec succès',
      user: this.filterSensitiveFields(user)
    };
  }

  // Suppression logique
  @Delete('soft-delete/:id')
  async softDeleteUser(
    @Param('id') id: string,
    @Body() body: { deletedBy: number }
  ) {
    await this.userService.softDeleteUser(id, body.deletedBy);
    return {
      message: 'Utilisateur supprimé logiquement avec succès',
      userId: id
    };
  }

  // Restaurer un utilisateur
  @Put('restore/:id')
  async restoreUser(@Param('id') id: string) {
    const user = await this.userService.restoreUser(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return {
      message: 'Utilisateur restauré avec succès',
      user: this.filterSensitiveFields(user)
    };
  }

  // Réinitialiser le mot de passe
  @Put('reset-password/:id')
  @UseGuards(UserStatusGuard)
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string }
  ) {
    try {
      await this.userService.resetPassword(id, body.newPassword);
      return {
        message: 'Mot de passe réinitialisé avec succès',
        userId: id
      };
    } catch (error: any) {
      if (error.message === 'Utilisateur non trouvé') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message || 'Impossible de réinitialiser le mot de passe');
    }
  }

  // Changer le mot de passe
  @Put('change-password/:id')
  @UseGuards(UserStatusGuard)
  async changePassword(
    @Param('id') id: string,
    @Body() body: { oldPassword: string; newPassword: string }
  ) {
    const success = await this.userService.changePassword(id, body.oldPassword, body.newPassword);
    if (!success) {
      throw new NotFoundException('Ancien mot de passe incorrect');
    }
    return {
      message: 'Mot de passe changé avec succès',
      userId: id
    };
  }

  // Vérifier le mot de passe
  @Post('verify-password/:id')
  async verifyPassword(
    @Param('id') id: string,
    @Body() body: { password: string }
  ) {
    const isValid = await this.userService.verifyPassword(id, body.password);
    return {
      message: isValid ? 'Mot de passe correct' : 'Mot de passe incorrect',
      isValid
    };
  }

  // Rechercher des utilisateurs
  @Get('search')
  async searchUsers(@Query('query') query: string) {
    const users = await this.userService.searchUsers(query);
    return {
      message: `${users.length} utilisateur(s) trouvé(s) pour la recherche "${query}"`,
      users: users.map(user => this.filterSensitiveFields(user))
    };
  }

  // Obtenir les utilisateurs par statut
  @Get('status/:status')
  async getUsersByStatus(@Param('status') status: string) {
    const users = await this.userService.getUsersByStatus(status);
    return {
      message: `${users.length} utilisateur(s) avec le statut "${status}"`,
      users: users.map(user => this.filterSensitiveFields(user))
    };
  }

  // Obtenir les utilisateurs supprimés
  @Get('deleted')
  async getDeletedUsers() {
    const users = await this.userService.getDeletedUsers();
    return {
      message: `${users.length} utilisateur(s) supprimé(s) trouvé(s)`,
      users: users.map(user => this.filterSensitiveFields(user))
    };
  }

  // Obtenir les statistiques des utilisateurs
  @Get('statistics')
  async getUserStatistics(@Req() request: Request) {
    const user = request['user'];
    // Pour les statistiques, on récupère tous les utilisateurs (sans pagination, limite élevée)
    const result = await this.userService.findAll(user?.idRole, user?.idAgency, 1, 10000);
    const allUsers = result.users;
    
    const activeUsers = allUsers.filter(user => user.status === 'ACTIVE');
    const inactiveUsers = allUsers.filter(user => user.status === 'DESACTIVE');
    const deletedUsers = await this.userService.getDeletedUsers();

    return {
      message: 'Statistiques des utilisateurs récupérées avec succès',
      statistics: {
        total: result.total,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
        deleted: deletedUsers.length
      }
    };
  }

  // Obtenir l'historique des connexions d'un utilisateur
  @Get(':id/login-history')
  async getUserLoginHistory(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer l'historique des connexions
    // Pour l'instant, on retourne des données simulées
    const loginHistory = [
      {
        id: 1,
        loginDate: user.lastLogin,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        success: true
      }
    ];

    return {
      message: `Historique des connexions de ${user.firstname} ${user.lastname}`,
      loginHistory
    };
  }

  // Obtenir les tentatives de connexion d'un utilisateur
  @Get(':id/login-attempts')
  async getUserLoginAttempts(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return {
      message: `Informations de connexion de ${user.firstname} ${user.lastname}`,
      loginInfo: {
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil,
        lastLogin: user.lastLogin,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled
      }
    };
  }

  // Verrouiller un utilisateur
  @Put('lock/:id')
  async lockUser(
    @Param('id') id: string,
    @Body() body?: { minutes?: number }
  ) {
    const minutes = body?.minutes || 1440; // 24 heures par défaut
    const user = await this.userService.lockUser(id, minutes);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return {
      message: 'Compte utilisateur verrouillé avec succès',
      user: this.filterSensitiveFields(user)
    };
  }

  // Déverrouiller un utilisateur
  @Put('unlock/:id')
  async unlockUser(@Param('id') id: string) {
    const user = await this.userService.unlockUser(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return {
      message: 'Compte utilisateur déverrouillé avec succès',
      user: this.filterSensitiveFields(user)
    };
  }

  // Réinitialiser les tentatives de connexion
  @Put('reset-login-attempts/:id')
  async resetLoginAttempts(@Param('id') id: string) {
    await this.userService.resetLoginAttempts(id);
    return {
      message: 'Tentatives de connexion réinitialisées avec succès',
      userId: id
    };
  }
}

