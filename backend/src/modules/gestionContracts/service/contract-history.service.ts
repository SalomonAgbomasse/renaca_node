import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractHistory, ContractHistoryAction } from '../entity/contract-history.entity';
import { Contract } from '../entity/contract.entity';
import { PdfService } from '../../../services/pdf.service';

@Injectable()
export class ContractHistoryService {
  constructor(
    @InjectRepository(ContractHistory)
    private historyRepository: Repository<ContractHistory>,
    private pdfService: PdfService,
  ) {}

  /**
   * Créer un enregistrement d'historique
   */
  async create(historyData: Partial<ContractHistory>): Promise<ContractHistory> {
    const history = this.historyRepository.create(historyData);
    return this.historyRepository.save(history);
  }

  /**
   * Trouver l'historique d'un contrat
   */
  async findByContractId(contractId: number): Promise<ContractHistory[]> {
    return this.historyRepository.find({
      where: { contractId },
      relations: ['changedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Trouver l'historique d'un contrat avec pagination
   */
  async findByContractIdPaginated(
    contractId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: ContractHistory[]; total: number; page: number; limit: number; totalPages: number }> {
    const [data, total] = await this.historyRepository.findAndCount({
      where: { contractId },
      relations: ['changedByUser'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Trouver l'historique par type d'action
   */
  async findByAction(contractId: number, action: ContractHistoryAction): Promise<ContractHistory[]> {
    return this.historyRepository.find({
      where: { contractId, action },
      relations: ['changedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Trouver un enregistrement d'historique spécifique
   */
  async findOne(id: number): Promise<ContractHistory | null> {
    return this.historyRepository.findOne({
      where: { id },
      relations: ['contract', 'changedByUser'],
    });
  }

  /**
   * Trouver l'historique récent d'un contrat
   */
  async findRecent(contractId: number, limit: number = 10): Promise<ContractHistory[]> {
    return this.historyRepository.find({
      where: { contractId },
      relations: ['changedByUser'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Générer un PDF de l'historique des modifications
   */
  async generateHistoryPdf(contract: Contract, history: ContractHistory[]): Promise<Buffer> {
    const data = this.prepareTemplateData(contract, history);
    const refTitle = contract.reference || contract.police || ('#' + contract.id);
    return this.pdfService.generateReportPdf(
      'contract-history',
      `TRAÇABILITÉ CONTRAT ${refTitle}`,
      data
    );
  }

  /**
   * Préparer les données pour le template EJS (filtrage des colonnes DB techniques & formattage)
   */
  private prepareTemplateData(contract: Contract, history: ContractHistory[]) {
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
      capital: 'Capital Garanti',
      duration: 'Durée (mois)',
      taux: 'Taux d\'intérêt (%)',
      dateEff: 'Date d\'effet',
      dateEch: 'Date d\'échéance finale',
      dateEch1: 'Date de 1ère échéance',
      idNatureCredit: 'Nature de crédit',
      idPeriodicite: 'Périodicité',
      differe: 'Différé (mois)',
      garantieCompl: 'Garantie complémentaire',
      etablissement: 'Établissement / Société',
      reference: 'Référence du contrat',
      police: 'Numéro de Police',
      description: 'Description / Notes',
      isActive: 'Statut du contrat',
      pd: 'Prime Décès (PD)',
      pc: 'Prime Perte d\'Emploi (PC)',
      surp: 'Surprime (SURP)',
      fm: 'Frais Médicaux (FM)',
      acc: 'Accessoires (ACC)',
      puttc: 'Prime Unique TTC',
      contractType: 'Type de contrat'
    };

    const formatFieldLabel = (field: string): string | null => {
      return fieldLabelsMap[field] || null;
    };

    const formatFieldValue = (field: string, value: any): string => {
      if (value === null || value === undefined || value === '') {
        return 'Non renseigné';
      }

      if (field === 'idNatureCredit') {
        const val = Number(value);
        if (val === 1) return 'Crédit Amortissable (AMORT)';
        if (val === 2) return 'Capital Constant (CONST)';
        return `Nature #${val}`;
      }

      if (field === 'idPeriodicite') {
        const val = Number(value);
        if (val === 12) return 'Annuelle (12 mois)';
        if (val === 1) return 'Mensuelle';
        if (val === 3) return 'Trimestrielle';
        if (val === 6) return 'Semestrielle';
        return `${val} mois`;
      }

      if (field === 'garantieCompl') {
        return (value === 1 || value === '1' || value === true || String(value).toUpperCase() === 'OUI') ? 'Oui' : 'Non';
      }

      if (field === 'isActive') {
        return (value === true || value === 1 || String(value) === 'true') ? 'Actif' : 'Inactif';
      }

      if (field.includes('date') || field.includes('Date')) {
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

      if (['capital', 'puttc', 'pd', 'pc', 'surp', 'acc', 'fm'].includes(field)) {
        const num = Number(value);
        if (isNaN(num)) return String(value);
        return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
      }

      if (field === 'taux') {
        return `${value} %`;
      }

      return String(value);
    };

    const getActionLabel = (action: ContractHistoryAction): string => {
      const labels = {
        CREATE: 'Création initiale',
        UPDATE: 'Modification administrative',
        DELETE: 'Suppression',
      };
      return labels[action] || action;
    };

    const getActionColor = (action: ContractHistoryAction): string => {
      const colors = {
        CREATE: '#28a745',
        UPDATE: '#198754',
        DELETE: '#dc3545',
      };
      return colors[action] || '#6c757d';
    };

    const clientName = contract.customer
      ? `${contract.customer.lastname || ''} ${contract.customer.firstname || ''}`.trim()
      : 'Non renseigné';

    let natureCreditLabel = 'N/A';
    if (contract.natureCredit?.libelle) {
      natureCreditLabel = contract.natureCredit.code 
        ? `${contract.natureCredit.libelle} (${contract.natureCredit.code})`
        : contract.natureCredit.libelle;
    } else if (contract.idNatureCredit) {
      const val = Number(contract.idNatureCredit);
      if (val === 1) natureCreditLabel = 'AMORTISSABLE (AMORT)';
      else if (val === 2) natureCreditLabel = 'CAPITAL CONSTANT (CONST)';
      else natureCreditLabel = `Nature #${val}`;
    }

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
      contract,
      clientName,
      natureCreditLabel,
      formattedCapital: new Intl.NumberFormat('fr-FR').format(contract.capital || 0),
      generatedAt: formatDate(new Date()),
      historyItems
    };
  }
}

