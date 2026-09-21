import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import { CustomerHistory, HistoryAction } from '../entity/customer-history.entity';
import { Contract } from '../entity/contract.entity';
import { Cotation } from '../entity/cotation.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerHistory)
    private historyRepository: Repository<CustomerHistory>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.typeCustomer', 'typeCustomer')
      .leftJoinAndSelect('customer.user', 'user');

    if (search && search.trim() !== '') {
      const searchLower = `%${search.trim().toLowerCase()}%`;
      queryBuilder.where(
        '(LOWER(customer.lastname) LIKE :search OR LOWER(customer.firstname) LIKE :search OR LOWER(customer.phone) LIKE :search OR LOWER(customer.email) LIKE :search OR LOWER(customer.numCustomer) LIKE :search)',
        { search: searchLower }
      );
    }

    // Compter le total avant la pagination
    const total = await queryBuilder.getCount();

    // Appliquer la pagination seulement si limit > 0
    if (limit > 0) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    // Ordonner par nom
    queryBuilder.orderBy('customer.lastname', 'ASC');

    // Récupérer les clients
    const customers = await queryBuilder.getMany();

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return {
      customers,
      total,
      page,
      limit,
      totalPages
    };
  }

  async findOne(identifier: string | number): Promise<Customer | null> {
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

    return this.customerRepository.findOne({ 
      where,
      relations: ['typeCustomer', 'user']
    });
  }

  async findCustomerDetails(identifier: string | number): Promise<{
    customer: Customer;
    contracts: Contract[];
    cotations: Cotation[];
    stats: {
      totalContracts: number;
      activeContracts: number;
      totalCapital: number;
      totalPuttc: number;
      constCount: number;
      amortCount: number;
    };
  } | null> {
    const customer = await this.findOne(identifier);
    if (!customer) {
      return null;
    }

    const manager = this.customerRepository.manager;

    // 1. Récupérer les contrats du client
    const contracts = await manager.createQueryBuilder(Contract, 'contract')
      .leftJoinAndSelect('contract.natureCredit', 'natureCredit')
      .leftJoinAndSelect('contract.periodicite', 'periodicite')
      .leftJoinAndSelect('contract.contractState', 'contractState')
      .leftJoinAndSelect('contract.agency', 'agency')
      .leftJoinAndSelect('contract.user', 'user')
      .where('contract.idCustomer = :idCustomer', { idCustomer: customer.id })
      .orderBy('contract.id', 'DESC')
      .getMany();

    // 2. Récupérer les cotations du client (par idCustomer ou par nom/prénom)
    const cotationsQuery = manager.createQueryBuilder(Cotation, 'cotation')
      .leftJoinAndSelect('cotation.natureCredit', 'natureCredit')
      .leftJoinAndSelect('cotation.typeCustomer', 'typeCustomer')
      .leftJoinAndSelect('cotation.periodicite', 'periodicite')
      .leftJoinAndSelect('cotation.agency', 'agency')
      .leftJoinAndSelect('cotation.user', 'user')
      .where('cotation.idCustomer = :idCustomer', { idCustomer: customer.id });

    if (customer.lastname && customer.firstname) {
      cotationsQuery.orWhere(
        '(LOWER(cotation.lastname) = :lastname AND LOWER(cotation.firstname) = :firstname)',
        { 
          lastname: customer.lastname.toLowerCase().trim(), 
          firstname: customer.firstname.toLowerCase().trim() 
        }
      );
    }

    const cotations = await cotationsQuery
      .orderBy('cotation.id', 'DESC')
      .getMany();

    // 3. Calculer les statistiques
    const isContractActive = (c: any) => {
      const stateId = Number(c.idContractState || c.contractState?.id || 1);
      return c.isActive !== false && stateId !== 3 && stateId !== 4;
    };

    const activeContractsList = contracts.filter(isContractActive);

    const totalContracts = contracts.length;
    const activeContracts = activeContractsList.length;
    const totalCapital = activeContractsList.reduce((sum, c) => sum + (Number(c.capital) || 0), 0);
    const totalPuttc = activeContractsList.reduce((sum, c) => sum + (Number(c.puttc) || 0), 0);

    const getNatureCode = (c: any) => {
      if (c.natureCredit?.code) return String(c.natureCredit.code).toUpperCase().trim();
      const nId = Number(c.idNatureCredit || 0);
      if (nId === 2) return 'CONST';
      if (nId === 1) return 'AMORT';
      return '';
    };

    const constCount = activeContractsList.filter(c => getNatureCode(c) === 'CONST').length;
    const amortCount = activeContractsList.filter(c => getNatureCode(c) === 'AMORT').length;

    return {
      customer,
      contracts,
      cotations,
      stats: {
        totalContracts,
        activeContracts,
        totalCapital,
        totalPuttc,
        constCount,
        amortCount,
      }
    };
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ 
      where: { email },
      relations: ['typeCustomer', 'user']
    });
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ 
      where: { phone },
      relations: ['typeCustomer', 'user']
    });
  }

  async findByPersonalInfo(lastname: string, firstname: string, birthdate: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ 
      where: { 
        lastname: lastname.toUpperCase(), 
        firstname: firstname.toUpperCase(), 
        birthdate 
      },
      relations: ['typeCustomer', 'user']
    });
  }

  async findByNumCustomer(numCustomer: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ 
      where: { 
        numCustomer: numCustomer.trim()
      },
      relations: ['typeCustomer', 'user']
    });
  }

  async findByType(idTypeCustomer: number): Promise<Customer[]> {
    return this.customerRepository.find({ 
      where: { idTypeCustomer },
      relations: ['typeCustomer', 'user'],
      order: { lastname: 'ASC' }
    });
  }

  async findByUser(idUser: number): Promise<Customer[]> {
    return this.customerRepository.find({ 
      where: { idUser },
      relations: ['typeCustomer', 'user'],
      order: { lastname: 'ASC' }
    });
  }

  async create(
    customerData: Partial<Customer> & { [key: string]: any },
    ipAddress?: string,
    userAgent?: string
  ): Promise<Customer> {
    const rawPlaceOfBirth = customerData.placeOfBirth || customerData.place_of_birth || customerData.birthplace || customerData.lieuNaissance;
    const rawOccupation = customerData.occupation || customerData.profession;
    const rawAddress = customerData.address;
    const rawPhone = customerData.phone;
    const rawGender = customerData.gender;

    // Mettre en majuscule tous les champs sauf email
    const normalizedData: Partial<Customer> = {
      ...customerData,
      lastname: (customerData.lastname || '').trim().toUpperCase(),
      firstname: (customerData.firstname || '').trim().toUpperCase(),
      placeOfBirth: (rawPlaceOfBirth ? rawPlaceOfBirth.toString().trim() : 'NON RENSEIGNÉ').toUpperCase(),
      occupation: (rawOccupation ? rawOccupation.toString().trim() : 'NON RENSEIGNÉ').toUpperCase(),
      address: (rawAddress ? rawAddress.toString().trim() : 'NON RENSEIGNÉE').toUpperCase(),
      phone: (rawPhone ? rawPhone.toString().trim() : 'NON RENSEIGNÉ'),
      gender: (rawGender ? rawGender.toString().trim().toUpperCase() : 'M'),
      idTypeCustomer: customerData.idTypeCustomer || 1,
      // email reste en minuscule
      email: customerData.email ? customerData.email.toString().trim().toLowerCase() : null
    };
    
    const customer = this.customerRepository.create(normalizedData);
    const savedCustomer = await this.customerRepository.save(customer);

    // Créer l'historique de création
    await this.createHistoryRecord(
      savedCustomer, 
      null, 
      customerData, 
      HistoryAction.CREATE,
      ipAddress,
      userAgent
    );

    return savedCustomer;
  }

  async update(
    id: number, 
    customerData: Partial<Customer> & { [key: string]: any },
    ipAddress?: string,
    userAgent?: string
  ): Promise<Customer | null> {
    // Récupérer l'entité existante AVANT modification
    const existingCustomer = await this.findOne(id);
    if (!existingCustomer) {
      return null;
    }

    // Sauvegarder les anciennes valeurs pour l'historique
    const oldValues = { ...existingCustomer };

    const rawPlaceOfBirth = customerData.placeOfBirth ?? customerData.place_of_birth ?? customerData.birthplace ?? customerData.lieuNaissance;
    const rawOccupation = customerData.occupation ?? customerData.profession;

    // Mettre en majuscule tous les champs sauf email
    const normalizedData: any = {
      ...customerData,
      ...(customerData.lastname !== undefined && { lastname: customerData.lastname?.toUpperCase() }),
      ...(customerData.firstname !== undefined && { firstname: customerData.firstname?.toUpperCase() }),
      ...(rawPlaceOfBirth !== undefined && { placeOfBirth: rawPlaceOfBirth?.toString().trim().toUpperCase() }),
      ...(rawOccupation !== undefined && { occupation: rawOccupation?.toString().trim().toUpperCase() }),
      ...(customerData.address !== undefined && { address: customerData.address?.toUpperCase() }),
      ...(customerData.email !== undefined && { email: customerData.email ? customerData.email.toLowerCase() : null })
    };
    
    // Vérifier s'il y a vraiment des changements avant de modifier
    const hasChanges = this.hasRealChanges(existingCustomer, normalizedData);
    
    if (!hasChanges) {
      // Aucun changement réel, retourner le client tel quel sans créer d'historique
      return existingCustomer;
    }
    
    // Appliquer les modifications
    Object.assign(existingCustomer, normalizedData);
    const updatedCustomer = await this.customerRepository.save(existingCustomer);

    // Créer l'historique seulement s'il y a eu des changements
    await this.createHistoryRecord(
      updatedCustomer, 
      oldValues, 
      normalizedData, 
      HistoryAction.UPDATE,
      ipAddress,
      userAgent
    );

    return updatedCustomer;
  }

  async remove(
    id: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Récupérer le client avant suppression pour l'historique
    const customer = await this.findOne(id);
    if (customer) {
      await this.customerRepository.delete(id);
      // Créer l'historique de suppression
      await this.createHistoryRecord(
        customer, 
        customer, 
        null, 
        HistoryAction.DELETE,
        ipAddress,
        userAgent
      );
    }
  }

  /**
   * Vérifier s'il y a vraiment des changements entre l'ancienne et la nouvelle valeur
   */
  private hasRealChanges(existingCustomer: Customer, newData: Partial<Customer>): boolean {
    const fieldsToCheck = [
      'lastname', 'firstname', 'email', 'phone', 'address',
      'birthdate', 'placeOfBirth', 'occupation', 'gender',
      'idTypeCustomer', 'numCustomer', 'isActive', 'updatedBy'
    ];

    for (const field of fieldsToCheck) {
      const oldVal = existingCustomer[field];
      const newVal = newData[field];
      
      // Si le champ n'est pas dans les nouvelles données, ignorer
      if (newVal === undefined) {
        continue;
      }
      
      // Comparer les valeurs (en tenant compte des types)
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        return true; // Il y a au moins un changement
      }
    }

    return false; // Aucun changement détecté
  }

  /**
   * Créer un enregistrement d'historique
   */
  private async createHistoryRecord(
    customer: Customer,
    oldValues: Partial<Customer> | null,
    newValues: Partial<Customer> | null,
    action: HistoryAction = HistoryAction.UPDATE,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      // Identifier les champs modifiés pour UPDATE
      const changedFields: string[] = [];
      if (action === HistoryAction.UPDATE && oldValues && newValues) {
        const fieldsToCheck = [
          'lastname', 'firstname', 'email', 'phone', 'address',
          'birthdate', 'placeOfBirth', 'occupation', 'gender',
          'idTypeCustomer', 'numCustomer', 'isActive'
        ];
        
        fieldsToCheck.forEach(field => {
          const oldVal = oldValues[field];
          const newVal = newValues[field];
          // Ne comparer que si le champ est présent dans les nouvelles données
          if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changedFields.push(field);
          }
        });
      } else if (action === HistoryAction.CREATE) {
        changedFields.push(...Object.keys(newValues || {}));
      } else if (action === HistoryAction.DELETE) {
        changedFields.push(...Object.keys(oldValues || {}));
      }

      // Ne créer l'historique que s'il y a des champs modifiés
      if (action === HistoryAction.UPDATE && changedFields.length === 0) {
        return; // Pas de changement, pas d'historique
      }

      // Préparer les valeurs à stocker (sans les relations)
      const sanitizeCustomer = (customer: Partial<Customer> | null) => {
        if (!customer) return null;
        const sanitized: any = {};
        const fieldsToCopy = [
          'id', 'idTypeCustomer', 'idUser', 'updatedBy', 'deletedBy',
          'numCustomer', 'lastname', 'firstname', 'email', 'address',
          'phone', 'placeOfBirth', 'birthdate', 'occupation', 'gender',
          'isActive', 'version'
        ];
        fieldsToCopy.forEach(field => {
          if (customer[field] !== undefined) {
            sanitized[field] = customer[field];
          }
        });
        return sanitized;
      };

      const historyData: Partial<CustomerHistory> = {
        customerId: customer.id,
        action,
        changedBy: customer.updatedBy || customer.idUser || undefined,
        oldValues: sanitizeCustomer(oldValues),
        newValues: sanitizeCustomer(newValues),
        changedFields,
        description: this.generateDescription(action, changedFields, customer),
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      };

      const history = this.historyRepository.create(historyData);
      await this.historyRepository.save(history);
    } catch (error) {
      // Logger l'erreur mais ne pas bloquer l'opération principale
      console.error('❌ Erreur lors de la création de l\'historique:', error);
    }
  }

  /**
   * Générer une description de la modification
   */
  private generateDescription(
    action: HistoryAction,
    changedFields: string[],
    customer: Customer,
  ): string {
    const customerName = `${customer.firstname} ${customer.lastname}`;

    switch (action) {
      case HistoryAction.CREATE:
        return `Client "${customerName}" créé`;
      case HistoryAction.UPDATE:
        const fieldsLabels: { [key: string]: string } = {
          firstname: 'Prénom',
          lastname: 'Nom',
          email: 'Email',
          phone: 'Téléphone',
          address: 'Adresse',
          birthdate: 'Date de naissance',
          placeOfBirth: 'Lieu de naissance',
          occupation: 'Profession',
          gender: 'Genre',
          idTypeCustomer: 'Type de client',
          numCustomer: 'Numéro de client',
        };
        const fieldsList = changedFields
          .map((field) => fieldsLabels[field] || field)
          .join(', ');
        return `Modification des champs: ${fieldsList}`;
      case HistoryAction.DELETE:
        return `Client "${customerName}" supprimé`;
      default:
        return `Action ${action} sur le client "${customerName}"`;
    }
  }
}
