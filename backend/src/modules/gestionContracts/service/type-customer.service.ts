import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeCustomer } from '../entity/type-customer.entity';

@Injectable()
export class TypeCustomerService {
  constructor(
    @InjectRepository(TypeCustomer)
    private typeCustomerRepository: Repository<TypeCustomer>,
  ) {}

  async findAll(): Promise<TypeCustomer[]> {
    return this.typeCustomerRepository.find();
  }

  async findOne(id: number): Promise<TypeCustomer | null> {
    return this.typeCustomerRepository.findOne({ where: { id } });
  }

  async findByTitle(libelle: string): Promise<TypeCustomer | null> {
    return this.typeCustomerRepository.findOne({ where: { libelle } });
  }

  async create(typeCustomerData: Partial<TypeCustomer>): Promise<TypeCustomer> {
    const typeCustomer = this.typeCustomerRepository.create(typeCustomerData);
    return this.typeCustomerRepository.save(typeCustomer);
  }

  async update(id: number, typeCustomerData: Partial<TypeCustomer>): Promise<TypeCustomer | null> {
    await this.typeCustomerRepository.update(id, typeCustomerData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.typeCustomerRepository.delete(id);
  }
}
