import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Cotation } from '../entity/cotation.entity';
import { QuotationService } from './quotation.service';
import { NatureCredit } from '../entity/nature-credit.entity';
import { TypeCustomer } from '../entity/type-customer.entity';

@Injectable()
export class CotationService {
  constructor(
    @InjectRepository(Cotation)
    private cotationRepository: Repository<Cotation>,
    @InjectRepository(NatureCredit)
    private natureCreditRepository: Repository<NatureCredit>,
    @InjectRepository(TypeCustomer)
    private typeCustomerRepository: Repository<TypeCustomer>,
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

  private async getNextId(): Promise<number> {
    const last = await this.cotationRepository.findOne({
      where: {},
      order: { id: 'DESC' }
    });
    return last ? last.id + 1 : 1;
  }

  /**
   * Génération référence Cotation parlante
   * Format: COT{idCotation}U{idUser}C{idCustomer}{natureCode}{year2}
   * - COT : Préfixe Cotation
   * - {idCotation} : ID séquentiel de la cotation
   * - U{idUser} : ID de l'utilisateur ayant créé la cotation
   * - C{idCustomer} : ID du client (ou 0 si non encore associé)
   * - {natureCode} : A pour AMORT, C pour CONST
   * - {year2} : 2 derniers chiffres de l'année courante (ex: 26 pour 2026)
   * Exemples: COT1U1C1A26, COT15U2C8C26
   */
  async generateReference(
    typeCredit: 'AMORT' | 'CONST' | string,
    idUser: number = 0,
    idCustomer: number = 0,
    idCotation?: number
  ): Promise<string> {
    const rawType = (typeCredit || '').toUpperCase();
    const natureCode = rawType.startsWith('C') || rawType === 'CONST' || rawType === 'CONSTANT' ? 'C' : 'A';
    const year2 = new Date().getFullYear().toString().slice(-2);

    let nextId = idCotation || (await this.getNextId());
    let reference = `COT${nextId}U${idUser || 0}C${idCustomer || 0}${natureCode}${year2}`;

    while (await this.cotationRepository.findOne({ where: { reference } })) {
      nextId++;
      reference = `COT${nextId}U${idUser || 0}C${idCustomer || 0}${natureCode}${year2}`;
    }

    return reference;
  }

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
   */
  async createCotationRenaca(cotationData: any, userId: number, agencyId: number): Promise<Cotation> {
    const { capital, birthdate, duration, idNatureCredit, perteEmploi, tauxSurprime, beneficiaire } = cotationData;

    const typeCapital = await this.resolveTypeCapital(idNatureCredit);

    // Résout idTypeCustomer (clé étrangère réelle) et typeAss (libellé) à partir
    // de l'id de type de client reçu du formulaire (envoyé dans le champ typeAss).
    const requestedTypeCustomerId = Number(cotationData.typeAss) || Number(cotationData.idTypeCustomer) || 1;
    const typeCustomerEntity = await this.typeCustomerRepository.findOne({ where: { id: requestedTypeCustomerId } });
    if (!typeCustomerEntity) {
      throw new BadRequestException(`Type de client introuvable (id: ${requestedTypeCustomerId}).`);
    }

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

    const idCust = Number(cotationData.idCustomer) || 0;
    const reference = await this.generateReference(typeCapital, userId, idCust);

    const cotationDataWithPrimes: any = {
      ...cotationData,
      idTypeCustomer: typeCustomerEntity.id,
      typeAss: typeCustomerEntity.libelle,
      idUser: userId,
      idAgency: agencyId,
      reference,
      capital,
      puttc: primeData.puttc,
      pd: primeData.pd,
      pc: primeData.primePE || 0,
      acc: primeData.acc,
      surp: primeData.surp,
      fm: 0,
      garantieCompl: perteEmploi ? 'OUI' : 'NON',
      tauxSurprime: tauxSurprime || 0,
      beneficiaire: beneficiaire || null,
    };

    return this.create(cotationDataWithPrimes);
  }
}