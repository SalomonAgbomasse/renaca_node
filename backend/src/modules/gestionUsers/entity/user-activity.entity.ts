import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum ActivityType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  SMS_VERIFICATION = 'SMS_VERIFICATION',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  SESSION_KILLED = 'SESSION_KILLED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  API_ACCESS = 'API_ACCESS'
}

@Entity('user_activities')
export class UserActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'idUser', type: 'int' })
  idUser: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'idUser' })
  user: User;

  @Column({ 
    name: 'activityType', 
    type: 'enum', 
    enum: ActivityType 
  })
  activityType: ActivityType;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'ipAddress', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'sessionId', type: 'varchar', length: 255, nullable: true })
  sessionId: string;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;
}
