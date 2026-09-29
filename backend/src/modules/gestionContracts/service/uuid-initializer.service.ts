import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/gestionUsers/entity/user.entity';

@Injectable()
export class UuidInitializerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UuidInitializerService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.backfillAllUuids();
  }

  private async backfillAllUuids() {
    const tables = ['users', 'contracts', 'cotation', 'customers', 'agency', 'office', 'tickets'];
    for (const table of tables) {
      try {
        const result: any = await this.userRepo.query(
          `UPDATE \`${table}\` SET \`uuid\` = UUID() WHERE \`uuid\` IS NULL OR \`uuid\` = '';`
        );
        const affected = result?.affectedRows ?? result?.changedRows ?? 0;
        if (affected > 0) {
          this.logger.log(`✨ ${affected} UUID(s) générés pour la table ${table}.`);
        }
      } catch (err: any) {
        this.logger.warn(`Initialisation UUID ignorée pour ${table}: ${err.message}`);
      }
    }
  }
}
