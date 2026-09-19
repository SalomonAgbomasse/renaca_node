import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerHistory, HistoryAction } from '../entity/customer-history.entity';
import { Customer } from '../entity/customer.entity';
import { PdfService } from '../../../services/pdf.service';

@Injectable()
export class CustomerHistoryService {
  constructor(
    @InjectRepository(CustomerHistory)
    private historyRepository: Repository<CustomerHistory>,
    private pdfService: PdfService,
  ) {}

  /**
   * Récupérer tout l'historique d'un client
   */
  async findByCustomerId(customerId: number): Promise<CustomerHistory[]> {
    return this.historyRepository.find({
      where: { customerId },
      relations: ['changedByUser', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupérer l'historique avec pagination
   */
  async findByCustomerIdPaginated(
    customerId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    history: CustomerHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [history, total] = await this.historyRepository.findAndCount({
      where: { customerId },
      relations: ['changedByUser', 'customer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      history,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupérer l'historique par type d'action
   */
  async findByAction(
    customerId: number,
    action: HistoryAction,
  ): Promise<CustomerHistory[]> {
    return this.historyRepository.find({
      where: { customerId, action },
      relations: ['changedByUser', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupérer l'historique par utilisateur
   */
  async findByUser(changedBy: number): Promise<CustomerHistory[]> {
    return this.historyRepository.find({
      where: { changedBy },
      relations: ['changedByUser', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupérer l'historique récent (derniers N jours)
   */
  async findRecent(days: number = 30): Promise<CustomerHistory[]> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    return this.historyRepository
      .createQueryBuilder('history')
      .where('history.createdAt >= :dateLimit', { dateLimit })
      .leftJoinAndSelect('history.changedByUser', 'user')
      .leftJoinAndSelect('history.customer', 'customer')
      .orderBy('history.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Récupérer un enregistrement d'historique spécifique
   */
  async findOne(id: number): Promise<CustomerHistory | null> {
    return this.historyRepository.findOne({
      where: { id },
      relations: ['changedByUser', 'customer'],
    });
  }

  /**
   * Créer manuellement un enregistrement d'historique
   */
  async create(historyData: Partial<CustomerHistory>): Promise<CustomerHistory> {
    const history = this.historyRepository.create(historyData);
    return this.historyRepository.save(history);
  }

  /**
   * Compter le nombre de modifications pour un client
   */
  async countByCustomerId(customerId: number): Promise<number> {
    return this.historyRepository.count({
      where: { customerId, action: HistoryAction.UPDATE },
    });
  }

  /**
   * Générer un PDF de l'historique des modifications
   */
  async generateHistoryPdf(customer: Customer, history: CustomerHistory[]): Promise<Buffer> {
    const data = this.prepareTemplateData(customer, history);
    const refTitle = customer.numCustomer || ('#' + customer.id);
    return this.pdfService.generateReportPdf(
      'customer-history',
      `TRAÇABILITÉ CLIENT ${refTitle}`,
      data
    );
  }

  /**
   * Préparer les données pour le template EJS
   */
  private prepareTemplateData(customer: Customer, history: CustomerHistory[]) {
    const formatDate = (date: Date | string): string => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return String(date || '');
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const fieldLabelsMap: { [key: string]: string } = {
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
      numCustomer: 'Numéro de client / Code client',
    };

    const formatFieldLabel = (field: string): string | null => {
      return fieldLabelsMap[field] || null;
    };

    const formatFieldValue = (field: string, value: any): string => {
      if (value === null || value === undefined || value === '') {
        return 'Non renseigné';
      }

      if (field === 'gender') {
        return value === 'M' ? 'Masculin (M)' : value === 'F' ? 'Féminin (F)' : String(value);
      }

      if (field === 'idTypeCustomer') {
        const val = Number(value);
        if (val === 1) return 'Particulier';
        if (val === 2) return 'Personnel PADME';
        return `Type #${val}`;
      }

      if (field.includes('date') || field.includes('Date') || field === 'birthdate') {
        try {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('fr-FR');
          }
          return String(value);
        } catch {
          return String(value);
        }
      }

      return String(value);
    };

    const getActionLabel = (action: HistoryAction): string => {
      const labels = {
        CREATE: 'Création initiale',
        UPDATE: 'Modification client',
        DELETE: 'Suppression',
      };
      return labels[action] || action;
    };

    const getActionColor = (action: HistoryAction): string => {
      const colors = {
        CREATE: '#28a745',
        UPDATE: '#198754',
        DELETE: '#dc3545',
      };
      return colors[action] || '#6c757d';
    };

    const fullName = `${customer.lastname || ''} ${customer.firstname || ''}`.trim() || 'Client';

    const historyItems = history.map((item) => {
      const displayableFields = (item.changedFields || []).filter(field => formatFieldLabel(field) !== null);
      const displayableChanges = displayableFields.map(field => {
        const oldValRaw = item.oldValues ? item.oldValues[field] : undefined;
        const newValRaw = item.newValues ? item.newValues[field] : undefined;
        return {
          field,
          label: formatFieldLabel(field),
          hasOld: oldValRaw !== undefined,
          oldVal: oldValRaw !== undefined ? formatFieldValue(field, oldValRaw) : '-',
          hasNew: newValRaw !== undefined,
          newVal: newValRaw !== undefined ? formatFieldValue(field, newValRaw) : '-'
        };
      });

      const changedByUser = item.changedByUser 
        ? `${item.changedByUser.firstname || ''} ${item.changedByUser.lastname || ''}`.trim()
        : 'Système / Admin';

      return {
        ...item,
        actionLabel: getActionLabel(item.action),
        actionColor: getActionColor(item.action),
        createdAtFormatted: formatDate(item.createdAt),
        changedByUser,
        displayableChanges
      };
    });

    return {
      customer,
      fullName,
      genderLabel: customer.gender === 'M' ? 'Masculin' : customer.gender === 'F' ? 'Féminin' : 'N/A',
      formattedBirthdate: formatFieldValue('birthdate', customer.birthdate),
      generatedAt: formatDate(new Date()),
      historyItems
    };
  }
}

