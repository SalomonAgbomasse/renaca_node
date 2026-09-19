import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('periodicite')
export class Periodicite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'libelle', type: 'varchar', length: 50 })
  libelle: string;

  @Column({ name: 'code', type: 'varchar', length: 10 })
  code: string;

  @Column({ name: 'nombreMois', type: 'int' })
  nombreMois: number;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;
}
