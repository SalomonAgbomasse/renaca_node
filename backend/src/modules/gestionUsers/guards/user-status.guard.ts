import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserStatusService } from '../service/user-status.service';

@Injectable()
export class UserStatusGuard implements CanActivate {
  constructor(private readonly userStatusService: UserStatusService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.params.id || request.body.userId;

    if (!userId) {
      throw new UnauthorizedException('ID utilisateur requis');
    }

    // Vérifier que l'utilisateur peut effectuer des actions d'authentification
    await this.userStatusService.canAuthenticate(parseInt(userId));
    
    return true;
  }
}
