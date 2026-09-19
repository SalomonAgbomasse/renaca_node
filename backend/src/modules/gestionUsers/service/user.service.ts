import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DeepPartial } from 'typeorm';
import { User } from '../entity/user.entity';
import { Role } from '../entity/role.entity';
import { Agency } from '../../gestionContracts/entity/agency.entity';
import { Contract } from '../../gestionContracts/entity/contract.entity';
import { Cotation } from '../../gestionContracts/entity/cotation.entity';
import { UserActivity, ActivityType } from '../entity/user-activity.entity';
import { SystemSettingService } from './system-setting.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Agency)
    private agencyRepository: Repository<Agency>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Cotation)
    private cotationRepository: Repository<Cotation>,
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
    private readonly settingService: SystemSettingService,
  ) {}

  async findAll(
    idRole?: number, 
    idAgency?: number,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    console.log(`🔍 UserService.findAll - idRole: ${idRole}, idAgency: ${idAgency}, page: ${page}, limit: ${limit}, search: ${search}`);
    
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.agency', 'agency');
    
    if (idRole === 1 || idRole === 5) {
      console.log('👑 Utilisateur admin (idRole:', idRole, ') - tous les utilisateurs');
    } else if (idRole === 2) {
      console.log('👔 Utilisateur manager (idRole: 2) - tous les utilisateurs sauf L\'AFRICAINE VIE');
      queryBuilder.where(
        '(user.idAgency IS NULL OR (user.idAgency != 1 AND (agency.name IS NULL OR agency.name NOT LIKE :africaine))) AND (user.email IS NULL OR user.email NOT LIKE :africaineEmail)',
        { africaine: '%AFRICAINE%', africaineEmail: '%@lafricaineviebenin.com' }
      );
    } else if (idAgency) {
      console.log(`👤 Utilisateur standard (idRole: ${idRole}) - filtrage par agence ${idAgency}`);
      queryBuilder.where('user.idAgency = :idAgency', { idAgency });
    }

    if (search && search.trim()) {
      const cleanedSearch = search.trim().replace(/\/+$/, '');
      const searchLower = cleanedSearch.toLowerCase();
      
      const statusMapping: { [key: string]: string[] } = {
        'actif': ['ACTIVE'],
        'active': ['ACTIVE'],
        'suspendu': ['SUSPENDED'],
        'suspended': ['SUSPENDED'],
        'inactif': ['INACTIVE'],
        'inactive': ['INACTIVE'],
        'desactive': ['INACTIVE', 'DESACTIVE'],
        'desactivé': ['INACTIVE', 'DESACTIVE']
      };
      
      const statusValues = statusMapping[searchLower] || [];
      
      let searchCondition = '(user.firstname LIKE :search OR user.lastname LIKE :search OR user.email LIKE :search OR user.phone LIKE :search OR role.libelle LIKE :search OR agency.name LIKE :search OR user.status LIKE :search';
      
      if (statusValues.length > 0) {
        const statusConditions = statusValues.map((val, idx) => `user.status = :status${idx}`).join(' OR ');
        searchCondition += ` OR (${statusConditions})`;
      }
      
      searchCondition += ')';
      
      const searchParams: any = { search: `%${cleanedSearch}%` };
      if (statusValues.length > 0) {
        statusValues.forEach((val, idx) => {
          searchParams[`status${idx}`] = val;
        });
      }
      
      queryBuilder.andWhere(searchCondition, searchParams);
    }
    
    // Compter le total avant la pagination
    const total = await queryBuilder.getCount();
    
    // Appliquer la pagination si limit > 0
    if (limit > 0) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }
    
    // Ordonner par nom de famille
    queryBuilder.orderBy('user.lastname', 'ASC');
    
    // Récupérer les utilisateurs
    const users = await queryBuilder.getMany();
    
    const totalPages = Math.ceil(total / limit);
    
    console.log(`📋 Utilisateurs récupérés: ${users.length} sur ${total} (page ${page}/${totalPages})`);
    
    return {
      users,
      total,
      page,
      limit,
      totalPages
    };
  }

  async findOne(id: number, options?: {
    includeRole?: boolean;
    includeAgency?: boolean;
    includePermissions?: boolean;
  }): Promise<User | null> {
    const relations: string[] = [];
    if (options?.includeRole !== false) {
      relations.push('role');
    }
    if (options?.includeAgency !== false) {
      relations.push('agency');
    }

    return this.userRepository.findOne({ 
      where: { id },
      relations
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'agency']
    });
  }

  async findByRole(idRole: number): Promise<User[]> {
    return this.userRepository.find({
      where: { idRole },
      relations: ['role', 'agency']
    });
  }

  async findByAgency(idAgency: number): Promise<User[]> {
    return this.userRepository.find({
      where: { idAgency },
      relations: ['role', 'agency']
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const userFields = userData as any;

    // ✅ Vérification préventive des doublons email et téléphone
    if (userFields.email) {
      const existingByEmail = await this.userRepository.findOne({
        where: { email: userFields.email },
        withDeleted: true,
      });
      if (existingByEmail) {
        throw new BadRequestException(
          `L'adresse email '${userFields.email}' est déjà utilisée par un autre utilisateur.`
        );
      }
    }
    if (userFields.phone) {
      const existingByPhone = await this.userRepository.findOne({
        where: { phone: userFields.phone },
        withDeleted: true,
      });
      if (existingByPhone) {
        throw new BadRequestException(
          `Le numéro de téléphone '${userFields.phone}' est déjà utilisé par un autre utilisateur.`
        );
      }
    }

    // Générer un salt unique
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Hasher le mot de passe avec le salt
    const hashedPassword = await bcrypt.hash(userFields.password + salt, 10);
    
    // Assigner un rôle par défaut si aucun n'est fourni
    if (!userFields.idRole) {
      const defaultRole = await this.roleRepository.findOne({ where: { libelle: 'Utilisateur' } });
      if (defaultRole) {
        userFields.idRole = defaultRole.id;
      } else {
        throw new Error('Aucun rôle par défaut trouvé. Veuillez spécifier un rôle.');
      }
    }

    const userPayload: DeepPartial<User> = {
      ...userFields,
      salt,
      password: hashedPassword
    };
    
    const user = this.userRepository.create(userPayload);
    
    const savedUser = await this.userRepository.save(user);
    
    const sendEmailSetting = await this.settingService.get('SEND_WELCOME_EMAIL', 'false');
    if (sendEmailSetting !== 'false') {
      await this.sendWelcomeEmail(userFields, savedUser.id);
    } else {
      console.log(`ℹ️ L'envoi automatique d'email de bienvenue est désactivé par configuration système. Étape ignorée pour ${savedUser.email}.`);
    }
    
    return savedUser;
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    const userFields = userData as any;

    if (userFields.email) {
      const existingByEmail = await this.userRepository.findOne({
        where: { email: userFields.email },
        withDeleted: true,
      });
      if (existingByEmail && existingByEmail.id !== id) {
        throw new BadRequestException(
          `L'adresse email '${userFields.email}' est déjà utilisée par un autre utilisateur.`
        );
      }
    }
    if (userFields.phone) {
      const existingByPhone = await this.userRepository.findOne({
        where: { phone: userFields.phone },
        withDeleted: true,
      });
      if (existingByPhone && existingByPhone.id !== id) {
        throw new BadRequestException(
          `Le numéro de téléphone '${userFields.phone}' est déjà utilisé par un autre utilisateur.`
        );
      }
    }

    if (Object.keys(userFields).length > 0) {
      await this.userRepository.update(id, userFields);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async createMultiple(usersData: Partial<User>[]): Promise<User[]> {
    const processedUsers: Partial<User>[] = [];
    
    for (const userData of usersData) {
      // ✅ Vérification préventive des doublons pour chaque utilisateur du lot
      if (userData.email) {
        const existingByEmail = await this.userRepository.findOne({
          where: { email: userData.email },
          withDeleted: true,
        });
        if (existingByEmail) {
          throw new BadRequestException(
            `L'adresse email '${userData.email}' est déjà utilisée par un autre utilisateur.`
          );
        }
      }
      if (userData.phone) {
        const existingByPhone = await this.userRepository.findOne({
          where: { phone: userData.phone },
          withDeleted: true,
        });
        if (existingByPhone) {
          throw new BadRequestException(
            `Le numéro de téléphone '${userData.phone}' est déjà utilisé par un autre utilisateur.`
          );
        }
      }

      // Générer un salt unique pour chaque utilisateur
      const salt = crypto.randomBytes(16).toString('hex');
      
      // Hasher le mot de passe avec le salt
      const hashedPassword = await bcrypt.hash(userData.password + salt, 10);
      
      // Assigner un rôle par défaut si aucun n'est fourni
      if (!userData.idRole) {
        // Chercher le rôle "Utilisateur" par défaut
        const defaultRole = await this.roleRepository.findOne({ where: { libelle: 'Utilisateur' } });
        if (defaultRole) {
          userData.idRole = defaultRole.id;
        } else {
          throw new Error('Aucun rôle par défaut trouvé. Veuillez spécifier un rôle.');
        }
      }
      
      // Créer l'utilisateur avec le salt et le mot de passe hashé
      const processedUser = {
        ...userData,
        password: hashedPassword,
        salt: salt,
        status: userData.status || 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      processedUsers.push(processedUser);
    }
    
    const users = this.userRepository.create(processedUsers);
    const savedUsers = await this.userRepository.save(users);
    
    // Envoyer les emails de bienvenue pour chaque utilisateur créé
    for (let i = 0; i < savedUsers.length; i++) {
      try {
        await this.sendWelcomeEmail(usersData[i], savedUsers[i].id);
      } catch (error) {
        console.error(`Erreur lors de l'envoi de l'email pour l'utilisateur ${savedUsers[i].id}:`, error);
        // Ne pas faire échouer la création si l'email échoue
      }
    }
    
    return savedUsers;
  }

  async updateMultipleStatus(updates: { id: number; status: string }[]): Promise<void> {
    for (const update of updates) {
      await this.userRepository.update(update.id, { status: update.status });
    }
  }

  // Désactiver un utilisateur
  async deactivateUser(id: number): Promise<User | null> {
    await this.userRepository.update(id, { 
      status: 'DESACTIVE',
      updatedAt: new Date()
    });
    return this.findOne(id);
  }

  // Activer un utilisateur
  async activateUser(id: number): Promise<User | null> {
    await this.userRepository.update(id, { 
      status: 'ACTIVE',
      updatedAt: new Date()
    });
    return this.findOne(id);
  }

  // Suppression logique (soft delete)
  async softDeleteUser(id: number, deletedBy: number): Promise<void> {
    await this.userRepository.update(id, {
      deletedAt: new Date(),
      deletedBy
    });
  }

  // Restaurer un utilisateur supprimé
  async restoreUser(id: number): Promise<User | null> {
    await this.userRepository.update(id, {
      deletedAt: undefined,
      deletedBy: undefined
    });
    return this.findOne(id);
  }

  // Réinitialiser le mot de passe
  async resetPassword(id: number, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    if (user.status === 'DESACTIVE') {
      throw new Error('Impossible de réinitialiser le mot de passe d\'un utilisateur désactivé');
    }
    
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(newPassword + salt, 10);
    
    await this.userRepository.update(id, {
      password: hashedPassword,
      salt,
      updatedAt: new Date()
    });
  }

  // Changer le mot de passe
  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.findOne(id);
    if (!user) return false;

    if (user.status === 'DESACTIVE') {
      throw new Error('Impossible de changer le mot de passe d\'un utilisateur désactivé');
    }

    const isValidOldPassword = await bcrypt.compare(oldPassword + user.salt, user.password);
    if (!isValidOldPassword) return false;

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(newPassword + salt, 10);
    
    await this.userRepository.update(id, {
      password: hashedPassword,
      salt,
      updatedAt: new Date()
    });

    return true;
  }

  // Vérifier le mot de passe
  async verifyPassword(id: number, password: string): Promise<boolean> {
    const user = await this.findOne(id);
    if (!user) return false;
    
    if (user.status === 'DESACTIVE') {
      throw new Error('Impossible de vérifier le mot de passe d\'un utilisateur désactivé');
    }
    
    return await bcrypt.compare(password + user.salt, user.password);
  }

  // Rechercher des utilisateurs
  async searchUsers(query: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.lastname LIKE :query OR user.firstname LIKE :query OR user.email LIKE :query', {
        query: `%${query}%`
      })
      .andWhere('user.deletedAt IS NULL')
      .getMany();
  }

  // Obtenir les utilisateurs par statut
  async getUsersByStatus(status: string): Promise<User[]> {
    return this.userRepository.find({
      where: { status, deletedAt: undefined }
    });
  }

  // Obtenir les utilisateurs supprimés
  async getDeletedUsers(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.deletedAt IS NOT NULL')
      .getMany();
  }

  // Méthode pour calculer les statistiques de l'utilisateur
  async getUserStatistics(userId: number, days: number = 30): Promise<any> {
    try {
      // Calculer les dates
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Récupérer l'utilisateur pour vérifier qu'il existe
      const user = await this.findOne(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const userIdNum = Number(userId);

      // 1. Statistiques générales
      const totalContracts = await this.contractRepository.count({
        where: { idUser: userIdNum }
      });

      const primesResult = await this.contractRepository
        .createQueryBuilder('c')
        .select('SUM(c.puttc)', 'sumPrimes')
        .where('c.idUser = :userId', { userId: userIdNum })
        .getRawOne();
      const totalPrimes = Number(primesResult?.sumPrimes) || 0;

      const capitalResult = await this.contractRepository
        .createQueryBuilder('c')
        .select('SUM(c.capital)', 'sumCapital')
        .where('c.idUser = :userId', { userId: userIdNum })
        .getRawOne();
      const totalCapital = Number(capitalResult?.sumCapital) || 0;

      const totalCotations = await this.cotationRepository.count({
        where: { idUser: userIdNum }
      });

      const clientsResult = await this.contractRepository
        .createQueryBuilder('c')
        .select('COUNT(DISTINCT c.idCustomer)', 'countClients')
        .where('c.idUser = :userId', { userId: userIdNum })
        .getRawOne();
      const totalClients = Number(clientsResult?.countClients) || 0;

      const commissionsResult = await this.contractRepository
        .createQueryBuilder('c')
        .select('SUM(c.pc)', 'sumCommissions')
        .where('c.idUser = :userId', { userId: userIdNum })
        .getRawOne();
      const totalCommissions = Number(commissionsResult?.sumCommissions) || 0;

      // 2. Contrats par statut
      // Actif: 1 (EN COURS), 2 (RENOUVELE), 5 (SINISTRE)
      const activeContracts = await this.contractRepository
        .createQueryBuilder('c')
        .where('c.idUser = :userId', { userId: userIdNum })
        .andWhere('c.idContractState IN (:...activeStates)', { activeStates: [1, 2, 5] })
        .getCount();

      // En attente: cotations status PENDING
      const pendingContracts = await this.cotationRepository.count({
        where: { idUser: userIdNum, status: 'PENDING' }
      });

      // Suspendu/Resilié: 4
      const suspendedContracts = await this.contractRepository.count({
        where: { idUser: userIdNum, idContractState: 4 }
      });

      // Annulé: 3
      const cancelledContracts = await this.contractRepository.count({
        where: { idUser: userIdNum, idContractState: 3 }
      });

      // 3. Performance mensuelle
      const monthlyContracts = await this.contractRepository
        .createQueryBuilder('c')
        .where('c.idUser = :userId', { userId: userIdNum })
        .andWhere('c.createdAt >= :monthStart', { monthStart })
        .getCount();

      const monthlyPrimesResult = await this.contractRepository
        .createQueryBuilder('c')
        .select('SUM(c.puttc)', 'monthlySumPrimes')
        .where('c.idUser = :userId', { userId: userIdNum })
        .andWhere('c.createdAt >= :monthStart', { monthStart })
        .getRawOne();
      const monthlyPrimes = Number(monthlyPrimesResult?.monthlySumPrimes) || 0;

      const monthlyCapitalResult = await this.contractRepository
        .createQueryBuilder('c')
        .select('SUM(c.capital)', 'monthlySumCapital')
        .where('c.idUser = :userId', { userId: userIdNum })
        .andWhere('c.createdAt >= :monthStart', { monthStart })
        .getRawOne();
      const monthlyCapital = Number(monthlyCapitalResult?.monthlySumCapital) || 0;

      const monthlyCommissionsResult = await this.contractRepository
        .createQueryBuilder('c')
        .select('SUM(c.pc)', 'monthlySumCommissions')
        .where('c.idUser = :userId', { userId: userIdNum })
        .andWhere('c.createdAt >= :monthStart', { monthStart })
        .getRawOne();
      const monthlyCommissions = Number(monthlyCommissionsResult?.monthlySumCommissions) || 0;

      // 4. Nouveaux clients ce mois-ci
      const newClientsResult = await this.contractRepository
        .createQueryBuilder('c')
        .select('COUNT(DISTINCT c.idCustomer)', 'countNewClients')
        .where('c.idUser = :userId', { userId: userIdNum })
        .andWhere('c.createdAt >= :monthStart', { monthStart })
        .getRawOne();
      const newClientsThisMonth = Number(newClientsResult?.countNewClients) || 0;

      // 5. Contrats cette semaine (7 derniers jours)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const contractsThisWeek = await this.contractRepository
        .createQueryBuilder('c')
        .where('c.idUser = :userId', { userId: userIdNum })
        .andWhere('c.createdAt >= :weekStart', { weekStart })
        .getCount();

      // 6. Valeur moyenne des contrats
      const averageContractValue = totalContracts > 0 ? Math.round(totalPrimes / totalContracts) : 0;

      // 7. Taux de réussite (cotations acceptées vs total cotations)
      const acceptedCotations = await this.cotationRepository.count({
        where: { idUser: userIdNum, status: 'ACCEPTED' }
      });
      const successRate = totalCotations > 0 ? Math.round((acceptedCotations / totalCotations) * 100) : 0;

      // 8. Classement de l'utilisateur par rapport aux autres
      const rankings = await this.contractRepository
        .createQueryBuilder('c')
        .select('c.idUser', 'userId')
        .addSelect('COUNT(c.id)', 'contractCount')
        .groupBy('c.idUser')
        .orderBy('COUNT(c.id)', 'DESC')
        .getRawMany();

      const rankIndex = rankings.findIndex(r => Number(r.userId) === userIdNum);
      const rank = rankIndex !== -1 ? `${rankIndex + 1}` : 'N/A';

      // 9. Logs d'accès / activités depuis la table user_activities
      const totalLogins = await this.userActivityRepository.count({
        where: { idUser: userIdNum, activityType: ActivityType.LOGIN }
      });

      const failedLogins = await this.userActivityRepository.count({
        where: { idUser: userIdNum, activityType: ActivityType.LOGIN_FAILED }
      });

      const totalActivities = await this.userActivityRepository.count({
        where: { idUser: userIdNum }
      });

      const uniqueDevicesResult = await this.userActivityRepository
        .createQueryBuilder('ua')
        .select('COUNT(DISTINCT ua.userAgent)', 'countUniqueDevices')
        .where('ua.idUser = :userId', { userId: userIdNum })
        .getRawOne();
      const uniqueDevices = Number(uniqueDevicesResult?.countUniqueDevices) || 1;

      const uniqueIPsResult = await this.userActivityRepository
        .createQueryBuilder('ua')
        .select('COUNT(DISTINCT ua.ipAddress)', 'countUniqueIPs')
        .where('ua.idUser = :userId', { userId: userIdNum })
        .getRawOne();
      const uniqueIPs = Number(uniqueIPsResult?.countUniqueIPs) || 1;

      const suspiciousActivities = failedLogins;

      // 10. Historique des 6 derniers mois pour le graphique
      const history: { month: string; contracts: number; primes: number; capital: number }[] = [];
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
      for (let i = 5; i >= 0; i--) {
        const start = new Date();
        // Calculer l'année et le mois corrects
        const targetMonth = start.getMonth() - i;
        start.setMonth(targetMonth);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);

        const cnt = await this.contractRepository
          .createQueryBuilder('c')
          .where('c.idUser = :userId', { userId: userIdNum })
          .andWhere('c.createdAt >= :start', { start })
          .andWhere('c.createdAt <= :end', { end })
          .getCount();

        const sums = await this.contractRepository
          .createQueryBuilder('c')
          .select('SUM(c.puttc)', 'primes')
          .addSelect('SUM(c.capital)', 'capital')
          .where('c.idUser = :userId', { userId: userIdNum })
          .andWhere('c.createdAt >= :start', { start })
          .andWhere('c.createdAt <= :end', { end })
          .getRawOne();

        history.push({
          month: monthNames[start.getMonth()],
          contracts: cnt,
          primes: Number(sums?.primes) || 0,
          capital: Number(sums?.capital) || 0
        });
      }

      const stats = {
        totalContracts,
        totalPrimes,
        totalCapital,
        totalCotations,
        totalClients,
        totalCommissions,
        activeContracts,
        pendingContracts,
        suspendedContracts,
        cancelledContracts,
        monthlyContracts,
        monthlyPrimes,
        monthlyCapital,
        monthlyCommissions,
        monthlyTarget: 20,
        monthlyPrimesTarget: 500000,
        monthlyCapitalTarget: 2000000,
        newClientsThisMonth,
        contractsThisWeek,
        averageContractValue,
        successRate,
        rank,
        totalLogins,
        totalActivities,
        documentsCreated: totalContracts, // nombre de contrats créés comme proxy
        avgSessionTime: '1h',
        achievementCount: totalContracts > 10 ? 3 : totalContracts > 0 ? 1 : 0,
        failedLogins,
        uniqueDevices,
        uniqueIPs,
        suspiciousActivities,
        period: `${days} derniers jours`,
        history
      };

      console.log(`📊 Statistiques réelles calculées pour l'utilisateur ${userId} (${user.firstname} ${user.lastname})`);
      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }

  private async sendWelcomeEmail(userData: Partial<User>, userId: number) {
    try {
      console.log(`📧 Envoi de l'email de bienvenue à ${userData.email}...`);

      const appName = process.env.APP_NAME || 'SUD CAPITAL';

      // Configuration du transporteur email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER || 'notificationsaavie@gmail.com',
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
        }
      });

      // Récupérer les informations de l'agence et du rôle
      const agency = await this.agencyRepository.findOne({ where: { id: userData.idAgency } });
      const role = await this.roleRepository.findOne({ where: { id: userData.idRole } });

      // Contenu de l'email
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue sur ${appName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f5f7fa;
            }
            .email-wrapper { 
              background-color: #f5f7fa; 
              padding: 20px; 
              min-height: 100vh;
            }
            .container { 
              max-width: 650px; 
              margin: 0 auto; 
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #33b04a 0%, #2c3e50 100%); 
              color: white; 
              padding: 30px 25px; 
              text-align: center; 
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
              opacity: 0.3;
            }
            .logo { 
              font-size: 28px; 
              font-weight: 700; 
              margin-bottom: 15px; 
              position: relative;
              z-index: 1;
            }
            .header h1 { 
              font-size: 24px; 
              font-weight: 600; 
              margin-bottom: 10px;
              position: relative;
              z-index: 1;
            }
            .header p {
              font-size: 16px;
              opacity: 0.9;
              position: relative;
              z-index: 1;
            }
            .content { 
              padding: 30px 25px; 
              background-color: #ffffff;
            }
            .welcome-text {
              font-size: 16px;
              margin-bottom: 20px;
              color: #2c3e50;
            }
            .credentials { 
              background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
              padding: 20px; 
              border-left: 5px solid #33b04a; 
              margin: 20px 0; 
              border-radius: 8px;
              box-shadow: 0 4px 15px rgba(51, 176, 74, 0.1);
            }
            .credentials h3 {
              color: #2c3e50;
              margin-bottom: 15px;
              font-size: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .cred-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid rgba(51, 176, 74, 0.1);
            }
            .cred-item:last-child {
              border-bottom: none;
            }
            .cred-label {
              font-weight: 600;
              color: #2c3e50;
              min-width: 120px;
            }
            .cred-value {
              color: #33b04a;
              font-weight: 500;
              word-break: break-all;
            }
            .instructions { 
              background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%);
              padding: 20px; 
              border-left: 5px solid #ffc107; 
              margin: 20px 0; 
              border-radius: 8px;
              box-shadow: 0 4px 15px rgba(255, 193, 7, 0.1);
            }
            .instructions h3 {
              color: #2c3e50;
              margin-bottom: 15px;
              font-size: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .instructions ol, .instructions ul {
              padding-left: 20px;
            }
            .instructions li {
              margin-bottom: 12px;
              line-height: 1.5;
            }
            .button { 
              display: inline-block; 
              padding: 15px 30px; 
              background: linear-gradient(135deg, #33b04a 0%, #2c3e50 100%);
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(51, 176, 74, 0.3);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(51, 176, 74, 0.4);
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
              color: #ecf0f1;
            }
            .footer p {
              margin-bottom: 10px;
              font-size: 14px;
            }
            .highlight { 
              color: #33b04a; 
              font-weight: 700; 
            }
            .signature {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #ecf0f1;
              font-style: italic;
            }
            .icon {
              font-size: 20px;
            }
            @media (max-width: 600px) {
              .email-wrapper { padding: 10px; }
              .container { border-radius: 8px; }
              .header, .content { padding: 20px; }
              .cred-item { flex-direction: column; align-items: flex-start; gap: 5px; }
              .button { display: block; text-align: center; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              
              <div class="content">
                <div class="welcome-text">
                  <p>Bonjour <strong>${userData.firstname} ${userData.lastname}</strong>,</p>
                  <p>Votre compte utilisateur a été créé avec succès sur la plateforme <span class="highlight">${appName}</span>.</p>
                </div>
                
                <div class="credentials">
                  <h3><span class="icon">🔐</span> Vos identifiants de connexion</h3>
                  <div class="cred-item">
                     <span class="cred-label">Email :</span>
                     <span class="cred-value">${userData.email}</span>
                  </div>
                  <div class="cred-item">
                     <span class="cred-label">Mot de passe :</span>
                     <span class="cred-value">${userData.password}</span>
                  </div>
                  <div class="cred-item">
                     <span class="cred-label">Rôle :</span>
                     <span class="cred-value">${role?.libelle || 'Non défini'}</span>
                  </div>
                  <div class="cred-item">
                     <span class="cred-label">Agence :</span>
                     <span class="cred-value">${agency?.name || 'Non définie'}</span>
                  </div>
                </div>
                
                <div class="instructions">
                  <h3><span class="icon">📋</span> Instructions de connexion</h3>
                  <ol>
                    <li>Accédez à l'application via : <a href="${process.env.FRONTEND_URL || 'https://fnda.aaviedigital.bj'}" class="button">Se connecter à PADME S.A</a></li>
                    <li>Utilisez vos identifiants ci-dessus pour vous connecter</li>
                    <li>Lors de votre première connexion, vous serez invité à changer votre mot de passe</li>
                  </ol>
                </div>
                
                <div class="instructions">
                  <h3><span class="icon">🔧</span> Gestion de votre compte</h3>
                  <ul>
                    <li><strong>Changer le mot de passe :</strong> Connectez-vous et allez dans "Mon Profil" → "Changer le mot de passe"</li>
                    <li><strong>Modifier l'agence :</strong> Contactez l'administrateur système</li>
                    <li><strong>Modifier le rôle :</strong> Contactez l'administrateur système</li>
                  </ul>
                </div>
                
                <div class="signature">
                  <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter l'équipe technique.</p>
                  <p>Cordialement,<br><strong>L'équipe <span class="highlight">${appName}</span></strong></p>
                </div>
              </div>
              
              <div class="footer">
                <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                <p>© 2024 ${appName} - Système de gestion des cotations et contrats d'assurance</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Options de l'email
      const mailOptions = {
        from: process.env.EMAIL_USER || 'notificationsaavie@gmail.com',
        to: userData.email,
        cc: [
          'sagbomasse@lafricaineviebenin.com', // Copie à Salomon
          //'ggouclounon@lafricaineviebenin.com', // Copie à Grégoire
          'salomonagbomasse25@gmail.com', // Copie à Salomon
        ],
        subject: `🎉 Bienvenue sur ${appName} - Vos identifiants de connexion`,
        html: emailContent
      };

      // Envoyer l'email
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email de bienvenue envoyé à ${userData.email}. Message ID: ${info.messageId}`);
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi de l'email à ${userData.email}:`, error);
    }
  }

  // Récupérer les contrats d'un utilisateur (pour l'onglet Profil)
  async getUserContracts(userId: number, limit: number = 200): Promise<any[]> {
    try {
      const qb = this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.customer', 'customer')
        .leftJoinAndSelect('c.natureCredit', 'natureCredit')
        .leftJoinAndSelect('c.agency', 'agency')
        .leftJoinAndSelect('c.contractState', 'contractState')
        .where('c.idUser = :userId', { userId: Number(userId) })
        .orderBy('c.createdAt', 'DESC')
        .take(limit);
      return await qb.getMany();
    } catch (err) {
      console.error('getUserContracts error:', err);
      return [];
    }
  }

  // Récupérer les cotations d'un utilisateur (pour l'onglet Profil)
  async getUserCotations(userId: number, limit: number = 200): Promise<any[]> {
    try {
      const qb = this.cotationRepository
        .createQueryBuilder('q')
        .leftJoinAndSelect('q.customer', 'customer')
        .leftJoinAndSelect('q.nature', 'nature')
        .where('q.idUser = :userId', { userId: Number(userId) })
        .orderBy('q.createdAt', 'DESC')
        .take(limit);
      return await qb.getMany();
    } catch (err) {
      console.error('getUserCotations error:', err);
      return [];
    }
  }
}
