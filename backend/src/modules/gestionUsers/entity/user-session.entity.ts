import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'idUser', type: 'int' })
  idUser: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'idUser' })
  user: User;

  @Column({ name: 'sessionId', type: 'varchar', length: 255, unique: true })
  sessionId: string;

  @Column({ name: 'token', type: 'text' })
  token: string;

  @Column({ name: 'refreshToken', type: 'text', nullable: true })
  refreshToken: string;

  @Column({ name: 'ipAddress', type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ name: 'userAgent', type: 'text' })
  userAgent: string;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'expiresAt', type: 'datetime' })
  expiresAt: Date;

  @Column({ name: 'lastActivity', type: 'datetime' })
  lastActivity: Date;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;
}
