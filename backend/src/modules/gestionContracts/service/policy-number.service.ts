import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entity/contract.entity';

/**
 * Service dédié à la génération des identifiants métier (police / référence)
 * Logique PADME:
 *  Police  : BE{agencyId}P{sequenceNumber}
 *    Exemples: BE1P1, BE1P2, BE1P156...
 *  Référence PADME : PA{5 caractères aléatoires}{creditType}
 *    Exemples: PA9K2X7AMORT, PA3M8L2CP...
 *  Standard (hors PADME) : {typeCredit}AG{agencyId}P{nextId}
 *  Référence Standard    : SC{nextId}U{userId}T{typeCredit}
 *
 * nextId est déterminé par l'auto-incrément actuel (dernier id + 1).
 */
@Injectable()
export class PolicyNumberService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  /** Récupère le prochain id logique (last id + 1 ou 1 si aucun contrat) */
  private async getNextId(): Promise<number> {
    const last = await this.contractRepository.findOne({ 
      where: {}, 
      order: { id: 'DESC' },
      withDeleted: true 
    });
    return last ? last.id + 1 : 1;
  }

  /** Génère 5 caractères aléatoires alphanumériques (lettres majuscules + chiffres) */
  private generateRandomCode(length: number = 5): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /** Compte les contrats pour une agence donnée pour la séquence police en trouvant le dernier numéro de séquence */
  private async getAgencySequence(idAgency: number): Promise<number> {
    const prefix = `BE${idAgency}P`;
    const lastContract = await this.contractRepository
      .createQueryBuilder('contract')
      .withDeleted()
      .where('contract.idAgency = :idAgency', { idAgency })
      .andWhere('contract.police LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('contract.id', 'DESC')
      .getOne();

    if (lastContract && lastContract.police) {
      const match = lastContract.police.match(/P(\d+)$/);
      if (match) {
        const lastNum = parseInt(match[1], 10);
        if (!isNaN(lastNum)) {
          return lastNum + 1;
        }
      }
    }

    const count = await this.contractRepository.count({
      where: { idAgency },
      withDeleted: true
    });
    return count + 1;
  }

  /** Génération police standard (hors PADME) avec garantie d'unicité */
  async generateStandardPolice(idAgency: number, typeCredit: string = 'A'): Promise<string> {
    let nextId = await this.getNextId();
    let police = `${typeCredit}AG${idAgency}P${nextId}`;

    while (await this.contractRepository.findOne({ where: { police }, withDeleted: true })) {
      nextId++;
      police = `${typeCredit}AG${idAgency}P${nextId}`;
    }

    return police;
  }

  /** Génération police PADME - Format: BE{agencyId}P{sequenceNumber} avec garantie d'unicité */
  async generatePadmePolice(idAgency: number): Promise<string> {
    let sequence = await this.getAgencySequence(idAgency);
    let police = `BE${idAgency}P${sequence}`;

    while (await this.contractRepository.findOne({ where: { police }, withDeleted: true })) {
      sequence++;
      police = `BE${idAgency}P${sequence}`;
    }

    return police;
  }

  /** Génération référence standard avec garantie d'unicité */
  async generateStandardReference(idUser: number, typeCredit: string = 'A'): Promise<string> {
    let nextId = await this.getNextId();
    let reference = `SC${nextId}U${idUser}T${typeCredit}`;

    while (await this.contractRepository.findOne({ where: { reference }, withDeleted: true })) {
      nextId++;
      reference = `SC${nextId}U${idUser}T${typeCredit}`;
    }

    return reference;
  }

  /** Génération référence PADME - Format: PA{5 caractères aléatoires}{creditType} avec garantie d'unicité */
  async generatePadmeReference(idUser: number, creditType: string = 'AMORT'): Promise<string> {
    let reference: string = '';
    let exists = true;
    let attempts = 0;

    // Générer une référence unique (éviter les doublons aléatoires)
    while (exists && attempts < 100) {
      attempts++;
      const randomCode = this.generateRandomCode(5);
      reference = `PA${randomCode}${creditType}`;

      // Vérifier si cette référence existe déjà
      const existing = await this.contractRepository.findOne({
        where: { reference },
        withDeleted: true
      });
      exists = !!existing;
    }

    if (exists) {
      // Fallback au cas où 100 tentatives échouent (statistiquement impossible)
      reference = `PA${Date.now().toString(36).toUpperCase()}${creditType}`;
    }

    return reference;
  }

  /** Helper pour clé de contrat (keyCont) avec suffixe unique */
  async generateKeyCont(idCustomer: number, typeCredit: string, capital: number, duration: number, date: Date = new Date()): Promise<string> {
    const uniqueSuffix = Math.random().toString(36).substring(2, 6);
    const keyCont = `CUST${idCustomer}T${typeCredit}C${capital}D${duration}_${uniqueSuffix}`;
    return keyCont.slice(0, 50);
  }
}

