import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('type_customer')
export class TypeCustomer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'libelle', type: 'varchar', length: 30 })
  libelle: string;

  @Column({ name: 'description', type: 'varchar', length: 30, nullable: true })
  description: string;

  @OneToMany(() => Customer, (customer) => customer.idTypeCustomer)
  customers: Customer[];

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'datetime' })
  deletedAt: Date;
}
