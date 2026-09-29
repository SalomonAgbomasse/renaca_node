import { Agency } from 'src/modules/gestionContracts/entity/agency.entity';
import { Customer } from 'src/modules/gestionContracts/entity/customer.entity';
import { Office } from 'src/modules/gestionContracts/entity/office.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { randomUUID } from 'crypto';
import { Role } from './role.entity';
import { UserActivity } from './user-activity.entity';
import { UserSession } from './user-session.entity';

@Entity('users')
export class User {
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

  @Column({ name: 'idRole', type: 'int', nullable: false })
  idRole: number;

  @Column({ name: 'idAgency', type: 'int', nullable: false })
  idAgency?: number;

  @Column({ name: 'idOffice', type: 'int', unsigned: true, nullable: true })
  idOffice?: number;

  @Column({ name: 'lastname', type: 'varchar', length: 255 })
  lastname: string;

  @Column({ name: 'firstname', type: 'varchar', length: 255 })
  firstname: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true, unique: true })
  email: string;

  @Column({ name: 'address', type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ name: 'phone', type: 'varchar', length: 30, nullable: true, unique: true })
  phone: string;

  @Column({ name: 'birthdate', type: 'varchar', length: 255, nullable: true })
  birthdate: string;

  @Column({ name: 'gender', type: 'varchar', length: 1, nullable: true })
  gender: string;

  @Column({ name: 'fonction', type: 'varchar', length: 255, nullable: true })
  fonction: string;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'salt', type: 'varchar', length: 255 })
  salt: string;

  @Column({ name: 'avatar', type: 'varchar', length: 500, nullable: true })
  avatar: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date;

  @Column({ name: 'deletedBy', type: 'int', nullable: true })
  deletedBy?: number;

  @Column({ name: 'suspension_reason', type: 'varchar', length: 500, nullable: true })
  suspensionReason?: string;

  @Column({ name: 'deletion_reason', type: 'varchar', length: 500, nullable: true })
  deletionReason?: string;

  @Column({ name: 'version', type: 'int', nullable: true, default: 0 })
  version: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'DESACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'dateSaisie', type: 'datetime' })
  dateSaisie: Date;

  @Column({ name: 'sms_token', type: 'varchar', length: 10, nullable: true })
  smsToken: string;

  @Column({ name: 'sms_token_expires', type: 'datetime', nullable: true })
  smsTokenExpires: Date;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'two_factor_enabled', type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', type: 'varchar', length: 255, nullable: true })
  twoFactorSecret: string;

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  lastLogin: Date;

  @Column({ name: 'login_attempts', type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil: Date;

  // Relations
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'idRole' })
  role: Role;

  @ManyToOne(() => Agency, (agency) => agency.users)
  @JoinColumn({ name: 'idAgency' })
  agency: Agency;

  @ManyToOne(() => Office, (office) => office.users, { nullable: true })
  @JoinColumn({ name: 'idOffice' })
  office: Office;

  @OneToMany(() => Customer, (customer) => customer.user)
  customers: Customer[];

  @OneToMany(() => UserActivity, (activity) => activity.user)
  activities: UserActivity[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];
}
