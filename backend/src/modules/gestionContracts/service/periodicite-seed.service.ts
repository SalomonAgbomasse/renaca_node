import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Periodicite } from '../entity/periodicite.entity';

@Injectable()
export class PeriodiciteSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Periodicite)
    private periodiciteRepository: Repository<Periodicite>,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_DISABLED === 'true') {
      return;
    }
    await this.seed();
  }

  async seed() {
    const count = await this.periodiciteRepository.count();
    
    if (count > 0) {
      console.log('✅ Les périodicités existent déjà');
      return;
    }

    const periodicites = [
      {
        id: 1,
        libelle: 'Mensuelle',
        code: '1',
        nombreMois: 1,
        description: 'Paiement mensuel',
        isActive: true
      },
      {
        id: 2,
        libelle: 'Bimestrielle',
        code: '2',
        nombreMois: 2,
        description: 'Paiement tous les 2 mois',
        isActive: true
      },
      {
        id: 3,
        libelle: 'Trimestrielle',
        code: '3',
        nombreMois: 3,
        description: 'Paiement tous les 3 mois',
        isActive: true
      },
      {
        id: 4,
        libelle: 'Quadrimesuelle',
        code: '4',
        nombreMois: 4,
        description: 'Paiement tous les 4 mois',
        isActive: true
      },
      {
        id: 5,
        libelle: 'Quinquamestrielle',
        code: '5',
        nombreMois: 5,
        description: 'Paiement tous les 5 mois',
        isActive: true
      },
      {
        id: 6,
        libelle: 'Semestrielle',
        code: '6',
        nombreMois: 6,
        description: 'Paiement tous les 6 mois',
        isActive: true
      },
      {
        id: 12,
        libelle: 'Annuelle/Constant',
        code: '12',
        nombreMois: 12,
        description: 'Paiement annuel ou constant',
        isActive: true
      }
    ];

    for (const periodicite of periodicites) {
      await this.periodiciteRepository.save(periodicite);
    }

    console.log('✅ Périodicités PADME créées avec succès');
  }
}
