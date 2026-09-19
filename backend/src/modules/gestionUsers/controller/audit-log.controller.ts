import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
  Param,
  DefaultValuePipe,
  ForbiddenException,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuditLogService } from '../../../services/audit-log.service';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import type { Request } from 'express';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseTransformInterceptor)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  private ensureAdmin(req: Request) {
    const user: any = req['user'];
    const roleId = user?.role?.id ?? user?.idRole;
    // Rôles administrateurs de FNDA: 1 (ADMIN) et 5 (SUPER ADMIN)
    if (!(roleId === 1 || roleId === 5)) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
  }

  /**
   * Récupère les logs d'audit de l'utilisateur connecté
   */
  @Get('my-logs')
  async getMyLogs(
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = req['user'];
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const result = await this.auditLogService.getUserLogs(
      user.id,
      limit,
      offset,
      start,
      end
    );

    return {
      message: 'Logs d\'audit récupérés avec succès',
      data: {
        logs: result.logs,
        total: result.total,
        limit,
        offset,
      },
    };
  }

  /**
   * Récupère les logs d'audit pour une session spécifique
   */
  @Get('session/:sessionId')
  async getSessionLogs(@Param('sessionId') sessionId: string) {
    const logs = await this.auditLogService.getSessionLogs(sessionId);

    return {
      message: 'Logs de session récupérés avec succès',
      data: logs,
    };
  }

  /**
   * Récupère tous les logs (admin seulement)
   */
  @Get('all')
  async getAllLogs(
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.ensureAdmin(req);
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const parsedUserId =
      userId != null && String(userId).trim() !== '' ? parseInt(String(userId), 10) : undefined;
    const finalUserId = Number.isFinite(parsedUserId as number) ? (parsedUserId as number) : undefined;

    const result = await this.auditLogService.getAllLogs(
      limit,
      offset,
      finalUserId,
      action,
      start,
      end
    );

    return {
      message: 'Tous les logs d\'audit récupérés avec succès',
      data: {
        logs: result.logs,
        total: result.total,
        limit,
        offset,
      },
    };
  }

  /**
   * Liste les fichiers journaliers (admin seulement)
   */
  @Get('files')
  async listAuditFiles(@Req() req: Request) {
    this.ensureAdmin(req);
    const files = this.auditLogService.listAuditFiles();
    return {
      message: 'Fichiers de logs d\'audit récupérés avec succès',
      data: { files },
    };
  }

  /**
   * Lit un fichier journalier (admin seulement)
   */
  @Get('files/:filename')
  async readAuditFile(
    @Req() req: Request,
    @Param('filename') filename: string,
    @Query('maxBytes', new DefaultValuePipe(500000), ParseIntPipe) maxBytes: number,
  ) {
    this.ensureAdmin(req);
    const file = this.auditLogService.readAuditFile(filename, maxBytes);
    return {
      message: 'Contenu du fichier de log récupéré avec succès',
      data: file,
    };
  }
}
