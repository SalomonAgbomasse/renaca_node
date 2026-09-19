import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Agency } from './agency.entity';
import { User } from '../../gestionUsers/entity/user.entity';

@Entity('production_states')
@Index(['idAgency'])
@Index(['generatedBy'])
@Index(['status'])
@Index(['startDate', 'endDate'])
export class ProductionState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ name: 'id_agency', nullable: true })
  idAgency: number | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'generated_by' })
  generatedBy: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'file_path', type: 'varchar', length: 500, nullable: true })
  filePath?: string;

  @Column({ name: 'summary', type: 'json', nullable: true })
  summary?: {
    totalContracts: number;
    totalCapital: number;
    totalPrimeTTC: number;
    avgCapital?: number;
    avgPrimeTTC?: number;
    contractsByUser: { [key: string]: number };
    contractsByOption: { [key: string]: number };
  };

  // Relations
  @ManyToOne(() => Agency, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_agency' })
  agency: Agency | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'generated_by' })
  user: User;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
