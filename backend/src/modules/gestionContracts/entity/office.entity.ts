import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Agency } from './agency.entity';
import { User } from 'src/modules/gestionUsers/entity/user.entity';

@Entity('office')
export class Office {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'idAgency', type: 'int' })
  idAgency: number;

  @Column({ name: 'officeName', type: 'varchar', length: 200, nullable: true })
  officeName: string;

  @Column({ name: 'address_bureau', type: 'varchar', length: 255, nullable: true })
  addressBureau: string;

  @Column({ name: 'phone_bureau', type: 'varchar', length: 255, nullable: true })
  phoneBureau: string;

  @ManyToOne(() => Agency)
  @JoinColumn({ name: 'idAgency' })
  agency: Agency;

  @OneToMany(() => User, (user) => user.office)
  users: User[];

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'datetime', nullable: true })
  deletedAt: Date;
}

