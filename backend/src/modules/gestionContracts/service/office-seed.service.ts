import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Office } from '../entity/office.entity';

@Injectable()
export class OfficeSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Office)
    private officeRepository: Repository<Office>,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_DISABLED === 'true') {
      return;
    }
    await this.seed();
  }

  private async seed() {
    try {
      console.log('🌱 Seed: Vérification des bureaux (offices)...');
      
      const defaultOffices = [
        { id: 1, idAgency: 1, officeName: 'L\'Africaine Vie Bénin', addressBureau: '01 BP 2040 Cotonou-Bénin', phoneBureau: ' 21 30 39 93 – 21 30 02 91' },
        { id: 2, idAgency: 2, officeName: 'AAVIE-BOHICON', addressBureau: 'Immeuble AHEHEHINNOU en face de Ecoprice', phoneBureau: '94 02 47 31' },
        { id: 3, idAgency: 3, officeName: 'AAVIE-PARAKOU', addressBureau: 'Quartier ZONGO II,\nImmeuble LNB en face de la buvette locale le Patronal', phoneBureau: '66 00 13 28' },
        { id: 4, idAgency: 4, officeName: 'GOHO', addressBureau: 'ABOMEY-GOHO', phoneBureau: '96 25 93 57' },
        { id: 5, idAgency: 4, officeName: 'DJIDJA', addressBureau: 'ABOMEY-DJIDJA', phoneBureau: '--- --- ---' },
        { id: 6, idAgency: 4, officeName: 'AGBANGNIZOUN', addressBureau: 'ABOMEY-AGBANGNIZOUN', phoneBureau: '--- --- ---' },
        { id: 7, idAgency: 4, officeName: 'BOHICON', addressBureau: 'ABOMEY-BOHICON', phoneBureau: '--- --- ---' },
        { id: 8, idAgency: 4, officeName: 'COVE', addressBureau: 'ABOMEY-COVE', phoneBureau: '--- --- ---' },
        { id: 9, idAgency: 4, officeName: 'AGENCE-ABOMEY', addressBureau: 'ABOMEY', phoneBureau: '--- --- ---' },
        { id: 10, idAgency: 5, officeName: 'AGENCE-CALAVI', addressBureau: 'CALAVI', phoneBureau: '--- --- ---' },
        { id: 11, idAgency: 5, officeName: 'OUIDAH', addressBureau: 'CALAVI-OUIDAH', phoneBureau: '--- --- ---' },
        { id: 12, idAgency: 5, officeName: 'COCOTOMEY', addressBureau: 'CALAVI-COCOTOMEY', phoneBureau: '--- --- ---' },
        { id: 13, idAgency: 5, officeName: 'AKASSATO', addressBureau: 'CALAVI-AKASSATO', phoneBureau: '--- --- ---' },
        { id: 14, idAgency: 5, officeName: 'HEVIE', addressBureau: 'CALAVI-HEVIE', phoneBureau: '--- --- ---' },
        { id: 15, idAgency: 6, officeName: 'AGENCE-DASSA', addressBureau: 'DASSA', phoneBureau: '--- --- ---' },
        { id: 16, idAgency: 6, officeName: 'SAVALOU', addressBureau: 'DASSA-SAVALOU', phoneBureau: '--- --- ---' },
        { id: 17, idAgency: 6, officeName: 'SAVE', addressBureau: 'DASSA-SAVE', phoneBureau: '--- --- ---' },
        { id: 18, idAgency: 6, officeName: 'GLAZOUE', addressBureau: 'DASSA-GLAZOUE', phoneBureau: '--- --- ---' },
        { id: 19, idAgency: 6, officeName: 'BANTE', addressBureau: 'DASSA-BANTE', phoneBureau: '--- --- ---' },
        { id: 20, idAgency: 6, officeName: 'OUESSE', addressBureau: 'DASSA-OUESSE', phoneBureau: '--- --- ---' },
        { id: 21, idAgency: 7, officeName: 'AGENCE-LOKOSSA', addressBureau: 'LOKOSSA', phoneBureau: '--- --- ---' },
        { id: 22, idAgency: 7, officeName: 'COME', addressBureau: 'LOKOSSA-COME', phoneBureau: '--- --- ---' },
        { id: 23, idAgency: 7, officeName: 'AZOVE', addressBureau: 'LOKOSSA-AZOVE', phoneBureau: '--- --- ---' },
        { id: 24, idAgency: 7, officeName: 'DOGBO', addressBureau: 'LOKOSSA-DOGBO', phoneBureau: '--- --- ---' },
        { id: 25, idAgency: 7, officeName: 'LOBOGO', addressBureau: 'LOKOSSA-LOBOGO', phoneBureau: '--- --- ---' },
        { id: 26, idAgency: 8, officeName: 'ALLADA-AGENCE', addressBureau: 'ALLADA', phoneBureau: '--- --- ---' },
        { id: 27, idAgency: 8, officeName: 'ZE', addressBureau: 'ALLADA-ZE', phoneBureau: '--- --- ---' },
        { id: 28, idAgency: 8, officeName: 'HOUEGBO', addressBureau: 'ALLADA-HOUEGBO', phoneBureau: '--- --- ---' },
        { id: 29, idAgency: 8, officeName: 'TORI', addressBureau: 'ALLADA-TORI', phoneBureau: '--- --- ---' },
        { id: 30, idAgency: 7, officeName: 'KLOUEKANME', addressBureau: 'LOKOSSA-KLOUEKANME', phoneBureau: '--- --- ---' },
        { id: 31, idAgency: 9, officeName: 'POBE-AGENCE', addressBureau: 'POBE', phoneBureau: '--- --- --- ---' },
        { id: 32, idAgency: 9, officeName: 'KETOU-AGENCE', addressBureau: 'KETOU', phoneBureau: '--- --- --- ---' },
        { id: 33, idAgency: 12, officeName: 'PORTO NOVO-AGENCE', addressBureau: 'PORTO NOVO', phoneBureau: '--- --- --- ---' },
        { id: 34, idAgency: 13, officeName: 'SAKETE AGENCE', addressBureau: 'SAKETE', phoneBureau: '01 97 43 35 35' },
        { id: 35, idAgency: 14, officeName: 'IFANGNI AGENCE', addressBureau: 'IFANGNI', phoneBureau: '01 56 46 59 68 ' },
        { id: 36, idAgency: 15, officeName: 'AGENCE-OUINHI', addressBureau: 'OUINHI', phoneBureau: '--- --- ---' },
        { id: 37, idAgency: 16, officeName: 'AGENCE-ADJARA', addressBureau: 'ADJARA', phoneBureau: '--- --- ---' },
        { id: 38, idAgency: 17, officeName: 'AZOVE', addressBureau: 'AZOVE', phoneBureau: '--- --- ---' },
        { id: 39, idAgency: 12, officeName: 'OUANDO', addressBureau: 'OUANDO', phoneBureau: '--- --- ---' }
      ];

      for (const officeData of defaultOffices) {
        const existingOffice = await this.officeRepository.findOne({
          where: { id: officeData.id }
        });

        if (!existingOffice) {
          console.log(`🌱 Création du bureau: ${officeData.officeName}`);
          
          await this.officeRepository
            .createQueryBuilder()
            .insert()
            .into(Office)
            .values(officeData)
            .orIgnore()
            .execute();
            
          console.log(`✅ Bureau "${officeData.officeName}" créé avec l'ID ${officeData.id}`);
        } else {
          console.log(`ℹ️ Bureau "${officeData.officeName}" (ID: ${officeData.id}) existe déjà`);
        }
      }

      console.log('✅ Seed: Vérification des bureaux terminée');
    } catch (error) {
      console.error('❌ Erreur lors du seed des bureaux:', error);
    }
  }
}

