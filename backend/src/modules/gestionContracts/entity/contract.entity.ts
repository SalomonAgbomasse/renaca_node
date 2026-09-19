import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn, BeforeInsert } from 'typeorm';
import { randomUUID } from 'crypto';
import { Product } from './product.entity';
import { Customer } from './customer.entity';
import { User } from 'src/modules/gestionUsers/entity/user.entity';
import { ContractState } from './contract-state.entity';
import { Agency } from './agency.entity';
import { NatureCredit } from './nature-credit.entity';
import { Periodicite } from './periodicite.entity';
import { Beneficiary } from './beneficiary.entity';
import { ContractInsuredMember } from './contract-insured-member.entity';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'uuid', type: 'varchar', length: 36, nullable: true, unique: true })
  uuid: string;

  @Column({ name: 'idCustomer', type: 'int' })
  idCustomer: number;

  @Column({ name: 'idUser', type: 'int' })
  idUser: number; // ID user who created the contract

  @Column({ name: 'updatedBy', type: 'int', nullable: true })
  updatedBy: number; // ID user who updated the contract

  @Column({ name: 'deletedBy', type: 'int', nullable: true })
  deletedBy: number; // ID user who deleted the contract

  @Column({ name: 'idProduct', type: 'int' })
  idProduct: number;

  @Column({ name: 'idContractState', type: 'int' })
  idContractState: number;

  @Column({ name: 'idAgency', type: 'int' })
  idAgency: number;

  @Column({ name: 'idNatureCredit', type: 'int' })
  idNatureCredit: number;

  @Column({ name: 'capital', type: 'bigint' })
  capital: number;

  @Column({ name: 'duration', type: 'int', default: 0 })
  duration: number;

  @Column({ name: 'differe', type: 'int', default: 0 })
  differe: number;

  @Column({ name: 'idPeriodicite', type: 'int', nullable: true })
  idPeriodicite: number;

  @Column({ name: 'taux', type: 'decimal', precision: 5, scale: 2, nullable: true })
  taux: number;

  @Column({ name: 'dateEff', type: 'datetime' })
  dateEff: Date;

  @Column({ name: 'dateEch1', type: 'datetime' })
  dateEch1: Date;

  @Column({ name: 'dateEch', type: 'datetime' })
  dateEch: Date;

  @Column({ name: 'pd', type: 'int', unsigned: true, default: 0 })
  pd: number;

  @Column({ name: 'pc', type: 'int', unsigned: true, default: 0 })
  pc: number;

  @Column({ name: 'surp', type: 'int', unsigned: true, default: 0 })
  surp: number;

  @Column({ name: 'acc', type: 'int', unsigned: true, default: 0 })
  acc: number;

  @Column({ name: 'fm', type: 'int', unsigned: true, default: 0 })
  fm: number;

  @Column({ name: 'puttc', type: 'int', unsigned: true, default: 0 })
  puttc: number;

  @Column({ name: 'police', type: 'varchar', length: 50, nullable: false, unique: true })
  police: string;

  @Column({ name: 'reference', type: 'varchar', length: 100, nullable: false, unique: true })
  reference: string;

  @Column({ name: 'garantieCompl', type: 'varchar', length: 3, default: 'NON' })
  garantieCompl: string;

  @Column({ name: 'obaOptions', type: 'json', nullable: true })
  obaOptions: any;

  @Column({ name: 'etablissement', type: 'varchar', length: 255, nullable: true })
  etablissement: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'keyCont', type: 'varchar', length: 50, nullable: false, unique: true })
  keyCont: string;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'contractType', type: 'varchar', length: 50, default: 'STANDARD' })
  contractType: string; // STANDARD, HORS_CONVENTION, COTATION_CONVERTED, etc.

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime' })
  deletedAt: Date;

  @ManyToOne(() => Customer, (customer) => customer.id)
  @JoinColumn({ name: 'idCustomer' })
  customer: Customer;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'idUser' })
  user: User;

  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn({ name: 'idProduct' })
  product: Product;

  @ManyToOne(() => ContractState, (contractState) => contractState.id)
  @JoinColumn({ name: 'idContractState' })
  contractState: ContractState;

  @ManyToOne(() => Agency, (agency) => agency.id)
  @JoinColumn({ name: 'idAgency' })
  agency: Agency;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'idUser' })
  createdByUser: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'deletedBy' })
  deletedByUser: User;

  @ManyToOne(() => NatureCredit, (natureCredit) => natureCredit.id)
  @JoinColumn({ name: 'idNatureCredit' })
  natureCredit: NatureCredit;

  @ManyToOne(() => Periodicite, (periodicite) => periodicite.id)
  @JoinColumn({ name: 'idPeriodicite' })
  periodicite: Periodicite;

  @Column({ name: 'renouvellementAuto', type: 'boolean', nullable: true, default: null })
  renouvellementAuto: boolean | null;

  @Column({ name: 'compteBancaire', type: 'varchar', length: 50, nullable: true, default: null })
  compteBancaire: string;

  @Column({ name: 'numeroCompte', type: 'varchar', length: 100, nullable: true, default: null })
  numeroCompte: string;

  @OneToMany(() => Beneficiary, (beneficiary) => beneficiary.contract, { cascade: true })
  beneficiaries: Beneficiary[];

  @OneToMany(() => ContractInsuredMember, (member) => member.contract, { cascade: true })
  insuredMembers: ContractInsuredMember[];

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }
}
