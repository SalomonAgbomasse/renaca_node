import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from './contract.entity';
import { User } from 'src/modules/gestionUsers/entity/user.entity';

export enum ContractHistoryAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

@Entity('contract_history')
export class ContractHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'contractId', type: 'int' })
  contractId: number;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @Column({ 
    name: 'action', 
    type: 'enum', 
    enum: ContractHistoryAction 
  })
  action: ContractHistoryAction;

  @Column({ name: 'changedBy', type: 'int', nullable: true })
  changedBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changedBy' })
  changedByUser: User;

  // Stocker les valeurs avant modification (JSON)
  @Column({ name: 'oldValues', type: 'json', nullable: true })
  oldValues: Partial<Contract>;

  // Stocker les valeurs après modification (JSON)
  @Column({ name: 'newValues', type: 'json', nullable: true })
  newValues: Partial<Contract>;

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

