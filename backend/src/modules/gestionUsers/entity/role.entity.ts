import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'idPermision', type: 'int', nullable: true })
  idPermision: number;

  @Column({ name: 'libelle', type: 'varchar', length: 50 })
  libelle: string;

  @Column({ name: 'desc', type: 'varchar', length: 100 })
  desc: string;

  @Column({ name: 'other', type: 'varchar', length: 100, nullable: true })
  other: string;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'datetime' })
  deletedAt: Date;

  // Relations
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
