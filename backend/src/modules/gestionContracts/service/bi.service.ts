import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entity/contract.entity';
import { Customer } from '../entity/customer.entity';
import { Agency } from '../entity/agency.entity';
import { User } from '../../gestionUsers/entity/user.entity';
import { Cotation } from '../entity/cotation.entity';
import { AlertThreshold } from '../entity/alert-threshold.entity';
import { PdfService } from '../../../services/pdf.service';
import { ExcelService } from '../../../services/excel.service';

export interface BiFilters {
  dateDebut?: string;
  dateFin?: string;
  agenceId?: number;
  userId?: number;
  natureCreditId?: number;
  contractType?: string;
}

@Injectable()
export class BiService {
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Agency)
    private agencyRepo: Repository<Agency>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Cotation)
    private cotationRepo: Repository<Cotation>,
    @InjectRepository(AlertThreshold)
    private alertThresholdRepo: Repository<AlertThreshold>,
    private pdfService: PdfService,
    private excelService: ExcelService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  private applyFilters(qb: any, filters: BiFilters, alias = 'contract') {
    if (filters.dateDebut && filters.dateFin) {
      qb.andWhere(`${alias}.createdAt BETWEEN :dateDebut AND :dateFin`, {
        dateDebut: filters.dateDebut,
        dateFin: filters.dateFin,
      });
    }
    if (filters.agenceId) {
      qb.andWhere(`${alias}.idAgency = :agenceId`, { agenceId: filters.agenceId });
    }
    if (filters.userId) {
      qb.andWhere(`${alias}.idUser = :userId`, { userId: filters.userId });
    }
    if (filters.natureCreditId) {
      qb.andWhere(`${alias}.idNatureCredit = :natureCreditId`, { natureCreditId: filters.natureCreditId });
    }
    if (filters.contractType) {
      qb.andWhere(`${alias}.contractType = :contractType`, { contractType: filters.contractType });
    }
  }

  private applyRoleFilter(qb: any, user: any, alias = 'contract') {
    if (!user) return;
    const role = (typeof user.role === 'object' ? user.role?.libelle : user.role) || '';
    const roleUpper = role.toUpperCase();
    const isGlobalRole = ['ADMIN', 'SUPER ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(roleUpper) || user.idRole === 1 || user.idRole === 2 || user.idRole === 5;
    if (!isGlobalRole && user.idAgency) {
      qb.andWhere(`${alias}.idAgency = :userAgency`, { userAgency: user.idAgency });
    }
  }

  private getPreviousPeriod(filters: BiFilters): BiFilters {
    if (!filters.dateDebut || !filters.dateFin) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { ...filters, dateDebut: start.toISOString(), dateFin: end.toISOString() };
    }
    const start = new Date(filters.dateDebut);
    const end = new Date(filters.dateFin);
    const diff = end.getTime() - start.getTime();
    return {
      ...filters,
      dateDebut: new Date(start.getTime() - diff).toISOString(),
      dateFin: new Date(start.getTime() - 1).toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // KPIs OVERVIEW
  // ─────────────────────────────────────────────────────────────

  async getKPIsOverview(filters: BiFilters, user?: any) {
    const prevFilters = this.getPreviousPeriod(filters);

    const buildContractQuery = (f: BiFilters) => {
      const qb = this.contractRepo.createQueryBuilder('contract').where('contract.isActive = true');
      this.applyFilters(qb, f);
      this.applyRoleFilter(qb, user);
      return qb;
    };

    const buildCotationQuery = (f: BiFilters) => {
      const qb = this.cotationRepo.createQueryBuilder('cotation');
      if (f.dateDebut && f.dateFin) {
        qb.andWhere('cotation.dateSaisie BETWEEN :dateDebut AND :dateFin', { dateDebut: f.dateDebut, dateFin: f.dateFin });
      }
      if (f.agenceId) qb.andWhere('cotation.idAgency = :agenceId', { agenceId: f.agenceId });
      if (f.userId) qb.andWhere('cotation.idUser = :userId', { userId: f.userId });
      return qb;
    };

    // Période courante
    const [
      totalContrats,
      primesResult,
      capitalResult,
      totalCotations,
    ] = await Promise.all([
      buildContractQuery(filters).getCount(),
      buildContractQuery(filters).select('SUM(contract.puttc)', 'total').getRawOne(),
      buildContractQuery(filters).select('SUM(contract.capital)', 'total').getRawOne(),
      buildCotationQuery(filters).getCount(),
    ]);

    // Période précédente
    const [prevContrats, prevPrimesResult, prevCapitalResult, prevCotations] = await Promise.all([
      buildContractQuery(prevFilters).getCount(),
      buildContractQuery(prevFilters).select('SUM(contract.puttc)', 'total').getRawOne(),
      buildContractQuery(prevFilters).select('SUM(contract.capital)', 'total').getRawOne(),
      buildCotationQuery(prevFilters).getCount(),
    ]);

    const totalPrimes = parseFloat(primesResult?.total) || 0;
    const prevPrimes = parseFloat(prevPrimesResult?.total) || 0;
    const totalCapital = parseFloat(capitalResult?.total) || 0;
    const prevCapital = parseFloat(prevCapitalResult?.total) || 0;

    const tauxTransformation = totalCotations > 0 ? (totalContrats / totalCotations) * 100 : 0;
    const prevTauxTransformation = prevCotations > 0 ? (prevContrats / prevCotations) * 100 : 0;

    const pct = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    return {
      contrats: { current: totalContrats, previous: prevContrats, pct: pct(totalContrats, prevContrats) },
      cotations: { current: totalCotations, previous: prevCotations, pct: pct(totalCotations, prevCotations) },
      primes: { current: totalPrimes, previous: prevPrimes, pct: pct(totalPrimes, prevPrimes) },
      capital: { current: totalCapital, previous: prevCapital, pct: pct(totalCapital, prevCapital) },
      tauxTransformation: {
        current: Math.round(tauxTransformation * 10) / 10,
        previous: Math.round(prevTauxTransformation * 10) / 10,
        pct: pct(tauxTransformation, prevTauxTransformation),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // ÉVOLUTION MENSUELLE
  // ─────────────────────────────────────────────────────────────

  async getMonthlyEvolution(months = 12, filters: BiFilters, user?: any) {
    const labels: string[] = [];
    const contrats: number[] = [];
    const primes: number[] = [];
    const cotations: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      labels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));

      const mFilters = { ...filters, dateDebut: start.toISOString(), dateFin: end.toISOString() };

      const contractQb = this.contractRepo.createQueryBuilder('contract')
        .where('contract.isActive = true')
        .andWhere('contract.createdAt BETWEEN :s AND :e', { s: start, e: end });
      this.applyRoleFilter(contractQb, user);
      if (filters.agenceId) contractQb.andWhere('contract.idAgency = :aid', { aid: filters.agenceId });

      const [cnt, primeRes, cotCount] = await Promise.all([
        contractQb.getCount(),
        contractQb.clone().select('SUM(contract.puttc)', 'total').getRawOne(),
        this.cotationRepo.createQueryBuilder('c')
          .where('c.dateSaisie BETWEEN :s AND :e', { s: start, e: end })
          .getCount(),
      ]);

      contrats.push(cnt);
      primes.push(parseFloat(primeRes?.total) || 0);
      cotations.push(cotCount);
    }

    return { labels, contrats, primes, cotations };
  }

  // ─────────────────────────────────────────────────────────────
  // SEGMENTATION CLIENTS
  // ─────────────────────────────────────────────────────────────

  async getClientSegmentation(axe: 'age' | 'gender' | 'occupation' | 'capital', filters: BiFilters, user?: any) {
    const qb = this.contractRepo.createQueryBuilder('contract')
      .innerJoin('contract.customer', 'customer')
      .where('contract.isActive = true');
    this.applyFilters(qb, filters);
    this.applyRoleFilter(qb, user);

    if (axe === 'gender') {
      qb.select('customer.gender', 'segment')
        .addSelect('COUNT(contract.id)', 'count')
        .addSelect('AVG(contract.puttc)', 'avgPrime')
        .addSelect('AVG(contract.capital)', 'avgCapital')
        .addSelect('AVG(contract.duration)', 'avgDuration')
        .groupBy('customer.gender');

      const data = await qb.getRawMany();
      return data.map(d => ({
        segment: d.segment === 'M' ? 'Homme' : d.segment === 'F' ? 'Femme' : 'Non défini',
        count: parseInt(d.count, 10),
        avgPrime: Math.round(parseFloat(d.avgPrime) || 0),
        avgCapital: Math.round(parseFloat(d.avgCapital) || 0),
        avgDuration: Math.round(parseFloat(d.avgDuration) || 0),
      }));
    }

    if (axe === 'age') {
      qb.select(`
        CASE
          WHEN TIMESTAMPDIFF(YEAR, customer.birthdate, NOW()) < 25 THEN 'Moins de 25 ans'
          WHEN TIMESTAMPDIFF(YEAR, customer.birthdate, NOW()) BETWEEN 25 AND 34 THEN '25-34 ans'
          WHEN TIMESTAMPDIFF(YEAR, customer.birthdate, NOW()) BETWEEN 35 AND 44 THEN '35-44 ans'
          WHEN TIMESTAMPDIFF(YEAR, customer.birthdate, NOW()) BETWEEN 45 AND 54 THEN '45-54 ans'
          ELSE '55 ans et +'
        END`, 'segment')
        .addSelect('COUNT(contract.id)', 'count')
        .addSelect('AVG(contract.puttc)', 'avgPrime')
        .addSelect('AVG(contract.capital)', 'avgCapital')
        .groupBy('segment');

      const data = await qb.getRawMany();
      const order = ['Moins de 25 ans', '25-34 ans', '35-44 ans', '45-54 ans', '55 ans et +'];
      return data
        .sort((a, b) => order.indexOf(a.segment) - order.indexOf(b.segment))
        .map(d => ({
          segment: d.segment,
          count: parseInt(d.count, 10),
          avgPrime: Math.round(parseFloat(d.avgPrime) || 0),
          avgCapital: Math.round(parseFloat(d.avgCapital) || 0),
        }));
    }

    if (axe === 'occupation') {
      qb.select('customer.occupation', 'segment')
        .addSelect('COUNT(contract.id)', 'count')
        .addSelect('AVG(contract.puttc)', 'avgPrime')
        .addSelect('AVG(contract.capital)', 'avgCapital')
        .groupBy('customer.occupation')
        .orderBy('count', 'DESC')
        .limit(15);

      const data = await qb.getRawMany();
      return data.map(d => ({
        segment: d.segment || 'Non défini',
        count: parseInt(d.count, 10),
        avgPrime: Math.round(parseFloat(d.avgPrime) || 0),
        avgCapital: Math.round(parseFloat(d.avgCapital) || 0),
      }));
    }

    if (axe === 'capital') {
      qb.select(`
        CASE
          WHEN contract.capital < 1000000 THEN 'Moins de 1M'
          WHEN contract.capital BETWEEN 1000000 AND 5000000 THEN '1M - 5M'
          WHEN contract.capital BETWEEN 5000001 AND 10000000 THEN '5M - 10M'
          WHEN contract.capital BETWEEN 10000001 AND 50000000 THEN '10M - 50M'
          ELSE 'Plus de 50M'
        END`, 'segment')
        .addSelect('COUNT(contract.id)', 'count')
        .addSelect('AVG(contract.puttc)', 'avgPrime')
        .addSelect('AVG(contract.duration)', 'avgDuration')
        .groupBy('segment');

      const data = await qb.getRawMany();
      return data.map(d => ({
        segment: d.segment,
        count: parseInt(d.count, 10),
        avgPrime: Math.round(parseFloat(d.avgPrime) || 0),
        avgDuration: Math.round(parseFloat(d.avgDuration) || 0),
      }));
    }

    return [];
  }

  // ─────────────────────────────────────────────────────────────
  // ANALYSE COMMERCIALE — AGENCES
  // ─────────────────────────────────────────────────────────────

  async getAgencesPerformance(filters: BiFilters, user?: any) {
    const qb = this.contractRepo.createQueryBuilder('contract')
      .leftJoin('contract.agency', 'agency')
      .where('contract.isActive = true')
      .select('agency.id', 'agenceId')
      .addSelect('agency.name', 'agenceName')
      .addSelect('COUNT(contract.id)', 'contrats')
      .addSelect('SUM(contract.puttc)', 'primes')
      .addSelect('SUM(contract.capital)', 'capital')
      .addSelect('AVG(contract.puttc)', 'primeMoyenne')
      .addSelect('AVG(contract.duration)', 'dureeMoyenne')
      .groupBy('agency.id')
      .addGroupBy('agency.name')
      .orderBy('primes', 'DESC');

    this.applyFilters(qb, filters);
    this.applyRoleFilter(qb, user);

    const data = await qb.getRawMany();
    const totalPrimes = data.reduce((s, d) => s + (parseFloat(d.primes) || 0), 0);

    return data.map(d => ({
      agenceId: d.agenceId,
      agenceName: d.agenceName || 'Inconnue',
      contrats: parseInt(d.contrats, 10),
      primes: Math.round(parseFloat(d.primes) || 0),
      capital: Math.round(parseFloat(d.capital) || 0),
      primeMoyenne: Math.round(parseFloat(d.primeMoyenne) || 0),
      dureeMoyenne: Math.round(parseFloat(d.dureeMoyenne) || 0),
      partMarche: totalPrimes > 0 ? Math.round(((parseFloat(d.primes) || 0) / totalPrimes) * 1000) / 10 : 0,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // ANALYSE COMMERCIALE — CONSEILLERS
  // ─────────────────────────────────────────────────────────────

  async getConseillersPerformance(filters: BiFilters, user?: any) {
    const qb = this.contractRepo.createQueryBuilder('contract')
      .leftJoin('contract.user', 'u')
      .leftJoin('u.agency', 'agency')
      .where('contract.isActive = true')
      .select('u.id', 'userId')
      .addSelect('u.firstname', 'firstname')
      .addSelect('u.lastname', 'lastname')
      .addSelect('agency.name', 'agenceName')
      .addSelect('COUNT(contract.id)', 'contrats')
      .addSelect('SUM(contract.puttc)', 'primes')
      .addSelect('SUM(contract.capital)', 'capital')
      .addSelect('AVG(contract.puttc)', 'primeMoyenne')
      .groupBy('u.id')
      .addGroupBy('u.firstname')
      .addGroupBy('u.lastname')
      .addGroupBy('agency.name')
      .orderBy('primes', 'DESC')
      .limit(50);

    this.applyFilters(qb, filters);
    this.applyRoleFilter(qb, user);

    const data = await qb.getRawMany();
    const totalPrimes = data.reduce((s, d) => s + (parseFloat(d.primes) || 0), 0);

    // Cotations par conseiller pour taux de transformation
    const cotationsQb = this.cotationRepo.createQueryBuilder('cot')
      .select('cot.idUser', 'userId')
      .addSelect('COUNT(cot.id)', 'cotations')
      .groupBy('cot.idUser');
    if (filters.dateDebut && filters.dateFin) {
      cotationsQb.andWhere('cot.dateSaisie BETWEEN :s AND :e', { s: filters.dateDebut, e: filters.dateFin });
    }
    const cotByUser = await cotationsQb.getRawMany();
    const cotMap = new Map(cotByUser.map(c => [c.userId, parseInt(c.cotations, 10)]));

    return data.map((d, i) => {
      const cotationsCount = cotMap.get(d.userId) || 0;
      const contrats = parseInt(d.contrats, 10);
      return {
        rank: i + 1,
        userId: d.userId,
        nom: `${d.firstname || ''} ${d.lastname || ''}`.trim(),
        agenceName: d.agenceName || 'Inconnue',
        contrats,
        cotations: cotationsCount,
        tauxTransformation: cotationsCount > 0 ? Math.round((contrats / cotationsCount) * 1000) / 10 : 0,
        primes: Math.round(parseFloat(d.primes) || 0),
        capital: Math.round(parseFloat(d.capital) || 0),
        primeMoyenne: Math.round(parseFloat(d.primeMoyenne) || 0),
        partMarche: totalPrimes > 0 ? Math.round(((parseFloat(d.primes) || 0) / totalPrimes) * 1000) / 10 : 0,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // ANALYSE PAR NATURE DE CRÉDIT
  // ─────────────────────────────────────────────────────────────

  async getNatureCreditAnalysis(filters: BiFilters, user?: any) {
    const qb = this.contractRepo.createQueryBuilder('contract')
      .leftJoin('contract.natureCredit', 'nc')
      .where('contract.isActive = true')
      .select('nc.id', 'id')
      .addSelect('nc.libelle', 'libelle')
      .addSelect('COUNT(contract.id)', 'contrats')
      .addSelect('SUM(contract.puttc)', 'primes')
      .addSelect('SUM(contract.capital)', 'capital')
      .addSelect('AVG(contract.puttc)', 'primeMoyenne')
      .addSelect('AVG(contract.duration)', 'dureeMoyenne')
      .groupBy('nc.id')
      .addGroupBy('nc.libelle')
      .orderBy('primes', 'DESC');

    this.applyFilters(qb, filters);
    this.applyRoleFilter(qb, user);

    const data = await qb.getRawMany();
    const totalPrimes = data.reduce((s, d) => s + (parseFloat(d.primes) || 0), 0);

    return data.map(d => ({
      id: d.id,
      libelle: d.libelle || 'Non défini',
      contrats: parseInt(d.contrats, 10),
      primes: Math.round(parseFloat(d.primes) || 0),
      capital: Math.round(parseFloat(d.capital) || 0),
      primeMoyenne: Math.round(parseFloat(d.primeMoyenne) || 0),
      dureeMoyenne: Math.round(parseFloat(d.dureeMoyenne) || 0),
      partMarche: totalPrimes > 0 ? Math.round(((parseFloat(d.primes) || 0) / totalPrimes) * 1000) / 10 : 0,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // INSIGHTS AUTOMATIQUES
  // ─────────────────────────────────────────────────────────────

  async getAutoInsights(user?: any) {
    const insights: Array<{
      type: 'ALERT' | 'TREND' | 'OPPORTUNITY';
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      title: string;
      description: string;
      value?: number;
      threshold?: number;
      code: string;
    }> = [];

    const thresholds = await this.alertThresholdRepo.find({ where: { isActive: true } });
    const getThreshold = (code: string, def = 20) =>
      thresholds.find(t => t.code === code)?.thresholdValue ?? def;

    const now = new Date();
    const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
    const endCurrent = now;
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const getCount = async (start: Date, end: Date) =>
      this.contractRepo.createQueryBuilder('c')
        .where('c.isActive = true')
        .andWhere('c.createdAt BETWEEN :s AND :e', { s: start, e: end })
        .getCount();

    const getPrimes = async (start: Date, end: Date) => {
      const r = await this.contractRepo.createQueryBuilder('c')
        .select('SUM(c.puttc)', 'total')
        .where('c.isActive = true')
        .andWhere('c.createdAt BETWEEN :s AND :e', { s: start, e: end })
        .getRawOne();
      return parseFloat(r?.total) || 0;
    };

    const getCotations = async (start: Date, end: Date) =>
      this.cotationRepo.createQueryBuilder('c')
        .where('c.dateSaisie BETWEEN :s AND :e', { s: start, e: end })
        .getCount();

    const [currContracts, prevContracts, currPrimes, prevPrimes, currCot, prevCot] = await Promise.all([
      getCount(startCurrent, endCurrent),
      getCount(startPrev, endPrev),
      getPrimes(startCurrent, endCurrent),
      getPrimes(startPrev, endPrev),
      getCotations(startCurrent, endCurrent),
      getCotations(startPrev, endPrev),
    ]);

    // Calcul prorata pour comparer à parité de jours
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const prorataFactor = daysInMonth / daysElapsed;
    const projectedContracts = Math.round(currContracts * prorataFactor);

    // 1. Baisse d'activité
    const activityDrop = getThreshold('ACTIVITY_DROP', 20);
    if (prevContracts > 0) {
      const pct = ((projectedContracts - prevContracts) / prevContracts) * 100;
      if (pct <= -activityDrop) {
        insights.push({
          type: 'ALERT', severity: 'HIGH', code: 'ACTIVITY_DROP',
          title: 'Baisse d\'activité détectée',
          description: `Le volume de contrats est en baisse de ${Math.abs(Math.round(pct))}% par rapport au mois précédent (projection).`,
          value: Math.abs(Math.round(pct)), threshold: activityDrop,
        });
      } else if (pct >= activityDrop) {
        insights.push({
          type: 'TREND', severity: 'LOW', code: 'ACTIVITY_UP',
          title: 'Hausse d\'activité',
          description: `Le volume de contrats est en hausse de ${Math.round(pct)}% par rapport au mois précédent (projection).`,
          value: Math.round(pct),
        });
      }
    }

    // 2. Taux de transformation
    const convDrop = getThreshold('CONVERSION_DROP', 15);
    const currTaux = prevCot > 0 ? (currCot > 0 ? (currContracts / currCot) * 100 : 0) : 0;
    const prevTaux = prevCot > 0 ? (prevContracts / prevCot) * 100 : 0;
    if (prevTaux > 0) {
      const tauxDiff = ((currTaux - prevTaux) / prevTaux) * 100;
      if (tauxDiff <= -convDrop) {
        insights.push({
          type: 'ALERT', severity: 'MEDIUM', code: 'CONVERSION_DROP',
          title: 'Baisse du taux de transformation',
          description: `Le taux de transformation est passé de ${prevTaux.toFixed(1)}% à ${currTaux.toFixed(1)}% (−${Math.abs(Math.round(tauxDiff))}%).`,
          value: Math.abs(Math.round(tauxDiff)), threshold: convDrop,
        });
      }
    }

    // 3. Baisse des primes
    const primeDrop = getThreshold('PRIME_DROP', 20);
    if (prevPrimes > 0) {
      const primePct = ((currPrimes - prevPrimes) / prevPrimes) * 100;
      if (primePct <= -primeDrop) {
        insights.push({
          type: 'ALERT', severity: 'HIGH', code: 'PRIME_DROP',
          title: 'Baisse des primes encaissées',
          description: `Les primes du mois en cours sont en baisse de ${Math.abs(Math.round(primePct))}% vs le mois précédent.`,
          value: Math.abs(Math.round(primePct)), threshold: primeDrop,
        });
      }
    }

    // 4. Agences inactives
    const agencyDrop = getThreshold('AGENCY_INACTIVE', 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const inactiveAgencies = await this.agencyRepo.createQueryBuilder('agency')
      .leftJoin(Contract, 'c', 'c.idAgency = agency.id AND c.isActive = true AND c.createdAt >= :date', { date: thirtyDaysAgo })
      .select('agency.id', 'id')
      .addSelect('agency.name', 'name')
      .addSelect('COUNT(c.id)', 'recent')
      .groupBy('agency.id').addGroupBy('agency.name')
      .having('COUNT(c.id) = 0')
      .getRawMany();

    if (inactiveAgencies.length > 0) {
      insights.push({
        type: 'ALERT', severity: 'MEDIUM', code: 'AGENCY_INACTIVE',
        title: `${inactiveAgencies.length} agence(s) sans activité depuis 30 jours`,
        description: `Les agences suivantes n'ont enregistré aucun contrat depuis 30 jours : ${inactiveAgencies.map(a => a.name).join(', ')}.`,
        value: inactiveAgencies.length,
      });
    }

    // 5. Opportunité — segment en croissance
    if (currContracts > prevContracts && prevContracts > 0) {
      const growth = Math.round(((currContracts - prevContracts) / prevContracts) * 100);
      if (growth > 10) {
        insights.push({
          type: 'OPPORTUNITY', severity: 'LOW', code: 'GROWTH_OPPORTUNITY',
          title: 'Tendance de croissance positive',
          description: `L'activité est en progression de ${growth}% par rapport au mois précédent. Opportunité de capitaliser sur cette dynamique.`,
          value: growth,
        });
      }
    }

    return insights.sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return order[a.severity] - order[b.severity];
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SEUILS D'ALERTE — CRUD
  // ─────────────────────────────────────────────────────────────

  async getAlertThresholds() {
    return this.alertThresholdRepo.find({ order: { code: 'ASC' } });
  }

  async updateAlertThreshold(id: number, data: Partial<AlertThreshold>) {
    await this.alertThresholdRepo.update(id, data);
    return this.alertThresholdRepo.findOne({ where: { id } });
  }

  async seedDefaultThresholds() {
    const defaults = [
      { code: 'ACTIVITY_DROP', label: 'Baisse d\'activité', description: 'Alerte si le volume de contrats baisse de X% vs période précédente', thresholdValue: 20, severity: 'HIGH' as const, comparisonPeriod: 'MONTH' },
      { code: 'CONVERSION_DROP', label: 'Baisse du taux de transformation', description: 'Alerte si le taux cotation→contrat baisse de X%', thresholdValue: 15, severity: 'MEDIUM' as const, comparisonPeriod: 'MONTH' },
      { code: 'PRIME_DROP', label: 'Baisse des primes', description: 'Alerte si les primes encaissées baissent de X%', thresholdValue: 20, severity: 'HIGH' as const, comparisonPeriod: 'MONTH' },
      { code: 'AGENCY_INACTIVE', label: 'Agence inactive', description: 'Alerte si une agence n\'a aucun contrat depuis 30 jours', thresholdValue: 0, severity: 'MEDIUM' as const, comparisonPeriod: 'MONTH' },
    ];

    for (const def of defaults) {
      const exists = await this.alertThresholdRepo.findOne({ where: { code: def.code } });
      if (!exists) {
        await this.alertThresholdRepo.save(this.alertThresholdRepo.create(def));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EXPORT DATA
  // ─────────────────────────────────────────────────────────────

  async getExportData(type: 'contrats' | 'clients' | 'commercial', filters: BiFilters, user?: any) {
    if (type === 'contrats') {
      const qb = this.contractRepo.createQueryBuilder('contract')
        .leftJoin('contract.customer', 'customer')
        .leftJoin('contract.agency', 'agency')
        .leftJoin('contract.user', 'u')
        .leftJoin('contract.natureCredit', 'nc')
        .leftJoin('contract.contractState', 'cs')
        .where('contract.isActive = true')
        .select([
          'contract.police', 'contract.reference', 'contract.capital',
          'contract.puttc', 'contract.duration', 'contract.dateEff',
          'contract.dateEch', 'contract.createdAt',
          'customer.firstname', 'customer.lastname', 'customer.gender', 'customer.occupation',
          'agency.name', 'u.firstname', 'u.lastname', 'nc.libelle', 'cs.libelle',
        ])
        .orderBy('contract.createdAt', 'DESC');

      this.applyFilters(qb, filters);
      this.applyRoleFilter(qb, user);
      return qb.getMany();
    }

    if (type === 'commercial') {
      return this.getAgencesPerformance(filters, user);
    }

    return [];
  }

  async getOverviewExportData(filters: BiFilters, user?: any) {
    const kpis = await this.getKPIsOverview(filters, user);
    const evolution = await this.getMonthlyEvolution(12, filters, user);
    const natureData = await this.getNatureCreditAnalysis(filters, user);
    const agencesData = await this.getAgencesPerformance(filters, user);
    return {
      kpis,
      evolution,
      natureData,
      agencesData,
      period: {
        startDate: filters.dateDebut ? new Date(filters.dateDebut).toLocaleDateString('fr-FR') : 'Début',
        endDate: filters.dateFin ? new Date(filters.dateFin).toLocaleDateString('fr-FR') : 'Fin'
      }
    };
  }

  async getClientsExportData(filters: BiFilters, user?: any) {
    const gender = await this.getClientSegmentation('gender', filters, user);
    const age = await this.getClientSegmentation('age', filters, user);
    const occupation = await this.getClientSegmentation('occupation', filters, user);
    const capital = await this.getClientSegmentation('capital', filters, user);
    return {
      gender,
      age,
      occupation,
      capital,
      period: {
        startDate: filters.dateDebut ? new Date(filters.dateDebut).toLocaleDateString('fr-FR') : 'Début',
        endDate: filters.dateFin ? new Date(filters.dateFin).toLocaleDateString('fr-FR') : 'Fin'
      }
    };
  }

  async getCommercialExportData(filters: BiFilters, user?: any) {
    const agences = await this.getAgencesPerformance(filters, user);
    const conseillers = await this.getConseillersPerformance(filters, user);
    const nature = await this.getNatureCreditAnalysis(filters, user);
    return {
      agences,
      conseillers,
      nature,
      period: {
        startDate: filters.dateDebut ? new Date(filters.dateDebut).toLocaleDateString('fr-FR') : 'Début',
        endDate: filters.dateFin ? new Date(filters.dateFin).toLocaleDateString('fr-FR') : 'Fin'
      }
    };
  }

  async exportOverviewExcel(filters: BiFilters, user?: any): Promise<Buffer> {
    const data = await this.getOverviewExportData(filters, user);
    return this.excelService.generateBiOverviewExcel(data);
  }

  async exportClientsExcel(filters: BiFilters, user?: any): Promise<Buffer> {
    const data = await this.getClientsExportData(filters, user);
    return this.excelService.generateBiClientsExcel(data);
  }

  async exportCommercialExcel(filters: BiFilters, user?: any): Promise<Buffer> {
    const data = await this.getCommercialExportData(filters, user);
    return this.excelService.generateBiCommercialExcel(data);
  }

  async exportOverviewPdf(filters: BiFilters, user?: any): Promise<Buffer> {
    const data = await this.getOverviewExportData(filters, user);
    return this.pdfService.generateReportPdf('bi-overview', 'Rapport BI - Vue d\'ensemble', data);
  }

  async exportClientsPdf(filters: BiFilters, user?: any): Promise<Buffer> {
    const data = await this.getClientsExportData(filters, user);
    return this.pdfService.generateReportPdf('bi-clients', 'Analyse BI - Segmentation Clients', data);
  }

  async exportCommercialPdf(filters: BiFilters, user?: any): Promise<Buffer> {
    const data = await this.getCommercialExportData(filters, user);
    return this.pdfService.generateReportPdf('bi-commercial', 'Analyse BI - Performance Commerciale', data);
  }
}
