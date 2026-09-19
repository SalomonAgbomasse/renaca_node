import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../gestionUsers/entity/user.entity';

@Entity('quotations')
export class Quotation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  typeass: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  kal: number;

  @Column({ type: 'varchar', length: 10 })
  gcompl: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  fm: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  pd: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  pc: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  acc: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  surp: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  puttc: number;

  @Column({ type: 'boolean', default: false })
  error: boolean;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'int', nullable: true })
  ageSortie: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  tarif: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  tarifPe: number;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
