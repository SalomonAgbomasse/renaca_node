import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RenacaTarifAmortissable } from '../entity/renaca-tarif-amortissable.entity';
import { RenacaTarifConstant } from '../entity/renaca-tarif-constant.entity';

export interface QuotationRequest {
  typeass: string;
  kal: number;
  gcompl: string;
  age: number;
  birthdate: string;
  duration: number;
}

export interface QuotationResponse {
  error: boolean;
  message?: string;
  fm?: number;
  pd?: number;
  pc?: number;
  acc?: number;
  surp?: number;
  puttc?: number;
  capital?: number;
  obaOptions?: any;
  primePE?: number;
}

@Injectable()
export class QuotationService {
  constructor(
    @InjectRepository(RenacaTarifAmortissable)
    private renacaTarifAmortissableRepository: Repository<RenacaTarifAmortissable>,
    @InjectRepository(RenacaTarifConstant)
    private renacaTarifConstantRepository: Repository<RenacaTarifConstant>,
  ) {}

  /**
   * Calculer l'âge à partir de la date de naissance
   */
  public ageFromBirthdate(birthdate: string): number {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    return age;
  }

  public ageSortieFromBirthdate(birthdate: string, duration: number): number {
    const age = this.ageFromBirthdate(birthdate);
    const ageSortie = age + ((duration % 12 === 0) ? duration / 12 : Math.floor(duration / 12) + 1);
    return ageSortie;
  }

  /**
   * Arrondir à l'unité près
   */
  private arrondirAUnitePres(nombre: number): number {
    if (typeof nombre === 'number') {
      if (nombre % 1 !== 0) {
        return Math.round(nombre);
      }
      return nombre;
    }
    return 0;
  }

  /**
   * Arrondir intelligemment à la cinquantaine
   */
  private arrondiCinquantaineIntelligente(nombre: number): number {
    const derniersChiffres = nombre % 100;
    
    if (derniersChiffres === 0 || derniersChiffres === 50 || derniersChiffres === 25 || derniersChiffres === 75) {
      return nombre;
    } else if (derniersChiffres > 0 && derniersChiffres < 25) {
      return nombre - derniersChiffres + 25;
    } else if (derniersChiffres > 25 && derniersChiffres < 50) {
      return nombre - derniersChiffres + 50;
    } else if (derniersChiffres > 50 && derniersChiffres < 75) {
      return nombre - derniersChiffres + 75;
    } else {
      return nombre - derniersChiffres + 100;
    }
  }

  /**
   * Calculer la prime PADME (PADME_FNDA)
   * Redirige vers la bonne fonction selon le type de crédit
   */
  public async primePADME(
    kal: number | string,
    datenaiss: string,
    duree: number,
    periodicite: number,
    datecredit: string,
    differe: number,
    creditType?: string,
    obaOptions?: any
  ): Promise<QuotationResponse> {
    const numKal = Number(kal) || 0;
    const type = (creditType || 'AMORT').toUpperCase();
    if (type === 'CP') {
      return this.primeCompteParraine(numKal, datenaiss, duree);
    } else if (type === 'OBA') {
      return this.primeObsequesAlafia(numKal, datenaiss, duree, obaOptions);
    }
    return this.primeAmortissable(numKal, datenaiss, duree, periodicite, datecredit, differe);
  }

  /**
   * Calculer la prime pour PADME PROTECTION (CP)
   */
  public async primeCompteParraine(
    kal: number,
    datenaiss: string,
    duree: number
  ): Promise<QuotationResponse> {
    const age = this.ageFromBirthdate(datenaiss);
    
    // Validation de l'âge (18 à 75 ans)
    if (age < 18 || age > 75) {
      return {
        error: true,
        message: `L'âge de l'assuré (${age} ans) doit être compris entre 18 et 75 ans pour PADME PROTECTION.`
      };
    }

    // Validation de la durée (1 à 12 mois)
    if (duree < 1 || duree > 12) {
      return {
        error: true,
        message: `La durée pour PADME PROTECTION (${duree} mois) doit être comprise entre 1 et 12 mois.`
      };
    }



    const numKal = Number(kal) || 0;
    let annualPremium = 0;
    if (numKal === 500000) {
      annualPremium = (age >= 18 && age <= 64) ? 2000 : 2500;
    } else if (numKal === 1000000) {
      annualPremium = (age >= 18 && age <= 64) ? 4000 : 4500;
    } else {
      return {
        error: true,
        message: `Option de capital invalide (${kal} FCFA) pour PADME PROTECTION.`
      };
    }

    //const proration = duree / 12;
    //let puttc = annualPremium * proration;
    let puttc = annualPremium;
    puttc = this.arrondiCinquantaineIntelligente(this.arrondirAUnitePres(puttc));

    return {
      error: false,
      puttc,
      surp: 0,
      fm: 0,
      acc: 0,
      pd: puttc,
      pc: 0
    };
  }

  /**
   * Calculer la prime pour Obsèques Alafia (OBA)
   */
  public async primeObsequesAlafia(
    kal: number,
    datenaiss: string,
    duree: number,
    obaOptions?: any
  ): Promise<QuotationResponse> {
    // If obaOptions is not provided or is empty, fallback to the old logic based on kal (backward compatibility)
    let options = obaOptions;
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        options = null;
      }
    }

    if (!options || Object.keys(options).length === 0) {
      const age = this.ageFromBirthdate(datenaiss);
      if (age < 18 || age > 75) {
        return {
          error: true,
          message: `L'âge de l'assuré (${age} ans) doit être compris entre 18 et 75 ans pour Obsèques Alafia.`
        };
      }

      const numKal = Number(kal) || 0;
      let annualPremium = 0;
      if (numKal === 1000000) {
        annualPremium = 4000;
      } else if (numKal === 2000000) {
        annualPremium = 10000;
      } else {
        return {
          error: true,
          message: `Option de capital invalide (${kal} FCFA) pour Obsèques Alafia.`
        };
      }

      let puttc = annualPremium;
      puttc = this.arrondiCinquantaineIntelligente(this.arrondirAUnitePres(puttc));

      return {
        error: false,
        puttc,
        surp: 0,
        fm: 0,
        acc: 0,
        pd: puttc,
        pc: 0,
        capital: kal
      };
    }

    // New combinatorial logic based on checkboxes
    const config: { [key: string]: { label: string, capital: number, premium: number, maxSubAge: number, maxEchAge: number } } = {
      assure: { label: "l'Assuré", capital: 500000, premium: 2000, maxSubAge: 65, maxEchAge: 66 },
      conjoint: { label: "le (la) Conjoint(e)", capital: 500000, premium: 2000, maxSubAge: 65, maxEchAge: 66 },
      ascendant1: { label: "Père Assuré", capital: 500000, premium: 2500, maxSubAge: 75, maxEchAge: 76 },
      ascendant2: { label: "Mère Assuré", capital: 500000, premium: 2500, maxSubAge: 75, maxEchAge: 76 },
      ascendant3: { label: "Père du (de la) Conjoint(e)", capital: 500000, premium: 2500, maxSubAge: 75, maxEchAge: 76 },
      ascendant4: { label: "Mère du (de la) Conjoint(e)", capital: 500000, premium: 2500, maxSubAge: 75, maxEchAge: 76 }
    };

    let totalCapital = 0;
    let totalPremium = 0;
    let checkedCount = 0;

    for (const key of Object.keys(config)) {
      const opt = options[key];
      if (opt && (opt.checked === true || opt.checked === 'true')) {
        checkedCount++;
        const cfg = config[key];
        totalCapital += cfg.capital;
        totalPremium += cfg.premium;
        opt.prime = cfg.premium;

        // Validation date de naissance
        const bdate = opt.birthdate;
        if (!bdate) {
          return {
            error: true,
            message: `La date de naissance est obligatoire pour l'option ${cfg.label}.`
          };
        }

        const age = this.ageFromBirthdate(bdate);
        if (age < 18) {
          return {
            error: true,
            message: `L'âge pour ${cfg.label} (${age} ans) doit être d'au moins 18 ans.`
          };
        }
        if (age > cfg.maxSubAge) {
          return {
            error: true,
            message: `L'âge maximum à la souscription pour ${cfg.label} est de ${cfg.maxSubAge} ans (âge fourni : ${age} ans).`
          };
        }

        const ageSortie = this.ageSortieFromBirthdate(bdate, duree);
        if (ageSortie > cfg.maxEchAge) {
          return {
            error: true,
            message: `L'âge maximum à l'échéance pour ${cfg.label} est de ${cfg.maxEchAge} ans (âge à l'échéance : ${ageSortie} ans).`
          };
        }
      }
    }

    if (checkedCount === 0) {
      return {
        error: true,
        message: "Vous devez cocher au moins une option pour Obsèques Alafia."
      };
    }

    if (totalPremium < 2000 || totalPremium > 14000) {
      return {
        error: true,
        message: `La prime cumulée (${totalPremium} FCFA) doit être comprise entre 2 000 FCFA et 14 000 FCFA.`
      };
    }

    let puttc = totalPremium;
    puttc = this.arrondiCinquantaineIntelligente(this.arrondirAUnitePres(puttc));

    return {
      error: false,
      puttc,
      surp: 0,
      fm: 0,
      acc: 0,
      pd: puttc,
      pc: 0,
      capital: totalCapital,
      obaOptions: options
    };
  }

  /**
   * Calculer la prime Amortissable standard (AMORT)
   */
  public async primeAmortissable(
    kal: number,
    datenaiss: string,
    duree: number,
    periodicite: number,
    datecredit: string,
    differe: number
  ): Promise<QuotationResponse> {
    const age = this.ageFromBirthdate(datenaiss);
    const acc = 1500;
    let taux = 0;
    let msg = '';

    // Table de taux par périodicité et tranche d'âge
    const tauxMap: { [key: string]: { [key: string]: [number, number][] } } = {
      '1': {
        '18-65': [
          [6, 0.00153],
          [12, 0.002975],
          [18, 0.00383],
          [24, 0.0045],
          [36, 0.00468],
          [48, 0.0055],
          [60, 0.01445]
        ],
        '65-70': [
          [6, 0.009],
          [12, 0.009]
        ]
      },
      '2': {
        '18-65': [
          [6, 0.0015606],
          [12, 0.0030345],
          [18, 0.0039066],
          [24, 0.00459],
          [36, 0.0047736],
          [48, 0.00561],
          [60, 0.014739]
        ],
        '65-70': [
          [6, 0.00918],
          [12, 0.00918]
        ]
      },
      '3': {
        '18-65': [
          [6, 0.0015759],
          [12, 0.00306425],
          [18, 0.0039449],
          [24, 0.004635],
          [36, 0.0048204],
          [48, 0.005665],
          [60, 0.0148835]
        ],
        '65-70': [
          [6, 0.00927],
          [12, 0.00927]
        ]
      },
      '4': {
        '18-65': [
          [6, 0.0015912],
          [12, 0.003094],
          [18, 0.0039832],
          [24, 0.00468],
          [36, 0.0048672],
          [48, 0.00572],
          [60, 0.015028]
        ],
        '65-70': [
          [6, 0.00936],
          [12, 0.00936]
        ]
      },
      '5': {
        '18-65': [
          [6, 0.0016065],
          [12, 0.00312375],
          [18, 0.0040215],
          [24, 0.004725],
          [36, 0.004914],
          [48, 0.005775],
          [60, 0.0151725]
        ],
        '65-70': [
          [6, 0.00945],
          [12, 0.00945]
        ]
      },
      '6': {
        '18-65': [
          [6, 0.0016218],
          [12, 0.0031535],
          [18, 0.0040598],
          [24, 0.00477],
          [36, 0.0049608],
          [48, 0.00583],
          [60, 0.015317]
        ],
        '65-70': [
          [6, 0.00954],
          [12, 0.00954]
        ]
      },
      '12': {
        '18-65': [
          [6, 0.001683],
          [12, 0.0032725],
          [18, 0.004213],
          [24, 0.00495],
          [36, 0.005148],
          [48, 0.00605],
          [60, 0.015895]
        ],
        '65-70': [
          [6, 0.0099],
          [12, 0.0099]
        ]
      }
    };

    // Déterminer la tranche d'âge
    // Initialiser pour éviter l'erreur TS2454 (utilisation avant assignation)
    let ageGroup: string = '';
    if (age >= 18 && age < 65) {
      ageGroup = '18-65';
    } else if (age >= 65 && age <= 70) {
      ageGroup = '65-70';
    } else {
      msg = 'AGE_ERROR';
    }

    // Chercher le taux correspondant
    if (!msg && ageGroup && tauxMap[periodicite.toString()] && tauxMap[periodicite.toString()][ageGroup]) {
      const ranges = tauxMap[periodicite.toString()][ageGroup];
      for (const range of ranges) {
        if (duree <= range[0]) {
          taux = range[1];
          break;
        }
      }
      if (taux === 0) {
        msg = 'DURATION_ERROR';
      }
    } else if (!msg) {
      msg = 'DURATION_ERROR';
    }

    // Gestion des erreurs
    if (msg === 'AGE_ERROR') {
      return {
        error: true,
        message: `Revoir l'âge de ${age} ans. L'âge mini = 18 ans et âge max 70 ans`
      };
    } else if (msg === 'DURATION_ERROR') {
      return {
        error: true,
        message: `Revoir la durée ${duree} mois ! Durée maximale 60 mois =>18-65 ans et 12 mois => 65-70 ans. Age actuel : ${age} ans`
      };
    } else if (kal > 10000000) {
      return {
        error: true,
        message: 'Le capital ne peut être supérieur à 10 000 000 FCFA'
      };
    }

    // Calcul de la prime
    const surp = 0;
    const fm = 0;
    const pc = 0;

    console.log('taux', taux);
    console.log('differe', differe);
    console.log('acc', acc);
    console.log('kal', kal);
    
    let puttc: number;
    if (differe !== 0) {
      puttc = (kal * taux * 1.5) + acc;
    } else {
      puttc = (kal * taux) + acc;
    }

    const puttcInter = this.arrondiCinquantaineIntelligente(this.arrondirAUnitePres(puttc));

    return {
      error: false,
      puttc: puttcInter,
      surp,
      fm,
      acc,
      pd: puttcInter - acc,
      pc
    };
  }

  // ==========================================================================
  // RENACA — Assurance Bouclier Emprunteurs (L'Africaine Vie)
  // Moteur de calcul indépendant de primePADME et de ses 3 sous-fonctions :
  // aucun code partagé, aucune modification du chemin PADME existant.
  // ==========================================================================

  /**
   * Vérifie les règles d'éligibilité communes aux deux produits RENACA :
   * âge >= 18, âge + durée en années <= 70, durée 1-60 mois, capital <= plafond du produit.
   */
  private eligibiliteRenaca(
    age: number,
    dureeMois: number,
    capital: number,
    capitalMax: number
  ): { error: true; message: string } | null {
    if (dureeMois < 1 || dureeMois > 60) {
      return { error: true, message: `La durée (${dureeMois} mois) doit être comprise entre 1 et 60 mois.` };
    }
    if (age < 18) {
      return { error: true, message: `L'âge de l'assuré (${age} ans) doit être d'au moins 18 ans.` };
    }
    const dureeAnnees = Math.ceil(dureeMois / 12);
    if (age + dureeAnnees > 70) {
      return { error: true, message: `Âge limite atteint : ${age} ans + ${dureeAnnees} an(s) de durée dépasse 70 ans.` };
    }
    if (capital <= 0 || capital > capitalMax) {
      return { error: true, message: `Le capital (${capital} FCFA) doit être compris entre 1 et ${capitalMax} FCFA.` };
    }
    return null;
  }

  /**
   * Barème Tarif_1 (Capital Amortissable) : recherche la plus petite tranche de
   * capital supérieure ou égale au capital demandé (arrondi à la tranche
   * supérieure quand le capital ne correspond à aucune tranche exacte).
   */
  private async findTierAmortissable(capital: number, dureeMois: number): Promise<RenacaTarifAmortissable | null> {
    return this.renacaTarifAmortissableRepository
      .createQueryBuilder('t')
      .where('t.capital >= :capital', { capital })
      .andWhere('t.dureeMoisMin <= :duree AND t.dureeMoisMax >= :duree', { duree: dureeMois })
      .orderBy('t.capital', 'ASC')
      .getOne();
  }

  /**
   * Barème Tarif_PE (Capital Constant) : l'âge est toujours une correspondance
   * exacte (18 à 70 ans), aucun arrondi nécessaire.
   */
  private async findTauxConstant(age: number, dureeMois: number): Promise<RenacaTarifConstant | null> {
    return this.renacaTarifConstantRepository
      .createQueryBuilder('t')
      .where('t.age = :age', { age })
      .andWhere('t.dureeMoisMin <= :duree AND t.dureeMoisMax >= :duree', { duree: dureeMois })
      .getOne();
  }

  /**
   * Prime RENACA — Capital Amortissable.
   * Prime Unique TTC = Prime Décès (barème Tarif_1) + Surprime + Perte d'Emploi + Accessoires.
   */
  public async primeRenacaAmortissable(
    capital: number,
    datenaiss: string,
    dureeMois: number,
    perteEmploiDemandee: boolean = false,
    tauxSurprime: number = 0,
    accessoires?: number
  ): Promise<QuotationResponse> {
    if (accessoires === undefined || accessoires === null) {
      return { error: true, message: 'Le montant des accessoires est obligatoire pour le produit RENACA Amortissable.' };
    }

    const age = this.ageFromBirthdate(datenaiss);
    const eligibiliteError = this.eligibiliteRenaca(age, dureeMois, capital, 10000000);
    if (eligibiliteError) {
      return eligibiliteError;
    }

    const tier = await this.findTierAmortissable(capital, dureeMois);
    if (!tier) {
      return { error: true, message: `Aucune tranche de barème RENACA Tarif_1 ne correspond au capital ${capital} FCFA et à la durée ${dureeMois} mois.` };
    }

    const pd = tier.primeDeces;
    const primePE = perteEmploiDemandee && age <= 59
      ? Math.round(0.00066 * dureeMois * Math.min(capital, 1000000))
      : 0;
    const surp = Math.round(pd * (tauxSurprime || 0));
    const puttc = pd + surp + primePE + accessoires;

    return {
      error: false,
      pd,
      surp,
      primePE,
      acc: accessoires,
      fm: 0,
      pc: 0,
      puttc,
      capital
    };
  }

  /**
   * Prime RENACA — Capital Constant.
   * Prime Unique TTC = (Capital x Taux Tarif_PE x 1,25) + Accessoires.
   * La Perte d'Emploi est interdite pour ce produit — demande refusée, pas ignorée.
   */
  public async primeRenacaConstant(
    capital: number,
    datenaiss: string,
    dureeMois: number,
    perteEmploiDemandee: boolean = false,
    accessoires?: number
  ): Promise<QuotationResponse> {
    if (perteEmploiDemandee) {
      return { error: true, message: "La Perte d'Emploi n'est pas disponible pour le produit RENACA Capital Constant." };
    }
    if (accessoires === undefined || accessoires === null) {
      return { error: true, message: 'Le montant des accessoires est obligatoire pour le produit RENACA Constant.' };
    }

    const age = this.ageFromBirthdate(datenaiss);
    const eligibiliteError = this.eligibiliteRenaca(age, dureeMois, capital, 20000000);
    if (eligibiliteError) {
      return eligibiliteError;
    }

    const tauxRow = await this.findTauxConstant(age, dureeMois);
    if (!tauxRow) {
      return { error: true, message: `Aucun taux de barème RENACA Tarif_PE ne correspond à l'âge ${age} ans et à la durée ${dureeMois} mois.` };
    }

    const pd = Math.round(capital * (tauxRow.tauxPourMille / 1000) * 1.25);
    const puttc = pd + accessoires;

    return {
      error: false,
      pd,
      surp: 0,
      primePE: 0,
      acc: accessoires,
      fm: 0,
      pc: 0,
      puttc,
      capital
    };
  }

  /**
   * Calculer la prime RENACA — redirige vers la bonne fonction selon le type de capital.
   */
  public async primeRENACA(
    typeCapital: 'AMORT' | 'CONST',
    capital: number,
    datenaiss: string,
    dureeMois: number,
    perteEmploiDemandee?: boolean,
    tauxSurprime?: number,
    accessoires?: number
  ): Promise<QuotationResponse> {
    const type = (typeCapital || '').toUpperCase();
    if (type === 'CONST') {
      return this.primeRenacaConstant(capital, datenaiss, dureeMois, perteEmploiDemandee, accessoires);
    }
    return this.primeRenacaAmortissable(capital, datenaiss, dureeMois, perteEmploiDemandee, tauxSurprime, accessoires);
  }
}
