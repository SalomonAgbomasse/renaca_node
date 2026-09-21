import { RenacaTarifConstant } from '../../entity/renaca-tarif-constant.entity';

/**
 * Barème RENACA "Tarif_PE" — Capital Constant (taux décimal exact).
 * Source : Tarif_PE.md (âges 18 à 70 x 10 paliers de durée de 6 mois),
 * valeurs converties depuis le pourcentage d'origine (ex. 0.720% -> 0.0072 =
 * 0.720 / 100), confirmé par l'exemple chiffré du document de référence
 * (capital 3 000 000, taux 0,720% -> prime 21 600 FCFA = 3 000 000 x 0,0072).
 * Les taux sont identiques pour tous les âges 18-64 (TAUX_STANDARD) et pour
 * tous les âges 65-70 (TAUX_MAJORE, +10% — valeurs exactes reprises du
 * barème source, pas recalculées, pour éviter tout écart d'arrondi).
 * Ce fichier expanse ces 2 jeux de taux vers les 53 lignes (une par âge)
 * au format large (age, mois1..mois60) attendues par le seed.
 */

type RenacaTarifConstantRow = Omit<RenacaTarifConstant, 'id'>;

/** Taux décimal exact, âges 18 à 64 ans (une valeur par palier de 6 mois). */
const TAUX_STANDARD = [0.00196, 0.00371, 0.00545, 0.00720, 0.00894, 0.01069, 0.01243, 0.01418, 0.01592, 0.01767];

/** Taux décimal exact, âges 65 à 70 ans (majoration +10% déjà appliquée dans le barème source). */
const TAUX_MAJORE = [0.00216, 0.00408, 0.00600, 0.00792, 0.00983, 0.01176, 0.01367, 0.01560, 0.01751, 0.01944];

const AGE_MIN = 18;
const AGE_MAX = 70;
const AGE_SEUIL_MAJORATION = 65;

/** Chaque palier (index 0-9) couvre 6 mois consécutifs : palier 0 = mois 1-6, palier 1 = mois 7-12, etc. */
function toWideRow(age: number, taux: number[]): RenacaTarifConstantRow {
  const row: any = { age };
  for (let mois = 1; mois <= 60; mois++) {
    const palierIndex = Math.floor((mois - 1) / 6);
    row[`mois${mois}`] = taux[palierIndex];
  }
  return row as RenacaTarifConstantRow;
}

export const RENACA_TARIF_CONSTANT_DATA: RenacaTarifConstantRow[] = [];

for (let age = AGE_MIN; age <= AGE_MAX; age++) {
  const taux = age >= AGE_SEUIL_MAJORATION ? TAUX_MAJORE : TAUX_STANDARD;
  RENACA_TARIF_CONSTANT_DATA.push(toWideRow(age, taux));
}
