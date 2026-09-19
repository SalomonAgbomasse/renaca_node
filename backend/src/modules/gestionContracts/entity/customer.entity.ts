import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn, ManyToOne, BeforeInsert } from 'typeorm';
import { randomUUID } from 'crypto';
import { TypeCustomer } from './type-customer.entity';
import { User } from 'src/modules/gestionUsers/entity/user.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'uuid', type: 'varchar', length: 36, nullable: true, unique: true })
  uuid: string;

  @Column({ name: 'idTypeCustomer', type: 'int' })
  idTypeCustomer: number;

  @Column({ name: 'idUser', type: 'int' })
  idUser: number; // ID user who created the customer

  @Column({ name: 'updatedBy', type: 'int', nullable: true })
  updatedBy: number; // ID user who updated the customer

  @Column({ name: 'deletedBy', type: 'int', nullable: true })
  deletedBy: number; // ID user who deleted the customer

  @Column({ name: 'numCustomer', type: 'varchar', length: 15, default: '0' })
  numCustomer: string;

  @Column({ name: 'lastname', type: 'varchar', length: 255 })
  lastname: string;

  @Column({ name: 'firstname', type: 'varchar', length: 255 })
  firstname: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'address', type: 'varchar', length: 255 })
  address: string;

  @Column({ name: 'phone', type: 'varchar', length: 30,})
  phone: string;

  @Column({ name: 'place_of_birth', type: 'varchar', length: 255 })
  placeOfBirth: string;

  @Column({ name: 'birthdate', type: 'date' })
  birthdate: string;

  @Column({ name: 'occupation', type: 'varchar', length: 255 })
  occupation: string;

  @Column({ name: 'gender', type: 'varchar', length: 10 })
  gender: string;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date;

  @Column({ name: 'version', type: 'int', nullable: true, default: 0 })
  version: number;

  @ManyToOne(() => TypeCustomer, (typeCustomer) => typeCustomer.customers)
  @JoinColumn({ name: 'idTypeCustomer' })
  typeCustomer: TypeCustomer;

  @ManyToOne(() => User, (user) => user.customers)
  @JoinColumn({ name: 'idUser' })
  user: User;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }
}
