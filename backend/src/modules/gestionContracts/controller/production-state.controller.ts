import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ProductionStateService } from '../service/production-state.service';
import { ContractService } from '../service/contract.service';
import { ContractStateService } from '../service/contract-state.service';
import { ExcelService } from '../../../services/excel.service';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { PdfService } from '../../../services/pdf.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('production_states')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class ProductionStateController {
  constructor(
    private readonly productionStateService: ProductionStateService,
    private readonly contractService: ContractService,
    private readonly contractStateService: ContractStateService,
    private readonly excelService: ExcelService,
    private readonly pdfService: PdfService
  ) {}

  /**
   * Valide l'existence et l'intégrité d'un fichier
   * @param filePath Chemin du fichier à valider
   * @returns true si le fichier existe et est valide, false sinon
   */
  private validateFileExists(filePath: string): boolean {
    try {
      if (!filePath) {
        console.log('❌ Aucun chemin de fichier fourni');
        return false;
      }

      // Construire le chemin complet du fichier
      const fullPath = path.join(process.cwd(), filePath);
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(fullPath)) {
        console.log(`❌ Fichier non trouvé: ${fullPath}`);
        return false;
      }

      // Vérifier que c'est bien un fichier (pas un dossier)
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        console.log(`❌ Le chemin ne pointe pas vers un fichier: ${fullPath}`);
        return false;
      }

      // Vérifier que le fichier n'est pas vide
      if (stats.size === 0) {
        console.log(`❌ Le fichier est vide: ${fullPath}`);
        return false;
      }

      // Vérifier que le fichier est lisible
      try {
        fs.accessSync(fullPath, fs.constants.R_OK);
      } catch (error) {
        console.log(`❌ Le fichier n'est pas lisible: ${fullPath}`);
        return false;
      }

      console.log(`✅ Fichier validé avec succès: ${fullPath} (${stats.size} bytes)`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la validation du fichier ${filePath}:`, error);
      return false;
    }
  }

  @Get()
  @RequirePermissions(ContractPermission.READ)
  async findAll(@Query() query: any): Promise<{ message: string; productionStates: any[]; pagination?: any }> {
    // Si des paramètres de filtrage sont fournis, utiliser la méthode de filtrage
    if (Object.keys(query).length > 0) {
      const { page = 1, limit = 15, ...filters } = query;
      console.log('🔍 Paramètres de recherche reçus:', filters);
      
      // Nettoyer les paramètres de recherche
      if (filters.search) {
        filters.search = filters.search.replace(/\/$/, ''); // Supprimer le / à la fin
        console.log('🔍 Terme de recherche nettoyé:', filters.search);
      }
      
      const result = await this.productionStateService.findWithFilters(filters, parseInt(page), parseInt(limit));
      
      return {
        message: `Liste des ${result.total} états de production récupérée avec succès`,
        productionStates: result.data,
        pagination: {
          currentPage: result.page,
          elementsPerPage: result.limit,
          totalElements: result.total,
          totalPages: result.totalPages
        }
      };
    }
    
    // Sinon, retourner tous les états sans pagination
    const productionStates = await this.productionStateService.findAll();
    return {
      message: `Liste des ${productionStates.length} états de production récupérée avec succès`,
      productionStates
    };
  }

  @Get('by-code/:code')
  @RequirePermissions(ContractPermission.READ)
  async findByCode(@Param('code') code: string): Promise<{ message: string; productionState: any }> {
    const productionState = await this.productionStateService.findByCode(code);
    if (!productionState) {
      throw new NotFoundException('État de production non trouvé');
    }
    return {
      message: `État de production récupéré avec succès`,
      productionState
    };
  }

  @Get('filtered')
  @RequirePermissions(ContractPermission.READ)
  async findWithFilters(@Query() query: any): Promise<{ message: string; productionStates: any[]; pagination: any }> {
    const { page = 1, limit = 15, ...filters } = query;
    const result = await this.productionStateService.findWithFilters(filters, parseInt(page), parseInt(limit));
    
    return {
      message: `Liste filtrée des ${result.total} états de production récupérée avec succès`,
      productionStates: result.data,
      pagination: {
        currentPage: result.page,
        elementsPerPage: result.limit,
        totalElements: result.total,
        totalPages: result.totalPages
      }
    };
  }

  @Get('by-status/:status')
  @RequirePermissions(ContractPermission.READ)
  async findByStatus(@Param('status') status: string): Promise<{ message: string; productionStates: any[] }> {
    const productionStates = await this.productionStateService.findByStatus(status);
    return {
      message: `Liste des ${productionStates.length} états de production avec le statut ${status} récupérée avec succès`,
      productionStates
    };
  }

  private parseIds(val?: any): number[] | undefined {
    if (!val) return undefined;
    if (Array.isArray(val)) {
      const parsed = val.map(v => parseInt(v)).filter(v => !isNaN(v));
      return parsed.length > 0 ? parsed : undefined;
    }
    if (typeof val === 'string') {
      const parsed = val.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      return parsed.length > 0 ? parsed : undefined;
    }
    if (typeof val === 'number') return [val];
    return undefined;
  }

  private parseNatureIds(val?: any): number[] | undefined {
    return this.parseIds(val);
  }

  @Get('preview')
  @RequirePermissions(ContractPermission.READ)
  async getPreviewData(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('idAgency') idAgency?: string,
    @Query('idAgencies') idAgencies?: string,
    @Query('idUser') idUser?: string,
    @Query('idNatureCredit') idNatureCredit?: string,
    @Query('idNatureCredits') idNatureCredits?: string
  ): Promise<{ 
    message: string; 
    contracts: any[];
    summary: {
      totalContracts: number;
      totalCapital: number;
      totalPrimeTTC: number;
    };
  }> {
    const natureIds = this.parseIds(idNatureCredits || idNatureCredit);
    const agencyIds = this.parseIds(idAgencies || idAgency);
    console.log('📊 [Preview] Appel de getPreviewData avec:', { startDate, endDate, agencyIds, idUser, natureIds });
    try {
      if (!startDate || !endDate) {
        console.error('❌ [Preview] Dates manquantes');
        throw new BadRequestException('Les dates de début et de fin sont obligatoires');
      }

      console.log('📊 [Preview] Récupération des contrats...');
      // Récupérer les contrats selon les critères
      const contracts = await this.contractService.findByPeriodAndFilters(
        new Date(startDate),
        new Date(endDate),
        agencyIds,
        idUser ? parseInt(idUser) : undefined,
        natureIds
      );

      console.log(`📊 [Preview] ${contracts.length} contrat(s) récupéré(s)`);

      // Calculer le résumé
      const summary = {
        totalContracts: contracts.length,
        totalCapital: contracts.reduce((sum, c) => sum + (Number(c.capital) || 0), 0),
        totalPrimeTTC: contracts.reduce((sum, c) => sum + (Number(c.puttc) || 0), 0)
      };

      console.log('📊 [Preview] Résumé calculé:', summary);

      return {
        message: `${contracts.length} contrat(s) trouvé(s) pour cette période`,
        contracts,
        summary
      };
    } catch (error: any) {
      console.error('❌ [Preview] Erreur lors de la récupération des données de prévisualisation:', error);
      console.error('❌ [Preview] Stack:', error.stack);
      throw new BadRequestException(
        error.message || 'Erreur lors de la récupération des données de prévisualisation'
      );
    }
  }

  @Get(':id')
  @RequirePermissions(ContractPermission.READ)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; productionState: any }> {
    const productionState = await this.productionStateService.findOne(id);
    if (!productionState) {
      throw new NotFoundException('État de production non trouvé');
    }
    return {
      message: `État de production récupéré avec succès`,
      productionState
    };
  }

  @Post()
  @RequirePermissions(ContractPermission.CREATE)
  async create(@Body() productionStateData: any): Promise<{ message: string; productionState: any }> {
    // Vérifier si un chemin de fichier est fourni
    if (productionStateData.filePath) {
      // Valider que le fichier existe et est valide avant de créer l'enregistrement
      const isFileValid = this.validateFileExists(productionStateData.filePath);
      
      if (!isFileValid) {
        throw new BadRequestException(
          'Le fichier spécifié n\'existe pas, est vide ou n\'est pas accessible. Veuillez vous assurer que le fichier a été correctement généré avant de créer l\'état de production.'
        );
      }
      
      console.log('✅ Fichier validé avant création de l\'état de production');
    }

    const productionState = await this.productionStateService.create(productionStateData);
    return {
      message: `État de production créé avec succès`,
      productionState
    };
  }

  @Post('generate-excel')
  @RequirePermissions(ContractPermission.CREATE)
  async generateExcelReport(
    @Body() requestData: {
      startDate: string;
      endDate: string;
      idAgency?: any;
      idAgencies?: any;
      idUser?: number;
      idNatureCredit?: any;
      idNatureCredits?: any;
    }
  ): Promise<{ message: string; productionState: any; filePath: string }> {
    try {
      const natureIds = this.parseIds(requestData.idNatureCredits || requestData.idNatureCredit);
      const agencyIds = this.parseIds(requestData.idAgencies || requestData.idAgency);
      console.log('📊 Génération du rapport de production Excel...');
      console.log('📅 Période:', requestData.startDate, 'au', requestData.endDate);
      console.log('🏢 Agence(s):', agencyIds || 'Toutes');
      console.log('👤 Utilisateur:', requestData.idUser || 'Tous');
      console.log('💳 Natures de Crédit:', natureIds || 'Toutes');

      // Récupérer les contrats selon les critères
      const contracts = await this.contractService.findByPeriodAndFilters(
        new Date(requestData.startDate),
        new Date(requestData.endDate),
        agencyIds,
        requestData.idUser,
        natureIds
      );
      console.log('body recu pour la generation du rapport', requestData);
      console.log('contracts', contracts);

      console.log(`📋 ${contracts.length} contrats trouvés pour la période`);

      // Récupérer les états des contrats
      const contractStates = await this.contractStateService.findAll();

      // Récupérer les utilisateurs uniques
      const userIds = [...new Set(contracts.map(c => c.user?.id).filter(Boolean))];
      const users = await this.contractService.findUsersByIds(userIds);

      // Préparer les données pour le rapport
      const reportData = {
        contracts,
        contractStates,
        users,
        period: {
          startDate: new Date(requestData.startDate).toLocaleDateString('fr-FR'),
          endDate: new Date(requestData.endDate).toLocaleDateString('fr-FR')
        }
      };

      // Créer d'abord l'état de production en base
      const productionStateData = {
        idAgency: requestData.idAgency || null, // null pour toutes les agences
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        generatedBy: requestData.idUser || 1,
        status: 'processing'
      };

      const productionState = await this.productionStateService.create(productionStateData);

      // Générer le fichier Excel avec sauvegarde
      const { buffer, filePath } = await this.excelService.generateProductionReport(reportData, productionState.id);

      // Calculer les statistiques avec logs détaillés
      console.log('📊 Analyse des contrats:');
      contracts.forEach((contract, index) => {
        console.log(`Contrat ${index + 1}:`);
        console.log(`  - ID: ${contract.id}`);
        console.log(`  - Capital brut: ${contract.capital} (type: ${typeof contract.capital})`);
        console.log(`  - Capital converti: ${Number(contract.capital || 0)} (type: ${typeof Number(contract.capital || 0)})`);
        console.log(`  - Prime TTC: ${contract.puttc} (type: ${typeof contract.puttc})`);
        console.log(`  - Prime TTC convertie: ${Number(contract.puttc || 0)} (type: ${typeof Number(contract.puttc || 0)})`);
        console.log('---');
      });
      
      const totalCapital = contracts.reduce((sum, c) => {
        // Essayer différentes méthodes de conversion
        let capitalValue = 0;
        if (c.capital) {
          if (typeof c.capital === 'string') {
            // Si c'est une chaîne, essayer parseInt d'abord
            capitalValue = parseInt(c.capital, 10);
            if (isNaN(capitalValue)) {
              // Si parseInt échoue, essayer parseFloat
              capitalValue = parseFloat(c.capital);
              if (isNaN(capitalValue)) {
                capitalValue = 0;
              }
            }
          } else {
            capitalValue = Number(c.capital);
          }
        }
        console.log(`Ajout: ${sum} + ${capitalValue} (brut: ${c.capital}) = ${sum + capitalValue}`);
        return sum + capitalValue;
      }, 0);
      
      const totalPrimeTTC = contracts.reduce((sum, c) => {
        let puttcValue = 0;
        if (c.puttc) {
          if (typeof c.puttc === 'string') {
            puttcValue = parseInt(c.puttc, 10);
            if (isNaN(puttcValue)) {
              puttcValue = parseFloat(c.puttc);
              if (isNaN(puttcValue)) {
                puttcValue = 0;
              }
            }
          } else {
            puttcValue = Number(c.puttc);
          }
        }
        return sum + puttcValue;
      }, 0);
      
      console.log('📊 Résultats finaux:');
      console.log(`- Nombre de contrats: ${contracts.length}`);
      console.log(`- Capital total: ${totalCapital} (type: ${typeof totalCapital})`);
      console.log(`- Prime TTC totale: ${totalPrimeTTC} (type: ${typeof totalPrimeTTC})`);
      console.log(`- Capital moyen: ${contracts.length > 0 ? Math.round(totalCapital / contracts.length) : 0}`);
      console.log(`- Prime TTC moyenne: ${contracts.length > 0 ? Math.round(totalPrimeTTC / contracts.length) : 0}`);

      // Mettre à jour l'état de production avec le chemin du fichier
      const updatedProductionState = await this.productionStateService.update(productionState.id, {
        filePath,
        status: 'completed',
        summary: {
          totalContracts: contracts.length,
          totalCapital: totalCapital,
          totalPrimeTTC: totalPrimeTTC,
          avgCapital: contracts.length > 0 ? Math.round(totalCapital / contracts.length) : 0,
          avgPrimeTTC: contracts.length > 0 ? Math.round(totalPrimeTTC / contracts.length) : 0,
          contractsByUser: contracts.reduce((acc, c) => {
            const userId = c.user?.id?.toString() || 'unknown';
            acc[userId] = (acc[userId] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number }),
          contractsByOption: contracts.reduce((acc, c) => {
            const option = c.idNatureCredit?.toString() || 'unknown';
            acc[option] = (acc[option] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number })
        }
      });

      console.log(`✅ Rapport Excel généré avec succès: ${filePath}`);

      return {
        message: `Rapport de production généré avec succès. ${contracts.length} contrats traités.`,
        productionState: updatedProductionState,
        filePath
      };
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
      
      // Marquer l'état comme échoué si un état a été créé
      if (requestData.startDate && requestData.endDate) {
        try {
          const failedState = await this.productionStateService.create({
            idAgency: requestData.idAgency || 1,
            startDate: requestData.startDate,
            endDate: requestData.endDate,
            generatedBy: requestData.idUser || 1,
            status: 'failed',
            errorMessage: error.message
          });
        } catch (updateError) {
          console.error('❌ Erreur lors de la mise à jour du statut:', updateError);
        }
      }

      throw new BadRequestException(
        `Erreur lors de la génération du rapport: ${error.message}`
      );
    }
  }

  @Get('report/pdf')
  @RequirePermissions(ContractPermission.READ)
  async generatePdfReport(
    @Res() res: Response,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('idAgency') idAgency?: string,
    @Query('idAgencies') idAgencies?: string,
    @Query('idUser') idUser?: string,
    @Query('idNatureCredit') idNatureCredit?: string,
    @Query('idNatureCredits') idNatureCredits?: string
  ): Promise<void> {
    const natureIds = this.parseIds(idNatureCredits || idNatureCredit);
    const agencyIds = this.parseIds(idAgencies || idAgency);
    console.log('📄 ========== ROUTE PDF APPELÉE ==========');
    console.log('📄 ========== DÉBUT GÉNÉRATION PDF ==========');
    console.log('📄 Paramètres reçus:', { startDate, endDate, agencyIds, idUser, natureIds });
    
    try {
      if (!startDate || !endDate) {
        console.log('❌ Dates manquantes');
        res.status(HttpStatus.BAD_REQUEST).json({ 
          message: 'Les dates de début et de fin sont obligatoires' 
        });
        return;
      }
      
      console.log('✅ Dates validées:', { startDate, endDate });

      // Récupérer les contrats selon les critères
      const contracts = await this.contractService.findByPeriodAndFilters(
        new Date(startDate),
        new Date(endDate),
        agencyIds,
        idUser ? parseInt(idUser) : undefined,
        natureIds
      );

      console.log(`📊 ${contracts.length} contrats récupérés pour le PDF`);
      
      if (contracts.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          message: 'Aucun contrat trouvé pour cette période' 
        });
        return;
      }

      // Préparer les données pour le template
      const templateData = {
        contracts: contracts.map(c => ({
          ...c,
          customer: c.customer || null,
          agency: c.agency || null,
          user: c.user || null,
          contractState: c.contractState || null
        })),
        period: {
          startDate: new Date(startDate).toLocaleDateString('fr-FR'),
          endDate: new Date(endDate).toLocaleDateString('fr-FR')
        },
        summary: {
          totalContracts: contracts.length,
          totalCapital: contracts.reduce((sum, c) => sum + (Number(c.capital) || 0), 0),
          totalPrimeTTC: contracts.reduce((sum, c) => sum + (Number(c.puttc) || 0), 0)
        }
      };

      console.log('📄 Génération du PDF avec template production-state...');
      console.log('📄 Nombre de contrats:', templateData.contracts.length);
      console.log('📄 Résumé:', templateData.summary);

      // Générer le PDF sans en-tête
      console.log('📄 Appel de generatePdfWithoutHeader...');
      const pdfBuffer = await this.pdfService.generatePdfWithoutHeader(
        'production-state',
        templateData,
        {
          format: 'A4',
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm'
          }
        }
      );

      console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length, 'bytes');

      // Configurer les headers pour le téléchargement
      const filename = `Rapport_Production_${startDate}_${endDate}.pdf`;
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      console.log('📄 Envoi du PDF au client...');
      // Envoyer le PDF
      res.send(pdfBuffer);
      console.log('✅ PDF envoyé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      console.error('❌ Stack trace:', error.stack);
      
      // Si c'est une erreur 400 (Bad Request), renvoyer 400, sinon 500
      if (error.message && error.message.includes('Template not found')) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Template PDF non trouvé',
          error: error.message
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Erreur lors de la génération du PDF',
          error: error.message
        });
      }
    }
  }

  @Put(':id')
  @RequirePermissions(ContractPermission.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() productionStateData: any
  ): Promise<{ message: string; productionState: any }> {
    // Vérifier si un nouveau chemin de fichier est fourni
    if (productionStateData.filePath) {
      // Valider que le fichier existe et est valide avant de mettre à jour l'enregistrement
      const isFileValid = this.validateFileExists(productionStateData.filePath);
      
      if (!isFileValid) {
        throw new BadRequestException(
          'Le fichier spécifié n\'existe pas, est vide ou n\'est pas accessible. Veuillez vous assurer que le fichier a été correctement généré avant de mettre à jour l\'état de production.'
        );
      }
      
      console.log('✅ Fichier validé avant mise à jour de l\'état de production');
    }

    const productionState = await this.productionStateService.update(id, productionStateData);
    if (!productionState) {
      throw new NotFoundException('État de production non trouvé');
    }
    return {
      message: `État de production mis à jour avec succès`,
      productionState
    };
  }

  @Delete(':id')
  @RequirePermissions(ContractPermission.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; productionStateId: number }> {
    const productionState = await this.productionStateService.findOne(id);
    if (!productionState) {
      throw new NotFoundException('État de production non trouvé');
    }
    
    await this.productionStateService.remove(id);
    return {
      message: `État de production supprimé avec succès`,
      productionStateId: id
    };
  }


  @Get(':id/download')
  @RequirePermissions(ContractPermission.READ)
  async downloadFile(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
    const productionState = await this.productionStateService.findOne(id);
    if (!productionState) {
      throw new NotFoundException('État de production non trouvé');
    }

    if (!productionState.filePath) {
      throw new NotFoundException('Aucun fichier disponible pour ce rapport');
    }

    try {
      // Construire le chemin complet du fichier
      const filePath = path.join(process.cwd(), productionState.filePath);
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Fichier non trouvé sur le serveur');
      }

      // Lire le fichier
      const fileBuffer = fs.readFileSync(filePath);
      
      // Configurer les headers pour le téléchargement
      const filename = `rapport_production_${productionState.code}.xlsx`;
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      });

      // Envoyer le fichier
      res.send(fileBuffer);
      
      console.log(`📥 Fichier téléchargé: ${filename}`);
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors du téléchargement du fichier',
        error: error.message
      });
    }
  }
}
