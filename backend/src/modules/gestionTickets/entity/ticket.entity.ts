import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, BeforeInsert } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from '../../gestionUsers/entity/user.entity';

export enum TicketStatus {
  OUVERT = 'OUVERT',
  EN_COURS = 'EN_COURS',
  RESOLU = 'RESOLU',
  FERME = 'FERME'
}

export enum TicketPriority {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE'
}

@Entity('tickets')
@Index(['idUser'])
@Index(['status'])
@Index(['priority'])
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'uuid', type: 'varchar', length: 36, nullable: true, unique: true })
  uuid: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }

  @Column({ name: 'idUser', type: 'int', nullable: false })
  idUser: number;

  @Column({ name: 'sujet', type: 'varchar', length: 255, nullable: false })
  sujet: string;

  @Column({ name: 'description', type: 'text', nullable: false })
  description: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ name: 'telephone', type: 'varchar', length: 30, nullable: true })
  telephone: string;

  @Column({ name: 'fichiers', type: 'text', nullable: true })
  fichiers: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OUVERT
  })
  status: TicketStatus;

  @Column({
    name: 'priority',
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.NORMALE
  })
  priority: TicketPriority;

  @Column({ name: 'assignedTo', type: 'int', nullable: true })
  assignedTo: number;

  @Column({ name: 'reponse', type: 'text', nullable: true })
  reponse: string;

  @Column({ name: 'reponduPar', type: 'int', nullable: true })
  reponduPar: number;

  @Column({ name: 'dateReponse', type: 'datetime', nullable: true })
  dateReponse: Date;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'datetime', nullable: true })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'idUser' })
  user: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'assignedTo' })
  assignedUser: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'reponduPar' })
  reponduParUser: User;
}
