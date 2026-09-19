// Utilitaire pour générer des fichiers Excel sans dépendances externes
// Utilise une approche native avec conversion HTML vers Excel

export interface ExcelColumn {
  key: string;
  title: string;
  width?: number;
  formatter?: (value: any) => string;
}

export interface ExcelData {
  sheetName: string;
  columns: ExcelColumn[];
  data: any[];
}

export class ExcelExporter {
  
  /**
   * Génère et télécharge un fichier Excel
   */
  static exportToExcel(excelData: ExcelData, filename: string): void {
    const { sheetName, columns, data } = excelData;
    
    // Créer le contenu HTML du tableau
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <meta name="ProgId" content="Excel.Sheet">
        <meta name="Generator" content="Microsoft Excel 15">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .number { text-align: right; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
    `;
    
    // Ajouter les en-têtes
    columns.forEach(column => {
      htmlContent += `<th style="width: ${column.width || 150}px;">${column.title}</th>`;
    });
    
    htmlContent += `
            </tr>
          </thead>
          <tbody>
    `;
    
    // Ajouter les données
    data.forEach(row => {
      htmlContent += '<tr>';
      columns.forEach(column => {
        let cellValue = this.getNestedValue(row, column.key);
        
        // Appliquer le formateur si défini
        if (column.formatter) {
          cellValue = column.formatter(cellValue);
        }
        
        // Échapper les caractères spéciaux
        cellValue = this.escapeHtml(cellValue);
        
        htmlContent += `<td>${cellValue}</td>`;
      });
      htmlContent += '</tr>';
    });
    
    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    // Créer et télécharger le fichier
    this.downloadExcelFile(htmlContent, filename);
  }
  
  /**
   * Exporte plusieurs feuilles dans un seul fichier Excel
   */
  static exportMultiSheetExcel(sheets: ExcelData[], filename: string): void {
    // Pour la version simple, on combine toutes les feuilles en une seule
    // Dans une version plus avancée, on pourrait utiliser une vraie bibliothèque Excel
    
    let combinedHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <meta name="ProgId" content="Excel.Sheet">
        <meta name="Generator" content="Microsoft Excel 15">
        <style>
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .sheet-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
          .number { text-align: right; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
    `;
    
    sheets.forEach((sheet, index) => {
      combinedHtml += `<div class="sheet-title">${sheet.sheetName}</div>`;
      combinedHtml += '<table>';
      
      // En-têtes
      combinedHtml += '<thead><tr>';
      sheet.columns.forEach(column => {
        combinedHtml += `<th style="width: ${column.width || 150}px;">${column.title}</th>`;
      });
      combinedHtml += '</tr></thead>';
      
      // Données
      combinedHtml += '<tbody>';
      sheet.data.forEach(row => {
        combinedHtml += '<tr>';
        sheet.columns.forEach(column => {
          let cellValue = this.getNestedValue(row, column.key);
          if (column.formatter) {
            cellValue = column.formatter(cellValue);
          }
          cellValue = this.escapeHtml(cellValue);
          combinedHtml += `<td>${cellValue}</td>`;
        });
        combinedHtml += '</tr>';
      });
      combinedHtml += '</tbody></table>';
      
      if (index < sheets.length - 1) {
        combinedHtml += '<div style="page-break-after: always;"></div>';
      }
    });
    
    combinedHtml += '</body></html>';
    
    this.downloadExcelFile(combinedHtml, filename);
  }
  
  /**
   * Récupère une valeur imbriquée d'un objet
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }
  
  /**
   * Échapper les caractères HTML
   */
  private static escapeHtml(text: any): string {
    if (text === null || text === undefined) return '';
    
    const str = String(text);
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return str.replace(/[&<>"']/g, (m) => map[m]);
  }
  
  /**
   * Télécharge le fichier Excel
   */
  private static downloadExcelFile(htmlContent: string, filename: string): void {
    // Créer un blob avec le contenu HTML
    const blob = new Blob([htmlContent], {
      type: 'application/vnd.ms-excel;charset=utf-8'
    });
    
    // Créer une URL pour le blob
    const url = window.URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xls`; // Extension .xls pour la compatibilité
    link.style.display = 'none';
    
    // Ajouter le lien au DOM, cliquer dessus, puis le supprimer
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Libérer l'URL
    window.URL.revokeObjectURL(url);
  }
}

// Formatters prédéfinis
export const ExcelFormatters = {
  currency: (value: number): string => {
    if (value == null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  },
  
  date: (value: string): string => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString('fr-FR');
    } catch {
      return value;
    }
  },
  
  dateTime: (value: string): string => {
    if (!value) return '-';
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
    return value ? `="${value}"` : ''; // Préfixe = pour forcer le format texte
  },
  
  text: (value: any): string => {
    return String(value || '');
  }
}; 