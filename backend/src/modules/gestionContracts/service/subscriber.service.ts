import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from '../entity/subscriber.entity';

@Injectable()
export class SubscriberService {
  constructor(
    @InjectRepository(Subscriber)
    private subscriberRepository: Repository<Subscriber>,
  ) {}

  async findAll(): Promise<Subscriber[]> {
    return this.subscriberRepository.find();
  }

  async findOne(id: number): Promise<Subscriber | null> {
    return this.subscriberRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Subscriber[]> {
    return this.subscriberRepository.find({ where: { name } });
  }

  async findByEmail(email: string): Promise<Subscriber | null> {
    return this.subscriberRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<Subscriber | null> {
    return this.subscriberRepository.findOne({ where: { phone } });
  }

  async create(subscriberData: Partial<Subscriber>): Promise<Subscriber> {
    const subscriber = this.subscriberRepository.create(subscriberData);
    return this.subscriberRepository.save(subscriber);
  }

  async update(id: number, subscriberData: Partial<Subscriber>): Promise<Subscriber | null> {
    await this.subscriberRepository.update(id, subscriberData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.subscriberRepository.delete(id);
  }
}
