import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Subscriber } from './subscriber.entity';
import { User } from 'src/modules/gestionUsers/entity/user.entity';

@Entity('agency')
export class Agency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'uuid', type: 'varchar', length: 36, nullable: true, unique: true })
  uuid: string;

  @Column({ name: 'idSubscriber', type: 'int', default: 1 })
  idSubscriber: number;

  @Column({ name: 'createdBy', type: 'int', default: 1 })
  createdBy: number; // ID user who created the agency

  @Column({ name: 'updatedBy', type: 'int', nullable: true })
  updatedBy: number; // ID user who updated the agency

  @Column({ name: 'deletedBy', type: 'int', nullable: true })
  deletedBy: number; // ID user who deleted the agency

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'address', type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 255 })
  phone: string;

  @Column({ name: 'fax', type: 'varchar', length: 255, nullable: true })
  fax: string;

  @ManyToOne(() => Subscriber, (subscriber) => subscriber.agencies)
  @JoinColumn({ name: 'idSubscriber' })
  subscriber: Subscriber;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'datetime' })
  deletedAt: Date;

  @OneToMany(() => User, (user) => user.agency)
  users: User[];
}
