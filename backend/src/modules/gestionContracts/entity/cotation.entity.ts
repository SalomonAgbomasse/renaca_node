import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from 'src/modules/gestionUsers/entity/user.entity';
import { Agency } from './agency.entity';
import { Customer } from './customer.entity';
import { Periodicite } from './periodicite.entity';
import { TypeCustomer } from './type-customer.entity';
import { NatureCredit } from './nature-credit.entity';

@Entity('cotation')
export class Cotation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'uuid', type: 'varchar', length: 36, nullable: true, unique: true })
  uuid: string;

  @Column({ name: 'idUser', type: 'int' })
  idUser: number; // ID user who created the cotation

  @Column({ name: 'updatedBy', type: 'int', nullable: true })
  updatedBy: number; // ID user who updated the cotation

  @Column({ name: 'deletedBy', type: 'int', nullable: true })
  deletedBy: number; // ID user who deleted the cotation

  @Column({ name: 'idAgency', type: 'int' })
  idAgency: number;

  @Column({ name: 'idCustomer', type: 'int', nullable: true })
  idCustomer: number;

  @Column({ name: 'idTypeCustomer', type: 'int', default: 1 })
  idTypeCustomer: number;

  @Column({ name: 'idNatureCredit', type: 'int', default: 1 })
  idNatureCredit: number;

  @Column({ name: 'idPeriodicite', type: 'int', nullable: true })
  idPeriodicite: number;

  @Column({ name: 'typeAss', type: 'varchar', length: 30 })
  typeAss: string;

  @Column({ name: 'capital', type: 'int', unsigned: true })
  capital: number;

  @Column({ name: 'capital_interet', type: 'int', nullable: true })
  capitalInteret: number;

  @Column({ name: 'duration', type: 'int', unsigned: true })
  duration: number;

  @Column({ name: 'differe', type: 'int', default: 0 })
  differe: number;

  // Pour RENACA : Perte d'Emploi OUI/NON (réutilise la colonne PADME "garantie
  // complémentaire perte d'emploi", même signification).
  @Column({ name: 'garantieCompl', type: 'varchar', length: 3, nullable: true, default: 'NON' })
  garantieCompl: string;

  @Column({ name: 'pd', type: 'int', unsigned: true, nullable: true })
  pd: number;

  // Pour RENACA : stocke la prime Perte d'Emploi (primePE).
  @Column({ name: 'pc', type: 'int', unsigned: true, nullable: true })
  pc: number;

  @Column({ name: 'surp', type: 'int', unsigned: true, nullable: true })
  surp: number;

  @Column({ name: 'acc', type: 'int', unsigned: true, nullable: true })
  acc: number;

  @Column({ name: 'fm', type: 'int', unsigned: true, nullable: true })
  fm: number;

  @Column({ name: 'puttc', type: 'int', unsigned: true })
  puttc: number;

  @Column({ name: 'reference', type: 'varchar', length: 50, unique: true })
  reference: string;

  @Column({ name: 'status', type: 'enum', enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' })
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ name: 'lastname', type: 'varchar', length: 255, nullable: true })
  lastname: string;

  @Column({ name: 'firstname', type: 'varchar', length: 255, nullable: true })
  firstname: string;

  @Column({ name: 'birthdate', type: 'varchar', length: 255 })
  birthdate: string;

  @Column({ name: 'etablissement', type: 'varchar', length: 255, nullable: true })
  etablissement: string;

  // Champs spécifiques RENACA (Assurance Bouclier Emprunteurs)
  @Column({ name: 'tauxSurprime', type: 'decimal', precision: 5, scale: 4, nullable: true, default: 0 })
  tauxSurprime: number;

  @Column({ name: 'beneficiaire', type: 'varchar', length: 255, nullable: true })
  beneficiaire: string;

  @CreateDateColumn({ name: 'dateSaisie', type: 'datetime' })
  dateSaisie: Date;

  @UpdateDateColumn({ name: 'dateModif', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'datetime' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'idUser' })
  user: User;

  @ManyToOne(() => Agency, (agency) => agency.id)
  @JoinColumn({ name: 'idAgency' })
  agency: Agency;

  @ManyToOne(() => Customer, (customer) => customer.id)
  @JoinColumn({ name: 'idCustomer' })
  customer: Customer;

  @ManyToOne(() => Periodicite, (periodicite) => periodicite.id)
  @JoinColumn({ name: 'idPeriodicite' })
  periodicite: Periodicite;

  @ManyToOne(() => TypeCustomer, (typeCustomer) => typeCustomer.id)
  @JoinColumn({ name: 'idTypeCustomer' })
  typeCustomer: TypeCustomer;

  @ManyToOne(() => NatureCredit, (natureCredit) => natureCredit.id)
  @JoinColumn({ name: 'idNatureCredit' })
  natureCredit: NatureCredit;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'deletedBy' })
  deletedByUser: User;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }
}
