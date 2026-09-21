import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * Barème RENACA "Tarif_PE" — Capital Constant.
 * Une ligne = un taux pour mille (à multiplier par le capital, puis par 1,25)
 * pour un âge exact et un palier de durée de 6 mois. Correspond au Tarif_PE.md
 * fourni par le métier. Le taux est stocké tel quel (ex. 0.196), la division
 * par 1000 se fait uniquement au moment du calcul.
 */
@Entity('renaca_tarif_constant')
@Index(['age', 'dureeMoisMin'], { unique: true })
export class RenacaTarifConstant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'age', type: 'int', unsigned: true })
  age: number;

  @Column({ name: 'dureeMoisMin', type: 'int' })
  dureeMoisMin: number;

  @Column({ name: 'dureeMoisMax', type: 'int' })
  dureeMoisMax: number;

  @Column({ name: 'tauxPourMille', type: 'decimal', precision: 10, scale: 6 })
  tauxPourMille: number;
}
