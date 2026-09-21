import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException, Request, Req, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { CotationService } from '../service/cotation.service';
import { Cotation } from '../entity/cotation.entity';
import { UpdateCotationDto } from '../dto';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { QuotationService } from '../service/quotation.service';

@Controller('cotations')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class CotationController {
  constructor(
    private readonly cotationService: CotationService,
    private readonly quotationService: QuotationService
  ) {}

  /**
   * Endpoint pour créer une cotation RENACA (Amortissable ou Constant)
   */
  @Post('renaca')
  @RequirePermissions(ContractPermission.CREATE)
  async createRenacaCotation(@Body() cotationData: any, @Request() req: any): Promise<any> {
    console.log('🧮 Création de cotation RENACA:', cotationData);

    const user = req.user;

    if (!cotationData.capital) {
      return { error: true, message: 'Le capital est obligatoire' };
    }
    if (!cotationData.birthdate) {
      return { error: true, message: 'La date de naissance est obligatoire' };
    }
    if (!cotationData.duration) {
      return { error: true, message: 'La durée est obligatoire' };
    }
    if (!cotationData.idNatureCredit) {
      return { error: true, message: 'Le type de capital (nature de crédit) est obligatoire' };
    }

    try {
      const cotation = await this.cotationService.createCotationRenaca(
        cotationData,
        user.id,
        user.idAgency
      );

      return {
        error: false,
        puttc: cotation.puttc,
        pd: cotation.pd,
        surp: cotation.surp,
        acc: cotation.acc,
        primePE: (cotation as any).primePE,
        data: cotation
      };
    } catch (error) {
      console.error('Erreur lors de la création de la cotation RENACA:', error);
      return {
        error: true,
        message: error.message || 'Erreur lors de la création de la cotation RENACA'
      };
    }
  }

  /**
   * Endpoint pour calculer uniquement la prime RENACA sans créer de cotation
   */
  @Post('renaca/calculate')
  @RequirePermissions(ContractPermission.CREATE)
  async calculateRenacaPrimes(@Body() cotationData: any): Promise<any> {
    console.log('🧮 Calcul de la prime RENACA (sans insertion):', cotationData);

    if (!cotationData.capital) {
      return { code: 400, message: 'Le capital est obligatoire', error: true };
    }
    if (!cotationData.birthdate) {
      return { code: 400, message: 'La date de naissance est obligatoire', error: true };
    }
    if (!cotationData.duration) {
      return { code: 400, message: 'La durée est obligatoire', error: true };
    }

    try {
      const typeCapital = cotationData.typeCapital || await this.cotationService.resolveTypeCapital(cotationData.idNatureCredit);
      const primeData = await this.quotationService.primeRENACA(
        typeCapital,
        cotationData.capital,
        cotationData.birthdate,
        cotationData.duration,
        cotationData.perteEmploi,
        cotationData.tauxSurprime
      );

      if (primeData.error) {
        return { code: 400, message: primeData.message, error: true };
      }

      return { code: 200, message: 'Prime calculée avec succès', error: false, data: primeData };
    } catch (error) {
      console.error('Erreur lors du calcul de la prime RENACA:', error);
      return { code: 500, message: error.message || 'Erreur lors du calcul de la prime RENACA', error: true };
    }
  }


  @Get()
  @RequirePermissions(ContractPermission.READ)
  async findAll(
    @Req() request: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('my') my?: string,
  ): Promise<{ message: string; cotations: Cotation[]; pagination?: any }> {
    // Récupérer l'utilisateur connecté depuis la requête
    const user = request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    console.log('🔍 Utilisateur connecté:', {
      id: user.id,
      role: user.role,
      idRole: user.idRole,
      email: user.email,
      page: pageNum,
      limit: limitNum,
      search,
      my
    });

    // Récupérer les cotations selon le rôle de l'utilisateur avec pagination et filtres
    const result = await this.cotationService.findAllByUserRole(
      user.id,
      user.role,
      user.idRole,
      user.idAgency,
      pageNum,
      limitNum,
      search,
      my === '1' || my === 'true'
    );
    
    console.log(`📋 Cotations récupérées: ${result.cotations.length} sur ${result.total} (page ${result.page}/${result.totalPages}) pour l'utilisateur ${user.id}`);
    
    return {
      message: `Liste des ${result.cotations.length} cotations récupérée avec succès`,
      cotations: result.cotations,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() request: any
  ): Promise<{ message: string; cotation: Cotation }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cotation = await this.cotationService.findOne(id);
    if (!cotation) {
      throw new NotFoundException('Cotation non trouvée');
    }
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
    if (!isAdminOrManager && cotation.idUser !== user.id && cotation.idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à consulter cette cotation');
    }
    return {
      message: `Cotation "${cotation.reference}" récupérée avec succès`,
      cotation
    };
  }

  @Get('search/reference')
  async findByReference(
    @Query('reference') reference: string,
    @Req() request: any
  ): Promise<{ message: string; cotations: Cotation[] }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cotations = await this.cotationService.findByReference(reference);
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
    const filteredCotations = isAdminOrManager 
      ? cotations 
      : cotations.filter(c => c.idUser === user.id || c.idAgency === user.idAgency);
    return {
      message: `${filteredCotations.length} cotation(s) trouvée(s) avec la référence "${reference}"`,
      cotations: filteredCotations
    };
  }

  @Get('customer/:idCustomer')
  async findByCustomer(
    @Param('idCustomer', ParseIntPipe) idCustomer: number,
    @Req() request: any
  ): Promise<{ message: string; cotations: Cotation[] }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cotations = await this.cotationService.findByCustomer(idCustomer);
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
    const filteredCotations = isAdminOrManager 
      ? cotations 
      : cotations.filter(c => c.idUser === user.id || c.idAgency === user.idAgency);
    return {
      message: `${filteredCotations.length} cotation(s) trouvée(s) pour le client ${idCustomer}`,
      cotations: filteredCotations
    };
  }

  @Get('product/:idProduct')
  async findByProduct(
    @Param('idProduct', ParseIntPipe) idProduct: number,
    @Req() request: any
  ): Promise<{ message: string; cotations: Cotation[] }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cotations = await this.cotationService.findByProduct(idProduct);
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
    const filteredCotations = isAdminOrManager 
      ? cotations 
      : cotations.filter(c => c.idUser === user.id || c.idAgency === user.idAgency);
    return {
      message: `${filteredCotations.length} cotation(s) trouvée(s) pour le produit ${idProduct}`,
      cotations: filteredCotations
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() cotationData: UpdateCotationDto,
    @Req() request: any
  ): Promise<{ message: string; cotation: Cotation }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cotationObj = await this.cotationService.findOne(id);
    if (!cotationObj) {
      throw new NotFoundException('Cotation non trouvée');
    }
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
    if (!isAdminOrManager && cotationObj.idUser !== user.id && cotationObj.idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier cette cotation');
    }

    const cotation = await this.cotationService.update(id, cotationData as any);
    if (!cotation) {
      throw new NotFoundException('Cotation non trouvée');
    }
    return {
      message: `Cotation "${cotation.reference}" mise à jour avec succès`,
      cotation
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() request: any
  ): Promise<{ message: string; cotationId: any }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cotation = await this.cotationService.findOne(id);
    if (!cotation) {
      throw new NotFoundException('Cotation non trouvée');
    }
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
    if (!isAdminOrManager && cotation.idUser !== user.id && cotation.idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer cette cotation');
    }
    
    await this.cotationService.remove(id);
    return {
      message: `Cotation "${cotation.reference}" supprimée avec succès`,
      cotationId: id
    };
  }

  // Routes personnalisées
  @Get('statistics/summary')
  async getCotationStatistics(): Promise<{ message: string; statistics: any }> {
    const cotations = await this.cotationService.findAll();
    
    const statistics = {
      totalCotations: cotations.length,
      pendingCotations: cotations.filter(c => c.status === 'PENDING').length,
      acceptedCotations: cotations.filter(c => c.status === 'ACCEPTED').length,
      rejectedCotations: cotations.filter(c => c.status === 'REJECTED').length,
      averageAmount: cotations.length ? (cotations.reduce((sum, c) => sum + (c.amount || 0), 0) / cotations.length) : 0
    };
    
    return {
      message: 'Statistiques des cotations récupérées avec succès',
      statistics
    };
  }

  // Valider une cotation
  @Put(':id/validate')
  async validateCotation(
    @Param('id') id: string,
    @Req() request: any
  ): Promise<{ message: string; cotation: Cotation }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cotation = await this.cotationService.findOne(id);
    if (!cotation) {
      throw new NotFoundException('Cotation non trouvée');
    }
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
    if (!isAdminOrManager) {
      throw new ForbiddenException('Seuls les gestionnaires ou administrateurs peuvent valider une cotation');
    }

    const updatedCotation = await this.cotationService.update(id, { status: 'ACCEPTED' });
    
    if (!updatedCotation) {
      throw new NotFoundException('Erreur lors de la mise à jour de la cotation');
    }

    return {
      message: `Cotation "${cotation.reference}" validée avec succès`,
      cotation: updatedCotation
    };
  }

  // Rejeter une cotation
  @Put(':id/reject')
  async rejectCotation(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() request: any
  ): Promise<{ message: string; cotation: Cotation }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cotation = await this.cotationService.findOne(id);
    if (!cotation) {
      throw new NotFoundException('Cotation non trouvée');
    }
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
    if (!isAdminOrManager) {
      throw new ForbiddenException('Seuls les gestionnaires ou administrateurs peuvent rejeter une cotation');
    }

    const updatedCotation = await this.cotationService.update(id, { 
      status: 'REJECTED'
    });
    
    if (!updatedCotation) {
      throw new NotFoundException('Erreur lors de la mise à jour de la cotation');
    }

    return {
      message: `Cotation "${cotation.reference}" rejetée avec succès`,
      cotation: updatedCotation
    };
  }

  // Obtenir les cotations en attente
  @Get('pending/list')
  async getPendingCotations(): Promise<{ message: string; cotations: Cotation[] }> {
    const cotations = await this.cotationService.findAll();
    const pendingCotations = cotations.filter(c => c.status === 'PENDING');
    
    return {
      message: `${pendingCotations.length} cotation(s) en attente trouvée(s)`,
      cotations: pendingCotations
    };
  }

  // Obtenir l'historique des modifications d'une cotation
  @Get(':id/history')
  async getCotationHistory(
    @Param('id') id: string,
    @Req() request: any
  ): Promise<{ message: string; history: any[] }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cotation = await this.cotationService.findOne(id);
    if (!cotation) {
      throw new NotFoundException('Cotation non trouvée');
    }
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
    if (!isAdminOrManager && cotation.idUser !== user.id && cotation.idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à consulter l\'historique de cette cotation');
    }

    const history = [
      {
        id: 1,
        action: 'CREATED',
        description: 'Cotation créée',
        date: cotation.createdAt,
        user: 'Système'
      }
    ];

    return {
      message: `Historique de la cotation "${cotation.reference}" récupéré avec succès`,
      history
    };
  }
}
