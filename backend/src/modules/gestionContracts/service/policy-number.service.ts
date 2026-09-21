import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entity/contract.entity';

/**
 * Service dédié à la génération des identifiants métier (police / référence)
 *  Police    : {typeCredit}AG{agencyId}P{nextId}
 *  Référence : SC{nextId}U{userId}T{typeCredit}
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

  /** Génération police standard avec garantie d'unicité */
  async generateStandardPolice(idAgency: number, typeCredit: string = 'A'): Promise<string> {
    let nextId = await this.getNextId();
    let police = `${typeCredit}AG${idAgency}P${nextId}`;

    while (await this.contractRepository.findOne({ where: { police }, withDeleted: true })) {
      nextId++;
      police = `${typeCredit}AG${idAgency}P${nextId}`;
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

  /** Helper pour clé de contrat (keyCont) avec suffixe unique */
  async generateKeyCont(idCustomer: number, typeCredit: string, capital: number, duration: number, date: Date = new Date()): Promise<string> {
    const uniqueSuffix = Math.random().toString(36).substring(2, 6);
    const keyCont = `CUST${idCustomer}T${typeCredit}C${capital}D${duration}_${uniqueSuffix}`;
    return keyCont.slice(0, 50);
  }
}

