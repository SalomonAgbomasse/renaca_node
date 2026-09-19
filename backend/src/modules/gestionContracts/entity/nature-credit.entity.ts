import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany } from 'typeorm';
import { Contract } from './contract.entity';
import { Group } from '../../gestionUsers/entity/group.entity';

@Entity('nature_credits')
export class NatureCredit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  libelle: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Contract, contract => contract.natureCredit)
  contracts: Contract[];

  @ManyToMany(() => Group, group => group.natureCredits)
  groups: Group[];
}
