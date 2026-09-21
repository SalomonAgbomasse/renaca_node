/**
 * Barème RENACA "Tarif_1" — Capital Amortissable (primes en FCFA).
 * Source : Tarif_1.md (23 tranches de capital x 10 paliers de durée de 6 mois).
 * Chaque ligne de TIERS reproduit exactement une ligne du barème source ;
 * ce fichier ne fait qu'expanser ces lignes vers les 230 enregistrements
 * (capital, dureeMoisMin, dureeMoisMax, primeDeces) attendus par le seed.
 */

export interface RenacaTarifAmortissableRow {
  capital: number;
  dureeMoisMin: number;
  dureeMoisMax: number;
  primeDeces: number;
}

/** Paliers de durée de 6 mois, de 1-6 à 55-60. */
const PALIERS: Array<[number, number]> = [
  [1, 6], [7, 12], [13, 18], [19, 24], [25, 30],
  [31, 36], [37, 42], [43, 48], [49, 54], [55, 60],
];

/** Une ligne = une tranche de capital + ses 10 primes (une par palier), dans l'ordre des PALIERS. */
const TIERS: Array<{ capital: number; primes: number[] }> = [
  { capital: 125000, primes: [1425, 2090, 2927, 3634, 4596, 5344, 6475, 7220, 8010, 8799] },
  { capital: 250000, primes: [1425, 2090, 2927, 3634, 4596, 5344, 6475, 7220, 8010, 8799] },
  { capital: 500000, primes: [1425, 2090, 2927, 3634, 4596, 5344, 6475, 7220, 8010, 8799] },
  { capital: 1000000, primes: [2090, 3420, 5047, 6460, 8336, 9832, 11958, 13537, 15117, 16696] },
  { capital: 2000000, primes: [3420, 6080, 9286, 12112, 15817, 18810, 23014, 26172, 29331, 32490] },
  { capital: 3000000, primes: [4750, 8740, 13526, 17765, 23299, 27787, 34069, 38808, 43546, 48284] },
  { capital: 4000000, primes: [6080, 11400, 17765, 23418, 30780, 36765, 45125, 51442, 57760, 64078] },
  { capital: 5000000, primes: [7410, 14060, 22004, 29070, 38261, 45742, 56181, 64078, 71974, 79871] },
  { capital: 6000000, primes: [8740, 16720, 26244, 34722, 45742, 54720, 67236, 76712, 86189, 95665] },
  { capital: 7000000, primes: [10070, 19380, 30483, 40375, 53224, 63698, 78292, 89348, 100403, 111459] },
  { capital: 8000000, primes: [11400, 22040, 34722, 46028, 60705, 72675, 89348, 101982, 114618, 127252] },
  { capital: 9000000, primes: [12730, 24700, 38962, 51680, 68186, 81652, 100403, 114617, 128832, 143046] },
  { capital: 10000000, primes: [14060, 27360, 43201, 57332, 75668, 90630, 111459, 127252, 143046, 158840] },
  { capital: 11000000, primes: [15390, 30020, 47441, 62985, 83149, 99607, 122514, 139888, 157261, 174634] },
  { capital: 12000000, primes: [16720, 32680, 51680, 68638, 90630, 108585, 133570, 152522, 171475, 190428] },
  { capital: 13000000, primes: [18050, 35340, 55919, 74290, 98111, 117562, 144626, 165158, 185689, 206221] },
  { capital: 14000000, primes: [19380, 38000, 60159, 79942, 105592, 126540, 155681, 177792, 199904, 222015] },
  { capital: 15000000, primes: [20710, 40660, 64398, 85595, 113074, 135518, 166737, 190428, 214118, 237809] },
  { capital: 16000000, primes: [22040, 43320, 68638, 91248, 120555, 144495, 177792, 203062, 228332, 253602] },
  { capital: 17000000, primes: [23370, 45980, 72877, 96900, 128036, 153472, 188848, 215698, 242547, 269396] },
  { capital: 18000000, primes: [24700, 48640, 77116, 102552, 135518, 162450, 199904, 228332, 256761, 285190] },
  { capital: 19000000, primes: [26030, 51300, 81356, 108205, 142999, 171428, 210959, 240967, 270976, 300984] },
  { capital: 20000000, primes: [27360, 53960, 85595, 113858, 150480, 180405, 222015, 253602, 285190, 316778] },
];

export const RENACA_TARIF_AMORTISSABLE_DATA: RenacaTarifAmortissableRow[] = TIERS.flatMap(
  ({ capital, primes }) =>
    PALIERS.map(([dureeMoisMin, dureeMoisMax], index) => ({
      capital,
      dureeMoisMin,
      dureeMoisMax,
      primeDeces: primes[index],
    })),
);
