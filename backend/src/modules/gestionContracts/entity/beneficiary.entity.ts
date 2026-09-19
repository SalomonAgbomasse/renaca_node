import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from './contract.entity';

@Entity('beneficiaries')
export class Beneficiary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'idContract', type: 'int' })
  idContract: number;

  @Column({ name: 'nomPrenoms', type: 'varchar', length: 255 })
  nomPrenoms: string;

  @Column({ name: 'lienParente', type: 'varchar', length: 100 })
  lienParente: string;

  @Column({ name: 'pourcentage', type: 'decimal', precision: 5, scale: 2 })
  pourcentage: number;

  @ManyToOne(() => Contract, (contract) => contract.beneficiaries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idContract' })
  contract: Contract;
}
