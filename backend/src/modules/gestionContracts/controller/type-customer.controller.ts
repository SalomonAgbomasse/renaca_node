import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { TypeCustomerService } from '../service/type-customer.service';
import { TypeCustomer } from '../entity/type-customer.entity';
import { CreateTypeCustomerDto, UpdateTypeCustomerDto } from '../dto';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { JwtAuthGuard } from 'src/modules/gestionUsers/guards/jwt-auth.guard';

@Controller('type-customers')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class TypeCustomerController {
  constructor(private readonly typeCustomerService: TypeCustomerService) {}

  @Get()
  @RequirePermissions(ContractPermission.READ)
  async findAll(): Promise<{ message: string; typeCustomers: TypeCustomer[] }> {
    const typeCustomers = await this.typeCustomerService.findAll();
    return {
      message: `Liste des ${typeCustomers.length} types de client récupérée avec succès`,
      typeCustomers
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; typeCustomer: TypeCustomer }> {
    const typeCustomer = await this.typeCustomerService.findOne(id);
    if (!typeCustomer) {
      throw new NotFoundException('Type de client non trouvé');
    }
    return {
      message: `Type de client "${typeCustomer.libelle}" récupéré avec succès`,
      typeCustomer
    };
  }

  @Get('search/title')
  async findByTitle(@Query('title') title: string): Promise<{ message: string; typeCustomer: TypeCustomer | null }> {
    const typeCustomer = await this.typeCustomerService.findByTitle(title);
    if (!typeCustomer) {
      return {
        message: `Aucun type de client trouvé avec le titre "${title}"`,
        typeCustomer: null
      };
    }
    return {
      message: `Type de client trouvé avec le titre "${title}"`,
      typeCustomer
    };
  }

  @Post()
  @RequirePermissions(ContractPermission.MANAGE_CUSTOMER)
  async create(@Body() typeCustomerData: CreateTypeCustomerDto): Promise<{ message: string; typeCustomer: TypeCustomer }> {
    const typeCustomer = await this.typeCustomerService.create(typeCustomerData);
    return {
      message: `Type de client "${typeCustomer.libelle}" créé avec succès`,
      typeCustomer
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() typeCustomerData: UpdateTypeCustomerDto,
  ): Promise<{ message: string; typeCustomer: TypeCustomer }> {
    const typeCustomer = await this.typeCustomerService.update(id, typeCustomerData);
    if (!typeCustomer) {
      throw new NotFoundException('Type de client non trouvé');
    }
    return {
      message: `Type de client "${typeCustomer.libelle}" mis à jour avec succès`,
      typeCustomer
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; typeCustomerId: number }> {
    const typeCustomer = await this.typeCustomerService.findOne(id);
    if (!typeCustomer) {
      throw new NotFoundException('Type de client non trouvé');
    }
    
    await this.typeCustomerService.remove(id);
    return {
      message: `Type de client "${typeCustomer.libelle}" supprimé avec succès`,
      typeCustomerId: id
    };
  }

  // Routes personnalisées
  @Get('statistics/summary')
  async getTypeCustomerStatistics(): Promise<{ message: string; statistics: any }> {
    const typeCustomers = await this.typeCustomerService.findAll();
    
    const statistics = {
      totalTypeCustomers: typeCustomers.length,
      activeTypeCustomers: typeCustomers.filter(tc => tc.deletedAt === null).length,
      typesByCategory: {
        individual: typeCustomers.filter(tc => tc.libelle.includes('Individuel')).length,
        corporate: typeCustomers.filter(tc => tc.libelle.includes('Entreprise')).length,
        other: typeCustomers.filter(tc => !tc.libelle.includes('Individuel') && !tc.libelle.includes('Entreprise')).length
      }
    };
    
    return {
      message: 'Statistiques des types de client récupérées avec succès',
      statistics
    };
  }

  // Obtenir les clients d'un type spécifique
  @Get(':id/customers')
  async getCustomersByType(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; customers: any[] }> {
    const typeCustomer = await this.typeCustomerService.findOne(id);
    if (!typeCustomer) {
      throw new NotFoundException('Type de client non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les clients de ce type
    // Pour l'instant, on retourne des données simulées
    const customers = [
      {
        id: 1,
        firstname: 'Jean',
        lastname: 'Dupont',
        email: 'jean.dupont@test.com',
        phone: '0123456789'
      }
    ];

    return {
      message: `Clients du type "${typeCustomer.libelle}" récupérés avec succès`,
      customers
    };
  }

  // Obtenir les contrats d'un type de client
  @Get(':id/contracts')
  async getContractsByType(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; contracts: any[] }> {
    const typeCustomer = await this.typeCustomerService.findOne(id);
    if (!typeCustomer) {
      throw new NotFoundException('Type de client non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les contrats de ce type de client
    // Pour l'instant, on retourne des données simulées
    const contracts = [
      {
        id: 1,
        reference: 'CON-001',
        police: 'POL-001',
        customer: 'Jean Dupont',
        dateEff: new Date(),
        dateEch: new Date(),
        capital: 100000
      }
    ];

    return {
      message: `Contrats du type de client "${typeCustomer.libelle}" récupérés avec succès`,
      contracts
    };
  }
}
