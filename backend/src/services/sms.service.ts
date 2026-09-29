import { Injectable } from '@nestjs/common';
import * as https from 'https';

@Injectable()
export class SmsService {
  // Configuration pour LeTexto API (priorité aux variables d'environnement)
  private readonly prodUrl = process.env.SMS_API_URL || 'https://apis.letexto.com';
  private readonly token = process.env.SMS_API_TOKEN || '120e8e03a8a5c98d03ccb072ea8cb42c';
  private readonly from = process.env.SMS_FROM || 'AAVIE';
  private readonly dlrUrl = process.env.SMS_DLR_URL || 'https://lafricaineviebenin.com:4444/dlr';
  private readonly customData = process.env.SMS_CUSTOM_DATA || 'LeSensDeLEngagement';

  private readonly appName = process.env.APP_NAME || 'RENACA Simulateur';

  // Normaliser le numéro de téléphone au format LeTexto (229XXXXXXXX)
  private normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) {
      cleanPhone = cleanPhone.substring(2);
    }
    if (!cleanPhone.startsWith('229')) {
      if (cleanPhone.startsWith('0') && cleanPhone.length !== 10) {
        cleanPhone = cleanPhone.substring(1);
      }
      cleanPhone = '229' + cleanPhone;
    }
    return cleanPhone;
  }

  // Envoyer un SMS via LeTexto API
  async sendSMS(to: string, content: string): Promise<{ success: boolean; message: string; response?: any }> {
    try {
      const sendAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const phoneNumber = this.normalizePhoneNumber(to);
      
      const url = `${this.prodUrl}/v1/messages/send?from=${encodeURIComponent(this.from)}&to=${phoneNumber}&content=${encodeURIComponent(content)}&token=${this.token}&dlrUrl=${encodeURIComponent(this.dlrUrl)}&dlrMethod=GET&customData=${this.customData}&sendAt=${encodeURIComponent(sendAt)}`;
      
      console.log(`📱 Envoi SMS (${this.appName}) vers:`, phoneNumber);
      console.log('📱 Message:', content);
      
      const headers = {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await this.makeHttpsRequest(url, headers);
      
      return {
        success: true,
        message: 'SMS envoyé avec succès',
        response: response
      };
    } catch (error) {
      console.error('❌ Erreur envoi SMS:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi du SMS'
      };
    }
  }

  // Envoyer un code OTP par SMS
  async sendOTPCode(phone: string, code: string, firstName: string = 'Utilisateur'): Promise<{ success: boolean; message: string; response?: any }> {
    const message = `[${this.appName}]\nCode de verification: ${code}\nExpire dans 10 minutes.`;
    return await this.sendSMS(phone, message);
  }


  // Méthode utilitaire pour les requêtes HTTPS avec headers
  private makeHttpsRequest(url: string, headers: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        headers: headers
      };
      
      https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (e) {
            resolve(data);
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

}
