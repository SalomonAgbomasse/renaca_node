import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException, Req, Res } from '@nestjs/common';
import { CustomerService } from '../service/customer.service';
import { CustomerHistoryService } from '../service/customer-history.service';
import { Customer } from '../entity/customer.entity';
import { CustomerHistory, HistoryAction } from '../entity/customer-history.entity';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import type { Request, Response } from 'express';

@Controller('customers')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly customerHistoryService: CustomerHistoryService,
  ) {}

  @Get()
  @RequirePermissions(ContractPermission.READ)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<{ 
    message: string; 
    customers: Customer[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const pageNum = page ? parseInt(page, 10) : 1;
    let limitNum = 10;
    if (limit) {
      if (limit === 'all') {
        limitNum = -1;
      } else {
        limitNum = parseInt(limit, 10);
      }
    }

    const result = await this.customerService.findAll(pageNum, limitNum, search || '');
    return {
      message: `Liste des clients récupérée avec succès`,
      customers: result.customers,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  @Get(':identifier/details')
  async getCustomerDetails(@Param('identifier') identifier: string): Promise<any> {
    const details = await this.customerService.findCustomerDetails(identifier);
    if (!details) {
      throw new NotFoundException('Client introuvable');
    }
    return {
      message: `Détails du client récupérés avec succès`,
      ...details
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{ message: string; customer: Customer }> {
    const customer = await this.customerService.findOne(id);
    if (!customer) {
      throw new NotFoundException('Client non trouvé');
    }
    return {
      message: `Client "${customer.firstname} ${customer.lastname}" récupéré avec succès`,
      customer
    };
  }

  @Get('search/email')
  async findByEmail(@Query('email') email: string): Promise<{ message: string; customer: Customer | null }> {
    const customer = await this.customerService.findByEmail(email);
    if (!customer) {
      return {
        message: `Aucun client trouvé avec l'email "${email}"`,
        customer: null
      };
    }
    return {
      message: `Client trouvé avec l'email "${email}"`,
      customer
    };
  }

  @Get('search/phone')
  async findByPhone(@Query('phone') phone: string): Promise<{ message: string; customer: Customer | null }> {
    const customer = await this.customerService.findByPhone(phone);
    if (!customer) {
      return {
        message: `Aucun client trouvé avec le téléphone "${phone}"`,
        customer: null
      };
    }
    return {
      message: `Client trouvé avec le téléphone "${phone}"`,
      customer
    };
  }

  @Get('search/personal-info')
  async findByPersonalInfo(
    @Query('lastname') lastname: string,
    @Query('firstname') firstname: string,
    @Query('birthdate') birthdate: string
  ): Promise<{ message: string; customer: Customer | null }> {
    const customer = await this.customerService.findByPersonalInfo(lastname, firstname, birthdate);
    if (!customer) {
      return {
        message: `Aucun client trouvé avec ces informations personnelles`,
        customer: null
      };
    }
    return {
      message: `Client trouvé avec ces informations personnelles`,
      customer
    };
  }

  @Get('type/:idTypeCustomer')
  async findByType(@Param('idTypeCustomer', ParseIntPipe) idTypeCustomer: number): Promise<{ message: string; customers: Customer[] }> {
    const customers = await this.customerService.findByType(idTypeCustomer);
    return {
      message: `${customers.length} client(s) trouvé(s) pour le type ${idTypeCustomer}`,
      customers
    };
  }

  @Get('user/:idUser')
  async findByUser(@Param('idUser', ParseIntPipe) idUser: number): Promise<{ message: string; customers: Customer[] }> {
    const customers = await this.customerService.findByUser(idUser);
    return {
      message: `${customers.length} client(s) trouvé(s) pour l'utilisateur ${idUser}`,
      customers
    };
  }

  @Post()
  @RequirePermissions(ContractPermission.MANAGE_CUSTOMER)
  async create(@Body() customerData: CreateCustomerDto, @Req() request: Request): Promise<{ message: string; customer: Customer }> {
    try {
      // L'utilisateur est déjà injecté par AuthInterceptor
      const user = request['user'];
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Injecter l'idUser dans les données du client
      const enrichedCustomerData = {
        ...customerData,
        idUser: user.id
      };

      // Vérifier les doublons avant l'insertion
      // 1. Vérifier par numCustomer si fourni
      if (enrichedCustomerData.numCustomer && enrichedCustomerData.numCustomer.trim()) {
        const existingByNum = await this.customerService.findByNumCustomer(
          enrichedCustomerData.numCustomer.trim()
        );
        
        if (existingByNum) {
          throw new Error(`Un client avec le numéro "${enrichedCustomerData.numCustomer}" existe déjà`);
        }
      }

      // 2. Vérifier par nom, prénom et date de naissance
      if (enrichedCustomerData.lastname && enrichedCustomerData.firstname && enrichedCustomerData.birthdate) {
        const normalizedLastname = enrichedCustomerData.lastname.toUpperCase();
        const normalizedFirstname = enrichedCustomerData.firstname.toUpperCase();
        
        const existingCustomer = await this.customerService.findByPersonalInfo(
          normalizedLastname,
          normalizedFirstname,
          enrichedCustomerData.birthdate
        );
        
        if (existingCustomer) {
          throw new Error(`Un client avec ces informations (${normalizedLastname} ${normalizedFirstname}, ${enrichedCustomerData.birthdate}) existe déjà`);
        }
      }

      // Récupérer l'IP et le User-Agent
      const ipAddress = this.getClientIp(request);
      const userAgent = request.headers['user-agent'] || 'unknown';

      const customer = await this.customerService.create(
        enrichedCustomerData,
        ipAddress as string,
        userAgent
      );
      return {
        message: `Client "${customer.firstname} ${customer.lastname}" créé avec succès`,
        customer
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la création du client');
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() customerData: UpdateCustomerDto,
    @Req() request: Request
  ): Promise<{ message: string; customer: Customer }> {
    try {
      // L'utilisateur est déjà injecté par AuthInterceptor
      const user = request['user'];
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Ajouter l'updatedBy aux données de modification
      const enrichedCustomerData = {
        ...customerData,
        updatedBy: user.id
      };

      // Récupérer l'IP et le User-Agent
      const ipAddress = this.getClientIp(request);
      const userAgent = request.headers['user-agent'] || 'unknown';

      const customer = await this.customerService.update(
        id, 
        enrichedCustomerData,
        ipAddress as string,
        userAgent
      );
      if (!customer) {
        throw new NotFoundException('Client non trouvé');
      }
      return {
        message: `Client "${customer.firstname} ${customer.lastname}" mis à jour avec succès`,
        customer
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la modification du client');
    }
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request
  ): Promise<{ message: string; customerId: number }> {
    const customer = await this.customerService.findOne(id);
    if (!customer) {
      throw new NotFoundException('Client non trouvé');
    }
    
    // Récupérer l'IP et le User-Agent
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || 'unknown';
    
    await this.customerService.remove(id, ipAddress as string, userAgent);
    return {
      message: `Client "${customer.firstname} ${customer.lastname}" supprimé avec succès`,
      customerId: id
    };
  }

  // Routes personnalisées
  @Get('statistics/summary')
  async getCustomerStatistics(): Promise<{ message: string; statistics: any }> {
    const result = await this.customerService.findAll(1, -1);
    const customers = result.customers;
    
    const statistics = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.isActive !== false).length,
      newCustomersThisMonth: customers.filter(c => {
        const customerDate = new Date(c.createdAt);
        const now = new Date();
        return customerDate.getMonth() === now.getMonth() && 
               customerDate.getFullYear() === now.getFullYear();
      }).length,
      customersByType: {
        individual: customers.filter(c => c.idTypeCustomer === 1).length,
        corporate: customers.filter(c => c.idTypeCustomer === 2).length
      }
    };
    
    return {
      message: 'Statistiques des clients récupérées avec succès',
      statistics
    };
  }

  @Get('search/advanced')
  async advancedSearch(@Query() query: any): Promise<{ message: string; query: any; results: any[] }> {
    // Ici vous pourriez implémenter une recherche avancée
    const results = [];
    
    return {
      message: 'Recherche avancée clients effectuée',
      query,
      results
    };
  }

  // Obtenir les contrats d'un client
  @Get(':id/contracts')
  async getCustomerContracts(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; contracts: any[] }> {
    const customer = await this.customerService.findOne(id);
    if (!customer) {
      throw new NotFoundException('Client non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les contrats du client
    // Pour l'instant, on retourne des données simulées
    const contracts = [
      {
        id: 1,
        reference: 'CON-001',
        police: 'POL-001',
        dateEff: new Date(),
        dateEch: new Date(),
        capital: 100000
      }
    ];

    return {
      message: `Contrats du client "${customer.firstname} ${customer.lastname}" récupérés avec succès`,
      contracts
    };
  }

  // Obtenir l'historique des activités d'un client
  @Get(':id/activities')
  async getCustomerActivities(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; activities: any[] }> {
    const customer = await this.customerService.findOne(id);
    if (!customer) {
      throw new NotFoundException('Client non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer l'historique des activités
    // Pour l'instant, on retourne des données simulées
    const activities = [
      {
        id: 1,
        type: 'CONTRACT_CREATED',
        description: 'Nouveau contrat créé',
        date: new Date()
      }
    ];

    return {
      message: `Historique des activités du client "${customer.firstname} ${customer.lastname}" récupéré avec succès`,
      activities
    };
  }

  // Exporter l'historique en PDF (DOIT être avant :id/history pour éviter les conflits de route)
  @Get(':id/history/pdf')
  @RequirePermissions(ContractPermission.READ)
  async exportHistoryToPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const customer = await this.customerService.findOne(id);
    if (!customer) {
      res.status(404).json({ message: 'Client non trouvé' });
      return;
    }

    const history = await this.customerHistoryService.findByCustomerId(id);
    
    if (history.length === 0) {
      res.status(404).json({ message: 'Aucun historique disponible pour ce client' });
      return;
    }

    try {
      const pdfBuffer = await this.customerHistoryService.generateHistoryPdf(customer, history);
      
      // Nettoyer les noms pour éviter les espaces et caractères spéciaux
      const cleanLastname = (customer.lastname || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const cleanFirstname = (customer.firstname || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const filename = `historique_${cleanLastname}_${cleanFirstname}_${Date.now()}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      res.status(500).json({ message: `Erreur lors de la génération du PDF: ${error.message}` });
    }
  }

  // Obtenir l'historique des modifications d'un client
  @Get(':id/history')
  @RequirePermissions(ContractPermission.READ)
  async getCustomerHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ message: string; history: CustomerHistory[] | any }> {
    const customer = await this.customerService.findOne(id);
    if (!customer) {
      throw new NotFoundException('Client non trouvé');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (pageNum > 1 || limitNum !== 10) {
      // Pagination
      const result = await this.customerHistoryService.findByCustomerIdPaginated(
        id,
        pageNum,
        limitNum,
      );
      return {
        message: `Historique des modifications du client "${customer.firstname} ${customer.lastname}" récupéré avec succès`,
        history: result,
      };
    } else {
      // Sans pagination
      const history = await this.customerHistoryService.findByCustomerId(id);
      return {
        message: `Historique des modifications du client "${customer.firstname} ${customer.lastname}" récupéré avec succès`,
        history,
      };
    }
  }

  // Obtenir l'historique par type d'action
  @Get(':id/history/action/:action')
  @RequirePermissions(ContractPermission.READ)
  async getCustomerHistoryByAction(
    @Param('id', ParseIntPipe) id: number,
    @Param('action') action: HistoryAction,
  ): Promise<{ message: string; history: CustomerHistory[] }> {
    const customer = await this.customerService.findOne(id);
    if (!customer) {
      throw new NotFoundException('Client non trouvé');
    }

    if (!Object.values(HistoryAction).includes(action)) {
      throw new NotFoundException(`Type d'action invalide: ${action}`);
    }

    const history = await this.customerHistoryService.findByAction(id, action);
    return {
      message: `Historique des ${action} du client "${customer.firstname} ${customer.lastname}" récupéré avec succès`,
      history,
    };
  }

  // Obtenir un enregistrement d'historique spécifique
  @Get('history/:historyId')
  @RequirePermissions(ContractPermission.READ)
  async getHistoryRecord(
    @Param('historyId', ParseIntPipe) historyId: number,
  ): Promise<{ message: string; history: CustomerHistory }> {
    const history = await this.customerHistoryService.findOne(historyId);
    if (!history) {
      throw new NotFoundException('Enregistrement d\'historique non trouvé');
    }

    return {
      message: 'Enregistrement d\'historique récupéré avec succès',
      history,
    };
  }

  /**
   * Récupérer l'adresse IP réelle du client
   */
  private getClientIp(request: Request): string {
    // Essayer plusieurs méthodes pour obtenir l'IP réelle
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      // Prendre la première IP si plusieurs sont présentes
      const ips = forwardedFor.split(',');
      const ip = ips[0].trim();
      if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== '::ffff:127.0.0.1') {
        return ip;
      }
    }

    const realIp = request.headers['x-real-ip'] as string;
    if (realIp && realIp !== '::1' && realIp !== '127.0.0.1' && realIp !== '::ffff:127.0.0.1') {
      return realIp;
    }

    const ip = request.ip;
    const socketAddress = request.socket?.remoteAddress;
    
    // Vérifier si c'est localhost
    const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1' ||
                        socketAddress === '::1' || socketAddress === '127.0.0.1' || socketAddress === '::ffff:127.0.0.1';
    
    if (isLocalhost) {
      // Essayer de récupérer l'IP locale de la machine
      const localIp = this.getLocalNetworkIp();
      if (localIp) {
        return `${localIp} (localhost)`;
      }
      return '127.0.0.1 (localhost)';
    }
    
    if (ip && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
      return ip;
    }

    if (socketAddress && socketAddress !== '::1' && socketAddress !== '127.0.0.1') {
      return socketAddress;
    }

    return 'Non disponible';
  }

  /**
   * Récupérer l'adresse IP locale de la machine sur le réseau
   */
  private getLocalNetworkIp(): string | null {
    try {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      
      // Parcourir les interfaces réseau
      for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];
        if (!addresses) continue;
        
        for (const address of addresses) {
          // Ignorer les adresses internes et IPv6 link-local
          if (
            address.family === 'IPv4' &&
            !address.internal &&
            address.address !== '127.0.0.1' &&
            !address.address.startsWith('169.254') // Link-local
          ) {
            return address.address;
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'IP locale:', error);
    }
    
    return null;
  }
}
