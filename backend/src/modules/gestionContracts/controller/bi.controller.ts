import { Controller, Get, Put, Query, Param, Body, Request, UseGuards, ParseIntPipe, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { BiService, BiFilters } from '../service/bi.service';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';

@Controller('bi')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
export class BiController {
  constructor(private readonly biService: BiService) {}

  private buildFilters(query: any, reqUser?: any): BiFilters {
    let agenceId = query.agenceId ? parseInt(query.agenceId, 10) : undefined;

    if (reqUser) {
      const role = (typeof reqUser.role === 'object' ? reqUser.role?.libelle : reqUser.role) || '';
      const roleUpper = role.toUpperCase();
      const isGlobalRole = ['ADMIN', 'SUPER ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(roleUpper) || reqUser.idRole === 1 || reqUser.idRole === 2 || reqUser.idRole === 5;

      // Si ce n'est pas un rôle global (ex: USER), restreindre à son agence uniquement !
      if (!isGlobalRole && reqUser.idAgency) {
        agenceId = reqUser.idAgency;
      }
    }

    return {
      dateDebut: query.dateDebut,
      dateFin: query.dateFin,
      agenceId: agenceId,
      userId: query.userId ? parseInt(query.userId, 10) : undefined,
      natureCreditId: query.natureCreditId ? parseInt(query.natureCreditId, 10) : undefined,
      contractType: query.contractType,
    };
  }

  // ─── Vue d'ensemble ───────────────────────────────────────────
  @Get('kpis-overview')
  @RequirePermissions(ContractPermission.BI_READ)
  async getKPIsOverview(@Query() query: any, @Request() req: any) {
    const filters = this.buildFilters(query, req.user);
    return {
      success: true,
      data: await this.biService.getKPIsOverview(filters, req.user),
    };
  }

  @Get('monthly-evolution')
  @RequirePermissions(ContractPermission.BI_READ)
  async getMonthlyEvolution(@Query() query: any, @Request() req: any) {
    const months = query.months ? parseInt(query.months, 10) : 12;
    const filters = this.buildFilters(query, req.user);
    return {
      success: true,
      data: await this.biService.getMonthlyEvolution(months, filters, req.user),
    };
  }

  // ─── Analyse Clients ──────────────────────────────────────────
  @Get('clients/segmentation')
  @RequirePermissions(ContractPermission.BI_READ)
  async getClientSegmentation(@Query() query: any, @Request() req: any) {
    const filters = this.buildFilters(query, req.user);
    const axe = (query.axe as 'age' | 'gender' | 'occupation' | 'capital') || 'gender';
    return {
      success: true,
      data: await this.biService.getClientSegmentation(axe, filters, req.user),
    };
  }

  // ─── Analyse Commerciale ─────────────────────────────────────
  @Get('commercial/agences')
  @RequirePermissions(ContractPermission.BI_READ)
  async getAgencesPerformance(@Query() query: any, @Request() req: any) {
    const filters = this.buildFilters(query, req.user);
    return {
      success: true,
      data: await this.biService.getAgencesPerformance(filters, req.user),
    };
  }

  @Get('commercial/conseillers')
  @RequirePermissions(ContractPermission.BI_READ)
  async getConseillersPerformance(@Query() query: any, @Request() req: any) {
    const filters = this.buildFilters(query, req.user);
    return {
      success: true,
      data: await this.biService.getConseillersPerformance(filters, req.user),
    };
  }

  @Get('commercial/nature-credit')
  @RequirePermissions(ContractPermission.BI_READ)
  async getNatureCreditAnalysis(@Query() query: any, @Request() req: any) {
    const filters = this.buildFilters(query, req.user);
    return {
      success: true,
      data: await this.biService.getNatureCreditAnalysis(filters, req.user),
    };
  }

  // ─── Insights & Alertes ───────────────────────────────────────
  @Get('insights')
  @RequirePermissions(ContractPermission.BI_READ)
  async getAutoInsights(@Request() req: any) {
    return {
      success: true,
      data: await this.biService.getAutoInsights(req.user),
    };
  }

  // ─── Seuils d'alerte (configurables) ─────────────────────────
  @Get('alert-thresholds')
  @RequirePermissions(ContractPermission.BI_READ)
  async getAlertThresholds() {
    return {
      success: true,
      data: await this.biService.getAlertThresholds(),
    };
  }

  @Put('alert-thresholds/:id')
  @RequirePermissions(ContractPermission.BI_READ)
  async updateAlertThreshold(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { thresholdValue?: number; severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; isActive?: boolean; comparisonPeriod?: string },
  ) {
    return {
      success: true,
      data: await this.biService.updateAlertThreshold(id, body),
    };
  }

  // ─── Export ───────────────────────────────────────────────────
  @Get('export')
  @RequirePermissions(ContractPermission.BI_READ)
  async getExportData(@Query() query: any, @Request() req: any) {
    const filters = this.buildFilters(query, req.user);
    const type = (query.type as 'contrats' | 'clients' | 'commercial') || 'contrats';
    return {
      success: true,
      data: await this.biService.getExportData(type, filters, req.user),
    };
  }

  @Get('export/excel')
  @RequirePermissions(ContractPermission.BI_READ)
  async exportExcel(
    @Query() query: any,
    @Request() req: any,
    @Res() res: Response
  ): Promise<void> {
    try {
      const filters = this.buildFilters(query, req.user);
      const type = query.type || 'overview';

      let excelBuffer: Buffer;
      const filename = `BI_Export_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      if (type === 'overview') {
        excelBuffer = await this.biService.exportOverviewExcel(filters, req.user);
      } else if (type === 'clients') {
        excelBuffer = await this.biService.exportClientsExcel(filters, req.user);
      } else if (type === 'commercial') {
        excelBuffer = await this.biService.exportCommercialExcel(filters, req.user);
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({ message: 'Type d\'export non supporté' });
        return;
      }

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      });

      res.send(excelBuffer);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel BI:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de l\'export Excel BI',
        error: error.message
      });
    }
  }

  @Get('export/pdf')
  @RequirePermissions(ContractPermission.BI_READ)
  async exportPdf(
    @Query() query: any,
    @Request() req: any,
    @Res() res: Response
  ): Promise<void> {
    try {
      const filters = this.buildFilters(query, req.user);
      const type = query.type || 'overview';

      let pdfBuffer: Buffer;
      const filename = `BI_Export_${type}_${new Date().toISOString().slice(0, 10)}.pdf`;

      if (type === 'overview') {
        pdfBuffer = await this.biService.exportOverviewPdf(filters, req.user);
      } else if (type === 'clients') {
        pdfBuffer = await this.biService.exportClientsPdf(filters, req.user);
      } else if (type === 'commercial') {
        pdfBuffer = await this.biService.exportCommercialPdf(filters, req.user);
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({ message: 'Type d\'export non supporté' });
        return;
      }

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF BI:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de l\'export PDF BI',
        error: error.message
      });
    }
  }
}
