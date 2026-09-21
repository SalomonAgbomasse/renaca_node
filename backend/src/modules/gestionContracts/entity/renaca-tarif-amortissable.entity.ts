import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * Barème RENACA "Tarif_1" — Capital Amortissable.
 * Une ligne = une prime décès absolue (FCFA) pour une tranche de capital
 * et un palier de durée de 6 mois. Correspond au Tarif_1.md fourni par le métier.
 */
@Entity('renaca_tarif_amortissable')
@Index(['capital', 'dureeMoisMin'], { unique: true })
export class RenacaTarifAmortissable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'capital', type: 'int', unsigned: true })
  capital: number;

  @Column({ name: 'dureeMoisMin', type: 'int' })
  dureeMoisMin: number;

  @Column({ name: 'dureeMoisMax', type: 'int' })
  dureeMoisMax: number;

  @Column({ name: 'primeDeces', type: 'int', unsigned: true })
  primeDeces: number;
}
