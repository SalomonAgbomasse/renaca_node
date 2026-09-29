import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Contract } from '../entity/contract.entity';
import { Customer } from '../entity/customer.entity';
import { Agency } from '../entity/agency.entity';
import { User } from '../../gestionUsers/entity/user.entity';
import { ProductionState } from '../entity/production-state.entity';
import { NatureCredit } from '../entity/nature-credit.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Agency)
    private agencyRepository: Repository<Agency>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProductionState)
    private productionStateRepository: Repository<ProductionState>,
  ) {}

  /**
   * Obtenir les statistiques générales du dashboard
   */
  async getDashboardStats(): Promise<{
    totalContracts: number;
    totalRevenue: number;
    totalClients: number;
    totalAgencies: number;
    activeContracts: number;
    suspendedContracts: number;
    expiredContracts: number;
    contractsThisMonth: number;
    revenueThisMonth: number;
    contractsLastMonth: number;
    revenueLastMonth: number;
  }> {
    // Statistiques des contrats
    const totalContracts = await this.contractRepository.count({
      where: { isActive: true }
    });

    const activeContracts = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.contractState', 'contractState')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contractState.libelle = :status', { status: 'Actif' })
      .getCount();

    const suspendedContracts = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.contractState', 'contractState')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contractState.libelle = :status', { status: 'Suspendu' })
      .getCount();

    const expiredContracts = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.contractState', 'contractState')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contractState.libelle = :status', { status: 'Expiré' })
      .getCount();

    // Revenus totaux
    const revenueResult = await this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.puttc)', 'totalRevenue')
      .where('contract.isActive = :isActive', { isActive: true })
      .getRawOne();

    const totalRevenue = parseInt(revenueResult.totalRevenue) || 0;

    // Statistiques des clients
    const totalClients = await this.customerRepository.count();

    // Statistiques des agences
    const totalAgencies = await this.agencyRepository.count();

    // Contrats ce mois
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const contractsThisMonth = await this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.createdAt >= :startOfMonth', { startOfMonth })
      .andWhere('contract.createdAt <= :endOfMonth', { endOfMonth })
      .getCount();

    const revenueThisMonthResult = await this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.puttc)', 'revenueThisMonth')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.createdAt >= :startOfMonth', { startOfMonth })
      .andWhere('contract.createdAt <= :endOfMonth', { endOfMonth })
      .getRawOne();

    const revenueThisMonth = parseInt(revenueThisMonthResult.revenueThisMonth) || 0;

    // Contrats mois dernier
    const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const contractsLastMonth = await this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.createdAt >= :startOfLastMonth', { startOfLastMonth })
      .andWhere('contract.createdAt <= :endOfLastMonth', { endOfLastMonth })
      .getCount();

    const revenueLastMonthResult = await this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.puttc)', 'revenueLastMonth')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.createdAt >= :startOfLastMonth', { startOfLastMonth })
      .andWhere('contract.createdAt <= :endOfLastMonth', { endOfLastMonth })
      .getRawOne();

    const revenueLastMonth = parseInt(revenueLastMonthResult.revenueLastMonth) || 0;

    return {
      totalContracts,
      totalRevenue,
      totalClients,
      totalAgencies,
      activeContracts,
      suspendedContracts,
      expiredContracts,
      contractsThisMonth,
      revenueThisMonth,
      contractsLastMonth,
      revenueLastMonth
    };
  }

  /**
   * Obtenir les données pour le graphique d'évolution des ventes
   */
  async getSalesEvolutionData(months: number = 12): Promise<{
    labels: string[];
    capitalData: number[];
    revenueData: number[];
  }> {
    const labels: string[] = [];
    const capitalData: number[] = [];
    const revenueData: number[] = [];

    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      labels.push(monthName);

      // Capital et revenus pour ce mois
      const monthData = await this.contractRepository
        .createQueryBuilder('contract')
        .select('SUM(contract.capital)', 'totalCapital')
        .addSelect('SUM(contract.puttc)', 'totalRevenue')
        .where('contract.isActive = :isActive', { isActive: true })
        .andWhere('contract.createdAt >= :startOfMonth', { startOfMonth })
        .andWhere('contract.createdAt <= :endOfMonth', { endOfMonth })
        .getRawOne();

      capitalData.push(parseInt(monthData.totalCapital) || 0);
      revenueData.push(parseInt(monthData.totalRevenue) || 0);
    }

    return { labels, capitalData, revenueData };
  }

  /**
   * Obtenir les données pour le graphique de répartition des contrats par nature de crédit
   */
  async getContractsStatusData(): Promise<{
    labels: string[];
    data: number[];
  }> {
    const natureData = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.natureCredit', 'natureCredit')
      .select('natureCredit.libelle', 'nature')
      .addSelect('COUNT(contract.id)', 'count')
      .where('contract.isActive = :isActive', { isActive: true })
      .groupBy('natureCredit.libelle')
      .orderBy('count', 'DESC')
      .getRawMany();

    const labels = natureData.map(item => item.nature || 'Non défini');
    const data = natureData.map(item => parseInt(item.count));

    return { labels, data };
  }

  /**
   * Obtenir les données pour le graphique de performance des agences
   */
  async getAgenciesPerformanceData(): Promise<{
    labels: string[];
    data: number[];
  }> {
    const agencyData = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.agency', 'agency')
      .select('agency.name', 'agencyName')
      .addSelect('COUNT(contract.id)', 'contractCount')
      .where('contract.isActive = :isActive', { isActive: true })
      .groupBy('agency.name')
      .orderBy('contractCount', 'DESC')
      .limit(10)
      .getRawMany();

    const labels = agencyData.map(item => item.agencyName || 'Agence inconnue');
    const data = agencyData.map(item => parseInt(item.contractCount));

    return { labels, data };
  }

  /**
   * Obtenir les données pour le graphique de revenus par mois
   */
  async getRevenueData(months: number = 12): Promise<{
    labels: string[];
    data: number[];
  }> {
    const labels: string[] = [];
    const data: number[] = [];

    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      labels.push(monthName);

      const monthRevenue = await this.contractRepository
        .createQueryBuilder('contract')
        .select('SUM(contract.puttc)', 'totalRevenue')
        .where('contract.isActive = :isActive', { isActive: true })
        .andWhere('contract.createdAt >= :startOfMonth', { startOfMonth })
        .andWhere('contract.createdAt <= :endOfMonth', { endOfMonth })
        .getRawOne();

      data.push(parseInt(monthRevenue.totalRevenue) || 0);
    }

    return { labels, data };
  }

  /**
   * Obtenir les activités récentes avec pagination
   */
  async getRecentActivities(page: number = 1, limit: number = 10): Promise<{
    data: {
      id: number;
      police: string;
      reference: string;
      capital: number;
      duree: number;
      natureCredit: string;
      puttc: number;
      user: string;
      date: Date;
      status: string;
    }[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    // Récupérer les contrats récents avec pagination
    const [recentContracts, total] = await this.contractRepository.findAndCount({
      where: { isActive: true },
      relations: ['user', 'contractState', 'natureCredit'],
      order: { updatedAt: 'DESC' },
      skip,
      take: limit
    });

    const activities = recentContracts.map(contract => ({
      id: contract.id,
      police: contract.police,
      reference: contract.reference,
      capital: contract.capital,
      duree: contract.duration,
      natureCredit: contract.natureCredit?.libelle || 'Non défini',
      puttc: contract.puttc,
      user: `${contract.user?.firstname || ''} ${contract.user?.lastname || ''}`.trim(),
      date: contract.updatedAt,
      status: contract.contractState?.libelle || 'Inconnu'
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: activities,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Obtenir les contrats de la semaine courante avec pagination
   */
  async getWeeklyContracts(page: number = 1, limit: number = 10, user?: any): Promise<{
    data: {
      id: number;
      police: string;
      reference: string;
      capital: number;
      duree: number;
      natureCredit: string;
      puttc: number;
      user: string;
      date: Date;
      status: string;
    }[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // S'assurer que page et limit sont des nombres
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Calculer le début et la fin de la semaine courante
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Dimanche
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Samedi
    endOfWeek.setHours(23, 59, 59, 999);

    // Déterminer si on doit filtrer par agence selon le rôle de l'utilisateur
    let whereCondition: any = {
      isActive: true,
      createdAt: Between(startOfWeek, endOfWeek)
    };

    if (user) {
      // Extraire le rôle de l'utilisateur
      let userRole: any = user.role;
      if (userRole && typeof userRole === 'object') {
        userRole = userRole.libelle || userRole.name || userRole.slug || '';
      }
      
      // Normaliser le rôle en majuscules pour la comparaison
      const normalizedRole = typeof userRole === 'string' ? userRole.toUpperCase() : '';
      
      // Vérifier si l'utilisateur est admin (ROOT, ADMIN AAVIE)
      const isAdmin = normalizedRole === 'ROOT' ||
                      normalizedRole === 'ADMIN AAVIE' ||
                      normalizedRole === 'ADMIN' ||
                      normalizedRole === 'SUPER ADMIN';
      
      // Si le rôle n'est pas admin, filtrer par agence
      if (!isAdmin) {
        const userAgencyId = user.idAgency || user.agency?.id;
        if (userAgencyId) {
          whereCondition.idAgency = userAgencyId;
          console.log(`🔒 Filtrage par agence ${userAgencyId} pour l'utilisateur avec rôle ${normalizedRole}`);
        }
      } else {
        console.log(`👑 Utilisateur ${normalizedRole} - accès à tous les contrats`);
      }
    }

    // Récupérer les contrats de la semaine courante avec pagination
    const [weeklyContracts, total] = await this.contractRepository.findAndCount({
      where: whereCondition,
      relations: ['user', 'contractState', 'natureCredit'],
      order: { createdAt: 'DESC' },
      skip,
      take: limitNum
    });

    const contracts = weeklyContracts.map(contract => ({
      id: contract.id,
      police: contract.police,
      reference: contract.reference,
      capital: Number(contract.capital),
      duree: contract.duration,
      natureCredit: contract.natureCredit?.libelle || 'Non défini',
      puttc: Number(contract.puttc),
      user: `${contract.user?.firstname || ''} ${contract.user?.lastname || ''}`.trim(),
      date: contract.createdAt,
      status: contract.contractState?.libelle || 'Inconnu'
    }));

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: contracts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    };
  }

  /**
   * Obtenir les statistiques des utilisateurs pour la semaine courante
   */
  async getWeeklyUserStats(page: number = 1, limit: number = 10): Promise<{
    data: {
      id: number;
      firstname: string;
      lastname: string;
      email: string;
      contractsCount: number;
      totalCapital: number;
      totalPrime: number;
      averageCapital: number;
      averagePrime: number;
    }[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    topStats: {
      topByContracts: { user: string; count: number };
      topByCapital: { user: string; amount: number };
      topByPrime: { user: string; amount: number };
    };
    summary: {
      totalContracts: number;
      totalCapital: number;
      totalPrime: number;
      totalUsers: number;
    };
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Dimanche
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Samedi
    endOfWeek.setHours(23, 59, 59, 999);

    // Récupérer tous les contrats de la semaine avec les utilisateurs
    const weeklyContracts = await this.contractRepository.find({
      where: { 
        isActive: true,
        createdAt: Between(startOfWeek, endOfWeek)
      },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    // Calculer les statistiques par utilisateur
    const userStatsMap = new Map();
    
    weeklyContracts.forEach(contract => {
      const userId = contract.user.id;
      const userKey = `${contract.user.firstname} ${contract.user.lastname}`;
      
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          id: userId,
          firstname: contract.user.firstname,
          lastname: contract.user.lastname,
          email: contract.user.email,
          contractsCount: 0,
          totalCapital: 0,
          totalPrime: 0
        });
      }
      
      const userStats = userStatsMap.get(userId);
      userStats.contractsCount++;
      userStats.totalCapital += Number(contract.capital);
      userStats.totalPrime += Number(contract.puttc);
    });

    // Convertir en array et calculer les moyennes
    const allUserStats = Array.from(userStatsMap.values()).map(user => ({
      ...user,
      averageCapital: user.contractsCount > 0 ? user.totalCapital / user.contractsCount : 0,
      averagePrime: user.contractsCount > 0 ? user.totalPrime / user.contractsCount : 0
    }));

    // Trier par nombre de contrats (décroissant)
    allUserStats.sort((a, b) => b.contractsCount - a.contractsCount);

    // Pagination
    const total = allUserStats.length;
    const paginatedStats = allUserStats.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum);

    // Calculer les tops
    const topByContracts = allUserStats.length > 0 ? {
      user: `${allUserStats[0].firstname} ${allUserStats[0].lastname}`,
      count: allUserStats[0].contractsCount
    } : { user: 'Aucun', count: 0 };

    const topByCapital = allUserStats.length > 0 ? allUserStats.reduce((max, user) => 
      user.totalCapital > max.totalCapital ? user : max
    ) : { user: 'Aucun', totalCapital: 0 };
    const topByCapitalFormatted = {
      user: `${topByCapital.firstname} ${topByCapital.lastname}`,
      amount: topByCapital.totalCapital
    };

    const topByPrime = allUserStats.length > 0 ? allUserStats.reduce((max, user) => 
      user.totalPrime > max.totalPrime ? user : max
    ) : { user: 'Aucun', totalPrime: 0 };
    const topByPrimeFormatted = {
      user: `${topByPrime.firstname} ${topByPrime.lastname}`,
      amount: topByPrime.totalPrime
    };

    // Calculer les totaux
    const summary = {
      totalContracts: weeklyContracts.length,
      totalCapital: weeklyContracts.reduce((sum, contract) => sum + Number(contract.capital), 0),
      totalPrime: weeklyContracts.reduce((sum, contract) => sum + Number(contract.puttc), 0),
      totalUsers: allUserStats.length
    };

    return {
      data: paginatedStats,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      topStats: {
        topByContracts,
        topByCapital: topByCapitalFormatted,
        topByPrime: topByPrimeFormatted
      },
      summary
    };
  }

  /**
   * Obtenir les statistiques des agences
   */
  async getAgenciesStats(): Promise<{
    totalAgencies: number;
    agenciesData: Array<{
      id: number;
      name: string;
      address: string;
      phone: string;
      email: string;
      contractsCount: number;
      totalPrimes: number;
      totalCapital: number;
    }>;
    chartData: {
      labels: string[];
      series: number[];
    };
  }> {
    // Récupérer toutes les agences
    const agencies = await this.agencyRepository.find();
    
    // Récupérer les statistiques par agence
    const agenciesData = await Promise.all(
      agencies.map(async (agency) => {
        // Compter les contrats par agence
        const contractsCount = await this.contractRepository.count({
          where: { 
            agency: { id: agency.id },
            isActive: true 
          }
        });

        // Calculer les primes totales par agence
        const primesResult = await this.contractRepository
          .createQueryBuilder('contract')
          .select('SUM(contract.puttc)', 'totalPrimes')
          .where('contract.agency = :agencyId', { agencyId: agency.id })
          .andWhere('contract.isActive = :isActive', { isActive: true })
          .getRawOne();

        // Calculer le capital total par agence
        const capitalResult = await this.contractRepository
          .createQueryBuilder('contract')
          .select('SUM(contract.capital)', 'totalCapital')
          .where('contract.agency = :agencyId', { agencyId: agency.id })
          .andWhere('contract.isActive = :isActive', { isActive: true })
          .getRawOne();

        return {
          id: agency.id,
          name: agency.name,
          address: agency.address,
          phone: agency.phone,
          email: agency.email,
          contractsCount,
          totalPrimes: parseInt(primesResult.totalPrimes) || 0,
          totalCapital: parseInt(capitalResult.totalCapital) || 0
        };
      })
    );

    // Préparer les données pour le graphique
    const chartData = {
      labels: agenciesData.map(agency => agency.name),
      series: agenciesData.map(agency => agency.contractsCount)
    };

    return {
      totalAgencies: agencies.length,
      agenciesData,
      chartData
    };
  }

  /**
   * Obtenir la comparaison des agences
   */
  async getAgenciesComparison(): Promise<{
    totalRevenue: number;
    revenueGrowth: number;
    agenciesComparison: Array<{
      id: number;
      name: string;
      contractsCount: number;
      totalPrimes: number;
      totalCapital: number;
      percentage: number;
    }>;
    chartData: {
      labels: string[];
      contracts: number[];
      primes: number[];
      capital: number[];
    };
  }> {
    // Récupérer toutes les agences
    const agencies = await this.agencyRepository.find();
    
    // Récupérer les statistiques par agence
    const agenciesComparison = await Promise.all(
      agencies.map(async (agency) => {
        // Compter les contrats par agence
        const contractsCount = await this.contractRepository.count({
          where: { 
            agency: { id: agency.id },
            isActive: true 
          }
        });

        // Calculer les primes totales par agence
        const primesResult = await this.contractRepository
          .createQueryBuilder('contract')
          .select('SUM(contract.puttc)', 'totalPrimes')
          .where('contract.agency = :agencyId', { agencyId: agency.id })
          .andWhere('contract.isActive = :isActive', { isActive: true })
          .getRawOne();

        // Calculer le capital total par agence
        const capitalResult = await this.contractRepository
          .createQueryBuilder('contract')
          .select('SUM(contract.capital)', 'totalCapital')
          .where('contract.agency = :agencyId', { agencyId: agency.id })
          .andWhere('contract.isActive = :isActive', { isActive: true })
          .getRawOne();

        return {
          id: agency.id,
          name: agency.name,
          contractsCount,
          totalPrimes: parseInt(primesResult.totalPrimes) || 0,
          totalCapital: parseInt(capitalResult.totalCapital) || 0,
          percentage: 0 // Sera calculé après
        };
      })
    );

    // Calculer le total des primes pour les pourcentages
    const totalPrimes = agenciesComparison.reduce((sum, agency) => sum + agency.totalPrimes, 0);
    
    // Calculer les pourcentages
    agenciesComparison.forEach(agency => {
      agency.percentage = totalPrimes > 0 ? Math.round((agency.totalPrimes / totalPrimes) * 100) : 0;
    });

    // Trier par nombre de contrats (décroissant)
    agenciesComparison.sort((a, b) => b.contractsCount - a.contractsCount);

    // Calculer la croissance (simulation basée sur les données actuelles)
    const revenueGrowth = agenciesComparison.length > 0 ? 
      Math.round((agenciesComparison[0].totalPrimes / Math.max(totalPrimes - agenciesComparison[0].totalPrimes, 1)) * 100) : 0;

    // Préparer les données pour le graphique
    const chartData = {
      labels: agenciesComparison.map(agency => agency.name),
      contracts: agenciesComparison.map(agency => agency.contractsCount),
      primes: agenciesComparison.map(agency => agency.totalPrimes),
      capital: agenciesComparison.map(agency => agency.totalCapital)
    };

    return {
      totalRevenue: totalPrimes,
      revenueGrowth,
      agenciesComparison,
      chartData
    };
  }

  /**
   * Obtenir les contrats qui vont échoir
   */
  async getContractsExpiring(period: string): Promise<Array<{
    id: number;
    contractNumber: string;
    customerName: string;
    agencyName: string;
    amount: number;
    expiryDate: string;
    daysUntilExpiry: number;
  }>> {
    // Calculer les dates selon la période
    const now = new Date();
    let endDate: Date;
    
    switch (period) {
      case '7days':
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      case '6months':
        endDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    console.log('🔍 Recherche contrats échéance:', {
      now: now.toISOString(),
      endDate: endDate.toISOString(),
      period
    });

    // D'abord, vérifier tous les contrats actifs et leurs dates
    const allContracts = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('contract.agency', 'agency')
      .where('contract.isActive = :isActive', { isActive: true })
      .orderBy('contract.dateEch', 'ASC')
      .getMany();

    console.log('📋 Tous les contrats actifs:', allContracts.map(c => ({
      id: c.id,
      police: c.police,
      dateEch: c.dateEch,
      dateEff: c.dateEff,
      capital: c.capital
    })));

    // Récupérer les contrats qui vont échoir
    const contracts = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('contract.agency', 'agency')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.dateEch >= :now', { now })
      .andWhere('contract.dateEch <= :endDate', { endDate })
      .orderBy('contract.dateEch', 'ASC')
      .getMany();

    // Si aucun contrat trouvé dans la période, essayer une période plus large
    let contractsToReturn = contracts;
    if (contracts.length === 0) {
      console.log('📋 Aucun contrat dans la période demandée, recherche dans une période plus large...');
      
      // Essayer de récupérer les 5 prochains contrats par ordre de date d'échéance
      const broaderContracts = await this.contractRepository
        .createQueryBuilder('contract')
        .leftJoinAndSelect('contract.customer', 'customer')
        .leftJoinAndSelect('contract.agency', 'agency')
        .where('contract.isActive = :isActive', { isActive: true })
        .andWhere('contract.dateEch >= :now', { now })
        .orderBy('contract.dateEch', 'ASC')
        .limit(5)
        .getMany();
      
      console.log('📋 Contrats trouvés dans période élargie:', broaderContracts.length);
      contractsToReturn = broaderContracts;
    }

    // Si aucun contrat trouvé, retourner une liste vide
    if (contractsToReturn.length === 0) {
      return [];
    }

    // Transformer les données réelles
    return contractsToReturn.map(contract => {
      const expiryDate = new Date(contract.dateEch);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: contract.id,
        contractNumber: contract.police || `CT-${contract.id}`,
        customerName: contract.customer ? `${contract.customer.firstname} ${contract.customer.lastname}` : 'Client inconnu',
        agencyName: contract.agency ? contract.agency.name : 'Agence inconnue',
        amount: contract.capital || 0,
        expiryDate: contract.dateEch.toISOString(),
        daysUntilExpiry: Math.max(0, daysUntilExpiry)
      };
    });
  }

  /**
   * Obtenir les données des widgets du dashboard principal
   */
  async getDashboardWidgets(user?: any): Promise<{
    nombreContrats: {
      current: number;
      previous: number;
      percentage: number;
    };
    primeEncaisee: {
      current: number;
      previous: number;
      percentage: number;
    };
    capitalPrete: {
      current: number;
      previous: number;
      percentage: number;
    };
    nombreClients: {
      current: number;
      previous: number;
      percentage: number;
    };
    nombreAgences: {
      current: number;
      previous: number;
      percentage: number;
    };
    nombreUtilisateurs: {
      current: number;
      previous: number;
      percentage: number;
    };
  }> {
    // Debug: Afficher la structure de l'utilisateur
    console.log('🔍 DEBUG getDashboardWidgets - User object:', JSON.stringify(user, null, 2));
    
    // Extraire le rôle de l'utilisateur
    let userRole: any = user?.role;
    if (userRole && typeof userRole === 'object') {
      userRole = userRole.libelle || userRole.name || userRole.slug || '';
    }
    
    // Normaliser le rôle en majuscules pour la comparaison
    const normalizedRole = typeof userRole === 'string' ? userRole.toUpperCase() : '';
    // Vérifier si l'utilisateur est admin (ROOT, ADMIN AAVIE)
    const isAdmin = normalizedRole === 'ROOT' ||
                    normalizedRole === 'ADMIN AAVIE' ||
                    normalizedRole === 'ADMIN' ||
                    normalizedRole === 'SUPER ADMIN';
    
    // Déterminer si on doit filtrer par agence
    let agencyFilter: any = {};
    if (!isAdmin && user) {
      const userAgencyId = user.idAgency || user.agency?.id;
      console.log(`🔍 DEBUG getDashboardWidgets - userAgencyId: ${userAgencyId}, idAgency: ${user.idAgency}, agency?.id: ${user.agency?.id}`);
      if (userAgencyId) {
        agencyFilter.idAgency = userAgencyId;
        console.log(`🔒 Filtrage par agence ${userAgencyId} pour l'utilisateur avec rôle ${normalizedRole}`);
      } else {
        console.log(`⚠️ Aucune agence trouvée pour l'utilisateur - pas de filtre appliqué`);
      }
    } else {
      console.log(`👑 Utilisateur ${normalizedRole || 'non connecté'} - accès à toutes les données`);
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // 1. NOMBRE DE CONTRATS
    let currentContractsQuery = this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.isActive = :isActive', { isActive: true });
    
    if (agencyFilter.idAgency) {
      currentContractsQuery.andWhere('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const currentContracts = await currentContractsQuery.getCount();
    
    let previousContractsQuery = this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.createdAt < :startOfMonth', { startOfMonth });
    
    if (agencyFilter.idAgency) {
      previousContractsQuery.andWhere('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const previousContracts = await previousContractsQuery.getCount();

    // 2. PRIME ENCAISSÉE (non utilisé dans les widgets restants, mais on garde pour compatibilité)
    let currentPrimesQuery = this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.puttc)', 'totalPrimes')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.createdAt >= :startOfMonth', { startOfMonth })
      .andWhere('contract.createdAt <= :endOfMonth', { endOfMonth });
    
    if (agencyFilter.idAgency) {
      currentPrimesQuery.andWhere('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const currentPrimesResult = await currentPrimesQuery.getRawOne();

    let previousPrimesQuery = this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.puttc)', 'totalPrimes')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.createdAt >= :startOfLastMonth', { startOfLastMonth })
      .andWhere('contract.createdAt <= :endOfLastMonth', { endOfLastMonth });
    
    if (agencyFilter.idAgency) {
      previousPrimesQuery.andWhere('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const previousPrimesResult = await previousPrimesQuery.getRawOne();

    // 3. CAPITAL PRÊTÉ (non utilisé dans les widgets restants, mais on garde pour compatibilité)
    let currentCapitalQuery = this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.capital)', 'totalCapital')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.createdAt >= :startOfMonth', { startOfMonth })
      .andWhere('contract.createdAt <= :endOfMonth', { endOfMonth });
    
    if (agencyFilter.idAgency) {
      currentCapitalQuery.andWhere('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const currentCapitalResult = await currentCapitalQuery.getRawOne();

    let previousCapitalQuery = this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.capital)', 'totalCapital')
      .where('contract.isActive = :isActive', { isActive: true })
      .andWhere('contract.createdAt >= :startOfLastMonth', { startOfLastMonth })
      .andWhere('contract.createdAt <= :endOfLastMonth', { endOfLastMonth });
    
    if (agencyFilter.idAgency) {
      previousCapitalQuery.andWhere('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const previousCapitalResult = await previousCapitalQuery.getRawOne();

    // 4. NOMBRE DE CLIENTS
    // Pour les clients, on filtre par agence via les contrats
    let currentClientsQuery = this.customerRepository
      .createQueryBuilder('customer');
    
    if (agencyFilter.idAgency) {
      currentClientsQuery
        .innerJoin('contracts', 'contract', 'contract.idCustomer = customer.id')
        .where('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency })
        .andWhere('contract.isActive = :isActive', { isActive: true })
        .distinct(true);
    }
    
    const currentClients = await currentClientsQuery.getCount();
    
    let previousClientsQuery = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.createdAt < :startOfMonth', { startOfMonth });
    
    if (agencyFilter.idAgency) {
      previousClientsQuery
        .innerJoin('contracts', 'contract', 'contract.idCustomer = customer.id')
        .andWhere('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency })
        .andWhere('contract.isActive = :isActive', { isActive: true })
        .distinct(true);
    }
    
    const previousClients = await previousClientsQuery.getCount();

    // 5. NOMBRE D'AGENCES
    // Si l'utilisateur n'est pas admin, on compte seulement son agence (1 ou 0)
    let currentAgencies: number;
    if (agencyFilter.idAgency) {
      // Vérifier si l'agence existe
      const agencyExists = await this.agencyRepository.findOne({ where: { id: agencyFilter.idAgency } });
      currentAgencies = agencyExists ? 1 : 0;
    } else {
      currentAgencies = await this.agencyRepository.count();
    }
    
    // Pour les agences, on considère qu'elles sont créées une seule fois
    const previousAgencies = currentAgencies; // Pas de changement historique pour les agences

    // 6. NOMBRE D'UTILISATEURS
    // Filtrer par agence si nécessaire
    let currentUsersQuery = this.userRepository
      .createQueryBuilder('user');
    
    if (agencyFilter.idAgency) {
      currentUsersQuery.where('user.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const currentUsers = await currentUsersQuery.getCount();
    
    let previousUsersQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.created_at < :startOfMonth', { startOfMonth });
    
    if (agencyFilter.idAgency) {
      previousUsersQuery.andWhere('user.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const previousUsers = await previousUsersQuery.getCount();

    // Fonction utilitaire pour calculer le pourcentage
    const calculatePercentage = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      nombreContrats: {
        current: currentContracts,
        previous: previousContracts,
        percentage: calculatePercentage(currentContracts, previousContracts)
      },
      primeEncaisee: {
        current: parseInt(currentPrimesResult.totalPrimes) || 0,
        previous: parseInt(previousPrimesResult.totalPrimes) || 0,
        percentage: calculatePercentage(
          parseInt(currentPrimesResult.totalPrimes) || 0,
          parseInt(previousPrimesResult.totalPrimes) || 0
        )
      },
      capitalPrete: {
        current: parseInt(currentCapitalResult.totalCapital) || 0,
        previous: parseInt(previousCapitalResult.totalCapital) || 0,
        percentage: calculatePercentage(
          parseInt(currentCapitalResult.totalCapital) || 0,
          parseInt(previousCapitalResult.totalCapital) || 0
        )
      },
      nombreClients: {
        current: currentClients,
        previous: previousClients,
        percentage: calculatePercentage(currentClients, previousClients)
      },
      nombreAgences: {
        current: currentAgencies,
        previous: previousAgencies,
        percentage: calculatePercentage(currentAgencies, previousAgencies)
      },
      nombreUtilisateurs: {
        current: currentUsers,
        previous: previousUsers,
        percentage: calculatePercentage(currentUsers, previousUsers)
      }
    };
  }

  /**
   * Obtenir les totaux (capital prêté, prime encaissée)
   * avec gestion des rôles : si l'utilisateur n'est pas ADMIN ou SUPER ADMIN,
   * on récupère uniquement les données de son agence
   */
  async getWelcomeTotals(user?: any): Promise<{
    totalCapital: number;
    totalPrime: number;
    byNature: Array<{
      idNatureCredit: number;
      code: string;
      libelle: string;
      capitalLabel: string;
      totalCapital: number;
      totalPrime: number;
      nombreEnCours: number;
      nombreEchu: number;
      capitalEnCours: number;
      capitalEchu: number;
      primeEnCours: number;
      primeEchu: number;
    }>;
  }> {
    // Extraire le rôle de l'utilisateur
    let userRole: any = user?.role;
    if (userRole && typeof userRole === 'object') {
      userRole = userRole.libelle || userRole.name || userRole.slug || '';
    }
    
    // Normaliser le rôle en majuscules pour la comparaison
    const normalizedRole = typeof userRole === 'string' ? userRole.toUpperCase() : '';
    // Vérifier si l'utilisateur est admin (ROOT, ADMIN AAVIE)
    const isAdmin = normalizedRole === 'ROOT' ||
                    normalizedRole === 'ADMIN AAVIE' ||
                    normalizedRole === 'ADMIN' ||
                    normalizedRole === 'SUPER ADMIN';
    
    // Déterminer si on doit filtrer par agence
    let agencyFilter: any = {};
    if (!isAdmin && user) {
      const userAgencyId = user.idAgency || user.agency?.id;
      if (userAgencyId) {
        agencyFilter.idAgency = userAgencyId;
        console.log(`🔒 Filtrage par agence ${userAgencyId} pour l'utilisateur avec rôle ${normalizedRole}`);
      }
    } else {
      console.log(`👑 Utilisateur ${normalizedRole} - accès à toutes les données`);
    }

    // 1. TOTAL CAPITAL PRÊTÉ
    const capitalQuery = this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.capital)', 'totalCapital')
      .where('contract.isActive = :isActive', { isActive: true });
    
    if (agencyFilter.idAgency) {
      capitalQuery.andWhere('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const capitalResult = await capitalQuery.getRawOne();
    const totalCapital = parseInt(capitalResult.totalCapital) || 0;

    // 2. TOTAL PRIME ENCAISSÉE
    const primeQuery = this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.puttc)', 'totalPrime')
      .where('contract.isActive = :isActive', { isActive: true });
    
    if (agencyFilter.idAgency) {
      primeQuery.andWhere('contract.idAgency = :agencyId', { agencyId: agencyFilter.idAgency });
    }
    
    const primeResult = await primeQuery.getRawOne();
    const totalPrime = parseInt(primeResult?.totalPrime) || 0;

    // 3. TOTAUX ET DÉTAILS PAR NATURE DE CRÉDIT (Inclus toutes les natures, y compris celles avec 0 contrat)
    const now = new Date();
    const natureQuery = this.contractRepository.manager
      .createQueryBuilder(NatureCredit, 'natureCredit')
      .leftJoin(
        Contract,
        'contract',
        'contract.idNatureCredit = natureCredit.id AND contract.isActive = :isActive' + (agencyFilter.idAgency ? ' AND contract.idAgency = :agencyId' : ''),
        { isActive: true, agencyId: agencyFilter.idAgency }
      )
      .select('natureCredit.id', 'idNatureCredit')
      .addSelect('natureCredit.code', 'code')
      .addSelect('natureCredit.libelle', 'libelle')
      .addSelect('COALESCE(SUM(contract.capital), 0)', 'totalCapital')
      .addSelect('COALESCE(SUM(contract.puttc), 0)', 'totalPrime')
      .addSelect('COALESCE(SUM(CASE WHEN contract.id IS NOT NULL AND (contract.dateEch IS NULL OR contract.dateEch >= :now) THEN 1 ELSE 0 END), 0)', 'nombreEnCours')
      .addSelect('COALESCE(SUM(CASE WHEN contract.id IS NOT NULL AND contract.dateEch IS NOT NULL AND contract.dateEch < :now THEN 1 ELSE 0 END), 0)', 'nombreEchu')
      .addSelect('COALESCE(SUM(CASE WHEN contract.id IS NOT NULL AND (contract.dateEch IS NULL OR contract.dateEch >= :now) THEN contract.capital ELSE 0 END), 0)', 'capitalEnCours')
      .addSelect('COALESCE(SUM(CASE WHEN contract.id IS NOT NULL AND contract.dateEch IS NOT NULL AND contract.dateEch < :now THEN contract.capital ELSE 0 END), 0)', 'capitalEchu')
      .addSelect('COALESCE(SUM(CASE WHEN contract.id IS NOT NULL AND (contract.dateEch IS NULL OR contract.dateEch >= :now) THEN contract.puttc ELSE 0 END), 0)', 'primeEnCours')
      .addSelect('COALESCE(SUM(CASE WHEN contract.id IS NOT NULL AND contract.dateEch IS NOT NULL AND contract.dateEch < :now THEN contract.puttc ELSE 0 END), 0)', 'primeEchu')
      .where('natureCredit.isActive = :natureIsActive', { natureIsActive: true })
      .setParameter('now', now)
      .groupBy('natureCredit.id')
      .addGroupBy('natureCredit.code')
      .addGroupBy('natureCredit.libelle');

    const natureResults = await natureQuery.getRawMany();

    const byNature = natureResults.map(res => {
      const codeUpper = (res.code || res.libelle || '').toUpperCase();
      let capitalLabel = 'CAPITAL GARANTI';
      if (codeUpper.includes('AMORT')) {
        capitalLabel = 'CAPITAL PRÊTÉ';
      }

      return {
        idNatureCredit: parseInt(res.idNatureCredit) || 0,
        code: res.code || '',
        libelle: res.libelle || 'Nature de Crédit',
        capitalLabel,
        totalCapital: parseInt(res.totalCapital) || 0,
        totalPrime: parseInt(res.totalPrime) || 0,
        nombreEnCours: parseInt(res.nombreEnCours) || 0,
        nombreEchu: parseInt(res.nombreEchu) || 0,
        capitalEnCours: parseInt(res.capitalEnCours) || 0,
        capitalEchu: parseInt(res.capitalEchu) || 0,
        primeEnCours: parseInt(res.primeEnCours) || 0,
        primeEchu: parseInt(res.primeEchu) || 0
      };
    });

    return {
      totalCapital,
      totalPrime,
      byNature
    };
  }
}
