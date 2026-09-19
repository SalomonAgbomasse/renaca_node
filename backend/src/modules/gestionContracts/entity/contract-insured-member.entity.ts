import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Contract } from './contract.entity';

/**
 * Membres assurés secondaires d'un contrat OBA (Obsèques Alafia).
 * Stocke le conjoint et les ascendants cochés lors de la souscription.
 * L'assuré principal reste dans la table customers via contracts.idCustomer.
 */
@Entity('contract_insured_members')
export class ContractInsuredMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'idContract', type: 'int' })
  idContract: number;

  /**
   * Rôle du membre dans le contrat OBA :
   * - conjoint     : Conjoint de l'assuré
   * - ascendant1   : Père de l'assuré
   * - ascendant2   : Mère de l'assuré
   * - ascendant3   : Père du conjoint
   * - ascendant4   : Mère du conjoint
   */
  @Column({ name: 'role', type: 'varchar', length: 30 })
  role: string;

  @Column({ name: 'roleLabel', type: 'varchar', length: 100 })
  roleLabel: string;

  @Column({ name: 'lastname', type: 'varchar', length: 255 })
  lastname: string;

  @Column({ name: 'firstname', type: 'varchar', length: 255 })
  firstname: string;

  @Column({ name: 'birthdate', type: 'date' })
  birthdate: string;

  @Column({ name: 'gender', type: 'varchar', length: 10, nullable: true })
  gender: string;

  /** Capital assuré calculé pour ce membre (FCFA) */
  @Column({ name: 'capitalAssure', type: 'bigint', default: 0 })
  capitalAssure: number;

  /** Prime calculée pour ce membre (FCFA) */
  @Column({ name: 'prime', type: 'int', unsigned: true, default: 0 })
  prime: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idContract' })
  contract: Contract;
}
