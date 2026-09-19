import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entity/contract.entity';
import { Customer } from '../entity/customer.entity';
import { Agency } from '../entity/agency.entity';
import { Cotation } from '../entity/cotation.entity';
import { User } from 'src/modules/gestionUsers/entity/user.entity';

@Injectable()
export class UuidInitializerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UuidInitializerService.name);

  constructor(
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Agency)
    private readonly agencyRepo: Repository<Agency>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Cotation)
    private readonly cotationRepo: Repository<Cotation>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('🔍 Vérification et initialisation des UUIDs manquants...');

    try {
      await this.backfillTable('Contract', this.contractRepo);
      await this.backfillTable('Customer', this.customerRepo);
      await this.backfillTable('Agency', this.agencyRepo);
      await this.backfillTable('User', this.userRepo);
      await this.backfillTable('Cotation', this.cotationRepo);
      this.logger.log('✅ Initialisation des UUIDs terminée avec succès.');
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'initialisation des UUIDs:', error);
    }
  }

  private async backfillTable<T extends { id: number; uuid?: string }>(
    entityName: string,
    repo: Repository<T>,
  ) {
    const tableName = repo.metadata.tableName;
    const result = await repo.query(
      `UPDATE \`${tableName}\` SET \`uuid\` = UUID() WHERE \`uuid\` IS NULL OR \`uuid\` = ''`,
    );
    if (result && result.affectedRows > 0) {
      this.logger.log(`✨ ${result.affectedRows} UUID(s) mis à jour pour la table ${entityName}.`);
    }
  }
}
