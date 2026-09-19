import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Contract } from './contract.entity';

@Entity('contract_state')
export class ContractState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'libelle', type: 'varchar', length: 100 })
  libelle: string;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'datetime' })
  deletedAt: Date;

  @OneToMany(() => Contract, (contract) => contract.idContractState)
  contracts: Contract[];
}
