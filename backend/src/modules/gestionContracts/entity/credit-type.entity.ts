import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('credit_type')
export class CreditType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'libelle', type: 'varchar', length: 100 })
  libelle: string;

  @Column({ name: 'description', type: 'varchar', length: 100, nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'datetime' })
  deletedAt?: Date;
}
