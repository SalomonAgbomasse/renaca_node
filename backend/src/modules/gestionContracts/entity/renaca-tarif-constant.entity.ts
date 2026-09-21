import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Barème RENACA "Tarif_PE" — Capital Constant.
 * Format large : une ligne par âge exact (18 à 70 ans), une colonne par mois
 * de durée (mois1 à mois60). Chaque valeur est le taux décimal exact déjà
 * converti depuis le pourcentage source (ex. 0.720% -> 0.0072) : le calcul
 * se fait par simple multiplication (capital x taux x 1,25), sans division.
 */
@Entity('renaca_tarif_constant')
export class RenacaTarifConstant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'age', type: 'int', unsigned: true, unique: true })
  age: number;

  @Column({ name: 'mois1', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois1: number;
  @Column({ name: 'mois2', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois2: number;
  @Column({ name: 'mois3', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois3: number;
  @Column({ name: 'mois4', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois4: number;
  @Column({ name: 'mois5', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois5: number;
  @Column({ name: 'mois6', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois6: number;
  @Column({ name: 'mois7', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois7: number;
  @Column({ name: 'mois8', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois8: number;
  @Column({ name: 'mois9', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois9: number;
  @Column({ name: 'mois10', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois10: number;
  @Column({ name: 'mois11', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois11: number;
  @Column({ name: 'mois12', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois12: number;
  @Column({ name: 'mois13', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois13: number;
  @Column({ name: 'mois14', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois14: number;
  @Column({ name: 'mois15', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois15: number;
  @Column({ name: 'mois16', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois16: number;
  @Column({ name: 'mois17', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois17: number;
  @Column({ name: 'mois18', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois18: number;
  @Column({ name: 'mois19', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois19: number;
  @Column({ name: 'mois20', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois20: number;
  @Column({ name: 'mois21', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois21: number;
  @Column({ name: 'mois22', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois22: number;
  @Column({ name: 'mois23', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois23: number;
  @Column({ name: 'mois24', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois24: number;
  @Column({ name: 'mois25', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois25: number;
  @Column({ name: 'mois26', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois26: number;
  @Column({ name: 'mois27', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois27: number;
  @Column({ name: 'mois28', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois28: number;
  @Column({ name: 'mois29', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois29: number;
  @Column({ name: 'mois30', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois30: number;
  @Column({ name: 'mois31', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois31: number;
  @Column({ name: 'mois32', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois32: number;
  @Column({ name: 'mois33', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois33: number;
  @Column({ name: 'mois34', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois34: number;
  @Column({ name: 'mois35', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois35: number;
  @Column({ name: 'mois36', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois36: number;
  @Column({ name: 'mois37', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois37: number;
  @Column({ name: 'mois38', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois38: number;
  @Column({ name: 'mois39', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois39: number;
  @Column({ name: 'mois40', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois40: number;
  @Column({ name: 'mois41', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois41: number;
  @Column({ name: 'mois42', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois42: number;
  @Column({ name: 'mois43', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois43: number;
  @Column({ name: 'mois44', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois44: number;
  @Column({ name: 'mois45', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois45: number;
  @Column({ name: 'mois46', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois46: number;
  @Column({ name: 'mois47', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois47: number;
  @Column({ name: 'mois48', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois48: number;
  @Column({ name: 'mois49', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois49: number;
  @Column({ name: 'mois50', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois50: number;
  @Column({ name: 'mois51', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois51: number;
  @Column({ name: 'mois52', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois52: number;
  @Column({ name: 'mois53', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois53: number;
  @Column({ name: 'mois54', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois54: number;
  @Column({ name: 'mois55', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois55: number;
  @Column({ name: 'mois56', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois56: number;
  @Column({ name: 'mois57', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois57: number;
  @Column({ name: 'mois58', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois58: number;
  @Column({ name: 'mois59', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois59: number;
  @Column({ name: 'mois60', type: 'decimal', precision: 10, scale: 6, unsigned: true }) mois60: number;
}
