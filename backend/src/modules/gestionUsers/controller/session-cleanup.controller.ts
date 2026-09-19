import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SessionCleanupService } from '../service/session-cleanup.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('admin/sessions')
@UseGuards(JwtAuthGuard)
export class SessionCleanupController {
  constructor(private readonly sessionCleanupService: SessionCleanupService) {}

  // Forcer le nettoyage des sessions
  @Post('cleanup')
  async forceCleanup() {
    await this.sessionCleanupService.forceCleanup();
    return {
      message: 'Nettoyage des sessions forcé',
      success: true
    };
  }

  // Obtenir les statistiques des sessions
  @Get('stats')
  async getSessionStats() {
    const stats = await this.sessionCleanupService.getSessionStats();
    return {
      message: 'Statistiques des sessions',
      data: stats
    };
  }
}
