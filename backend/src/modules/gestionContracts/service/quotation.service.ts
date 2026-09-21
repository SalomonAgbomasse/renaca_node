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

  // ==========================================================================
  // RENACA — Assurance Bouclier Emprunteurs (L'Africaine Vie)
  // ==========================================================================

  /** Accessoires RENACA : montant fixe, non saisi par l'utilisateur. */
  private static readonly ACCESSOIRES_RENACA = 1000;

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
   * Barème Tarif_1 (Capital Amortissable), format large (une colonne par mois) :
   * recherche la plus petite tranche de capital supérieure ou égale au capital
   * demandé (arrondi à la tranche supérieure quand le capital ne correspond à
   * aucune tranche exacte), puis lit la prime de la colonne mois{N} correspondante.
   */
  private async findPrimeAmortissable(capital: number, dureeMois: number): Promise<number | null> {
    const tier = await this.renacaTarifAmortissableRepository
      .createQueryBuilder('t')
      .where('t.capital >= :capital', { capital })
      .orderBy('t.capital', 'ASC')
      .getOne();

    if (!tier) {
      return null;
    }

    const prime = (tier as any)[`mois${dureeMois}`];
    return typeof prime === 'number' ? prime : null;
  }

  /**
   * Barème Tarif_PE (Capital Constant) : l'âge est toujours une correspondance
   * exacte (18 à 70 ans), aucun arrondi nécessaire. Retourne le taux décimal
   * exact (déjà converti depuis le pourcentage source, ex. 0.720% -> 0.0072).
   */
  private async findTauxConstant(age: number, dureeMois: number): Promise<number | null> {
    const row = await this.renacaTarifConstantRepository
      .createQueryBuilder('t')
      .where('t.age = :age', { age })
      .getOne();

    if (!row) {
      return null;
    }

    // Les colonnes decimal sont renvoyées en string par le driver MySQL (préservation de précision) :
    // conversion explicite requise, contrairement aux colonnes int du barème Amortissable.
    const taux = Number((row as any)[`mois${dureeMois}`]);
    return Number.isFinite(taux) ? taux : null;
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
    tauxSurprime: number = 0
  ): Promise<QuotationResponse> {
    const age = this.ageFromBirthdate(datenaiss);
    const eligibiliteError = this.eligibiliteRenaca(age, dureeMois, capital, 10000000);
    if (eligibiliteError) {
      return eligibiliteError;
    }

    const pd = await this.findPrimeAmortissable(capital, dureeMois);
    if (pd === null) {
      return { error: true, message: `Aucune prime de barème RENACA Tarif_1 ne correspond au capital ${capital} FCFA et à la durée ${dureeMois} mois.` };
    }

    const accessoires = QuotationService.ACCESSOIRES_RENACA;
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
    perteEmploiDemandee: boolean = false
  ): Promise<QuotationResponse> {
    if (perteEmploiDemandee) {
      return { error: true, message: "La Perte d'Emploi n'est pas disponible pour le produit RENACA Capital Constant." };
    }

    const age = this.ageFromBirthdate(datenaiss);
    const eligibiliteError = this.eligibiliteRenaca(age, dureeMois, capital, 20000000);
    if (eligibiliteError) {
      return eligibiliteError;
    }

    const taux = await this.findTauxConstant(age, dureeMois);
    if (taux === null) {
      return { error: true, message: `Aucun taux de barème RENACA Tarif_PE ne correspond à l'âge ${age} ans et à la durée ${dureeMois} mois.` };
    }

    const accessoires = QuotationService.ACCESSOIRES_RENACA;
    const pd = Math.round(capital * taux * 1.25);
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
    tauxSurprime?: number
  ): Promise<QuotationResponse> {
    const type = (typeCapital || '').toUpperCase();
    if (type === 'CONST') {
      return this.primeRenacaConstant(capital, datenaiss, dureeMois, perteEmploiDemandee);
    }
    return this.primeRenacaAmortissable(capital, datenaiss, dureeMois, perteEmploiDemandee, tauxSurprime);
  }
}
