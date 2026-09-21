import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Cotation } from '../entity/cotation.entity';
import { QuotationService } from './quotation.service';
import { NatureCredit } from '../entity/nature-credit.entity';

@Injectable()
export class CotationService {
  constructor(
    @InjectRepository(Cotation)
    private cotationRepository: Repository<Cotation>,
    @InjectRepository(NatureCredit)
    private natureCreditRepository: Repository<NatureCredit>,
    private quotationService: QuotationService,
  ) {}

  async findAll(): Promise<Cotation[]> {
    return this.cotationRepository.find({
      relations: ['user', 'agency', 'customer', 'customer.typeCustomer', 'typeCustomer', 'natureCredit', 'periodicite'],
      order: { id: 'DESC' }
    });
  }

  async findAllByUserRole(
    userId: number,
    userRole: any,
    idRole?: number,
    idAgency?: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    onlyMy?: boolean
  ): Promise<{
    cotations: Cotation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userRoleStr = typeof userRole === 'object' ? (userRole?.name || userRole?.libelle || userRole?.slug || '') : (userRole || '');
    const roleUpper = userRoleStr.toString().toUpperCase().trim();
    
    const isAdminOrManager = 
      ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN', 'ADMINISTRATEUR'].includes(roleUpper) ||
      idRole === 1 || 
      idRole === 5;

    console.log(`🔍 CotationService.findAllByUserRole - userId: ${userId}, role: "${roleUpper}", idRole: ${idRole}, isAdminOrManager: ${isAdminOrManager}, page: ${page}, limit: ${limit}, search: "${search || ''}", onlyMy: ${onlyMy}`);

    const queryBuilder = this.cotationRepository.createQueryBuilder('cotation')
      .leftJoinAndSelect('cotation.user', 'user')
      .leftJoinAndSelect('cotation.agency', 'agency')
      .leftJoinAndSelect('cotation.customer', 'customer')
      .leftJoinAndSelect('customer.typeCustomer', 'typeCustomer')
      .leftJoinAndSelect('cotation.typeCustomer', 'directTypeCustomer')
      .leftJoinAndSelect('cotation.natureCredit', 'natureCredit')
      .leftJoinAndSelect('cotation.periodicite', 'periodicite');

    // Si l'utilisateur n'est pas ADMIN, MANAGER ou SUPER ADMIN (ou si l'option "Mes Cotations" est active), filtrer par utilisateur
    if (!isAdminOrManager || onlyMy) {
      console.log(`👤 Filtrage des cotations par idUser = ${userId}`);
      queryBuilder.andWhere('cotation.idUser = :userId', { userId });
    } else {
      console.log(`👑 Utilisateur privilégie (${roleUpper}) - affichage de toutes les cotations`);
    }

    // Filtrer par recherche
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(cotation.reference) LIKE :search OR ' +
        'LOWER(customer.lastname) LIKE :search OR ' +
        'LOWER(customer.firstname) LIKE :search OR ' +
        'LOWER(customer.phone) LIKE :search OR ' +
        'LOWER(user.lastname) LIKE :search OR ' +
        'LOWER(user.firstname) LIKE :search)',
        { search: searchPattern }
      );
    }

    queryBuilder.orderBy('cotation.id', 'DESC');

    const total = await queryBuilder.getCount();

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const cotations = await queryBuilder.getMany();
    const totalPages = Math.ceil(total / limit);

    return {
      cotations,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(identifier: string | number): Promise<Cotation | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const where: any = (typeof identifier === 'string' && uuidRegex.test(identifier))
      ? { uuid: identifier }
      : { id: Number(identifier) };

    return this.cotationRepository.findOne({ 
      where,
      relations: ['user', 'agency', 'customer', 'customer.typeCustomer', 'typeCustomer', 'natureCredit', 'periodicite']
    });
  }

  async findOneWithRelations(identifier: string | number): Promise<Cotation | null> {
    return this.findOne(identifier);
  }

  async findByUser(idUser: number): Promise<Cotation[]> {
    return this.cotationRepository.find({ where: { idUser } });
  }

  async findByAgency(idAgency: number): Promise<Cotation[]> {
    return this.cotationRepository.find({ where: { idAgency } });
  }

  async findByCustomer(idCustomer: number): Promise<Cotation[]> {
    return this.cotationRepository.find({ where: { idCustomer } });
  }

  async findByType(typeAss: string): Promise<Cotation[]> {
    return this.cotationRepository.find({ where: { typeAss } });
  }

  async findByReference(reference: string): Promise<Cotation[]> {
    return this.cotationRepository.find({ where: { reference } });
  }

  async findByProduct(idProduct: number): Promise<Cotation[]> {
    // Note: Cette méthode nécessite une relation avec Product
    // Pour l'instant, on retourne un tableau vide
    return [];
  }

  async create(cotationData: Partial<Cotation>): Promise<Cotation> {
    if (!cotationData.uuid) {
      cotationData.uuid = randomUUID();
    }
    const cotation = this.cotationRepository.create(cotationData);
    return this.cotationRepository.save(cotation);
  }

  async update(identifier: string | number, cotationData: Partial<Cotation>): Promise<Cotation | null> {
    const cotation = await this.findOne(identifier);
    if (!cotation) return null;
    await this.cotationRepository.update(cotation.id, cotationData);
    return this.findOne(cotation.id);
  }

  async remove(identifier: string | number): Promise<void> {
    const cotation = await this.findOne(identifier);
    if (cotation) {
      await this.cotationRepository.delete(cotation.id);
    }
  }

  async generateReference(typeCredit: string): Promise<string> {  
    //get the count of all cotations
    const count = await this.cotationRepository.count();
    console.log('🔢 Total cotations count:', count);
    return `${typeCredit}-${count + 1}`;
  }

  // ==========================================================================
  // PADME — méthodes retirées (moteur de calcul commenté dans QuotationService).
  // ==========================================================================
//   /*Créer une cotation avec calcul des primes et génération de référence*/
//
//   async createCotationWithPrimes(cotationData: any, userId: number, agencyId: number): Promise<Cotation> {
//     const { capital, birthdate, duration, garantieCompl, idNatureCredit, idPeriodicite, differe, obaOptions } = cotationData;
//     
//     console.log('🧮 Création de cotation avec primes pour:', {
//       capital,
//       birthdate,
//       duration,
//       garantieCompl,
//       idNatureCredit,
//       idPeriodicite,
//       differe,
//       obaOptions
//     });
// 
//     // Déterminer le type de crédit et calculer les primes
//     let typeCredit = 'AMORT';
//     if (String(idNatureCredit) === '2') {
//       typeCredit = 'CP';
//     } else if (String(idNatureCredit) === '3') {
//       typeCredit = 'OBA';
//     } else if (String(idNatureCredit) === '1') {
//       typeCredit = 'AMORT';
//     } else {
//       typeCredit = 'HC';
//     }
//     let primeData;
//     
//     // Valeurs par défaut pour les paramètres PADME
//     const isCPorOBA = typeCredit === 'CP' || typeCredit === 'OBA';
//     const periodicite = isCPorOBA ? 12 : (idPeriodicite || 1);
//     const differeValue = isCPorOBA ? 0 : (differe || 0);
//     const datecredit = new Date().toISOString().split('T')[0];
//     
//     const creditType = cotationData.creditType || typeCredit;
//     primeData = await this.quotationService.primePADME(capital, birthdate, duration, periodicite, datecredit, differeValue, creditType, obaOptions);
// 
//     if(primeData.error) {
//       throw new Error(primeData.message || 'Erreur lors du calcul de la prime');
//     }
// 
//     // Générer la référence
//     const reference = await this.generateReference(typeCredit);
// 
//     // Préparer les données de cotation
//     const cotationDataWithPrimes = {
//       ...cotationData,
//       idUser: userId,
//       idAgency: agencyId,
//       idTypeCustomer: cotationData.idTypeCustomer || cotationData.typeCustomer || 1,
//       reference,
//       capital: (creditType === 'OBA' && primeData.capital) ? primeData.capital : capital,
//       puttc: primeData.puttc,
//       pd: primeData.pd,
//       pc: primeData.pc,
//       acc: primeData.acc,
//       surp: primeData.surp,
//       fm: primeData.fm,
//       idPeriodicite: isCPorOBA ? 12 : (idPeriodicite || 1),
//       differe: isCPorOBA ? 0 : (differe || 0)
//     };
// 
//     // Créer la cotation
//     return this.create(cotationDataWithPrimes);
//   }
// 
//   /**
//    * Calculer les primes selon le type de crédit
//    */
//   async calculatePrimes(cotationData: any): Promise<any> {
//     const { capital, birthdate, duration, garantieCompl, idNatureCredit, idPeriodicite, differe, obaOptions } = cotationData;
//     
//     console.log('🧮 Calcul des primes pour:', {
//       capital,
//       birthdate,
//       duration,
//       garantieCompl,
//       idNatureCredit,
//       idPeriodicite,
//       differe,
//       obaOptions
//     });
// 
//     const creditType = cotationData.creditType || (String(idNatureCredit) === '2' ? 'CP' : String(idNatureCredit) === '3' ? 'OBA' : 'AMORT');
//     const isCPorOBA = creditType === 'CP' || creditType === 'OBA';
//     // Utiliser la méthode PADME
//     const periodicite = isCPorOBA ? 12 : (idPeriodicite || 1);
//     const differeValue = isCPorOBA ? 0 : (differe || 0);
//     const datecredit = new Date().toISOString().split('T')[0];
//     
//     const quotationResult = await this.quotationService.primePADME(
//       capital,  
//       birthdate,
//       duration || 60,
//       periodicite,
//       datecredit,
//       differeValue,
//       creditType,
//       obaOptions
//     );
// 
//     if (quotationResult.error) {
//       throw new Error(quotationResult.message);
//     }
// 
//     return {
//       pd: quotationResult.pd || 0,
//       pc: quotationResult.pc || 0,
//       surp: quotationResult.surp || 0,
//       acc: quotationResult.acc || 0,
//       fm: quotationResult.fm || 0,
//       puttc: quotationResult.puttc || 0,
//       capital: (creditType === 'OBA' && quotationResult.capital) ? quotationResult.capital : capital
//     };
//   }
// 
//   /**
//    * Créer une cotation PADME avec calcul des primes
//    */
//   async createCotationPADME(cotationData: any, userId: number, agencyId: number): Promise<Cotation> {
//     const { capital, birthdate, duration, idPeriodicite, differe, obaOptions } = cotationData;
//     
//     console.log('🧮 Création de cotation PADME pour:', {
//       capital,
//       birthdate,
//       duration,
//       idPeriodicite,
//       differe,
//       obaOptions
//     });
// 
//     // Calculer les primes avec la méthode PADME
//     const datecredit = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
//     const creditType = cotationData.creditType || (String(cotationData.idNatureCredit) === '2' ? 'CP' : String(cotationData.idNatureCredit) === '3' ? 'OBA' : 'AMORT');
//     const isCPorOBA = creditType === 'CP' || creditType === 'OBA';
//     const periodicite = isCPorOBA ? 12 : (idPeriodicite || 1);
//     const differeValue = isCPorOBA ? 0 : (differe || 0);
//     
//     const primeData = await this.quotationService.primePADME(
//       capital,
//       birthdate,
//       duration,
//       periodicite,
//       datecredit,
//       differeValue,
//       creditType,
//       obaOptions
//     );
// 
//     if (primeData.error) {
//       throw new Error(primeData.message || 'Erreur lors du calcul de la prime PADME');
//     }
// 
//     // Générer la référence
//     const reference = await this.generateReference('PADME');
// 
//     // Préparer les données de cotation
//     // Mapper typeContrat vers typeAss si nécessaire (le frontend envoie typeContrat)
//     const typeAss = cotationData.typeAss || cotationData.typeContrat || '1';
//     
//     // lastname et firstname ne sont pas nécessaires pour une cotation PADME
//     // On les inclut seulement s'ils sont fournis, sinon ils seront null
//     const cotationDataWithPrimes: any = {
//       ...cotationData,
//       typeAss: typeAss, // S'assurer que typeAss est toujours présent
//       idUser: userId,
//       idAgency: agencyId,
//       reference,
//       capital: (creditType === 'OBA' && primeData.capital) ? primeData.capital : capital,
//       puttc: primeData.puttc,
//       pd: primeData.pd,
//       pc: primeData.pc,
//       acc: primeData.acc,
//       surp: primeData.surp,
//       fm: primeData.fm,
//       idPeriodicite: isCPorOBA ? 12 : (idPeriodicite || 1),
//       differe: isCPorOBA ? 0 : (differe || 0)
//     };
//     
//     // Ajouter lastname et firstname seulement s'ils sont fournis
//     if (cotationData.lastname) {
//       cotationDataWithPrimes.lastname = cotationData.lastname;
//     }
//     if (cotationData.firstname) {
//       cotationDataWithPrimes.firstname = cotationData.firstname;
//     }
// 
//     // Créer la cotation
//     return this.create(cotationDataWithPrimes);
//   }

  /**
   * Résout le type de capital RENACA à partir du code réel de nature_credits
   * (jamais un id numérique en dur) — partagé entre createCotationRenaca et
   * le contrôleur (calcul seul).
   */
  async resolveTypeCapital(idNatureCredit: number): Promise<'AMORT' | 'CONST'> {
    const natureCredit = await this.natureCreditRepository.findOne({ where: { id: idNatureCredit } });
    if (!natureCredit) {
      throw new BadRequestException(`Nature de crédit introuvable (id: ${idNatureCredit}).`);
    }
    return natureCredit.code === 'CONST' ? 'CONST' : 'AMORT';
  }

  /**
   * Créer une cotation RENACA (Amortissable ou Constant) avec calcul de la prime.
   * Indépendant de createCotationPADME/createCotationWithPrimes : ne modifie
   * aucun chemin PADME existant.
   */
  async createCotationRenaca(cotationData: any, userId: number, agencyId: number): Promise<Cotation> {
    const { capital, birthdate, duration, idNatureCredit, perteEmploi, tauxSurprime, beneficiaire } = cotationData;

    const typeCapital = await this.resolveTypeCapital(idNatureCredit);

    const primeData = await this.quotationService.primeRENACA(
      typeCapital,
      capital,
      birthdate,
      duration,
      perteEmploi,
      tauxSurprime
    );

    if (primeData.error) {
      throw new BadRequestException(primeData.message || 'Erreur lors du calcul de la prime RENACA');
    }

    const reference = await this.generateReference('RENACA');

    const cotationDataWithPrimes: any = {
      ...cotationData,
      typeAss: cotationData.typeAss || typeCapital,
      idUser: userId,
      idAgency: agencyId,
      reference,
      capital,
      puttc: primeData.puttc,
      pd: primeData.pd,
      pc: 0,
      acc: primeData.acc,
      surp: primeData.surp,
      fm: 0,
      primePE: primeData.primePE || 0,
      perteEmploi: !!perteEmploi,
      tauxSurprime: tauxSurprime || 0,
      beneficiaire: beneficiaire || null,
    };

    return this.create(cotationDataWithPrimes);
  }
}