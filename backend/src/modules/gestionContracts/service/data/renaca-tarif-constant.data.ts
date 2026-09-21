/**
 * Barème RENACA "Tarif_PE" — Capital Constant (taux pour mille).
 * Source : Tarif_PE.md (âges 18 à 70 x 10 paliers de durée de 6 mois).
 * Les taux sont identiques pour tous les âges 18-64 (TAUX_STANDARD) et pour
 * tous les âges 65-70 (TAUX_MAJORE, +10% — valeurs exactes reprises du
 * barème source, pas recalculées, pour éviter tout écart d'arrondi).
 * Ce fichier expanse ces 2 jeux de taux vers les 530 enregistrements
 * (age, dureeMoisMin, dureeMoisMax, tauxPourMille) attendus par le seed.
 */

export interface RenacaTarifConstantRow {
  age: number;
  dureeMoisMin: number;
  dureeMoisMax: number;
  tauxPourMille: number;
}

/** Paliers de durée de 6 mois, de 1-6 à 55-60 — identiques à Tarif_1. */
const PALIERS: Array<[number, number]> = [
  [1, 6], [7, 12], [13, 18], [19, 24], [25, 30],
  [31, 36], [37, 42], [43, 48], [49, 54], [55, 60],
];

/** Taux pour mille, âges 18 à 64 ans (une valeur par palier, dans l'ordre des PALIERS). */
const TAUX_STANDARD = [0.196, 0.371, 0.545, 0.720, 0.894, 1.069, 1.243, 1.418, 1.592, 1.767];

/** Taux pour mille, âges 65 à 70 ans (majoration +10% déjà appliquée dans le barème source). */
const TAUX_MAJORE = [0.216, 0.408, 0.600, 0.792, 0.983, 1.176, 1.367, 1.560, 1.751, 1.944];

const AGE_MIN = 18;
const AGE_MAX = 70;
const AGE_SEUIL_MAJORATION = 65;

export const RENACA_TARIF_CONSTANT_DATA: RenacaTarifConstantRow[] = [];

for (let age = AGE_MIN; age <= AGE_MAX; age++) {
  const taux = age >= AGE_SEUIL_MAJORATION ? TAUX_MAJORE : TAUX_STANDARD;
  PALIERS.forEach(([dureeMoisMin, dureeMoisMax], index) => {
    RENACA_TARIF_CONSTANT_DATA.push({
      age,
      dureeMoisMin,
      dureeMoisMax,
      tauxPourMille: taux[index],
    });
  });
}
