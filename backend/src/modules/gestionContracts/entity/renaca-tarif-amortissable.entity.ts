import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Barème RENACA "Tarif_1" — Capital Amortissable (primes en FCFA).
 * Format large : une ligne par tranche de capital, une colonne par mois de
 * durée (mois1 à mois60) — reproduit exactement la forme du barème source
 * (Tarif_1.md) pour rester directement auditable.
 */
@Entity('tarif_amortissable')
export class RenacaTarifAmortissable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'capital', type: 'int', unsigned: true, unique: true })
  capital: number;

  @Column({ name: 'mois1', type: 'int', unsigned: true }) mois1: number;
  @Column({ name: 'mois2', type: 'int', unsigned: true }) mois2: number;
  @Column({ name: 'mois3', type: 'int', unsigned: true }) mois3: number;
  @Column({ name: 'mois4', type: 'int', unsigned: true }) mois4: number;
  @Column({ name: 'mois5', type: 'int', unsigned: true }) mois5: number;
  @Column({ name: 'mois6', type: 'int', unsigned: true }) mois6: number;
  @Column({ name: 'mois7', type: 'int', unsigned: true }) mois7: number;
  @Column({ name: 'mois8', type: 'int', unsigned: true }) mois8: number;
  @Column({ name: 'mois9', type: 'int', unsigned: true }) mois9: number;
  @Column({ name: 'mois10', type: 'int', unsigned: true }) mois10: number;
  @Column({ name: 'mois11', type: 'int', unsigned: true }) mois11: number;
  @Column({ name: 'mois12', type: 'int', unsigned: true }) mois12: number;
  @Column({ name: 'mois13', type: 'int', unsigned: true }) mois13: number;
  @Column({ name: 'mois14', type: 'int', unsigned: true }) mois14: number;
  @Column({ name: 'mois15', type: 'int', unsigned: true }) mois15: number;
  @Column({ name: 'mois16', type: 'int', unsigned: true }) mois16: number;
  @Column({ name: 'mois17', type: 'int', unsigned: true }) mois17: number;
  @Column({ name: 'mois18', type: 'int', unsigned: true }) mois18: number;
  @Column({ name: 'mois19', type: 'int', unsigned: true }) mois19: number;
  @Column({ name: 'mois20', type: 'int', unsigned: true }) mois20: number;
  @Column({ name: 'mois21', type: 'int', unsigned: true }) mois21: number;
  @Column({ name: 'mois22', type: 'int', unsigned: true }) mois22: number;
  @Column({ name: 'mois23', type: 'int', unsigned: true }) mois23: number;
  @Column({ name: 'mois24', type: 'int', unsigned: true }) mois24: number;
  @Column({ name: 'mois25', type: 'int', unsigned: true }) mois25: number;
  @Column({ name: 'mois26', type: 'int', unsigned: true }) mois26: number;
  @Column({ name: 'mois27', type: 'int', unsigned: true }) mois27: number;
  @Column({ name: 'mois28', type: 'int', unsigned: true }) mois28: number;
  @Column({ name: 'mois29', type: 'int', unsigned: true }) mois29: number;
  @Column({ name: 'mois30', type: 'int', unsigned: true }) mois30: number;
  @Column({ name: 'mois31', type: 'int', unsigned: true }) mois31: number;
  @Column({ name: 'mois32', type: 'int', unsigned: true }) mois32: number;
  @Column({ name: 'mois33', type: 'int', unsigned: true }) mois33: number;
  @Column({ name: 'mois34', type: 'int', unsigned: true }) mois34: number;
  @Column({ name: 'mois35', type: 'int', unsigned: true }) mois35: number;
  @Column({ name: 'mois36', type: 'int', unsigned: true }) mois36: number;
  @Column({ name: 'mois37', type: 'int', unsigned: true }) mois37: number;
  @Column({ name: 'mois38', type: 'int', unsigned: true }) mois38: number;
  @Column({ name: 'mois39', type: 'int', unsigned: true }) mois39: number;
  @Column({ name: 'mois40', type: 'int', unsigned: true }) mois40: number;
  @Column({ name: 'mois41', type: 'int', unsigned: true }) mois41: number;
  @Column({ name: 'mois42', type: 'int', unsigned: true }) mois42: number;
  @Column({ name: 'mois43', type: 'int', unsigned: true }) mois43: number;
  @Column({ name: 'mois44', type: 'int', unsigned: true }) mois44: number;
  @Column({ name: 'mois45', type: 'int', unsigned: true }) mois45: number;
  @Column({ name: 'mois46', type: 'int', unsigned: true }) mois46: number;
  @Column({ name: 'mois47', type: 'int', unsigned: true }) mois47: number;
  @Column({ name: 'mois48', type: 'int', unsigned: true }) mois48: number;
  @Column({ name: 'mois49', type: 'int', unsigned: true }) mois49: number;
  @Column({ name: 'mois50', type: 'int', unsigned: true }) mois50: number;
  @Column({ name: 'mois51', type: 'int', unsigned: true }) mois51: number;
  @Column({ name: 'mois52', type: 'int', unsigned: true }) mois52: number;
  @Column({ name: 'mois53', type: 'int', unsigned: true }) mois53: number;
  @Column({ name: 'mois54', type: 'int', unsigned: true }) mois54: number;
  @Column({ name: 'mois55', type: 'int', unsigned: true }) mois55: number;
  @Column({ name: 'mois56', type: 'int', unsigned: true }) mois56: number;
  @Column({ name: 'mois57', type: 'int', unsigned: true }) mois57: number;
  @Column({ name: 'mois58', type: 'int', unsigned: true }) mois58: number;
  @Column({ name: 'mois59', type: 'int', unsigned: true }) mois59: number;
  @Column({ name: 'mois60', type: 'int', unsigned: true }) mois60: number;
}
