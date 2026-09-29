import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Agency } from '../entity/agency.entity';
import { Office } from '../entity/office.entity';
import { User } from 'src/modules/gestionUsers/entity/user.entity';
import { Contract } from '../entity/contract.entity';

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(Agency)
    private agencyRepository: Repository<Agency>,
    @InjectRepository(Office)
    private officeRepository: Repository<Office>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  /** Retourne les bureaux d'une agence donnée */
  async findOfficesByAgency(identifier: string | number): Promise<Office[]> {
    let agencyId: number | null = null;
    if (typeof identifier === 'number') {
      agencyId = identifier;
    } else if (/^\d+$/.test(String(identifier).trim())) {
      agencyId = parseInt(String(identifier).trim(), 10);
    } else {
      const agency = await this.findOne(identifier);
      agencyId = agency?.id || null;
    }

    if (!agencyId) return [];

    return this.officeRepository.find({
      where: { idAgency: agencyId },
      order: { officeName: 'ASC' },
    });
  }

  async findAll(
    idRole?: number, 
    idAgency?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    agencies: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    console.log(`🔍 AgencyService.findAll - idRole: ${idRole}, idAgency: ${idAgency}, page: ${page}, limit: ${limit}`);
    
    const queryBuilder = this.agencyRepository.createQueryBuilder('agency');
    
    if (idRole === 1 || idRole === 5) {
      console.log('👑 Utilisateur admin (idRole:', idRole, ') - toutes les agences');
    } else if (idRole === 2) {
      console.log('👔 Utilisateur manager (idRole: 2) - toutes les agences sauf L\'AFRICAINE VIE');
      queryBuilder.where('agency.id != 1 AND agency.name NOT LIKE :africaine', { africaine: '%AFRICAINE%' });
    } else if (idAgency) {
      console.log(`👤 Utilisateur standard (idRole: ${idRole}) - filtrage par agence ${idAgency}`);
      queryBuilder.where('agency.id = :idAgency', { idAgency });
    }
    
    // Compter le total avant la pagination
    const total = await queryBuilder.getCount();
    
    // Appliquer la pagination seulement si limit > 0
    if (limit > 0) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }
    
    // Ordonner par nom
    queryBuilder.orderBy('agency.name', 'ASC');
    
    // Récupérer les agences
    const agencies = await queryBuilder.getMany();
    
    // Ajouter les compteurs pour chaque agence
    const agenciesWithCounts = await Promise.all(
      agencies.map(async (agency) => {
        const usersCount = await this.userRepository.count({
          where: { idAgency: agency.id }
        });
        
        const contractsCount = await this.contractRepository.count({
          where: { idAgency: agency.id }
        });
        
        return {
          ...agency,
          usersCount,
          contractsCount
        };
      })
    );
    
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    
    console.log(`📋 Agences récupérées: ${agenciesWithCounts.length} sur ${total} (page ${page}/${totalPages})`);
    
    return {
      agencies: agenciesWithCounts,
      total,
      page,
      limit,
      totalPages
    };
  }

  async findOne(identifier: string | number): Promise<any | null> {
    const str = String(identifier).trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let where: any = { id: parseInt(str, 10) || 0 };
    if (uuidRegex.test(str)) {
      where = { uuid: str };
    } else if (str.includes('-') && str.split('-').length >= 6) {
      const extracted = str.split('-').slice(0, 5).join('-');
      if (uuidRegex.test(extracted)) {
        where = { uuid: extracted };
      }
    }

    const agency = await this.agencyRepository.findOne({ where });
    
    if (!agency) {
      return null;
    }

    if (!agency.uuid) {
      agency.uuid = randomUUID();
      await this.agencyRepository.update(agency.id, { uuid: agency.uuid }).catch(() => {});
    }
    
    // Ajouter les compteurs pour cette agence
    const usersCount = await this.userRepository.count({
      where: { idAgency: agency.id }
    });
    
    const contractsCount = await this.contractRepository.count({
      where: { idAgency: agency.id }
    });
    
    return {
      ...agency,
      usersCount,
      contractsCount
    };
  }

  async findBySubscriber(idSubscriber: number): Promise<Agency[]> {
    return this.agencyRepository.find({ where: { idSubscriber } });
  }

  async findByName(name: string): Promise<Agency[]> {
    return this.agencyRepository.find({ where: { name } });
  }

  async findByEmail(email: string): Promise<Agency | null> {
    return this.agencyRepository.findOne({ where: { email } });
  }

  async create(agencyData: Partial<Agency>): Promise<Agency> {
    const agency = this.agencyRepository.create({
      ...agencyData,
      uuid: agencyData.uuid || randomUUID(),
    });
    return this.agencyRepository.save(agency);
  }

  async update(identifier: string | number, agencyData: Partial<Agency>): Promise<Agency | null> {
    const existing = await this.findOne(identifier);
    if (!existing) return null;
    await this.agencyRepository.update(existing.id, agencyData);
    return this.findOne(existing.id);
  }

  async remove(identifier: string | number): Promise<void> {
    const existing = await this.findOne(identifier);
    if (existing) {
      await this.agencyRepository.delete(existing.id);
    }
  }

  async findUsersByAgency(identifier: string | number): Promise<any[]> {
    let agencyId: number | null = null;
    if (typeof identifier === 'number') {
      agencyId = identifier;
    } else if (/^\d+$/.test(String(identifier).trim())) {
      agencyId = parseInt(String(identifier).trim(), 10);
    } else {
      const agency = await this.findOne(identifier);
      agencyId = agency?.id || null;
    }

    if (!agencyId) return [];

    const users = await this.userRepository.find({
      where: { idAgency: agencyId },
      relations: ['role', 'agency'],
      order: { lastname: 'ASC' }
    });
    
    console.log(`🔍 Utilisateurs trouvés pour l'agence ${agencyId}:`, users.length);
    if (users.length > 0) {
      console.log(`🔍 Premier utilisateur (structure):`, {
        id: users[0].id,
        firstname: users[0].firstname,
        lastname: users[0].lastname,
        role: users[0].role,
        hasRole: !!users[0].role
      });
    }
    
    return users;
  }

  async findContractsByAgency(identifier: string | number, page: number = 1, limit: number = 7): Promise<any> {
    let agencyId: number | null = null;
    if (typeof identifier === 'number') {
      agencyId = identifier;
    } else if (/^\d+$/.test(String(identifier).trim())) {
      agencyId = parseInt(String(identifier).trim(), 10);
    } else {
      const agency = await this.findOne(identifier);
      agencyId = agency?.id || null;
    }

    if (!agencyId) {
      return { contracts: [], total: 0, page, limit, totalPages: 0 };
    }

    const queryBuilder = this.contractRepository.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('contract.agency', 'agency')
      .leftJoinAndSelect('contract.product', 'product')
      .leftJoinAndSelect('contract.natureCredit', 'natureCredit')
      .leftJoinAndSelect('contract.contractState', 'contractState')
      .leftJoinAndSelect('contract.user', 'user')
      .where('contract.idAgency = :agencyId', { agencyId })
      .orderBy('contract.createdAt', 'DESC');

    // Compter le total
    const total = await queryBuilder.getCount();
    
    // Appliquer la pagination
    const contracts = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    const totalPages = Math.ceil(total / limit);
    
    console.log(`🔍 Contrats trouvés pour l'agence ${agencyId}:`, contracts.length, `(page ${page}/${totalPages})`);
    if (contracts.length > 0) {
      console.log(`🔍 Premier contrat (structure):`, {
        id: contracts[0].id,
        police: contracts[0].police,
        customer: contracts[0].customer,
        hasCustomer: !!contracts[0].customer
      });
    }
    
    return {
      contracts,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getAgencyStats(identifier: string | number): Promise<any> {
    let agencyId: number | null = null;
    if (typeof identifier === 'number') {
      agencyId = identifier;
    } else if (/^\d+$/.test(String(identifier).trim())) {
      agencyId = parseInt(String(identifier).trim(), 10);
    } else {
      const agency = await this.findOne(identifier);
      agencyId = agency?.id || null;
    }

    if (!agencyId) return null;

    // Compter les utilisateurs par statut
    const totalUsers = await this.userRepository.count({
      where: { idAgency: agencyId }
    });
    
    const activeUsers = await this.userRepository.count({
      where: { idAgency: agencyId, status: 'ACTIVE' }
    });
    
    const suspendedUsers = await this.userRepository.count({
      where: { idAgency: agencyId, status: 'SUSPENDED' }
    });
    
    const inactiveUsers = await this.userRepository.count({
      where: { idAgency: agencyId, status: 'INACTIVE' }
    });

    // Compter les contrats par statut
    const totalContracts = await this.contractRepository.count({
      where: { idAgency: agencyId }
    });
    
    const activeContracts = await this.contractRepository.count({
      where: { idAgency: agencyId, isActive: true }
    });
    
    const inactiveContracts = await this.contractRepository.count({
      where: { idAgency: agencyId, isActive: false }
    });

    // Calculer les primes totales
    const contracts = await this.contractRepository.find({
      where: { idAgency: agencyId },
      select: ['puttc']
    });
    
    const totalPrimes = contracts.reduce((sum, contract) => {
      return sum + (contract.puttc || 0);
    }, 0);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      inactiveUsers,
      totalContracts,
      activeContracts,
      inactiveContracts,
      totalPrimes
    };
  }

  async createMultiple(agenciesData: Partial<Agency>[]): Promise<Agency[]> {
    try {
      console.log(`🚀 Création en masse de ${agenciesData.length} agences...`);
      
      // Vérifier les doublons de noms d'agence
      const agencyNames = agenciesData.map(agency => agency.name?.trim().toLowerCase()).filter(Boolean);
      const duplicateNames = agencyNames.filter((name, index) => agencyNames.indexOf(name) !== index);
      
      if (duplicateNames.length > 0) {
        throw new Error(`Noms d'agence en doublon détectés: ${[...new Set(duplicateNames)].join(', ')}`);
      }
      
      // Vérifier les doublons avec les agences existantes
      const existingAgencies = await this.agencyRepository
        .createQueryBuilder('agency')
        .where('LOWER(agency.name) IN (:...names)', { names: agencyNames })
        .andWhere('agency.deletedAt IS NULL')
        .select(['agency.name'])
        .getMany();
      
      if (existingAgencies.length > 0) {
        const existingNames = existingAgencies.map(agency => agency.name);
        throw new Error(`Les agences suivantes existent déjà: ${existingNames.join(', ')}`);
      }
      
      // Préparer les données avec les champs d'audit
      const processedAgencies = agenciesData.map(agencyData => ({
        ...agencyData,
        name: agencyData.name?.trim(), // Nettoyer les espaces
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
        deletedBy: undefined,
        // Valeurs par défaut si non fournies
        idSubscriber: agencyData.idSubscriber || 1,
        createdBy: agencyData.createdBy || 1,
        updatedBy: undefined
      }));

      console.log(`📋 Données préparées:`, processedAgencies.length, 'agences');
      
      // Créer les agences
      const agencies = this.agencyRepository.create(processedAgencies);
      const savedAgencies = await this.agencyRepository.save(agencies);
      
      console.log(`✅ ${savedAgencies.length} agences créées avec succès`);
      
      // Vérification finale
      if (!savedAgencies || savedAgencies.length === 0) {
        throw new Error('Aucune agence n\'a été créée');
      }
      
      if (savedAgencies.length !== agenciesData.length) {
        console.warn(`⚠️ Nombre d'agences créées (${savedAgencies.length}) différent du nombre attendu (${agenciesData.length})`);
      }
      
      return savedAgencies;
      
    } catch (error) {
      console.error('❌ Erreur lors de la création en masse des agences:', error);
      
      // Gestion spécifique des erreurs
      if (error.message.includes('Noms d\'agence en doublon détectés')) {
        throw error; // Re-lancer l'erreur de doublon telle quelle
      } else if (error.message.includes('Les agences suivantes existent déjà')) {
        throw error; // Re-lancer l'erreur d'existence telle quelle
      } else if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Une ou plusieurs agences existent déjà dans la base de données');
      } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new Error('Référence invalide dans les données (idSubscriber, createdBy, etc.)');
      } else if (error.code === 'ER_DATA_TOO_LONG') {
        throw new Error('Une ou plusieurs valeurs sont trop longues pour les champs de la base de données');
      } else {
        throw new Error(`Erreur lors de la création en masse des agences: ${error.message}`);
      }
    }
  }
}
