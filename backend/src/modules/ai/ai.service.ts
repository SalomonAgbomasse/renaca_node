import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private primaryModel = 'gemini-2.5-flash';

  constructor(private readonly configService: ConfigService) {
    this.initGemini();
  }

  private initGemini() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey.trim());
        this.logger.log('Google Gemini AI initialized successfully for RENACA.');
      } catch (err: any) {
        this.logger.warn(`Could not initialize Google Gemini AI: ${err.message}`);
      }
    } else {
      this.logger.warn('No GEMINI_API_KEY found in configuration. AI running in simulated demo mode.');
    }
  }

  public isAiConfigured(): boolean {
    if (!this.genAI) {
      this.initGemini();
    }
    return !!this.genAI;
  }

  private getSystemInstruction(): string {
    return `Tu es "AAVIE Digital", le conseiller expert officiel de L'Africaine Vie Bénin SA, intégré sur l'espace simulateur et souscription mis à disposition de notre partenaire RENACA (Réseau National des Caisses d'Épargne et de Crédit du Bénin).

Ton profil et ton attitude :
- Tu représentes fièrement L'Africaine Vie Bénin SA avec une parfaite connaissance de l'ensemble de notre compagnie, de nos offres et de notre site web.
- Ton ton est 100% humain, chaleureux, valorisant, précis et d'un professionnalisme irréprochable.
- Tu ne mentionnes JAMAIS que tu es une intelligence artificielle, une IA, un robot, un modèle ou Gemini.
- Si on te salue simplement ("bonjour", "salut", "bjr"), réponds courtoisement : "Bonjour ! Comment puis-je vous accompagner aujourd'hui sur vos dossiers de souscription ou les offres L'Africaine Vie ?"

Informations sur la Compagnie L'Africaine Vie Bénin SA :
- Site Web officiel : https://lafricaineviebenin.com
- Siège : Cotonou, Bénin.
- Rôle : Acteur de référence et leader de l'assurance vie, prévoyance et épargne au Bénin.

Gamme complète des produits et solutions L'Africaine Vie Bénin :
1. Épargne & Retraite :
   - Épargne Retraite (constitution de capital ou rente viagère)
   - Rente Éducation (garantie du financement des études des enfants)
   - Plan Épargne Projet / Épargne Plus (fructification de capital avec rémunération avantageuse)
2. Prévoyance & Famille :
   - Alafia Obsèques (organisation et prise en charge digne des obsèques familiales)
   - Temporaire Décès & Assurance Mixte (protection financière des proches et du patrimoine)
   - Prévoyance Familiale
3. Assurance Entreprise & Groupe :
   - Assurance Santé Groupe et Prévoyance Collective
   - Indemnités de Fin de Carrière (IFC)
4. Assurance Emprunteur & Partenariats Microfinance :
   - Solutions sur-mesure d'assurance crédit pour les institutions partenaires (RENACA, etc.).

Sur cet espace partenaire RENACA spécifique :
- Le simulateur traite les 2 natures de crédit emprunteur :
  1. A / AMORT (Amortissable) : Capital dégressif suivant le tableau d'amortissement du prêt (garanties Décès & Invalidité/PTIA), avec option Perte d'Emploi (OUI / NON).
  2. C / CONST (Constant) : Capital garanti fixe et invariable sur toute la durée du crédit (garanties Décès & PTIA).
- Types de client gérés : Particulier, Personnel RENACA.
- Structure des primes RENACA : 
  Prime Unique TTC (PUTTC) = Prime Décès (PD) + Prime Complémentaire Perte d'Emploi (PC) + Surprime (SURP) + Frais Médicaux (FM) + Accessoires (ACC).
- Périodicité : Mensuelle (1) par défaut.
- Différé : aucun différé autorisé dans la convention (differe = 0).
- Contrats Hors Convention : Possibilité pour les administrateurs de créer des contrats avec primes manuelles ou avec création simultanée du client.

Si l'utilisateur pose une question sur les autres produits de L'Africaine Vie (épargne, retraite, obsèques, rentes, etc.) ou sur le site web, réponds-lui avec plaisir et précision en lui présentant les offres et en l'invitant à visiter notre site officiel https://lafricaineviebenin.com ou à se rapprocher d'une agence L'Africaine Vie.

Fournis toujours des explications claires, structurées et complètes, avec des phrases toujours achevées et des montants formulés en FCFA. Ne tronque jamais tes phrases.`;
  }

  async generateChatResponse(message: string, history: ChatMessage[] = [], context?: any): Promise<string> {
    const lower = message.trim().toLowerCase();

    // Réponse instantanée pour les salutations basiques et remerciements
    if (['bonjour', 'salut', 'bjr', 'hello', 'bonsoir', 'coucou', 'yo', 'slt', 'bonjour !'].includes(lower)) {
      return `Bonjour ! Comment puis-je vous aider aujourd'hui sur vos dossiers ou vos calculs de souscription RENACA ?`;
    }

    if (['merci', 'merci beaucoup', 'merci bien', 'ok merci', 'super merci', 'thx'].includes(lower)) {
      return `Je vous en prie ! N'hésitez pas si vous avez d'autres questions sur vos dossiers de contrats RENACA.`;
    }

    if (!this.genAI) {
      this.initGemini();
    }

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: this.primaryModel,
          systemInstruction: this.getSystemInstruction(),
          generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.3,
          },
        });

        const chat = model.startChat({
          history: history.slice(-6).map(h => ({
            role: h.role,
            parts: [{ text: h.text }],
          })),
        });

        let prompt = message;
        if (context) {
          prompt = `[Données dossier en cours : ${JSON.stringify(context)}]\n\nQuestion : ${message}`;
        }

        const result = await chat.sendMessage(prompt);
        return result.response.text();
      } catch (err: any) {
        this.logger.warn(`Gemini call failed: ${err.message}. Using fallback...`);
        return this.generateSimulatedResponse(message, context);
      }
    }

    return this.generateSimulatedResponse(message, context);
  }

  async summarizeContract(contractData: any): Promise<string> {
    const prompt = `Fais une synthèse claire et concise des éléments essentiels de ce dossier de contrat RENACA (assuré, capital, durée, nature, primes) :\n${JSON.stringify(contractData, null, 2)}`;
    return this.generateChatResponse(prompt);
  }

  private generateSimulatedResponse(message: string, context?: any): string {
    const lower = message.trim().toLowerCase();

    if (['bonjour', 'salut', 'bjr', 'hello', 'bonsoir', 'coucou', 'yo'].includes(lower)) {
      return `Bonjour ! Comment puis-je vous aider aujourd'hui sur vos dossiers ou vos calculs de souscription RENACA ?`;
    }

    if (lower.includes('credit') || lower.includes('type') || lower.includes('nature') || lower.includes('produit')) {
      return `Sur la plateforme RENACA, nous gérons 2 natures de crédit :\n\n1. **A / AMORT (Amortissable)** : Capital dégressif suivant le tableau d'amortissement du prêt, avec Décès & PTIA, et option Perte d'Emploi.\n2. **C / CONST (Constant)** : Capital fixe garanti sur toute la durée du crédit avec garanties Décès & PTIA.`;
    }

    if (lower.includes('prime') || lower.includes('calcul') || lower.includes('ttc') || lower.includes('puttc')) {
      return `Le calcul de la prime globale TTC RENACA se fait selon la formule :\n\n**Prime Unique TTC (PUTTC)** = Prime Décès (PD) + Prime Complémentaire Perte d'Emploi (PC) + Surprime (SURP) + Frais Médicaux (FM) + Accessoires (ACC).`;
    }

    if (lower.includes('perte') || lower.includes('emploi')) {
      return `La garantie **Perte d'Emploi** est une option activable sur les crédits **Amortissables (AMORT)**. Lorsqu'elle est activée (OUI), une Prime Complémentaire (PC) est calculée et intégrée dans la prime totale TTC.`;
    }

    if (context && context.contrat) {
      return `Voici les informations du contrat réf. **${context.contrat.reference || 'N/A'}** :\n- Capital : ${context.contrat.capital || 0} FCFA\n- Durée : ${context.contrat.duration || 0} mois\n- Taux : ${context.contrat.taux || 0} %\n\nTous les paramètres semblent bien renseignés.`;
    }

    return `Bonjour, je suis à votre disposition pour toute question sur la gestion de vos contrats RENACA, les natures de crédits (Amortissable, Constant), le calcul des primes ou les garanties d'assurance L'Africaine Vie. En quoi puis-je vous renseigner ?`;
  }
}
