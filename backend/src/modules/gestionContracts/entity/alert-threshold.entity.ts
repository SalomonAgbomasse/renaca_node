import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bi_alert_thresholds')
export class AlertThreshold {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'code', type: 'varchar', length: 100, unique: true })
  code: string; // ex: 'ACTIVITY_DROP', 'CONVERSION_DROP', 'PRIME_DROP'

  @Column({ name: 'label', type: 'varchar', length: 255 })
  label: string; // ex: 'Baisse d\'activité'

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'threshold_value', type: 'decimal', precision: 10, scale: 2, default: 20 })
  thresholdValue: number; // Valeur en % (ex: 20 = 20% de baisse)

  @Column({ name: 'severity', type: 'enum', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' })
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'comparison_period', type: 'varchar', length: 20, default: 'MONTH' })
  comparisonPeriod: string; // WEEK, MONTH, QUARTER

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
