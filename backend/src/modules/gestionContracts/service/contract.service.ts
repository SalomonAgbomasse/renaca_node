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
      relations: ['customer', 'customer.typeCustomer', 'contractState', 'user', 'user.office', 'product', 'agency', 'natureCredit', 'periodicite', 'beneficiaries', 'insuredMembers', 'updatedByUser']
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

  async create(contractData: Partial<Contract> & { clientData?: any }): Promise<Contract> {
    // Utiliser la fonction de validation et traitement des données
    await this.validateAndProcessContractData(contractData, contractData.idUser);

    const { beneficiaries, ...rest } = contractData;
    const contract = this.contractRepository.create(rest);
    const savedContract = await this.contractRepository.save(contract);

    const creditType = this.getCreditType(savedContract);
    if (creditType === 'CP' && beneficiaries) {
      await this.saveCPBeneficiaries(savedContract.id, beneficiaries);
    }

    // Enregistrer les membres assurés OBA si présents
    if (creditType === 'OBA' && contractData.obaOptions) {
      await this.saveOBAInsuredMembers(savedContract.id, contractData.obaOptions);
    }

    // Créer l'historique de création
    await this.createHistoryRecord(
      savedContract, 
      null, 
      rest, 
      ContractHistoryAction.CREATE
    );

    return savedContract;
  }

  async createHorsConvention(contractData: Partial<Contract> & { clientData?: any }): Promise<Contract> {
    const creditType = this.getCreditType(contractData);
    
    // Valider les détails CP
    this.validateCPDetails(contractData, creditType);

    // Utiliser la fonction de validation et traitement des données
    await this.validateAndProcessContractDataHorsConvention(contractData, contractData.idUser);

    const { beneficiaries, ...rest } = contractData;
    const contract = this.contractRepository.create(rest);
    const savedContract = await this.contractRepository.save(contract);

    if (creditType === 'CP' && beneficiaries) {
      await this.saveCPBeneficiaries(savedContract.id, beneficiaries);
    }

    // Enregistrer les membres assurés OBA si présents
    if (creditType === 'OBA' && contractData.obaOptions) {
      await this.saveOBAInsuredMembers(savedContract.id, contractData.obaOptions);
    }

    // Créer l'historique de création
    await this.createHistoryRecord(
      savedContract, 
      null, 
      contractData, 
      ContractHistoryAction.CREATE
    );

    const fullContract = await this.findOneWithRelations(savedContract.id);
    return fullContract || savedContract;
  }

  // Création d'un contrat hors convention avec création du client si nécessaire
  async createHorsConventionWithCustomer(contractData: Partial<Contract> & { clientData?: any }): Promise<Contract> {
    // Vérifier les champs requis
    if (!contractData.capital || !contractData.duration) {
      throw new Error('Le capital et la durée sont obligatoires pour le contrat hors convention');
    }

    const creditType = this.getCreditType(contractData);

    // Valider les détails CP
    this.validateCPDetails(contractData, creditType);

    // Gestion client (création si nécessaire)
    if (contractData.clientData) {
      if (contractData.clientData.idCustomer) {
        // Si l'ID du client est fourni, l'utiliser directement
        contractData.idCustomer = contractData.clientData.idCustomer;
      } else {
        let existingCustomer: Customer | null = null;

        // 1. Vérifier d'abord par numCustomer si fourni
        if (contractData.clientData.numCustomer && contractData.clientData.numCustomer.trim()) {
          existingCustomer = await this.customerService.findByNumCustomer(
            contractData.clientData.numCustomer.trim()
          );
          
          if (existingCustomer) {
            // Client trouvé par numCustomer, utiliser ce client
            contractData.idCustomer = existingCustomer.id;
            console.log(`✅ Client trouvé par numCustomer: ${existingCustomer.numCustomer} (ID: ${existingCustomer.id})`);
          }
        }

        // 2. Si pas trouvé par numCustomer, vérifier par nom, prénom et date de naissance
        if (!existingCustomer && contractData.clientData.lastname && contractData.clientData.firstname && contractData.clientData.birthdate) {
          existingCustomer = await this.customerService.findByPersonalInfo(
            contractData.clientData.lastname.trim().toUpperCase(),
            contractData.clientData.firstname.trim().toUpperCase(),
            contractData.clientData.birthdate.trim()
          );
          
          if (existingCustomer) {
            // Client trouvé par informations personnelles, utiliser ce client
            contractData.idCustomer = existingCustomer.id;
            console.log(`✅ Client trouvé par informations personnelles: ${existingCustomer.lastname} ${existingCustomer.firstname} (ID: ${existingCustomer.id})`);
          }
        }

        // 3. Si aucun client trouvé, créer un nouveau client
        if (!existingCustomer) {
          // Vérifier que les informations minimales sont présentes
          if (!contractData.clientData.lastname || !contractData.clientData.firstname || !contractData.clientData.birthdate) {
            throw new Error('Les informations du client (nom, prénom, date de naissance) sont obligatoires pour créer un nouveau client');
          }

          // Vérifier si le numCustomer n'existe pas déjà (double vérification)
          if (contractData.clientData.numCustomer && contractData.clientData.numCustomer.trim()) {
            const existingByNum = await this.customerService.findByNumCustomer(
              contractData.clientData.numCustomer.trim()
            );
            if (existingByNum) {
              throw new Error(`Un client avec le numéro "${contractData.clientData.numCustomer}" existe déjà`);
            }
          }

          // Créer un nouveau client
          const newClient = await this.customerService.create({
            ...contractData.clientData,
            idUser: contractData.idUser
          });
          contractData.idCustomer = newClient.id;
          console.log(`✅ Nouveau client créé: ${newClient.lastname} ${newClient.firstname} (ID: ${newClient.id}, numCustomer: ${newClient.numCustomer})`);
        }
      }
    } else if (!contractData.idCustomer) {
      throw new Error('L\'ID du client ou les données du client sont obligatoires');
    }

    // Utiliser la fonction de validation et traitement des données
    await this.validateAndProcessContractDataHorsConvention(contractData, contractData.idUser);

    // S'assurer que les primes sont présentes (elles doivent être fournies manuellement pour hors convention)
    if (!contractData.pd && contractData.pd !== 0) contractData.pd = 0;
    if (!contractData.pc && contractData.pc !== 0) contractData.pc = 0;
    if (!contractData.surp && contractData.surp !== 0) contractData.surp = 0;
    if (!contractData.acc && contractData.acc !== 0) contractData.acc = 0;
    if (!contractData.fm && contractData.fm !== 0) contractData.fm = 0;
    if (!contractData.puttc && contractData.puttc !== 0) {
      // Calculer PUTTC si non fourni
      contractData.puttc = (contractData.pd || 0) + (contractData.pc || 0) + (contractData.surp || 0) + (contractData.acc || 0) + (contractData.fm || 0);
    }

    // Fixer garantieCompl à 'NON' par défaut si non fourni
    if (!contractData.garantieCompl) {
      contractData.garantieCompl = 'NON';
    }

    // Marquer comme contrat hors convention
    contractData.contractType = ContractType.HORS_CONVENTION;

    const { beneficiaries, ...rest } = contractData;
    const contract = this.contractRepository.create(rest);
    const savedContract = await this.contractRepository.save(contract);

    if (creditType === 'CP' && beneficiaries) {
      await this.saveCPBeneficiaries(savedContract.id, beneficiaries);
    }

    // Enregistrer les membres assurés OBA si présents
    if (creditType === 'OBA' && contractData.obaOptions) {
      await this.saveOBAInsuredMembers(savedContract.id, contractData.obaOptions);
    }

    // Créer l'historique de création
    await this.createHistoryRecord(
      savedContract, 
      null, 
      contractData, 
      ContractHistoryAction.CREATE
    );

    // Charger la relation customer et beneficiaries pour le retour
    const contractWithRelations = await this.findOneWithRelations(savedContract.id);

    return contractWithRelations || savedContract;
  }

  // Fonction pour générer la police selon le type de crédit et de contrat
  async generatePolice(idAgency: number, typeCredit: string = 'A'): Promise<string> {
    return this.policyNumberService.generateStandardPolice(idAgency, typeCredit);
  }

  // Générer une police PADME (format BE{agency}P{nextId})
  async generatePadmePolice(idAgency: number): Promise<string> {
    return this.policyNumberService.generatePadmePolice(idAgency);
  }

  // Fonction pour générer la référence selon le type de contrat et de crédit
  async generateReference(idUser: number, typeCredit: string = 'A'): Promise<string> {
    return this.policyNumberService.generateStandardReference(idUser, typeCredit);
  }

  // Générer une référence PADME (format PA{randomCode}{creditType})
  async generatePadmeReference(idUser: number, creditType: string = 'AMORT'): Promise<string> {
    return this.policyNumberService.generatePadmeReference(idUser, creditType);
  }

  /**
   * Convertit une cotation PADME en contrat
   * @param cotation Cotation à convertir
   * @param clientData Données client du modal
   */
  async convertCotationToContract(cotation: any, clientData: any): Promise<Contract> {
    // Générer la police et la référence
    const police = await this.generatePadmePolice(clientData.idAgency);
    const creditType = cotation.idNatureCredit === 2 ? 'CP' : (cotation.idNatureCredit === 3 ? 'OBA' : 'AMORT');
    
    let reference = cotation.reference;
    if (reference) {
      const existingWithRef = await this.contractRepository.findOne({ where: { reference } });
      if (existingWithRef) {
        reference = await this.generatePadmeReference(clientData.idUser, creditType);
      }
    } else {
      reference = await this.generatePadmeReference(clientData.idUser, creditType);
    }

    // Créer ou récupérer le client
    let customer: Customer;
    if (clientData.idCustomer) {
      const existingCustomer = await this.customerService.findOne(clientData.idCustomer);
      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        throw new Error(`Client avec l'ID ${clientData.idCustomer} introuvable`);
      }
    } else {
      // Créer un nouveau client avec les données fournies
      customer = await this.customerService.create({
        lastname: clientData.nom || clientData.lastname,
        firstname: clientData.prenoms || clientData.firstname,
        phone: clientData.telephone || clientData.phone,
        email: clientData.email,
        address: clientData.adresse || clientData.address,
        placeOfBirth: clientData.lieuNaissance || clientData.placeOfBirth,
        birthdate: cotation.birthdate || clientData.dateNaissance,
        occupation: clientData.profession || clientData.occupation,
        gender: clientData.sexe === 'Homme' ? 'M' : (clientData.gender || 'M'),
        idTypeCustomer: parseInt(clientData.typeClient || clientData.idTypeCustomer || '1')
      });
    }

    // Créer le contrat en copiant les champs de la cotation
    const contractData: Partial<Contract> = {
      idUser: clientData.idUser,
      idAgency: clientData.idAgency,
      idCustomer: customer.id,
      idNatureCredit: cotation.idNatureCredit,
      idPeriodicite: cotation.idPeriodicite,
      capital: cotation.capital,
      duration: cotation.duration,
      differe: cotation.differe,
      garantieCompl: cotation.garantieCompl || 'NON',
      pd: cotation.pd,
      pc: cotation.pc,
      surp: cotation.surp,
      acc: cotation.acc,
      fm: cotation.fm,
      puttc: cotation.puttc,
      reference,
      police,
      etablissement: clientData.etablissement || cotation.etablissement,
      contractType: 'PADME',
      description: `Contrat généré depuis cotation ${cotation.id}`,
      keyCont: `COTATION_${cotation.id}`
    };

    // Créer le contrat
    return this.create(contractData);
  }

  // Création d'un contrat PADME (differe + idPeriodicite + primePADME)
  async createPadmeContract(contractData: Partial<Contract> & { clientData?: any }): Promise<Contract> {
    if (!contractData.capital || !contractData.duration || !contractData.clientData?.birthdate) {
      throw new Error('Champs requis manquants pour le contrat PADME');
    }

    const birthdate = contractData.clientData.birthdate;
    const creditType = this.getCreditType(contractData);
    const isCPorOBA = creditType === 'CP' || creditType === 'OBA';
    
    // Validate CP details
    this.validateCPDetails(contractData, creditType);

    if (isCPorOBA) {
      contractData.differe = 0;
      contractData.idPeriodicite = 12;
    }
    
    const differe = contractData.differe || 0;
    const idPeriodicite = contractData.idPeriodicite || 1;
    const dateEff = contractData.dateEff ? new Date(contractData.dateEff) : new Date();
    const dateEffISO = dateEff.toISOString().split('T')[0];

    // Enforce date d'effet >= today for non-CP contracts
    if (creditType !== 'CP') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dateEffISO < todayStr) {
        throw new Error("La date d'effet ne peut pas être antérieure à la date courante.");
      }
    }

    // Enforce dateEch1 >= dateEff for non-AMORT non-CP contracts
    if (creditType !== 'AMORT' && creditType !== 'CP') {
      if (contractData.dateEch1) {
        const dateEffDate = new Date(dateEffISO);
        const dateEch1Date = new Date(contractData.dateEch1);
        dateEffDate.setHours(0, 0, 0, 0);
        dateEch1Date.setHours(0, 0, 0, 0);
        if (dateEch1Date < dateEffDate) {
          throw new Error("La date de la 1re échéance ne peut pas être antérieure à la date d'effet.");
        }
      }
    }

    const primeData = await this.quotationService.primePADME(
      contractData.capital,
      birthdate,
      contractData.duration,
      idPeriodicite,
      dateEffISO,
      differe,
      creditType,
      contractData.obaOptions
    );

    if (primeData.error) {
      throw new Error(primeData.message || 'Erreur calcul prime PADME');
    }

    if (creditType === 'OBA' && primeData.capital) {
      contractData.capital = primeData.capital;
    }

    // Gestion client (simplifiée)
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

    contractData.police = contractData.police || await this.generatePadmePolice(contractData.idAgency || 0);
    contractData.reference = contractData.reference || await this.generatePadmeReference(contractData.idUser || 0, creditType);

    // Vérifier l'unicité de la référence
    const existingContractReference = await this.findByReference(contractData.reference || '');
    if (existingContractReference.length > 0) {
      throw new Error(`Cette référence est déjà utilisée pour un autre contrat. Veuillez le rechercher par la police ${existingContractReference[0].police} ou la référence ${existingContractReference[0].reference}`);
    }

    // Dates échéances
    if (creditType === 'CP') {
      contractData.duration = 12;
      const activeDate = new Date();
      activeDate.setDate(activeDate.getDate() + 1);
      activeDate.setHours(0, 0, 0, 0);
      
      const dateEchVal = new Date(activeDate);
      dateEchVal.setFullYear(dateEchVal.getFullYear() + 1);
      dateEchVal.setDate(dateEchVal.getDate() - 1);
      dateEchVal.setHours(0, 0, 0, 0);

      contractData.dateEff = activeDate;
      contractData.dateEch1 = dateEchVal;
      contractData.dateEch = dateEchVal;
    } else {
      const dateEch1 = contractData.dateEch1 
        ? new Date(contractData.dateEch1) 
        : (() => {
            const d = new Date(dateEff);
            d.setMonth(d.getMonth() + 1 + differe);
            return d;
          })();

      const dateEch = contractData.dateEch 
        ? new Date(contractData.dateEch) 
        : await this.calculerDateEch(dateEch1, contractData.duration || 0);

      contractData.dateEff = dateEff;
      contractData.dateEch1 = dateEch1;
      contractData.dateEch = dateEch;
    }

    // Primes
    contractData.pd = primeData.pd;
    contractData.pc = primeData.pc;
    contractData.acc = primeData.acc;
    contractData.surp = primeData.surp;
    contractData.fm = primeData.fm;
    contractData.puttc = primeData.puttc;
    (contractData as any).prime = contractData.puttc;
    (contractData as any).commission = 0;

    // Fixer garantieCompl à 'NON' par défaut si non fourni
    if (!contractData.garantieCompl) {
      contractData.garantieCompl = 'NON';
    }

    contractData.contractType = 'PADME';

    // Unicité contrat (avec suffixe unique pour autoriser les souscriptions multiples le même jour)
    contractData.keyCont = await this.generateKeyCont(
      contractData.idCustomer || 0,
      creditType,
      contractData.capital || 0,
      contractData.duration || 0,
      contractData.garantieCompl
    );

    const { beneficiaries, ...rest } = contractData;
    const contract = this.contractRepository.create(rest);
    const savedContract = await this.contractRepository.save(contract);

    if (creditType === 'CP' && beneficiaries) {
      await this.saveCPBeneficiaries(savedContract.id, beneficiaries);
    }

    // Enregistrer les membres assurés OBA si présents
    if (creditType === 'OBA' && contractData.obaOptions) {
      await this.saveOBAInsuredMembers(savedContract.id, contractData.obaOptions);
    }

    // Créer l'historique de création
    await this.createHistoryRecord(
      savedContract,
      null,
      rest,
      ContractHistoryAction.CREATE
    );

    return savedContract;
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
   * Indépendant de createPadmeContract : ne modifie aucun chemin PADME
   * existant, n'appelle pas validateCPDetails/saveCPBeneficiaries
   * (spécifiques à PADME/CP, non pertinents ici).
   */
  async createRenacaContract(contractData: Partial<Contract> & { clientData?: any; perteEmploi?: boolean; tauxSurprime?: number; beneficiaire?: string; accessoires?: number }): Promise<Contract> {
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

    const accessoires = (contractData as any).accessoires ?? contractData.acc;
    const primeData = await this.quotationService.primeRENACA(
      typeCapital,
      contractData.capital,
      birthdate,
      contractData.duration,
      contractData.perteEmploi,
      contractData.tauxSurprime,
      accessoires
    );

    if (primeData.error) {
      throw new BadRequestException(primeData.message || 'Erreur lors du calcul de la prime RENACA');
    }

    // Gestion client (recherche ou création, identique au chemin PADME)
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

    const policeTypeCredit = typeCapital === 'CONST' ? 'RC' : 'RA';
    contractData.police = contractData.police || await this.policyNumberService.generateStandardPolice(contractData.idAgency || 0, policeTypeCredit);
    contractData.reference = contractData.reference || await this.policyNumberService.generateStandardReference(contractData.idUser || 0, policeTypeCredit);

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
    contractData.pc = 0;
    contractData.acc = primeData.acc;
    contractData.surp = primeData.surp;
    contractData.fm = 0;
    contractData.puttc = primeData.puttc;
    (contractData as any).primePE = primeData.primePE || 0;
    (contractData as any).prime = contractData.puttc;
    (contractData as any).commission = 0;

    if (!contractData.garantieCompl) {
      contractData.garantieCompl = 'NON';
    }

    contractData.contractType = 'RENACA';

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
    Object.assign(existingContract, adminUpdateData);
    const updatedContract = await this.contractRepository.save(existingContract);

    if (obaOptions) {
      await this.insuredMemberRepository.delete({ idContract: updatedContract.id });
      await this.saveOBAInsuredMembers(updatedContract.id, obaOptions);
    }

    if (beneficiaries && Array.isArray(beneficiaries) && beneficiaries.length > 0) {
      await this.beneficiaryRepository.delete({ idContract: updatedContract.id });
      await this.saveCPBeneficiaries(updatedContract.id, beneficiaries);
    }

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

    const idNatureCredit = contractData.idNatureCredit || existingContract.idNatureCredit;
    const creditType = (contractData as any).creditType || (String(idNatureCredit) === '2' ? 'CP' : String(idNatureCredit) === '3' ? 'OBA' : 'AMORT');
    
    if (creditType === 'CP') {
      const cpDataToValidate = {
        renouvellementAuto: contractData.renouvellementAuto !== undefined ? contractData.renouvellementAuto : existingContract.renouvellementAuto,
        compteBancaire: contractData.compteBancaire !== undefined ? contractData.compteBancaire : existingContract.compteBancaire,
        numeroCompte: contractData.numeroCompte !== undefined ? contractData.numeroCompte : existingContract.numeroCompte,
        beneficiaries: beneficiaries !== undefined ? beneficiaries : existingContract.beneficiaries
      };
      this.validateCPDetails(cpDataToValidate, creditType);
    } else {
      this.validateCPDetails(contractData, creditType);
    }

    // 3. Appliquer les contraintes automatiques par nature de crédit
    this.applyCreditTypeConstraints(creditType, contractUpdateData, existingContract);

    // 4. Recalculer les primes si nécessaire
    const customer = await this.customerService.findOne(existingContract.idCustomer);
    const birthdate = customer?.birthdate || '';
    await this.recalculatePremiumIfNeeded(
      id,
      creditType,
      contractUpdateData,
      existingContract,
      originalBirthdate,
      birthdate,
      (contractData as any).obaOptions
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
    Object.assign(existingContract, contractUpdateData);
    const updatedContract = await this.contractRepository.save(existingContract);

    // Recréation des bénéficiaires CP
    if (creditType === 'CP' && beneficiaries && Array.isArray(beneficiaries) && beneficiaries.length > 0) {
      await this.beneficiaryRepository.delete({ idContract: updatedContract.id });
      await this.saveCPBeneficiaries(updatedContract.id, beneficiaries);
    }

    // Recréation des membres OBA
    if (creditType === 'OBA' && (contractData as any).obaOptions) {
      await this.insuredMemberRepository.delete({ idContract: updatedContract.id });
      await this.saveOBAInsuredMembers(updatedContract.id, (contractData as any).obaOptions);
    }

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
   * Applique les contraintes automatiques sur la périodicité, le différé et la durée selon la nature du crédit.
   */
  private applyCreditTypeConstraints(creditType: string, contractUpdateData: Partial<Contract>, existingContract: Contract): void {
    if (creditType === 'CP' || creditType === 'OBA') {
      contractUpdateData.idPeriodicite = 12;
      contractUpdateData.differe = 0;
      contractUpdateData.duration = 12;
      
      const baseDate = contractUpdateData.dateEff ? new Date(contractUpdateData.dateEff) : (existingContract.dateEff ? new Date(existingContract.dateEff) : new Date());
      const activeDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;
      
      const dateEchVal = new Date(activeDate);
      dateEchVal.setFullYear(dateEchVal.getFullYear() + 1);
      dateEchVal.setDate(dateEchVal.getDate() - 1);

      contractUpdateData.dateEff = activeDate;
      contractUpdateData.dateEch1 = dateEchVal;
      contractUpdateData.dateEch = dateEchVal;
    }
  }

  /**
   * Recalcule la prime du contrat si un critère de calcul a changé.
   */
  private async recalculatePremiumIfNeeded(
    id: number,
    creditType: string,
    contractUpdateData: Partial<Contract>,
    existingContract: Contract,
    originalBirthdate: string,
    birthdate: string,
    obaOptions?: any
  ): Promise<void> {
    const currentCapital = contractUpdateData.capital !== undefined ? contractUpdateData.capital : existingContract.capital;
    const currentDuration = contractUpdateData.duration !== undefined ? contractUpdateData.duration : existingContract.duration;
    const currentPeriodicite = contractUpdateData.idPeriodicite !== undefined ? contractUpdateData.idPeriodicite : existingContract.idPeriodicite;
    const currentDiffere = contractUpdateData.differe !== undefined ? contractUpdateData.differe : existingContract.differe;
    const currentDateEff = contractUpdateData.dateEff !== undefined ? contractUpdateData.dateEff : existingContract.dateEff;

    const capitalChanged = contractUpdateData.capital !== undefined && contractUpdateData.capital !== existingContract.capital;
    const durationChanged = contractUpdateData.duration !== undefined && contractUpdateData.duration !== existingContract.duration;
    const periodiciteChanged = contractUpdateData.idPeriodicite !== undefined && contractUpdateData.idPeriodicite !== existingContract.idPeriodicite;
    const differeChanged = contractUpdateData.differe !== undefined && contractUpdateData.differe !== existingContract.differe;
    const dateEffChanged = contractUpdateData.dateEff !== undefined && 
      (new Date(contractUpdateData.dateEff).getTime() !== new Date(existingContract.dateEff).getTime());
    const natureChanged = contractUpdateData.idNatureCredit !== undefined && contractUpdateData.idNatureCredit !== existingContract.idNatureCredit;
    const birthdateChanged = originalBirthdate && birthdate !== originalBirthdate;
    const obaOptionsChanged = obaOptions !== undefined;
    const garantieComplChanged = contractUpdateData.garantieCompl !== undefined && contractUpdateData.garantieCompl !== existingContract.garantieCompl;

    const needsRecalculation = 
      capitalChanged || 
      durationChanged || 
      periodiciteChanged || 
      differeChanged || 
      dateEffChanged || 
      natureChanged || 
      birthdateChanged || 
      obaOptionsChanged ||
      garantieComplChanged;

    if (needsRecalculation) {
      console.log(`🔄 Recalcul automatique des primes requis pour le contrat ${id} (Nature: ${creditType})`);
      const datecreditStr = currentDateEff
        ? new Date(currentDateEff).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const obaOpts = obaOptions || existingContract.obaOptions;

      const primeData = await this.quotationService.primePADME(
        currentCapital,
        birthdate,
        currentDuration,
        currentPeriodicite,
        datecreditStr,
        currentDiffere,
        creditType,
        obaOpts
      );

      if (primeData.error) {
        throw new BadRequestException(primeData.message);
      }

      contractUpdateData.pd = primeData.pd;
      contractUpdateData.pc = primeData.pc;
      contractUpdateData.acc = primeData.acc;
      contractUpdateData.surp = primeData.surp;
      contractUpdateData.fm = primeData.fm;
      contractUpdateData.puttc = primeData.puttc;

      if (creditType === 'OBA') {
        if (primeData.capital) {
          contractUpdateData.capital = primeData.capital;
        }
        if (obaOpts) {
          contractUpdateData.obaOptions = obaOpts;
        }
      }
    }
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
  async importContracts(contractsData: Array<Partial<Contract> & { clientData?: any; beneficiaries?: any[] }>, userId: number, userAgency: number): Promise<{
    success: boolean;
    message: string;
    results: Array<{
      index: number;
      success: boolean;
      contract?: Contract;
      error?: string;
    }>;
    summary: {
      total: number;
      success: number;
      failed: number;
    };
    successfulContractIds: number[];
  }> {
    console.log(`📥 Import de ${contractsData.length} contrats pour l'utilisateur ${userId}`);
    console.log('📋 Données reçues:', contractsData.map((c, i) => ({
      index: i,
      clientData: c.clientData,
      capital: c.capital,
      idNatureCredit: c.idNatureCredit
    })));
    
    console.log('🔍 Début du traitement des contrats...');
    
    const results: Array<{
      index: number;
      success: boolean;
      contract?: Contract;
      error?: string;
    }> = [];
    
    let successCount = 0;
    let failedCount = 0;

    // Traitement séquentiel pour éviter les conflits de clés
    for (let i = 0; i < contractsData.length; i++) {
      const contractData = contractsData[i];
      console.log(`🔄 Traitement du contrat ${i + 1}/${contractsData.length}...`);
      
      try {
        // Ajouter les champs d'audit et l'utilisateur
        contractData.idUser = userId;
        contractData.idAgency = userAgency;
        contractData.idProduct = 1;
        contractData.idContractState = 1;
        (contractData as any).isImport = true;
        
        const isHC = contractData.contractType === ContractType.HORS_CONVENTION;
        const creditType = this.getCreditType(contractData);

        // Valider les bénéficiaires CP
        this.validateCPDetails(contractData, creditType);

        // Gestion du client (recherche ou création) - commune
        if (contractData.clientData) {
          if (contractData.clientData.idCustomer) {
            contractData.idCustomer = contractData.clientData.idCustomer;
          } else {
            let existingCustomer: Customer | null = null;
            if (contractData.clientData.numCustomer && contractData.clientData.numCustomer.trim()) {
              existingCustomer = await this.customerService.findByNumCustomer(contractData.clientData.numCustomer.trim());
            }
            if (!existingCustomer && contractData.clientData.lastname && contractData.clientData.firstname && contractData.clientData.birthdate) {
              existingCustomer = await this.customerService.findByPersonalInfo(
                contractData.clientData.lastname.trim().toUpperCase(),
                contractData.clientData.firstname.trim().toUpperCase(),
                contractData.clientData.birthdate.trim()
              );
            }
            if (!existingCustomer) {
              if (!contractData.clientData.lastname || !contractData.clientData.firstname || !contractData.clientData.birthdate) {
                throw new Error('Les informations du client (nom, prénom, date de naissance) sont obligatoires pour créer un nouveau client');
              }

              const clientInfo = contractData.clientData;
              const placeOfBirth = clientInfo.placeOfBirth || clientInfo.birthplace || clientInfo.place_of_birth || clientInfo.lieuNaissance || 'NON RENSEIGNÉ';
              const occupation = clientInfo.occupation || clientInfo.profession || 'NON RENSEIGNÉ';

              const newClient = await this.customerService.create({
                ...clientInfo,
                placeOfBirth,
                occupation,
                idUser: userId
              });
              contractData.idCustomer = newClient.id;
            } else {
              contractData.idCustomer = existingCustomer.id;
            }
          }
        } else if (!contractData.idCustomer) {
          throw new Error('L\'ID du client ou les données du client sont obligatoires');
        }

        if (isHC) {
          await this.validateAndProcessContractDataHorsConvention(contractData, userId);
          if (!contractData.pd && contractData.pd !== 0) contractData.pd = 0;
          if (!contractData.pc && contractData.pc !== 0) contractData.pc = 0;
          if (!contractData.surp && contractData.surp !== 0) contractData.surp = 0;
          if (!contractData.acc && contractData.acc !== 0) contractData.acc = 0;
          if (!contractData.fm && contractData.fm !== 0) contractData.fm = 0;
          if (!contractData.puttc && contractData.puttc !== 0) {
            contractData.puttc = Number(contractData.pd || 0) + Number(contractData.pc || 0) + Number(contractData.surp || 0) + Number(contractData.acc || 0) + Number(contractData.fm || 0);
          }
        } else {
          await this.validateAndProcessContractData(contractData, userId);
        }

        const { beneficiaries, clientData, ...rest } = contractData;
        const contract = this.contractRepository.create(rest);
        const savedContract = await this.contractRepository.save(contract) as Contract;

        if (creditType === 'CP') {
          if (beneficiaries && beneficiaries.length > 0) {
            await this.saveCPBeneficiaries(savedContract.id, beneficiaries);
          } else {
            const customerObj = savedContract.customer || clientData;
            const custNomPrenoms = customerObj ? `${customerObj.lastname || ''} ${customerObj.firstname || ''}`.trim() : 'Ayant droit';
            const defaultBeneficiaries = [
              {
                nomPrenoms: custNomPrenoms || 'Ayant droit',
                lienParente: 'AUTRE',
                pourcentage: 100
              }
            ];
            await this.saveCPBeneficiaries(savedContract.id, defaultBeneficiaries);
          }
        }

        if (creditType === 'OBA' && (contractData as any).obaOptions) {
          await this.saveOBAInsuredMembers(savedContract.id, (contractData as any).obaOptions);
        }

        // Créer l'historique de création
        await this.createHistoryRecord(
          savedContract, 
          null, 
          contractData, 
          ContractHistoryAction.CREATE
        );

        results.push({
          index: i,
          success: true,
          contract: savedContract
        });
        
        successCount++;
        console.log(`✅ Contrat ${i + 1}/${contractsData.length} créé avec succès: ${savedContract.reference}`);
        
      } catch (error) {
        console.error(`❌ Erreur lors de la création du contrat ${i + 1}:`, error.message);
        console.error(`🔍 Détails de l'erreur:`, {
          error: error.message,
          stack: error.stack,
          contractData: {
            capital: contractData.capital,
            idNatureCredit: contractData.idNatureCredit,
            clientData: contractData.clientData
          }
        });
        
        results.push({
          index: i,
          success: false,
          error: error.message || 'Erreur inconnue'
        });
        
        failedCount++;
      }
    }

    const summary = {
      total: contractsData.length,
      success: successCount,
      failed: failedCount
    };

    console.log(`📊 Résumé de l'import: ${successCount} succès, ${failedCount} échecs sur ${contractsData.length} contrats`);

    // Récupérer les IDs des contrats créés avec succès
    const successfulContractIds = results
      .filter(result => result.success && result.contract?.id)
      .map(result => result.contract!.id);

    return {
      success: true, // Toujours true pour permettre l'affichage des résultats
      message: `Import terminé: ${successCount} contrat(s) créé(s) avec succès, ${failedCount} échec(s)`,
      results,
      summary,
      successfulContractIds
    };
  }

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

    // RÈGLE 1 : AMORT (Crédit Amortissable) -> Pas de doublon exact le même jour pour un même client
    if (code === 'AMORT') {
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

      // Rechercher s'il existe déjà un contrat AMORT créé ou prenant effet ce même jour avec les mêmes caractéristiques
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

      const existingAmortSameDay = await query.getOne();

      if (existingAmortSameDay) {
        const policeStr = existingAmortSameDay.police || 'N/A';
        const referenceStr = existingAmortSameDay.reference || 'N/A';
        const dayStr = formatDateStr(targetDate);
        throw new Error(
          `Souscription refusée : Le client "${customerName}" a déjà souscrit un crédit Amortissable le ${dayStr} avec les mêmes caractéristiques (Capital: ${contractData.capital} FCFA, Durée: ${contractData.duration} mois, Police: ${policeStr}, Référence: ${referenceStr}).`
        );
      }
      return;
    }

    // RÈGLE 2 : CP (Crédit Campagne -> Max 3 sur 1 an) / OBA (Obsèques Alafia -> Max 2 sur 1 an)
    let limit = 0;
    let natureName = '';

    if (code === 'CP') {
      limit = 3;
      natureName = 'Campagne (CP)';
    } else if (code === 'OBA') {
      limit = 2;
      natureName = 'Obsèques Alafia (OBA)';
    } else {
      return; // Aucune limite sur d'autres types non spécifiés
    }

    // Récupérer tous les contrats valides du client pour cette nature
    const existingContracts = await this.contractRepository.createQueryBuilder('contract')
      .where('contract.idCustomer = :idCustomer', { idCustomer })
      .andWhere('contract.idNatureCredit = :idNatureCredit', { idNatureCredit })
      .andWhere('contract.idContractState IN (:...states)', { states: [1, 2, 5] }) // EN COURS, RENOUVELE, SINISTRE
      .orderBy('contract.dateEff', 'ASC')
      .addOrderBy('contract.createdAt', 'ASC')
      .getMany();

    if (existingContracts.length === 0) {
      return; // Premier crédit pour cette nature
    }

    // Déterminer la période de référence d'un an basée sur le 1er crédit
    const firstContract = existingContracts[0];
    const refStartDate = new Date(firstContract.dateEff || firstContract.createdAt);

    const refEndDate = new Date(refStartDate);
    refEndDate.setFullYear(refEndDate.getFullYear() + 1);
    refEndDate.setDate(refEndDate.getDate() - 1);
    refEndDate.setHours(23, 59, 59, 999);

    // Vérifier si la souscription demandée est dans la période de référence
    if (targetDate >= refStartDate && targetDate <= refEndDate) {
      const contractsInPeriod = existingContracts.filter(c => {
        const d = new Date(c.dateEff || c.createdAt);
        return d >= refStartDate && d <= refEndDate;
      });

      if (contractsInPeriod.length >= limit) {
        const formatDateStr = (d: Date) => {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        };

        const references = contractsInPeriod
          .map(c => c.police || c.reference || `#${c.id}`)
          .join(', ');

        const pStart = formatDateStr(refStartDate);
        const pEnd = formatDateStr(refEndDate);

        throw new Error(
          `Souscription refusée : Le client "${customerName}" a déjà atteint la limite maximale de ${limit} crédit(s) pour la nature "${natureName}" durant la période du ${pStart} au ${pEnd} (${contractsInPeriod.length} crédit(s) souscrit(s) : ${references}).`
        );
      }
    }
  }

  private getCreditType(contractData: Partial<Contract>): string {
    return (contractData as any).creditType || 
      (String(contractData.idNatureCredit) === '2' ? 'CP' : String(contractData.idNatureCredit) === '3' ? 'OBA' : 'AMORT');
  }

  private validateCPDetails(contractData: any, creditType: string): void {
    if (creditType !== 'CP') {
      return;
    }

    const { renouvellementAuto, compteBancaire, numeroCompte, beneficiaries } = contractData;

    // Check CP-specific fields
    if (renouvellementAuto === undefined || renouvellementAuto === null) {
      throw new BadRequestException("Le champ 'Renouvellement automatique' est obligatoire pour un contrat CP.");
    }
    if (!compteBancaire || !compteBancaire.trim()) {
      throw new BadRequestException("Le champ 'Compte bancaire' est obligatoire pour un contrat CP.");
    }
    if (!numeroCompte || !numeroCompte.trim()) {
      throw new BadRequestException("Le champ 'Numéro de compte' est obligatoire pour un contrat CP.");
    }

    // Check beneficiaries
    if (!beneficiaries || !Array.isArray(beneficiaries) || beneficiaries.length === 0) {
      throw new BadRequestException("Au moins un bénéficiaire doit être enregistré pour un contrat CP.");
    }
    if (beneficiaries.length > 5) {
      throw new BadRequestException("Un maximum de 5 bénéficiaires est autorisé pour un contrat CP.");
    }

    let sumPourcentage = 0;
    for (const b of beneficiaries) {
      if (!b.nomPrenoms || !b.nomPrenoms.trim()) {
        throw new BadRequestException("Le nom et les prénoms du bénéficiaire sont obligatoires.");
      }
      if (!b.lienParente || !b.lienParente.trim()) {
        throw new BadRequestException("Le lien de parenté du bénéficiaire est obligatoire.");
      }
      const pct = parseFloat(b.pourcentage);
      if (isNaN(pct) || pct <= 0) {
        throw new BadRequestException("Le pourcentage de part du bénéficiaire doit être supérieur à 0.");
      }
      sumPourcentage += pct;
    }

    if (Math.abs(sumPourcentage - 100) > 0.01) {
      throw new BadRequestException("La somme des parts des bénéficiaires doit être exactement égale à 100%.");
    }
  }

  /**
   * Normalise le lien de parenté pour correspondre strictement aux libellés de la table lien_parente :
   * PERE, MERE, ENFANT, CONJOINT, FRERE, SOEUR, AUTRE
   */
  normalizeLienParente(lien?: string): string {
    if (!lien || !lien.trim()) return 'AUTRE';
    const clean = lien.trim().toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (clean.includes('ENFANT') || clean.includes('FILS') || clean.includes('FILLE')) {
      return 'ENFANT';
    }
    if (clean.includes('CONJOINT') || clean.includes('EPOUX') || clean.includes('EPOUSE') || clean.includes('MARI') || clean.includes('FEMME')) {
      return 'CONJOINT';
    }
    if (clean.includes('PERE') || clean.includes('PAPA')) {
      return 'PERE';
    }
    if (clean.includes('MERE') || clean.includes('MAMAN')) {
      return 'MERE';
    }
    if (clean.includes('FRERE')) {
      return 'FRERE';
    }
    if (clean.includes('SOEUR')) {
      return 'SOEUR';
    }
    if (clean.includes('AUTRE') || clean.includes('AYANT') || clean.includes('DROIT')) {
      return 'AUTRE';
    }

    const validCodes = ['PERE', 'MERE', 'ENFANT', 'CONJOINT', 'FRERE', 'SOEUR', 'AUTRE'];
    if (validCodes.includes(clean)) {
      return clean;
    }

    return 'AUTRE';
  }

  private async saveCPBeneficiaries(contractId: number, beneficiaries: any[]): Promise<void> {
    const records = beneficiaries.map(b => {
      const record = new Beneficiary();
      record.idContract = contractId;
      record.nomPrenoms = (b.nomPrenoms || `${b.nom || ''} ${b.prenom || ''}`).trim() || 'Ayant droit';
      record.lienParente = this.normalizeLienParente(b.lienParente);
      record.pourcentage = parseFloat(b.pourcentage) || 100;
      return record;
    });
    await this.beneficiaryRepository.save(records);
  }

  /**
   * Enregistre les membres assurés secondaires d'un contrat OBA.
   * Seul l'assuré principal est dans la table customers.
   * Le conjoint et les ascendants (cochés dans obaOptions) sont enregistrés ici.
   */
  private async saveOBAInsuredMembers(contractId: number, obaOptions: any): Promise<void> {
    const roleConfig: Record<string, { label: string }> = {
      conjoint:    { label: 'Conjoint(e)' },
      ascendant1:  { label: "Père de l'Assuré" },
      ascendant2:  { label: "Mère de l'Assuré" },
      ascendant3:  { label: 'Père du (de la) Conjoint(e)' },
      ascendant4:  { label: 'Mère du (de la) Conjoint(e)' },
    };

    const records: ContractInsuredMember[] = [];

    for (const [role, cfg] of Object.entries(roleConfig)) {
      const opt = obaOptions[role];
      if (!opt || !opt.checked) continue;

      const member = new ContractInsuredMember();
      member.idContract   = contractId;
      member.role         = role;
      member.roleLabel    = cfg.label;
      member.lastname     = (opt.lastname  || '').toUpperCase().trim();
      member.firstname    = (opt.firstname || '').trim();
      member.birthdate    = opt.birthdate  || null;
      member.gender       = opt.gender     || null;
      member.capitalAssure = opt.capitalAssure ? Number(opt.capitalAssure) : 0;
      member.prime        = opt.prime       ? Number(opt.prime)        : 0;
      records.push(member);
    }

    if (records.length > 0) {
      await this.insuredMemberRepository.save(records);
    }
  }

  // Fonction de validation et traitement des données de contrat (extrait de create)
  private async validateAndProcessContractData(contractData: Partial<Contract> & { clientData?: any }, userId?: number): Promise<void> {
    // Recalculer les primes avant tout
    let primeData: any;
    const birthdate = contractData.clientData?.birthdate || '';
    let capital = contractData.capital || 0;
    let duration = contractData.duration || 0;
    const creditType = this.getCreditType(contractData);
    
    // Validate CP details
    this.validateCPDetails(contractData, creditType);

    const isCPorOBA = creditType === 'CP' || creditType === 'OBA';
    
    if (isCPorOBA) {
      contractData.differe = 0;
      contractData.idPeriodicite = 12;
      contractData.duration = 12;
    }

    // Aligner avec conversion contrat (CotationToContratModal.vue)
    if (creditType === 'CP') {
      contractData.duration = 12;
      contractData.differe = 0;
      contractData.idPeriodicite = 12;

      let activeDate: Date;
      if (contractData.dateEff) {
        const parsed = new Date(contractData.dateEff);
        activeDate = isNaN(parsed.getTime()) ? new Date() : parsed;
      } else {
        activeDate = new Date();
        activeDate.setDate(activeDate.getDate() + 1);
      }
      activeDate.setHours(0, 0, 0, 0);

      // Date d'échéance = Date d'effet + 1 an - 1 jour (la veille dans un an)
      const dateEchVal = new Date(activeDate);
      dateEchVal.setFullYear(dateEchVal.getFullYear() + 1);
      dateEchVal.setDate(dateEchVal.getDate() - 1);
      dateEchVal.setHours(0, 0, 0, 0);

      contractData.dateEff = activeDate;
      contractData.dateEch1 = dateEchVal;
      contractData.dateEch = dateEchVal;
    } else if (creditType === 'OBA') {
      contractData.duration = 12;
      contractData.differe = 0;
      contractData.idPeriodicite = 12;
    }
    
    const idPeriodicite = contractData.idPeriodicite || 1;
    const differe = contractData.differe || 0;
    duration = contractData.duration || 0;
    const datecredit = contractData.dateEff 
      ? new Date(contractData.dateEff).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Enforce date d'effet >= today for non-CP contracts
    if (creditType !== 'CP') {
      const todayStr = new Date().toISOString().split('T')[0];
      const isImport = (contractData as any).isImport || false;
      if (!isImport && datecredit < todayStr) {
        throw new Error("La date d'effet ne peut pas être antérieure à la date courante.");
      }
    }

    // Enforce dateEch1 >= dateEff for non-CP contracts
    if (creditType !== 'CP') {
      if (contractData.dateEch1) {
        const dateEffDate = new Date(datecredit);
        const dateEch1Date = new Date(contractData.dateEch1);
        dateEffDate.setHours(0, 0, 0, 0);
        dateEch1Date.setHours(0, 0, 0, 0);
        if (dateEch1Date < dateEffDate) {
          throw new Error("La date de la 1re échéance ne peut pas être antérieure à la date d'effet.");
        }
      }
    }
    
    primeData = await this.quotationService.primePADME(
      capital,
      birthdate,
      duration,
      idPeriodicite,
      datecredit,
      differe,
      creditType,
      contractData.obaOptions
    );

    if (creditType === 'OBA' && primeData.capital) {
      contractData.capital = primeData.capital;
      capital = primeData.capital;
    }
    const typeCredit = contractData.idNatureCredit === 1 ? 'A' : 'HC';
    
    // Utiliser les méthodes PADME pour la génération des identifiants
    contractData.police = contractData.police || await this.generatePadmePolice(contractData.idAgency || 0);
    contractData.reference = contractData.reference || (contractData.idUser ? await this.generatePadmeReference(contractData.idUser, creditType) : '');

    
    if(primeData.error) {
      throw new Error(primeData.message);
    }
    contractData.pd = primeData.pd;
    contractData.pc = primeData.pc;
    contractData.acc = primeData.acc;
    contractData.surp = primeData.surp;
    contractData.fm = primeData.fm;
    contractData.puttc = primeData.puttc;

    // Calculer dateEch1 si pas fourni (date d'effet + 1 mois)
    if (!contractData.dateEch1 && contractData.dateEff) {
      const dateEff = new Date(contractData.dateEff);
      const dateEch1 = new Date(dateEff);
      dateEch1.setMonth(dateEff.getMonth() + 1);
      contractData.dateEch1 = dateEch1;
    }
    
    if (creditType === 'AMORT') {
      if (!contractData.dateEch) {
        contractData.dateEch = await this.calculerDateEch(contractData.dateEch1 || new Date(), contractData.duration || 0);
      }
    } else if (creditType !== 'CP') {
      contractData.dateEch = await this.calculerDateEch(contractData.dateEch1 || new Date(), contractData.duration || 0);
    }

    if (creditType === 'CP') {
      contractData.duration = 12;
      const baseDate = contractData.dateEff ? new Date(contractData.dateEff) : new Date();
      const activeDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;
      activeDate.setHours(0, 0, 0, 0);
      
      const dateEchVal = new Date(activeDate);
      dateEchVal.setFullYear(dateEchVal.getFullYear() + 1);
      dateEchVal.setDate(dateEchVal.getDate() - 1);
      dateEchVal.setHours(0, 0, 0, 0);

      contractData.dateEff = activeDate;
      contractData.dateEch1 = dateEchVal;
      contractData.dateEch = dateEchVal;
    }
    
    // Traitement du taux (conversion en nombre si nécessaire)
    if (contractData.taux) {
      if (typeof contractData.taux === 'string') {
        contractData.taux = parseFloat((contractData.taux as string).replace('%', ''));
      }
      console.log(`📊 Taux traité: ${contractData.taux}%`);
    }

    // Fixer garantieCompl à 'NON' par défaut si non fourni
    if (!contractData.garantieCompl) {
      contractData.garantieCompl = 'NON';
    }

    // Gestion du client (recherche ou création)
    if (contractData.clientData) {
      
      if (contractData.clientData.idCustomer) {
        contractData.idCustomer = contractData.clientData.idCustomer;
        console.log('🔍 Client existant trouvé avec ID:', contractData.clientData.idCustomer);
      }
      else {
        let clientByPersonalInfo: Customer | null = null;
        // Recherche par infos personnelles seulement si toutes les infos sont fournies
        if (contractData.clientData.lastname && contractData.clientData.firstname && contractData.clientData.birthdate) {
          clientByPersonalInfo = await this.customerService.findByPersonalInfo(
            contractData.clientData.lastname.trim(), 
            contractData.clientData.firstname.trim(), 
            contractData.clientData.birthdate.trim()
          );
          console.log('🔍 clientByPersonalInfo:', clientByPersonalInfo);
        }

        const existingClient = clientByPersonalInfo;

        if (!existingClient) {
          console.log('🔍 Création nouveau client...');
          // Ajouter l'idUser aux données du client
          const clientDataWithUser = {
            ...contractData.clientData,
            idUser: userId
          };
          const newClient = await this.customerService.create(clientDataWithUser);
          contractData.idCustomer = newClient.id;
          console.log('🔍 Nouveau client créé avec ID:', newClient.id);
        } else {
          contractData.idCustomer = existingClient.id;
          console.log('🔍 Client existant trouvé avec ID:', existingClient.id);
        }
      }
    }

    // Vérifier la limite de contrats par nature et par période pour le client
    await this.checkContractLimits(contractData, contractData.dateEff);

    // Générer la keyCont après avoir l'ID du client
    contractData.keyCont = contractData.keyCont || await this.generateKeyCont(contractData.idCustomer || 0, typeCredit, contractData.capital!, contractData.duration!);

    // Vérifier l'unicité de la clé de contrat
    const existingKeyCont = await this.findByKeyCont(contractData.keyCont || '');
    if (existingKeyCont.length > 0) {
      throw new Error(`Ce client a déjà fait un contrat aujourd'hui avec ces caractéristiques. Veuillez le rechercher par la police ${existingKeyCont[0].police} ou la référence ${existingKeyCont[0].reference}`);
    }

    // Vérifier l'unicité de la référence
    const existingContractReference = await this.findByReference(contractData.reference || '');
    if (existingContractReference.length > 0) {
      throw new Error(`Cette reference est déjà utilisée pour un autre contrat. Veuillez le rechercher par la police ${existingContractReference[0].police} ou la référence ${existingContractReference[0].reference}`);
    }
  }

  // Fonction de validation et traitement des données de contrat (extrait de createHorsConvention)
  private async validateAndProcessContractDataHorsConvention(contractData: Partial<Contract> & { clientData?: any }, userId?: number): Promise<void> {
    const creditType = this.getCreditType(contractData);
    if (creditType === 'CP') {
      contractData.duration = 12;
      const activeDate = new Date();
      activeDate.setDate(activeDate.getDate() + 1);
      activeDate.setHours(0, 0, 0, 0);

      const dateEchVal = new Date(activeDate);
      dateEchVal.setFullYear(dateEchVal.getFullYear() + 1);
      dateEchVal.setDate(dateEchVal.getDate() - 1);
      dateEchVal.setHours(0, 0, 0, 0);

      contractData.dateEff = activeDate;
      contractData.dateEch1 = dateEchVal;
      contractData.dateEch = dateEchVal;
      contractData.idPeriodicite = 12;
      contractData.differe = 0;
    }

    // Fixer garantieCompl à 'NON' par défaut si non fourni
    if (!contractData.garantieCompl) {
      contractData.garantieCompl = 'NON';
    }

    // Vérifier la limite de contrats par nature et par période pour le client
    await this.checkContractLimits(contractData, contractData.dateEff);

    // Générer la keyCont après avoir l'ID du client
    const typeCredit = contractData.idNatureCredit === 1 ? 'A' : 'HC';
    contractData.keyCont = contractData.keyCont || await this.generateKeyCont(contractData.idCustomer || 0, typeCredit, contractData.capital!, contractData.duration!);
    
    // Utiliser les méthodes PADME pour la génération des identifiants
    contractData.police = contractData.police || await this.generatePadmePolice(contractData.idAgency || 0);
    contractData.reference = contractData.reference || (contractData.idUser ? await this.generatePadmeReference(contractData.idUser, creditType) : '');

    // Vérifier l'unicité de la clé de contrat
    const existingKeyCont = await this.findByKeyCont(contractData.keyCont || '');
    if (existingKeyCont.length > 0) {
      throw new Error(`Ce client a déjà fait un contrat aujourd'hui avec ces caractéristiques. Veuillez le rechercher par la police ${existingKeyCont[0].police} ou la référence ${existingKeyCont[0].reference}`);
    }

    // Vérifier l'unicité de la référence
    const existingContractReference = await this.findByReference(contractData.reference || '');
    if (existingContractReference.length > 0) {
      throw new Error(`Cette reference est déjà utilisée pour un autre contrat. Veuillez le rechercher par la police ${existingContractReference[0].police} ou la référence ${existingContractReference[0].reference}`);
    }
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
        'natureCredit',
        'periodicite',
        'beneficiaries',
        'insuredMembers'
      ]
    });
  }

  async importContractsFromExcel(
    file: any,
    currentUser: { id: number; idAgency: number }
  ): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
    const rows = await this.excelService.parseContractsImport(file.path);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const natureCredits = await this.natureCreditRepository.find();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        if (!row.nomClient) throw new Error(`Le nom du client est obligatoire.`);
        if (!row.prenomClient) throw new Error(`Le prénom du client est obligatoire.`);
        if (!row.dateNaissanceClient) throw new Error(`La date de naissance du client est obligatoire.`);
        if (!row.genreClient) throw new Error(`Le genre du client est obligatoire (M/F).`);
        if (!row.telephoneClient) throw new Error(`Le téléphone du client est obligatoire.`);
        if (!row.police) throw new Error(`Le numéro de police est obligatoire.`);
        if (!row.reference) throw new Error(`La référence du dossier est obligatoire.`);
        if (!row.dateEffet) throw new Error(`La date d'effet est obligatoire.`);
        if (!row.dureeMois) throw new Error(`La durée est obligatoire.`);
        if (!row.natureCredit) throw new Error(`La nature de crédit est obligatoire.`);
        if (!row.capital) throw new Error(`Le capital garanti est obligatoire.`);

        const nat = natureCredits.find(
          n => n.code.toUpperCase() === row.natureCredit.toUpperCase() ||
               n.libelle.toUpperCase() === row.natureCredit.toUpperCase()
        );
        if (!nat) {
          throw new Error(`La nature de crédit '${row.natureCredit}' n'est pas valide.`);
        }

        const creditType = nat.code;
        const isCP = creditType === 'CP';
        const isOBA = creditType === 'OBA';
        const isCPorOBA = isCP || isOBA;

        const existingPolice = await this.contractRepository.findOne({ where: { police: row.police } });
        if (existingPolice) {
          throw new Error(`La police '${row.police}' existe déjà en base.`);
        }

        const existingRef = await this.contractRepository.findOne({ where: { reference: row.reference } });
        if (existingRef) {
          throw new Error(`La référence '${row.reference}' existe déjà en base.`);
        }

        const parsedBirthdateObj = this.isDateString(row.dateNaissanceClient);
        const parsedBirthdate = parsedBirthdateObj.isDate && parsedBirthdateObj.dateValue
          ? parsedBirthdateObj.dateValue.toISOString().split('T')[0]
          : new Date(row.dateNaissanceClient).toISOString().split('T')[0];

        if (!parsedBirthdate || isNaN(new Date(parsedBirthdate).getTime())) {
          throw new Error(`Date de naissance du client invalide: ${row.dateNaissanceClient}`);
        }

        let customer = await this.customerService.findByPersonalInfo(
          row.nomClient.trim(),
          row.prenomClient.trim(),
          parsedBirthdate
        );

        if (!customer) {
          customer = await this.customerService.create({
            lastname: row.nomClient.toUpperCase().trim(),
            firstname: row.prenomClient.trim(),
            birthdate: parsedBirthdate,
            gender: row.genreClient.toUpperCase().trim() === 'F' ? 'F' : 'M',
            occupation: row.professionClient || '',
            phone: row.telephoneClient,
            email: row.emailClient || '',
            address: row.adresseClient || '',
            idUser: currentUser.id,
            idTypeCustomer: 1
          });
        }

        let obaOptions: any = null;
        if (isOBA) {
          obaOptions = {};
          const parseObaMember = (prefix: string, role: string, roleLabel: string, rowData: any) => {
            const checkedVal = rowData[`${prefix}Checked`]?.toUpperCase().trim();
            const checked = checkedVal === 'OUI' || checkedVal === 'YES';
            if (!checked) return;

            const nom = (rowData[`${prefix}Nom`] || '').toUpperCase().trim();
            const prenom = (rowData[`${prefix}Prenom`] || '').trim();
            if (!nom || !prenom) return;

            const birth = rowData[`${prefix}DateNaissance`]?.trim();
            const parsedBirthObj = birth ? this.isDateString(birth) : null;
            const parsedBirth = parsedBirthObj && parsedBirthObj.isDate && parsedBirthObj.dateValue
              ? parsedBirthObj.dateValue.toISOString().split('T')[0]
              : birth ? new Date(birth).toISOString().split('T')[0] : null;

            obaOptions[role] = {
              checked: true,
              lastname: nom,
              firstname: prenom,
              birthdate: parsedBirth,
              gender: role === 'conjoint' ? (rowData[`${prefix}Genre`]?.toUpperCase().trim() === 'F' ? 'F' : 'M') : (roleLabel.includes('Père') ? 'M' : 'F'),
              capitalAssure: Number(rowData[`${prefix}Capital`]) || 0
            };
          };

          parseObaMember('conjoint', 'conjoint', 'Conjoint(e)', row);
          parseObaMember('pereAssure', 'ascendant1', 'Père de l\'Assuré', row);
          parseObaMember('mereAssure', 'ascendant2', 'Mère de l\'Assuré', row);
          parseObaMember('pereConjoint', 'ascendant3', 'Père du (de la) Conjoint(e)', row);
          parseObaMember('mereConjoint', 'ascendant4', 'Mère du (de la) Conjoint(e)', row);
        }

        const parsedDateEffObj = this.isDateString(row.dateEffet);
        const parsedDateEff = parsedDateEffObj.isDate && parsedDateEffObj.dateValue
          ? parsedDateEffObj.dateValue.toISOString().split('T')[0]
          : new Date(row.dateEffet).toISOString().split('T')[0];

        if (!parsedDateEff || isNaN(new Date(parsedDateEff).getTime())) {
          throw new Error(`Date d'effet invalide: ${row.dateEffet}`);
        }

        const idPeriodicite = 12; // Enforce ANNUELLE
        const differe = 0;

        const primeData = await this.quotationService.primePADME(
          row.capital,
          customer.birthdate,
          row.dureeMois,
          idPeriodicite,
          parsedDateEff,
          differe,
          creditType,
          obaOptions
        );

        if (primeData.error) {
          throw new Error(`Calcul prime échoué: ${primeData.message}`);
        }

        if (isOBA && primeData.obaOptions) {
          for (const role of Object.keys(obaOptions)) {
            if (primeData.obaOptions[role]) {
              obaOptions[role].prime = primeData.obaOptions[role].prime;
            }
          }
        }

        let dateEch1: Date;
        let dateEch: Date;

        if (isCP) {
          const dateEffObj = new Date(parsedDateEff);
          const dateEchVal = new Date(dateEffObj);
          dateEchVal.setFullYear(dateEchVal.getFullYear() + 1);
          dateEchVal.setDate(dateEchVal.getDate() - 2);

          dateEch1 = dateEchVal;
          dateEch = dateEchVal;
        } else {
          const dateEffObj = new Date(parsedDateEff);
          dateEch1 = new Date(dateEffObj);
          dateEch1.setMonth(dateEffObj.getMonth() + 1);
          dateEch = new Date(dateEch1);
          dateEch.setMonth(dateEch.getMonth() + (row.dureeMois - 1));
        }

        const todayStr = new Date().toLocaleDateString('fr-FR');
        const keyCont = `IMPORT_CUST${customer.id}_BE${row.capital}_DUR${row.dureeMois}_LE${todayStr}_${row.police}`;

        const compteBancaire = isCP ? (row.compteBancaire || 'PARRAIN') : (row.compteBancaire || '');
        const numeroCompte = isCP ? (row.numeroCompte || 'N/A') : (row.numeroCompte || '');
        const renouvellementAuto = isCP ? true : undefined;

        const contract = this.contractRepository.create({
          idCustomer: customer.id,
          idUser: currentUser.id,
          idAgency: currentUser.idAgency,
          idProduct: 1,
          idContractState: 1, // Brouillon (allows attaching medical questionnaire)
          idNatureCredit: nat.id,
          idPeriodicite: idPeriodicite,
          capital: isOBA && primeData.capital ? primeData.capital : row.capital,
          duration: row.dureeMois,
          differe: differe,
          taux: 0,
          dateEff: new Date(parsedDateEff),
          dateEch1: dateEch1,
          dateEch: dateEch,
          pd: primeData.pd || 0,
          pc: primeData.pc || 0,
          acc: primeData.acc || 0,
          surp: primeData.surp || 0,
          fm: primeData.fm || 0,
          puttc: primeData.puttc || 0,
          police: row.police,
          reference: row.reference,
          garantieCompl: 'NON',
          obaOptions: obaOptions,
          etablissement: row.etablissement || '',
          compteBancaire: compteBancaire,
          numeroCompte: numeroCompte,
          renouvellementAuto: renouvellementAuto,
          keyCont: keyCont,
          contractType: 'PADME'
        });

        const savedContract = await this.contractRepository.save(contract) as Contract;

        if (isCP) {
          const defaultBeneficiaries = [
            {
              nomPrenoms: `${customer.lastname} ${customer.firstname}`,
              lienParente: 'AUTRE',
              pourcentage: 100
            }
          ];
          await this.saveCPBeneficiaries(savedContract.id, defaultBeneficiaries);
        }

        if (isOBA && obaOptions) {
          await this.saveOBAInsuredMembers(savedContract.id, obaOptions);
        }

        await this.createHistoryRecord(
          savedContract,
          null,
          contract,
          ContractHistoryAction.CREATE
        );

        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Ligne ${rowNum} (${row.nomClient || 'Sans nom'} - Police ${row.police || 'Sans police'}) : ${err.message}`);
      }
    }

    return { successCount, errorCount, errors };
  }

  async updateBeneficiary(id: number, data: { nomPrenoms?: string; lienParente?: string; pourcentage?: number }): Promise<Beneficiary> {
    const beneficiary = await this.beneficiaryRepository.findOne({ where: { id } });
    if (!beneficiary) {
      throw new NotFoundException(`Bénéficiaire introuvable`);
    }
    if (data.nomPrenoms !== undefined) beneficiary.nomPrenoms = data.nomPrenoms;
    if (data.lienParente !== undefined) beneficiary.lienParente = data.lienParente;
    if (data.pourcentage !== undefined) {
      const newPct = Number(data.pourcentage);
      if (newPct <= 0 || newPct > 100) {
        throw new BadRequestException('Le pourcentage doit être compris entre 1% et 100%.');
      }
      const otherBenefs = await this.beneficiaryRepository.find({ where: { idContract: beneficiary.idContract } });
      const otherTotal = otherBenefs.filter(b => b.id !== id).reduce((sum, b) => sum + Number(b.pourcentage || 0), 0);
      if (otherTotal + newPct > 100) {
        throw new BadRequestException(`Impossible d'enregistrer ${newPct}% : le total des bénéficiaires dépasserait 100% (Parts des autres bénéficiaires : ${otherTotal}%, Maximum autorisé : ${100 - otherTotal}%).`);
      }
      beneficiary.pourcentage = newPct;
    }
    return this.beneficiaryRepository.save(beneficiary);
  }

  async deleteBeneficiary(id: number): Promise<void> {
    const beneficiary = await this.beneficiaryRepository.findOne({ where: { id } });
    if (!beneficiary) {
      throw new NotFoundException(`Bénéficiaire introuvable`);
    }
    const count = await this.beneficiaryRepository.count({ where: { idContract: beneficiary.idContract } });
    if (count <= 1) {
      throw new BadRequestException('Impossible de supprimer : au moins un bénéficiaire est obligatoire sur ce contrat.');
    }
    await this.beneficiaryRepository.delete(id);
  }

  async updateInsuredMember(
    id: number,
    data: { lastname?: string; firstname?: string; birthdate?: string; gender?: string }
  ): Promise<ContractInsuredMember> {
    const member = await this.insuredMemberRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Membre assuré introuvable`);
    }

    const contract = await this.contractRepository.findOne({
      where: { id: member.idContract },
      relations: ['customer']
    });
    if (!contract) {
      throw new NotFoundException(`Contrat associé introuvable`);
    }

    // Mettre à jour l'entité membre
    if (data.lastname !== undefined) member.lastname = data.lastname.toUpperCase().trim();
    if (data.firstname !== undefined) member.firstname = data.firstname.trim();
    if (data.birthdate !== undefined) member.birthdate = data.birthdate;
    if (data.gender !== undefined) member.gender = data.gender;

    // Mettre à jour l'option correspondante dans obaOptions
    const obaOptions = contract.obaOptions || {};
    if (obaOptions[member.role]) {
      obaOptions[member.role] = {
        ...obaOptions[member.role],
        lastname: member.lastname,
        firstname: member.firstname,
        birthdate: member.birthdate,
        gender: member.gender
      };
    }

    // Recalculer les primes pour validation de l'âge/configuration
    const primeData = await this.quotationService.primeObsequesAlafia(
      contract.capital,
      contract.customer.birthdate,
      contract.duration,
      obaOptions
    );

    if (primeData.error) {
      throw new BadRequestException(primeData.message);
    }

    // Mettre à jour les primes et capitaux du contrat si besoin
    contract.obaOptions = obaOptions;
    contract.pd = primeData.pd ?? contract.pd;
    contract.puttc = primeData.puttc ?? contract.puttc;
    contract.capital = primeData.capital ?? contract.capital;

    await this.contractRepository.save(contract);

    // Mettre à jour la prime et capitalAssure du membre
    if (primeData.obaOptions && primeData.obaOptions[member.role]) {
      member.prime = Number(primeData.obaOptions[member.role].prime) || member.prime;
    }

    return this.insuredMemberRepository.save(member);
  }

  async deleteInsuredMember(id: number): Promise<void> {
    const member = await this.insuredMemberRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Membre assuré introuvable`);
    }

    const contract = await this.contractRepository.findOne({
      where: { id: member.idContract },
      relations: ['customer']
    });
    if (!contract) {
      throw new NotFoundException(`Contrat associé introuvable`);
    }

    // Supprimer le membre de la table
    await this.insuredMemberRepository.delete(id);

    // Mettre à jour obaOptions en désactivant ce rôle
    const obaOptions = contract.obaOptions || {};
    if (obaOptions[member.role]) {
      obaOptions[member.role].checked = false;
    }

    // Recalculer les primes pour le contrat
    const primeData = await this.quotationService.primeObsequesAlafia(
      contract.capital,
      contract.customer.birthdate,
      contract.duration,
      obaOptions
    );

    // Mettre à jour le contrat
    contract.obaOptions = obaOptions;
    if (!primeData.error) {
      contract.pd = primeData.pd ?? contract.pd;
      contract.puttc = primeData.puttc ?? contract.puttc;
      contract.capital = primeData.capital ?? contract.capital;
    } else {
      const activeOptions = Object.values(obaOptions).filter((o: any) => o && o.checked);
      if (activeOptions.length === 0) {
        contract.pd = 0;
        contract.puttc = 0;
        contract.capital = 0;
      } else {
        throw new BadRequestException(primeData.message);
      }
    }

    await this.contractRepository.save(contract);
  }

  async addBeneficiary(contractIdentifier: string | number, data: { nomPrenoms: string; lienParente: string; pourcentage: number }): Promise<Beneficiary> {
    const contract = await this.findOne(contractIdentifier);
    if (!contract) {
      throw new NotFoundException(`Contrat introuvable`);
    }
    const contractId = contract.id;
    const newPct = Number(data.pourcentage);
    if (newPct <= 0 || newPct > 100) {
      throw new BadRequestException('Le pourcentage doit être compris entre 1% et 100%.');
    }
    const currentBenefs = await this.beneficiaryRepository.find({ where: { idContract: contractId } });
    const currentTotal = currentBenefs.reduce((sum, b) => sum + Number(b.pourcentage || 0), 0);
    if (currentTotal + newPct > 100) {
      const remaining = Math.max(0, 100 - currentTotal);
      throw new BadRequestException(`Impossible d'ajouter ${newPct}% : le total des bénéficiaires dépasserait 100% (Total actuel : ${currentTotal}%, Part restante disponible : ${remaining}%).`);
    }

    const beneficiary = new Beneficiary();
    beneficiary.idContract = contractId;
    beneficiary.nomPrenoms = data.nomPrenoms;
    beneficiary.lienParente = data.lienParente;
    beneficiary.pourcentage = newPct;
    return this.beneficiaryRepository.save(beneficiary);
  }

  async saveAllBeneficiaries(contractIdentifier: string | number, beneficiaries: any[]): Promise<Beneficiary[]> {
    const contract = await this.findOne(contractIdentifier);
    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }
    const contractId = contract.id;
    if (!beneficiaries || !Array.isArray(beneficiaries) || beneficiaries.length === 0) {
      throw new BadRequestException('Au moins un bénéficiaire est obligatoire.');
    }

    let total = 0;
    for (const b of beneficiaries) {
      if (!b.nomPrenoms || !b.nomPrenoms.trim()) {
        throw new BadRequestException('Le nom et prénoms de chaque bénéficiaire est obligatoire.');
      }
      if (!b.lienParente || !b.lienParente.trim()) {
        throw new BadRequestException(`Le lien de parenté est obligatoire pour ${b.nomPrenoms}.`);
      }
      const p = Number(b.pourcentage);
      if (isNaN(p) || p <= 0) {
        throw new BadRequestException(`Le pourcentage pour ${b.nomPrenoms} doit être supérieur à 0%.`);
      }
      total += p;
    }

    if (Math.round(total * 100) / 100 !== 100) {
      throw new BadRequestException(`La somme des pourcentages doit être exactement égale à 100% (Somme actuelle : ${total}%).`);
    }

    await this.beneficiaryRepository.delete({ idContract: contractId });
    const records = beneficiaries.map(b => {
      const record = new Beneficiary();
      record.idContract = contractId;
      record.nomPrenoms = b.nomPrenoms.trim().toUpperCase();
      record.lienParente = b.lienParente.trim();
      record.pourcentage = Number(b.pourcentage);
      return record;
    });

    return this.beneficiaryRepository.save(records);
  }
}
