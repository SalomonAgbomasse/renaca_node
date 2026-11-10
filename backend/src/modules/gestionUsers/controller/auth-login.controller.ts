import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { AuthExtendedService } from '../service/auth-extended.service';

@Controller('auth/login')
export class AuthLoginController {
  constructor(private readonly authExtendedService: AuthExtendedService) {}

  // Étape 1: Vérifier les identifiants et envoyer l'OTP par email
  @Post('send-otp')
  async sendOTP(@Body() body: { login: string; password?: string }) {
    try {
      // Si pas de mot de passe, c'est un renvoi d'OTP
      if (!body.password) {
        const result = await this.authExtendedService.resendOTPEmail(body.login);
        return {
          success: result.success,
          message: result.message,
          user: result.user
        };
      }
      
      // Sinon, c'est une nouvelle demande avec mot de passe
      const result = await this.authExtendedService.sendOTPAfterLogin(
        body.login, 
        body.password
      );
      
      return {
        success: result.success,
        message: result.message,
        user: result.user
      };
    } catch (error) {
      console.error('Erreur send-otp:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Étape 1: Vérifier les identifiants et envoyer l'OTP par SMS
  @Post('send-otp-sms')
  async sendOTPSMS(@Body() body: { login: string; password?: string }) {
    try {
      // Si pas de mot de passe, c'est un renvoi d'OTP
      if (!body.password) {
        const result = await this.authExtendedService.resendOTPSMS(body.login);
        return {
          success: result.success,
          message: result.message,
          user: result.user
        };
      }
      
      // Sinon, c'est une nouvelle demande avec mot de passe
      const result = await this.authExtendedService.sendOTPAfterLoginSMS(
        body.login, 
        body.password
      );
      
      return {
        success: result.success,
        message: result.message,
        user: result.user
      };
    } catch (error) {
      console.error('Erreur send-otp-sms:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Étape 2: Vérifier l'OTP et finaliser la connexion
  @Post('verify-otp')
  async verifyOTP(@Body() body: { login: string; otpCode: string }) {
    try {
      const result = await this.authExtendedService.verifyOTPAndLogin(
        body.login, 
        body.otpCode
      );
      
      return {
        success: result.success,
        message: result.message,
        user: result.user,
        token: result.token
      };
    } catch (error) {
      console.error('Erreur verify-otp:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // Vérifier si un utilisateur a la 2FA activée (sans se connecter)
  @Post('check-2fa-status')
  async check2FAStatus(@Body() body: { login: string }) {
    try {
      const result = await this.authExtendedService.check2FAStatus(body.login);
      return result;
    } catch (error) {
      console.error('Erreur check-2fa-status:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }
}
