import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LienParente } from '../entity/lien-parente.entity';

@Injectable()
export class LienParenteService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LienParenteService.name);

  constructor(
    @InjectRepository(LienParente)
    private readonly lienParenteRepository: Repository<LienParente>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaults();
  }

  async seedDefaults() {
    const defaults = [
      { libelle: 'PERE', code: 'PERE', description: 'Père' },
      { libelle: 'MERE', code: 'MERE', description: 'Mère' },
      { libelle: 'ENFANT', code: 'ENFANT', description: 'Enfant (Fils/Fille)' },
      { libelle: 'CONJOINT', code: 'CONJOINT', description: 'Conjoint / Époux / Épouse' },
      { libelle: 'FRERE', code: 'FRERE', description: 'Frère' },
      { libelle: 'SOEUR', code: 'SOEUR', description: 'Sœur' },
      { libelle: 'AUTRE', code: 'AUTRE', description: 'Autre / Ayant droit' },
    ];

    for (const item of defaults) {
      const existing = await this.lienParenteRepository.findOne({
        where: [{ code: item.code }, { libelle: item.libelle }],
      });
      if (!existing) {
        await this.lienParenteRepository.save(this.lienParenteRepository.create(item));
      }
    }
    this.logger.log('✅ Liens de parenté standards initialisés (PERE, MERE, ENFANT, CONJOINT, FRERE, SOEUR, AUTRE).');
  }

  async findAll(): Promise<LienParente[]> {
    return this.lienParenteRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<LienParente | null> {
    return this.lienParenteRepository.findOne({ where: { id } });
  }

  async create(data: Partial<LienParente>): Promise<LienParente> {
    const item = this.lienParenteRepository.create(data);
    return this.lienParenteRepository.save(item);
  }

  async update(id: number, data: Partial<LienParente>): Promise<LienParente | null> {
    await this.lienParenteRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.lienParenteRepository.delete(id);
  }
}
