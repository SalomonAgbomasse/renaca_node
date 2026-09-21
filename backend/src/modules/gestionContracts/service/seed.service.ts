import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeCustomer } from '../entity/type-customer.entity';
import { ContractState } from '../entity/contract-state.entity';
import { CreditType } from '../entity/credit-type.entity';
import { NatureCredit } from '../entity/nature-credit.entity';
import { Product } from '../entity/product.entity';
import { Periodicite } from '../entity/periodicite.entity';
import { BiService } from './bi.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(TypeCustomer)
    private typeCustomerRepository: Repository<TypeCustomer>,
    @InjectRepository(ContractState)
    private contractStateRepository: Repository<ContractState>,
    @InjectRepository(CreditType)
    private creditTypeRepository: Repository<CreditType>,
    @InjectRepository(NatureCredit)
    private natureCreditRepository: Repository<NatureCredit>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Periodicite)
    private periodiciteRepository: Repository<Periodicite>,
    private biService: BiService,
  ) {}

  async onModuleInit() {
    await this.seedTypeCustomers();
    await this.seedContractStates();
    await this.seedCreditTypes();
    await this.seedNatureCredits();
    await this.seedProducts();
    await this.seedPeriodicites();
    await this.biService.seedDefaultThresholds();
  }

  private async seedTypeCustomers() {
    try {
      console.log('🌱 Seed: Vérification des types de clients...');
      
      const defaultTypes = [
        {
          id: 1,
          libelle: 'PARTICULIER',
          description: 'Client individuel'
        },
        {
          id: 2,
          libelle: 'PERSONNEL RENACA',
          description: 'Personnel de la société'
        },
      ];

      for (const typeData of defaultTypes) {
        // Vérifier si ce type spécifique existe déjà
        const existingType = await this.typeCustomerRepository.findOne({
          where: { id: typeData.id }
        });

        if (!existingType) {
          console.log(`🌱 Création du type client: ${typeData.libelle}`);
          
          // Utiliser upsert pour éviter les conflits
          await this.typeCustomerRepository
            .createQueryBuilder()
            .insert()
            .into(TypeCustomer)
            .values(typeData)
            .orIgnore() // Ignore si l'ID existe déjà
            .execute();
            
          console.log(`✅ Type client "${typeData.libelle}" créé avec l'ID ${typeData.id}`);
        } else {
          console.log(`ℹ️ Type client "${typeData.libelle}" (ID: ${typeData.id}) existe déjà`);
        }
      }

      console.log('✅ Seed: Vérification des types de clients terminée');
    } catch (error) {
      console.error('❌ Erreur lors du seed des types de clients:', error);
      
      // Fallback: créer sans ID spécifique
      try {
        console.log('🔄 Tentative de création sans ID spécifique...');
        const count = await this.typeCustomerRepository.count();
        
        if (count === 0) {
          const fallbackTypes = [
            { libelle: 'Particulier', description: 'Client individuel' },
            { libelle: 'Personnel', description: 'Personnel de la société' }
          ];

          for (const typeData of fallbackTypes) {
            try {
              console.log(`🌱 Seed: Création du type client "${typeData.libelle}"...`);
              const typeCustomer = this.typeCustomerRepository.create(typeData);
              await this.typeCustomerRepository.save(typeCustomer);
              console.log(`✅ Type client "${typeData.libelle}" créé avec succès`);
            } catch (itemError) {
              console.error(`❌ Erreur lors de la création du type client "${typeData.libelle}":`, itemError);
            }
          }
          console.log('✅ Types de clients créés en fallback');
        }
      } catch (fallbackError) {
        console.error('❌ Erreur lors du fallback:', fallbackError);
      }
    }
  }

  private async seedContractStates() {
    try {
      console.log('🌱 Seed: Vérification des états de contrat...');
      
      const defaultStates = [
        {
          id: 1,
          libelle: 'EN COURS',
          isActive: true
        },
        {
          id: 2,
          libelle: 'RENOUVELE',
          isActive: true
        },
        {
          id: 3,
          libelle: 'ANNULE',
          isActive: true
        },
        {
          id: 4,
          libelle: 'RESILIE',
          isActive: true
        },
        {
          id: 5,
          libelle: 'SINISTRE',
          isActive: true
        },
        {
          id: 6,
          libelle: 'ÉCHU',
          isActive: true
        }
      ];

      for (const stateData of defaultStates) {
        // Vérifier si cet état spécifique existe déjà
        const existingState = await this.contractStateRepository.findOne({
          where: { id: stateData.id }
        });

        if (!existingState) {
          console.log(`🌱 Création de l'état de contrat: ${stateData.libelle}`);
          
          // Utiliser upsert pour éviter les conflits
          await this.contractStateRepository
            .createQueryBuilder()
            .insert()
            .into(ContractState)
            .values(stateData)
            .orIgnore() // Ignore si l'ID existe déjà
            .execute();
            
          console.log(`✅ État de contrat "${stateData.libelle}" créé avec l'ID ${stateData.id}`);
        } else {
          console.log(`ℹ️ État de contrat "${stateData.libelle}" (ID: ${stateData.id}) existe déjà`);
        }
      }

      console.log('✅ Seed: Vérification des états de contrat terminée');
    } catch (error) {
      console.error('❌ Erreur lors du seed des états de contrat:', error);
      
      // Fallback: créer sans ID spécifique
      try {
        console.log('🔄 Tentative de création sans ID spécifique...');
        const count = await this.contractStateRepository.count();
        
        if (count === 0) {
          const fallbackStates = [
            { libelle: 'EN ATTENTE DE RENOUVELLEMENT', isActive: true },
            { libelle: 'RENOUVELE', isActive: true },
            { libelle: 'ANNULE', isActive: true },
            { libelle: 'RESILIE', isActive: true },
            { libelle: 'SINISTRE', isActive: true }
          ];

          for (const stateData of fallbackStates) {
            try {
              console.log(`🌱 Seed: Création de l'état "${stateData.libelle}"...`);
              const contractState = this.contractStateRepository.create(stateData);
              await this.contractStateRepository.save(contractState);
              console.log(`✅ État "${stateData.libelle}" créé avec succès`);
            } catch (itemError) {
              console.error(`❌ Erreur lors de la création de l'état "${stateData.libelle}":`, itemError);
            }
          }
          console.log('✅ États de contrat créés en fallback');
        }
      } catch (fallbackError) {
        console.error('❌ Erreur lors du fallback des états de contrat:', fallbackError);
      }
    }
  }

  private async seedCreditTypes() {
    try {
      console.log('🌱 Seed: Vérification des types de crédit...');
      
      const defaultCreditTypes = [
        {
          id: 1,
          libelle: 'AMORTISSABLE',
          description: 'Crédit amortissable standard'
        },
        {
          id: 2,
          libelle: 'BOUCLIER EMPRUNTEUR',
          description: 'Protection emprunteur'
        },
        {
          id: 3,
          libelle: 'CONSTANT',
          description: 'Crédit à taux constant'
        }
      ];

      for (const creditTypeData of defaultCreditTypes) {
        // Vérifier si ce type de crédit spécifique existe déjà
        const existingCreditType = await this.creditTypeRepository.findOne({
          where: { id: creditTypeData.id }
        });

        if (!existingCreditType) {
          console.log(`🌱 Création du type de crédit: ${creditTypeData.libelle}`);
          
          // Utiliser upsert pour éviter les conflits
          await this.creditTypeRepository
            .createQueryBuilder()
            .insert()
            .into(CreditType)
            .values(creditTypeData)
            .orIgnore() // Ignore si l'ID existe déjà
            .execute();
            
          console.log(`✅ Type de crédit "${creditTypeData.libelle}" créé avec l'ID ${creditTypeData.id}`);
        } else {
          if (existingCreditType.libelle !== creditTypeData.libelle || existingCreditType.description !== creditTypeData.description) {
            existingCreditType.libelle = creditTypeData.libelle;
            existingCreditType.description = creditTypeData.description;
            await this.creditTypeRepository.save(existingCreditType);
            console.log(`✅ Type de crédit "${creditTypeData.libelle}" (ID: ${creditTypeData.id}) mis à jour`);
          } else {
            console.log(`ℹ️ Type de crédit "${creditTypeData.libelle}" (ID: ${creditTypeData.id}) existe déjà`);
          }
        }
      }

      console.log('✅ Seed: Vérification des types de crédit terminée');
    } catch (error) {
      console.error('❌ Erreur lors du seed des types de crédit:', error);
      
      // Fallback: créer sans ID spécifique
      try {
        console.log('🔄 Tentative de création sans ID spécifique...');
        const count = await this.creditTypeRepository.count();
        
        if (count === 0) {
          const fallbackCreditTypes = [
            { libelle: 'AMORTISSABLE', description: 'Crédit amortissable standard' },
            { libelle: 'BOUCLIER EMPRUNTEUR', description: 'Protection emprunteur' },
            { libelle: 'CONSTANT', description: 'Crédit à taux constant' },
            { libelle: 'TONTINE SOLIDARITE', description: 'Tontine solidarité' }
          ];

          for (const creditTypeData of fallbackCreditTypes) {
            try {
              console.log(`🌱 Seed: Création du type de crédit "${creditTypeData.libelle}"...`);
              const creditType = this.creditTypeRepository.create(creditTypeData);
              await this.creditTypeRepository.save(creditType);
              console.log(`✅ Type de crédit "${creditTypeData.libelle}" créé avec succès`);
            } catch (itemError) {
              console.error(`❌ Erreur lors de la création du type de crédit "${creditTypeData.libelle}":`, itemError);
            }
          }
          console.log('✅ Types de crédit créés en fallback');
        }
      } catch (fallbackError) {
        console.error('❌ Erreur lors du fallback des types de crédit:', fallbackError);
      }
    }
  }

  private async seedNatureCredits() {
    try {
      console.log('🌱 Seed: Vérification des natures de crédit...');
      
      console.log('🌱 Seed: Création des natures de crédit...');
      
      const natureCreditsData = [
        {
          libelle: 'AMORTISSABLE',
          code: 'AMORT',
          description: 'Crédit amortissable',
          isActive: true
        },
        {
          libelle: 'CONSTANT',
          code: 'CONST',
          description: 'Crédit à taux constant',
          isActive: true
        }
      ];

      for (const natureCreditData of natureCreditsData) {
          try {
            console.log(`🌱 Seed: Création de la nature de crédit "${natureCreditData.libelle}"...`);
            
            // Vérifier si l'élément existe déjà
            const existing = await this.natureCreditRepository.findOne({
              where: { code: natureCreditData.code }
            });
            
            if (existing) {
              if (existing.libelle !== natureCreditData.libelle || existing.description !== natureCreditData.description) {
                existing.libelle = natureCreditData.libelle;
                existing.description = natureCreditData.description;
                await this.natureCreditRepository.save(existing);
                console.log(`✅ Nature de crédit "${natureCreditData.libelle}" mise à jour`);
              } else {
                console.log(`⚠️ Nature de crédit "${natureCreditData.libelle}" existe déjà, ignorée`);
              }
              continue;
            }
            
            const natureCredit = this.natureCreditRepository.create(natureCreditData);
            await this.natureCreditRepository.save(natureCredit);
            console.log(`✅ Nature de crédit "${natureCreditData.libelle}" créée avec succès`);
          } catch (itemError) {
            console.error(`❌ Erreur lors de la création de "${natureCreditData.libelle}":`, itemError);
            // Continuer avec l'élément suivant même en cas d'erreur
          }
        }
        
        console.log('✅ Natures de crédit traitées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la création des natures de crédit:', error);
    }
  }

  private async seedProducts() {
    try {
      console.log('🌱 Seed: Vérification des produits...');
      
      const defaultProducts = [
        {
          id: 1,
          libelle: 'Bouclier Emprunteur',
          code: 'BE',
          name: 'Bouclier Emprunteur',
          isActive: true,
          category: 'INSURANCE' as const
        }
      ];

      for (const productData of defaultProducts) {
        // Vérifier si ce produit spécifique existe déjà
        const existingProduct = await this.productRepository.findOne({
          where: { id: productData.id }
        });

        if (!existingProduct) {
          console.log(`🌱 Création du produit: ${productData.libelle}`);
          
          // Utiliser upsert pour éviter les conflits
          await this.productRepository
            .createQueryBuilder()
            .insert()
            .into(Product)
            .values(productData)
            .orIgnore() // Ignore si l'ID existe déjà
            .execute();
            
          console.log(`✅ Produit "${productData.libelle}" créé avec l'ID ${productData.id}`);
        } else {
          if (existingProduct.libelle !== productData.libelle || existingProduct.name !== productData.name) {
            existingProduct.libelle = productData.libelle;
            existingProduct.name = productData.name;
            await this.productRepository.save(existingProduct);
            console.log(`✅ Produit "${productData.libelle}" (ID: ${existingProduct.id}) mis à jour`);
          } else {
            console.log(`ℹ️ Produit "${productData.libelle}" (ID: ${productData.id}) existe déjà`);
          }
        }
      }

      console.log('✅ Seed: Vérification des produits terminée');
    } catch (error) {
      console.error('❌ Erreur lors du seed des produits:', error);
      
      // Fallback: créer sans ID spécifique
      try {
        console.log('🔄 Tentative de création sans ID spécifique...');
        const count = await this.productRepository.count();
        
        if (count === 0) {
          const fallbackProducts = [
            { libelle: 'ASSURANCE VIE', code: 'AV', name: 'Assurance Vie Standard', isActive: true, category: 'INSURANCE' as const },
            { libelle: 'ASSURANCE DÉCÈS', code: 'AD', name: 'Assurance Décès Individuelle', isActive: true, category: 'INSURANCE' as const },
            { libelle: 'ASSURANCE EMPRUNTEUR', code: 'AE', name: 'Assurance Emprunteur', isActive: true, category: 'INSURANCE' as const },
            { libelle: 'ÉPARGNE RETRAITE', code: 'ER', name: 'Épargne Retraite Complémentaire', isActive: true, category: 'INVESTMENT' as const },
            { libelle: 'PADME PROTECTION', code: 'CP', name: 'PADME PROTECTION', isActive: true, category: 'BANKING' as const }
          ];

          for (const productData of fallbackProducts) {
            try {
              console.log(`🌱 Seed: Création du produit "${productData.libelle}"...`);
              const product = this.productRepository.create(productData);
              await this.productRepository.save(product);
              console.log(`✅ Produit "${productData.libelle}" créé avec succès`);
            } catch (itemError) {
              console.error(`❌ Erreur lors de la création du produit "${productData.libelle}":`, itemError);
            }
          }
          console.log('✅ Produits créés en fallback');
        }
      } catch (fallbackError) {
        console.error('❌ Erreur lors du fallback des produits:', fallbackError);
      }
    }
  }

  private async seedPeriodicites() {
    try {
      console.log('🌱 Seed: Vérification des périodicités...');
      
      const defaultPeriodicites = [
        {
          id: 1,
          libelle: 'Mensuelle',
          code: 'M',
          nombreMois: 1,
          description: 'Paiement mensuel',
          isActive: true
        },
        {
          id: 2,
          libelle: 'Bimestrielle',
          code: 'B',
          nombreMois: 2,
          description: 'Paiement tous les deux mois',
          isActive: true
        },
        {
          id: 3,
          libelle: 'Trimestrielle',
          code: 'T',
          nombreMois: 3,
          description: 'Paiement tous les trois mois',
          isActive: true
        },
        {
          id: 4,
          libelle: 'Quadrimesuelle',
          code: 'Q',
          nombreMois: 4,
          description: 'Paiement tous les quatre mois',
          isActive: true
        },
        
        {
          id: 5,
          libelle: 'Quinquamestrielle',
          code: 'QQ',
          nombreMois: 5,
          description: 'Paiement tous les cinq mois',
          isActive: true
        },
        {
          id: 6,
          libelle: 'Semestrielle',
          code: 'S',
          nombreMois: 6,
          description: 'Paiement tous les six mois',
          isActive: true
        },
        {
          id: 12,
          libelle: 'Annuelle/Constant',
          code: 'A',
          nombreMois: 12,
          description: 'Paiement annuel ou constant',
          isActive: true
        }
      ];

      for (const periodiciteData of defaultPeriodicites) {
        try {
          // Vérifier si cette périodicité spécifique existe déjà
          const existingPeriodicite = await this.periodiciteRepository.findOne({
            where: { id: periodiciteData.id }
          });

          if (!existingPeriodicite) {
            console.log(`🌱 Création de la périodicité: ${periodiciteData.libelle}`);
            
            // Utiliser save() qui gère mieux les conflits
            const periodicite = this.periodiciteRepository.create(periodiciteData);
            await this.periodiciteRepository.save(periodicite);
            
            console.log(`✅ Périodicité "${periodiciteData.libelle}" créée avec l'ID ${periodiciteData.id}`);
          } else {
            console.log(`ℹ️ Périodicité "${periodiciteData.libelle}" (ID: ${periodiciteData.id}) existe déjà`);
          }
        } catch (itemError: any) {
          // Si l'erreur est due à un doublon, on l'ignore
          if (itemError.code === 'ER_DUP_ENTRY' || itemError.errno === 1062) {
            console.log(`ℹ️ Périodicité "${periodiciteData.libelle}" (ID: ${periodiciteData.id}) existe déjà (détecté par erreur)`);
          } else {
            console.error(`❌ Erreur lors de la création de la périodicité "${periodiciteData.libelle}":`, itemError);
            throw itemError;
          }
        }
      }

      console.log('✅ Seed: Vérification des périodicités terminée');
    } catch (error) {
      console.error('❌ Erreur lors du seed des périodicités:', error);
      
      // Fallback: créer sans ID spécifique
      try {
        console.log('🔄 Tentative de création sans ID spécifique...');
        const count = await this.periodiciteRepository.count();
        
        if (count === 0) {
          const fallbackPeriodicites = [
            { libelle: 'Mensuelle', code: 'M', nombreMois: 1, description: 'Paiement mensuel', isActive: true },
            { libelle: 'Bimestrielle', code: 'B', nombreMois: 2, description: 'Paiement tous les deux mois', isActive: true },
            { libelle: 'Trimestrielle', code: 'T', nombreMois: 3, description: 'Paiement tous les trois mois', isActive: true },
            { libelle: 'Quadrimesuelle', code: 'Q', nombreMois: 4, description: 'Paiement tous les quatre mois', isActive: true },
            { libelle: 'Quinquamestrielle', code: 'QQ', nombreMois: 5, description: 'Paiement tous les cinq mois', isActive: true },
            { libelle: 'Semestrielle', code: 'S', nombreMois: 6, description: 'Paiement tous les six mois', isActive: true },
            { libelle: 'Annuelle/Constant', code: 'A', nombreMois: 12, description: 'Paiement annuel ou constant', isActive: true }
          ];

          for (const periodiciteData of fallbackPeriodicites) {
            try {
              console.log(`🌱 Seed: Création de la périodicité "${periodiciteData.libelle}"...`);
              const periodicite = this.periodiciteRepository.create(periodiciteData);
              await this.periodiciteRepository.save(periodicite);
              console.log(`✅ Périodicité "${periodiciteData.libelle}" créée avec succès`);
            } catch (itemError) {
              console.error(`❌ Erreur lors de la création de la périodicité "${periodiciteData.libelle}":`, itemError);
            }
          }
          console.log('✅ Périodicités créées en fallback');
        }
      } catch (fallbackError) {
        console.error('❌ Erreur lors du fallback des périodicités:', fallbackError);
      }
    }
  }
}
