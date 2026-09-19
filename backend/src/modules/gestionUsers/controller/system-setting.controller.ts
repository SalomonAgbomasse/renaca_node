import { Controller, Get, Put, Body, UseGuards, UseInterceptors, ForbiddenException, Req } from '@nestjs/common';
import { Request } from 'express';
import { SystemSettingService } from '../service/system-setting.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserAuthGuard } from '../guards/user-auth.guard';
import { UserAuthInterceptor } from '../interceptors/user-auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('system-settings')
@UseGuards(JwtAuthGuard, UserAuthGuard)
@UseInterceptors(UserAuthInterceptor, ResponseTransformInterceptor)
export class SystemSettingController {
  constructor(private readonly settingService: SystemSettingService) {}

  /**
   * Vérifier que l'utilisateur connecté est bien un Administrateur
   */
  private checkAdmin(request: Request) {
    const user = request['user'];
    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    
    const roleLibelle = user.role?.libelle?.toUpperCase() || '';
    const isAdmin = ['ADMIN', 'SUPER ADMIN', 'ADMINISTRATEUR'].includes(roleLibelle);
    
    if (!isAdmin) {
      throw new ForbiddenException('Seuls les administrateurs peuvent modifier les paramètres système');
    }
  }

  /**
   * GET /api/users/settings
   * Récupérer tous les paramètres système
   */
  @Get()
  async getAllSettings(@Req() request: Request) {
    this.checkAdmin(request);
    const settings = await this.settingService.findAll();
    return {
      message: 'Paramètres système récupérés avec succès',
      settings
    };
  }

  /**
   * PUT /api/users/settings
   * Mettre à jour plusieurs paramètres système
   */
  @Put()
  async updateSettings(
    @Req() request: Request,
    @Body() settingsDto: Array<{ key: string; value: string }>,
  ) {
    this.checkAdmin(request);
    const updated = await this.settingService.updateMultiple(settingsDto);
    return {
      message: 'Paramètres système mis à jour avec succès',
      settings: updated
    };
  }
}
