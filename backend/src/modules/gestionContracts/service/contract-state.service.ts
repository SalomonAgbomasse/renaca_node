import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractState } from '../entity/contract-state.entity';

@Injectable()
export class ContractStateService {
  constructor(
    @InjectRepository(ContractState)
    private contractStateRepository: Repository<ContractState>,
  ) {}

  async findAll(): Promise<ContractState[]> {
    return this.contractStateRepository.find();
  }

  async findOne(id: number): Promise<ContractState | null> {
    return this.contractStateRepository.findOne({ where: { id } });
  }

  async findByLibelle(libelle: string): Promise<ContractState | null> {
    return this.contractStateRepository.findOne({ where: { libelle } });
  }

  async create(contractStateData: Partial<ContractState>): Promise<ContractState> {
    const contractState = this.contractStateRepository.create(contractStateData);
    return this.contractStateRepository.save(contractState);
  }

  async update(id: number, contractStateData: Partial<ContractState>): Promise<ContractState | null> {
    await this.contractStateRepository.update(id, contractStateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.contractStateRepository.delete(id);
  }
}
