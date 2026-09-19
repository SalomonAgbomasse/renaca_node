import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Periodicite } from '../entity/periodicite.entity';

@Injectable()
export class PeriodiciteService {
  constructor(
    @InjectRepository(Periodicite)
    private periodiciteRepository: Repository<Periodicite>,
  ) {}

  async findAll(): Promise<Periodicite[]> {
    return await this.periodiciteRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Periodicite | null> {
    return await this.periodiciteRepository.findOne({
      where: { id, isActive: true }
    });
  }
}

