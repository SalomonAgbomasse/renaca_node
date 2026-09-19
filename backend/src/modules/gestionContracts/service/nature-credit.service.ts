import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatureCredit } from '../entity/nature-credit.entity';

@Injectable()
export class NatureCreditService {
  constructor(
    @InjectRepository(NatureCredit)
    private natureCreditRepository: Repository<NatureCredit>,
  ) {}

  findAll(): Promise<NatureCredit[]> {
    return this.natureCreditRepository.find({ where: { isActive: true } });
  }

  findByCode(code: string): Promise<NatureCredit | null> {
    return this.natureCreditRepository.findOne({ where: { code } });
  }
}
