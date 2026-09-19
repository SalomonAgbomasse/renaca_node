import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { User } from 'src/modules/gestionUsers/entity/user.entity';

export enum HistoryAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

@Entity('customer_history')
export class CustomerHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customerId', type: 'int' })
  customerId: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ 
    name: 'action', 
    type: 'enum', 
    enum: HistoryAction 
  })
  action: HistoryAction;

  @Column({ name: 'changedBy', type: 'int', nullable: true })
  changedBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changedBy' })
  changedByUser: User;

  // Stocker les valeurs avant modification (JSON)
  @Column({ name: 'oldValues', type: 'json', nullable: true })
  oldValues: Partial<Customer>;

  // Stocker les valeurs après modification (JSON)
  @Column({ name: 'newValues', type: 'json', nullable: true })
  newValues: Partial<Customer>;

  // Liste des champs modifiés
  @Column({ name: 'changedFields', type: 'json', nullable: true })
  changedFields: string[];

  // Description de la modification
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  // Adresse IP de l'utilisateur qui a fait la modification
  @Column({ name: 'ipAddress', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  // User agent
  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;
}

