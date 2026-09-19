import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { SubscriberService } from '../service/subscriber.service';
import { Subscriber } from '../entity/subscriber.entity';
import { CreateSubscriberDto, UpdateSubscriberDto } from '../dto';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('subscribers')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class SubscriberController {
  constructor(private readonly subscriberService: SubscriberService) {}

  @Get()
  @RequirePermissions(ContractPermission.READ)
  async findAll(): Promise<{ message: string; subscribers: Subscriber[] }> {
    const subscribers = await this.subscriberService.findAll();
    return {
      message: `Liste des ${subscribers.length} souscripteurs récupérée avec succès`,
      subscribers
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; subscriber: Subscriber }> {
    const subscriber = await this.subscriberService.findOne(id);
    if (!subscriber) {
      throw new NotFoundException('Souscripteur non trouvé');
    }
    return {
      message: `Souscripteur "${subscriber.name}" récupéré avec succès`,
      subscriber
    };
  }

  @Get('search/name')
  async findByName(@Query('name') name: string): Promise<{ message: string; subscribers: Subscriber[] }> {
    const subscribers = await this.subscriberService.findByName(name);
    return {
      message: `${subscribers.length} souscripteur(s) trouvé(s) avec le nom "${name}"`,
      subscribers
    };
  }

  @Get('search/email')
  async findByEmail(@Query('email') email: string): Promise<{ message: string; subscriber: Subscriber | null }> {
    const subscriber = await this.subscriberService.findByEmail(email);
    if (!subscriber) {
      return {
        message: `Aucun souscripteur trouvé avec l'email "${email}"`,
        subscriber: null
      };
    }
    return {
      message: `Souscripteur trouvé avec l'email "${email}"`,
      subscriber
    };
  }

  @Post()
  @RequirePermissions(ContractPermission.MANAGE_AGENCY)
  async create(@Body() subscriberData: CreateSubscriberDto): Promise<{ message: string; subscriber: Subscriber }> {
    const subscriber = await this.subscriberService.create(subscriberData);
    return {
      message: `Souscripteur "${subscriber.name}" créé avec succès`,
      subscriber
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() subscriberData: UpdateSubscriberDto,
  ): Promise<{ message: string; subscriber: Subscriber }> {
    const subscriber = await this.subscriberService.update(id, subscriberData);
    if (!subscriber) {
      throw new NotFoundException('Souscripteur non trouvé');
    }
    return {
      message: `Souscripteur "${subscriber.name}" mis à jour avec succès`,
      subscriber
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; subscriberId: number }> {
    const subscriber = await this.subscriberService.findOne(id);
    if (!subscriber) {
      throw new NotFoundException('Souscripteur non trouvé');
    }
    
    await this.subscriberService.remove(id);
    return {
      message: `Souscripteur "${subscriber.name}" supprimé avec succès`,
      subscriberId: id
    };
  }

  // Routes personnalisées
  @Get('statistics/summary')
  async getSubscriberStatistics(): Promise<{ message: string; statistics: any }> {
    const subscribers = await this.subscriberService.findAll();
    
    const statistics = {
      totalSubscribers: subscribers.length,
      activeSubscribers: subscribers.filter(s => s.deletedAt === null).length,
      subscribersByRegion: {
        north: subscribers.filter(s => s.address.includes('Nord')).length,
        south: subscribers.filter(s => s.address.includes('Sud')).length,
        east: subscribers.filter(s => s.address.includes('Est')).length,
        west: subscribers.filter(s => s.address.includes('Ouest')).length
      }
    };
    
    return {
      message: 'Statistiques des souscripteurs récupérées avec succès',
      statistics
    };
  }

  // Obtenir les agences d'un souscripteur
  @Get(':id/agencies')
  async getSubscriberAgencies(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; agencies: any[] }> {
    const subscriber = await this.subscriberService.findOne(id);
    if (!subscriber) {
      throw new NotFoundException('Souscripteur non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les agences du souscripteur
    // Pour l'instant, on retourne des données simulées
    const agencies = [
      {
        id: 1,
        name: 'Agence Principale',
        address: '123 Rue de la Paix',
        phone: '0123456789'
      }
    ];

    return {
      message: `Agences du souscripteur "${subscriber.name}" récupérées avec succès`,
      agencies
    };
  }

  // Obtenir les contrats d'un souscripteur
  @Get(':id/contracts')
  async getSubscriberContracts(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; contracts: any[] }> {
    const subscriber = await this.subscriberService.findOne(id);
    if (!subscriber) {
      throw new NotFoundException('Souscripteur non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les contrats du souscripteur
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
      message: `Contrats du souscripteur "${subscriber.name}" récupérés avec succès`,
      contracts
    };
  }

  // Obtenir les performances d'un souscripteur
  @Get(':id/performance')
  async getSubscriberPerformance(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; performance: any }> {
    const subscriber = await this.subscriberService.findOne(id);
    if (!subscriber) {
      throw new NotFoundException('Souscripteur non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les performances du souscripteur
    // Pour l'instant, on retourne des données simulées
    const performance = {
      totalContracts: 150,
      activeContracts: 120,
      revenueThisMonth: 250000,
      growthRate: 15.5
    };

    return {
      message: `Performances du souscripteur "${subscriber.name}" récupérées avec succès`,
      performance
    };
  }
}
