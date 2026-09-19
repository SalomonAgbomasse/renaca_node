import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Agency } from './agency.entity';

@Entity('subscriber')
export class Subscriber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false, unique: true })
  name: string;

  @Column({ name: 'address', type: 'varchar', length: 30 })
  address: string;

  @Column({ name: 'email', type: 'varchar', length: 60 })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 30 })
  phone: string;

  @Column({ name: 'phone2', type: 'varchar', length: 30, nullable: true })
  phone2: string;

  @Column({ name: 'fax', type: 'varchar', length: 30 })
  fax: string;

  @OneToMany(() => Agency, (agency) => agency.subscriber)
  agencies: Agency[];

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'datetime' })
  deletedAt: Date;
}
