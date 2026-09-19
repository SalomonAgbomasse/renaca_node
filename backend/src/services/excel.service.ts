import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { Contract } from '../modules/gestionContracts/entity/contract.entity';
import { ContractState } from '../modules/gestionContracts/entity/contract-state.entity';
import { User } from '../modules/gestionUsers/entity/user.entity';
import { ImportContractRowDto } from '../modules/gestionContracts/dto/contract/import-contract.dto';

export interface ProductionReportData {
  contracts: Contract[];
  contractStates: ContractState[];
  users: User[];
  period: {
    startDate: string;
    endDate: string;
  };
}

@Injectable()
export class ExcelService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'production-states');

  constructor() {
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generateProductionReport(data: ProductionReportData, productionStateId: number): Promise<{ buffer: Buffer; filePath: string }> {
    const workbook = new ExcelJS.Workbook();
    
    // Configuration générale
    workbook.creator = 'MSFP Assurance';
    workbook.lastModifiedBy = 'Système MSFP';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Créer un Set partagé pour suivre les noms de feuilles existants (normalisés à 31 caractères)
    const existingSheetNames = new Set<string>();
    
    // Fonction helper pour normaliser un nom de feuille à 31 caractères
    const normalizeSheetName = (name: string): string => {
      return name.length > 31 ? name.substring(0, 31) : name;
    };

    // 1. Feuille récapitulative
    await this.createSummarySheet(workbook, data);
    workbook.worksheets.forEach(ws => {
      existingSheetNames.add(normalizeSheetName(ws.name));
    });
    
    // 2. Feuille de graphiques
    await this.createChartsSheet(workbook, data);
    workbook.worksheets.forEach(ws => {
      existingSheetNames.add(normalizeSheetName(ws.name));
    });
    
    // 3. Feuilles par utilisateur
    await this.createUserSheets(workbook, data, existingSheetNames, normalizeSheetName);
    
    // 4. Feuilles par client
    await this.createCustomerSheets(workbook, data, existingSheetNames, normalizeSheetName);

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const bufferData = Buffer.from(buffer);

    // Générer le nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rapport_production_${productionStateId}_${timestamp}.xlsx`;
    const filePath = path.join(this.uploadsDir, filename);

    // Sauvegarder le fichier
    fs.writeFileSync(filePath, bufferData);

    console.log(`📁 Fichier Excel sauvegardé: ${filePath}`);

    return {
      buffer: bufferData,
      filePath: `/uploads/production-states/${filename}`
    };
  }

  async generateProductionReportBuffer(data: ProductionReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Configuration générale
    workbook.creator = 'MSFP Assurance';
    workbook.lastModifiedBy = 'Système MSFP';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Créer un Set partagé pour suivre les noms de feuilles existants (normalisés à 31 caractères)
    const existingSheetNames = new Set<string>();
    
    // Fonction helper pour normaliser un nom de feuille à 31 caractères
    const normalizeSheetName = (name: string): string => {
      return name.length > 31 ? name.substring(0, 31) : name;
    };

    // 1. Feuille récapitulative
    await this.createSummarySheet(workbook, data);
    workbook.worksheets.forEach(ws => {
      existingSheetNames.add(normalizeSheetName(ws.name));
    });
    
    // 2. Feuille de graphiques
    await this.createChartsSheet(workbook, data);
    workbook.worksheets.forEach(ws => {
      existingSheetNames.add(normalizeSheetName(ws.name));
    });
    
    // 3. Feuilles par utilisateur
    await this.createUserSheets(workbook, data, existingSheetNames, normalizeSheetName);
    
    // 4. Feuilles par client
    await this.createCustomerSheets(workbook, data, existingSheetNames, normalizeSheetName);

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async createSummarySheet(workbook: ExcelJS.Workbook, data: ProductionReportData): Promise<void> {
    const worksheet = workbook.addWorksheet('Récapitulatif Général');
    
    // Configuration de la feuille
    worksheet.properties.defaultRowHeight = 20;
    
    // En-tête principal
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `RAPPORT DE PRODUCTION - PÉRIODE DU ${data.period.startDate} AU ${data.period.endDate}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF2E7D32' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };

    // Informations générales
    worksheet.mergeCells('A3:J3');
    const infoCell = worksheet.getCell('A3');
    infoCell.value = `Total des contrats: ${data.contracts.length} | Généré le: ${new Date().toLocaleDateString('fr-FR')}`;
    infoCell.font = { size: 12, bold: true };
    infoCell.alignment = { horizontal: 'center' };

    // En-têtes des colonnes - Version complète avec tous les champs
    const headers = [
      'Référence', 'Police', 'Établissement',
      'Client', 'Téléphone', 'Email', 'Adresse', 'Date Naissance', 'Lieu Naissance', 'Profession', 'Type Client',
      'Produit', 'Agence', 'Utilisateur', 'État', 'Nature Crédit',
      'Capital', 'Durée', 'Taux', 'Date Effet', 'Date Échéance 1', 'Date Échéance',
      'PD', 'PC', 'Surp', 'ACC', 'FM', 'Prime TTC', 'Garantie Compl',
      'Description', 'Actif', 'Créé le', 'Modifié le'
    ];

    const headerRow = worksheet.getRow(5);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E7D32' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Données des contrats - Version complète avec tous les champs
    data.contracts.forEach((contract, index) => {
      const row = worksheet.getRow(index + 6);
      const rowData = [
        // Identifiants
        contract.reference || 'N/A',
        contract.police || 'N/A',
        contract.etablissement || 'Non spécifié',
        
        // Informations client complètes
        contract.customer ? `${contract.customer.firstname} ${contract.customer.lastname}` : 'N/A',
        contract.customer?.phone || 'N/A',
        contract.customer?.email || 'N/A',
        contract.customer?.address || 'N/A',
        contract.customer?.birthdate ? new Date(contract.customer.birthdate).toLocaleDateString('fr-FR') : 'N/A',
        contract.customer?.placeOfBirth || 'N/A',
        contract.customer?.occupation || 'N/A',
        contract.customer?.typeCustomer?.libelle || 'N/A',
        
        // Informations produit et organisation
        contract.product?.name || 'N/A',
        contract.agency?.name || 'N/A',
        contract.user ? `${contract.user.firstname} ${contract.user.lastname}` : 'N/A',
        contract.contractState?.libelle || 'N/A',
        contract.natureCredit?.libelle || 'N/A',
        
        // Informations financières
        contract.capital ? Number(contract.capital).toLocaleString('fr-FR') : 'N/A',
        contract.duration || 0,
        contract.taux ? `${contract.taux}%` : 'N/A',
        
        // Dates
        contract.dateEff ? new Date(contract.dateEff).toLocaleDateString('fr-FR') : 'N/A',
        contract.dateEch1 ? new Date(contract.dateEch1).toLocaleDateString('fr-FR') : 'N/A',
        contract.dateEch ? new Date(contract.dateEch).toLocaleDateString('fr-FR') : 'N/A',
        
        // Primes et garanties
        contract.pd || 0,
        contract.pc || 0,
        contract.surp || 0,
        contract.acc || 0,
        contract.fm || 0,
        contract.puttc ? Number(contract.puttc).toLocaleString('fr-FR') : 'N/A',
        contract.garantieCompl || 'NON',
        
        // Informations supplémentaires
        contract.description || 'N/A',
        contract.isActive ? 'Oui' : 'Non',
        contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('fr-FR') : 'N/A',
        contract.updatedAt ? new Date(contract.updatedAt).toLocaleDateString('fr-FR') : 'N/A'
      ];

      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Alternance des couleurs de fond
        if (index % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' }
          };
        }
      });
    });

    // Ajuster la largeur des colonnes
    worksheet.columns.forEach(column => {
      column.width = 12;
    });
    // Largeurs spécifiques pour les colonnes importantes
    worksheet.getColumn(1).width = 15;  // Référence
    worksheet.getColumn(2).width = 15;  // Police
    worksheet.getColumn(3).width = 20;  // Établissement
    worksheet.getColumn(4).width = 25;  // Client
    worksheet.getColumn(5).width = 15;  // Téléphone
    worksheet.getColumn(6).width = 25;  // Email
    worksheet.getColumn(7).width = 30;  // Adresse
    worksheet.getColumn(8).width = 12;  // Date Naissance
    worksheet.getColumn(9).width = 20;  // Lieu Naissance
    worksheet.getColumn(10).width = 20; // Profession
    worksheet.getColumn(11).width = 15; // Type Client
    worksheet.getColumn(12).width = 20; // Produit
    worksheet.getColumn(13).width = 20; // Agence
    worksheet.getColumn(14).width = 20; // Utilisateur
    worksheet.getColumn(15).width = 15; // État
    worksheet.getColumn(16).width = 20; // Nature Crédit
    worksheet.getColumn(17).width = 15; // Capital
    worksheet.getColumn(18).width = 10; // Durée
    worksheet.getColumn(19).width = 10; // Taux
    worksheet.getColumn(20).width = 12; // Date Effet
    worksheet.getColumn(21).width = 12; // Date Échéance 1
    worksheet.getColumn(22).width = 12; // Date Échéance
    worksheet.getColumn(23).width = 8;  // PD
    worksheet.getColumn(24).width = 8;  // PC
    worksheet.getColumn(25).width = 8;  // Surp
    worksheet.getColumn(26).width = 8;  // ACC
    worksheet.getColumn(27).width = 8;  // FM
    worksheet.getColumn(28).width = 15; // Prime TTC
    worksheet.getColumn(29).width = 15; // Garantie Compl
    worksheet.getColumn(30).width = 30; // Description
    worksheet.getColumn(31).width = 8;  // Actif
    worksheet.getColumn(32).width = 12; // Créé le
    worksheet.getColumn(33).width = 12; // Modifié le

    // Ajouter une section de statistiques
    const statsRowStart = data.contracts.length + 8;
    
    // Calculer les statistiques
    const totalContracts = data.contracts.length;
    const totalCapital = data.contracts.reduce((sum, contract) => sum + (Number(contract.capital) || 0), 0);
    const totalPrimeTTC = data.contracts.reduce((sum, contract) => sum + (Number(contract.puttc) || 0), 0);
    const avgCapital = totalContracts > 0 ? totalCapital / totalContracts : 0;
    const avgPrimeTTC = totalContracts > 0 ? totalPrimeTTC / totalContracts : 0;

    // Titre des statistiques
    worksheet.mergeCells(`A${statsRowStart}:J${statsRowStart}`);
    const statsTitleCell = worksheet.getCell(`A${statsRowStart}`);
    statsTitleCell.value = 'STATISTIQUES DE PRODUCTION';
    statsTitleCell.font = { size: 14, bold: true, color: { argb: 'FF2E7D32' } };
    statsTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    statsTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };

    // Statistiques détaillées
    const statsData = [
      ['Total des contrats', totalContracts.toLocaleString('fr-FR')],
      ['Capital total', `${totalCapital.toLocaleString('fr-FR')} FCFA`],
      ['Prime TTC totale', `${totalPrimeTTC.toLocaleString('fr-FR')} FCFA`],
      ['Capital moyen', `${avgCapital.toLocaleString('fr-FR')} FCFA`],
      ['Prime TTC moyenne', `${avgPrimeTTC.toLocaleString('fr-FR')} FCFA`]
    ];

    statsData.forEach(([label, value], index) => {
      const row = statsRowStart + 2 + index;
      
      // Label
      const labelCell = worksheet.getCell(`A${row}`);
      labelCell.value = label;
      labelCell.font = { bold: true };
      labelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' }
      };
      labelCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Valeur
      const valueCell = worksheet.getCell(`B${row}`);
      valueCell.value = value;
      valueCell.font = { bold: true, color: { argb: 'FF2E7D32' } };
      valueCell.alignment = { horizontal: 'right' };
      valueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' }
      };
      valueCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  private async createUserSheets(
    workbook: ExcelJS.Workbook, 
    data: ProductionReportData,
    existingSheetNames: Set<string>,
    normalizeSheetName: (name: string) => string
  ): Promise<void> {
    // Grouper les contrats par utilisateur
    const contractsByUser = new Map<number, Contract[]>();
    
    data.contracts.forEach(contract => {
      if (contract.user) {
        const userId = contract.user.id;
        if (!contractsByUser.has(userId)) {
          contractsByUser.set(userId, []);
        }
        contractsByUser.get(userId)!.push(contract);
      }
    });

    // Mettre à jour le Set avec les feuilles existantes du workbook
    workbook.worksheets.forEach(ws => {
      existingSheetNames.add(normalizeSheetName(ws.name));
    });

    // Créer une feuille par utilisateur
    contractsByUser.forEach((userContracts, userId) => {
      const user = data.users.find(u => u.id === userId);
      if (!user) return;

      // Créer un nom de feuille unique (limite Excel: 31 caractères)
      const userName = `${user.firstname} ${user.lastname}`.trim();
      const prefix = 'Utilisateur - ';
      const maxNameLength = Math.max(1, 31 - prefix.length);
      const truncatedName = userName.length > maxNameLength 
        ? userName.substring(0, maxNameLength).trim() 
        : userName;
      
      let baseSheetName = `${prefix}${truncatedName}`;
      
      // Normaliser le nom à 31 caractères maximum
      baseSheetName = normalizeSheetName(baseSheetName);
      
      // Vérifier si le nom existe déjà et ajouter un suffixe si nécessaire
      let finalSheetName = baseSheetName;
      let counter = 1;
      while (existingSheetNames.has(finalSheetName)) {
        // Si conflit, utiliser format avec ID utilisateur
        if (user.id) {
          const uniqueId = `U${user.id}-${counter}`;
          finalSheetName = normalizeSheetName(uniqueId);
        } else {
          finalSheetName = normalizeSheetName(`User-${counter}`);
        }
        counter++;
        if (counter > 10000) {
          // En dernier recours, utiliser un hash
          finalSheetName = normalizeSheetName(`U${user.id || 'X'}-${Date.now().toString().slice(-6)}`);
          break;
        }
      }
      
      // Ajouter le nom final à l'ensemble pour les prochaines itérations
      existingSheetNames.add(finalSheetName);
      
      const worksheet = workbook.addWorksheet(finalSheetName);
      
      // En-tête
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `CONTRATS DE ${user.firstname.toUpperCase()} ${user.lastname.toUpperCase()}`;
      titleCell.font = { size: 14, bold: true, color: { argb: 'FF1976D2' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };

      // Informations utilisateur
      worksheet.mergeCells('A3:H3');
      const infoCell = worksheet.getCell('A3');
      infoCell.value = `Email: ${user.email} | Contrats: ${userContracts.length} | Période: ${data.period.startDate} au ${data.period.endDate}`;
      infoCell.font = { size: 11, bold: true };
      infoCell.alignment = { horizontal: 'center' };

      // En-têtes des colonnes - Version complète
      const headers = [
        'Référence', 'Police', 'Établissement',
        'Client', 'Téléphone', 'Email', 'Adresse', 'Date Naissance', 'Lieu Naissance', 'Profession', 'Type Client',
        'Produit', 'Agence', 'État', 'Nature Crédit',
        'Capital', 'Durée', 'Taux', 'Date Effet', 'Date Échéance 1', 'Date Échéance',
        'PD', 'PC', 'Surp', 'ACC', 'FM', 'Prime TTC', 'Garantie Compl', 'Description', 'Actif'
      ];

      const headerRow = worksheet.getRow(5);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1976D2' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Données des contrats de l'utilisateur - Version complète
      userContracts.forEach((contract, index) => {
        const row = worksheet.getRow(index + 6);
        const rowData = [
          // Identifiants
          contract.reference || 'N/A',
          contract.police || 'N/A',
          contract.etablissement || 'Non spécifié',
          
          // Informations client complètes
          contract.customer ? `${contract.customer.firstname} ${contract.customer.lastname}` : 'N/A',
          contract.customer?.phone || 'N/A',
          contract.customer?.email || 'N/A',
          contract.customer?.address || 'N/A',
          contract.customer?.birthdate ? new Date(contract.customer.birthdate).toLocaleDateString('fr-FR') : 'N/A',
          contract.customer?.placeOfBirth || 'N/A',
          contract.customer?.occupation || 'N/A',
          contract.customer?.typeCustomer?.libelle || 'N/A',
          
          // Informations produit et organisation
          contract.product?.name || 'N/A',
          contract.agency?.name || 'N/A',
          contract.contractState?.libelle || 'N/A',
          contract.natureCredit?.libelle || 'N/A',
          
          // Informations financières
          contract.capital ? Number(contract.capital).toLocaleString('fr-FR') : 'N/A',
          contract.duration || 0,
          contract.taux ? `${contract.taux}%` : 'N/A',
          
          // Dates
          contract.dateEff ? new Date(contract.dateEff).toLocaleDateString('fr-FR') : 'N/A',
          contract.dateEch1 ? new Date(contract.dateEch1).toLocaleDateString('fr-FR') : 'N/A',
          contract.dateEch ? new Date(contract.dateEch).toLocaleDateString('fr-FR') : 'N/A',
          
          // Primes et garanties
          contract.pd || 0,
          contract.pc || 0,
          contract.surp || 0,
          contract.acc || 0,
          contract.fm || 0,
          contract.puttc ? Number(contract.puttc).toLocaleString('fr-FR') : 'N/A',
          contract.garantieCompl || 'NON',
          
          // Informations supplémentaires
          contract.description || 'N/A',
          contract.isActive ? 'Oui' : 'Non'
        ];

        rowData.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = value;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
            };
          }
        });
      });

      // Ajuster la largeur des colonnes
      worksheet.columns.forEach(column => {
        column.width = 12;
      });
      // Largeurs spécifiques pour les colonnes importantes
      worksheet.getColumn(1).width = 15;  // Référence
      worksheet.getColumn(2).width = 15;  // Police
      worksheet.getColumn(3).width = 20;  // Établissement
      worksheet.getColumn(4).width = 25;  // Client
      worksheet.getColumn(5).width = 15;  // Téléphone
      worksheet.getColumn(6).width = 25;  // Email
      worksheet.getColumn(7).width = 30;  // Adresse
      worksheet.getColumn(8).width = 12;  // Date Naissance
      worksheet.getColumn(9).width = 20;  // Lieu Naissance
      worksheet.getColumn(10).width = 20; // Profession
      worksheet.getColumn(11).width = 15; // Type Client
      worksheet.getColumn(12).width = 20; // Produit
      worksheet.getColumn(13).width = 20; // Agence
      worksheet.getColumn(14).width = 15; // État
      worksheet.getColumn(15).width = 20; // Nature Crédit
      worksheet.getColumn(16).width = 15; // Capital
      worksheet.getColumn(17).width = 10; // Durée
      worksheet.getColumn(18).width = 10; // Taux
      worksheet.getColumn(19).width = 12; // Date Effet
      worksheet.getColumn(20).width = 12; // Date Échéance 1
      worksheet.getColumn(21).width = 12; // Date Échéance
      worksheet.getColumn(22).width = 8;  // PD
      worksheet.getColumn(23).width = 8;  // PC
      worksheet.getColumn(24).width = 8;  // Surp
      worksheet.getColumn(25).width = 8;  // ACC
      worksheet.getColumn(26).width = 8;  // FM
      worksheet.getColumn(27).width = 15; // Prime TTC
      worksheet.getColumn(28).width = 15; // Garantie Compl
      worksheet.getColumn(29).width = 30; // Description
      worksheet.getColumn(30).width = 8;  // Actif
    });
  }

  private async createCustomerSheets(
    workbook: ExcelJS.Workbook, 
    data: ProductionReportData,
    existingSheetNames: Set<string>,
    normalizeSheetName: (name: string) => string
  ): Promise<void> {
    // Grouper les contrats par client
    const contractsByCustomer = new Map<number, Contract[]>();
    
    data.contracts.forEach(contract => {
      if (contract.customer) {
        const customerId = contract.customer.id;
        if (!contractsByCustomer.has(customerId)) {
          contractsByCustomer.set(customerId, []);
        }
        contractsByCustomer.get(customerId)!.push(contract);
      }
    });

    // Mettre à jour le Set avec les feuilles existantes du workbook
    workbook.worksheets.forEach(ws => {
      existingSheetNames.add(normalizeSheetName(ws.name));
    });

    // Créer une feuille par client
    contractsByCustomer.forEach((customerContracts, customerId) => {
      const customer = customerContracts[0].customer;
      if (!customer) return;

      // Créer un nom unique pour la feuille (limite Excel: 31 caractères)
      const customerName = `${customer.firstname} ${customer.lastname}`.trim();
      // Format: "Nom C{id}" - tronquer le nom si nécessaire pour respecter la limite de 31 caractères
      const idPart = ` C${customerId}`;
      const maxNameLength = Math.max(1, 31 - idPart.length); // Au moins 1 caractère pour le nom
      const truncatedName = customerName.length > maxNameLength 
        ? customerName.substring(0, maxNameLength).trim() 
        : customerName;
      
      // Construire le nom de base avec le nom tronqué et l'ID
      let baseSheetName = `${truncatedName}${idPart}`;
      
      // Normaliser le nom à 31 caractères maximum
      baseSheetName = normalizeSheetName(baseSheetName);
      
      // Si le nom normalisé est trop court ou vide, utiliser uniquement l'ID
      if (!baseSheetName || baseSheetName.length < 3) {
        baseSheetName = `C${customerId}`;
      }
      
      // Vérifier si le nom existe déjà (en tenant compte de la troncature ExcelJS)
      let finalSheetName = baseSheetName;
      let counter = 1;
      while (existingSheetNames.has(finalSheetName)) {
        // Si conflit, utiliser uniquement l'ID avec un compteur pour garantir l'unicité
        const uniqueId = `C${customerId}-${counter}`;
        finalSheetName = normalizeSheetName(uniqueId);
        counter++;
        if (counter > 10000) {
          // En dernier recours, utiliser un hash
          finalSheetName = normalizeSheetName(`C${customerId}-${Date.now().toString().slice(-6)}`);
          break;
        }
      }
      
      // Ajouter le nom final à l'ensemble pour les prochaines itérations
      existingSheetNames.add(finalSheetName);

      const worksheet = workbook.addWorksheet(finalSheetName);
      
      // En-tête
      worksheet.mergeCells('A1:I1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `CONTRATS DE ${customer.firstname.toUpperCase()} ${customer.lastname.toUpperCase()}`;
      titleCell.font = { size: 14, bold: true, color: { argb: 'FF7B1FA2' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3E5F5' }
      };

      // Informations client
      worksheet.mergeCells('A3:I3');
      const infoCell = worksheet.getCell('A3');
      infoCell.value = `Email: ${customer.email} | Téléphone: ${customer.phone} | Contrats: ${customerContracts.length} | Période: ${data.period.startDate} au ${data.period.endDate}`;
      infoCell.font = { size: 11, bold: true };
      infoCell.alignment = { horizontal: 'center' };

      // En-têtes des colonnes - Version complète
      const headers = [
        'Référence', 'Police', 'Établissement',
        'Produit', 'Agence', 'Utilisateur', 'État', 'Nature Crédit',
        'Capital', 'Durée', 'Taux', 'Date Effet', 'Date Échéance 1', 'Date Échéance',
        'PD', 'PC', 'Surp', 'ACC', 'FM', 'Prime TTC', 'Garantie Compl', 'Description', 'Actif'
      ];

      const headerRow = worksheet.getRow(5);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF7B1FA2' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Données des contrats du client - Version complète
      customerContracts.forEach((contract, index) => {
        const row = worksheet.getRow(index + 6);
        const rowData = [
          // Identifiants
          contract.reference || 'N/A',
          contract.police || 'N/A',
          contract.etablissement || 'Non spécifié',
          
          // Informations produit et organisation
          contract.product?.name || 'N/A',
          contract.agency?.name || 'N/A',
          contract.user ? `${contract.user.firstname} ${contract.user.lastname}` : 'N/A',
          contract.contractState?.libelle || 'N/A',
          contract.natureCredit?.libelle || 'N/A',
          
          // Informations financières
          contract.capital ? Number(contract.capital).toLocaleString('fr-FR') : 'N/A',
          contract.duration || 0,
          contract.taux ? `${contract.taux}%` : 'N/A',
          
          // Dates
          contract.dateEff ? new Date(contract.dateEff).toLocaleDateString('fr-FR') : 'N/A',
          contract.dateEch1 ? new Date(contract.dateEch1).toLocaleDateString('fr-FR') : 'N/A',
          contract.dateEch ? new Date(contract.dateEch).toLocaleDateString('fr-FR') : 'N/A',
          
          // Primes et garanties
          contract.pd || 0,
          contract.pc || 0,
          contract.surp || 0,
          contract.acc || 0,
          contract.fm || 0,
          contract.puttc ? Number(contract.puttc).toLocaleString('fr-FR') : 'N/A',
          contract.garantieCompl || 'NON',
          
          // Informations supplémentaires
          contract.description || 'N/A',
          contract.isActive ? 'Oui' : 'Non'
        ];

        rowData.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = value;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
            };
          }
        });
      });

      // Ajuster la largeur des colonnes
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      worksheet.getColumn(3).width = 20; // Agence
      worksheet.getColumn(4).width = 20; // Utilisateur
    });
  }

  /**
   * Crée une feuille avec des tableaux de statistiques visuels et des graphiques
   */
  private async createChartsSheet(workbook: ExcelJS.Workbook, data: ProductionReportData): Promise<void> {
    const worksheet = workbook.addWorksheet('STATISTIQUES VISUELLES');

    // En-tête principal
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'STATISTIQUES VISUELLES DE PRODUCTION';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF231F20' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF33B04A' }
    };

    // Période
    worksheet.mergeCells('A2:L2');
    const periodCell = worksheet.getCell('A2');
    periodCell.value = `Période: ${data.period.startDate} au ${data.period.endDate}`;
    periodCell.font = { size: 12, bold: true, color: { argb: 'FF231F20' } };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Données pour les statistiques
    const contracts = data.contracts;
    
    // 1. Tableau des contrats par agence
    await this.createAgencyTable(worksheet, contracts);
    
    // 2. Tableau des contrats par utilisateur
    await this.createUserTable(worksheet, contracts);
    
    // 3. Tableau des contrats par nature de crédit
    await this.createNatureCreditTable(worksheet, contracts);
    
    // 4. Tableau des montants par mois
    await this.createMonthlyAmountTable(worksheet, contracts);
    
    // 5. Tableau des statuts de contrats
    await this.createContractStatusTable(worksheet, contracts);
    
    // 6. Graphiques ASCII art pour visualisation
    await this.createAsciiCharts(worksheet, contracts);
  }

  /**
   * Crée un tableau des contrats par agence
   */
  private async createAgencyTable(worksheet: ExcelJS.Worksheet, contracts: Contract[]): Promise<void> {
    // Données pour le tableau
    const agencyData = contracts.reduce((acc, contract) => {
      const agencyName = contract.agency?.name || 'Non assignée';
      if (!acc[agencyName]) {
        acc[agencyName] = { count: 0, totalCapital: 0, totalPrime: 0 };
      }
      acc[agencyName].count++;
      acc[agencyName].totalCapital += Number(contract.capital || 0);
      acc[agencyName].totalPrime += Number(contract.puttc || 0);
      return acc;
    }, {} as { [key: string]: { count: number; totalCapital: number; totalPrime: number } });

    const startRow = 4;
    const startCol = 1;
    
    // Titre de la section
    worksheet.mergeCells(startRow, startCol, startRow, startCol + 4);
    const titleCell = worksheet.getCell(startRow, startCol);
    titleCell.value = '📊 RÉPARTITION PAR AGENCE';
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF231F20' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };
    
    // En-têtes
    const headerRow = startRow + 1;
    worksheet.getCell(headerRow, startCol).value = 'Agence';
    worksheet.getCell(headerRow, startCol + 1).value = 'Nombre de contrats';
    worksheet.getCell(headerRow, startCol + 2).value = 'Capital total (FCFA)';
    worksheet.getCell(headerRow, startCol + 3).value = 'Prime TTC totale (FCFA)';
    worksheet.getCell(headerRow, startCol + 4).value = 'Capital moyen (FCFA)';
    
    // Style des en-têtes
    for (let col = startCol; col <= startCol + 4; col++) {
      const cell = worksheet.getCell(headerRow, col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF33B04A' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Données
    let currentRow = headerRow + 1;
    Object.entries(agencyData)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([agency, data]) => {
        worksheet.getCell(currentRow, startCol).value = agency;
        worksheet.getCell(currentRow, startCol + 1).value = data.count;
        worksheet.getCell(currentRow, startCol + 2).value = data.totalCapital;
        worksheet.getCell(currentRow, startCol + 3).value = data.totalPrime;
        worksheet.getCell(currentRow, startCol + 4).value = Math.round(data.totalCapital / data.count);
        
        // Style des cellules de données
        for (let col = startCol; col <= startCol + 4; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
          if (col > startCol) {
            cell.alignment = { horizontal: 'right' };
          }
        }
        currentRow++;
      });

    // Ajuster la largeur des colonnes
    worksheet.getColumn(startCol).width = 25;
    worksheet.getColumn(startCol + 1).width = 18;
    worksheet.getColumn(startCol + 2).width = 20;
    worksheet.getColumn(startCol + 3).width = 20;
    worksheet.getColumn(startCol + 4).width = 20;
  }

  /**
   * Crée un tableau des contrats par utilisateur
   */
  private async createUserTable(worksheet: ExcelJS.Worksheet, contracts: Contract[]): Promise<void> {
    const userData = contracts.reduce((acc, contract) => {
      const userName = contract.user ? `${contract.user.firstname} ${contract.user.lastname}` : 'Non assigné';
      if (!acc[userName]) {
        acc[userName] = { count: 0, totalCapital: 0, totalPrime: 0 };
      }
      acc[userName].count++;
      acc[userName].totalCapital += Number(contract.capital || 0);
      acc[userName].totalPrime += Number(contract.puttc || 0);
      return acc;
    }, {} as { [key: string]: { count: number; totalCapital: number; totalPrime: number } });

    const startRow = 20;
    const startCol = 1;
    
    // Titre de la section
    worksheet.mergeCells(startRow, startCol, startRow, startCol + 4);
    const titleCell = worksheet.getCell(startRow, startCol);
    titleCell.value = '👥 RÉPARTITION PAR UTILISATEUR';
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF231F20' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };
    
    // En-têtes
    const headerRow = startRow + 1;
    worksheet.getCell(headerRow, startCol).value = 'Utilisateur';
    worksheet.getCell(headerRow, startCol + 1).value = 'Nombre de contrats';
    worksheet.getCell(headerRow, startCol + 2).value = 'Capital total (FCFA)';
    worksheet.getCell(headerRow, startCol + 3).value = 'Prime TTC totale (FCFA)';
    worksheet.getCell(headerRow, startCol + 4).value = 'Capital moyen (FCFA)';
    
    // Style des en-têtes
    for (let col = startCol; col <= startCol + 4; col++) {
      const cell = worksheet.getCell(headerRow, col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF33B04A' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Données
    let currentRow = headerRow + 1;
    Object.entries(userData)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([user, data]) => {
        worksheet.getCell(currentRow, startCol).value = user;
        worksheet.getCell(currentRow, startCol + 1).value = data.count;
        worksheet.getCell(currentRow, startCol + 2).value = data.totalCapital;
        worksheet.getCell(currentRow, startCol + 3).value = data.totalPrime;
        worksheet.getCell(currentRow, startCol + 4).value = Math.round(data.totalCapital / data.count);
        
        // Style des cellules de données
        for (let col = startCol; col <= startCol + 4; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
          if (col > startCol) {
            cell.alignment = { horizontal: 'right' };
          }
        }
        currentRow++;
      });

    // Ajuster la largeur des colonnes
    worksheet.getColumn(startCol).width = 25;
    worksheet.getColumn(startCol + 1).width = 18;
    worksheet.getColumn(startCol + 2).width = 20;
    worksheet.getColumn(startCol + 3).width = 20;
    worksheet.getColumn(startCol + 4).width = 20;
  }

  /**
   * Crée un tableau des contrats par nature de crédit
   */
  private async createNatureCreditTable(worksheet: ExcelJS.Worksheet, contracts: Contract[]): Promise<void> {
    const natureData = contracts.reduce((acc, contract) => {
      const natureName = contract.natureCredit?.libelle || 'Non définie';
      if (!acc[natureName]) {
        acc[natureName] = { count: 0, totalCapital: 0, totalPrime: 0 };
      }
      acc[natureName].count++;
      acc[natureName].totalCapital += Number(contract.capital || 0);
      acc[natureName].totalPrime += Number(contract.puttc || 0);
      return acc;
    }, {} as { [key: string]: { count: number; totalCapital: number; totalPrime: number } });

    const startRow = 4;
    const startCol = 7;
    
    // Titre de la section
    worksheet.mergeCells(startRow, startCol, startRow, startCol + 4);
    const titleCell = worksheet.getCell(startRow, startCol);
    titleCell.value = '💳 RÉPARTITION PAR NATURE DE CRÉDIT';
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF231F20' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };
    
    // En-têtes
    const headerRow = startRow + 1;
    worksheet.getCell(headerRow, startCol).value = 'Nature de crédit';
    worksheet.getCell(headerRow, startCol + 1).value = 'Nombre de contrats';
    worksheet.getCell(headerRow, startCol + 2).value = 'Capital total (FCFA)';
    worksheet.getCell(headerRow, startCol + 3).value = 'Prime TTC totale (FCFA)';
    worksheet.getCell(headerRow, startCol + 4).value = 'Capital moyen (FCFA)';
    
    // Style des en-têtes
    for (let col = startCol; col <= startCol + 4; col++) {
      const cell = worksheet.getCell(headerRow, col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF33B04A' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Données
    let currentRow = headerRow + 1;
    Object.entries(natureData)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([nature, data]) => {
        worksheet.getCell(currentRow, startCol).value = nature;
        worksheet.getCell(currentRow, startCol + 1).value = data.count;
        worksheet.getCell(currentRow, startCol + 2).value = data.totalCapital;
        worksheet.getCell(currentRow, startCol + 3).value = data.totalPrime;
        worksheet.getCell(currentRow, startCol + 4).value = Math.round(data.totalCapital / data.count);
        
        // Style des cellules de données
        for (let col = startCol; col <= startCol + 4; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
          if (col > startCol) {
            cell.alignment = { horizontal: 'right' };
          }
        }
        currentRow++;
      });

    // Ajuster la largeur des colonnes
    worksheet.getColumn(startCol).width = 25;
    worksheet.getColumn(startCol + 1).width = 18;
    worksheet.getColumn(startCol + 2).width = 20;
    worksheet.getColumn(startCol + 3).width = 20;
    worksheet.getColumn(startCol + 4).width = 20;
  }

  /**
   * Crée un tableau des montants par mois
   */
  private async createMonthlyAmountTable(worksheet: ExcelJS.Worksheet, contracts: Contract[]): Promise<void> {
    const monthlyData = contracts.reduce((acc, contract) => {
      const date = new Date(contract.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { name: monthName, count: 0, totalCapital: 0, totalPrime: 0 };
      }
      acc[monthKey].count++;
      acc[monthKey].totalCapital += Number(contract.capital || 0);
      acc[monthKey].totalPrime += Number(contract.puttc || 0);
      return acc;
    }, {} as { [key: string]: { name: string; count: number; totalCapital: number; totalPrime: number } });

    const startRow = 20;
    const startCol = 7;
    
    // Titre de la section
    worksheet.mergeCells(startRow, startCol, startRow, startCol + 4);
    const titleCell = worksheet.getCell(startRow, startCol);
    titleCell.value = '📅 ÉVOLUTION MENSUELLE';
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF231F20' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };
    
    // En-têtes
    const headerRow = startRow + 1;
    worksheet.getCell(headerRow, startCol).value = 'Mois';
    worksheet.getCell(headerRow, startCol + 1).value = 'Nombre de contrats';
    worksheet.getCell(headerRow, startCol + 2).value = 'Capital total (FCFA)';
    worksheet.getCell(headerRow, startCol + 3).value = 'Prime TTC totale (FCFA)';
    worksheet.getCell(headerRow, startCol + 4).value = 'Capital moyen (FCFA)';
    
    // Style des en-têtes
    for (let col = startCol; col <= startCol + 4; col++) {
      const cell = worksheet.getCell(headerRow, col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF33B04A' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Données
    let currentRow = headerRow + 1;
    Object.values(monthlyData)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((month) => {
        worksheet.getCell(currentRow, startCol).value = month.name;
        worksheet.getCell(currentRow, startCol + 1).value = month.count;
        worksheet.getCell(currentRow, startCol + 2).value = month.totalCapital;
        worksheet.getCell(currentRow, startCol + 3).value = month.totalPrime;
        worksheet.getCell(currentRow, startCol + 4).value = Math.round(month.totalCapital / month.count);
        
        // Style des cellules de données
        for (let col = startCol; col <= startCol + 4; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
          if (col > startCol) {
            cell.alignment = { horizontal: 'right' };
          }
        }
        currentRow++;
      });

    // Ajuster la largeur des colonnes
    worksheet.getColumn(startCol).width = 25;
    worksheet.getColumn(startCol + 1).width = 18;
    worksheet.getColumn(startCol + 2).width = 20;
    worksheet.getColumn(startCol + 3).width = 20;
    worksheet.getColumn(startCol + 4).width = 20;
  }

  /**
   * Crée un tableau des statuts de contrats
   */
  private async createContractStatusTable(worksheet: ExcelJS.Worksheet, contracts: Contract[]): Promise<void> {
    const statusData = contracts.reduce((acc, contract) => {
      const statusName = contract.contractState?.libelle || 'Non défini';
      if (!acc[statusName]) {
        acc[statusName] = { count: 0, totalCapital: 0, totalPrime: 0 };
      }
      acc[statusName].count++;
      acc[statusName].totalCapital += Number(contract.capital || 0);
      acc[statusName].totalPrime += Number(contract.puttc || 0);
      return acc;
    }, {} as { [key: string]: { count: number; totalCapital: number; totalPrime: number } });

    const startRow = 40;
    const startCol = 1;
    
    // Titre de la section
    worksheet.mergeCells(startRow, startCol, startRow, startCol + 4);
    const titleCell = worksheet.getCell(startRow, startCol);
    titleCell.value = '📊 RÉPARTITION PAR STATUT';
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF231F20' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };
    
    // En-têtes
    const headerRow = startRow + 1;
    worksheet.getCell(headerRow, startCol).value = 'Statut';
    worksheet.getCell(headerRow, startCol + 1).value = 'Nombre de contrats';
    worksheet.getCell(headerRow, startCol + 2).value = 'Capital total (FCFA)';
    worksheet.getCell(headerRow, startCol + 3).value = 'Prime TTC totale (FCFA)';
    worksheet.getCell(headerRow, startCol + 4).value = 'Capital moyen (FCFA)';
    
    // Style des en-têtes
    for (let col = startCol; col <= startCol + 4; col++) {
      const cell = worksheet.getCell(headerRow, col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF33B04A' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Données
    let currentRow = headerRow + 1;
    Object.entries(statusData)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([status, data]) => {
        worksheet.getCell(currentRow, startCol).value = status;
        worksheet.getCell(currentRow, startCol + 1).value = data.count;
        worksheet.getCell(currentRow, startCol + 2).value = data.totalCapital;
        worksheet.getCell(currentRow, startCol + 3).value = data.totalPrime;
        worksheet.getCell(currentRow, startCol + 4).value = Math.round(data.totalCapital / data.count);
        
        // Style des cellules de données
        for (let col = startCol; col <= startCol + 4; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
          if (col > startCol) {
            cell.alignment = { horizontal: 'right' };
          }
        }
        currentRow++;
      });

    // Ajuster la largeur des colonnes
    worksheet.getColumn(startCol).width = 25;
    worksheet.getColumn(startCol + 1).width = 18;
    worksheet.getColumn(startCol + 2).width = 20;
    worksheet.getColumn(startCol + 3).width = 20;
    worksheet.getColumn(startCol + 4).width = 20;
  }

  /**
   * Crée des graphiques ASCII art pour visualisation
   */
  private async createAsciiCharts(worksheet: ExcelJS.Worksheet, contracts: Contract[]): Promise<void> {
    const startRow = 60;
    
    // Titre de la section graphiques
    worksheet.mergeCells(startRow, 1, startRow, 12);
    const titleCell = worksheet.getCell(startRow, 1);
    titleCell.value = '📊 GRAPHIQUES DE PRODUCTION';
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF231F20' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Graphique en barres des agences
    await this.createAsciiBarChart(worksheet, contracts, startRow + 2, 1, 'Agences');
    
    // Graphique en barres des utilisateurs
    await this.createAsciiBarChart(worksheet, contracts, startRow + 2, 7, 'Utilisateurs');
    
    // Graphique en secteurs des natures de crédit
    await this.createAsciiPieChart(worksheet, contracts, startRow + 15, 1, 'Natures de Crédit');
    
    // Graphique linéaire de l'évolution mensuelle
    await this.createAsciiLineChart(worksheet, contracts, startRow + 15, 7, 'Évolution Mensuelle');
  }

  /**
   * Crée un graphique en barres ASCII
   */
  private async createAsciiBarChart(worksheet: ExcelJS.Worksheet, contracts: Contract[], startRow: number, startCol: number, title: string): Promise<void> {
    // Données pour le graphique
    const data = contracts.reduce((acc, contract) => {
      const key = title === 'Agences' 
        ? (contract.agency?.name || 'Non assignée')
        : (contract.user ? `${contract.user.firstname} ${contract.user.lastname}` : 'Non assigné');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Titre du graphique
    worksheet.mergeCells(startRow, startCol, startRow, startCol + 5);
    const titleCell = worksheet.getCell(startRow, startCol);
    titleCell.value = `📊 ${title}`;
    titleCell.font = { size: 12, bold: true, color: { argb: 'FF231F20' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F8FF' }
    };

    // Trouver la valeur maximale pour l'échelle
    const maxValue = Math.max(...Object.values(data));
    const maxBarLength = 20; // Longueur maximale de la barre

    let currentRow = startRow + 1;
    Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // Limiter à 8 éléments pour la lisibilité
      .forEach(([label, value]) => {
        const barLength = Math.round((value / maxValue) * maxBarLength);
        const bar = '█'.repeat(barLength) + '░'.repeat(maxBarLength - barLength);
        
        // Label (tronqué si trop long)
        const shortLabel = label.length > 15 ? label.substring(0, 12) + '...' : label;
        worksheet.getCell(currentRow, startCol).value = shortLabel;
        worksheet.getCell(currentRow, startCol).font = { size: 10 };
        
        // Barre ASCII
        worksheet.getCell(currentRow, startCol + 1).value = bar;
        worksheet.getCell(currentRow, startCol + 1).font = { 
          size: 10, 
          color: { argb: 'FF33B04A' } 
        };
        
        // Valeur
        worksheet.getCell(currentRow, startCol + 2).value = value;
        worksheet.getCell(currentRow, startCol + 2).font = { size: 10, bold: true };
        worksheet.getCell(currentRow, startCol + 2).alignment = { horizontal: 'right' };
        
        currentRow++;
      });

    // Légende
    worksheet.getCell(currentRow, startCol).value = 'Max:';
    worksheet.getCell(currentRow, startCol + 1).value = maxValue;
    worksheet.getCell(currentRow, startCol + 1).font = { size: 10, bold: true };
  }

  /**
   * Crée un graphique en secteurs ASCII
   */
  private async createAsciiPieChart(worksheet: ExcelJS.Worksheet, contracts: Contract[], startRow: number, startCol: number, title: string): Promise<void> {
    // Données pour le graphique
    const data = contracts.reduce((acc, contract) => {
      const key = contract.natureCredit?.libelle || 'Non définie';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const total = Object.values(data).reduce((sum, value) => sum + value, 0);

    // Titre du graphique
    worksheet.mergeCells(startRow, startCol, startRow, startCol + 5);
    const titleCell = worksheet.getCell(startRow, startCol);
    titleCell.value = `🥧 ${title}`;
    titleCell.font = { size: 12, bold: true, color: { argb: 'FF231F20' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F8FF' }
    };

    let currentRow = startRow + 1;
    Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6) // Limiter à 6 éléments
      .forEach(([label, value]) => {
        const percentage = Math.round((value / total) * 100);
        const barLength = Math.round(percentage / 5); // 5% par caractère
        const bar = '●'.repeat(barLength) + '○'.repeat(20 - barLength);
        
        // Label
        const shortLabel = label.length > 12 ? label.substring(0, 9) + '...' : label;
        worksheet.getCell(currentRow, startCol).value = shortLabel;
        worksheet.getCell(currentRow, startCol).font = { size: 10 };
        
        // Barre de pourcentage
        worksheet.getCell(currentRow, startCol + 1).value = bar;
        worksheet.getCell(currentRow, startCol + 1).font = { 
          size: 10, 
          color: { argb: 'FF33B04A' } 
        };
        
        // Pourcentage
        worksheet.getCell(currentRow, startCol + 2).value = `${percentage}%`;
        worksheet.getCell(currentRow, startCol + 2).font = { size: 10, bold: true };
        worksheet.getCell(currentRow, startCol + 2).alignment = { horizontal: 'right' };
        
        currentRow++;
      });
  }

  /**
   * Crée un graphique linéaire ASCII
   */
  private async createAsciiLineChart(worksheet: ExcelJS.Worksheet, contracts: Contract[], startRow: number, startCol: number, title: string): Promise<void> {
    // Données mensuelles
    const monthlyData = contracts.reduce((acc, contract) => {
      const date = new Date(contract.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { name: monthName, count: 0 };
      }
      acc[monthKey].count++;
      return acc;
    }, {} as { [key: string]: { name: string; count: number } });

    // Titre du graphique
    worksheet.mergeCells(startRow, startCol, startRow, startCol + 5);
    const titleCell = worksheet.getCell(startRow, startCol);
    titleCell.value = `📈 ${title}`;
    titleCell.font = { size: 12, bold: true, color: { argb: 'FF231F20' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F8FF' }
    };

    const sortedData = Object.values(monthlyData).sort((a, b) => a.name.localeCompare(b.name));
    const maxValue = Math.max(...sortedData.map(d => d.count));
    const maxBarLength = 15;

    let currentRow = startRow + 1;
    sortedData.forEach((month) => {
      const barLength = Math.round((month.count / maxValue) * maxBarLength);
      const bar = '█'.repeat(barLength) + '░'.repeat(maxBarLength - barLength);
      
      // Mois
      worksheet.getCell(currentRow, startCol).value = month.name;
      worksheet.getCell(currentRow, startCol).font = { size: 10 };
      
      // Barre
      worksheet.getCell(currentRow, startCol + 1).value = bar;
      worksheet.getCell(currentRow, startCol + 1).font = { 
        size: 10, 
        color: { argb: 'FF33B04A' } 
      };
      
      // Valeur
      worksheet.getCell(currentRow, startCol + 2).value = month.count;
      worksheet.getCell(currentRow, startCol + 2).font = { size: 10, bold: true };
      worksheet.getCell(currentRow, startCol + 2).alignment = { horizontal: 'right' };
      
    });
  }

  async generateBiOverviewExcel(data: {
    kpis: any;
    evolution: any;
    natureData: any[];
    agencesData: any[];
    period: { startDate: string; endDate: string };
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PADME S.A';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Vue Générale');
    worksheet.views = [{ showGridLines: true }];

    // Title
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'TABLEAU DE BORD BI - VUE D\'ENSEMBLE';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1B434' }
    };
    worksheet.getRow(1).height = 40;

    // Period
    worksheet.mergeCells('A2:G2');
    const periodCell = worksheet.getCell('A2');
    periodCell.value = `Période du ${data.period.startDate || 'N/A'} au ${data.period.endDate || 'N/A'}`;
    periodCell.font = { name: 'Arial', size: 11, italic: true };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 20;

    // KPI Section
    const kpiHeaders = ['Indicateur', 'Période Actuelle', 'Période Précédente', 'Évolution (%)'];
    const kpiRows = [
      { label: 'Contrats Actifs', key: 'contrats', format: '#,##0' },
      { label: 'Simulations Réalisées', key: 'cotations', format: '#,##0' },
      { label: 'Taux de Transformation', key: 'tauxTransformation', format: '0.0"%"' },
      { label: 'Primes Encaissées', key: 'primes', format: '#,##0" FCFA"' },
      { label: 'Capital Assuré', key: 'capital', format: '#,##0" FCFA"' }
    ];

    worksheet.mergeCells('A4:D4');
    const sectionTitle = worksheet.getCell('A4');
    sectionTitle.value = '📈 INDICATEURS CLÉS DE PERFORMANCE';
    sectionTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF231F20' } };
    sectionTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFDF6E2' }
    };
    worksheet.getRow(4).height = 25;

    // Headers
    const kpiHeaderRow = worksheet.getRow(5);
    kpiHeaderRow.height = 22;
    kpiHeaders.forEach((h, i) => {
      const cell = kpiHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1B434' }
      };
      cell.alignment = { horizontal: i === 0 ? 'left' : 'right', vertical: 'middle' };
    });

    let kpiCurrentRow = 6;
    kpiRows.forEach(rowInfo => {
      const row = worksheet.getRow(kpiCurrentRow);
      row.height = 20;

      const kpiData = data.kpis[rowInfo.key] || { current: 0, previous: 0, pct: 0 };

      // Label
      const cell1 = row.getCell(1);
      cell1.value = rowInfo.label;
      cell1.font = { name: 'Arial', bold: true };

      // Current
      const cell2 = row.getCell(2);
      cell2.value = kpiData.current;
      cell2.numFmt = rowInfo.format;

      // Previous
      const cell3 = row.getCell(3);
      cell3.value = kpiData.previous;
      cell3.numFmt = rowInfo.format;

      // Evolution
      const cell4 = row.getCell(4);
      cell4.value = kpiData.pct / 100;
      cell4.numFmt = '+0.0%;-0.0%;0.0%';
      if (kpiData.pct > 0) {
        cell4.font = { name: 'Arial', color: { argb: 'FFB58315' }, bold: true };
      } else if (kpiData.pct < 0) {
        cell4.font = { name: 'Arial', color: { argb: 'FFC62828' }, bold: true };
      }

      for (let col = 1; col <= 4; col++) {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        if (col > 1) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      }

      kpiCurrentRow++;
    });

    // Evolution Mensuelle Section
    const evolStartRow = kpiCurrentRow + 2;
    worksheet.mergeCells(`A${evolStartRow}:D${evolStartRow}`);
    const evolSectionTitle = worksheet.getCell(`A${evolStartRow}`);
    evolSectionTitle.value = '📅 ÉVOLUTION MENSUELLE';
    evolSectionTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF231F20' } };
    evolSectionTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' }
    };
    worksheet.getRow(evolStartRow).height = 25;

    const evolHeaderRow = worksheet.getRow(evolStartRow + 1);
    evolHeaderRow.height = 22;
    const evolHeaders = ['Mois', 'Contrats', 'Primes (FCFA)', 'Simulations'];
    evolHeaders.forEach((h, i) => {
      const cell = evolHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }
      };
      cell.alignment = { horizontal: i === 0 ? 'left' : 'right', vertical: 'middle' };
    });

    let evolCurrentRow = evolStartRow + 2;
    const labels = data.evolution.labels || [];
    labels.forEach((label, idx) => {
      const row = worksheet.getRow(evolCurrentRow);
      row.height = 20;

      row.getCell(1).value = label;
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

      const cContrats = row.getCell(2);
      cContrats.value = data.evolution.contrats?.[idx] || 0;
      cContrats.numFmt = '#,##0';

      const cPrimes = row.getCell(3);
      cPrimes.value = data.evolution.primes?.[idx] || 0;
      cPrimes.numFmt = '#,##0';

      const cCots = row.getCell(4);
      cCots.value = data.evolution.cotations?.[idx] || 0;
      cCots.numFmt = '#,##0';

      for (let col = 1; col <= 4; col++) {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        if (col > 1) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      }
      evolCurrentRow++;
    });

    // Nature de Crédit Section
    const natStartRow = evolCurrentRow + 2;
    worksheet.mergeCells(`A${natStartRow}:D${natStartRow}`);
    const natSectionTitle = worksheet.getCell(`A${natStartRow}`);
    natSectionTitle.value = '🏷️ RÉPARTITION PAR NATURE DE CRÉDIT';
    natSectionTitle.font = { name: 'Arial', size: 12, bold: true };
    natSectionTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFDF6E2' }
    };
    worksheet.getRow(natStartRow).height = 25;

    const natHeaderRow = worksheet.getRow(natStartRow + 1);
    natHeaderRow.height = 22;
    const natHeaders = ['Nature de Crédit', 'Contrats', 'Primes (FCFA)', 'Part (%)'];
    natHeaders.forEach((h, i) => {
      const cell = natHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1B434' }
      };
      cell.alignment = { horizontal: i === 0 ? 'left' : 'right', vertical: 'middle' };
    });

    let natCurrentRow = natStartRow + 2;
    (data.natureData || []).forEach(item => {
      const row = worksheet.getRow(natCurrentRow);
      row.height = 20;

      row.getCell(1).value = item.libelle;
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

      const cContrats = row.getCell(2);
      cContrats.value = item.contrats;
      cContrats.numFmt = '#,##0';

      const cPrimes = row.getCell(3);
      cPrimes.value = item.primes;
      cPrimes.numFmt = '#,##0';

      const cPart = row.getCell(4);
      cPart.value = item.partMarche / 100;
      cPart.numFmt = '0.0%';

      for (let col = 1; col <= 4; col++) {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        if (col > 1) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      }
      natCurrentRow++;
    });

    // Agency Performance Section
    const ageStartRow = 4;
    worksheet.mergeCells(`F${ageStartRow}:I${ageStartRow}`);
    const ageSectionTitle = worksheet.getCell(`F${ageStartRow}`);
    ageSectionTitle.value = '🏢 PERFORMANCE DES AGENCES';
    ageSectionTitle.font = { name: 'Arial', size: 12, bold: true };
    ageSectionTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3E5F5' }
    };

    const ageHeaderRow = worksheet.getRow(ageStartRow + 1);
    const ageHeaders = ['Agence', 'Contrats', 'Primes (FCFA)', 'Part (%)'];
    ageHeaders.forEach((h, i) => {
      const cell = ageHeaderRow.getCell(6 + i); // Col F, G, H, I
      cell.value = h;
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7B1FA2' }
      };
      cell.alignment = { horizontal: i === 0 ? 'left' : 'right', vertical: 'middle' };
    });

    let ageCurrentRow = ageStartRow + 2;
    (data.agencesData || []).forEach(item => {
      const row = worksheet.getRow(ageCurrentRow);
      row.height = 20;

      row.getCell(6).value = item.agenceName;
      row.getCell(6).alignment = { horizontal: 'left', vertical: 'middle' };

      const cContrats = row.getCell(7);
      cContrats.value = item.contrats;
      cContrats.numFmt = '#,##0';

      const cPrimes = row.getCell(8);
      cPrimes.value = item.primes;
      cPrimes.numFmt = '#,##0';

      const cPart = row.getCell(9);
      cPart.value = item.partMarche / 100;
      cPart.numFmt = '0.0%';

      for (let col = 6; col <= 9; col++) {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        if (col > 6) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      }
      ageCurrentRow++;
    });

    // Column widths
    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 18;
    worksheet.getColumn(4).width = 18;
    worksheet.getColumn(5).width = 5;  // Spacer
    worksheet.getColumn(6).width = 25;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateBiClientsExcel(data: {
    gender: any[];
    age: any[];
    occupation: any[];
    capital: any[];
    period: { startDate: string; endDate: string };
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PADME S.A';
    workbook.created = new Date();

    const sheets = [
      { name: 'Par Genre', key: 'gender', title: 'RÉPARTITION CLIENTS PAR GENRE', axisName: 'Genre' },
      { name: 'Par Âge', key: 'age', title: 'RÉPARTITION CLIENTS PAR TRANCHE D\'ÂGE', axisName: 'Tranche d\'âge' },
      { name: 'Par Profession', key: 'occupation', title: 'RÉPARTITION CLIENTS PAR PROFESSION', axisName: 'Profession' },
      { name: 'Par Capitaux', key: 'capital', title: 'RÉPARTITION CLIENTS PAR CAPITAUX ASSURÉS', axisName: 'Tranche de Capital' }
    ];

    sheets.forEach(sheetInfo => {
      const worksheet = workbook.addWorksheet(sheetInfo.name);
      worksheet.views = [{ showGridLines: true }];

      // En-tête principal
      worksheet.mergeCells('A1:E1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = sheetInfo.title;
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1B434' }
      };
      worksheet.getRow(1).height = 40;

      // Période
      worksheet.mergeCells('A2:E2');
      const periodCell = worksheet.getCell('A2');
      periodCell.value = `Période du ${data.period.startDate || 'N/A'} au ${data.period.endDate || 'N/A'}`;
      periodCell.font = { name: 'Arial', size: 10, italic: true };
      periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(2).height = 20;

      // Table Headers
      const headerRow = worksheet.getRow(4);
      headerRow.height = 25;
      const headers = [
        sheetInfo.axisName,
        'Nombre de Contrats',
        'Prime Moyenne (FCFA)',
        sheetInfo.key === 'capital' ? 'Durée Moyenne (mois)' : 'Capital Moyen (FCFA)',
        'Part (%)'
      ];

      headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1B434' }
        };
        cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' };
      });

      const listData = data[sheetInfo.key] || [];
      const totalContrats = listData.reduce((sum, d) => sum + (d.count || 0), 0);

      let currentRow = 5;
      listData.forEach(item => {
        const row = worksheet.getRow(currentRow);
        row.height = 20;

        row.getCell(1).value = item.segment || 'Non défini';
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

        const cCount = row.getCell(2);
        cCount.value = item.count;
        cCount.numFmt = '#,##0';

        const cPrime = row.getCell(3);
        cPrime.value = item.avgPrime || 0;
        cPrime.numFmt = '#,##0';

        const cFourth = row.getCell(4);
        cFourth.value = sheetInfo.key === 'capital' ? (item.avgDuration || 0) : (item.avgCapital || 0);
        cFourth.numFmt = '#,##0';

        const cPart = row.getCell(5);
        cPart.value = totalContrats > 0 ? (item.count / totalContrats) : 0;
        cPart.numFmt = '0.0%';

        for (let col = 1; col <= 5; col++) {
          const cell = row.getCell(col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
          };
          if (col > 1) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        }
        currentRow++;
      });

      // Total Row
      if (listData.length > 0) {
        const totalRow = worksheet.getRow(currentRow);
        totalRow.height = 22;
        totalRow.getCell(1).value = 'TOTAL';
        totalRow.getCell(1).font = { name: 'Arial', bold: true };

        const tCount = totalRow.getCell(2);
        tCount.value = totalContrats;
        tCount.font = { name: 'Arial', bold: true };
        tCount.numFmt = '#,##0';

        const tPart = totalRow.getCell(5);
        tPart.value = 1.0;
        tPart.font = { name: 'Arial', bold: true };
        tPart.numFmt = '0.0%';

        for (let col = 1; col <= 5; col++) {
          const cell = totalRow.getCell(col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFDF6E2' }
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFF1B434' } },
            bottom: { style: 'double', color: { argb: 'FFF1B434' } },
            left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
          };
          if (col > 1) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        }
      }

      worksheet.getColumn(1).width = 30;
      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(3).width = 25;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 15;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateBiCommercialExcel(data: {
    agences: any[];
    conseillers: any[];
    nature: any[];
    period: { startDate: string; endDate: string };
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PADME S.A';
    workbook.created = new Date();

    // SHEET 1: AGENCES
    const wsAgences = workbook.addWorksheet('Performance Agences');
    wsAgences.views = [{ showGridLines: true }];

    wsAgences.mergeCells('A1:G1');
    const titleAg = wsAgences.getCell('A1');
    titleAg.value = 'PERFORMANCE COMMERCIALE DES AGENCES';
    titleAg.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleAg.alignment = { horizontal: 'center', vertical: 'middle' };
    titleAg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1B434' } };
    wsAgences.getRow(1).height = 40;

    wsAgences.mergeCells('A2:G2');
    wsAgences.getCell('A2').value = `Période du ${data.period.startDate || 'N/A'} au ${data.period.endDate || 'N/A'}`;
    wsAgences.getCell('A2').font = { name: 'Arial', size: 10, italic: true };
    wsAgences.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    wsAgences.getRow(2).height = 20;

    const agHeaders = ['Rang', 'Agence', 'Contrats', 'Primes (FCFA)', 'Capital (FCFA)', 'Prime Moyenne (FCFA)', 'Part de Marché (%)'];
    const rowAgHeader = wsAgences.getRow(4);
    rowAgHeader.height = 25;
    agHeaders.forEach((h, idx) => {
      const cell = rowAgHeader.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1B434' } };
      cell.alignment = { horizontal: idx <= 1 ? 'left' : 'right', vertical: 'middle' };
    });

    let currentAgRow = 5;
    (data.agences || []).forEach((a, idx) => {
      const row = wsAgences.getRow(currentAgRow);
      row.height = 20;

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = a.agenceName;
      row.getCell(3).value = a.contrats;
      row.getCell(4).value = a.primes;
      row.getCell(5).value = a.capital;
      row.getCell(6).value = a.primeMoyenne;
      row.getCell(7).value = a.partMarche / 100;

      row.getCell(1).numFmt = '#,##0';
      row.getCell(3).numFmt = '#,##0';
      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '#,##0';
      row.getCell(7).numFmt = '0.0%';

      for (let col = 1; col <= 7; col++) {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        if (col > 2) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      }
      currentAgRow++;
    });

    wsAgences.getColumn(1).width = 10;
    wsAgences.getColumn(2).width = 25;
    wsAgences.getColumn(3).width = 15;
    wsAgences.getColumn(4).width = 20;
    wsAgences.getColumn(5).width = 20;
    wsAgences.getColumn(6).width = 20;
    wsAgences.getColumn(7).width = 20;

    // SHEET 2: CONSEILLERS
    const wsConseillers = workbook.addWorksheet('Performance Conseillers');
    wsConseillers.views = [{ showGridLines: true }];

    wsConseillers.mergeCells('A1:H1');
    const titleCons = wsConseillers.getCell('A1');
    titleCons.value = 'PERFORMANCE INDIVIDUELLE DES CONSEILLERS';
    titleCons.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCons.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCons.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
    wsConseillers.getRow(1).height = 40;

    wsConseillers.mergeCells('A2:H2');
    wsConseillers.getCell('A2').value = `Période du ${data.period.startDate || 'N/A'} au ${data.period.endDate || 'N/A'}`;
    wsConseillers.getCell('A2').font = { name: 'Arial', size: 10, italic: true };
    wsConseillers.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    wsConseillers.getRow(2).height = 20;

    const consHeaders = ['Rang', 'Conseiller', 'Agence', 'Contrats', 'Cotations', 'Taux de Conv. (%)', 'Primes (FCFA)', 'Part (%)'];
    const rowConsHeader = wsConseillers.getRow(4);
    rowConsHeader.height = 25;
    consHeaders.forEach((h, idx) => {
      const cell = rowConsHeader.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
      cell.alignment = { horizontal: idx <= 2 ? 'left' : 'right', vertical: 'middle' };
    });

    let currentConsRow = 5;
    (data.conseillers || []).forEach((c, idx) => {
      const row = wsConseillers.getRow(currentConsRow);
      row.height = 20;

      row.getCell(1).value = c.rank || (idx + 1);
      row.getCell(2).value = c.nom;
      row.getCell(3).value = c.agenceName;
      row.getCell(4).value = c.contrats;
      row.getCell(5).value = c.cotations;
      row.getCell(6).value = c.tauxTransformation / 100;
      row.getCell(7).value = c.primes;
      row.getCell(8).value = c.partMarche / 100;

      row.getCell(1).numFmt = '#,##0';
      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '0.0%';
      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).numFmt = '0.0%';

      for (let col = 1; col <= 8; col++) {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        if (col > 3) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      }
      currentConsRow++;
    });

    wsConseillers.getColumn(1).width = 10;
    wsConseillers.getColumn(2).width = 25;
    wsConseillers.getColumn(3).width = 20;
    wsConseillers.getColumn(4).width = 15;
    wsConseillers.getColumn(5).width = 15;
    wsConseillers.getColumn(6).width = 20;
    wsConseillers.getColumn(7).width = 20;
    wsConseillers.getColumn(8).width = 15;

    // SHEET 3: NATURES DE CRÉDIT
    const wsNatures = workbook.addWorksheet('Performance Natures');
    wsNatures.views = [{ showGridLines: true }];

    wsNatures.mergeCells('A1:G1');
    const titleNat = wsNatures.getCell('A1');
    titleNat.value = 'ANALYSE PAR NATURE DE CRÉDIT';
    titleNat.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleNat.alignment = { horizontal: 'center', vertical: 'middle' };
    titleNat.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7B1FA2' } };
    wsNatures.getRow(1).height = 40;

    wsNatures.mergeCells('A2:G2');
    wsNatures.getCell('A2').value = `Période du ${data.period.startDate || 'N/A'} au ${data.period.endDate || 'N/A'}`;
    wsNatures.getCell('A2').font = { name: 'Arial', size: 10, italic: true };
    wsNatures.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    wsNatures.getRow(2).height = 20;

    const natHeaders = ['Nature de Crédit', 'Contrats', 'Primes (FCFA)', 'Capital (FCFA)', 'Prime Moyenne (FCFA)', 'Durée Moyenne (mois)', 'Part (%)'];
    const rowNatHeader = wsNatures.getRow(4);
    rowNatHeader.height = 25;
    natHeaders.forEach((h, idx) => {
      const cell = rowNatHeader.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7B1FA2' } };
      cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' };
    });

    let currentNatRow = 5;
    (data.nature || []).forEach(n => {
      const row = wsNatures.getRow(currentNatRow);
      row.height = 20;

      row.getCell(1).value = n.libelle;
      row.getCell(2).value = n.contrats;
      row.getCell(3).value = n.primes;
      row.getCell(4).value = n.capital;
      row.getCell(5).value = n.primeMoyenne;
      row.getCell(6).value = n.dureeMoyenne;
      row.getCell(7).value = n.partMarche / 100;

      row.getCell(2).numFmt = '#,##0';
      row.getCell(3).numFmt = '#,##0';
      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '#,##0';
      row.getCell(7).numFmt = '0.0%';

      for (let col = 1; col <= 7; col++) {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        if (col > 1) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      }
      currentNatRow++;
    });

    wsNatures.getColumn(1).width = 25;
    wsNatures.getColumn(2).width = 15;
    wsNatures.getColumn(3).width = 20;
    wsNatures.getColumn(4).width = 20;
    wsNatures.getColumn(5).width = 20;
    wsNatures.getColumn(6).width = 20;
    wsNatures.getColumn(7).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getSafeSheetName(name: string, workbook?: ExcelJS.Workbook): string {
    let safeName = name.replace(/[:\\/?*\[\]]/g, '-');
    if (safeName.length > 31) {
      safeName = safeName.substring(0, 31);
    }
    if (workbook) {
      let finalName = safeName;
      let counter = 1;
      while (workbook.getWorksheet(finalName)) {
        const suffix = `-${counter}`;
        const nameLimit = 31 - suffix.length;
        finalName = safeName.substring(0, nameLimit) + suffix;
        counter++;
      }
      return finalName;
    }
    return safeName;
  }

  async generateContractsImportTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MSFP Assurance';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Gabarit Importation');

    const headers = [
      'Nom Client*',
      'Prénom Client*',
      'Date Naissance Client* (AAAA-MM-JJ)',
      'Genre Client* (M/F)',
      'Profession Client',
      'Téléphone Client*',
      'Email Client',
      'Adresse Client',
      'N° Police*',
      'Réf Dossier*',
      'Date d\'effet* (AAAA-MM-JJ)',
      'Durée en mois*',
      'Nature de Crédit* (OBA/CP/BII/...)',
      'Capital Garanti*',
      'Établissement (Hors Convention)',
      'Banque',
      'N° Compte',
      'Conjoint(e) Garanti? (OUI/NON)',
      'Conjoint(e) Nom',
      'Conjoint(e) Prénom',
      'Conjoint(e) Date Naissance (AAAA-MM-JJ)',
      'Conjoint(e) Genre (M/F)',
      'Conjoint(e) Capital',
      'Père de l\'Assuré Garanti? (OUI/NON)',
      'Père de l\'Assuré Nom',
      'Père de l\'Assuré Prénom',
      'Père de l\'Assuré Date Naissance (AAAA-MM-JJ)',
      'Père de l\'Assuré Capital',
      'Mère de l\'Assuré Garanti? (OUI/NON)',
      'Mère de l\'Assuré Nom',
      'Mère de l\'Assuré Prénom',
      'Mère de l\'Assuré Date Naissance (AAAA-MM-JJ)',
      'Mère de l\'Assuré Capital',
      'Père du (de la) Conjoint(e) Garanti? (OUI/NON)',
      'Père du (de la) Conjoint(e) Nom',
      'Père du (de la) Conjoint(e) Prénom',
      'Père du (de la) Conjoint(e) Date Naissance (AAAA-MM-JJ)',
      'Père du (de la) Conjoint(e) Capital',
      'Mère du (de la) Conjoint(e) Garanti? (OUI/NON)',
      'Mère du (de la) Conjoint(e) Nom',
      'Mère du (de la) Conjoint(e) Prénom',
      'Mère du (de la) Conjoint(e) Date Naissance (AAAA-MM-JJ)',
      'Mère du (de la) Conjoint(e) Capital'
    ];

    const headerRow = worksheet.addRow(headers);
    
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4CAF50' }
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    
    worksheet.getRow(1).height = 40;

    worksheet.addRow([
      'ZAKOU', 'TENGUE', '2008-06-28', 'F', 'TRACEUR', '6955555', '', 'ADA',
      'BE1P1837', 'PA2S5OBA', '2026-06-29', 12, 'OBA', 500000, '', '', '',
      'OUI', 'AZIATITON', 'CREPIN', '2008-06-28', 'M', 500000,
      'OUI', 'ZAKOU', 'Père', '1990-05-07', 500000,
      'OUI', 'ZAKOU', 'Mère', '1995-06-28', 500000,
      'OUI', 'AZIATITON', 'Père', '1989-06-28', 500000,
      'OUI', 'AZIATITON', 'Mère', '1990-09-19', 500000
    ]);

    worksheet.columns.forEach((column) => {
      column.width = 25;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async parseContractsImport(filePath: string): Promise<ImportContractRowDto[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
    
    const rows: ImportContractRowDto[] = [];
    if (!worksheet) return rows;
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const getValue = (colIndex: number): any => {
        const cell = row.getCell(colIndex);
        if (cell.value && typeof cell.value === 'object' && 'result' in cell.value) {
          return cell.value.result;
        }
        if (cell.value && typeof cell.value === 'object' && 'text' in cell.value) {
          return cell.value.text;
        }
        return cell.value;
      };

      const getStringValue = (colIndex: number): string => {
        const val = getValue(colIndex);
        if (val === null || val === undefined) return '';
        return String(val).trim();
      };

      const getNumberValue = (colIndex: number): number => {
        const val = getValue(colIndex);
        if (val === null || val === undefined) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };

      const rowData: ImportContractRowDto = {
        nomClient: getStringValue(1),
        prenomClient: getStringValue(2),
        dateNaissanceClient: getStringValue(3),
        genreClient: getStringValue(4),
        professionClient: getStringValue(5),
        telephoneClient: getStringValue(6),
        emailClient: getStringValue(7),
        adresseClient: getStringValue(8),
        police: getStringValue(9),
        reference: getStringValue(10),
        dateEffet: getStringValue(11),
        dureeMois: getNumberValue(12),
        natureCredit: getStringValue(13),
        capital: getNumberValue(14),
        etablissement: getStringValue(15),
        compteBancaire: getStringValue(16),
        numeroCompte: getStringValue(17),
        
        conjointChecked: getStringValue(18),
        conjointNom: getStringValue(19),
        conjointPrenom: getStringValue(20),
        conjointDateNaissance: getStringValue(21),
        conjointGenre: getStringValue(22),
        conjointCapital: getNumberValue(23),
        
        pereAssureChecked: getStringValue(24),
        pereAssureNom: getStringValue(25),
        pereAssurePrenom: getStringValue(26),
        pereAssureDateNaissance: getStringValue(27),
        pereAssureCapital: getNumberValue(28),
        
        mereAssureChecked: getStringValue(29),
        mereAssureNom: getStringValue(30),
        mereAssurePrenom: getStringValue(31),
        mereAssureDateNaissance: getStringValue(32),
        mereAssureCapital: getNumberValue(33),
        
        pereConjointChecked: getStringValue(34),
        pereConjointNom: getStringValue(35),
        pereConjointPrenom: getStringValue(36),
        pereConjointDateNaissance: getStringValue(37),
        pereConjointCapital: getNumberValue(38),
        
        mereConjointChecked: getStringValue(39),
        mereConjointNom: getStringValue(40),
        mereConjointPrenom: getStringValue(41),
        mereConjointDateNaissance: getStringValue(42),
        mereConjointCapital: getNumberValue(43)
      };

      if (rowData.nomClient || rowData.police || rowData.reference) {
        rows.push(rowData);
      }
    });
    
    return rows;
  }
}

