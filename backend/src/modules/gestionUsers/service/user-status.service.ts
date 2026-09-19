import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';

@Injectable()
export class UserStatusService {
  constructor(private readonly userService: UserService) {}

  /**
   * Vérifie si un utilisateur peut effectuer des actions d'authentification
   */
  async canAuthenticate(userId: number): Promise<boolean> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (user.status === 'DESACTIVE') {
      throw new UnauthorizedException('Compte désactivé. Contactez l\'administrateur.');
    }

    return true;
  }

  /**
   * Vérifie si un utilisateur peut modifier son mot de passe
   */
  async canChangePassword(userId: number): Promise<boolean> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (user.status === 'DESACTIVE') {
      throw new UnauthorizedException('Impossible de modifier le mot de passe d\'un compte désactivé');
    }

    return true;
  }

  /**
   * Vérifie si un utilisateur peut se connecter
   */
  async canLogin(userId: number): Promise<boolean> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (user.status === 'DESACTIVE') {
      throw new UnauthorizedException('Compte désactivé. Contactez l\'administrateur.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Compte temporairement verrouillé');
    }

    return true;
  }
}
