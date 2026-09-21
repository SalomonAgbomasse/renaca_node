import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RenacaTarifAmortissable } from '../entity/renaca-tarif-amortissable.entity';
import { RenacaTarifConstant } from '../entity/renaca-tarif-constant.entity';
import { RENACA_TARIF_AMORTISSABLE_DATA } from './data/renaca-tarif-amortissable.data';
import { RENACA_TARIF_CONSTANT_DATA } from './data/renaca-tarif-constant.data';

@Injectable()
export class RenacaTarifSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(RenacaTarifAmortissable)
    private tarifAmortissableRepository: Repository<RenacaTarifAmortissable>,
    @InjectRepository(RenacaTarifConstant)
    private tarifConstantRepository: Repository<RenacaTarifConstant>,
  ) {}

  async onModuleInit() {
    await this.seedTarifAmortissable();
    await this.seedTarifConstant();
  }

  private async seedTarifAmortissable() {
    const count = await this.tarifAmortissableRepository.count();

    if (count > 0) {
      console.log(`✅ Barème RENACA Tarif_1 (Amortissable) déjà présent (${count} lignes)`);
      return;
    }

    await this.tarifAmortissableRepository.save(RENACA_TARIF_AMORTISSABLE_DATA);
    console.log(`✅ Barème RENACA Tarif_1 (Amortissable) créé (${RENACA_TARIF_AMORTISSABLE_DATA.length} lignes)`);
  }

  private async seedTarifConstant() {
    const count = await this.tarifConstantRepository.count();

    if (count > 0) {
      console.log(`✅ Barème RENACA Tarif_PE (Constant) déjà présent (${count} lignes)`);
      return;
    }

    await this.tarifConstantRepository.save(RENACA_TARIF_CONSTANT_DATA);
    console.log(`✅ Barème RENACA Tarif_PE (Constant) créé (${RENACA_TARIF_CONSTANT_DATA.length} lignes)`);
  }
}
