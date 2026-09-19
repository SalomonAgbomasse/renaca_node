import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException, Req } from '@nestjs/common';
import { Request } from 'express';
import { AgencyService } from '../service/agency.service';
import { Agency } from '../entity/agency.entity';
import { CreateAgencyDto, UpdateAgencyDto } from '../dto';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('agencies')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Get()
  @RequirePermissions(ContractPermission.READ)
  async findAll(
    @Req() request: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<{ 
    message: string; 
    agencies: Agency[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const user = request['user'];
    if (!user) {
      throw new NotFoundException('Utilisateur non authentifié');
    }

    // Paramètres de pagination avec valeurs par défaut
    const pageNum = page ? parseInt(page, 10) : 1;
    let limitNum = 10;
    if (limit) {
      if (limit === 'all') {
        limitNum = -1;
      } else {
        limitNum = parseInt(limit, 10);
      }
    }

    console.log('🔍 AgencyController.findAll - Utilisateur connecté:', {
      id: user.id,
      idRole: user.idRole,
      idAgency: user.idAgency,
      email: user.email,
      page: pageNum,
      limit: limitNum
    });

    // Récupérer les agences selon le rôle et l'agence avec pagination
    const result = await this.agencyService.findAll(user.idRole, user.idAgency, pageNum, limitNum);
    
    console.log(`📋 Agences récupérées: ${result.agencies.length} sur ${result.total} (page ${result.page}/${result.totalPages})`);
    
    return {
      message: `Liste des ${result.agencies.length} agences récupérée avec succès`,
      agencies: result.agencies,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{ message: string; agency: Agency }> {
    const agency = await this.agencyService.findOne(id);
    if (!agency) {
      throw new NotFoundException('Agence non trouvée');
    }
    return {
      message: `Agence "${agency.name}" récupérée avec succès`,
      agency
    };
  }

  @Get('search/name')
  async findByName(@Query('name') name: string): Promise<{ message: string; agencies: Agency[] }> {
    const agencies = await this.agencyService.findByName(name);
    return {
      message: `${agencies.length} agence(s) trouvée(s) avec le nom "${name}"`,
      agencies
    };
  }

  @Get('search/email')
  async findByEmail(@Query('email') email: string): Promise<{ message: string; agency: Agency | null }> {
    const agency = await this.agencyService.findByEmail(email);
    if (!agency) {
      return {
        message: `Aucune agence trouvée avec l'email "${email}"`,
        agency: null
      };
    }
    return {
      message: `Agence trouvée avec l'email "${email}"`,
      agency
    };
  }

  @Post()
  @RequirePermissions(ContractPermission.MANAGE_AGENCY)
  async create(@Body() agencyData: CreateAgencyDto): Promise<{ message: string; agency: Agency }> {
    const agency = await this.agencyService.create(agencyData);
    return {
      message: `Agence "${agency.name}" créée avec succès`,
      agency
    };
  }

  @Post('bulk-create')
  @RequirePermissions(ContractPermission.MANAGE_AGENCY)
  async createMultiple(@Body() agenciesData: CreateAgencyDto[]): Promise<{ message: string; agencies: Agency[] }> {
    try {
      console.log(`🚀 [Controller] Début de création en masse de ${agenciesData.length} agences`);
      
      // Validation des données d'entrée
      if (!agenciesData || !Array.isArray(agenciesData) || agenciesData.length === 0) {
        throw new Error('Aucune donnée d\'agence fournie');
      }
      
      // Appel du service
      const agencies = await this.agencyService.createMultiple(agenciesData);
      
      // Vérification du résultat
      if (!agencies || !Array.isArray(agencies)) {
        throw new Error('Le service n\'a pas retourné de données valides');
      }
      
      console.log(`✅ [Controller] ${agencies.length} agences créées avec succès`);
      
      return {
        message: `${agencies.length} agences créées avec succès`,
        agencies
      };
      
    } catch (error) {
      console.error('❌ [Controller] Erreur lors de la création en masse:', error);
      
      // Re-lancer l'erreur pour que l'intercepteur de gestion d'erreurs la traite
      throw error;
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() agencyData: UpdateAgencyDto,
  ): Promise<{ message: string; agency: Agency }> {
    const agency = await this.agencyService.update(id, agencyData);
    if (!agency) {
      throw new NotFoundException('Agence non trouvée');
    }
    return {
      message: `Agence "${agency.name}" mise à jour avec succès`,
      agency
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; agencyId: number }> {
    const agency = await this.agencyService.findOne(id);
    if (!agency) {
      throw new NotFoundException('Agence non trouvée');
    }
    
    await this.agencyService.remove(id);
    return {
      message: `Agence "${agency.name}" supprimée avec succès`,
      agencyId: id
    };
  }

  // Routes personnalisées
  @Get('statistics/summary')
  async getAgencyStatistics(@Req() request: Request): Promise<{ message: string; statistics: any }> {
    const user = request['user'];
    // Pour les statistiques, on récupère toutes les agences (sans pagination)
    const result = await this.agencyService.findAll(user?.idRole, user?.idAgency, 1, 10000);
    const agencies = result.agencies;
    
    const statistics = {
      totalAgencies: agencies.length,
      activeAgencies: agencies.filter(a => a.deletedAt === null).length,
      agenciesBySubscriber: {
        subscriber1: agencies.filter(a => a.idSubscriber === 1).length,
        subscriber2: agencies.filter(a => a.idSubscriber === 2).length,
        subscriber3: agencies.filter(a => a.idSubscriber === 3).length
      }
    };
    
    return {
      message: 'Statistiques des agences récupérées avec succès',
      statistics
    };
  }

  // Obtenir les contrats d'une agence
  @Get(':id/contracts')
  async getAgencyContracts(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '7'
  ): Promise<{ message: string; contracts: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 7;
    const result = await this.agencyService.findContractsByAgency(id, pageNum, limitNum);
    
    return {
      message: `Contrats de l'agence récupérés avec succès`,
      contracts: result.contracts,
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: result.totalPages
    };
  }

  // Obtenir les utilisateurs d'une agence
  @Get(':id/users')
  async getAgencyUsers(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; users: any[] }> {
    const users = await this.agencyService.findUsersByAgency(id);
    
    return {
      message: `Utilisateurs de l'agence récupérés avec succès`,
      users
    };
  }

  // Obtenir les statistiques d'une agence
  @Get(':id/stats')
  async getAgencyStats(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; stats: any }> {
    const stats = await this.agencyService.getAgencyStats(id);
    
    return {
      message: `Statistiques de l'agence récupérées avec succès`,
      stats
    };
  }

  // Obtenir les performances d'une agence
  @Get(':id/performance')
  async getAgencyPerformance(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; performance: any }> {
    const agency = await this.agencyService.findOne(id);
    if (!agency) {
      throw new NotFoundException('Agence non trouvée');
    }

    // Ici vous pourriez appeler un service pour récupérer les performances de l'agence
    // Pour l'instant, on retourne des données simulées
    const performance = {
      contractsThisMonth: 25,
      revenueThisMonth: 150000,
      customerSatisfaction: 4.5,
      growthRate: 12.5
    };

    return {
      message: `Performances de l'agence "${agency.name}" récupérées avec succès`,
      performance
    };
  }

  // Obtenir les bureaux d'une agence
  @Get(':id/offices')
  async getAgencyOffices(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; offices: any[] }> {
    const offices = await this.agencyService.findOfficesByAgency(id);
    return {
      message: `Bureaux de l'agence récupérés avec succès`,
      offices
    };
  }
}
