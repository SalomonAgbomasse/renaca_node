import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Contract } from '../entity/contract.entity';
import { Customer } from '../entity/customer.entity';
import { CustomerService } from './customer.service';
import { QuotationService } from './quotation.service';
import { PolicyNumberService } from './policy-number.service';
import { ContractHistory, ContractHistoryAction } from '../entity/contract-history.entity';
import { ContractType } from '../enums/contract-type.enum';
import { NatureCredit } from '../entity/nature-credit.entity';
import { Beneficiary } from '../entity/beneficiary.entity';
import { ContractInsuredMember } from '../entity/contract-insured-member.entity';
import { ExcelService } from '../../../services/excel.service';
import { User } from '../../gestionUsers/entity/user.entity';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(ContractHistory)
    private historyRepository: Repository<ContractHistory>,
    @InjectRepository(Beneficiary)
    private beneficiaryRepository: Repository<Beneficiary>,
    @InjectRepository(ContractInsuredMember)
    private insuredMemberRepository: Repository<ContractInsuredMember>,
    @InjectRepository(NatureCredit)
    private natureCreditRepository: Repository<NatureCredit>,
    private customerService: CustomerService,
    private quotationService: QuotationService,
    private policyNumberService: PolicyNumberService,
    private excelService: ExcelService,
  ) {}

  async findAll(): Promise<Contract[]> {
    return this.contractRepository.find({
      relations: ['customer', 'customer.typeCustomer', 'contractState', 'user', 'product', 'agency', 'natureCredit'],
      order: { id: 'DESC' }
    });
  }

  /**
   * Détecte si une chaîne est au format date français (DD/MM/YYYY ou DD/MM/YY)
   */
  private isDateString(value: string): { isDate: boolean; dateValue?: Date } {
    // Format français: DD/MM/YYYY ou DD/MM/YY
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
    const match = value.match(datePattern);
    
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      // Valider les valeurs
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        // Convertir l'année à 4 chiffres si nécessaire
        const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
        
        // Créer la date (month - 1 car les mois commencent à 0 en JavaScript)
        const date = new Date(fullYear, month - 1, day);
        
        // Vérifier que la date est valide
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === fullYear) {
          return { isDate: true, dateValue: date };
        }
      }
    }
    
    return { isDate: false };
  }

  /**
   * Applique les filtres de recherche au queryBuilder
   */
  private applyFilters(
    queryBuilder: any,
    filters: {
      search?: string;
      lastname?: string;
      firstname?: string;
      phone?: string;
      email?: string;
      typeCustomer?: string;
      police?: string;
      reference?: string;
      capital?: string;
      duration?: string;
      natureCredit?: string;
      dateEff?: string;
      dateEch1?: string;
      dateEch?: string;
      gestionnaireFirstname?: string;
      gestionnaireLastname?: string;
      etablissement?: string;
    }
  ): void {
    // Recherche globale dans tous les champs si le paramètre "search" est fourni
    if (filters.search && filters.search.trim()) {
      const searchValue = filters.search.trim();
      
      // Vérifier si c'est une date
      const dateCheck = this.isDateString(searchValue);
      
      if (dateCheck.isDate && dateCheck.dateValue) {
        // Si c'est une date, rechercher uniquement dans les champs de date
        const dateStr = dateCheck.dateValue.toISOString().split('T')[0]; // Format YYYY-MM-DD
        queryBuilder.andWhere(
          '(DATE(contract.dateEff) = DATE(:dateValue) OR ' +
          'DATE(contract.dateEch1) = DATE(:dateValue) OR ' +
          'DATE(contract.dateEch) = DATE(:dateValue))',
          { dateValue: dateStr }
        );
      } else {
        // Sinon, recherche normale dans tous les champs
        const searchTerm = `%${searchValue}%`;
        
        // Vérifier si la recherche est numérique pour les champs numériques
        const isNumeric = !isNaN(Number(searchValue));
        const numericValue = isNumeric ? Number(searchValue) : null;
        
        // Construire la condition de recherche
        let searchCondition = 
          '(customer.lastname LIKE :search OR ' +
          'customer.firstname LIKE :search OR ' +
          'customer.phone LIKE :search OR ' +
          'customer.email LIKE :search OR ' +
          'typeCustomer.libelle LIKE :search OR ' +
          'contract.police LIKE :search OR ' +
          'contract.reference LIKE :search OR ' +
          'natureCredit.libelle LIKE :search OR ' +
          'user.firstname LIKE :search OR ' +
          'user.lastname LIKE :search OR ' +
          'agency.name LIKE :search';
        
        // Ajouter les conditions numériques si la recherche est numérique
        if (isNumeric && numericValue !== null) {
          searchCondition += ` OR contract.capital = :numericValue OR contract.duration = :numericValue OR contract.puttc = :numericValue`;
          // Ajouter aussi la recherche comme chaîne pour les champs numériques (au cas où)
          searchCondition += ` OR CAST(contract.capital AS CHAR) LIKE :search OR CAST(contract.duration AS CHAR) LIKE :search OR CAST(contract.puttc AS CHAR) LIKE :search`;
          queryBuilder.andWhere(searchCondition + ')', { 
            search: searchTerm,
            numericValue: numericValue
          });
        } else {
          // Si non numérique, utiliser CAST pour convertir en chaîne
          searchCondition += ` OR CAST(contract.capital AS CHAR) LIKE :search OR CAST(contract.duration AS CHAR) LIKE :search OR CAST(contract.puttc AS CHAR) LIKE :search`;
          queryBuilder.andWhere(searchCondition + ')', { search: searchTerm });
        }
      }
    }
    
    // Appliquer les filtres spécifiques (en combinaison avec search si les deux sont fournis)
    if (filters.lastname) {
      queryBuilder.andWhere('customer.lastname LIKE :lastname', { 
        lastname: `%${filters.lastname}%` 
      });
    }
    
    if (filters.firstname) {
      queryBuilder.andWhere('customer.firstname LIKE :firstname', { 
        firstname: `%${filters.firstname}%` 
      });
    }
    
    if (filters.phone) {
      queryBuilder.andWhere('customer.phone LIKE :phone', { 
        phone: `%${filters.phone}%` 
      });
    }
    
    if (filters.email) {
      queryBuilder.andWhere('customer.email LIKE :email', { 
        email: `%${filters.email}%` 
      });
    }
    
    if (filters.typeCustomer) {
      queryBuilder.andWhere('typeCustomer.libelle LIKE :typeCustomer', { 
        typeCustomer: `%${filters.typeCustomer}%` 
      });
    }
    
    if (filters.police) {
      queryBuilder.andWhere('contract.police LIKE :police', { 
        police: `%${filters.police}%` 
      });
    }
    
    if (filters.reference) {
      queryBuilder.andWhere('contract.reference LIKE :reference', { 
        reference: `%${filters.reference}%` 
      });
    }
    
    if (filters.capital) {
      const capitalNum = parseFloat(filters.capital);
      if (!isNaN(capitalNum)) {
        queryBuilder.andWhere('contract.capital = :capital', { capital: capitalNum });
      }
    }
    
    if (filters.duration) {
      const durationNum = parseInt(filters.duration, 10);
      if (!isNaN(durationNum)) {
        queryBuilder.andWhere('contract.duration = :duration', { duration: durationNum });
      }
    }
    
    if (filters.natureCredit) {
      queryBuilder.andWhere('(natureCredit.libelle LIKE :natureCredit OR natureCredit.code LIKE :natureCredit OR natureCredit.id = :natureCreditId)', { 
        natureCredit: `%${filters.natureCredit}%`,
        natureCreditId: isNaN(Number(filters.natureCredit)) ? -1 : Number(filters.natureCredit)
      });
    }
    
    if (filters.dateEff) {
      queryBuilder.andWhere('DATE(contract.dateEff) = DATE(:dateEff)', { 
        dateEff: filters.dateEff 
      });
    }
    
    if (filters.dateEch1) {
      queryBuilder.andWhere('DATE(contract.dateEch1) = DATE(:dateEch1)', { 
        dateEch1: filters.dateEch1 
      });
    }
    
    if (filters.dateEch) {
      queryBuilder.andWhere('DATE(contract.dateEch) = DATE(:dateEch)', { 
        dateEch: filters.dateEch 
      });
    }
    
    if (filters.gestionnaireFirstname) {
      queryBuilder.andWhere('user.firstname LIKE :gestionnaireFirstname', { 
        gestionnaireFirstname: `%${filters.gestionnaireFirstname}%` 
      });
    }
    
    if (filters.gestionnaireLastname) {
      queryBuilder.andWhere('user.lastname LIKE :gestionnaireLastname', { 
        gestionnaireLastname: `%${filters.gestionnaireLastname}%` 
      });
    }
    
    if (filters.etablissement) {
      queryBuilder.andWhere('agency.name LIKE :etablissement', { 
        etablissement: `%${filters.etablissement}%` 
      });
    }

    if ((filters as any).idUser) {
      queryBuilder.andWhere('contract.idUser = :myUserIdParam', { 
        myUserIdParam: (filters as any).idUser 
      });
    }
  }

  async findAllByUserRole(
    userId: number, 
    idRole: number, 
    idAgency: number,
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      lastname?: string;
      firstname?: string;
      phone?: string;
      email?: string;
      typeCustomer?: string;
      police?: string;
      reference?: string;
      capital?: string;
      duration?: string;
      natureCredit?: string;
      dateEff?: string;
      dateEch1?: string;
      dateEch?: string;
      gestionnaireFirstname?: string;
      gestionnaireLastname?: string;
      etablissement?: string;
    }
  ): Promise<{
    contracts: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    console.log(`🔍 ContractService.findAllByUserRole - userId: ${userId}, idRole: ${idRole}, idAgency: ${idAgency}, page: ${page}, limit: ${limit}`, filters);
    
    const now = new Date();
    const queryBuilder = this.contractRepository.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('customer.typeCustomer', 'typeCustomer')
      .leftJoinAndSelect('contract.contractState', 'contractState')
      .leftJoinAndSelect('contract.user', 'user')
      .leftJoinAndSelect('contract.product', 'product')
      .leftJoinAndSelect('contract.agency', 'agency')
      .leftJoinAndSelect('contract.natureCredit', 'natureCredit')
      .where('contract.dateEch >= :now', { now }); // Exclure les contrats échus
    
    // Si l'utilisateur n'a pas le rôle ID = 1, filtrer par agence
    if (idRole !== 1) {
      console.log(`👤 Utilisateur standard (rôle ID: ${idRole}) - filtrage par agence ${idAgency}`);
      queryBuilder.andWhere('contract.idAgency = :idAgency', { idAgency });
    } else {
      console.log('👑 Utilisateur avec rôle ID = 1 détecté - tous les contrats non échus');
    }
    
    // Appliquer les filtres de recherche si fournis
    if (filters) {
      this.applyFilters(queryBuilder, filters);
    }
    
    // Ordonner par ID décroissant
    queryBuilder.orderBy('contract.id', 'DESC');
    
    // Appliquer la pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    // Récupérer les contrats et le total en une seule opération sécurisée
    const [contracts, total] = await queryBuilder.getManyAndCount();
    
    const totalPages = Math.ceil(total / limit);
    
    console.log(`📋 Contrats non échus récupérés: ${contracts.length} sur ${total} (page ${page}/${totalPages})`);
    
    return {
      contracts,
      total,
      page,
      limit,
      totalPages
    };
  }

  async findAllHorsConvention(
    idRole?: number, 
    idAgency?: number,
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      lastname?: string;
      firstname?: string;
      phone?: string;
      email?: string;
      typeCustomer?: string;
      police?: string;
      reference?: string;
      capital?: string;
      duration?: string;
      natureCredit?: string;
      dateEff?: string;
      dateEch1?: string;
      dateEch?: string;
      gestionnaireFirstname?: string;
      gestionnaireLastname?: string;
      etablissement?: string;
    }
  ): Promise<{
    contracts: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    console.log(`🔍 ContractService.findAllHorsConvention - idRole: ${idRole}, idAgency: ${idAgency}, page: ${page}, limit: ${limit}`, filters);
    
    const now = new Date();
    const queryBuilder = this.contractRepository.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('customer.typeCustomer', 'typeCustomer')
      .leftJoinAndSelect('contract.contractState', 'contractState')
      .leftJoinAndSelect('contract.user', 'user')
      .leftJoinAndSelect('contract.product', 'product')
      .leftJoinAndSelect('contract.agency', 'agency')
      .leftJoinAndSelect('contract.natureCredit', 'natureCredit')
      .where('contract.contractType IN (:...contractTypes)', { contractTypes: [ContractType.HORS_CONVENTION, ContractType.HLA] })
      .andWhere('contract.dateEch >= :now', { now }); // Exclure les contrats échus
    
    // Tous les utilisateurs/rôles voient l'ensemble des contrats hors convention
    console.log(`🌐 Affichage de tous les contrats hors convention (rôle: ${idRole}, agence: ${idAgency})`);
    
    // Appliquer les filtres de recherche si fournis
    if (filters) {
      this.applyFilters(queryBuilder, filters);
    }
    
    queryBuilder.orderBy('contract.id', 'DESC');
    
    // Appliquer la pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    const [contracts, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    
    console.log(`📋 Contrats hors convention non échus récupérés: ${contracts.length} sur ${total} (page ${page}/${totalPages})`);
    
    return {
      contracts,
      total,
      page,
      limit,
      totalPages
    };
  }

  async findAllEchus(
    idRole?: number, 
    idAgency?: number,
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      lastname?: string;
      firstname?: string;
      phone?: string;
      email?: string;
      typeCustomer?: string;
      police?: string;
      reference?: string;
      capital?: string;
      duration?: string;
      natureCredit?: string;
      dateEff?: string;
      dateEch1?: string;
      dateEch?: string;
      gestionnaireFirstname?: string;
      gestionnaireLastname?: string;
      etablissement?: string;
    }
  ): Promise<{
    contracts: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    console.log(`🔍 ContractService.findAllEchus - idRole: ${idRole}, idAgency: ${idAgency}, page: ${page}, limit: ${limit}`, filters);
    
    const now = new Date();
    const ID_CONTRACT_STATE_ECHU = 6;
    
    // D'abord, mettre à jour tous les contrats échus qui n'ont pas encore le statut "Échu"
    // Utiliser le nom de colonne directement dans UPDATE (sans alias de table)
    const updateQueryBuilder = this.contractRepository
      .createQueryBuilder()
      .update('contracts')
      .set({ idContractState: ID_CONTRACT_STATE_ECHU })
      .where('dateEch < :now', { now })
      .andWhere('idContractState != :idContractStateEchu', { idContractStateEchu: ID_CONTRACT_STATE_ECHU });
    
    // Si l'utilisateur n'a pas le rôle ID = 1, filtrer par agence pour la mise à jour aussi
    if (idRole !== undefined && idRole !== 1 && idAgency !== undefined) {
      updateQueryBuilder.andWhere('idAgency = :idAgency', { idAgency });
    }
    
    // Mettre à jour les contrats échus qui n'ont pas encore le statut "Échu"
    await updateQueryBuilder.execute();
    
    // Ensuite, récupérer les contrats échus
    const queryBuilder = this.contractRepository.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('customer.typeCustomer', 'typeCustomer')
      .leftJoinAndSelect('contract.contractState', 'contractState')
      .leftJoinAndSelect('contract.user', 'user')
      .leftJoinAndSelect('contract.product', 'product')
      .leftJoinAndSelect('contract.agency', 'agency')
      .leftJoinAndSelect('contract.natureCredit', 'natureCredit')
      .where('contract.dateEch < :now', { now }); // Inclure uniquement les contrats échus
    
    // Si l'utilisateur n'a pas le rôle ID = 1, filtrer par agence
    if (idRole !== undefined && idRole !== 1 && idAgency !== undefined) {
      console.log(`👤 Utilisateur standard (rôle ID: ${idRole}) - filtrage par agence ${idAgency}`);
      queryBuilder.andWhere('contract.idAgency = :idAgency', { idAgency });
    } else if (idRole === 1) {
      console.log('👑 Utilisateur avec rôle ID = 1 - retour de tous les contrats échus');
    }
    
    // Appliquer les filtres de recherche si fournis
    if (filters) {
      this.applyFilters(queryBuilder, filters);
    }
    
    // Ordonner par date d'échéance décroissante (les plus récemment échus en premier)
    queryBuilder.orderBy('contract.dateEch', 'DESC');
    
    // Appliquer la pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    // Récupérer les contrats et le total
    const [contracts, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    
    console.log(`📋 Contrats échus récupérés: ${contracts.length} sur ${total} (page ${page}/${totalPages})`);
    
    return {
      contracts,
      total,
      page,
      limit,
      totalPages
    };
  }

  private parseIdentifier(identifier: string | number): { id?: number; uuid?: string } {
    if (typeof identifier === 'number') {
      return { id: identifier };
    }
    const str = String(identifier).trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(str)) {
      return { uuid: str };
    }
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length >= 6) {
        const extractedUuid = parts.slice(0, 5).join('-');
        if (uuidRegex.test(extractedUuid)) {
          return { uuid: extractedUuid };
        }
      }
    }
    const num = parseInt(str, 10);
    if (!isNaN(num)) {
      return { id: num };
    }
    return { uuid: str };
  }

  async findOne(identifier: string | number): Promise<Contract | null> {
    const { id, uuid } = this.parseIdentifier(identifier);
    if (uuid) {
      return this.contractRepository.findOne({ where: { uuid } });
    }
    return this.contractRepository.findOne({ where: { id } });
  }

  async findOneWithRelations(identifier: string | number): Promise<Contract | null> {
    const { id, uuid } = this.parseIdentifier(identifier);
    const where = uuid ? { uuid } : { id };
    return this.contractRepository.findOne({ 
      where,
      relations: ['customer', 'customer.typeCustomer', 'contractState', 'user', 'user.office', 'product', 'agency', 'agency.subscriber', 'natureCredit', 'periodicite', 'beneficiaries', 'insuredMembers', 'updatedByUser']
    });
  }


  async findByCustomer(idCustomer: number): Promise<Contract[]> {
    return this.contractRepository.find({ where: { idCustomer } });
  }

  async findByUser(idUser: number, options?: {
    page?: number;
    limit?: number;
    includeCustomer?: boolean;
    includeAgency?: boolean;
    includeProduct?: boolean;
  }): Promise<Contract[]> {
    const relations: string[] = [];
    if (options?.includeCustomer !== false) {
      relations.push('customer');
    }
    if (options?.includeAgency !== false) {
      relations.push('agency');
    }
    if (options?.includeProduct !== false) {
      relations.push('product');
    }

    const queryBuilder = this.contractRepository.createQueryBuilder('contract');
    
    // Ajouter les relations
    if (relations.includes('customer')) {
      queryBuilder.leftJoinAndSelect('contract.customer', 'customer');
      queryBuilder.leftJoinAndSelect('customer.typeCustomer', 'typeCustomer');
    }
    if (relations.includes('agency')) {
      queryBuilder.leftJoinAndSelect('contract.agency', 'agency');
    }
    if (relations.includes('product')) {
      queryBuilder.leftJoinAndSelect('contract.product', 'product');
    }

    // Filtrer par utilisateur
    queryBuilder.where('contract.idUser = :idUser', { idUser });

    // Ajouter la pagination
    if (options?.page && options?.limit) {
      const skip = (options.page - 1) * options.limit;
      queryBuilder.skip(skip).take(options.limit);
    }

    // Ordonner par date de création
    queryBuilder.orderBy('contract.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findByUserWithPagination(idUser: number, options?: {
    page?: number;
    limit?: number;
    includeCustomer?: boolean;
    includeAgency?: boolean;
    includeProduct?: boolean;
  }): Promise<{
    contracts: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const relations: string[] = [];
    if (options?.includeCustomer !== false) {
      relations.push('customer');
    }
    if (options?.includeAgency !== false) {
      relations.push('agency');
    }
    if (options?.includeProduct !== false) {
      relations.push('product');
    }

    const queryBuilder = this.contractRepository.createQueryBuilder('contract');
    
    // Ajouter les relations
    if (relations.includes('customer')) {
      queryBuilder.leftJoinAndSelect('contract.customer', 'customer');
      queryBuilder.leftJoinAndSelect('customer.typeCustomer', 'typeCustomer');
    }
    if (relations.includes('agency')) {
      queryBuilder.leftJoinAndSelect('contract.agency', 'agency');
    }
    if (relations.includes('product')) {
      queryBuilder.leftJoinAndSelect('contract.product', 'product');
    }

    // Filtrer par utilisateur
    queryBuilder.where('contract.idUser = :idUser', { idUser });
    queryBuilder.leftJoinAndSelect('contract.natureCredit', 'natureCredit');

    // Compter le total
    const total = await queryBuilder.getCount();

    // Ajouter la pagination
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ordonner par date de création
    queryBuilder.orderBy('contract.createdAt', 'DESC');

    const contracts = await queryBuilder.getMany();
    const totalPages = Math.ceil(total / limit);

    return {
      contracts,
      total,
      page,
      limit,
      totalPages
    };
  }

  async findByAgency(idAgency: number): Promise<Contract[]> {
    return this.contractRepository.find({ where: { idAgency } });
  }

  async findByReference(reference: string): Promise<Contract[]> {
    return this.contractRepository.find({ where: { reference }, withDeleted: true });
  }
  async findByKeyCont(keyCont: string): Promise<Contract[]> {
    return this.contractRepository.find({ where: { keyCont }, withDeleted: true });
  }

  /**
   * Résout le type de capital RENACA ('AMORT' ou 'CONST') à partir du code
   * réel de la nature de crédit — pas un id numérique en dur.
   */
  private async resolveRenacaTypeCapital(idNatureCredit: number): Promise<'AMORT' | 'CONST'> {
    const natureCredit = await this.natureCreditRepository.findOne({ where: { id: idNatureCredit } });
    if (!natureCredit) {
      throw new BadRequestException(`Nature de crédit introuvable (id: ${idNatureCredit}).`);
    }
    return natureCredit.code === 'CONST' ? 'CONST' : 'AMORT';
  }

  /**
   * Création d'un contrat RENACA (Amortissable ou Constant).
   */
  async createRenacaContract(contractData: Partial<Contract> & { clientData?: any; perteEmploi?: boolean; tauxSurprime?: number; beneficiaire?: string }): Promise<Contract> {
    if (!contractData.capital || !contractData.duration || !contractData.clientData?.birthdate || !contractData.idNatureCredit) {
      throw new BadRequestException('Champs requis manquants pour le contrat RENACA (capital, durée, date de naissance, nature de crédit).');
    }

    const birthdate = contractData.clientData.birthdate;
    const typeCapital = await this.resolveRenacaTypeCapital(contractData.idNatureCredit);

    const dateEff = contractData.dateEff ? new Date(contractData.dateEff) : new Date();
    const dateEffISO = dateEff.toISOString().split('T')[0];

    // Date d'effet >= aujourd'hui
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateEffISO < todayStr) {
      throw new BadRequestException("La date d'effet ne peut pas être antérieure à la date courante.");
    }

    const primeData = await this.quotationService.primeRENACA(
      typeCapital,
      contractData.capital,
      birthdate,
      contractData.duration,
      contractData.perteEmploi,
      contractData.tauxSurprime
    );

    if (primeData.error) {
      throw new BadRequestException(primeData.message || 'Erreur lors du calcul de la prime RENACA');
    }

    // Gestion client (recherche ou création)
    if (contractData.clientData) {
      if (contractData.clientData.idCustomer) {
        contractData.idCustomer = contractData.clientData.idCustomer;
      } else if (contractData.clientData.lastname && contractData.clientData.firstname && contractData.clientData.birthdate) {
        const existing = await this.customerService.findByPersonalInfo(
          contractData.clientData.lastname.trim(),
          contractData.clientData.firstname.trim(),
          contractData.clientData.birthdate.trim()
        );
        if (existing) {
          contractData.idCustomer = existing.id;
        } else {
          const newClient = await this.customerService.create({
            ...contractData.clientData,
            idUser: contractData.idUser
          });
          contractData.idCustomer = newClient.id;
        }
      }
    }

    // Vérifier la limite de contrats par nature et par période pour le client
    await this.checkContractLimits(contractData, contractData.dateEff);

    contractData.police = contractData.police || await this.policyNumberService.generateRenacaPolice(contractData.idAgency || 0);
    contractData.reference = contractData.reference || await this.policyNumberService.generateRenacaReference(contractData.idUser || 0, typeCapital);

    const existingContractReference = await this.findByReference(contractData.reference || '');
    if (existingContractReference.length > 0) {
      throw new BadRequestException(`Cette référence est déjà utilisée pour un autre contrat. Veuillez le rechercher par la police ${existingContractReference[0].police} ou la référence ${existingContractReference[0].reference}`);
    }

    // Échéances : durée fixe, pas de différé pour RENACA
    const dateEch1 = contractData.dateEch1
      ? new Date(contractData.dateEch1)
      : (() => {
          const d = new Date(dateEff);
          d.setMonth(d.getMonth() + 1);
          return d;
        })();
    const dateEch = contractData.dateEch
      ? new Date(contractData.dateEch)
      : await this.calculerDateEch(dateEch1, contractData.duration || 0);

    contractData.dateEff = dateEff;
    contractData.dateEch1 = dateEch1;
    contractData.dateEch = dateEch;
    contractData.differe = 0;

    // Primes
    contractData.pd = primeData.pd;
    contractData.pc = primeData.primePE || 0; // pc stocke la prime Perte d'Emploi pour RENACA
    contractData.acc = primeData.acc;
    contractData.surp = primeData.surp;
    contractData.fm = 0;
    contractData.puttc = primeData.puttc;
    (contractData as any).prime = contractData.puttc;
    (contractData as any).commission = 0;

    // garantieCompl réutilisée pour Perte d'Emploi OUI/NON (RENACA)
    contractData.garantieCompl = contractData.perteEmploi ? 'OUI' : 'NON';

    contractData.contractType = ContractType.STANDARD;

    contractData.keyCont = await this.generateKeyCont(
      contractData.idCustomer || 0,
      typeCapital,
      contractData.capital || 0,
      contractData.duration || 0,
      contractData.garantieCompl
    );

    const { beneficiaries, ...rest } = contractData;
    const contract = this.contractRepository.create(rest);
    const savedContract = await this.contractRepository.save(contract);

    await this.createHistoryRecord(
      savedContract,
      null,
      rest,
      ContractHistoryAction.CREATE
    );

    return savedContract;
  }

  /**
   * Création d'un contrat Hors Convention (HLA) avec création/réutilisation
   * simultanée du client. Contrairement à createRenacaContract, les primes
   * sont saisies manuellement par l'utilisateur (pas d'appel à primeRENACA) :
   * c'est la raison d'être de "Hors Convention" — déroger volontairement aux
   * règles RENACA (âge, capital, tarification automatique).
   */
  async createHorsConventionWithCustomer(
    contractData: Partial<Contract> & { clientData?: any; perteEmploi?: boolean },
    idUser: number,
    idAgency: number
  ): Promise<Contract> {
    if (!contractData.capital || !contractData.duration || !contractData.idNatureCredit || !contractData.clientData?.lastname || !contractData.clientData?.firstname || !contractData.clientData?.birthdate) {
      throw new BadRequestException('Champs requis manquants pour le contrat Hors Convention (capital, durée, nature de crédit, nom/prénom/date de naissance du client).');
    }

    const typeCapital = await this.resolveRenacaTypeCapital(contractData.idNatureCredit);

    const dateEff = contractData.dateEff ? new Date(contractData.dateEff) : new Date();

    contractData.idUser = idUser;
    contractData.idAgency = idAgency;

    // Gestion client (recherche ou création) — même logique que createRenacaContract
    const existing = await this.customerService.findByPersonalInfo(
      contractData.clientData.lastname.trim(),
      contractData.clientData.firstname.trim(),
      contractData.clientData.birthdate.trim()
    );
    if (existing) {
      contractData.idCustomer = existing.id;
    } else {
      const newClient = await this.customerService.create({
        ...contractData.clientData,
        idUser
      });
      contractData.idCustomer = newClient.id;
    }

    // Vérifier la limite de contrats par nature et par période pour le client
    await this.checkContractLimits(contractData, contractData.dateEff);

    contractData.police = contractData.police || await this.policyNumberService.generateRenacaPolice(idAgency);
    contractData.reference = contractData.reference || await this.policyNumberService.generateRenacaReference(idUser, typeCapital);

    const existingContractReference = await this.findByReference(contractData.reference || '');
    if (existingContractReference.length > 0) {
      throw new BadRequestException(`Cette référence est déjà utilisée pour un autre contrat. Veuillez le rechercher par la police ${existingContractReference[0].police} ou la référence ${existingContractReference[0].reference}`);
    }

    const dateEch1 = contractData.dateEch1
      ? new Date(contractData.dateEch1)
      : (() => {
          const d = new Date(dateEff);
          d.setMonth(d.getMonth() + 1);
          return d;
        })();
    const dateEch = contractData.dateEch
      ? new Date(contractData.dateEch)
      : await this.calculerDateEch(dateEch1, contractData.duration || 0);

    contractData.dateEff = dateEff;
    contractData.dateEch1 = dateEch1;
    contractData.dateEch = dateEch;
    contractData.differe = 0;

    // Primes saisies manuellement — aucun recalcul automatique
    contractData.pd = Number(contractData.pd) || 0;
    contractData.pc = Number(contractData.pc) || 0;
    contractData.acc = Number(contractData.acc) || 0;
    contractData.surp = Number(contractData.surp) || 0;
    contractData.fm = Number(contractData.fm) || 0;
    contractData.puttc = Number(contractData.puttc) || 0;
    (contractData as any).commission = 0;

    contractData.garantieCompl = contractData.perteEmploi ? 'OUI' : 'NON';
    contractData.contractType = ContractType.HORS_CONVENTION;

    contractData.keyCont = await this.generateKeyCont(
      contractData.idCustomer || 0,
      typeCapital,
      contractData.capital || 0,
      contractData.duration || 0,
      contractData.garantieCompl
    );

    const { beneficiaries, ...rest } = contractData;
    const contract = this.contractRepository.create(rest);
    const savedContract = await this.contractRepository.save(contract);

    await this.createHistoryRecord(
      savedContract,
      null,
      rest,
      ContractHistoryAction.CREATE
    );

    return savedContract;
  }

  /**
   * Mise à jour administrative LIBRE d'un contrat.
   * Réservée aux rôles Admin (1) et Super Admin (5).
   *
   * Bypass TOTAL de toutes les validations et contraintes métier :
   *  - Aucune validation CP (bénéficiaires, compte bancaire, renouvellement)
   *  - Aucune contrainte OBA (périodicité, différé forcés)
   *  - Aucune contrainte AMORT
   *  - Dates librement modifiables (pas de forçage au 1er du mois / 31/12)
   *  - Toutes les primes directement modifiables (pd, pc, surp, fm, acc, puttc)
   *  - Pas de vérification hasRealChanges : l'admin décide, on sauvegarde toujours
   *
   * L'historique reste toujours enregistré pour la traçabilité.
   */
  async adminUpdate(
    id: string | number,
    contractData: any,
    ipAddress?: string,
    userAgent?: string,
    currentUserId?: number
  ): Promise<Contract | null> {
    const existingContract = await this.findOneWithRelations(id);
    if (!existingContract) {
      return null;
    }

    // Sauvegarder les anciennes valeurs pour l'historique
    const oldValues = { ...existingContract };

    // Extraire les données
    const {
      clientData,
      beneficiaries,
      obaOptions,
      ...adminUpdateData
    } = contractData;

    // Normaliser les alias de champs
    if (adminUpdateData.dureeeDifferee !== undefined && adminUpdateData.differe === undefined) {
      adminUpdateData.differe = Number(adminUpdateData.dureeeDifferee) || 0;
    }
    if (adminUpdateData.differe !== undefined) {
      adminUpdateData.differe = Number(adminUpdateData.differe) || 0;
    }
    if (adminUpdateData.capital !== undefined) {
      adminUpdateData.capital = Number(adminUpdateData.capital) || 0;
    }
    if (adminUpdateData.duration !== undefined) {
      adminUpdateData.duration = Number(adminUpdateData.duration) || 0;
    }
    if (adminUpdateData.tauxInteret !== undefined && adminUpdateData.taux === undefined) {
      adminUpdateData.taux = Number(adminUpdateData.tauxInteret) || 0;
    }
    if (adminUpdateData.taux !== undefined) {
      adminUpdateData.taux = Number(adminUpdateData.taux) || 0;
    }
    if (adminUpdateData.idPeriodicite !== undefined) {
      adminUpdateData.idPeriodicite = Number(adminUpdateData.idPeriodicite) || 1;
    }
    if (adminUpdateData.idNatureCredit !== undefined) {
      adminUpdateData.idNatureCredit = Number(adminUpdateData.idNatureCredit);
    }
    if (adminUpdateData.numCompteEpargne !== undefined && adminUpdateData.numeroCompte === undefined) {
      adminUpdateData.numeroCompte = adminUpdateData.numCompteEpargne;
    }
    if (adminUpdateData.typeCompte !== undefined && adminUpdateData.compteBancaire === undefined) {
      adminUpdateData.compteBancaire = adminUpdateData.typeCompte;
    }
    if (adminUpdateData.renouvellement !== undefined && adminUpdateData.renouvellementAuto === undefined) {
      adminUpdateData.renouvellementAuto = String(adminUpdateData.renouvellement).toUpperCase() === 'OUI' || adminUpdateData.renouvellement === true;
    }
    if (adminUpdateData.dateEffet !== undefined && adminUpdateData.dateEff === undefined) {
      adminUpdateData.dateEff = adminUpdateData.dateEffet;
    }
    if (adminUpdateData.datePremiereEcheance !== undefined && adminUpdateData.dateEch1 === undefined) {
      adminUpdateData.dateEch1 = adminUpdateData.datePremiereEcheance;
    }
    if (adminUpdateData.dateEcheance !== undefined && adminUpdateData.dateEch === undefined) {
      adminUpdateData.dateEch = adminUpdateData.dateEcheance;
    }

    // S'assurer que updatedBy est bien l'ID de l'utilisateur qui effectue la modification
    if (currentUserId) {
      adminUpdateData.updatedBy = currentUserId;
      if (clientData) {
        clientData.updatedBy = currentUserId;
      }
    }

    // Si des données client sont fournies et que le contrat a un client associé
    if (clientData && existingContract.idCustomer) {
      await this.customerService.update(existingContract.idCustomer, clientData, ipAddress, userAgent);
    }

    // Convertir les dates string en objets Date si nécessaire
    const dateFields = ['dateEff', 'dateEch1', 'dateEch'];
    for (const field of dateFields) {
      const val = adminUpdateData[field];
      if (val !== undefined && val !== null && val !== '') {
        if (typeof val === 'string') {
          const parsed = new Date(val);
          if (!isNaN(parsed.getTime())) {
            adminUpdateData[field] = parsed;
          }
        }
      }
    }

    // Recalculer puttc à partir des composantes si non fourni explicitement
    const pd   = Number(adminUpdateData.pd   ?? existingContract.pd)   || 0;
    const pc   = Number(adminUpdateData.pc   ?? existingContract.pc)   || 0;
    const surp = Number(adminUpdateData.surp ?? existingContract.surp) || 0;
    const fm   = Number(adminUpdateData.fm   ?? existingContract.fm)   || 0;
    const acc  = Number(adminUpdateData.acc  ?? existingContract.acc)  || 0;
    if (adminUpdateData.puttc === undefined || adminUpdateData.puttc === null) {
      adminUpdateData.puttc = pd + pc + surp + fm + acc;
    }

    // Appliquer toutes les modifications directement
    // Si la nature de crédit change, purger la relation déjà chargée par findOneWithRelations :
    // sinon TypeORM persiste l'id de l'objet de relation obsolète au lieu de la colonne
    // idNatureCredit qu'on vient de modifier (même correctif que sur update()).
    if (adminUpdateData.idNatureCredit !== undefined && adminUpdateData.idNatureCredit !== existingContract.idNatureCredit) {
      (existingContract as any).natureCredit = undefined;
    }
    Object.assign(existingContract, adminUpdateData);
    const updatedContract = await this.contractRepository.save(existingContract);

    // Enregistrer l'historique (toujours)
    await this.createHistoryRecord(
      updatedContract,
      oldValues,
      { ...adminUpdateData, clientData },
      ContractHistoryAction.UPDATE,
      ipAddress,
      userAgent,
      currentUserId
    );

    return updatedContract;
  }

  async update(
    id: number, 
    contractData: Partial<Contract> & { clientData?: any; dureeeDifferee?: any; numCompteEpargne?: any; typeCompte?: any; renouvellement?: any; dateEffet?: any; datePremiereEcheance?: any; dateEcheance?: any; tauxInteret?: any; obaOptions?: any; creditType?: any; [key: string]: any },
    ipAddress?: string,
    userAgent?: string,
    currentUserId?: number
  ): Promise<Contract | null> {
    const existingContract = await this.findOneWithRelations(id);
    if (!existingContract) {
      return null;
    }

    // Normaliser les alias de champs
    if (contractData.dureeeDifferee !== undefined && contractData.differe === undefined) {
      contractData.differe = Number(contractData.dureeeDifferee) || 0;
    }
    if (contractData.differe !== undefined) {
      contractData.differe = Number(contractData.differe) || 0;
    }
    if (contractData.capital !== undefined) {
      contractData.capital = Number(contractData.capital) || 0;
    }
    if (contractData.duration !== undefined) {
      contractData.duration = Number(contractData.duration) || 0;
    }
    if (contractData.tauxInteret !== undefined && contractData.taux === undefined) {
      contractData.taux = Number(contractData.tauxInteret) || 0;
    }
    if (contractData.taux !== undefined) {
      contractData.taux = Number(contractData.taux) || 0;
    }
    if (contractData.idPeriodicite !== undefined) {
      contractData.idPeriodicite = Number(contractData.idPeriodicite) || 1;
    }
    if (contractData.idNatureCredit !== undefined) {
      contractData.idNatureCredit = Number(contractData.idNatureCredit);
    }
    if (contractData.numCompteEpargne !== undefined && contractData.numeroCompte === undefined) {
      contractData.numeroCompte = contractData.numCompteEpargne;
    }
    if (contractData.typeCompte !== undefined && contractData.compteBancaire === undefined) {
      contractData.compteBancaire = contractData.typeCompte;
    }
    if (contractData.renouvellement !== undefined && contractData.renouvellementAuto === undefined) {
      contractData.renouvellementAuto = String(contractData.renouvellement).toUpperCase() === 'OUI' || contractData.renouvellement === true;
    }
    if (contractData.dateEffet !== undefined && contractData.dateEff === undefined) {
      contractData.dateEff = contractData.dateEffet;
    }
    if (contractData.datePremiereEcheance !== undefined && contractData.dateEch1 === undefined) {
      contractData.dateEch1 = contractData.datePremiereEcheance;
    }
    if (contractData.dateEcheance !== undefined && contractData.dateEch === undefined) {
      contractData.dateEch = contractData.dateEcheance;
    }

    // 1. Vérifier les autorisations et restrictions d'accès du rôle utilisateur
    await this.checkUserUpdatePermissions(existingContract, currentUserId);

    const oldValues = { ...existingContract };

    // Mémoriser la date de naissance initiale pour détecter les changements ultérieurs
    let originalBirthdate = '';
    if (existingContract.idCustomer) {
      const origCust = await this.customerService.findOne(existingContract.idCustomer);
      originalBirthdate = origCust?.birthdate || '';
    }

    // Séparer les données
    const { clientData, beneficiaries, ...contractUpdateData } = contractData;

    if (currentUserId) {
      contractUpdateData.updatedBy = currentUserId;
      if (clientData) {
        clientData.updatedBy = currentUserId;
      }
    }

    // 2. Mettre à jour le client en premier
    if (clientData && existingContract.idCustomer) {
      try {
        await this.customerService.update(
          existingContract.idCustomer,
          clientData,
          ipAddress,
          userAgent
        );
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du client:', error);
      }
    }

    // 3-4. Recalculer la prime si nécessaire (contrats STANDARD uniquement —
    // cf. recalculatePremiumIfNeeded qui rejette explicitement toute autre nature de contrat).
    const customer = await this.customerService.findOne(existingContract.idCustomer);
    const birthdate = customer?.birthdate || '';
    await this.recalculatePremiumIfNeeded(
      id,
      contractUpdateData,
      existingContract,
      originalBirthdate,
      birthdate
    );

    // Convertir les dates string en objets Date si nécessaire
    const dateFields = ['dateEff', 'dateEch1', 'dateEch'];
    for (const field of dateFields) {
      const val = (contractUpdateData as any)[field];
      if (val !== undefined && val !== null && val !== '') {
        if (typeof val === 'string') {
          const parsed = new Date(val);
          if (!isNaN(parsed.getTime())) {
            (contractUpdateData as any)[field] = parsed;
          }
        }
      }
    }

    // 5. Enregistrer les modifications
    // Si la nature de crédit change, purger la relation déjà chargée par findOneWithRelations :
    // sinon TypeORM persiste l'id de l'objet de relation obsolète au lieu de la colonne
    // idNatureCredit qu'on vient de modifier (les deux coexistent sur l'entité chargée).
    if (contractUpdateData.idNatureCredit !== undefined && contractUpdateData.idNatureCredit !== existingContract.idNatureCredit) {
      (existingContract as any).natureCredit = undefined;
    }
    Object.assign(existingContract, contractUpdateData);
    const updatedContract = await this.contractRepository.save(existingContract);

    // Enregistrer l'historique
    await this.createHistoryRecord(
      updatedContract, 
      oldValues, 
      { ...contractUpdateData, clientData }, 
      ContractHistoryAction.UPDATE,
      ipAddress,
      userAgent,
      currentUserId
    );

    return updatedContract;
  }

  /**
   * Vérifie les autorisations de mise à jour selon le rôle de l'utilisateur.
   */
  private async checkUserUpdatePermissions(existingContract: Contract, currentUserId?: number): Promise<void> {
    if (!currentUserId) return;

    const user = await this.contractRepository.manager.findOne(User, { where: { id: currentUserId } });
    const currentUserRole = user?.idRole || 0;

    const isUserAdminOrSuper = currentUserRole === 1 || currentUserRole === 5;
    const isUserManager = currentUserRole === 2;

    if (!isUserAdminOrSuper) {
      // Règle 1 : Limite de 1 mois pour modifier le contrat après sa création
      const limitDate = new Date(existingContract.createdAt);
      limitDate.setMonth(limitDate.getMonth() + 1);
      if (new Date() > limitDate) {
        throw new ForbiddenException("Modification impossible : ce contrat a été créé il y a plus d'un mois.");
      }

      // Règle 2 : Seuls les managers/admins peuvent modifier les contrats des autres
      if (!isUserManager) {
        if (existingContract.idUser !== currentUserId) {
          throw new ForbiddenException("Modification impossible : vous ne pouvez modifier que les contrats que vous avez créés.");
        }
      }
    }
  }

  /**
   * Recalcule la prime du contrat si un critère de calcul a changé.
   * Contrats STANDARD uniquement : toute autre nature de contrat
   * (existingContract.contractType !== ContractType.STANDARD) est explicitement
   * rejetée — ces contrats (Hors Convention, etc.) doivent passer par la
   * modification Admin (adminUpdate), qui ne recalcule jamais automatiquement.
   */
  private async recalculatePremiumIfNeeded(
    id: number,
    contractUpdateData: Partial<Contract>,
    existingContract: Contract,
    originalBirthdate: string,
    birthdate: string
  ): Promise<void> {
    const currentCapital = contractUpdateData.capital !== undefined ? contractUpdateData.capital : existingContract.capital;
    const currentDuration = contractUpdateData.duration !== undefined ? contractUpdateData.duration : existingContract.duration;
    // perteEmploi n'est pas une colonne : dérivé de garantieCompl ('OUI'/'NON') sur le contrat existant.
    const existingPerteEmploi = existingContract.garantieCompl === 'OUI';
    const currentPerteEmploi = (contractUpdateData as any).perteEmploi !== undefined ? (contractUpdateData as any).perteEmploi : existingPerteEmploi;
    const currentTauxSurprime = (contractUpdateData as any).tauxSurprime !== undefined ? (contractUpdateData as any).tauxSurprime : (existingContract as any).tauxSurprime;

    const capitalChanged = contractUpdateData.capital !== undefined && contractUpdateData.capital !== existingContract.capital;
    const durationChanged = contractUpdateData.duration !== undefined && contractUpdateData.duration !== existingContract.duration;
    const natureChanged = contractUpdateData.idNatureCredit !== undefined && contractUpdateData.idNatureCredit !== existingContract.idNatureCredit;
    const birthdateChanged = !!(originalBirthdate && birthdate !== originalBirthdate);
    const perteEmploiChanged = (contractUpdateData as any).perteEmploi !== undefined && (contractUpdateData as any).perteEmploi !== existingPerteEmploi;
    const tauxSurprimeChanged = (contractUpdateData as any).tauxSurprime !== undefined && (contractUpdateData as any).tauxSurprime !== (existingContract as any).tauxSurprime;

    const needsRecalculation =
      capitalChanged ||
      durationChanged ||
      natureChanged ||
      birthdateChanged ||
      perteEmploiChanged ||
      tauxSurprimeChanged;

    if (!needsRecalculation) {
      return;
    }

    if (existingContract.contractType !== ContractType.STANDARD) {
      throw new BadRequestException("La modification de ces informations n'est pas disponible pour ce contrat via ce formulaire. Utilisez la modification Admin pour ce type de contrat.");
    }

    console.log(`🔄 Recalcul automatique de la prime RENACA requis pour le contrat ${id}`);
    const idNatureCredit = contractUpdateData.idNatureCredit !== undefined ? contractUpdateData.idNatureCredit : existingContract.idNatureCredit;
    const typeCapital = await this.resolveRenacaTypeCapital(idNatureCredit);

    const primeData = await this.quotationService.primeRENACA(
      typeCapital,
      currentCapital,
      birthdate,
      currentDuration,
      currentPerteEmploi,
      currentTauxSurprime
    );

    if (primeData.error) {
      throw new BadRequestException(primeData.message);
    }

    contractUpdateData.pd = primeData.pd;
    contractUpdateData.acc = primeData.acc;
    contractUpdateData.surp = primeData.surp;
    contractUpdateData.puttc = primeData.puttc;
    contractUpdateData.pc = primeData.primePE || 0; // pc stocke la prime Perte d'Emploi pour RENACA
    contractUpdateData.garantieCompl = currentPerteEmploi ? 'OUI' : 'NON';
  }

  /**
   * Vérifie si des changements réels ont eu lieu entre l'ancien et le nouveau contrat.
   */
  private hasRealChanges(oldContract: Contract, newContractData: Partial<Contract>, clientData?: any): boolean {
    const fieldsToCheck = [
      'capital', 'duration', 'taux', 'dateEff', 'dateEch', 'dateEch1',
      'idNatureCredit', 'idPeriodicite', 'differe', 'garantieCompl',
      'etablissement', 'reference', 'description', 'isActive',
      'pd', 'pc', 'surp', 'acc', 'fm', 'puttc'
    ];

    for (const field of fieldsToCheck) {
      const oldVal = (oldContract as any)[field];
      const newVal = (newContractData as any)[field];

      if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        return true;
      }
    }

    if (clientData && oldContract.customer) {
      const clientFields = ['lastname', 'firstname', 'birthdate', 'gender', 'phone', 'email', 'placeOfBirth', 'occupation', 'address'];
      for (const field of clientFields) {
        if (clientData[field] !== undefined) {
          const oldVal = String((oldContract.customer as any)[field] || '').trim();
          const newVal = String(clientData[field] || '').trim();
          if (oldVal !== newVal) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Créer un enregistrement d'historique
   */
  private async createHistoryRecord(
    contract: Contract,
    oldValues: Partial<Contract> | null,
    newValues: (Partial<Contract> & { clientData?: any }) | null,
    action: ContractHistoryAction = ContractHistoryAction.UPDATE,
    ipAddress?: string,
    userAgent?: string,
    currentUserId?: number,
  ): Promise<void> {
    try {
      // Identifier les champs modifiés pour UPDATE
      const changedFields: string[] = [];
      if (action === ContractHistoryAction.UPDATE && oldValues && newValues) {
        const fieldsToCheck = [
          'capital', 'duration', 'taux', 'dateEff', 'dateEch', 'dateEch1',
          'idNatureCredit', 'idPeriodicite', 'differe', 'garantieCompl',
          'etablissement', 'reference', 'description', 'isActive',
          'pd', 'pc', 'surp', 'acc', 'fm', 'puttc'
        ];
        
        fieldsToCheck.forEach(field => {
          const oldVal = (oldValues as any)[field];
          const newVal = (newValues as any)[field];
          if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changedFields.push(field);
          }
        });

        const clientData = (newValues as any).clientData;
        if (clientData && (oldValues as any).customer) {
          const oldCust = (oldValues as any).customer;
          const clientFields = ['lastname', 'firstname', 'birthdate', 'gender', 'phone', 'email', 'placeOfBirth', 'occupation', 'address'];
          for (const field of clientFields) {
            if (clientData[field] !== undefined) {
              const oldVal = String(oldCust[field] || '').trim();
              const newVal = String(clientData[field] || '').trim();
              if (oldVal !== newVal) {
                changedFields.push(field);
              }
            }
          }
        }
      } else if (action === ContractHistoryAction.CREATE) {
        changedFields.push(...Object.keys(newValues || {}));
      } else if (action === ContractHistoryAction.DELETE) {
        changedFields.push(...Object.keys(oldValues || {}));
      }

      // Si c'est une mise à jour et qu'aucun champ n'a changé, ne pas créer d'historique
      if (action === ContractHistoryAction.UPDATE && changedFields.length === 0) {
        return;
      }

      // Préparer les valeurs à stocker (sans les relations)
      const sanitizeContract = (contract: Partial<Contract> | null) => {
        if (!contract) return null;
        const sanitized: any = {};
        const fieldsToCopy = [
          'id', 'idCustomer', 'idUser', 'updatedBy', 'deletedBy',
          'idProduct', 'idContractState', 'idAgency', 'idNatureCredit',
          'capital', 'duration', 'taux', 'dateEff', 'dateEch', 'dateEch1',
          'idPeriodicite', 'differe', 'garantieCompl', 'etablissement',
          'reference', 'police', 'description', 'isActive', 'pd', 'pc',
          'surp', 'acc', 'fm', 'puttc', 'keyCont', 'contractType'
        ];
        fieldsToCopy.forEach(field => {
          if (contract[field] !== undefined) {
            sanitized[field] = contract[field];
          }
        });
        return sanitized;
      };

      const historyData: Partial<ContractHistory> = {
        contractId: contract.id,
        action,
        changedBy: currentUserId || contract.updatedBy || contract.idUser || undefined,
        oldValues: sanitizeContract(oldValues),
        newValues: sanitizeContract(newValues),
        changedFields,
        description: this.generateDescription(action, changedFields, contract),
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      };

      await this.historyRepository.save(historyData);
    } catch (error) {
      // Logger l'erreur mais ne pas bloquer l'opération principale
      console.error('❌ Erreur lors de la création de l\'historique:', error);
    }
  }

  /**
   * Générer une description de la modification
   */
  private generateDescription(
    action: ContractHistoryAction,
    changedFields: string[],
    contract: Contract,
  ): string {
    const contractRef = contract.reference || contract.police || `#${contract.id}`;

    switch (action) {
      case ContractHistoryAction.CREATE:
        return `Contrat "${contractRef}" créé`;
      case ContractHistoryAction.UPDATE:
        const fieldsLabels: { [key: string]: string } = {
          capital: 'Capital',
          duration: 'Durée',
          taux: 'Taux d\'intérêt',
          dateEff: 'Date d\'effet',
          dateEch: 'Date d\'échéance',
          dateEch1: 'Date de première échéance',
          idNatureCredit: 'Nature de crédit',
          idPeriodicite: 'Périodicité',
          differe: 'Différé',
          garantieCompl: 'Garantie complémentaire',
          etablissement: 'Établissement',
          reference: 'Référence',
          description: 'Description',
          isActive: 'Statut',
          pd: 'Prime Décès (PD)',
          pc: 'Prime Complémentaire (PC)',
          surp: 'Surprime',
          acc: 'Accessoires (ACC)',
          fm: 'Frais Médicaux (FM)',
          puttc: 'Prime Totale (PUTTC)',
          lastname: 'Nom de l\'assuré',
          firstname: 'Prénoms de l\'assuré',
          birthdate: 'Date de naissance de l\'assuré',
          gender: 'Genre de l\'assuré',
          phone: 'Téléphone de l\'assuré',
          email: 'Email de l\'assuré',
          placeOfBirth: 'Lieu de naissance de l\'assuré',
          occupation: 'Profession de l\'assuré',
          address: 'Adresse de l\'assuré'
        };
        const fieldsList = changedFields
          .map((field) => fieldsLabels[field] || field)
          .join(', ');
        return `Modification des champs: ${fieldsList}`;
      case ContractHistoryAction.DELETE:
        return `Contrat "${contractRef}" supprimé`;
      default:
        return `Action ${action} sur le contrat "${contractRef}"`;
    }
  }

  async updateContractState(id: number, idContractState: number): Promise<Contract | null> {
    await this.contractRepository.update(id, { idContractState });
    return this.findOne(id);
  }

  async remove(id: number, ipAddress?: string, userAgent?: string): Promise<void> {
    // Récupérer le contrat avant suppression pour l'historique
    const contract = await this.findOne(id);
    if (contract) {
    await this.contractRepository.delete(id);
      // Créer l'historique de suppression
      await this.createHistoryRecord(
        contract, 
        contract, 
        null, 
        ContractHistoryAction.DELETE,
        ipAddress,
        userAgent
      );
    }
  }

  async calculerDateEch(dateEch1: Date, duration: number): Promise<Date> {
    const dateEch = new Date(dateEch1);
    let monthToAdd = duration-1;
    dateEch.setMonth(dateEch.getMonth() + monthToAdd);
    return dateEch;
  }

  async generateKeyCont(idCustomer: number, typeCredit: string = 'A', capital: number = 0, duration: number = 0, garantieCompl: string = 'NON'): Promise<string> {
    const uniqueSuffix = Math.random().toString(36).substring(2, 6);
    const keyCont = `CUST${idCustomer}T${typeCredit}C${capital}D${duration}_${uniqueSuffix}`;
    return keyCont.slice(0, 50);
  }

  // Fonction d'import en lot de contrats
  // Fonction d'import en lot de contrats
//   async importContracts(contractsData: Array<Partial<Contract> & { clientData?: any; beneficiaries?: any[] }>, userId: number, userAgency: number): Promise<{
//     success: boolean;
//     message: string;
//     results: Array<{
//       index: number;
//       success: boolean;
//       contract?: Contract;
//       error?: string;
//     }>;
//     summary: {
//       total: number;
//       success: number;
//       failed: number;
//     };
//     successfulContractIds: number[];
//   }> {
//     console.log(`📥 Import de ${contractsData.length} contrats pour l'utilisateur ${userId}`);
//     console.log('📋 Données reçues:', contractsData.map((c, i) => ({
//       index: i,
//       clientData: c.clientData,
//       capital: c.capital,
//       idNatureCredit: c.idNatureCredit
//     })));
//     
//     console.log('🔍 Début du traitement des contrats...');
//     
//     const results: Array<{
//       index: number;
//       success: boolean;
//       contract?: Contract;
//       error?: string;
//     }> = [];
//     
//     let successCount = 0;
//     let failedCount = 0;
// 
//     // Traitement séquentiel pour éviter les conflits de clés
//     for (let i = 0; i < contractsData.length; i++) {
//       const contractData = contractsData[i];
//       console.log(`🔄 Traitement du contrat ${i + 1}/${contractsData.length}...`);
//       
//       try {
//         // Ajouter les champs d'audit et l'utilisateur
//         contractData.idUser = userId;
//         contractData.idAgency = userAgency;
//         contractData.idProduct = 1;
//         contractData.idContractState = 1;
//         (contractData as any).isImport = true;
//         
//         const isHC = contractData.contractType === ContractType.HORS_CONVENTION;
//         const creditType = this.getCreditType(contractData);
// 
//         // Valider les bénéficiaires CP
//         this.validateCPDetails(contractData, creditType);
// 
//         // Gestion du client (recherche ou création) - commune
//         if (contractData.clientData) {
//           if (contractData.clientData.idCustomer) {
//             contractData.idCustomer = contractData.clientData.idCustomer;
//           } else {
//             let existingCustomer: Customer | null = null;
//             if (contractData.clientData.numCustomer && contractData.clientData.numCustomer.trim()) {
//               existingCustomer = await this.customerService.findByNumCustomer(contractData.clientData.numCustomer.trim());
//             }
//             if (!existingCustomer && contractData.clientData.lastname && contractData.clientData.firstname && contractData.clientData.birthdate) {
//               existingCustomer = await this.customerService.findByPersonalInfo(
//                 contractData.clientData.lastname.trim().toUpperCase(),
//                 contractData.clientData.firstname.trim().toUpperCase(),
//                 contractData.clientData.birthdate.trim()
//               );
//             }
//             if (!existingCustomer) {
//               if (!contractData.clientData.lastname || !contractData.clientData.firstname || !contractData.clientData.birthdate) {
//                 throw new Error('Les informations du client (nom, prénom, date de naissance) sont obligatoires pour créer un nouveau client');
//               }
// 
//               const clientInfo = contractData.clientData;
//               const placeOfBirth = clientInfo.placeOfBirth || clientInfo.birthplace || clientInfo.place_of_birth || clientInfo.lieuNaissance || 'NON RENSEIGNÉ';
//               const occupation = clientInfo.occupation || clientInfo.profession || 'NON RENSEIGNÉ';
// 
//               const newClient = await this.customerService.create({
//                 ...clientInfo,
//                 placeOfBirth,
//                 occupation,
//                 idUser: userId
//               });
//               contractData.idCustomer = newClient.id;
//             } else {
//               contractData.idCustomer = existingCustomer.id;
//             }
//           }
//         } else if (!contractData.idCustomer) {
//           throw new Error('L\'ID du client ou les données du client sont obligatoires');
//         }
// 
//         if (isHC) {
//           await this.validateAndProcessContractDataHorsConvention(contractData, userId);
//           if (!contractData.pd && contractData.pd !== 0) contractData.pd = 0;
//           if (!contractData.pc && contractData.pc !== 0) contractData.pc = 0;
//           if (!contractData.surp && contractData.surp !== 0) contractData.surp = 0;
//           if (!contractData.acc && contractData.acc !== 0) contractData.acc = 0;
//           if (!contractData.fm && contractData.fm !== 0) contractData.fm = 0;
//           if (!contractData.puttc && contractData.puttc !== 0) {
//             contractData.puttc = Number(contractData.pd || 0) + Number(contractData.pc || 0) + Number(contractData.surp || 0) + Number(contractData.acc || 0) + Number(contractData.fm || 0);
//           }
//         } else {
//           await this.validateAndProcessContractData(contractData, userId);
//         }
// 
//         const { beneficiaries, clientData, ...rest } = contractData;
//         const contract = this.contractRepository.create(rest);
//         const savedContract = await this.contractRepository.save(contract) as Contract;
// 
//         if (creditType === 'CP') {
//           if (beneficiaries && beneficiaries.length > 0) {
//             await this.saveCPBeneficiaries(savedContract.id, beneficiaries);
//           } else {
//             const customerObj = savedContract.customer || clientData;
//             const custNomPrenoms = customerObj ? `${customerObj.lastname || ''} ${customerObj.firstname || ''}`.trim() : 'Ayant droit';
//             const defaultBeneficiaries = [
//               {
//                 nomPrenoms: custNomPrenoms || 'Ayant droit',
//                 lienParente: 'AUTRE',
//                 pourcentage: 100
//               }
//             ];
//             await this.saveCPBeneficiaries(savedContract.id, defaultBeneficiaries);
//           }
//         }
// 
//         if (creditType === 'OBA' && (contractData as any).obaOptions) {
//           await this.saveOBAInsuredMembers(savedContract.id, (contractData as any).obaOptions);
//         }
// 
//         // Créer l'historique de création
//         await this.createHistoryRecord(
//           savedContract, 
//           null, 
//           contractData, 
//           ContractHistoryAction.CREATE
//         );
// 
//         results.push({
//           index: i,
//           success: true,
//           contract: savedContract
//         });
//         
//         successCount++;
//         console.log(`✅ Contrat ${i + 1}/${contractsData.length} créé avec succès: ${savedContract.reference}`);
//         
//       } catch (error) {
//         console.error(`❌ Erreur lors de la création du contrat ${i + 1}:`, error.message);
//         console.error(`🔍 Détails de l'erreur:`, {
//           error: error.message,
//           stack: error.stack,
//           contractData: {
//             capital: contractData.capital,
//             idNatureCredit: contractData.idNatureCredit,
//             clientData: contractData.clientData
//           }
//         });
//         
//         results.push({
//           index: i,
//           success: false,
//           error: error.message || 'Erreur inconnue'
//         });
//         
//         failedCount++;
//       }
//     }
// 
//     const summary = {
//       total: contractsData.length,
//       success: successCount,
//       failed: failedCount
//     };
// 
//     console.log(`📊 Résumé de l'import: ${successCount} succès, ${failedCount} échecs sur ${contractsData.length} contrats`);
// 
//     // Récupérer les IDs des contrats créés avec succès
//     const successfulContractIds = results
//       .filter(result => result.success && result.contract?.id)
//       .map(result => result.contract!.id);
// 
//     return {
//       success: true, // Toujours true pour permettre l'affichage des résultats
//       message: `Import terminé: ${successCount} contrat(s) créé(s) avec succès, ${failedCount} échec(s)`,
//       results,
//       summary,
//       successfulContractIds
//     };
//   }

  // Vérification de la limite de contrats par nature et par période pour un client
  private async checkContractLimits(
    contractData: Partial<Contract>,
    requestedDate?: Date | string
  ): Promise<void> {
    const idCustomer = contractData.idCustomer;
    const idNatureCredit = contractData.idNatureCredit;

    if (!idCustomer || !idNatureCredit) {
      return;
    }

    // Récupérer le client pour afficher ses nom et prénom dans l'alerte
    const customer = await this.customerService.findOne(idCustomer);
    const customerName = customer 
      ? `${(customer.lastname || '').toUpperCase()} ${customer.firstname || ''}`.trim() 
      : `Client #${idCustomer}`;

    // Récupérer la nature de crédit pour vérifier son code
    const nature = await this.contractRepository.manager.findOne(NatureCredit, {
      where: { id: idNatureCredit }
    });

    if (!nature) {
      return;
    }

    const code = (nature.code || '').toUpperCase().trim();
    const targetDate = requestedDate ? new Date(requestedDate) : new Date();

    // RÈGLE 1 : AMORT/CONST -> Pas de doublon exact le même jour pour un même client
    if (code === 'AMORT' || code === 'CONST') {
      const natureLabel = code === 'CONST' ? 'Constant' : 'Amortissable';

      const formatDateStr = (d: Date) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const targetDay = targetDate.getDate();

      const startOfDay = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
      const endOfDay = new Date(targetYear, targetMonth, targetDay, 23, 59, 59, 999);

      // Rechercher s'il existe déjà un contrat de même nature créé ou prenant effet ce même jour avec les mêmes caractéristiques
      const query = this.contractRepository.createQueryBuilder('contract')
        .where('contract.idCustomer = :idCustomer', { idCustomer })
        .andWhere('contract.idNatureCredit = :idNatureCredit', { idNatureCredit })
        .andWhere('contract.idContractState IN (:...states)', { states: [1, 2, 5] })
        .andWhere(
          '((contract.dateEff >= :startOfDay AND contract.dateEff <= :endOfDay) OR (contract.createdAt >= :startOfDay AND contract.createdAt <= :endOfDay))',
          { startOfDay, endOfDay }
        );

      if (contractData.capital !== undefined) {
        query.andWhere('contract.capital = :capital', { capital: contractData.capital });
      }
      if (contractData.duration !== undefined) {
        query.andWhere('contract.duration = :duration', { duration: contractData.duration });
      }
      if (contractData.idPeriodicite !== undefined) {
        query.andWhere('contract.idPeriodicite = :idPeriodicite', { idPeriodicite: contractData.idPeriodicite });
      }
      if (contractData.differe !== undefined) {
        query.andWhere('contract.differe = :differe', { differe: contractData.differe });
      }
      const warranty = contractData.garantieCompl || 'NON';
      query.andWhere('contract.garantieCompl = :garantieCompl', { garantieCompl: warranty });

      const existingSameDay = await query.getOne();

      if (existingSameDay) {
        const policeStr = existingSameDay.police || 'N/A';
        const referenceStr = existingSameDay.reference || 'N/A';
        const dayStr = formatDateStr(targetDate);
        throw new Error(
          `Souscription refusée : Le client "${customerName}" a déjà souscrit un crédit ${natureLabel} le ${dayStr} avec les mêmes caractéristiques (Capital: ${contractData.capital} FCFA, Durée: ${contractData.duration} mois, Police: ${policeStr}, Référence: ${referenceStr}).`
        );
      }
      return;
    }

    // Aucune limite de souscription pour les autres natures de crédit.
  }

  async findByPeriodAndFilters(
    startDate: Date,
    endDate: Date,
    idAgency?: number,
    idUser?: number,
    idNatureCredits?: number | number[]
  ): Promise<Contract[]> {
    console.log('🔍 Recherche de contrats avec les critères:');
    console.log('📅 Date de début:', startDate);
    console.log('📅 Date de fin:', endDate);
    console.log('🏢 ID Agence:', idAgency || 'Toutes');
    console.log('👤 ID Utilisateur:', idUser || 'Tous');
    console.log('💳 Natures de Crédit:', idNatureCredits || 'Toutes');

    const queryBuilder = this.contractRepository.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('customer.typeCustomer', 'typeCustomer')
      .leftJoinAndSelect('contract.contractState', 'contractState')
      .leftJoinAndSelect('contract.user', 'user')
      .leftJoinAndSelect('contract.product', 'product')
      .leftJoinAndSelect('contract.agency', 'agency')
      .leftJoinAndSelect('contract.natureCredit', 'natureCredit')
      .where('DATE(contract.created_at) >= DATE(:startDate)', { startDate })
      .andWhere('DATE(contract.created_at) <= DATE(:endDate)', { endDate })
      .orderBy('contract.created_at', 'DESC');

    if (idAgency) {
      queryBuilder.andWhere('contract.idAgency = :idAgency', { idAgency });
    }

    if (idUser) {
      queryBuilder.andWhere('contract.idUser = :idUser', { idUser });
    }

    if (idNatureCredits) {
      const natureIds = Array.isArray(idNatureCredits)
        ? idNatureCredits.map(id => Number(id)).filter(id => !isNaN(id) && id > 0)
        : [Number(idNatureCredits)].filter(id => !isNaN(id) && id > 0);
      if (natureIds.length > 0) {
        queryBuilder.andWhere('contract.idNatureCredit IN (:...natureIds)', { natureIds });
      }
    }

    // Afficher la requête SQL générée
    const sql = queryBuilder.getSql();
    console.log('📝 Requête SQL générée:', sql);
    console.log('📝 Paramètres:', { startDate, endDate, idAgency, idUser, idNatureCredits });

    const contracts = await queryBuilder.getMany();
    console.log('📊 Nombre de contrats trouvés:', contracts.length);
    
    if (contracts.length > 0) {
      console.log('📋 Premiers contrats trouvés:');
      contracts.slice(0, 3).forEach((contract, index) => {
        console.log(`  ${index + 1}. ID: ${contract.id}, Référence: ${contract.reference}, Créé le: ${contract.createdAt}`);
      });
    } else {
      console.log('⚠️ Aucun contrat trouvé pour cette période');
      
      // Vérifier s'il y a des contrats dans la base de données
      const totalContracts = await this.contractRepository.count();
      console.log('📊 Total de contrats dans la base de données:', totalContracts);
      
      if (totalContracts > 0) {
        // Récupérer quelques contrats pour voir leurs dates
        const sampleContracts = await this.contractRepository.find({
          take: 5,
          order: { createdAt: 'DESC' }
        });
        console.log('📋 Exemples de contrats dans la base:');
        sampleContracts.forEach((contract, index) => {
          console.log(`  ${index + 1}. ID: ${contract.id}, Créé le: ${contract.createdAt}`);
        });
      }
    }

    return contracts;
  }

  async findUsersByIds(userIds: number[]): Promise<any[]> {
    if (userIds.length === 0) return [];
    
    // Utiliser une requête directe pour éviter les dépendances circulaires
    const users = await this.contractRepository.manager.query(`
      SELECT id, firstname, lastname, email, idRole as role 
      FROM users 
      WHERE id IN (${userIds.map(id => '?').join(',')})
    `, userIds);
    
    return users;
  }

  async findContractsByIds(contractIds: number[]): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { id: In(contractIds) },
      relations: [
        'customer',
        'customer.typeCustomer',
        'contractState',
        'user',
        'user.office',
        'product',
        'agency',
        'agency.subscriber',
        'natureCredit',
        'periodicite',
        'beneficiaries',
        'insuredMembers'
      ]
    });
  }
}
