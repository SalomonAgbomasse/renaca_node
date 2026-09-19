import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PdfService {
  private browser: puppeteer.Browser | null = null;

  private async initBrowser(): Promise<puppeteer.Browser> {
    const launchOptions: any = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
      launchOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else if (fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')) {
      launchOptions.executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    } else {
      launchOptions.channel = 'chrome';
    }

    return puppeteer.launch(launchOptions);
  }

  private async getBrowser(): Promise<puppeteer.Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }
    this.browser = await this.initBrowser();
    return this.browser;
  }

  async onModuleInit() {
    // Initialiser Puppeteer au démarrage du module
    try {
      this.browser = await this.initBrowser();
      console.log('✅ Puppeteer initialisé avec succès');
    } catch (error: any) {
      console.warn('⚠️ Avertissement Puppeteer (sera relancé à la demande):', error?.message || error);
    }
  }

  async onModuleDestroy() {
    // Fermer le navigateur à la fermeture du module
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Génère un PDF à partir d'un template EJS
   * @param templateName Nom du template (sans extension .ejs)
   * @param data Données à passer au template
   * @param options Options pour la génération du PDF
   */
  async generatePdfFromTemplate(
    templateName: string,
    data: any,
    options: {
      format?: 'A4' | 'A3' | 'Letter';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
    } = {}
  ): Promise<Buffer> {
    const browser = await this.getBrowser();

    try {
      // Chemin vers le template
      const templatePath = path.join(process.cwd(), 'templates', 'contracts', `${templateName}.ejs`);
      
      // Vérifier que le template existe
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      // Lire le template
      const template = fs.readFileSync(templatePath, 'utf8');

      // Compiler le template EJS avec les données
      const html = ejs.render(template, data);

      // Créer une nouvelle page
      const page = await browser.newPage();

      // Définir le contenu HTML
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Configuration par défaut du PDF
      const pdfOptions: puppeteer.PDFOptions = {
        format: options.format || 'A4',
        margin: {
          top: options.margin?.top || '1cm',
          right: options.margin?.right || '1cm',
          bottom: options.margin?.bottom || '1cm',
          left: options.margin?.left || '1cm',
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        printBackground: true,
        preferCSSPageSize: true,
      };

      // Ajouter header/footer si spécifiés
      if (options.headerTemplate) {
        pdfOptions.headerTemplate = this.replaceTemplateVariables(options.headerTemplate, data);
      }
      if (options.footerTemplate) {
        pdfOptions.footerTemplate = this.replaceTemplateVariables(options.footerTemplate, data);
        pdfOptions.footerTemplate = this.replaceGeneratedDate(pdfOptions.footerTemplate, data);
      }

      // Générer le PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      // Fermer la page
      await page.close();

      return Buffer.from(pdfBuffer);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw new Error(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  }

  /**
   * Convertit une image en base64
   */
  private getImageAsBase64(imagePath: string): string {
    try {
      const fullPath = path.join(process.cwd(), 'assets', imagePath);
      const imageBuffer = fs.readFileSync(fullPath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' ? 'image/jpeg' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.warn(`Impossible de charger l'image ${imagePath}:`, error.message);
      return '';
    }
  }

  /**
   * Récupère l'image du questionnaire en base64
   */
  private getQuestionnaireImageBase64(): string {
    return this.getImageAsBase64('images/questionnaire.png');
  }

  /**
   * Récupère l'image de signature en base64
   */
  private getSignatureImageBase64(): string {
    return this.getImageAsBase64('images/signature.png');
  }

  /**
   * Remplace les variables dans un template
   */
  private replaceTemplateVariables(template: string, data: any): string {
    let result = template;
    
    // Remplacer les variables ${variableName}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(regex, data[key] || '');
    });
    
    // Remplacer les variables spéciales pour le header
    if (data.userLastname && data.userFirstname) {
      result = result.replace('<span id="user-name"></span>', `${data.userLastname} ${data.userFirstname} - ${data.userPhone}`);
    }
    
    return result;
  }

  private replaceGeneratedDate(template: string, data: any): string {
    let result = template;
    const generatedAt = data.generatedAt || new Date().toLocaleDateString('fr-FR');
    const generatedTime = data.generatedTime || new Date().toLocaleTimeString('fr-FR');
    
    // Date et Heure de création du contrat
    let contractCreatedAt = 'N/A';
    if (data.contract?.createdAt) {
      const dt = new Date(data.contract.createdAt);
      const dateStr = dt.toLocaleDateString('fr-FR');
      const timeStr = dt.toLocaleTimeString('fr-FR');
      contractCreatedAt = (timeStr && timeStr !== '00:00:00') ? `${dateStr} à ${timeStr}` : dateStr;
    }
    
    // Remplacer le contenu du span avec l'ID generated-date
    const regex = /<span id="generated-date"[^>]*>.*?<\/span>/g;
    result = result.replace(regex, `<span id="generated-date" style="font-size: 10px; text-align: center; width: 100%; color: #000; display: block; margin-top: 14px; margin-bottom: 2px;">Contrat créé le ${contractCreatedAt} - PDF généré le ${generatedAt} à ${generatedTime}</span>`);
    
    return result;
  }

  /**
   * Génère un PDF de contrat spécifique
   * @param contractData Données du contrat
   * @param customerData Données du client
   * @param agencyData Données de l'agence
   */
  async generateContractPdf(
    contractData: any,
    customerData: any,
    agencyData: any
  ): Promise<Buffer> {
    // Convertir les logos en base64
    const aqaLogo = this.getImageAsBase64('images/aa.png');
    const msfpLogo = this.getImageAsBase64('images/msfp.png');
    const certifLogo = this.getImageAsBase64('images/certif.jpg');
    const questionnaireImage = this.getImageAsBase64('images/questionnaire.png');
    const signatureImage = this.getImageAsBase64('images/signature.png');

    const creditType = contractData.natureCredit?.code || 
      (String(contractData.idNatureCredit) === '2' ? 'CP' : String(contractData.idNatureCredit) === '3' ? 'OBA' : 'AMORT');
      
    const productName = contractData.natureCredit?.libelle || 
      (creditType === 'OBA' 
        ? 'OBSÈQUES ALAFIA' 
        : creditType === 'CP'
          ? 'PADME PROTECTION'
          : 'BOUCLIER EMPRUNTEUR');
    
    const rightLogoHtml = `<img src="${msfpLogo}" alt="PADME" style="max-width: 100px; max-height: 75px; object-fit: contain;" />`;

    // Pour les contrats CP, s'assurer que les bénéficiaires sont présents pour afficher la page 2 (comme en création unitaire)
    if (creditType === 'CP') {
      if (!contractData.beneficiaries || !Array.isArray(contractData.beneficiaries) || contractData.beneficiaries.length === 0) {
        const custName = customerData 
          ? `${customerData.lastname || ''} ${customerData.firstname || ''}`.trim() 
          : 'Ayant droit';
        contractData.beneficiaries = [
          {
            nomPrenoms: custName || 'Ayant droit',
            lienParente: 'AUTRE',
            pourcentage: 100
          }
        ];
      }
    }

    const templateData = {
      contract: contractData,
      customer: customerData,
      agency: agencyData,
      generatedAt: new Date().toLocaleDateString('fr-FR'),
      generatedTime: new Date().toLocaleTimeString('fr-FR'),
      aqaLogo: aqaLogo,
      msfpLogo: msfpLogo,
      certifLogo: certifLogo,
      signatureImage: signatureImage,
      questionnaireImage: questionnaireImage,
      userLastname: contractData.user?.lastname || 'N/A',
      userFirstname: contractData.user?.firstname || 'N/A',
      userPhone: contractData.user?.phone || 'N/A',
      productName: productName,
      rightLogoHtml: rightLogoHtml
    };

    const templateName = creditType === 'CP' 
      ? 'contract_cp' 
      : creditType === 'OBA' 
        ? 'contract_oba' 
        : 'contract';

    let createdAtFormatted = 'N/A';
    if (contractData.createdAt) {
      const dt = new Date(contractData.createdAt);
      const dateStr = dt.toLocaleDateString('fr-FR');
      const timeStr = dt.toLocaleTimeString('fr-FR');
      createdAtFormatted = (timeStr && timeStr !== '00:00:00') ? `${dateStr} à ${timeStr}` : dateStr;
    }

    return this.generatePdfFromTemplate(templateName, templateData, {
      format: 'A4',
      margin: {
        top: '2.5cm',
        right: '1cm',
        bottom: '2cm',
        left: '1cm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #000; padding: 2px; border-bottom: 2px solid #000;">
          <table border="0"  width="100%" style="font-size: 9pt;  border-collapse: collapse;"  >
            <tr>
              <td width="20%" style="text-align: center; vertical-align: middle;">
                <img src="${aqaLogo}" alt="L'Africaine vie Bénin" style="max-width: 100px; max-height: 75px; object-fit: contain;" />
              </td>
              <td width="60%" style="text-align: center; vertical-align: middle;">
                <div style="text-align: center; flex: 1;">
                  <div style="font-weight: bold; font-size: 15px; margin-bottom: 2px;">CONDITIONS PARTICULIÈRES</div>
                  <span style="font-size: 13px; background-color: #f1b434; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 1px 6px;">Produit: <b>\${productName}</b></span>
                  <div style="font-size: 13px; margin-top: 2px;">Gestionnaire: <strong><span id="user-name"></span></strong></div>
                </div>
              </td>
              <td width="20%" style="text-align: center; vertical-align: middle;">
                  \${rightLogoHtml}
              </td>
            </tr>
          </table>
        </div>
      `,
      footerTemplate: `
      <table border="0" width="100%" style="font-size: 9pt; border-collapse: collapse;">
        <tr>
          <td width="100%" style="text-align: center; padding-top: 10px; padding-bottom: 2px;">
            <span id="generated-date" style="font-size: 10px; text-align: center; color: #000; display: block; margin-top: 14px; margin-bottom: 2px;">Contrat créé le ${createdAtFormatted} - PDF généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</span>
          </td>
        </tr>
        <tr style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #000; font-size: 9px;">
          <td width="20%" style="float: left; padding-left: 1cm;">
            <img src="${certifLogo}" alt="L\'Africaine vie Bénin" width="110" height="62" border="0"/>
          </td>
          <td width="80%" style="text-align: center; padding-right: 1cm; padding-top: 0px;">
            <p><b>L\'AFRICAINE VIE BENIN</b>, Société d\'Assurance Vie au Capital de 3 000 000 000 F CFA entièrement libéré. <b>RCCM</b> : RB/Cot/07 B1518 <b>INSAE</b> :2956601349351, Entreprise régie par le code des Assurances CIMA. <b>Siège social</b>: Lot 19 Pate d\'Oie. 01PB 2040. <b>Tél</b>: (00229) 21 30 39 93 - 21 30 39 76. Fax: (00229) 30 00 91. <b><br>Email :africainevie@lafricaineviebenin.com. ---www.lafricaineviebenin.com</b></p>
          </td>
        </tr>
      </table>
      `
    });
  }

  /**
   * Génère un PDF de cotation
   * @param cotationData Données de la cotation
   * @param customerData Données du client
   * @param agencyData Données de l'agence
   */
  async generateCotationPdf(
    cotationData: any,
    customerData: any,
    agencyData: any
  ): Promise<Buffer> {
    const aqaLogo   = this.getImageAsBase64('images/aa.png');
    const msfpLogo  = this.getImageAsBase64('images/msfp.png');
    const certifLogo = this.getImageAsBase64('images/certif.jpg');

    const idNature = String(cotationData.idNatureCredit || '');
    const creditType = idNature === '2' ? 'CP' : idNature === '3' ? 'OBA' : 'AMORT';
    const creditTypeLabel = creditType === 'OBA'
      ? 'OBSÈQUES ALAFIA'
      : creditType === 'CP'
        ? 'PADME PROTECTION'
        : 'AMORTISSABLE';
    const productName = cotationData.natureCredit?.libelle || 
      (creditType === 'OBA'
        ? 'OBSÈQUES ALAFIA'
        : creditType === 'CP'
          ? 'PADME PROTECTION'
          : 'BOUCLIER EMPRUNTEUR');

    const rightLogoHtml = `<img src="${msfpLogo}" alt="PADME" style="max-width: 100px; max-height: 75px; object-fit: contain;" />`;

    // Préparer les membres OBA si le produit est OBA
    let obaMembers: any[] = [];
    if (creditType === 'OBA' && cotationData.obaOptions) {
      const opts = typeof cotationData.obaOptions === 'string'
        ? JSON.parse(cotationData.obaOptions)
        : cotationData.obaOptions;
      const roleMap: Record<string, string> = {
        conjoint:    'Conjoint(e)',
        ascendant1:  'Ascendant 1',
        ascendant2:  'Ascendant 2',
        ascendant3:  'Ascendant 3',
        ascendant4:  'Ascendant 4',
      };
      for (const [key, label] of Object.entries(roleMap)) {
        const m = opts[key];
        if (m && m.included) {
          obaMembers.push({ roleLabel: label, ...m });
        }
      }
    }

    const now = new Date();
    const dateSimulation = cotationData.dateSaisie
      ? new Date(cotationData.dateSaisie).toLocaleDateString('fr-FR')
      : now.toLocaleDateString('fr-FR');

    const templateData = {
      cotation:      cotationData,
      customer:      customerData,
      agency:        agencyData,
      generatedAt:   now.toLocaleDateString('fr-FR'),
      generatedTime: now.toLocaleTimeString('fr-FR'),
      dateSimulation,
      aqaLogo,
      msfpLogo,
      certifLogo,
      productName,
      creditType,
      creditTypeLabel,
      rightLogoHtml,
      obaMembers,
      userLastname:  cotationData.user?.lastname  || '',
      userFirstname: cotationData.user?.firstname || '',
      userPhone:     cotationData.user?.phone     || '',
    };

    return this.generatePdfFromTemplate('cotation', templateData, {
      format: 'A4',
      margin: { top: '2.5cm', right: '1cm', bottom: '2cm', left: '1cm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:10px;text-align:center;width:100%;color:#000;padding:2px;border-bottom:2px solid #000;">
          <table border="0" width="100%" style="font-size:9pt;border-collapse:collapse;">
            <tr>
              <td width="20%" style="text-align:center; vertical-align: middle;">
                <img src="${aqaLogo}" alt="L'Africaine vie Bénin" style="max-width: 100px; max-height: 75px; object-fit: contain;" />
              </td>
              <td width="60%" style="text-align:center; vertical-align: middle;">
                <div style="font-weight:bold;font-size:15px;margin-bottom:2px;">PROPOSITION – SIMULATION DE COTATION</div>
                <span style="font-size:13px;background-color:#f1b434;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:1px 6px;">Produit : <b>\${productName}</b></span>
                <div style="font-size:13px;margin-top:2px;">Simulé par : <strong><span id="user-name"></span></strong></div>
              </td>
              <td width="20%" style="text-align:center; vertical-align: middle;">
                \${rightLogoHtml}
              </td>
            </tr>
          </table>
        </div>`,
      footerTemplate: `
      <table border="0" width="100%" style="font-size: 9pt; border-collapse: collapse;">
        <tr>
          <td width="100%" style="text-align: center; padding-top: 10px; padding-bottom: 2px;">
            <span id="generated-date" style="font-size: 10px; text-align: center; color: #000; display: block; margin-top: 14px; margin-bottom: 2px;">Simulation du ${dateSimulation} - PDF généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}</span>
          </td>
        </tr>
        <tr style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #000; font-size: 9px;">
          <td width="20%" style="float: left; padding-left: 1cm;">
            <img src="${certifLogo}" alt="L\'Africaine vie Bénin" width="110" height="62" border="0"/>
          </td>
          <td width="80%" style="text-align: center; padding-right: 1cm; padding-top: 0px;">
            <p><b>L\'AFRICAINE VIE BENIN</b>, Société d\'Assurance Vie au Capital de 3 000 000 000 F CFA entièrement libéré. <b>RCCM</b> : RB/Cot/07 B1518 <b>INSAE</b> :2956601349351, Entreprise régie par le code des Assurances CIMA. <b>Siège social</b>: Lot 19 Pate d\'Oie. 01PB 2040. <b>Tél</b>: (00229) 21 30 39 93 - 21 30 39 76. Fax: (00229) 30 00 91. <b><br>Email :africainevie@lafricaineviebenin.com. ---www.lafricaineviebenin.com</b></p>
          </td>
        </tr>
      </table>
      `
    });
  }

  /**
   * Liste tous les templates disponibles
   */
  getAvailableTemplates(): string[] {
    const templatesDir = path.join(process.cwd(), 'templates', 'contracts');
    
    if (!fs.existsSync(templatesDir)) {
      return [];
    }

    return fs.readdirSync(templatesDir)
      .filter(file => file.endsWith('.ejs'))
      .map(file => file.replace('.ejs', ''));
  }

  async generateBulkContractZip(contracts: any[]): Promise<Buffer> {
    console.log(`🔄 Génération ZIP pour ${contracts.length} contrats`);

    try {
      const JSZip = require('jszip');
      const PDFLib = require('pdf-lib');
      const zip = new JSZip();

      const pdfBuffers: { contract: any; buffer: Buffer }[] = [];

      for (const contract of contracts) {
        console.log(`📄 Génération PDF pour contrat ${contract.id} (${contract.reference})`);

        const contractPdf = await this.generateContractPdf(
          contract,
          contract.customer,
          contract.agency
        );

        pdfBuffers.push({ contract, buffer: contractPdf });

        // Nom sécurisé pour le fichier PDF
        const rawRef = contract.reference || contract.numContrat || `contrat_${contract.id}`;
        const safeRef = rawRef.toString().replace(/[/\\?%*:|"<>]/g, '_').trim();
        const filename = `Contrat_${safeRef}.pdf`;

        zip.file(filename, contractPdf);
      }

      // Si plusieurs contrats, générer aussi un fichier PDF fusionné dans le ZIP
      if (pdfBuffers.length > 1) {
        try {
          const mergedPdf = await PDFLib.PDFDocument.create();
          for (const item of pdfBuffers) {
            const pdf = await PDFLib.PDFDocument.load(item.buffer);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page: any) => mergedPdf.addPage(page));
          }
          const mergedBytes = await mergedPdf.save();
          zip.file('00_TOUS_LES_CONTRATS_FUSIONNES.pdf', Buffer.from(mergedBytes));
        } catch (mergeErr) {
          console.warn('⚠️ Impossible d\'ajouter le PDF fusionné dans le ZIP:', mergeErr);
        }
      }

      // Générer l'archive ZIP
      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      console.log(`✅ ZIP généré avec succès (${zipBuffer.length} bytes)`);
      return zipBuffer;

    } catch (error) {
      console.error('❌ Erreur lors de la génération du ZIP de contrats:', error);
      throw error;
    }
  }

  async generateBulkContractPDF(contracts: any[]): Promise<Buffer> {
    console.log(`🔄 Génération PDF groupé pour ${contracts.length} contrats`);

    try {
      const PDFLib = require('pdf-lib');
      
      // Générer chaque contrat individuellement
      const pdfBuffers: Buffer[] = [];
      
      for (const contract of contracts) {
        console.log(`📄 Génération PDF pour contrat ${contract.id} (${contract.reference})`);
        
        // Utiliser la méthode existante pour générer le PDF individuel
        const contractPdf = await this.generateContractPdf(
          contract,
          contract.customer,
          contract.agency
        );
        
        pdfBuffers.push(contractPdf);
      }

      // Fusionner tous les PDFs
      const mergedPdf = await PDFLib.PDFDocument.create();
      
      for (const pdfBuffer of pdfBuffers) {
        const pdf = await PDFLib.PDFDocument.load(pdfBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page: any) => mergedPdf.addPage(page));
      }

      // Générer le PDF final fusionné
      const finalPdfBytes = await mergedPdf.save();
      const finalBuffer = Buffer.from(finalPdfBytes);

      console.log(`✅ PDF groupé généré avec succès (${finalBuffer.length} bytes)`);
      return finalBuffer;

    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF groupé:', error);
      throw error;
    }
  }

  /**
   * Génère un PDF de rapport avec en-tête et pied de page
   * @param templateName Nom du template (sans extension .ejs)
   * @param reportTitle Titre à afficher dans l'en-tête (ex: 'RAPPORT DE PRODUCTION')
   * @param data Données à passer au template
   * @param options Options supplémentaires pour la génération
   */
  async generateReportPdf(
    templateName: string,
    reportTitle: string,
    data: any,
    options: {
      format?: 'A4' | 'A3' | 'Letter';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
    } = {}
  ): Promise<Buffer> {
    const aqaLogo = this.getImageAsBase64('images/aa.png');
    const msfpLogo = this.getImageAsBase64('images/msfp.png');
    const certifLogo = this.getImageAsBase64('images/certif.jpg');

    const templateData = {
      ...data,
      aqaLogo,
      msfpLogo,
      certifLogo,
      generatedAt: new Date().toLocaleDateString('fr-FR'),
      generatedTime: new Date().toLocaleTimeString('fr-FR'),
    };

    return this.generatePdfFromTemplate(templateName, templateData, {
      format: options.format || 'A4',
      margin: options.margin || {
        top: '2.5cm',
        right: '1.2cm',
        bottom: '2.5cm',
        left: '1.2cm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: 'Futura', Arial, sans-serif; width: 100%; padding: 0 1cm; box-sizing: border-box;">
          <table border="0" width="100%" style="border-collapse: collapse;">
            <tr>
              <td width="20%" align="left" style="vertical-align: middle;">
                <img src="${aqaLogo}" alt="AQA Logo" style="max-height: 46px; max-width: 90px; object-fit: contain;" />
              </td>
              <td width="60%" align="center" style="vertical-align: middle;">
                <div style="font-weight: bold; font-size: 13px; color: #1b5e20; text-transform: uppercase; letter-spacing: 0.5px;">${reportTitle}</div>
                <div style="font-size: 9.5px; color: #555; margin-top: 2px;">Assurance Emprunteur - FNDA</div>
              </td>
              <td width="20%" align="right" style="vertical-align: middle;">
                <img src="${msfpLogo}" alt="FNDA Logo" style="max-height: 46px; max-width: 90px; object-fit: contain;" />
              </td>
            </tr>
          </table>
          <div style="border-bottom: 2px solid #33b04a; margin-top: 6px; width: 100%;"></div>
        </div>
      `,
      footerTemplate: `
        <div style="font-family: 'Futura', Arial, sans-serif; width: 100%; padding: 0 1cm; box-sizing: border-box;">
          <div style="border-top: 1.5px solid #33b04a; margin-bottom: 4px; width: 100%;"></div>
          <table border="0" width="100%" style="border-collapse: collapse;">
            <tr>
              <td width="20%" align="left" style="vertical-align: middle;">
                <img src="${certifLogo}" alt="Certification" style="height: 36px; width: auto; object-fit: contain;" />
              </td>
              <td width="60%" align="center" style="vertical-align: middle; font-size: 7.5px; line-height: 1.3; color: #333;">
                <b>L'AFRICAINE VIE BENIN</b>, Société d'Assurance Vie au Capital de 3 000 000 000 F CFA entièrement libéré.<br>
                <b>RCCM</b> : RB/Cot/07 B1518 - <b>INSAE</b> : 2956601349351 - Entreprise régie par le code CIMA.<br>
                <b>Siège social</b>: Lot 19 Pate d'Oie. 01PB 2040. <b>Tél</b>: (00229) 21 30 39 93 - 21 30 39 76.<br>
                <b>Email</b> : africainevie@lafricaineviebenin.com --- <b>www.lafricaineviebenin.com</b>
              </td>
              <td width="20%" align="right" style="vertical-align: middle; font-size: 8.5px; color: #555; font-weight: bold;">
                Page <span class="pageNumber"></span> sur <span class="totalPages"></span>
              </td>
            </tr>
          </table>
        </div>
      `
    });
  }

  /**
   * Génère un PDF sans en-tête ni pied de page pour les états de production
   * @param templateName Nom du template (sans extension .ejs)
   * @param data Données à passer au template
   * @param options Options pour la génération du PDF
   */
  async generatePdfWithoutHeader(
    templateName: string,
    data: any,
    options: {
      format?: 'A4' | 'A3' | 'Letter';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
    } = {}
  ): Promise<Buffer> {
    console.log('📄 [PDF Service] Début generatePdfWithoutHeader');
    console.log('📄 [PDF Service] Template name:', templateName);
    console.log('📄 [PDF Service] Process.cwd():', process.cwd());
    
    const browser = await this.getBrowser();

    try {
      // Chemin vers le template (peut être dans contracts ou production)
      let templatePath = path.join(process.cwd(), 'templates', 'contracts', `${templateName}.ejs`);
      console.log('📄 [PDF Service] Chemin template 1:', templatePath);
      console.log('📄 [PDF Service] Template existe?', fs.existsSync(templatePath));
      
      // Si le template n'existe pas dans contracts, chercher dans production
      if (!fs.existsSync(templatePath)) {
        templatePath = path.join(process.cwd(), 'templates', 'production', `${templateName}.ejs`);
        console.log('📄 [PDF Service] Chemin template 2:', templatePath);
        console.log('📄 [PDF Service] Template existe?', fs.existsSync(templatePath));
      }
      
      // Vérifier que le template existe
      if (!fs.existsSync(templatePath)) {
        console.error('❌ [PDF Service] Template not found:', templatePath);
        throw new Error(`Template not found: ${templatePath}`);
      }

      console.log('✅ [PDF Service] Template trouvé:', templatePath);

      // Lire le template
      const template = fs.readFileSync(templatePath, 'utf8');
      console.log('✅ [PDF Service] Template lu, taille:', template.length, 'caractères');

      // Compiler le template EJS avec les données
      console.log('📄 [PDF Service] Compilation du template EJS...');
      const html = ejs.render(template, data);
      console.log('✅ [PDF Service] Template compilé, HTML généré, taille:', html.length, 'caractères');

      // Créer une nouvelle page
      console.log('📄 [PDF Service] Création d\'une nouvelle page Puppeteer...');
      const page = await browser.newPage();

      // Définir le contenu HTML
      console.log('📄 [PDF Service] Définition du contenu HTML...');
      await page.setContent(html, { waitUntil: 'networkidle0' });
      console.log('✅ [PDF Service] Contenu HTML défini');

      // Configuration du PDF sans en-tête ni pied de page
      const pdfOptions: puppeteer.PDFOptions = {
        format: options.format || 'A4',
        margin: {
          top: options.margin?.top || '1cm',
          right: options.margin?.right || '1cm',
          bottom: options.margin?.bottom || '1cm',
          left: options.margin?.left || '1cm',
        },
        displayHeaderFooter: false, // Pas d'en-tête ni de pied de page
        printBackground: true,
        preferCSSPageSize: true,
      };

      // Générer le PDF
      console.log('📄 [PDF Service] Génération du PDF...');
      const pdfBuffer = await page.pdf(pdfOptions);
      console.log('✅ [PDF Service] PDF généré, taille:', pdfBuffer.length, 'bytes');

      // Fermer la page
      await page.close();
      console.log('✅ [PDF Service] Page fermée');

      return Buffer.from(pdfBuffer);

    } catch (error) {
      console.error('❌ [PDF Service] Erreur lors de la génération du PDF sans en-tête:', error);
      console.error('❌ [PDF Service] Stack trace:', error.stack);
      throw new Error(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  }
}
