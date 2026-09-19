// Utilitaire pour générer des fichiers Excel .xlsx avec la bibliothèque xlsx
import * as XLSX from 'xlsx';

export interface XlsxColumn {
  key: string;
  title: string;
  width?: number;
  formatter?: (value: any) => any;
  style?: any;
}

export interface XlsxSheet {
  name: string;
  columns: XlsxColumn[];
  data: any[];
}

export class XlsxExporter {
  
  /**
   * Génère et télécharge un fichier Excel .xlsx
   */
  static exportToXlsx(sheet: XlsxSheet, filename: string): void {
    const workbook = XLSX.utils.book_new();
    const worksheet = this.createWorksheet(sheet);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    
    // Générer le fichier et le télécharger
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
  
  /**
   * Exporte plusieurs feuilles dans un seul fichier Excel .xlsx
   */
  static exportMultiSheetXlsx(sheets: XlsxSheet[], filename: string): void {
    const workbook = XLSX.utils.book_new();
    
    sheets.forEach(sheet => {
      const worksheet = this.createWorksheet(sheet);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
  
  /**
   * Crée une feuille de calcul à partir des données
   */
  private static createWorksheet(sheet: XlsxSheet): XLSX.WorkSheet {
    // Préparer les en-têtes
    const headers = sheet.columns.map(col => col.title);
    
    // Préparer les données avec formatage
    const formattedData = sheet.data.map(row => {
      const formattedRow: any = {};
      
      sheet.columns.forEach(column => {
        let value = this.getNestedValue(row, column.key);
        
        // Appliquer le formateur si défini
        if (column.formatter) {
          value = column.formatter(value);
        }
        
        formattedRow[column.title] = value;
      });
      
      return formattedRow;
    });
    
    // Créer la feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: headers
    });
    
    // Définir les largeurs des colonnes
    const columnWidths = sheet.columns.map(col => ({
      wch: Math.max(col.width ? col.width / 8 : 15, col.title.length + 2)
    }));
    
    worksheet['!cols'] = columnWidths;
    
    return worksheet;
  }
  
  /**
   * Récupère une valeur imbriquée d'un objet
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }
}

// Formatters spécialisés pour Excel .xlsx
export const XlsxFormatters = {
  currency: (value: number): number | string => {
    if (value == null) return '';
    return value; // Excel gérera le formatage numérique
  },
  
  currencyText: (value: number): string => {
    if (value == null) return '';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  },
  
  date: (value: string): Date | string => {
    if (!value) return '';
    
    // Convertir en string si c'est un autre type
    const dateStr = String(value).trim();
    if (!dateStr) return '';
    
    try {
      // Essayer différents formats de date
      let date: Date;
      
      // Format ISO avec T (2023-12-25T00:00:00.000Z)
      if (dateStr.includes('T')) {
        date = new Date(dateStr);
      }
      // Format YYYY-MM-DD (2023-12-25)
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        date = new Date(dateStr + 'T00:00:00.000Z');
      }
             // Format DD/MM/YYYY (25/12/2023) ou D/M/YYYY (5/6/2023)
       else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
         const [day, month, year] = dateStr.split('/');
         // En français, c'est toujours DD/MM/YYYY
         date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
       }
      // Format DD-MM-YYYY (25-12-2023)
      else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      
      // Timestamp en millisecondes
      else if (/^\d{13}$/.test(dateStr)) {
        date = new Date(parseInt(dateStr));
      }
      // Timestamp en secondes
      else if (/^\d{10}$/.test(dateStr)) {
        date = new Date(parseInt(dateStr) * 1000);
      }
      // Autres formats - laisser JavaScript essayer
      else {
        date = new Date(dateStr);
      }
      
      return isNaN(date.getTime()) ? dateStr : date;
    } catch {
      return dateStr;
    }
  },
  
  dateText: (value: string): string => {
    if (!value) return '';
    try {
      // Utiliser la même logique que le formatter date
      let date: Date;
      
      // Format ISO standard
      if (value.includes('T') || (value.includes('-') && value.length > 10)) {
        date = new Date(value);
      }
             // Format DD/MM/YYYY (format français)
       else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
         const [day, month, year] = value.split('/');
         date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
       }
      // Format DD-MM-YYYY
      else if (value.includes('-') && value.length === 10) {
        const parts = value.split('-');
        if (parts.length === 3 && parts[0].length === 2) {
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          date = new Date(value);
        }
      }
      // Autres formats
      else {
        date = new Date(value);
      }
      
      return isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
    } catch {
      return value;
    }
  },
  
  dateTime: (value: string): Date | string => {
    if (!value) return '';
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    } catch {
      return value;
    }
  },
  
  dateTimeText: (value: string): string => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleString('fr-FR');
    } catch {
      return value;
    }
  },
  
  status: (value: any): string => {
    if (value === 'ACTIVE' || value === 1) return 'Actif';
    if (value === 'SUSPENDED' || value === 0) return 'Suspendu';
    if (value === 'INACTIVE' || value === -1) return 'Inactif';
    return String(value || '');
  },
  
  gender: (value: string): string => {
    return value === 'M' ? 'Masculin' : value === 'F' ? 'Féminin' : value;
  },
  
  phone: (value: string): string => {
    return value || '';
  },
  
  text: (value: any): string => {
    return String(value || '');
  },
  
  number: (value: any): number | string => {
    const num = Number(value);
    return isNaN(num) ? String(value || '') : num;
  }
}; 